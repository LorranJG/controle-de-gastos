const { requirePassword } = require("../_lib/auth");
const { normalizeNamedGoal, supabaseFetch } = require("../_lib/supabase");

module.exports = async function handler(req, res) {
  if (!requirePassword(req, res)) return;

  const id = encodeURIComponent(req.query.id);

  try {
    if (req.method === "PUT") {
      const payload = {
        name: String(req.body.name || "").trim(),
        target_amount: Number(req.body.target_amount || 0),
        current_amount: Number(req.body.current_amount || 0),
        deadline: req.body.deadline || null,
        notes: String(req.body.notes || "").trim(),
      };

      const updated = await supabaseFetch(`/named_goals?id=eq.${id}`, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(payload),
      });
      res.status(200).json(updated[0] ? normalizeNamedGoal(updated[0]) : null);
      return;
    }

    if (req.method === "DELETE") {
      await supabaseFetch(`/named_goals?id=eq.${id}`, { method: "DELETE" });
      res.status(200).json({ deleted: id });
      return;
    }

    res.status(405).json({ error: "Metodo nao permitido." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
