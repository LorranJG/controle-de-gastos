const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dateFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

let state = {
  categories: [],
  transactions: [],
  goals: {},
  monthlyGoals: [],
  namedGoals: [],
  debts: [],
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
let editingDebtId = "";
const selectedTransactions = new Set();
const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Marco",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];
const pageMeta = {
  dashboard: { title: "Dashboard", eyebrow: "Visao geral" },
  transactions: { title: "Movimentacoes", eyebrow: "Lancamentos e filtros" },
  debts: { title: "Dividas", eyebrow: "Acompanhamento de saldo e juros" },
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
  goalMonth: document.querySelector("#goalMonth"),
  goalYear: document.querySelector("#goalYear"),
  dashboardYear: document.querySelector("#dashboardYear"),
  dashboardMonth: document.querySelector("#dashboardMonth"),
  dashboardCategory: document.querySelector("#dashboardCategory"),
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
  settingsTheme: document.querySelector("#settingsTheme"),
  exportButton: document.querySelector("#exportButton"),
  resetDataButton: document.querySelector("#resetDataButton"),
  monthlySpentTotal: document.querySelector("#monthlySpentTotal"),
  monthlyGoalTotal: document.querySelector("#monthlyGoalTotal"),
  monthlyDifferenceTotal: document.querySelector("#monthlyDifferenceTotal"),
  monthlyUsagePercent: document.querySelector("#monthlyUsagePercent"),
  monthlyTableSummary: document.querySelector("#monthlyTableSummary"),
  monthlyCategoryRows: document.querySelector("#monthlyCategoryRows"),
  categoryChart: document.querySelector("#categoryChart"),
  annualSummary: document.querySelector("#annualSummary"),
  annualGoalTotal: document.querySelector("#annualGoalTotal"),
  annualSpentTotal: document.querySelector("#annualSpentTotal"),
  annualBalanceTotal: document.querySelector("#annualBalanceTotal"),
  annualProjection: document.querySelector("#annualProjection"),
  annualOverMonths: document.querySelector("#annualOverMonths"),
  annualUnderMonths: document.querySelector("#annualUnderMonths"),
  monthlyComparisonChart: document.querySelector("#monthlyComparisonChart"),
  cumulativeChart: document.querySelector("#cumulativeChart"),
  goalSummary: document.querySelector("#goalSummary"),
  categoryList: document.querySelector("#categoryList"),
  debtSummary: document.querySelector("#debtSummary"),
  dashboardDebts: document.querySelector("#dashboardDebts"),
  namedGoalSummary: document.querySelector("#namedGoalSummary"),
  dashboardNamedGoals: document.querySelector("#dashboardNamedGoals"),
  goalsPageSummary: document.querySelector("#goalsPageSummary"),
  namedGoalList: document.querySelector("#namedGoalList"),
  debtForm: document.querySelector("#debtForm"),
  debtId: document.querySelector("#debtId"),
  debtName: document.querySelector("#debtName"),
  debtCreditor: document.querySelector("#debtCreditor"),
  debtOriginalAmount: document.querySelector("#debtOriginalAmount"),
  debtCurrentBalance: document.querySelector("#debtCurrentBalance"),
  debtInterestRate: document.querySelector("#debtInterestRate"),
  debtMinimumPayment: document.querySelector("#debtMinimumPayment"),
  debtDueDay: document.querySelector("#debtDueDay"),
  debtStatus: document.querySelector("#debtStatus"),
  debtNotes: document.querySelector("#debtNotes"),
  cancelDebtEdit: document.querySelector("#cancelDebtEdit"),
  debtTotal: document.querySelector("#debtTotal"),
  debtInterestTotal: document.querySelector("#debtInterestTotal"),
  debtMinimumTotal: document.querySelector("#debtMinimumTotal"),
  debtActiveCount: document.querySelector("#debtActiveCount"),
  debtsPageSummary: document.querySelector("#debtsPageSummary"),
  debtList: document.querySelector("#debtList"),
  transactionRows: document.querySelector("#transactionRows"),
  transactionCount: document.querySelector("#transactionCount"),
  enteredByList: document.querySelector("#enteredByList"),
  paymentMethodsList: document.querySelector("#paymentMethodsList"),
  categoriesList: document.querySelector("#categoriesList"),
  categoryTemplate: document.querySelector("#categoryTemplate"),
  namedGoalTemplate: document.querySelector("#namedGoalTemplate"),
  debtTemplate: document.querySelector("#debtTemplate"),
};

async function init() {
  applyTheme(localStorage.getItem("theme") || "light");
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
  elements.dashboardYear.addEventListener("change", syncDashboardPeriod);
  elements.dashboardMonth.addEventListener("change", syncDashboardPeriod);
  elements.dashboardCategory.addEventListener("change", render);
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
  elements.debtForm.addEventListener("submit", saveDebt);
  elements.cancelDebtEdit.addEventListener("click", resetDebtForm);
  elements.transactionForm.addEventListener("submit", addManualTransaction);
  elements.settingsForm.addEventListener("submit", saveSettings);
  elements.settingsTheme.addEventListener("change", () => applyTheme(elements.settingsTheme.value));
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
    monthlyGoals: [],
    namedGoals: [],
    debts: [],
    settings: { default_entered_by: "", default_payment_method: "", default_period_preset: "month" },
  };
  pendingImport = [];
  editingDebtId = "";
  editingNamedGoalId = "";
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
  fillPeriodSelects();
  fillCategorySelect(elements.manualCategory, false);
  fillCategoryDataList();
  fillDashboardFilters();
  fillTransactionFilters();
  fillDataLists();
  fillSettingsForm();
  fillDefaultsFromSettings();
  render();
}

function fillPeriodSelects() {
  const now = new Date();
  const transactionYears = state.transactions.map((item) => Number(item.date.slice(0, 4)));
  const goalYears = state.monthlyGoals.map((goal) => goal.year);
  const years = [...new Set([now.getFullYear(), ...transactionYears, ...goalYears])]
    .filter(Number.isFinite)
    .sort((a, b) => b - a);
  const yearOptions = years.map((year) => {
    const option = document.createElement("option");
    option.value = String(year);
    option.textContent = String(year);
    return option;
  });
  const monthOptions = MONTHS.map((month, index) => {
    const option = document.createElement("option");
    option.value = String(index + 1);
    option.textContent = month;
    return option;
  });

  elements.dashboardYear.replaceChildren(...yearOptions.map((option) => option.cloneNode(true)));
  elements.goalYear.replaceChildren(...yearOptions.map((option) => option.cloneNode(true)));
  elements.dashboardMonth.replaceChildren(...monthOptions.map((option) => option.cloneNode(true)));
  elements.goalMonth.replaceChildren(...monthOptions.map((option) => option.cloneNode(true)));

  const savedYear = localStorage.getItem("dashboardYear") || String(now.getFullYear());
  const savedMonth = localStorage.getItem("dashboardMonth") || String(now.getMonth() + 1);
  elements.dashboardYear.value = years.includes(Number(savedYear)) ? savedYear : String(now.getFullYear());
  elements.dashboardMonth.value = savedMonth;
  elements.goalYear.value = elements.dashboardYear.value;
  elements.goalMonth.value = elements.dashboardMonth.value;
}

function fillDashboardFilters() {
  fillSelectWithValues(elements.dashboardCategory, ["", ...state.categories], "Todas");
}

function syncDashboardPeriod() {
  localStorage.setItem("dashboardYear", elements.dashboardYear.value);
  localStorage.setItem("dashboardMonth", elements.dashboardMonth.value);
  elements.goalYear.value = elements.dashboardYear.value;
  elements.goalMonth.value = elements.dashboardMonth.value;
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

function fillCategoryDataList() {
  elements.categoriesList.replaceChildren(...state.categories.map((category) => {
    const option = document.createElement("option");
    option.value = category;
    return option;
  }));
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
  elements.settingsTheme.value = localStorage.getItem("theme") || "light";
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
  const dashboardTransactions = dashboardFilteredTransactions();
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

  renderMetrics(dashboardTransactions);
  renderTypeTotals(dashboardTransactions);
  renderCategoryGoals(dashboardTransactions);
  renderMonthlyCategoryTable(dashboardTransactions);
  renderCategoryChart(dashboardTransactions);
  renderAnnualDashboard();
  renderNamedGoals();
  renderDebts();
  renderTransactions(filteredTransactions);
  updateDeleteButton();
}

function dashboardFilteredTransactions() {
  const year = selectedDashboardYear();
  const month = selectedDashboardMonth();
  return state.transactions
    .filter((item) => item.date.startsWith(`${year}-${String(month).padStart(2, "0")}`))
    .filter((item) => !elements.dashboardCategory.value || item.category === elements.dashboardCategory.value);
}

function transactionsInPeriod(transactions) {
  const start = elements.periodStart.value || "0000-01-01";
  const end = elements.periodEnd.value || "9999-12-31";
  return transactions.filter((item) => item.date >= start && item.date <= end);
}

function renderMetrics(transactions) {
  const expenses = Math.abs(sumAmounts(transactions.filter((item) => item.movement_type === "expense")));
  const monthlyGoal = sumMonthlyGoals(selectedDashboardYear(), selectedDashboardMonth(), elements.dashboardCategory.value);
  const difference = monthlyGoal - expenses;
  const usage = monthlyGoal > 0 ? (expenses / monthlyGoal) * 100 : 0;

  elements.monthlySpentTotal.textContent = currency.format(expenses);
  elements.monthlyGoalTotal.textContent = currency.format(monthlyGoal);
  elements.monthlyDifferenceTotal.textContent = currency.format(difference);
  elements.monthlyDifferenceTotal.className = difference >= 0 ? "income" : "expense";
  elements.monthlyUsagePercent.textContent = monthlyGoal > 0 ? `${Math.round(usage)}%` : "Sem meta";
  elements.monthlyUsagePercent.className = goalStatusClass(expenses, monthlyGoal);
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
  const year = selectedDashboardYear();
  const month = selectedDashboardMonth();
  const trackedCategories = monthlyCategories(totals, year, month);

  elements.categoryList.replaceChildren();
  elements.goalSummary.textContent = `${MONTHS[month - 1]} de ${year}`;

  if (!trackedCategories.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "Cadastre um limite por categoria para acompanhar o consumo do periodo.";
    elements.categoryList.append(empty);
    return;
  }

  trackedCategories.forEach((category) => {
    const item = elements.categoryTemplate.content.firstElementChild.cloneNode(true);
    const spent = totals[category] || 0;
    const goal = monthlyGoalFor(category, year, month);
    const percent = goal > 0 ? Math.min((spent / goal) * 100, 100) : 0;
    const heading = item.querySelector(".category-heading");
    const footer = item.querySelector(".category-footer");
    const bar = item.querySelector(".progress-bar");
    const remove = item.querySelector("button");

    heading.querySelector("strong").textContent = category;
    heading.querySelector("span").textContent = goal > 0 ? `${Math.round(percent)}%` : "sem limite";
    footer.querySelector("span").textContent = `${currency.format(spent)} de ${goal > 0 ? currency.format(goal) : "limite nao definido"}`;
    bar.style.width = `${percent}%`;
    bar.classList.toggle("warn", goalStatusClass(spent, goal) === "warn");
    bar.classList.toggle("danger", goalStatusClass(spent, goal) === "danger");
    remove.hidden = goal <= 0;
    remove.addEventListener("click", async () => {
      await api(`/api/goals/${encodeURIComponent(category)}?year=${year}&month=${month}`, { method: "DELETE" });
      await loadState();
    });

    elements.categoryList.append(item);
  });
}

function renderMonthlyCategoryTable(transactions) {
  const totals = expensesByCategory(transactions);
  const year = selectedDashboardYear();
  const month = selectedDashboardMonth();
  const rows = monthlyCategories(totals, year, month);

  elements.monthlyCategoryRows.replaceChildren();
  elements.monthlyTableSummary.textContent = `${rows.length} categorias analisadas`;

  if (!rows.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 6;
    cell.className = "empty";
    cell.textContent = "Nenhuma categoria com gasto ou meta para o periodo.";
    row.append(cell);
    elements.monthlyCategoryRows.append(row);
    return;
  }

  rows.forEach((category) => {
    const spent = totals[category] || 0;
    const goal = monthlyGoalFor(category, year, month);
    const difference = goal - spent;
    const usage = goal > 0 ? (spent / goal) * 100 : 0;
    const status = goalStatus(spent, goal);
    const row = document.createElement("tr");
    const cells = [
      category,
      currency.format(goal),
      currency.format(spent),
      currency.format(difference),
      goal > 0 ? `${Math.round(usage)}%` : "Sem meta",
      status.label,
    ];

    cells.forEach((value, index) => {
      const cell = document.createElement("td");
      cell.textContent = value;
      cell.dataset.label = ["Categoria", "Meta mensal", "Gasto realizado", "Diferenca", "Uso", "Status"][index];
      if (index === 5) cell.className = `status-text ${status.className}`;
      row.append(cell);
    });
    elements.monthlyCategoryRows.append(row);
  });
}

function renderCategoryChart(transactions) {
  const totals = expensesByCategory(transactions);
  const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...entries.map(([, value]) => value), 1);

  elements.categoryChart.replaceChildren();
  if (!entries.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "Nenhum gasto no periodo selecionado.";
    elements.categoryChart.append(empty);
    return;
  }

  entries.forEach(([category, value]) => {
    elements.categoryChart.append(createChartRow(category, currency.format(value), (value / max) * 100, "ok"));
  });
}

function renderAnnualDashboard() {
  const year = selectedDashboardYear();
  const category = elements.dashboardCategory.value;
  const months = Array.from({ length: 12 }, (_, index) => monthlySummary(year, index + 1, category));
  const now = new Date();
  const elapsedLimit = year < now.getFullYear() ? 12 : year > now.getFullYear() ? 0 : now.getMonth() + 1;
  const elapsedMonths = months.filter((item) => item.month <= elapsedLimit && (item.spent > 0 || item.goal > 0));
  const annualGoal = months.reduce((total, item) => total + item.goal, 0);
  const annualSpent = months.reduce((total, item) => total + item.spent, 0);
  const remaining = annualGoal - annualSpent;
  const overMonths = elapsedMonths.filter((item) => item.goal > 0 && item.spent > item.goal).length;
  const underMonths = elapsedMonths.filter((item) => item.goal > 0 && item.spent <= item.goal).length;
  const averageSpent = elapsedMonths.length ? annualSpent / elapsedMonths.length : 0;
  const projectedSpent = averageSpent * 12;
  const projectionOver = annualGoal > 0 && projectedSpent > annualGoal;

  elements.annualSummary.textContent = `${year}${category ? ` - ${category}` : ""}`;
  elements.annualGoalTotal.textContent = currency.format(annualGoal);
  elements.annualSpentTotal.textContent = currency.format(annualSpent);
  elements.annualBalanceTotal.textContent = currency.format(remaining);
  elements.annualBalanceTotal.className = remaining >= 0 ? "income" : "expense";
  elements.annualProjection.textContent = annualGoal > 0
    ? `${projectionOver ? "Ultrapassa" : "Dentro"} (${currency.format(projectedSpent)})`
    : "Sem meta";
  elements.annualProjection.className = projectionOver ? "expense" : "income";
  elements.annualOverMonths.textContent = `${overMonths} meses com estouro`;
  elements.annualUnderMonths.textContent = `${underMonths} meses com economia`;

  renderMonthlyComparisonChart(months);
  renderCumulativeChart(months);
}

function renderNamedGoals() {
  renderNamedGoalContainer(elements.dashboardNamedGoals, state.namedGoals.slice(0, 4), true);
  renderNamedGoalContainer(elements.namedGoalList, state.namedGoals, false);
  elements.namedGoalSummary.textContent = `${state.namedGoals.length} metas ativas`;
  elements.goalsPageSummary.textContent = `${state.namedGoals.length} metas cadastradas`;
}

function renderDebts() {
  const activeDebts = state.debts.filter((debt) => debt.status !== "paid");
  const total = sumDebtField(activeDebts, "current_balance");
  const estimatedInterest = activeDebts.reduce((sum, debt) => sum + debt.current_balance * (debt.interest_rate / 100), 0);
  const minimumPayments = sumDebtField(activeDebts, "minimum_payment");

  elements.debtSummary.textContent = `${activeDebts.length} ativas, ${currency.format(total)} em aberto`;
  elements.debtTotal.textContent = currency.format(total);
  elements.debtInterestTotal.textContent = currency.format(estimatedInterest);
  elements.debtMinimumTotal.textContent = currency.format(minimumPayments);
  elements.debtActiveCount.textContent = String(activeDebts.length);
  elements.debtsPageSummary.textContent = `${state.debts.length} dividas cadastradas`;

  renderDebtContainer(elements.dashboardDebts, activeDebts.slice(0, 3), true);
  renderDebtContainer(elements.debtList, state.debts, false);
}

function renderDebtContainer(container, debts, compact) {
  container.replaceChildren();

  if (!debts.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = compact
      ? "As dividas ativas aparecem aqui assim que forem cadastradas."
      : "Cadastre uma divida para acompanhar saldo, juros e vencimento.";
    container.append(empty);
    return;
  }

  debts.forEach((debt) => {
    const item = elements.debtTemplate.content.firstElementChild.cloneNode(true);
    const paid = Math.max(debt.original_amount - debt.current_balance, 0);
    const progress = debt.original_amount > 0 ? Math.min((paid / debt.original_amount) * 100, 100) : 0;
    const monthlyInterest = debt.current_balance * (debt.interest_rate / 100);

    item.querySelector("strong").textContent = debt.name;
    item.querySelector(".debt-creditor").textContent = debt.creditor || "Sem credor informado";
    item.querySelector(".debt-status").textContent = debt.status === "paid" ? "Quitada" : "Ativa";
    item.querySelector(".debt-status").classList.toggle("paid", debt.status === "paid");
    item.querySelector(".progress-bar").style.width = `${progress}%`;
    item.querySelector(".debt-balance").textContent = `Saldo: ${currency.format(debt.current_balance)}`;
    item.querySelector(".debt-interest").textContent = `Juros: ${formatPercent(debt.interest_rate)} a.m. (${currency.format(monthlyInterest)})`;
    item.querySelector(".debt-payment").textContent = `Minimo: ${currency.format(debt.minimum_payment)}`;
    item.querySelector(".debt-due-day").textContent = debt.due_day ? `Vence dia ${debt.due_day}` : "Sem vencimento";
    item.querySelector(".debt-notes").textContent = debt.notes || "Sem observacoes.";

    item.querySelector('[data-action="edit"]').addEventListener("click", () => populateDebtForm(debt));
    item.querySelector('[data-action="delete"]').addEventListener("click", async () => {
      if (!confirm(`Deseja excluir a divida "${debt.name}"?`)) return;
      await api(`/api/debts/${encodeURIComponent(debt.id)}`, { method: "DELETE" });
      await loadState();
    });

    container.append(item);
  });
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

  try {
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
  } catch (error) {
    if (!error.alreadyShown) alert(error.message || "Nao foi possivel ler o arquivo.");
  } finally {
    event.target.value = "";
  }
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

  try {
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
  } catch (error) {
    if (!error.alreadyShown) alert(error.message || "Nao foi possivel importar as movimentacoes.");
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
  const category = elements.goalCategory.value.trim();
  const amount = Number(elements.goalAmount.value);
  const year = Number(elements.goalYear.value);
  const month = Number(elements.goalMonth.value);
  if (!category || !Number.isFinite(amount) || amount < 0 || !Number.isInteger(year) || !Number.isInteger(month)) return;

  await api(`/api/goals/${encodeURIComponent(category)}`, {
    method: "PUT",
    body: JSON.stringify({ amount, year, month }),
  });

  elements.goalCategory.value = "";
  elements.goalAmount.value = "";
  await loadState();
}

async function saveDebt(event) {
  event.preventDefault();

  const payload = {
    name: elements.debtName.value.trim(),
    creditor: elements.debtCreditor.value.trim(),
    original_amount: Number(elements.debtOriginalAmount.value),
    current_balance: Number(elements.debtCurrentBalance.value),
    interest_rate: Number(elements.debtInterestRate.value || 0),
    minimum_payment: Number(elements.debtMinimumPayment.value || 0),
    due_day: elements.debtDueDay.value ? Number(elements.debtDueDay.value) : null,
    status: elements.debtStatus.value,
    notes: elements.debtNotes.value.trim(),
  };

  if (!payload.name || !Number.isFinite(payload.original_amount) || payload.original_amount < 0 || !Number.isFinite(payload.current_balance) || payload.current_balance < 0) {
    return;
  }

  if (payload.due_day !== null && (!Number.isInteger(payload.due_day) || payload.due_day < 1 || payload.due_day > 31)) {
    return;
  }

  if (editingDebtId) {
    await api(`/api/debts/${encodeURIComponent(editingDebtId)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  } else {
    await api("/api/debts", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  resetDebtForm();
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

function populateDebtForm(debt) {
  editingDebtId = debt.id;
  elements.debtId.value = debt.id;
  elements.debtName.value = debt.name;
  elements.debtCreditor.value = debt.creditor || "";
  elements.debtOriginalAmount.value = debt.original_amount;
  elements.debtCurrentBalance.value = debt.current_balance;
  elements.debtInterestRate.value = debt.interest_rate;
  elements.debtMinimumPayment.value = debt.minimum_payment;
  elements.debtDueDay.value = debt.due_day || "";
  elements.debtStatus.value = debt.status || "active";
  elements.debtNotes.value = debt.notes || "";
  elements.cancelDebtEdit.hidden = false;
  setCurrentPage("debts");
  elements.debtName.focus();
}

function resetDebtForm() {
  editingDebtId = "";
  elements.debtForm.reset();
  elements.debtId.value = "";
  elements.cancelDebtEdit.hidden = true;
}

async function saveSettings(event) {
  event.preventDefault();
  applyTheme(elements.settingsTheme.value);

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

function applyTheme(theme) {
  const selected = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = selected;
  localStorage.setItem("theme", selected);
  if (elements.settingsTheme) elements.settingsTheme.value = selected;
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
  if (!confirm("Deseja apagar lancamentos, limites de gastos, metas e dividas do sistema?")) return;
  await api("/api/state", { method: "DELETE" });
  pendingImport = [];
  editingDebtId = "";
  editingNamedGoalId = "";
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

function selectedDashboardYear() {
  return Number(elements.dashboardYear.value) || new Date().getFullYear();
}

function selectedDashboardMonth() {
  return Number(elements.dashboardMonth.value) || new Date().getMonth() + 1;
}

function monthlyGoalFor(category, year, month) {
  const monthlyGoal = state.monthlyGoals.find((goal) => goal.category === category && goal.year === year && goal.month === month);
  return monthlyGoal ? monthlyGoal.amount : Number(state.goals[category] || 0);
}

function sumMonthlyGoals(year, month, category = "") {
  const categories = category
    ? [category]
    : [...new Set([...state.categories, ...state.monthlyGoals.map((goal) => goal.category)])];
  return categories.reduce((total, item) => total + monthlyGoalFor(item, year, month), 0);
}

function monthlyCategories(totals, year, month) {
  return [...new Set([
    ...Object.keys(totals),
    ...state.monthlyGoals.filter((goal) => goal.year === year && goal.month === month).map((goal) => goal.category),
    ...Object.keys(state.goals),
  ])]
    .filter((category) => !elements.dashboardCategory.value || category === elements.dashboardCategory.value)
    .sort((a, b) => a.localeCompare(b));
}

function monthlySummary(year, month, category = "") {
  const transactions = state.transactions
    .filter((item) => item.movement_type === "expense")
    .filter((item) => item.date.startsWith(`${year}-${String(month).padStart(2, "0")}`))
    .filter((item) => !category || item.category === category);

  return {
    month,
    goal: sumMonthlyGoals(year, month, category),
    spent: Math.abs(sumAmounts(transactions)),
  };
}

function goalStatus(spent, goal) {
  if (goal <= 0) return { label: "Sem meta", className: "muted" };
  if (spent > goal) return { label: "Ultrapassado", className: "danger" };
  if (spent >= goal * 0.85) return { label: "Proximo do limite", className: "warn" };
  return { label: "Dentro da meta", className: "ok" };
}

function goalStatusClass(spent, goal) {
  return goalStatus(spent, goal).className;
}

function createChartRow(label, value, percent, statusClass) {
  const row = document.createElement("div");
  row.className = "chart-row";
  const meta = document.createElement("div");
  const name = document.createElement("strong");
  const amount = document.createElement("span");
  const track = document.createElement("div");
  const bar = document.createElement("div");

  meta.className = "chart-row-meta";
  name.textContent = label;
  amount.textContent = value;
  track.className = "chart-track";
  bar.className = `chart-bar ${statusClass}`;
  bar.style.width = `${Math.min(Math.max(percent, 2), 100)}%`;

  meta.append(name, amount);
  track.append(bar);
  row.append(meta, track);
  return row;
}

function renderMonthlyComparisonChart(months) {
  const max = Math.max(...months.flatMap((item) => [item.goal, item.spent]), 1);
  elements.monthlyComparisonChart.replaceChildren();
  months.forEach((item) => {
    const status = goalStatusClass(item.spent, item.goal);
    elements.monthlyComparisonChart.append(createDualChartRow(
      MONTHS[item.month - 1].slice(0, 3),
      currency.format(item.goal),
      currency.format(item.spent),
      (item.goal / max) * 100,
      (item.spent / max) * 100,
      status,
    ));
  });
}

function renderCumulativeChart(months) {
  let goalTotal = 0;
  let spentTotal = 0;
  const cumulative = months.map((item) => {
    goalTotal += item.goal;
    spentTotal += item.spent;
    return { month: item.month, goal: goalTotal, spent: spentTotal };
  });
  const max = Math.max(...cumulative.flatMap((item) => [item.goal, item.spent]), 1);
  elements.cumulativeChart.replaceChildren();
  cumulative.forEach((item) => {
    elements.cumulativeChart.append(createDualChartRow(
      `${MONTHS[item.month - 1].slice(0, 3)} acum.`,
      currency.format(item.goal),
      currency.format(item.spent),
      (item.goal / max) * 100,
      (item.spent / max) * 100,
      item.spent > item.goal ? "danger" : "ok",
    ));
  });
}

function createDualChartRow(label, goalLabel, spentLabel, goalPercent, spentPercent, statusClass) {
  const row = document.createElement("div");
  row.className = "dual-chart-row";
  const title = document.createElement("strong");
  const bars = document.createElement("div");
  const goal = document.createElement("div");
  const spent = document.createElement("div");

  title.textContent = label;
  bars.className = "dual-chart-bars";
  goal.className = "chart-track goal-track";
  spent.className = "chart-track";
  goal.innerHTML = `<div class="chart-bar plan" style="width:${Math.min(Math.max(goalPercent, 2), 100)}%"></div><span>${goalLabel}</span>`;
  spent.innerHTML = `<div class="chart-bar ${statusClass}" style="width:${Math.min(Math.max(spentPercent, 2), 100)}%"></div><span>${spentLabel}</span>`;
  bars.append(goal, spent);
  row.append(title, bars);
  return row;
}

function sumAmounts(items) {
  return items.reduce((total, item) => total + Number(item.amount), 0);
}

function sumDebtField(debts, field) {
  return debts.reduce((total, debt) => total + Number(debt[field] || 0), 0);
}

function formatPercent(value) {
  return `${Number(value || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
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
  const apiError = new Error(error.error || response.statusText);
  apiError.alreadyShown = true;
  alert(apiError.message || "Erro inesperado.");
  throw apiError;
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
