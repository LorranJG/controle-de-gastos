const crypto = require("node:crypto");
const { requirePassword } = require("./_lib/auth");
const { parseStatement } = require("./_lib/statements");
const { supabaseFetch, normalizeTransactionRecord } = require("./_lib/supabase");

module.exports = async function handler(req, res) {
  if (!requirePassword(req, res)) return;

  if (req.method !== "POST") {
    res.status(405).json({ error: "Metodo nao permitido." });
    return;
  }

  try {
    const parsed = parseStatement(req.body.filename || "", req.body.content || "");
    if (!parsed.length) {
      res.status(200).json({ transactions: [], total: 0, duplicates: 0 });
      return;
    }

    const existing = await supabaseFetch(`/transactions?select=id&id=in.(${parsed.map((item) => item.id).join(",")})`);
    const existingIds = new Set((existing || []).map((item) => item.id));
    const importBatchId = crypto.randomUUID();
    const defaultEnteredBy = String(req.body.entered_by || "").trim();
    const defaultPaymentMethod = String(req.body.payment_method || "").trim();

    const transactions = parsed.map((transaction) => normalizeTransactionRecord({
      ...transaction,
      entered_by: transaction.entered_by || defaultEnteredBy,
      payment_method: transaction.payment_method || defaultPaymentMethod,
      import_batch_id: importBatchId,
      source: "import",
      duplicate: existingIds.has(transaction.id),
    }));

    res.status(200).json({
      transactions,
      total: transactions.length,
      duplicates: transactions.filter((transaction) => transaction.duplicate).length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
