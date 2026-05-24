const { CATEGORIES } = require("./constants");

function getConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY na Vercel.");
  }

  if (url.includes("seu-projeto.supabase.co") || key.includes("sua-service-role-key")) {
    throw new Error("As variaveis do Supabase ainda estao com valores de exemplo. Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY reais na Vercel.");
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error("SUPABASE_URL invalida. Use a Project URL do Supabase, por exemplo https://xxxx.supabase.co.");
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("SUPABASE_URL invalida. Use uma URL iniciando com https://.");
  }

  return { url: parsedUrl.href.replace(/\/$/, ""), key };
}

async function supabaseFetch(path, options = {}) {
  const { url, key } = getConfig();
  let response;

  try {
    response = await fetch(`${url}/rest/v1${path}`, {
      ...options,
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
  } catch {
    throw new Error("Nao foi possivel conectar ao Supabase. Confira se SUPABASE_URL esta correta, se o projeto esta ativo e se a variavel foi publicada no ambiente Production da Vercel.");
  }

  if (!response.ok) {
    const details = await response.text();
    throw new Error(details || `Erro no Supabase: ${response.status}`);
  }

  const text = await response.text();
  if (!text) return null;
  return JSON.parse(text);
}

function normalizeTransactionRecord(transaction) {
  return {
    ...transaction,
    amount: Number(transaction.amount),
    movement_type: transaction.movement_type || (Number(transaction.amount) >= 0 ? "income" : "expense"),
    payment_method: transaction.payment_method || "",
    entered_by: transaction.entered_by || "",
    source: transaction.source || "manual",
    import_batch_id: transaction.import_batch_id || "",
  };
}

function normalizeNamedGoal(goal) {
  return {
    ...goal,
    target_amount: Number(goal.target_amount),
    current_amount: Number(goal.current_amount),
  };
}

function defaultSettings() {
  return {
    default_entered_by: "",
    default_payment_method: "",
    default_period_preset: "month",
  };
}

async function getState() {
  const [transactions, goals, namedGoals, settingsRows] = await Promise.all([
    supabaseFetch("/transactions?select=*&order=date.desc,created_at.desc"),
    supabaseFetch("/goals?select=*&order=category.asc"),
    supabaseFetch("/named_goals?select=*&order=created_at.desc"),
    supabaseFetch("/app_settings?select=*&id=eq.1"),
  ]);

  return {
    categories: CATEGORIES,
    transactions: (transactions || []).map(normalizeTransactionRecord),
    goals: Object.fromEntries((goals || []).map((goal) => [goal.category, Number(goal.amount)])),
    namedGoals: (namedGoals || []).map(normalizeNamedGoal),
    settings: { ...defaultSettings(), ...((settingsRows || [])[0] || {}) },
  };
}

module.exports = {
  defaultSettings,
  getState,
  normalizeNamedGoal,
  normalizeTransactionRecord,
  supabaseFetch,
};
