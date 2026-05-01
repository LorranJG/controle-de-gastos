const { requirePassword } = require("../_lib/auth");
const { CATEGORIES } = require("../_lib/constants");
const { normalizeTransaction } = require("../_lib/statements");
const { supabaseFetch, normalizeTransactionRecord } = require("../_lib/supabase");

module.exports = async function handler(req, res) {
  if (!requirePassword(req, res)) return;

  const id = encodeURIComponent(req.query.id);

  try {
    if (req.method === "PUT") {
      const payload = {};

      if (req.body.category !== undefined) {
        if (!CATEGORIES.includes(req.body.category)) {
          res.status(400).json({ error: "Categoria invalida." });
          return;
        }
        payload.category = req.body.category;
      }

      if (req.body.payment_method !== undefined) {
        payload.payment_method = String(req.body.payment_method || "").trim();
      }

      if (req.body.entered_by !== undefined) {
        payload.entered_by = String(req.body.entered_by || "").trim();
      }

      if (req.body.description !== undefined) {
        payload.description = String(req.body.description || "").trim();
      }

      if (req.body.date !== undefined || req.body.amount !== undefined || req.body.movement_type !== undefined) {
        const existingRows = await supabaseFetch(`/transactions?select=*&id=eq.${id}`);
        const existing = (existingRows || [])[0];
        if (!existing) {
          res.status(404).json({ error: "Lancamento nao encontrado." });
          return;
        }

        const normalized = normalizeTransaction({
          ...existing,
          ...req.body,
          id: existing.id,
        });
        payload.date = normalized.date;
        payload.amount = normalized.amount;
        payload.movement_type = normalized.movement_type;
      }

      const updated = await supabaseFetch(`/transactions?id=eq.${id}`, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(payload),
      });
      res.status(200).json(updated[0] ? normalizeTransactionRecord(updated[0]) : null);
      return;
    }

    if (req.method === "DELETE") {
      await supabaseFetch(`/transactions?id=eq.${id}`, { method: "DELETE" });
      res.status(200).json({ deleted: id });
      return;
    }

    res.status(405).json({ error: "Metodo nao permitido." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
