const { requirePassword } = require("./_lib/auth");
const { getState, supabaseFetch } = require("./_lib/supabase");

module.exports = async function handler(req, res) {
  if (!requirePassword(req, res)) return;

  try {
    if (req.method === "GET") {
      res.status(200).json(await getState());
      return;
    }

    if (req.method === "DELETE") {
      await supabaseFetch("/transactions?id=not.is.null", { method: "DELETE" });
      await supabaseFetch("/goals?category=not.is.null", { method: "DELETE" });
      await supabaseFetch("/named_goals?id=not.is.null", { method: "DELETE" });
      res.status(200).json(await getState());
      return;
    }

    res.status(405).json({ error: "Metodo nao permitido." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
