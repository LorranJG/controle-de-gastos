const { requirePassword } = require("./_lib/auth");
const { normalizeNamedGoal, supabaseFetch } = require("./_lib/supabase");

module.exports = async function handler(req, res) {
  if (!requirePassword(req, res)) return;

  try {
    if (req.method === "GET") {
      const rows = await supabaseFetch("/named_goals?select=*&order=created_at.desc");
      res.status(200).json((rows || []).map(normalizeNamedGoal));
      return;
    }

    if (req.method === "POST") {
      const payload = normalizePayload(req.body);
      const created = await supabaseFetch("/named_goals", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(payload),
      });
      res.status(201).json(normalizeNamedGoal(created[0]));
      return;
    }

    res.status(405).json({ error: "Metodo nao permitido." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

function normalizePayload(body) {
  return {
    name: String(body.name || "").trim(),
    target_amount: Number(body.target_amount || 0),
    current_amount: Number(body.current_amount || 0),
    deadline: body.deadline || null,
    notes: String(body.notes || "").trim(),
  };
}
