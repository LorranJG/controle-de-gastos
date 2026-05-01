const crypto = require("node:crypto");
const { CATEGORIES, RULES } = require("./constants");

function parseStatement(filename, content) {
  return filename.toLowerCase().endsWith(".ofx") ? parseOfx(content) : parseCsv(content);
}

function parseCsv(content) {
  const rows = splitCsv(content).filter((row) => row.some(Boolean));
  if (!rows.length) return [];

  const header = rows[0].map(normalizeHeader);
  const hasHeader = header.some((cell) => ["data", "date", "valor", "amount", "descricao", "description", "historico"].includes(cell));
  const dataRows = hasHeader ? rows.slice(1) : rows;
  const indexes = hasHeader ? mapCsvColumns(header) : guessCsvColumns(rows[0]);

  return dataRows.map((row) => normalizeTransaction({
    date: row[indexes.date],
    description: row[indexes.description],
    amount: row[indexes.amount],
  })).filter(Boolean);
}

function splitCsv(text) {
  const separator = (text.match(/;/g) || []).length >= (text.match(/,/g) || []).length ? ";" : ",";
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (const char of text.replace(/\r/g, "")) {
    if (char === '"') quoted = !quoted;
    else if (char === separator && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if (char === "\n" && !quoted) {
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  if (cell || row.length) {
    row.push(cell.trim());
    rows.push(row);
  }

  return rows;
}

function mapCsvColumns(header) {
  return {
    date: findIndex(header, ["data", "date", "dt", "lancamento", "lançamento"]),
    description: findIndex(header, ["descricao", "descrição", "description", "historico", "histórico", "memo", "estabelecimento"]),
    amount: findIndex(header, ["valor", "amount", "value", "vlr", "montante"]),
  };
}

function guessCsvColumns(row) {
  const date = row.findIndex((cell) => parseDate(cell));
  const amount = row.findIndex((cell) => Number.isFinite(parseAmount(cell)));
  const description = row.findIndex((_, index) => index !== date && index !== amount);
  return { date, amount, description };
}

function findIndex(header, names) {
  const index = header.findIndex((cell) => names.includes(cell));
  return index >= 0 ? index : 0;
}

function parseOfx(text) {
  const blocks = text.match(/<STMTTRN>[\s\S]*?(?=<STMTTRN>|<\/BANKTRANLIST>|$)/gi) || [];
  return blocks.map((block) => normalizeTransaction({
    date: readOfxTag(block, "DTPOSTED"),
    description: readOfxTag(block, "MEMO") || readOfxTag(block, "NAME") || readOfxTag(block, "FITID"),
    amount: readOfxTag(block, "TRNAMT"),
  })).filter(Boolean);
}

function readOfxTag(block, tag) {
  const match = block.match(new RegExp(`<${tag}>([^<\\r\\n]+)`, "i"));
  return match ? match[1].trim() : "";
}

function normalizeTransaction(input) {
  const date = parseDate(input.date);
  const amount = parseAmount(input.amount);
  const description = cleanText(input.description || "Sem descrição");
  const category = input.category || suggestCategory(description, amount);

  if (!date || !Number.isFinite(amount)) return null;

  return {
    id: makeId(date, description, amount),
    date,
    description,
    amount,
    category: CATEGORIES.includes(category) ? category : "Outros",
  };
}

function parseDate(value = "") {
  const raw = String(value).trim();
  const ofx = raw.match(/^(\d{4})(\d{2})(\d{2})/);
  if (ofx) return `${ofx[1]}-${ofx[2]}-${ofx[3]}`;

  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const br = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (br) {
    const year = br[3].length === 2 ? `20${br[3]}` : br[3];
    return `${year}-${br[2].padStart(2, "0")}-${br[1].padStart(2, "0")}`;
  }

  return "";
}

function parseAmount(value = "") {
  const raw = String(value).replace(/[R$\s]/g, "").replace(/\((.+)\)/, "-$1").trim();
  if (!raw) return Number.NaN;
  return Number(raw.includes(",") ? raw.replace(/\./g, "").replace(",", ".") : raw);
}

function cleanText(value) {
  return String(value).replace(/^"|"$/g, "").replace(/\s+/g, " ").trim();
}

function normalizeHeader(value) {
  return cleanText(value).toLowerCase();
}

function suggestCategory(description, amount) {
  const text = description.toLowerCase();
  const match = RULES.find((rule) => rule.words.some((word) => text.includes(word)));
  if (match) return match.category;
  return amount > 0 ? "Receitas" : "Outros";
}

function makeId(date, description, amount) {
  return crypto.createHash("sha1").update(`${date}|${description.toLowerCase()}|${amount.toFixed(2)}`).digest("hex").slice(0, 16);
}

module.exports = { normalizeTransaction, parseStatement };
