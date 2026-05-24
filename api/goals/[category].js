const { requirePassword } = require("../_lib/auth");
const { normalizeMonthlyGoal, supabaseFetch } = require("../_lib/supabase");

module.exports = async function handler(req, res) {
  if (!requirePassword(req, res)) return;

  const category = decodeURIComponent(req.query.category).trim();

  try {
    if (!category.trim()) {
      res.status(400).json({ error: "Categoria invalida." });
      return;
    }

    if (req.method === "PUT") {
      const amount = Number(req.body.amount);
      const year = Number(req.body.year);
      const month = Number(req.body.month);
      if (!Number.isFinite(amount) || amount < 0) {
        res.status(400).json({ error: "Valor de meta invalido." });
        return;
      }

      if (!Number.isInteger(year) || year < 2000 || year > 2100 || !Number.isInteger(month) || month < 1 || month > 12) {
        res.status(400).json({ error: "Informe mes e ano validos para a meta." });
        return;
      }

      const saved = await supabaseFetch("/monthly_goals?on_conflict=category,year,month", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=representation" },
        body: JSON.stringify({ category, year, month, amount }),
      });
      res.status(200).json(normalizeMonthlyGoal(saved[0]));
      return;
    }

    if (req.method === "DELETE") {
      const year = Number(req.query.year);
      const month = Number(req.query.month);

      if (Number.isInteger(year) && Number.isInteger(month)) {
        await supabaseFetch(`/monthly_goals?category=eq.${encodeURIComponent(category)}&year=eq.${year}&month=eq.${month}`, { method: "DELETE" });
        res.status(200).json({ deleted: category, year, month });
        return;
      }

      await supabaseFetch(`/monthly_goals?category=eq.${encodeURIComponent(category)}`, { method: "DELETE" });
      await supabaseFetch(`/goals?category=eq.${encodeURIComponent(category)}`, { method: "DELETE" });
      res.status(200).json({ deleted: category });
      return;
    }

    res.status(405).json({ error: "Metodo nao permitido." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
