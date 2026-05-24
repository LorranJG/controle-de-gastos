const { requirePassword } = require("../_lib/auth");
const { normalizeDebt, supabaseFetch } = require("../_lib/supabase");
const { normalizePayload, validatePayload } = require("../debts");

module.exports = async function handler(req, res) {
  if (!requirePassword(req, res)) return;

  const id = encodeURIComponent(req.query.id);

  try {
    if (req.method === "PUT") {
      const payload = normalizePayload(req.body);
      const validation = validatePayload(payload);
      if (validation) {
        res.status(400).json({ error: validation });
        return;
      }

      const updated = await supabaseFetch(`/debts?id=eq.${id}`, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(payload),
      });
      res.status(200).json(updated[0] ? normalizeDebt(updated[0]) : null);
      return;
    }

    if (req.method === "DELETE") {
      await supabaseFetch(`/debts?id=eq.${id}`, { method: "DELETE" });
      res.status(200).json({ deleted: id });
      return;
    }

    res.status(405).json({ error: "Metodo nao permitido." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
