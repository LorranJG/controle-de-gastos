const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dateFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

let state = {
  categories: [],
  transactions: [],
  goals: {},
  namedGoals: [],
  settings: {
    default_entered_by: "",
    default_payment_method: "",
    default_period_preset: "month",
  },
};

let currentPage = "dashboard";
let transactionType = "all";
let pendingImport = [];
let editingNamedGoalId = "";
const selectedTransactions = new Set();

const pageMeta = {
  dashboard: { title: "Dashboard", eyebrow: "Visao geral" },
  transactions: { title: "Movimentacoes", eyebrow: "Lancamentos e filtros" },
  goals: { title: "Metas", eyebrow: "Planejamento" },
  import: { title: "Importar gastos", eyebrow: "Revisao antes de salvar" },
  settings: { title: "Configuracoes", eyebrow: "Preferencias do sistema" },
};

const elements = {
  loginScreen: document.querySelector("#loginScreen"),
  loginForm: document.querySelector("#loginForm"),
  loginPassword: document.querySelector("#loginPassword"),
  loginError: document.querySelector("#loginError"),
  appShell: document.querySelector("#appShell"),
  logoutButton: document.querySelector("#logoutButton"),
  pageTitle: document.querySelector("#pageTitle"),
  pageEyebrow: document.querySelector("#pageEyebrow"),
  navLinks: document.querySelectorAll(".nav-link"),
  pages: document.querySelectorAll(".page"),
  statementInput: document.querySelector("#statementInput"),
  periodStart: document.querySelector("#periodStart"),
  periodEnd: document.querySelector("#periodEnd"),
  presetButtons: document.querySelectorAll(".preset-button"),
  searchInput: document.querySelector("#searchInput"),
  filterCategory: document.querySelector("#filterCategory"),
  filterEnteredBy: document.querySelector("#filterEnteredBy"),
  filterPaymentMethod: document.querySelector("#filterPaymentMethod"),
  typeButtons: document.querySelectorAll(".type-card"),
  typeAllTotal: document.querySelector("#typeAllTotal"),
  typeIncomeTotal: document.querySelector("#typeIncomeTotal"),
  typeExpenseTotal: document.querySelector("#typeExpenseTotal"),
  typeAllTotalDuplicate: document.querySelector("#typeAllTotalDuplicate"),
  typeIncomeTotalDuplicate: document.querySelector("#typeIncomeTotalDuplicate"),
  typeExpenseTotalDuplicate: document.querySelector("#typeExpenseTotalDuplicate"),
  clearButton: document.querySelector("#clearButton"),
  importEnteredBy: document.querySelector("#importEnteredBy"),
  importPaymentMethod: document.querySelector("#importPaymentMethod"),
  importPreviewPanel: document.querySelector("#importPreviewPanel"),
  previewSummary: document.querySelector("#previewSummary"),
  previewRows: document.querySelector("#previewRows"),
  confirmImportButton: document.querySelector("#confirmImportButton"),
  discardImportButton: document.querySelector("#discardImportButton"),
  goalForm: document.querySelector("#goalForm"),
  goalCategory: document.querySelector("#goalCategory"),
  goalAmount: document.querySelector("#goalAmount"),
  namedGoalForm: document.querySelector("#namedGoalForm"),
  namedGoalId: document.querySelector("#namedGoalId"),
  namedGoalName: document.querySelector("#namedGoalName"),
  namedGoalTarget: document.querySelector("#namedGoalTarget"),
  namedGoalCurrent: document.querySelector("#namedGoalCurrent"),
  namedGoalDeadline: document.querySelector("#namedGoalDeadline"),
  namedGoalNotes: document.querySelector("#namedGoalNotes"),
  cancelNamedGoalEdit: document.querySelector("#cancelNamedGoalEdit"),
  transactionForm: document.querySelector("#transactionForm"),
  manualDate: document.querySelector("#manualDate"),
  manualType: document.querySelector("#manualType"),
  manualDescription: document.querySelector("#manualDescription"),
  manualAmount: document.querySelector("#manualAmount"),
  manualCategory: document.querySelector("#manualCategory"),
  manualPaymentMethod: document.querySelector("#manualPaymentMethod"),
  manualEnteredBy: document.querySelector("#manualEnteredBy"),
  settingsForm: document.querySelector("#settingsForm"),
  settingsDefaultEnteredBy: document.querySelector("#settingsDefaultEnteredBy"),
  settingsDefaultPaymentMethod: document.querySelector("#settingsDefaultPaymentMethod"),
  settingsDefaultPeriodPreset: document.querySelector("#settingsDefaultPeriodPreset"),
  exportButton: document.querySelector("#exportButton"),
  resetDataButton: document.querySelector("#resetDataButton"),
  incomeTotal: document.querySelector("#incomeTotal"),
  expenseTotal: document.querySelector("#expenseTotal"),
  balanceTotal: document.querySelector("#balanceTotal"),
  topCategory: document.querySelector("#topCategory"),
  goalSummary: document.querySelector("#goalSummary"),
  categoryList: document.querySelector("#categoryList"),
  namedGoalSummary: document.querySelector("#namedGoalSummary"),
  dashboardNamedGoals: document.querySelector("#dashboardNamedGoals"),
  goalsPageSummary: document.querySelector("#goalsPageSummary"),
  namedGoalList: document.querySelector("#namedGoalList"),
  transactionRows: document.querySelector("#transactionRows"),
  transactionCount: document.querySelector("#transactionCount"),
  enteredByList: document.querySelector("#enteredByList"),
  paymentMethodsList: document.querySelector("#paymentMethodsList"),
  categoryTemplate: document.querySelector("#categoryTemplate"),
  namedGoalTemplate: document.querySelector("#namedGoalTemplate"),
};

async function init() {
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
  elements.navLinks.forEach((button) => button.addEventListener("click", navigateTo));
  elements.statementInput.addEventListener("change", previewStatement);
  elements.periodStart.addEventListener("change", updatePeriod);
  elements.periodEnd.addEventListener("change", updatePeriod);
  elements.presetButtons.forEach((button) => button.addEventListener("click", applyPresetRange));
  elements.searchInput.addEventListener("input", render);
  elements.filterCategory.addEventListener("change", render);
  elements.filterEnteredBy.addEventListener("change", render);
  elements.filterPaymentMethod.addEventListener("change", render);
  elements.typeButtons.forEach((button) => button.addEventListener("click", selectTransactionType));
  elements.clearButton.addEventListener("click", deleteSelectedTransactions);
  elements.confirmImportButton.addEventListener("click", confirmImport);
  elements.discardImportButton.addEventListener("click", clearImportPreview);
  elements.goalForm.addEventListener("submit", saveCategoryGoal);
  elements.namedGoalForm.addEventListener("submit", saveNamedGoal);
  elements.cancelNamedGoalEdit.addEventListener("click", resetNamedGoalForm);
  elements.transactionForm.addEventListener("submit", addManualTransaction);
  elements.settingsForm.addEventListener("submit", saveSettings);
  elements.exportButton.addEventListener("click", exportData);
  elements.resetDataButton.addEventListener("click", resetSystemData);
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
    showLogin(error.message || "Nao foi possivel entrar.");
  }
}

function logout() {
  sessionStorage.removeItem("appPassword");
  state = {
    categories: [],
    transactions: [],
    goals: {},
    namedGoals: [],
    settings: { default_entered_by: "", default_payment_method: "", default_period_preset: "month" },
  };
  pendingImport = [];
  selectedTransactions.clear();
  showLogin();
}

function showLogin(message = "") {
  elements.appShell.hidden = true;
  elements.loginScreen.hidden = false;
  elements.loginError.textContent = message;
  elements.loginPassword.focus();
}

function showApp() {
  elements.loginScreen.hidden = true;
  elements.appShell.hidden = false;
}

function navigateTo(event) {
  setCurrentPage(event.currentTarget.dataset.page);
}

function setCurrentPage(page) {
  currentPage = page;
  elements.pages.forEach((section) => {
    section.classList.toggle("active", section.id === `page-${page}`);
  });
  elements.navLinks.forEach((button) => {
    button.classList.toggle("active", button.dataset.page === page);
  });
  const meta = pageMeta[page];
  elements.pageTitle.textContent = meta.title;
  elements.pageEyebrow.textContent = meta.eyebrow;
}

async function loadState() {
  state = await api("/api/state");
  ensurePeriods();
  fillCategorySelect(elements.goalCategory, false);
  fillCategorySelect(elements.manualCategory, false);
  fillTransactionFilters();
  fillDataLists();
  fillSettingsForm();
  fillDefaultsFromSettings();
  render();
}

function ensurePeriods() {
  const savedStart = localStorage.getItem("periodStart");
  const savedEnd = localStorage.getItem("periodEnd");

  if (savedStart && savedEnd) {
    elements.periodStart.value = savedStart;
    elements.periodEnd.value = savedEnd;
    return;
  }

  applyPreset(state.settings.default_period_preset || "month");
}

function applyPresetRange(event) {
  applyPreset(event.currentTarget.dataset.range);
}

function applyPreset(range) {
  const now = new Date();

  if (range === "30days") {
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const start = new Date(end);
    start.setDate(start.getDate() - 29);
    elements.periodStart.value = toInputDate(start);
    elements.periodEnd.value = toInputDate(end);
  } else {
    elements.periodStart.value = toInputDate(new Date(now.getFullYear(), now.getMonth(), 1));
    elements.periodEnd.value = toInputDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  }

  updatePeriod();
}

function updatePeriod() {
  localStorage.setItem("periodStart", elements.periodStart.value);
  localStorage.setItem("periodEnd", elements.periodEnd.value);
  selectedTransactions.clear();
  render();
}

function fillCategorySelect(select, includeEmpty) {
  const options = [];
  if (includeEmpty) {
    const empty = document.createElement("option");
    empty.value = "";
    empty.textContent = "Todas";
    options.push(empty);
  }

  state.categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    options.push(option);
  });

  select.replaceChildren(...options);
}

function fillTransactionFilters() {
  fillSelectWithValues(elements.filterCategory, ["", ...state.categories], "Todas");
  fillSelectWithValues(elements.filterEnteredBy, ["", ...uniqueValues("entered_by")], "Todas");
  fillSelectWithValues(elements.filterPaymentMethod, ["", ...uniqueValues("payment_method")], "Todas");
}

function fillSelectWithValues(select, values, emptyLabel) {
  const options = values.map((value, index) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = index === 0 ? emptyLabel : value;
    return option;
  });
  const previous = select.value;
  select.replaceChildren(...options);
  if (values.includes(previous)) {
    select.value = previous;
  }
}

function fillDataLists() {
  fillDataList(elements.enteredByList, uniqueValues("entered_by"));
  fillDataList(elements.paymentMethodsList, uniqueValues("payment_method"));
}

function fillDataList(dataList, values) {
  dataList.replaceChildren(...values.map((value) => {
    const option = document.createElement("option");
    option.value = value;
    return option;
  }));
}

function fillSettingsForm() {
  elements.settingsDefaultEnteredBy.value = state.settings.default_entered_by || "";
  elements.settingsDefaultPaymentMethod.value = state.settings.default_payment_method || "";
  elements.settingsDefaultPeriodPreset.value = state.settings.default_period_preset || "month";
}

function fillDefaultsFromSettings() {
  if (!elements.manualEnteredBy.value) elements.manualEnteredBy.value = state.settings.default_entered_by || "";
  if (!elements.manualPaymentMethod.value) elements.manualPaymentMethod.value = state.settings.default_payment_method || "";
  if (!elements.importEnteredBy.value) elements.importEnteredBy.value = state.settings.default_entered_by || "";
  if (!elements.importPaymentMethod.value) elements.importPaymentMethod.value = state.settings.default_payment_method || "";
  if (!elements.manualDate.value) elements.manualDate.value = toInputDate(new Date());
}

function uniqueValues(field) {
  return [...new Set(state.transactions.map((item) => item[field]).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function render() {
  const baseTransactions = transactionsInPeriod(state.transactions)
    .filter((item) => !elements.filterCategory.value || item.category === elements.filterCategory.value)
    .filter((item) => !elements.filterEnteredBy.value || item.entered_by === elements.filterEnteredBy.value)
    .filter((item) => !elements.filterPaymentMethod.value || item.payment_method === elements.filterPaymentMethod.value);

  const search = elements.searchInput.value.trim().toLowerCase();
  const filteredTransactions = baseTransactions
    .filter((item) => {
      if (transactionType === "income") return item.movement_type === "income";
      if (transactionType === "expense") return item.movement_type === "expense";
      return true;
    })
    .filter((item) => {
      const content = `${item.description} ${item.category} ${item.payment_method} ${item.entered_by} ${item.amount}`.toLowerCase();
      return !search || content.includes(search);
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  renderMetrics(baseTransactions);
  renderTypeTotals(baseTransactions);
  renderCategoryGoals(baseTransactions);
  renderNamedGoals();
  renderTransactions(filteredTransactions);
  updateDeleteButton();
}

function transactionsInPeriod(transactions) {
  const start = elements.periodStart.value || "0000-01-01";
  const end = elements.periodEnd.value || "9999-12-31";
  return transactions.filter((item) => item.date >= start && item.date <= end);
}

function renderMetrics(transactions) {
  const income = sumAmounts(transactions.filter((item) => item.movement_type === "income"));
  const expenses = Math.abs(sumAmounts(transactions.filter((item) => item.movement_type === "expense")));
  const balance = income - expenses;
  const categoryTotals = expensesByCategory(transactions);
  const top = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

  elements.incomeTotal.textContent = currency.format(income);
  elements.expenseTotal.textContent = currency.format(expenses);
  elements.balanceTotal.textContent = currency.format(balance);
  elements.topCategory.textContent = top ? `${top[0]} (${currency.format(top[1])})` : "-";
}

function renderTypeTotals(transactions) {
  const income = sumAmounts(transactions.filter((item) => item.movement_type === "income"));
  const expenses = Math.abs(sumAmounts(transactions.filter((item) => item.movement_type === "expense")));
  elements.typeAllTotal.textContent = currency.format(income - expenses);
  elements.typeIncomeTotal.textContent = currency.format(income);
  elements.typeExpenseTotal.textContent = currency.format(expenses);
  if (elements.typeAllTotalDuplicate) elements.typeAllTotalDuplicate.textContent = currency.format(income - expenses);
  if (elements.typeIncomeTotalDuplicate) elements.typeIncomeTotalDuplicate.textContent = currency.format(income);
  if (elements.typeExpenseTotalDuplicate) elements.typeExpenseTotalDuplicate.textContent = currency.format(expenses);
}

function renderCategoryGoals(transactions) {
  const totals = expensesByCategory(transactions);
  const trackedCategories = [...new Set([...state.categories, ...Object.keys(state.goals)])]
    .filter((category) => totals[category] || state.goals[category] !== undefined);

  elements.categoryList.replaceChildren();
  elements.goalSummary.textContent = `${Object.keys(state.goals).length} metas salvas`;

  if (!trackedCategories.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "Cadastre uma meta por categoria para acompanhar o consumo do periodo.";
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
    footer.querySelector("span").textContent = `${currency.format(spent)} de ${goal > 0 ? currency.format(goal) : "meta nao definida"}`;
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

function renderNamedGoals() {
  renderNamedGoalContainer(elements.dashboardNamedGoals, state.namedGoals.slice(0, 4), true);
  renderNamedGoalContainer(elements.namedGoalList, state.namedGoals, false);
  elements.namedGoalSummary.textContent = `${state.namedGoals.length} metas ativas`;
  elements.goalsPageSummary.textContent = `${state.namedGoals.length} metas cadastradas`;
}

function renderNamedGoalContainer(container, goals, compact) {
  container.replaceChildren();

  if (!goals.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = compact
      ? "As metas nomeadas aparecem aqui assim que forem cadastradas."
      : "Cadastre sua primeira meta nomeada para acompanhar progresso e prazo.";
    container.append(empty);
    return;
  }

  goals.forEach((goal) => {
    const item = elements.namedGoalTemplate.content.firstElementChild.cloneNode(true);
    const progress = goal.target_amount > 0 ? Math.min((goal.current_amount / goal.target_amount) * 100, 100) : 0;
    item.querySelector("strong").textContent = goal.name;
    item.querySelector(".named-goal-deadline").textContent = goal.deadline ? `Prazo: ${formatDate(goal.deadline)}` : "Sem prazo";
    item.querySelector(".named-goal-percent").textContent = `${Math.round(progress)}%`;
    item.querySelector(".named-goal-amounts").textContent = `${currency.format(goal.current_amount)} de ${currency.format(goal.target_amount)}`;
    item.querySelector(".named-goal-notes").textContent = goal.notes || "Sem observacoes.";
    const bar = item.querySelector(".progress-bar");
    bar.style.width = `${progress}%`;
    bar.classList.toggle("warn", progress >= 80 && progress < 100);
    bar.classList.toggle("danger", progress > 100);

    item.querySelector('[data-action="edit"]').addEventListener("click", () => populateNamedGoalForm(goal));
    item.querySelector('[data-action="delete"]').addEventListener("click", async () => {
      if (!confirm(`Deseja excluir a meta "${goal.name}"?`)) return;
      await api(`/api/named-goals/${encodeURIComponent(goal.id)}`, { method: "DELETE" });
      await loadState();
    });

    container.append(item);
  });
}

function renderTransactions(transactions) {
  elements.transactionRows.replaceChildren();
  elements.transactionCount.textContent = `${transactions.length} lancamentos`;

  if (!transactions.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 9;
    cell.className = "empty";
    cell.textContent = "Nenhuma movimentacao encontrada para os filtros atuais.";
    row.append(cell);
    elements.transactionRows.append(row);
    return;
  }

  transactions.forEach((transaction) => {
    const row = document.createElement("tr");
    const flag = document.createElement("td");
    const date = document.createElement("td");
    const type = document.createElement("td");
    const category = document.createElement("td");
    const description = document.createElement("td");
    const amount = document.createElement("td");
    const payment = document.createElement("td");
    const enteredBy = document.createElement("td");
    const actions = document.createElement("td");
    const checkbox = document.createElement("input");
    const categorySelect = document.createElement("select");
    const paymentInput = document.createElement("input");
    const enteredByInput = document.createElement("input");
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
    type.textContent = transaction.movement_type === "income" ? "Entrada" : "Saida";
    fillCategorySelect(categorySelect, false);
    categorySelect.value = transaction.category;
    categorySelect.addEventListener("change", () => updateTransactionField(transaction.id, { category: categorySelect.value }));

    description.textContent = transaction.description;
    value.textContent = currency.format(transaction.amount);
    value.className = transaction.movement_type === "income" ? "income" : "expense";

    paymentInput.type = "text";
    paymentInput.value = transaction.payment_method || "";
    paymentInput.setAttribute("list", "paymentMethodsList");
    paymentInput.addEventListener("change", () => updateTransactionField(transaction.id, { payment_method: paymentInput.value }));

    enteredByInput.type = "text";
    enteredByInput.value = transaction.entered_by || "";
    enteredByInput.setAttribute("list", "enteredByList");
    enteredByInput.addEventListener("change", () => updateTransactionField(transaction.id, { entered_by: enteredByInput.value }));

    deleteButton.className = "delete-row ghost";
    deleteButton.type = "button";
    deleteButton.textContent = "Excluir";
    deleteButton.addEventListener("click", async () => {
      selectedTransactions.add(transaction.id);
      await deleteSelectedTransactions();
    });

    setCellLabel(flag, "Flag");
    setCellLabel(date, "Data");
    setCellLabel(type, "Tipo");
    setCellLabel(category, "Categoria");
    setCellLabel(description, "Descricao");
    setCellLabel(amount, "Valor");
    setCellLabel(payment, "Forma de pagamento");
    setCellLabel(enteredBy, "Pessoa que lancou");
    setCellLabel(actions, "Acao");

    flag.append(checkbox);
    category.append(categorySelect);
    amount.append(value);
    payment.append(paymentInput);
    enteredBy.append(enteredByInput);
    actions.append(deleteButton);
    row.append(flag, date, type, category, description, amount, payment, enteredBy, actions);
    elements.transactionRows.append(row);
  });
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
    const type = document.createElement("td");
    const category = document.createElement("td");
    const description = document.createElement("td");
    const amount = document.createElement("td");
    const payment = document.createElement("td");
    const enteredBy = document.createElement("td");
    const status = document.createElement("td");
    const checkbox = document.createElement("input");
    const categorySelect = document.createElement("select");
    const paymentInput = document.createElement("input");
    const enteredByInput = document.createElement("input");
    const value = document.createElement("strong");

    checkbox.type = "checkbox";
    checkbox.checked = transaction.selected;
    checkbox.disabled = transaction.duplicate;
    checkbox.addEventListener("change", () => {
      pendingImport[index].selected = checkbox.checked;
      renderImportPreview();
    });

    fillCategorySelect(categorySelect, false);
    categorySelect.value = transaction.category;
    categorySelect.disabled = transaction.duplicate;
    categorySelect.addEventListener("change", () => {
      pendingImport[index].category = categorySelect.value;
    });

    paymentInput.type = "text";
    paymentInput.value = transaction.payment_method || "";
    paymentInput.setAttribute("list", "paymentMethodsList");
    paymentInput.disabled = transaction.duplicate;
    paymentInput.addEventListener("change", () => {
      pendingImport[index].payment_method = paymentInput.value.trim();
    });

    enteredByInput.type = "text";
    enteredByInput.value = transaction.entered_by || "";
    enteredByInput.setAttribute("list", "enteredByList");
    enteredByInput.disabled = transaction.duplicate;
    enteredByInput.addEventListener("change", () => {
      pendingImport[index].entered_by = enteredByInput.value.trim();
    });

    date.textContent = formatDate(transaction.date);
    type.textContent = transaction.movement_type === "income" ? "Entrada" : "Saida";
    description.textContent = transaction.description;
    value.textContent = currency.format(transaction.amount);
    value.className = transaction.movement_type === "income" ? "income" : "expense";
    status.textContent = transaction.duplicate ? "Duplicado" : "Novo";

    setCellLabel(include, "Importar");
    setCellLabel(date, "Data");
    setCellLabel(type, "Tipo");
    setCellLabel(category, "Categoria");
    setCellLabel(description, "Descricao");
    setCellLabel(amount, "Valor");
    setCellLabel(payment, "Forma de pagamento");
    setCellLabel(enteredBy, "Pessoa");
    setCellLabel(status, "Status");

    include.append(checkbox);
    category.append(categorySelect);
    amount.append(value);
    payment.append(paymentInput);
    enteredBy.append(enteredByInput);
    row.append(include, date, type, category, description, amount, payment, enteredBy, status);
    elements.previewRows.append(row);
  });
}

async function previewStatement(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (!elements.importEnteredBy.value.trim()) {
    alert("Informe quem esta realizando a importacao antes de abrir a previa.");
    event.target.value = "";
    return;
  }

  const content = await file.text();
  const result = await api("/api/preview", {
    method: "POST",
    body: JSON.stringify({
      filename: file.name,
      content,
      entered_by: elements.importEnteredBy.value.trim(),
      payment_method: elements.importPaymentMethod.value.trim(),
    }),
  });

  pendingImport = result.transactions.map((transaction) => ({
    ...transaction,
    selected: !transaction.duplicate,
  }));

  renderImportPreview();
  event.target.value = "";
}

async function confirmImport() {
  const transactions = pendingImport
    .filter((transaction) => transaction.selected && !transaction.duplicate)
    .map(({ duplicate, selected, ...transaction }) => transaction);

  if (!transactions.length) return;

  if (transactions.some((transaction) => !transaction.entered_by || !transaction.payment_method)) {
    alert("Todas as linhas selecionadas precisam ter forma de pagamento e pessoa responsavel.");
    return;
  }

  const result = await api("/api/import", {
    method: "POST",
    body: JSON.stringify({ transactions }),
  });

  clearImportPreview();
  await loadState();

  if (!result.imported) {
    alert("Nenhuma movimentacao nova foi adicionada.");
  } else {
    alert(`${result.imported} movimentacao(oes) adicionada(s) com sucesso.`);
  }
}

function clearImportPreview() {
  pendingImport = [];
  elements.importPreviewPanel.hidden = true;
  elements.previewRows.replaceChildren();
  elements.previewSummary.textContent = "";
}

async function addManualTransaction(event) {
  event.preventDefault();

  await api("/api/transactions", {
    method: "POST",
    body: JSON.stringify({
      date: elements.manualDate.value,
      movement_type: elements.manualType.value,
      category: elements.manualCategory.value,
      description: elements.manualDescription.value,
      amount: elements.manualAmount.value,
      payment_method: elements.manualPaymentMethod.value,
      entered_by: elements.manualEnteredBy.value,
      source: "manual",
    }),
  });

  elements.manualDescription.value = "";
  elements.manualAmount.value = "";
  await loadState();
}

async function saveCategoryGoal(event) {
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

async function saveNamedGoal(event) {
  event.preventDefault();

  const payload = {
    name: elements.namedGoalName.value.trim(),
    target_amount: Number(elements.namedGoalTarget.value),
    current_amount: Number(elements.namedGoalCurrent.value),
    deadline: elements.namedGoalDeadline.value || null,
    notes: elements.namedGoalNotes.value.trim(),
  };

  if (!payload.name || !Number.isFinite(payload.target_amount) || payload.target_amount < 0 || !Number.isFinite(payload.current_amount) || payload.current_amount < 0) {
    return;
  }

  if (editingNamedGoalId) {
    await api(`/api/named-goals/${encodeURIComponent(editingNamedGoalId)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  } else {
    await api("/api/named-goals", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  resetNamedGoalForm();
  await loadState();
}

function populateNamedGoalForm(goal) {
  editingNamedGoalId = goal.id;
  elements.namedGoalId.value = goal.id;
  elements.namedGoalName.value = goal.name;
  elements.namedGoalTarget.value = goal.target_amount;
  elements.namedGoalCurrent.value = goal.current_amount;
  elements.namedGoalDeadline.value = goal.deadline || "";
  elements.namedGoalNotes.value = goal.notes || "";
  elements.cancelNamedGoalEdit.hidden = false;
  setCurrentPage("goals");
  elements.namedGoalName.focus();
}

function resetNamedGoalForm() {
  editingNamedGoalId = "";
  elements.namedGoalForm.reset();
  elements.namedGoalId.value = "";
  elements.cancelNamedGoalEdit.hidden = true;
}

async function saveSettings(event) {
  event.preventDefault();

  await api("/api/settings", {
    method: "PUT",
    body: JSON.stringify({
      default_entered_by: elements.settingsDefaultEnteredBy.value,
      default_payment_method: elements.settingsDefaultPaymentMethod.value,
      default_period_preset: elements.settingsDefaultPeriodPreset.value,
    }),
  });

  localStorage.removeItem("periodStart");
  localStorage.removeItem("periodEnd");
  await loadState();
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

async function resetSystemData() {
  if (!confirm("Deseja apagar lancamentos, metas por categoria e metas nomeadas do sistema?")) return;
  await api("/api/state", { method: "DELETE" });
  pendingImport = [];
  selectedTransactions.clear();
  await loadState();
}

function selectTransactionType(event) {
  transactionType = event.currentTarget.dataset.type;
  elements.typeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.type === transactionType);
  });
  selectedTransactions.clear();
  render();
}

function updateDeleteButton() {
  const count = selectedTransactions.size;
  elements.clearButton.disabled = count === 0;
  elements.clearButton.textContent = count ? `Excluir selecionados (${count})` : "Excluir selecionados";
}

async function deleteSelectedTransactions() {
  const ids = [...selectedTransactions];
  if (!ids.length) return;
  if (!confirm(`Deseja excluir ${ids.length} lancamento(s) selecionado(s)?`)) return;

  await Promise.all(ids.map((id) => api(`/api/transactions/${encodeURIComponent(id)}`, { method: "DELETE" })));
  selectedTransactions.clear();
  await loadState();
}

async function updateTransactionField(id, payload) {
  await api(`/api/transactions/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  await loadState();
}

function expensesByCategory(transactions) {
  return transactions.reduce((totals, item) => {
    if (item.movement_type === "expense") {
      totals[item.category] = (totals[item.category] || 0) + Math.abs(item.amount);
    }
    return totals;
  }, {});
}

function sumAmounts(items) {
  return items.reduce((total, item) => total + Number(item.amount), 0);
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
    throw new Error("Senha invalida ou ausente.");
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

function setCellLabel(cell, label) {
  cell.dataset.label = label;
}

init();
