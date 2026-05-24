const { requirePassword } = require("./_lib/auth");
const { normalizeDebt, supabaseFetch } = require("./_lib/supabase");

module.exports = async function handler(req, res) {
  if (!requirePassword(req, res)) return;

  try {
    if (req.method === "GET") {
      const rows = await supabaseFetch("/debts?select=*&order=created_at.desc");
      res.status(200).json((rows || []).map(normalizeDebt));
      return;
    }

    if (req.method === "POST") {
      const payload = normalizePayload(req.body);
      const validation = validatePayload(payload);
      if (validation) {
        res.status(400).json({ error: validation });
        return;
      }

      const created = await supabaseFetch("/debts", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(payload),
      });
      res.status(201).json(normalizeDebt(created[0]));
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
    creditor: String(body.creditor || "").trim(),
    original_amount: Number(body.original_amount || 0),
    current_balance: Number(body.current_balance || 0),
    interest_rate: Number(body.interest_rate || 0),
    minimum_payment: Number(body.minimum_payment || 0),
    due_day: body.due_day ? Number(body.due_day) : null,
    status: body.status === "paid" ? "paid" : "active",
    notes: String(body.notes || "").trim(),
  };
}

function validatePayload(payload) {
  if (!payload.name) return "Informe o nome da divida.";
  if (!Number.isFinite(payload.original_amount) || payload.original_amount < 0) return "Valor original invalido.";
  if (!Number.isFinite(payload.current_balance) || payload.current_balance < 0) return "Saldo devedor invalido.";
  if (!Number.isFinite(payload.interest_rate) || payload.interest_rate < 0) return "Taxa de juros invalida.";
  if (!Number.isFinite(payload.minimum_payment) || payload.minimum_payment < 0) return "Pagamento minimo invalido.";
  if (payload.due_day !== null && (!Number.isInteger(payload.due_day) || payload.due_day < 1 || payload.due_day > 31)) return "Dia de vencimento invalido.";
  return "";
}

module.exports.normalizePayload = normalizePayload;
module.exports.validatePayload = validatePayload;
