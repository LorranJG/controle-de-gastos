const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dateFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

let state = {
  categories: [],
  transactions: [],
  goals: {},
};

let transactionType = "all";
let pendingImport = [];
const selectedTransactions = new Set();

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
  periodStart: document.querySelector("#periodStart"),
  periodEnd: document.querySelector("#periodEnd"),
  searchInput: document.querySelector("#searchInput"),
  typeButtons: document.querySelectorAll(".type-card"),
  typeAllTotal: document.querySelector("#typeAllTotal"),
  typeIncomeTotal: document.querySelector("#typeIncomeTotal"),
  typeExpenseTotal: document.querySelector("#typeExpenseTotal"),
  importPreviewPanel: document.querySelector("#importPreviewPanel"),
  previewSummary: document.querySelector("#previewSummary"),
  previewRows: document.querySelector("#previewRows"),
  confirmImportButton: document.querySelector("#confirmImportButton"),
  discardImportButton: document.querySelector("#discardImportButton"),
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
  setDefaultPeriod();
  elements.manualDate.value = new Date().toISOString().slice(0, 10);
  bindEvents();

  if (sessionStorage.getItem("appPassword")) {
    await authenticate();
  } else {
    showLogin();
  }
}

function setDefaultPeriod() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  elements.periodStart.value = localStorage.getItem("periodStart") || toInputDate(start);
  elements.periodEnd.value = localStorage.getItem("periodEnd") || toInputDate(end);
}

function bindEvents() {
  elements.loginForm.addEventListener("submit", login);
  elements.logoutButton.addEventListener("click", logout);
  elements.statementInput.addEventListener("change", previewStatement);
  elements.exportButton.addEventListener("click", exportData);
  elements.clearButton.addEventListener("click", deleteSelectedTransactions);
  elements.periodStart.addEventListener("change", updatePeriod);
  elements.periodEnd.addEventListener("change", updatePeriod);
  elements.searchInput.addEventListener("input", render);
  elements.typeButtons.forEach((button) => button.addEventListener("click", selectTransactionType));
  elements.confirmImportButton.addEventListener("click", confirmImport);
  elements.discardImportButton.addEventListener("click", clearImportPreview);
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
  pendingImport = [];
  selectedTransactions.clear();
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

async function previewStatement(event) {
  const file = event.target.files[0];
  if (!file) return;

  const content = await file.text();
  const result = await api("/api/preview", {
    method: "POST",
    body: JSON.stringify({ filename: file.name, content }),
  });

  pendingImport = result.transactions.map((transaction) => ({
    ...transaction,
    selected: !transaction.duplicate,
  }));

  renderImportPreview();
  event.target.value = "";
}

function renderImportPreview() {
  elements.previewRows.replaceChildren();
  elements.importPreviewPanel.hidden = pendingImport.length === 0;

  if (!pendingImport.length) {
    elements.previewSummary.textContent = "";
    return;
  }

  const selected = pendingImport.filter((item) => item.selected && !item.duplicate).length;
  const duplicates = pendingImport.filter((item) => item.duplicate).length;
  elements.previewSummary.textContent = `${selected} selecionados, ${duplicates} duplicados`;
  elements.confirmImportButton.disabled = selected === 0;

  pendingImport.forEach((transaction, index) => {
    const row = document.createElement("tr");
    const include = document.createElement("td");
    const date = document.createElement("td");
    const description = document.createElement("td");
    const category = document.createElement("td");
    const amount = document.createElement("td");
    const status = document.createElement("td");
    const checkbox = document.createElement("input");
    const select = document.createElement("select");
    const value = document.createElement("strong");

    checkbox.type = "checkbox";
    checkbox.checked = transaction.selected;
    checkbox.disabled = transaction.duplicate;
    checkbox.addEventListener("change", () => {
      pendingImport[index].selected = checkbox.checked;
      renderImportPreview();
    });

    fillCategorySelect(select);
    select.value = transaction.category;
    select.disabled = transaction.duplicate;
    select.addEventListener("change", () => {
      pendingImport[index].category = select.value;
    });

    date.textContent = formatDate(transaction.date);
    description.textContent = transaction.description;
    value.textContent = currency.format(transaction.amount);
    value.className = transaction.amount >= 0 ? "income" : "expense";
    status.textContent = transaction.duplicate ? "Duplicado" : "Novo";

    include.append(checkbox);
    category.append(select);
    amount.append(value);
    row.append(include, date, description, category, amount, status);
    elements.previewRows.append(row);
  });
}

async function confirmImport() {
  const transactions = pendingImport
    .filter((transaction) => transaction.selected && !transaction.duplicate)
    .map(({ selected, duplicate, ...transaction }) => transaction);

  if (!transactions.length) return;

  const result = await api("/api/import", {
    method: "POST",
    body: JSON.stringify({ transactions }),
  });

  clearImportPreview();
  await loadState();

  if (!result.imported) {
    alert("Nenhuma movimentação nova foi adicionada.");
  }
}

function clearImportPreview() {
  pendingImport = [];
  elements.importPreviewPanel.hidden = true;
  elements.previewRows.replaceChildren();
  elements.previewSummary.textContent = "";
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

function updatePeriod() {
  localStorage.setItem("periodStart", elements.periodStart.value);
  localStorage.setItem("periodEnd", elements.periodEnd.value);
  selectedTransactions.clear();
  render();
}

function selectTransactionType(event) {
  transactionType = event.currentTarget.dataset.type;
  elements.typeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.type === transactionType);
  });
  selectedTransactions.clear();
  render();
}

function render() {
  const periodTransactions = transactionsInPeriod(state.transactions);
  const search = elements.searchInput.value.trim().toLowerCase();
  const transactions = periodTransactions
    .filter((item) => {
      if (transactionType === "income") return item.amount > 0;
      if (transactionType === "expense") return item.amount < 0;
      return true;
    })
    .filter((item) => {
      const content = `${item.description} ${item.category} ${item.amount}`.toLowerCase();
      return !search || content.includes(search);
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  renderMetrics(periodTransactions);
  renderTypeTotals(periodTransactions);
  renderCategories(periodTransactions);
  renderTransactions(transactions);
  updateDeleteButton();
}

function transactionsInPeriod(transactions) {
  const start = elements.periodStart.value || "0000-01-01";
  const end = elements.periodEnd.value || "9999-12-31";
  return transactions.filter((item) => item.date >= start && item.date <= end);
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

function renderTypeTotals(transactions) {
  const income = sum(transactions.filter((item) => item.amount > 0));
  const expenses = Math.abs(sum(transactions.filter((item) => item.amount < 0)));
  elements.typeAllTotal.textContent = currency.format(income - expenses);
  elements.typeIncomeTotal.textContent = currency.format(income);
  elements.typeExpenseTotal.textContent = currency.format(expenses);
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
    cell.colSpan = 6;
    cell.className = "empty";
    cell.textContent = "Nenhuma movimentação encontrada para os filtros atuais.";
    row.append(cell);
    elements.transactionRows.append(row);
    return;
  }

  transactions.forEach((transaction) => {
    const row = document.createElement("tr");
    const flag = document.createElement("td");
    const date = document.createElement("td");
    const description = document.createElement("td");
    const category = document.createElement("td");
    const amount = document.createElement("td");
    const actions = document.createElement("td");
    const checkbox = document.createElement("input");
    const select = document.createElement("select");
    const value = document.createElement("strong");
    const deleteButton = document.createElement("button");

    checkbox.type = "checkbox";
    checkbox.checked = selectedTransactions.has(transaction.id);
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) selectedTransactions.add(transaction.id);
      else selectedTransactions.delete(transaction.id);
      updateDeleteButton();
    });

    date.textContent = formatDate(transaction.date);
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
      selectedTransactions.add(transaction.id);
      await deleteSelectedTransactions();
    });

    flag.append(checkbox);
    category.append(select);
    amount.append(value);
    actions.append(deleteButton);
    row.append(flag, date, description, category, amount, actions);
    elements.transactionRows.append(row);
  });
}

function updateDeleteButton() {
  const count = selectedTransactions.size;
  elements.clearButton.disabled = count === 0;
  elements.clearButton.textContent = count ? `Excluir selecionados (${count})` : "Excluir selecionados";
}

async function deleteSelectedTransactions() {
  const ids = [...selectedTransactions];
  if (!ids.length) return;

  if (!confirm(`Deseja excluir ${ids.length} lançamento(s) selecionado(s)?`)) return;

  await Promise.all(ids.map((id) => api(`/api/transactions/${encodeURIComponent(id)}`, { method: "DELETE" })));
  selectedTransactions.clear();
  await loadState();
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
  const response = await fetch("/api/export", { headers: authHeaders() });

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

async function api(path, options = {}) {
  const request = {
    headers: { "Content-Type": "application/json", ...authHeaders(), ...(options.headers || {}) },
    ...options,
  };
  const response = await fetch(path, request);

  if (!response.ok) {
    await handleApiError(response);
  }

  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
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

function formatDate(date) {
  return dateFormat.format(new Date(`${date}T00:00:00Z`));
}

function toInputDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

init();
