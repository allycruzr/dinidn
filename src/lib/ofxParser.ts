// Minimal OFX 1.x (SGML) parser for Brazilian banks.
// No external dependencies — converts SGML to pseudo-XML then walks with DOMParser.
//
// Supports:
// - Bank accounts: <BANKMSGSRSV1> / <STMTRS> / <BANKACCTFROM>
// - Credit cards: <CREDITCARDMSGSRSV1> / <CCSTMTRS> / <CCACCTFROM>
// - Multiple statements per file
//
// Does NOT support OFX 2.x (XML-native). If you hit that, just strip the XML
// header and feed the body in — it may work by accident.

export type OfxAccountType = "CHECKING" | "SAVINGS" | "CREDIT";

export interface OfxAccount {
  bankId: string;
  branchId?: string;
  accountId: string;
  type: OfxAccountType;
  currency: string;
  balance?: number;
  balanceDate?: string;
}

export interface OfxTransaction {
  fitId: string;
  type: "CREDIT" | "DEBIT";
  date: string; // YYYY-MM-DD
  amount: number; // signed
  description: string;
}

export interface OfxStatement {
  account: OfxAccount;
  transactions: OfxTransaction[];
}

export interface OfxParseResult {
  statements: OfxStatement[];
}

function escapeXml(s: string): string {
  return s
    .replace(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;)/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Converts SGML-style OFX (leaf tags without closing tags) to valid XML.
 * Leaf tags look like `<TAG>value` with text until end-of-line.
 * Container tags like `<STMTTRN>` stay as-is and have matching `</STMTTRN>`.
 *
 * Safe to run on OFX 2.x (XML-native) content: if a tag already has a closing
 * tag right after the value, the conversion becomes a no-op for that tag.
 */
function sgmlToXml(sgml: string): string {
  return sgml.replace(
    /<([A-Z][A-Z0-9.]*)>([^<\r\n]+)/g,
    (match: string, tag: string, value: string, offset: number) => {
      const trimmed = value.trim();
      if (!trimmed) return match;

      // If the original already has </TAG> immediately after, leave untouched
      const closingTag = `</${tag}>`;
      const after = sgml.substring(offset + match.length, offset + match.length + closingTag.length);
      if (after === closingTag) {
        return match;
      }

      return `<${tag}>${escapeXml(trimmed)}</${tag}>`;
    },
  );
}

// Parse an OFX date (YYYYMMDDHHMMSS with optional timezone, or YYYYMMDD) to YYYY-MM-DD.
function parseOfxDate(raw: string | null | undefined): string {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length !== 8) return "";
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
}

function textOf(parent: Element | null, tag: string): string | null {
  if (!parent) return null;
  const el = parent.getElementsByTagName(tag)[0];
  return el?.textContent?.trim() ?? null;
}

function mapAccountType(ofxType: string | null): OfxAccountType {
  if (!ofxType) return "CHECKING";
  const upper = ofxType.toUpperCase();
  if (upper === "SAVINGS") return "SAVINGS";
  if (upper === "CREDITCARD" || upper === "CREDIT") return "CREDIT";
  return "CHECKING";
}

function isOfxXml(content: string): boolean {
  return /<\?xml/i.test(content) || /<\?OFX/i.test(content);
}

export function parseOfx(content: string): OfxParseResult {
  // Strip everything before <OFX>
  const ofxStart = content.indexOf("<OFX>");
  if (ofxStart < 0) {
    throw new Error("Arquivo OFX invalido: tag <OFX> nao encontrada");
  }
  const body = content.slice(ofxStart);
  // OFX 2.x is already valid XML; OFX 1.x SGML needs conversion.
  // The SGML converter is also safe on XML content (checks for existing closing tag).
  const xml = isOfxXml(content) ? body : sgmlToXml(body);

  const doc = new DOMParser().parseFromString(xml, "text/xml");
  const parserError = doc.getElementsByTagName("parsererror")[0];
  if (parserError) {
    throw new Error("Erro ao parsear OFX: " + (parserError.textContent ?? ""));
  }

  const statements: OfxStatement[] = [];

  // Bank statements: BANKMSGSRSV1 > STMTTRNRS > STMTRS
  const bankStatements = Array.from(doc.getElementsByTagName("STMTRS"));
  for (const stmtrs of bankStatements) {
    const bankacct = stmtrs.getElementsByTagName("BANKACCTFROM")[0];
    if (!bankacct) continue;

    const account: OfxAccount = {
      bankId: textOf(bankacct, "BANKID") ?? "",
      branchId: textOf(bankacct, "BRANCHID") ?? undefined,
      accountId: textOf(bankacct, "ACCTID") ?? "",
      type: mapAccountType(textOf(bankacct, "ACCTTYPE")),
      currency: textOf(stmtrs, "CURDEF") ?? "BRL",
    };

    const ledgerBal = stmtrs.getElementsByTagName("LEDGERBAL")[0];
    if (ledgerBal) {
      const balAmt = textOf(ledgerBal, "BALAMT");
      const dtAsOf = textOf(ledgerBal, "DTASOF");
      if (balAmt) account.balance = Number(balAmt);
      if (dtAsOf) account.balanceDate = parseOfxDate(dtAsOf);
    }

    const transactions = parseTransactions(stmtrs);
    statements.push({ account, transactions });
  }

  // Credit card statements: CREDITCARDMSGSRSV1 > CCSTMTTRNRS > CCSTMTRS
  const ccStatements = Array.from(doc.getElementsByTagName("CCSTMTRS"));
  for (const ccstmtrs of ccStatements) {
    const ccacct = ccstmtrs.getElementsByTagName("CCACCTFROM")[0];
    if (!ccacct) continue;

    const account: OfxAccount = {
      bankId: textOf(ccacct, "BANKID") ?? "CC",
      accountId: textOf(ccacct, "ACCTID") ?? "",
      type: "CREDIT",
      currency: textOf(ccstmtrs, "CURDEF") ?? "BRL",
    };

    const ledgerBal = ccstmtrs.getElementsByTagName("LEDGERBAL")[0];
    if (ledgerBal) {
      const balAmt = textOf(ledgerBal, "BALAMT");
      const dtAsOf = textOf(ledgerBal, "DTASOF");
      if (balAmt) account.balance = Number(balAmt);
      if (dtAsOf) account.balanceDate = parseOfxDate(dtAsOf);
    }

    const transactions = parseTransactions(ccstmtrs);
    statements.push({ account, transactions });
  }

  return { statements };
}

function parseTransactions(parent: Element): OfxTransaction[] {
  const txs: OfxTransaction[] = [];
  const elements = Array.from(parent.getElementsByTagName("STMTTRN"));
  for (const el of elements) {
    const trnType = textOf(el, "TRNTYPE") ?? "";
    const dtPosted = textOf(el, "DTPOSTED") ?? "";
    const trnAmt = textOf(el, "TRNAMT") ?? "0";
    const fitId = textOf(el, "FITID") ?? "";
    const memo = textOf(el, "MEMO") ?? textOf(el, "NAME") ?? "";

    if (!fitId) continue;
    const amount = Number(trnAmt);
    if (!Number.isFinite(amount)) continue;

    txs.push({
      fitId,
      type: amount >= 0 ? "CREDIT" : "DEBIT",
      date: parseOfxDate(dtPosted),
      amount,
      description: memo,
    });
  }
  return txs;
}
