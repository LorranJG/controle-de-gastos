const { requirePassword } = require("../_lib/auth");
const { CATEGORIES } = require("../_lib/constants");
const { supabaseFetch } = require("../_lib/supabase");

module.exports = async function handler(req, res) {
  if (!requirePassword(req, res)) return;

  const id = encodeURIComponent(req.query.id);

  try {
    if (req.method === "PUT") {
      if (!CATEGORIES.includes(req.body.category)) {
        res.status(400).json({ error: "Categoria inválida." });
        return;
      }

      const updated = await supabaseFetch(`/transactions?id=eq.${id}`, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({ category: req.body.category }),
      });
      res.status(200).json(updated[0] || null);
      return;
    }

    if (req.method === "DELETE") {
      await supabaseFetch(`/transactions?id=eq.${id}`, { method: "DELETE" });
      res.status(200).json({ deleted: id });
      return;
    }

    res.status(405).json({ error: "Método não permitido." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
