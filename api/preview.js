const { requirePassword } = require("./_lib/auth");
const { parseStatement } = require("./_lib/statements");
const { supabaseFetch } = require("./_lib/supabase");

module.exports = async function handler(req, res) {
  if (!requirePassword(req, res)) return;

  if (req.method !== "POST") {
    res.status(405).json({ error: "Método não permitido." });
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
    const transactions = parsed.map((transaction) => ({
      ...transaction,
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
