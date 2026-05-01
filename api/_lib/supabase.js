const { CATEGORIES } = require("./constants");

function getConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY na Vercel.");
  }

  return { url: url.replace(/\/$/, ""), key };
}

async function supabaseFetch(path, options = {}) {
  const { url, key } = getConfig();
  const response = await fetch(`${url}/rest/v1${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(details || `Erro no Supabase: ${response.status}`);
  }

  const text = await response.text();
  if (!text) return null;
  return JSON.parse(text);
}

async function getState() {
  const [transactions, goals] = await Promise.all([
    supabaseFetch("/transactions?select=*&order=date.desc,created_at.desc"),
    supabaseFetch("/goals?select=*&order=category.asc"),
  ]);

  return {
    categories: CATEGORIES,
    transactions: (transactions || []).map((transaction) => ({
      ...transaction,
      amount: Number(transaction.amount),
    })),
    goals: Object.fromEntries((goals || []).map((goal) => [goal.category, Number(goal.amount)])),
  };
}

module.exports = { getState, supabaseFetch };
