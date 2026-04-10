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
  category?: string; // from "Categoria" column if present
}

export interface XlsxParseResult {
  transactions: XlsxTransaction[];
  sourceSheet: string;
  currentBalance?: number; // parsed from metadata rows ("Saldo atual", "Saldo", etc)
}

interface ColumnMap {
  date: number;
  description: number;
  amount: number;
  debit: number;
  credit: number;
  category: number;
  transactionType: number;
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
): { headerIdx: number; colMap: ColumnMap; debugRows: string[] } {
  const debugRows: string[] = [];

  for (let i = 0; i < Math.min(rows.length, 30); i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    // Capture all non-empty rows for debug (up to 8)
    const nonEmpty = row
      .map((c) => String(c ?? "").trim())
      .filter(Boolean);
    if (nonEmpty.length > 0 && debugRows.length < 8) {
      debugRows.push(`row${i}: ${nonEmpty.join(" | ")}`);
    }

    if (row.length < 3) continue;

    const map: ColumnMap = {
      date: -1,
      description: -1,
      amount: -1,
      debit: -1,
      credit: -1,
      category: -1,
      transactionType: -1,
    };

    for (let j = 0; j < row.length; j++) {
      const cell = normalize(String(row[j] ?? ""));
      if (!cell) continue;

      // Check more-specific keywords BEFORE general ones (categoria before valor)
      if (map.date < 0 && (cell.startsWith("data") || cell === "dt" || cell.includes("data hora"))) {
        map.date = j;
      } else if (map.category < 0 && cell.includes("categoria")) {
        map.category = j;
      } else if (
        map.transactionType < 0 &&
        (cell === "transacao" || cell === "tipo" || cell === "tipo transacao" || cell === "tipo de transacao")
      ) {
        map.transactionType = j;
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
      } else if (map.debit < 0 && (cell.includes("debito") || cell === "saida" || cell === "saidas")) {
        map.debit = j;
      } else if (map.credit < 0 && (cell.includes("credito") || cell === "entrada" || cell === "entradas")) {
        map.credit = j;
      } else if (
        map.amount < 0 &&
        (cell.includes("valor") || cell === "montante" || cell === "amount" || cell === "quantia")
      ) {
        map.amount = j;
      }
    }

    const hasDate = map.date >= 0;
    const hasDesc = map.description >= 0 || map.transactionType >= 0;
    const hasAmount = map.amount >= 0 || (map.debit >= 0 || map.credit >= 0);
    if (hasDate && hasDesc && hasAmount) {
      return { headerIdx: i, colMap: map, debugRows };
    }
  }

  return {
    headerIdx: -1,
    colMap: {
      date: -1,
      description: -1,
      amount: -1,
      debit: -1,
      credit: -1,
      category: -1,
      transactionType: -1,
    },
    debugRows,
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
  // dd/mm/yyyy with optional time suffix: "10/04/2026" or "10/04/2026 19:35:41"
  const brMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:\s|$)/);
  if (brMatch) {
    const yyyy = brMatch[3].length === 2 ? `20${brMatch[3]}` : brMatch[3];
    return `${yyyy}-${brMatch[2].padStart(2, "0")}-${brMatch[1].padStart(2, "0")}`;
  }
  // yyyy-mm-dd with optional time suffix
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }
  // Last resort: parse as JS Date, but only if no "/" (to avoid US MM/DD ambiguity)
  if (!str.includes("/")) {
    const jsDate = new Date(str);
    if (!isNaN(jsDate.getTime())) {
      const yyyy = jsDate.getFullYear();
      const mm = String(jsDate.getMonth() + 1).padStart(2, "0");
      const dd = String(jsDate.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findCurrentBalance(rows: any[][], headerIdx: number): number | undefined {
  // Scan rows before the header for a "Saldo atual" / "Saldo" label followed
  // by a numeric cell. BTG puts this in row 0.
  const maxRow = Math.min(headerIdx, 15);
  for (let i = 0; i < maxRow; i++) {
    const row = rows[i];
    if (!row) continue;
    for (let j = 0; j < row.length; j++) {
      const cell = normalize(String(row[j] ?? ""));
      if (cell.includes("saldo atual") || cell === "saldo" || cell.includes("saldo disponivel")) {
        // Next non-empty cell to the right should be the value
        for (let k = j + 1; k < row.length; k++) {
          const raw = row[k];
          if (raw == null || raw === "") continue;
          const parsed = parseAmount(raw);
          if (Number.isFinite(parsed)) return parsed;
          break;
        }
      }
    }
  }
  return undefined;
}

export async function parseXlsx(file: File): Promise<XlsxParseResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });

  const allDebug: string[] = [];
  const sheetNames = workbook.SheetNames;

  for (const sheetName of sheetNames) {
    const sheet = workbook.Sheets[sheetName];
    // deno-lint-ignore no-explicit-any
    const rows = XLSX.utils.sheet_to_json<any[]>(sheet, {
      header: 1,
      blankrows: false,
      raw: true,
      defval: "", // keep empty cells so row.length reflects the full used range
    });

    const { headerIdx, colMap, debugRows } = findHeaderRow(rows);
    allDebug.push(`[${sheetName}] ${debugRows.join(" // ") || "(vazio)"}`);
    if (headerIdx < 0) continue;

    const currentBalance = findCurrentBalance(rows, headerIdx);

    const transactions: XlsxTransaction[] = [];
    for (let i = headerIdx + 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const date = parseDate(row[colMap.date]);
      if (!date) continue;

      const rawDescription = String(row[colMap.description] ?? "").trim();
      const rawType =
        colMap.transactionType >= 0
          ? String(row[colMap.transactionType] ?? "").trim()
          : "";
      // Combine "Transacao" + "Descricao" if both exist (e.g. BTG)
      let description = rawDescription;
      if (rawType && rawDescription && rawType !== rawDescription) {
        description = `${rawType} - ${rawDescription}`;
      } else if (rawType && !rawDescription) {
        description = rawType;
      }
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

      const category =
        colMap.category >= 0
          ? String(row[colMap.category] ?? "").trim() || undefined
          : undefined;

      transactions.push({ date, description, amount, category });
    }

    if (transactions.length > 0) {
      return { transactions, sourceSheet: sheetName, currentBalance };
    }
  }

  throw new Error(
    `Nao foi possivel detectar transacoes no XLSX. Conteudo das primeiras linhas: ${allDebug.join(" ||| ") || "(nenhum)"}`,
  );
}
