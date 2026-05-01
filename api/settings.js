const { requirePassword } = require("./_lib/auth");
const { defaultSettings, supabaseFetch } = require("./_lib/supabase");

module.exports = async function handler(req, res) {
  if (!requirePassword(req, res)) return;

  try {
    if (req.method === "GET") {
      const rows = await supabaseFetch("/app_settings?select=*&id=eq.1");
      res.status(200).json({ ...defaultSettings(), ...((rows || [])[0] || {}) });
      return;
    }

    if (req.method === "PUT") {
      const payload = {
        id: 1,
        default_entered_by: String(req.body.default_entered_by || "").trim(),
        default_payment_method: String(req.body.default_payment_method || "").trim(),
        default_period_preset: ["month", "30days"].includes(req.body.default_period_preset)
          ? req.body.default_period_preset
          : "month",
      };

      const saved = await supabaseFetch("/app_settings?on_conflict=id", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=representation" },
        body: JSON.stringify(payload),
      });
      res.status(200).json({ ...defaultSettings(), ...(saved[0] || payload) });
      return;
    }

    res.status(405).json({ error: "Metodo nao permitido." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
