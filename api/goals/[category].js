const { requirePassword } = require("../_lib/auth");
const { CATEGORIES } = require("../_lib/constants");
const { supabaseFetch } = require("../_lib/supabase");

module.exports = async function handler(req, res) {
  if (!requirePassword(req, res)) return;

  const category = decodeURIComponent(req.query.category);

  try {
    if (!CATEGORIES.includes(category)) {
      res.status(400).json({ error: "Categoria invalida." });
      return;
    }

    if (req.method === "PUT") {
      const amount = Number(req.body.amount);
      if (!Number.isFinite(amount) || amount < 0) {
        res.status(400).json({ error: "Valor de meta invalido." });
        return;
      }

      const saved = await supabaseFetch("/goals?on_conflict=category", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=representation" },
        body: JSON.stringify({ category, amount }),
      });
      res.status(200).json(saved[0]);
      return;
    }

    if (req.method === "DELETE") {
      await supabaseFetch(`/goals?category=eq.${encodeURIComponent(category)}`, { method: "DELETE" });
      res.status(200).json({ deleted: category });
      return;
    }

    res.status(405).json({ error: "Metodo nao permitido." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
