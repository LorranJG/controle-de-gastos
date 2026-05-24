const crypto = require("node:crypto");
const { RULES } = require("./constants");

function parseStatement(filename, content) {
  return filename.toLowerCase().endsWith(".ofx") ? parseOfx(content) : parseCsv(content);
}

function parseCsv(content) {
  const rows = splitCsv(content).filter((row) => row.some(Boolean));
  if (!rows.length) return [];

  const headerIndex = findHeaderRow(rows);
  const header = rows[headerIndex].map(normalizeHeader);
  const hasHeader = header.some((cell) => ["data", "date", "valor", "amount", "descricao", "description", "historico"].includes(cell));
  const dataRows = hasHeader ? rows.slice(headerIndex + 1) : rows;
  const indexes = hasHeader ? mapCsvColumns(header) : guessCsvColumns(rows[0]);

  return dataRows.map((row) => normalizeCsvTransaction(row, indexes)).filter(Boolean);
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
    date: findIndex(header, ["data", "date", "dt", "lancamento", "data lancamento"]),
    description: findIndex(header, ["descricao", "description", "historico", "memo", "estabelecimento"]),
    amount: findIndex(header, ["valor", "amount", "value", "vlr", "montante"]),
    income: findIndex(header, ["entrada(r$)", "entrada", "credito", "creditos"]),
    expense: findIndex(header, ["saida(r$)", "saida", "debito", "debitos"]),
    title: findIndex(header, ["titulo", "title"]),
  };
}

function guessCsvColumns(row) {
  const date = row.findIndex((cell) => parseDate(cell));
  const amount = row.findIndex((cell) => Number.isFinite(parseAmount(cell)));
  const description = row.findIndex((_, index) => index !== date && index !== amount);
  return { date, amount, description, income: -1, expense: -1, title: description };
}

function findIndex(header, names) {
  const index = header.findIndex((cell) => names.includes(cell));
  return index >= 0 ? index : -1;
}

function findHeaderRow(rows) {
  const index = rows.findIndex((row) => {
    const header = row.map(normalizeHeader);
    const hasDate = header.some((cell) => ["data", "date", "dt", "data lancamento"].includes(cell));
    const hasValue = header.some((cell) => ["valor", "amount", "entrada(r$)", "saida(r$)", "entrada", "saida"].includes(cell));
    return hasDate && hasValue;
  });

  return index >= 0 ? index : 0;
}

function normalizeCsvTransaction(row, indexes) {
  const amount = amountFromCsvRow(row, indexes);
  const description = descriptionFromCsvRow(row, indexes);

  return normalizeTransaction({
    date: readCell(row, indexes.date),
    description,
    amount,
    source: "import",
  });
}

function amountFromCsvRow(row, indexes) {
  const income = parseAmount(readCell(row, indexes.income));
  const expense = parseAmount(readCell(row, indexes.expense));

  if (Number.isFinite(income) || Number.isFinite(expense)) {
    return (Number.isFinite(income) ? income : 0) - (Number.isFinite(expense) ? expense : 0);
  }

  return readCell(row, indexes.amount);
}

function descriptionFromCsvRow(row, indexes) {
  const title = indexes.title !== indexes.description ? cleanText(readCell(row, indexes.title)) : "";
  const description = cleanText(readCell(row, indexes.description));
  return [title, description].filter(Boolean).join(" - ");
}

function readCell(row, index) {
  return index >= 0 ? row[index] : "";
}

function parseOfx(text) {
  const blocks = text.match(/<STMTTRN>[\s\S]*?(?=<STMTTRN>|<\/BANKTRANLIST>|$)/gi) || [];
  return blocks.map((block) => normalizeTransaction({
    date: readOfxTag(block, "DTPOSTED"),
    description: readOfxTag(block, "MEMO") || readOfxTag(block, "NAME") || readOfxTag(block, "FITID"),
    amount: readOfxTag(block, "TRNAMT"),
    source: "import",
  })).filter(Boolean);
}

function readOfxTag(block, tag) {
  const match = block.match(new RegExp(`<${tag}>([^<\\r\\n]+)`, "i"));
  return match ? match[1].trim() : "";
}

function normalizeTransaction(input) {
  const date = parseDate(input.date);
  const rawAmount = parseAmount(input.amount);
  const movementType = input.movement_type || input.movementType || inferMovementType(rawAmount);
  const amount = normalizeAmountByType(rawAmount, movementType);
  const description = cleanText(input.description || "Sem descricao");
  const category = cleanText(input.category || suggestCategory(description, amount));

  if (!date || !Number.isFinite(amount) || !movementType) return null;

  return {
    id: input.id || makeId(date, description, amount),
    date,
    description,
    amount,
    category: category || "Outros",
    movement_type: movementType,
    payment_method: cleanText(input.payment_method || input.paymentMethod || ""),
    entered_by: cleanText(input.entered_by || input.enteredBy || ""),
    source: input.source || "manual",
    import_batch_id: input.import_batch_id || input.importBatchId || "",
  };
}

function inferMovementType(amount) {
  if (!Number.isFinite(amount)) return "";
  return amount >= 0 ? "income" : "expense";
}

function normalizeAmountByType(amount, movementType) {
  if (!Number.isFinite(amount)) return Number.NaN;
  const absolute = Math.abs(amount);
  return movementType === "expense" ? -absolute : absolute;
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
  return cleanText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
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

module.exports = {
  inferMovementType,
  normalizeAmountByType,
  normalizeTransaction,
  parseStatement,
};
