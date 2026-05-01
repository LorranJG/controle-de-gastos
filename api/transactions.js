const { requirePassword } = require("./_lib/auth");
const { normalizeTransaction } = require("./_lib/statements");
const { supabaseFetch, normalizeTransactionRecord } = require("./_lib/supabase");

module.exports = async function handler(req, res) {
  if (!requirePassword(req, res)) return;

  if (req.method !== "POST") {
    res.status(405).json({ error: "Metodo nao permitido." });
    return;
  }

  try {
    const transaction = normalizeTransaction(req.body);
    if (!transaction || !transaction.entered_by || !transaction.payment_method) {
      res.status(400).json({ error: "Lancamento invalido." });
      return;
    }

    const existing = await supabaseFetch(`/transactions?select=id&id=eq.${transaction.id}`);
    if ((existing || []).length) {
      transaction.id = `${transaction.id}-${Date.now()}`;
    }

    const created = await supabaseFetch("/transactions", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(transaction),
    });

    res.status(201).json(normalizeTransactionRecord(created[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
