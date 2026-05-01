const { requirePassword } = require("./_lib/auth");
const { getState } = require("./_lib/supabase");

module.exports = async function handler(req, res) {
  if (!requirePassword(req, res)) return;

  if (req.method !== "GET") {
    res.status(405).json({ error: "Metodo nao permitido." });
    return;
  }

  try {
    const state = await getState();
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="controle-de-gastos.json"');
    res.status(200).send(JSON.stringify({
      transactions: state.transactions,
      goals: state.goals,
      namedGoals: state.namedGoals,
      settings: state.settings,
    }, null, 2));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
