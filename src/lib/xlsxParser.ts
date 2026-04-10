// XLSX parser for Brazilian bank statements (BTG, etc.)
// Auto-detects column headers by matching common Portuguese patterns.
//
// Expected columns (any order, any case):
//  - Data / Dt / Data mov...        -> transaction date
//  - Descricao / Historico / ...    -> transaction description
//  - Valor / Montante / Amount      -> signed amount
// OR separate:
//  - Debito / Saida                 -> debit column
//  - Credito / Entrada              -> credit column

import * as XLSX from "xlsx";

export interface XlsxTransaction {
  date: string; // YYYY-MM-DD
  description: string;
  amount: number; // signed
}

export interface XlsxParseResult {
  transactions: XlsxTransaction[];
  sourceSheet: string;
}

interface ColumnMap {
  date: number;
  description: number;
  amount: number;
  debit: number;
  credit: number;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .trim();
}

function findHeaderRow(
  // deno-lint-ignore no-explicit-any
  rows: any[][],
): { headerIdx: number; colMap: ColumnMap } {
  for (let i = 0; i < Math.min(rows.length, 30); i++) {
    const row = rows[i];
    if (!row || row.length < 3) continue;

    const map: ColumnMap = {
      date: -1,
      description: -1,
      amount: -1,
      debit: -1,
      credit: -1,
    };

    for (let j = 0; j < row.length; j++) {
      const cell = normalize(String(row[j] ?? ""));
      if (!cell) continue;

      if (map.date < 0 && (cell.startsWith("data") || cell === "dt" || cell.includes("data mov"))) {
        map.date = j;
      } else if (
        map.description < 0 &&
        (cell.includes("descri") ||
          cell.includes("histor") ||
          cell.includes("lancamento") ||
          cell === "memo" ||
          cell.includes("operac") ||
          cell.includes("movimenta"))
      ) {
        map.description = j;
      } else if (
        map.amount < 0 &&
        (cell === "valor" || cell === "montante" || cell === "amount" || cell === "valor (r$)")
      ) {
        map.amount = j;
      } else if (map.debit < 0 && (cell.includes("debito") || cell === "saida" || cell === "saidas")) {
        map.debit = j;
      } else if (map.credit < 0 && (cell.includes("credito") || cell === "entrada" || cell === "entradas")) {
        map.credit = j;
      }
    }

    const hasDateAndDesc = map.date >= 0 && map.description >= 0;
    const hasAmount = map.amount >= 0 || (map.debit >= 0 || map.credit >= 0);
    if (hasDateAndDesc && hasAmount) {
      return { headerIdx: i, colMap: map };
    }
  }

  return {
    headerIdx: -1,
    colMap: { date: -1, description: -1, amount: -1, debit: -1, credit: -1 },
  };
}

// deno-lint-ignore no-explicit-any
function parseDate(value: any): string {
  if (value == null || value === "") return "";

  if (value instanceof Date) {
    const yyyy = value.getFullYear();
    const mm = String(value.getMonth() + 1).padStart(2, "0");
    const dd = String(value.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  if (typeof value === "number") {
    // Excel serial date
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      return `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`;
    }
  }

  const str = String(value).trim();
  // dd/mm/yyyy
  const brMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (brMatch) {
    const yyyy = brMatch[3].length === 2 ? `20${brMatch[3]}` : brMatch[3];
    return `${yyyy}-${brMatch[2].padStart(2, "0")}-${brMatch[1].padStart(2, "0")}`;
  }
  // yyyy-mm-dd
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  return "";
}

// deno-lint-ignore no-explicit-any
function parseAmount(value: any): number {
  if (value == null || value === "") return NaN;
  if (typeof value === "number") return value;

  const str = String(value).trim();
  if (!str) return NaN;

  // Handles: "R$ 1.234,56", "-1.234,56", "1234,56", "1,234.56", etc.
  // Strategy: remove currency/whitespace, then detect which is decimal vs thousand.
  const cleaned = str.replace(/R\$/gi, "").replace(/\s/g, "").trim();
  const isNegativeParen = /^\(.+\)$/.test(cleaned);
  const withoutParen = cleaned.replace(/[()]/g, "");

  // If has both . and ,: last one is decimal
  let normalized = withoutParen;
  if (normalized.includes(",") && normalized.includes(".")) {
    if (normalized.lastIndexOf(",") > normalized.lastIndexOf(".")) {
      normalized = normalized.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = normalized.replace(/,/g, "");
    }
  } else if (normalized.includes(",")) {
    normalized = normalized.replace(",", ".");
  }

  const num = Number(normalized);
  if (!Number.isFinite(num)) return NaN;
  return isNegativeParen ? -num : num;
}

export async function parseXlsx(file: File): Promise<XlsxParseResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    // deno-lint-ignore no-explicit-any
    const rows = XLSX.utils.sheet_to_json<any[]>(sheet, {
      header: 1,
      blankrows: false,
      raw: true,
    });

    const { headerIdx, colMap } = findHeaderRow(rows);
    if (headerIdx < 0) continue;

    const transactions: XlsxTransaction[] = [];
    for (let i = headerIdx + 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const date = parseDate(row[colMap.date]);
      if (!date) continue;

      const description = String(row[colMap.description] ?? "").trim();
      if (!description) continue;

      let amount: number;
      if (colMap.amount >= 0) {
        amount = parseAmount(row[colMap.amount]);
      } else {
        const debit = colMap.debit >= 0 ? parseAmount(row[colMap.debit]) : 0;
        const credit = colMap.credit >= 0 ? parseAmount(row[colMap.credit]) : 0;
        amount =
          (Number.isFinite(credit) ? credit : 0) -
          (Number.isFinite(debit) ? Math.abs(debit) : 0);
      }

      if (!Number.isFinite(amount) || amount === 0) continue;

      transactions.push({ date, description, amount });
    }

    if (transactions.length > 0) {
      return { transactions, sourceSheet: sheetName };
    }
  }

  throw new Error(
    "Nao foi possivel detectar transacoes no XLSX. Verifique se o arquivo tem colunas de Data, Descricao e Valor (ou Debito/Credito).",
  );
}
