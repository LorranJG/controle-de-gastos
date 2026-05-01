const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dateFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

let state = {
  categories: [],
  transactions: [],
  goals: {},
};

const elements = {
  loginScreen: document.querySelector("#loginScreen"),
  loginForm: document.querySelector("#loginForm"),
  loginPassword: document.querySelector("#loginPassword"),
  loginError: document.querySelector("#loginError"),
  appHeader: document.querySelector("#appHeader"),
  appMain: document.querySelector("#appMain"),
  statementInput: document.querySelector("#statementInput"),
  exportButton: document.querySelector("#exportButton"),
  clearButton: document.querySelector("#clearButton"),
  logoutButton: document.querySelector("#logoutButton"),
  monthFilter: document.querySelector("#monthFilter"),
  searchInput: document.querySelector("#searchInput"),
  goalForm: document.querySelector("#goalForm"),
  goalCategory: document.querySelector("#goalCategory"),
  goalAmount: document.querySelector("#goalAmount"),
  transactionForm: document.querySelector("#transactionForm"),
  manualDate: document.querySelector("#manualDate"),
  manualDescription: document.querySelector("#manualDescription"),
  manualAmount: document.querySelector("#manualAmount"),
  manualCategory: document.querySelector("#manualCategory"),
  incomeTotal: document.querySelector("#incomeTotal"),
  expenseTotal: document.querySelector("#expenseTotal"),
  balanceTotal: document.querySelector("#balanceTotal"),
  topCategory: document.querySelector("#topCategory"),
  goalSummary: document.querySelector("#goalSummary"),
  categoryList: document.querySelector("#categoryList"),
  transactionRows: document.querySelector("#transactionRows"),
  transactionCount: document.querySelector("#transactionCount"),
  categoryTemplate: document.querySelector("#categoryTemplate"),
};

async function init() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  elements.monthFilter.value = localStorage.getItem("selectedMonth") || currentMonth;
  elements.manualDate.value = new Date().toISOString().slice(0, 10);
  bindEvents();
  if (sessionStorage.getItem("appPassword")) {
    await authenticate();
  } else {
    showLogin();
  }
}

function bindEvents() {
  elements.loginForm.addEventListener("submit", login);
  elements.logoutButton.addEventListener("click", logout);
  elements.statementInput.addEventListener("change", importStatement);
  elements.exportButton.addEventListener("click", exportData);
  elements.clearButton.addEventListener("click", clearData);
  elements.monthFilter.addEventListener("change", () => {
    localStorage.setItem("selectedMonth", elements.monthFilter.value);
    render();
  });
  elements.searchInput.addEventListener("input", render);
  elements.goalForm.addEventListener("submit", saveGoal);
  elements.transactionForm.addEventListener("submit", addManualTransaction);
}

async function login(event) {
  event.preventDefault();
  elements.loginError.textContent = "";
  sessionStorage.setItem("appPassword", elements.loginPassword.value);
  await authenticate();
}

async function authenticate() {
  try {
    await loadState();
    elements.loginPassword.value = "";
    elements.loginError.textContent = "";
    showApp();
  } catch (error) {
    showLogin(error.message || "Não foi possível entrar.");
  }
}

function logout() {
  sessionStorage.removeItem("appPassword");
  state = { categories: [], transactions: [], goals: {} };
  showLogin();
}

function showLogin(message = "") {
  elements.appHeader.hidden = true;
  elements.appMain.hidden = true;
  elements.loginScreen.hidden = false;
  elements.loginError.textContent = message;
  elements.loginPassword.focus();
}

function showApp() {
  elements.loginScreen.hidden = true;
  elements.appHeader.hidden = false;
  elements.appMain.hidden = false;
}

async function loadState() {
  state = await api("/api/state");
  fillCategorySelect(elements.goalCategory);
  fillCategorySelect(elements.manualCategory);
  render();
}

function fillCategorySelect(select) {
  select.replaceChildren(...state.categories.map((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    return option;
  }));
}

async function importStatement(event) {
  const file = event.target.files[0];
  if (!file) return;

  const content = await file.text();
  const result = await api("/api/import", {
    method: "POST",
    body: JSON.stringify({ filename: file.name, content }),
  });

  await loadState();
  event.target.value = "";

  if (!result.imported) {
    alert("Nenhuma movimentação nova encontrada no arquivo.");
  }
}

async function saveGoal(event) {
  event.preventDefault();
  const amount = Number(elements.goalAmount.value);
  if (!Number.isFinite(amount) || amount < 0) return;

  await api(`/api/goals/${encodeURIComponent(elements.goalCategory.value)}`, {
    method: "PUT",
    body: JSON.stringify({ amount }),
  });

  elements.goalAmount.value = "";
  await loadState();
}

async function addManualTransaction(event) {
  event.preventDefault();

  await api("/api/transactions", {
    method: "POST",
    body: JSON.stringify({
      date: elements.manualDate.value,
      description: elements.manualDescription.value,
      amount: elements.manualAmount.value,
      category: elements.manualCategory.value,
    }),
  });

  elements.manualDescription.value = "";
  elements.manualAmount.value = "";
  await loadState();
}

function render() {
  const selectedMonth = elements.monthFilter.value;
  const search = elements.searchInput.value.trim().toLowerCase();
  const transactions = state.transactions
    .filter((item) => item.date.startsWith(selectedMonth))
    .filter((item) => {
      const content = `${item.description} ${item.category} ${item.amount}`.toLowerCase();
      return !search || content.includes(search);
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  renderMetrics(transactions);
  renderCategories(transactions);
  renderTransactions(transactions);
}

function renderMetrics(transactions) {
  const income = sum(transactions.filter((item) => item.amount > 0));
  const expenses = Math.abs(sum(transactions.filter((item) => item.amount < 0)));
  const balance = income - expenses;
  const categoryTotals = expensesByCategory(transactions);
  const top = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

  elements.incomeTotal.textContent = currency.format(income);
  elements.expenseTotal.textContent = currency.format(expenses);
  elements.balanceTotal.textContent = currency.format(balance);
  elements.topCategory.textContent = top ? `${top[0]} (${currency.format(top[1])})` : "-";
}

function renderCategories(transactions) {
  const totals = expensesByCategory(transactions);
  const trackedCategories = [...new Set([...state.categories, ...Object.keys(state.goals)])]
    .filter((category) => totals[category] || state.goals[category] !== undefined);

  elements.categoryList.replaceChildren();
  elements.goalSummary.textContent = `${Object.keys(state.goals).length} metas salvas`;

  if (!trackedCategories.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "Importe um extrato ou adicione uma meta para começar.";
    elements.categoryList.append(empty);
    return;
  }

  trackedCategories.forEach((category) => {
    const item = elements.categoryTemplate.content.firstElementChild.cloneNode(true);
    const spent = totals[category] || 0;
    const goal = state.goals[category] ?? 0;
    const percent = goal > 0 ? Math.min((spent / goal) * 100, 100) : 0;
    const heading = item.querySelector(".category-heading");
    const footer = item.querySelector(".category-footer");
    const bar = item.querySelector(".progress-bar");
    const remove = item.querySelector("button");

    heading.querySelector("strong").textContent = category;
    heading.querySelector("span").textContent = goal > 0 ? `${Math.round(percent)}%` : "sem meta";
    footer.querySelector("span").textContent = `${currency.format(spent)} de ${goal > 0 ? currency.format(goal) : "meta não definida"}`;
    bar.style.width = `${percent}%`;
    bar.classList.toggle("warn", percent >= 80 && percent < 100);
    bar.classList.toggle("danger", goal > 0 && spent > goal);
    remove.hidden = goal <= 0;
    remove.addEventListener("click", async () => {
      await api(`/api/goals/${encodeURIComponent(category)}`, { method: "DELETE" });
      await loadState();
    });

    elements.categoryList.append(item);
  });
}

function renderTransactions(transactions) {
  elements.transactionRows.replaceChildren();
  elements.transactionCount.textContent = `${transactions.length} lançamentos`;

  if (!transactions.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.className = "empty";
    cell.textContent = "Nenhuma movimentação encontrada para os filtros atuais.";
    row.append(cell);
    elements.transactionRows.append(row);
    return;
  }

  transactions.forEach((transaction) => {
    const row = document.createElement("tr");
    const date = document.createElement("td");
    const description = document.createElement("td");
    const category = document.createElement("td");
    const amount = document.createElement("td");
    const actions = document.createElement("td");
    const select = document.createElement("select");
    const value = document.createElement("strong");
    const deleteButton = document.createElement("button");

    date.textContent = dateFormat.format(new Date(`${transaction.date}T00:00:00Z`));
    description.textContent = transaction.description;
    fillCategorySelect(select);
    select.value = transaction.category;
    select.addEventListener("change", async () => {
      await api(`/api/transactions/${encodeURIComponent(transaction.id)}`, {
        method: "PUT",
        body: JSON.stringify({ category: select.value }),
      });
      await loadState();
    });
    value.textContent = currency.format(transaction.amount);
    value.className = transaction.amount >= 0 ? "income" : "expense";
    deleteButton.className = "delete-row";
    deleteButton.type = "button";
    deleteButton.textContent = "Excluir";
    deleteButton.addEventListener("click", async () => {
      await api(`/api/transactions/${encodeURIComponent(transaction.id)}`, { method: "DELETE" });
      await loadState();
    });

    category.append(select);
    amount.append(value);
    actions.append(deleteButton);
    row.append(date, description, category, amount, actions);
    elements.transactionRows.append(row);
  });
}

function expensesByCategory(transactions) {
  return transactions.reduce((totals, item) => {
    if (item.amount < 0) {
      totals[item.category] = (totals[item.category] || 0) + Math.abs(item.amount);
    }
    return totals;
  }, {});
}

function sum(items) {
  return items.reduce((total, item) => total + item.amount, 0);
}

async function exportData() {
  let response = await fetch("/api/export", { headers: authHeaders() });

  if (!response.ok) {
    await handleApiError(response);
    return;
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "controle-de-gastos.json";
  link.click();
  URL.revokeObjectURL(url);
}

async function clearData() {
  if (!confirm("Deseja apagar lançamentos e metas salvos no backend?")) return;
  await api("/api/state", { method: "DELETE" });
  await loadState();
}

async function api(path, options = {}) {
  const request = {
    headers: { "Content-Type": "application/json", ...authHeaders(), ...(options.headers || {}) },
    ...options,
  };
  let response = await fetch(path, request);

  if (!response.ok) {
    await handleApiError(response);
  }

  return response.status === 204 ? null : response.json();
}

function authHeaders() {
  const password = sessionStorage.getItem("appPassword");
  return password ? { "X-App-Password": password } : {};
}

async function handleApiError(response) {
  if (response.status === 401) {
    sessionStorage.removeItem("appPassword");
    throw new Error("Senha inválida ou ausente.");
  }

  const error = await response.json().catch(() => ({ error: "Erro inesperado." }));
  alert(error.error || "Erro inesperado.");
  throw new Error(error.error || response.statusText);
}

init();
