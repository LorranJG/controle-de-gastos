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
      res.status(200).json({ imported: 0, ignored: 0 });
      return;
    }

    const existing = await supabaseFetch(`/transactions?select=id&id=in.(${parsed.map((item) => item.id).join(",")})`);
    const existingIds = new Set(existing.map((item) => item.id));
    const transactions = parsed.filter((item) => !existingIds.has(item.id));

    if (transactions.length) {
      await supabaseFetch("/transactions", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify(transactions),
      });
    }

    res.status(200).json({ imported: transactions.length, ignored: parsed.length - transactions.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
