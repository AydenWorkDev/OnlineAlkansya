// Online Alkansya - simple expense tracker
// All data is saved in the browser using localStorage.
// NOTE: passwords are saved as plain text to keep this project simple.
// A real website must never do this (it needs a server and hashed passwords).

// ---------- variables ----------
var users = [];            // list of all accounts
var currentUser = null;    // the user who is logged in
var transactions = [];     // transactions of the logged in user
var goals = [];            // things the user wants to buy (savings goals)
var mode = "login";        // "login" or "signup"
var type = "income";       // selected type in the add form
var filter = "all";        // all, income or expense
var resetStep = 1;         // step of the forgot password form

var categories = {
  income: ["Allowance", "Part-time job", "Gift Money", "Scholarship", "Other"],
  expense: ["Food", "Transport", "Bills", "Clothing", "Mobile Load & internet", "Personal Needs", "Entertainment", "Other"]
};

var DEFAULT_MAX = 1000000;   // biggest amount for one entry (can be changed in Settings)

// short name for document.getElementById
function $(id) {
  return document.getElementById(id);
}

// make a new element with a class and some text
function makeEl(tag, className, text) {
  var el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

// ---------- save and load ----------
function loadUsers() {
  var saved = localStorage.getItem("alkansya_users");
  if (saved) {
    users = JSON.parse(saved);
  } else {
    users = [];
  }
}

function saveUsers() {
  localStorage.setItem("alkansya_users", JSON.stringify(users));
}

function loadTransactions() {
  var saved = localStorage.getItem("alkansya_tx_" + currentUser.email);
  if (saved) {
    transactions = JSON.parse(saved);
  } else {
    transactions = [];
  }
}

function saveTransactions() {
  localStorage.setItem("alkansya_tx_" + currentUser.email, JSON.stringify(transactions));
}

// find a user by email (returns null if not found)
function findUser(email) {
  for (var i = 0; i < users.length; i++) {
    if (users[i].email === email) {
      return users[i];
    }
  }
  return null;
}

function formatMoney(number) {
  return "₱" + Number(number).toLocaleString("en-PH", { maximumFractionDigits: 2 });
}

// ---------- home page (before login and signup) ----------
function showLanding() {
  $("appView").classList.add("hidden");
  $("authView").classList.add("hidden");
  $("landingView").classList.remove("hidden");
  window.scrollTo(0, 0);
}

// open the separate login or signup page
function openAuth(newMode) {
  $("landingView").classList.add("hidden");
  $("authView").classList.remove("hidden");
  showReset(false);
  setMode(newMode);
  window.scrollTo(0, 0);
}

// ---------- login and signup ----------
function setMode(newMode) {
  mode = newMode;
  var isSignup = (mode === "signup");

  $("tabLogin").className = isSignup ? "" : "active";
  $("tabSignup").className = isSignup ? "active" : "";

  // the button text and the Forgot password link
  $("authBtn").textContent = isSignup ? "Create account" : "Log in";
  $("forgotLink").classList.toggle("hidden", isSignup);   // only on Log in
  $("authMsg").textContent = "";

  // show the extra fields only when signing up
  var signupFields = ["name", "confirmBox"];
  for (var i = 0; i < signupFields.length; i++) {
    var field = $(signupFields[i]);
    if (field) {                                  // skip if the field is missing
      field.classList.toggle("hidden", !isSignup);
    }
  }
}

// show or hide the password (Show / Hide button)
function togglePassword(inputId, button) {
  var input = $(inputId);
  if (input.type === "password") {
    input.type = "text";
    button.textContent = "Hide";
  } else {
    input.type = "password";
    button.textContent = "Show";
  }
}

function showAuthMessage(text, good) {
  $("authMsg").textContent = text;
  $("authMsg").className = good ? "message ok" : "message";
}

function handleAuth(event) {
  event.preventDefault();
  var email = $("email").value.trim().toLowerCase();
  var password = $("password").value;

  if (mode === "signup") {
    var name = $("name").value.trim();

    if (name === "") {
      showAuthMessage("Please enter your name.");
      return;
    }
    if (password.length < 6) {
      showAuthMessage("Password must be at least 6 characters.");
      return;
    }
    if (password !== $("password2").value) {
      showAuthMessage("Passwords don’t match.");
      return;
    }
    if (findUser(email) !== null) {
      showAuthMessage("That email is already registered. Try logging in.");
      return;
    }

    var newUser = {
      name: name,
      email: email,
      password: password,
      joined: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    };
    users.push(newUser);
    saveUsers();

    // account created: clear the form and go back to the login tab
    $("authForm").reset();
    setMode("login");
    $("email").value = email;   // keep the email so they only type the password
    showAuthMessage("Account created! Please log in.", true);
  } else {
    var user = findUser(email);
    if (user === null || user.password !== password) {
      showAuthMessage("Incorrect email or password.");
      return;
    }
    startApp(user);
  }
}

// ---------- forgot password ----------
function showReset(on) {
  $("tabs").classList.toggle("hidden", on);
  $("authForm").classList.toggle("hidden", on);
  $("resetForm").classList.toggle("hidden", !on);

  // start again from step 1
  resetStep = 1;
  $("resetStep2").classList.add("hidden");
  $("resetEmail").readOnly = false;
  $("resetBtn").textContent = "Continue";
  $("resetMsg").textContent = "";
}

function handleReset(event) {
  event.preventDefault();
  var email = $("resetEmail").value.trim().toLowerCase();
  var user = findUser(email);

  if (user === null) {
    $("resetMsg").textContent = "No account found with that email.";
    return;
  }

  // step 1: ask for the full name on the account
  if (resetStep === 1) {
    $("resetQuestion").textContent = "To verify it’s you, enter the full name on this account.";
    $("resetStep2").classList.remove("hidden");
    $("resetEmail").readOnly = true;
    $("resetBtn").textContent = "Reset password";
    $("resetMsg").textContent = "";
    resetStep = 2;
    return;
  }

  // step 2: check the name and save the new password
  var enteredName = $("resetAnswer").value.trim().toLowerCase();
  var newPassword = $("resetPassword").value;

  if (enteredName !== user.name.toLowerCase()) {
    $("resetMsg").textContent = "That name doesn’t match this account.";
    return;
  }
  if (newPassword.length < 6) {
    $("resetMsg").textContent = "New password must be at least 6 characters.";
    return;
  }

  user.password = newPassword;
  saveUsers();
  $("resetForm").reset();
  showReset(false);
  setMode("login");
  $("email").value = email;
  showAuthMessage("Password updated. Please log in.", true);
}

// ---------- start and stop the app ----------
function startApp(user) {
  currentUser = user;
  localStorage.setItem("alkansya_loggedin", user.email);
  loadTransactions();
  loadGoals();

  $("userName").textContent = user.name;
  $("sideAvatar").textContent = user.name.charAt(0).toUpperCase();
  var hour = new Date().getHours();
  var hello = "Good evening, ";
  if (hour < 12) hello = "Good morning, ";
  else if (hour < 18) hello = "Good afternoon, ";
  $("greeting").textContent = hello + user.name.split(" ")[0];
  $("today").textContent = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric"
  });

  $("authForm").reset();
  $("authMsg").textContent = "";
  $("landingView").classList.add("hidden");
  $("authView").classList.add("hidden");
  $("appView").classList.remove("hidden");

  setType("income");
  $("weekInput").value = currentUser.weeklyBudget || "";
  setRange("all");
  showPage("dashboard");
  render();
}

function logout() {
  currentUser = null;
  transactions = [];
  goals = [];
  localStorage.removeItem("alkansya_loggedin");
  setMode("login");
  showLanding();   // after logout, go back to the home page
}

// ---------- transactions ----------
function setType(newType) {
  type = newType;
  $("btnIncome").className = (type === "income") ? "on-income" : "";
  $("btnExpense").className = (type === "expense") ? "on-expense" : "";
  $("addBtn").textContent = "Add " + type;

  // fill the category list for this type
  $("category").innerHTML = "";
  for (var i = 0; i < categories[type].length; i++) {
    var option = document.createElement("option");
    option.textContent = categories[type][i];
    $("category").appendChild(option);
  }
}

function addTransaction(event) {
  event.preventDefault();
  var description = $("desc").value.trim();
  var amount = Number($("amount").value);

  if (description === "" || amount <= 0) return;

  // limit 1: biggest amount for one entry
  var maxEntry = getMaxEntry();
  if (amount > maxEntry) {
    setMsg("txMsg", "The most you can enter in one entry is " + formatMoney(maxEntry) + ". You can change this in Settings.");
    return;
  }

  // limit 2: you can't spend more money than you have in the tracker
  if (type === "expense") {
    var available = getTotals().available;
    if (amount > available) {
      setMsg("txMsg", "Not enough money. You only have " + formatMoney(Math.max(0, available)) + " available. Add income first.");
      return;
    }
  }

  var newItem = {
    id: Date.now(),
    description: description,
    amount: amount,
    type: type,
    category: $("category").value,
    date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  };

  transactions.unshift(newItem);   // add to the top of the list
  saveTransactions();
  $("desc").value = "";
  $("amount").value = "";
  $("txMsg").textContent = "";
  render();
}

function deleteTransaction(id) {
  var kept = [];
  for (var i = 0; i < transactions.length; i++) {
    if (transactions[i].id !== id) {
      kept.push(transactions[i]);
    }
  }
  transactions = kept;
  saveTransactions();
  render();
}

function setFilter(newFilter) {
  filter = newFilter;
  $("fAll").className = (filter === "all") ? "chip active" : "chip";
  $("fIncome").className = (filter === "income") ? "chip active" : "chip";
  $("fExpense").className = (filter === "expense") ? "chip active" : "chip";
  render();
}

// ---------- show everything on the screen ----------
function render() {
  showSummary();
  showAllowance();
  showWeekly();
  showLimit();
  showBars();
  showList();
  showOverview();
  showProgress();
  showRecent();
}

function showSummary() {
  var totals = getTotals();
  $("income").textContent = formatMoney(totals.income);
  $("expense").textContent = formatMoney(totals.expense);
  $("saved").textContent = formatMoney(totals.saved);
  $("balance").textContent = formatMoney(totals.available);
}

// ---------- expense breakdown (donut chart + list) ----------
var categoryColors = {
  "Food": "#f59e0b",
  "Transport": "#0ea5e9",
  "Bills": "#8b5cf6",
  "Shopping": "#ec4899",
  "Health": "#12a566",
  "Other": "#94a3b8"
};
var range = "all";   // which time range the breakdown shows: week, month or all

function setRange(newRange) {
  range = newRange;
  $("rWeek").className = (range === "week") ? "chip active" : "chip";
  $("rMonth").className = (range === "month") ? "chip active" : "chip";
  $("rAll").className = (range === "all") ? "chip active" : "chip";
  showBars();
}

// is this transaction inside the chosen time range?
function inRange(t) {
  if (range === "all") return true;
  var date = txDate(t);
  var now = new Date();
  if (range === "week") {
    var start = startOfWeek(now);
    var end = new Date(start);
    end.setDate(end.getDate() + 7);
    return date >= start && date < end;
  }
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

function showBars() {
  var box = $("bars");
  box.innerHTML = "";

  // add up the expenses of each category
  var totals = {};
  var totalExpense = 0;
  for (var i = 0; i < transactions.length; i++) {
    var t = transactions[i];
    if (t.type === "expense" && inRange(t)) {
      var cat = t.category || "Other";
      totals[cat] = (totals[cat] || 0) + t.amount;
      totalExpense += t.amount;
    }
  }

  $("donutTotal").textContent = formatMoney(totalExpense);

  // put the categories in a list, biggest first
  var list = [];
  for (var name in totals) {
    list.push([name, totals[name]]);
  }
  list.sort(function (a, b) { return b[1] - a[1]; });

  if (list.length === 0) {
    $("donut").style.background = "#eef0f8";
    $("topCat").textContent = "";
    var label = (range === "week") ? "this week" : (range === "month") ? "this month" : "yet";
    box.appendChild(makeEl("p", "empty", "No expenses " + label + "."));
    return;
  }

  var stops = [];
  var start = 0;
  for (var k = 0; k < list.length; k++) {
    var percent = list[k][1] / totalExpense * 100;
    var color = categoryColors[list[k][0]] || "#94a3b8";
    stops.push(color + " " + start + "% " + (start + percent) + "%");
    start += percent;

    var row = makeEl("div", "bar-row");
    var top = makeEl("div", "top");
    var left = makeEl("span", "");
    var dot = makeEl("i", "dot");
    dot.style.background = color;
    left.appendChild(dot);
    left.appendChild(document.createTextNode(list[k][0]));
    top.appendChild(left);
    top.appendChild(makeEl("span", "", formatMoney(list[k][1]) + " (" + Math.round(percent) + "%)"));

    var bg = makeEl("div", "bar-bg");
    var fill = makeEl("div", "bar-fill");
    fill.style.width = percent + "%";
    fill.style.background = color;
    bg.appendChild(fill);

    row.appendChild(top);
    row.appendChild(bg);
    box.appendChild(row);
  }

  $("donut").style.background = "conic-gradient(" + stops.join(", ") + ")";
  $("topCat").textContent = "Biggest spending: " + list[0][0] + " (" + Math.round(list[0][1] / totalExpense * 100) + "%)";
}

function showList() {
  var list = $("list");
  list.innerHTML = "";
  var search = $("search").value.trim().toLowerCase();
  var shown = 0;

  for (var i = 0; i < transactions.length; i++) {
    var t = transactions[i];

    // skip items that don't match the filter or search
    if (filter !== "all" && t.type !== filter) continue;
    var text = (t.description + " " + (t.category || "")).toLowerCase();
    if (search !== "" && text.indexOf(search) === -1) continue;

    var isIncome = (t.type === "income");
    var cls = isIncome ? "in" : "out";

    var li = makeEl("li", "item");
    li.appendChild(makeEl("div", "arrow " + cls, isIncome ? "↑" : "↓"));

    var info = makeEl("div", "info");
    info.appendChild(makeEl("b", "", t.description));
    info.appendChild(makeEl("small", "", (t.category || "Other") + " • " + t.date));
    li.appendChild(info);

    li.appendChild(makeEl("div", "amount " + cls, (isIncome ? "+ " : "- ") + formatMoney(t.amount)));

    var del = makeEl("button", "delete", "×");
    del.type = "button";
    del.title = "Delete";
    del.onclick = makeDeleteHandler(t.id);
    li.appendChild(del);

    list.appendChild(li);
    shown++;
  }

  if (shown === 0) {
    list.appendChild(makeEl("li", "empty", "No transactions to show."));
  }
}

// returns a function that deletes one item (needed inside the loop)
function makeDeleteHandler(id) {
  return function () {
    deleteTransaction(id);
  };
}

// ---------- limits ----------
function getMaxEntry() {
  return currentUser.maxEntry || DEFAULT_MAX;
}

// total income and total expense of the user
function getTotals() {
  var income = 0;
  var expense = 0;
  for (var i = 0; i < transactions.length; i++) {
    if (transactions[i].type === "income") {
      income += transactions[i].amount;
    } else {
      expense += transactions[i].amount;
    }
  }
  // money set aside for goals is not available to spend
  var saved = 0;
  for (var j = 0; j < goals.length; j++) {
    saved += goals[j].saved;
  }
  return { income: income, expense: expense, saved: saved, available: income - expense - saved };
}

// The spending limit depends on the user's own money in the tracker:
// you can only spend what you have (income minus expenses).
function showLimit() {
  var totals = getTotals();
  var balance = totals.available;
  $("amount").max = getMaxEntry();
  $("limitText").textContent = formatMoney(Math.max(0, balance)) + " available";

  if (totals.income <= 0) {
    $("limitFill").style.width = "0%";
    $("limitFill").className = "limit-fill";
    $("limitNote").textContent = "Add income first. You can only spend the money you have in your tracker.";
    return;
  }

  var percent = Math.round((totals.expense + totals.saved) / totals.income * 100);
  var level = "limit-fill";
  var note = formatMoney(balance) + " left to spend (" + percent + "% of your income used).";

  if (percent >= 100) {
    level = "limit-fill full";
    note = "You have no money left to spend. Add income to spend more.";
  } else if (percent >= 80) {
    level = "limit-fill warn";
    note = "Careful! You already used " + percent + "% of your income. " + formatMoney(balance) + " left.";
  }

  $("limitFill").style.width = Math.min(percent, 100) + "%";
  $("limitFill").className = level;
  $("limitNote").textContent = note;
}

function saveLimits(event) {
  event.preventDefault();
  var max = Number($("setMax").value);

  if (!(max >= 1) || max > 100000000) {
    setMsg("limitMsg", "The max amount per entry must be between ₱1 and ₱100,000,000.");
    return;
  }

  currentUser.maxEntry = max;
  saveUsers();
  showLimit();
  fillSettingsDetails();
  setMsg("limitMsg", "Limit saved.", true);
}

// ---------- savings goals (things you want to buy) ----------
function loadGoals() {
  var saved = localStorage.getItem("alkansya_goals_" + currentUser.email);
  if (saved) {
    goals = JSON.parse(saved);
  } else {
    goals = [];
  }
}

function saveGoals() {
  localStorage.setItem("alkansya_goals_" + currentUser.email, JSON.stringify(goals));
}

function findGoal(id) {
  for (var i = 0; i < goals.length; i++) {
    if (goals[i].id === id) {
      return goals[i];
    }
  }
  return null;
}

function addGoal(event) {
  event.preventDefault();
  var name = $("goalName").value.trim();
  var target = Number($("goalTarget").value);

  if (name === "") {
    setMsg("goalMsg", "Please enter what you want to buy.");
    return;
  }
  if (!(target > 0) || target > 100000000) {
    setMsg("goalMsg", "The price must be between ₱1 and ₱100,000,000.");
    return;
  }

  goals.push({ id: Date.now(), name: name, target: target, saved: 0 });
  saveGoals();
  $("goalForm").reset();
  setMsg("goalMsg", "Goal added. Start saving for it below!", true);
  render();
  showGoals();
}

// put some of your available money into a goal
function addSavings(id, input, msgBox) {
  var goal = findGoal(id);
  var amount = Number(input.value);
  var available = getTotals().available;
  var stillNeeded = goal.target - goal.saved;

  msgBox.className = "message";
  if (!(amount > 0)) {
    msgBox.textContent = "Enter the amount you want to save.";
    return;
  }
  if (amount > stillNeeded) {
    msgBox.textContent = "You only need " + formatMoney(stillNeeded) + " more for this goal.";
    return;
  }
  if (amount > available) {
    msgBox.textContent = "Not enough money. You only have " + formatMoney(Math.max(0, available)) + " available. Add income first.";
    return;
  }

  goal.saved = Math.round((goal.saved + amount) * 100) / 100;
  saveGoals();
  render();
  showGoals();
}

// the goal is reached: the saved money becomes an expense
function buyGoal(id) {
  var goal = findGoal(id);
  if (goal.saved < goal.target) return;
  if (!confirm("Mark " + goal.name + " as bought? The saved money will be recorded as an expense.")) return;

  transactions.unshift({
    id: Date.now(),
    description: "Bought: " + goal.name,
    amount: goal.saved,
    type: "expense",
    category: "Shopping",
    goal: true,                 // bought from a goal (not counted in the weekly budget)
    date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  });
  removeGoal(id);
  saveTransactions();
  render();
  showGoals();
}

function deleteGoal(id) {
  var goal = findGoal(id);
  if (!confirm("Delete this goal? Your " + formatMoney(goal.saved) + " saved goes back to your balance.")) return;
  removeGoal(id);
  render();
  showGoals();
}

function removeGoal(id) {
  var kept = [];
  for (var i = 0; i < goals.length; i++) {
    if (goals[i].id !== id) {
      kept.push(goals[i]);
    }
  }
  goals = kept;
  saveGoals();
}

// these return a function, because buttons made in a loop need their own id
function makeSaveHandler(id, input, msgBox) {
  return function () { addSavings(id, input, msgBox); };
}
function makeBuyHandler(id) {
  return function () { buyGoal(id); };
}
function makeDeleteGoalHandler(id) {
  return function () { deleteGoal(id); };
}

function showGoals() {
  var list = $("goalList");
  list.innerHTML = "";

  if (goals.length === 0) {
    list.appendChild(makeEl("div", "box empty", "No goals yet. Add something you want to buy, like a new phone, and save for it step by step."));
    return;
  }

  for (var i = 0; i < goals.length; i++) {
    var goal = goals[i];
    var reached = (goal.saved >= goal.target);
    var percent = Math.min(100, Math.round(goal.saved / goal.target * 100));

    var card = makeEl("section", "box goal-card");

    var top = makeEl("div", "goal-top");
    top.appendChild(makeEl("h3", "", goal.name));
    top.appendChild(makeEl("span", "goal-price", formatMoney(goal.target)));
    card.appendChild(top);

    var bg = makeEl("div", "limit-bar");
    var fill = makeEl("div", reached ? "limit-fill done" : "limit-fill");
    fill.style.width = percent + "%";
    bg.appendChild(fill);
    card.appendChild(bg);

    var info = formatMoney(goal.saved) + " saved (" + percent + "%) • ";
    info += reached ? "Goal reached!" : formatMoney(goal.target - goal.saved) + " to go";
    card.appendChild(makeEl("p", "note goal-info", info));

    var msgBox = makeEl("p", "message");

    if (!reached) {
      var row = makeEl("div", "goal-row");
      var input = makeEl("input");
      input.type = "number";
      input.min = "1";
      input.step = "0.01";
      input.placeholder = "Amount to save (₱)";
      var addBtn = makeEl("button", "", "Add savings");
      addBtn.type = "button";
      addBtn.onclick = makeSaveHandler(goal.id, input, msgBox);
      row.appendChild(input);
      row.appendChild(addBtn);
      card.appendChild(row);
    }
    card.appendChild(msgBox);

    var actions = makeEl("div", "goal-actions");
    if (reached) {
      var buyBtn = makeEl("button", "", "Mark as bought");
      buyBtn.type = "button";
      buyBtn.onclick = makeBuyHandler(goal.id);
      actions.appendChild(buyBtn);
    }
    var delBtn = makeEl("button", "secondary", "Delete goal");
    delBtn.type = "button";
    delBtn.onclick = makeDeleteGoalHandler(goal.id);
    actions.appendChild(delBtn);
    card.appendChild(actions);

    list.appendChild(card);
  }
}

// ---------- dashboard: monthly overview chart ----------
// a round top value for the chart (divides nicely into 4 steps)
function niceMax(value) {
  if (value <= 0) return 1000;
  var magnitude = Math.pow(10, Math.floor(Math.log(value) / Math.LN10));
  var steps = [1, 2, 4, 5, 8, 10];
  for (var i = 0; i < steps.length; i++) {
    if (steps[i] * magnitude >= value) return steps[i] * magnitude;
  }
  return 10 * magnitude;
}

function axisLabel(n) {
  if (n === 0) return "₱0";
  return "₱" + (n >= 1000 ? (Math.round(n / 100) / 10) + "K" : Math.round(n));
}

function showOverview() {
  var now = new Date();
  var daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  var weeks = Math.ceil(daysInMonth / 7);
  var inc = [];
  var exp = [];
  for (var w = 0; w < weeks; w++) {
    inc.push(0);
    exp.push(0);
  }

  // add up this month's transactions, week 1 = days 1-7, week 2 = days 8-14 ...
  var maxValue = 0;
  for (var i = 0; i < transactions.length; i++) {
    var t = transactions[i];
    var date = txDate(t);
    if (date.getFullYear() !== now.getFullYear() || date.getMonth() !== now.getMonth()) continue;
    var week = Math.floor((date.getDate() - 1) / 7);
    if (t.type === "income") inc[week] += t.amount;
    else exp[week] += t.amount;
  }
  for (var k = 0; k < weeks; k++) {
    maxValue = Math.max(maxValue, inc[k], exp[k]);
  }
  var top = niceMax(maxValue);

  $("ovMonth").textContent = now.toLocaleDateString("en-US", { month: "long" });

  // left side numbers
  var axis = $("ovAxis");
  axis.innerHTML = "";
  for (var a = 4; a >= 0; a--) {
    axis.appendChild(makeEl("span", "", axisLabel(top * a / 4)));
  }

  // lines and bars
  var plot = $("ovPlot");
  plot.innerHTML = "";
  for (var g = 0; g <= 4; g++) {
    var line = makeEl("div", "ov-line");
    line.style.bottom = (g * 25) + "%";
    plot.appendChild(line);
  }
  var cols = makeEl("div", "ov-cols");
  cols.style.gridTemplateColumns = "repeat(" + weeks + ", 1fr)";
  var labels = $("ovLabels");
  labels.innerHTML = "";
  labels.style.gridTemplateColumns = "repeat(" + weeks + ", 1fr)";

  for (var c = 0; c < weeks; c++) {
    var col = makeEl("div", "ov-col");
    var barIn = makeEl("div", "ov-bar in");
    barIn.style.height = (inc[c] / top * 100) + "%";
    barIn.title = "Income: " + formatMoney(inc[c]);
    var barOut = makeEl("div", "ov-bar out");
    barOut.style.height = (exp[c] / top * 100) + "%";
    barOut.title = "Expenses: " + formatMoney(exp[c]);
    col.appendChild(barIn);
    col.appendChild(barOut);
    cols.appendChild(col);
    labels.appendChild(makeEl("span", "", "Week " + (c + 1)));
  }
  plot.appendChild(cols);
}

// ---------- dashboard: budget progress and savings goal ----------
function showProgress() {
  // weekly budget
  var budget = currentUser.weeklyBudget || 0;
  var spent = spentThisWeek();
  if (budget <= 0) {
    $("bpPercent").textContent = "—";
    $("bpFill").style.width = "0%";
    $("bpFill").className = "limit-fill";
    $("bpNote").textContent = "Set a weekly budget below to track your progress.";
  } else {
    var percent = Math.round(spent / budget * 100);
    $("bpPercent").textContent = percent + "%";
    $("bpFill").style.width = Math.min(percent, 100) + "%";
    $("bpFill").className = (percent >= 100) ? "limit-fill full" : (percent >= 80) ? "limit-fill warn" : "limit-fill";
    $("bpNote").textContent = formatMoney(spent) + " of " + formatMoney(budget) + " this week";
  }

  // all savings goals together
  var saved = 0;
  var target = 0;
  for (var i = 0; i < goals.length; i++) {
    saved += goals[i].saved;
    target += goals[i].target;
  }
  if (target <= 0) {
    $("sgPercent").textContent = "—";
    $("sgFill").style.width = "0%";
    $("sgFill").className = "limit-fill";
    $("sgNote").textContent = "No savings goal yet. Add one in Savings Goals.";
  } else {
    var goalPercent = Math.min(100, Math.round(saved / target * 100));
    $("sgPercent").textContent = goalPercent + "%";
    $("sgFill").style.width = goalPercent + "%";
    $("sgFill").className = (goalPercent >= 100) ? "limit-fill done" : "limit-fill";
    $("sgNote").textContent = formatMoney(saved) + " of " + formatMoney(target);
  }
}

// ---------- dashboard: last 5 transactions ----------
function showRecent() {
  var list = $("recentList");
  list.innerHTML = "";

  for (var i = 0; i < transactions.length && i < 5; i++) {
    var t = transactions[i];
    var isIncome = (t.type === "income");
    var cls = isIncome ? "in" : "out";

    var li = makeEl("li", "item");
    li.appendChild(makeEl("div", "arrow " + cls, isIncome ? "↑" : "↓"));

    var info = makeEl("div", "info");
    info.appendChild(makeEl("b", "", t.description));
    info.appendChild(makeEl("small", "", (t.category || "Other") + " • " + t.date));
    li.appendChild(info);

    li.appendChild(makeEl("div", "amount " + cls, (isIncome ? "+ " : "- ") + formatMoney(t.amount)));
    list.appendChild(li);
  }

  if (transactions.length === 0) {
    list.appendChild(makeEl("li", "empty", "No transactions yet. Add your first income below."));
  }
}

// ---------- budgets page (monthly limit for each expense category) ----------
// how much was spent in one category this month
function monthSpend(cat) {
  var now = new Date();
  var total = 0;
  for (var i = 0; i < transactions.length; i++) {
    var t = transactions[i];
    if (t.type !== "expense" || (t.category || "Other") !== cat) continue;
    var date = txDate(t);
    if (date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()) {
      total += t.amount;
    }
  }
  return total;
}

function showBudgets() {
  var budgets = currentUser.catBudgets || {};
  var list = $("budList");
  list.innerHTML = "";
  $("budMsg").textContent = "";
  var totalBudget = 0;
  var totalSpent = 0;

  for (var i = 0; i < categories.expense.length; i++) {
    var cat = categories.expense[i];
    var limit = budgets[cat] || 0;
    var spent = monthSpend(cat);
    if (limit > 0) {
      totalBudget += limit;
      totalSpent += spent;
    }

    var row = makeEl("div", "bud-row");

    var top = makeEl("div", "bud-top");
    top.appendChild(makeEl("b", "", cat));
    var status = (limit > 0) ? formatMoney(spent) + " of " + formatMoney(limit) : formatMoney(spent) + " spent • no budget";
    top.appendChild(makeEl("span", "note", status));
    row.appendChild(top);

    var percent = (limit > 0) ? Math.round(spent / limit * 100) : 0;
    var bar = makeEl("div", "limit-bar");
    var fill = makeEl("div", "limit-fill");
    if (percent >= 100) fill.className = "limit-fill full";
    else if (percent >= 80) fill.className = "limit-fill warn";
    fill.style.width = Math.min(percent, 100) + "%";
    bar.appendChild(fill);
    row.appendChild(bar);

    var input = makeEl("input", "bud-input");
    input.type = "number";
    input.min = "0";
    input.step = "1";
    input.placeholder = "Monthly budget for " + cat + " (₱)";
    input.value = (limit > 0) ? limit : "";
    input.setAttribute("data-cat", cat);
    row.appendChild(input);

    list.appendChild(row);
  }

  $("budTotal").textContent = formatMoney(totalBudget);
  $("budSpent").textContent = formatMoney(totalSpent);
  var left = totalBudget - totalSpent;
  $("budLeft").textContent = (left < 0 ? "-" : "") + formatMoney(Math.abs(left));
}

function saveCategoryBudgets() {
  var inputs = document.querySelectorAll(".bud-input");
  var budgets = {};

  for (var i = 0; i < inputs.length; i++) {
    var value = Number(inputs[i].value || 0);
    if (value < 0 || value > 100000000) {
      setMsg("budMsg", "Each budget must be between ₱0 and ₱100,000,000.");
      return;
    }
    if (value > 0) {
      budgets[inputs[i].getAttribute("data-cat")] = value;
    }
  }

  currentUser.catBudgets = budgets;
  saveUsers();
  showBudgets();
  setMsg("budMsg", "Budgets saved.", true);
}

// ---------- categories page ----------
var categoryPalette = ["#f59e0b", "#0ea5e9", "#8b5cf6", "#ec4899", "#12a566", "#5b5bf0", "#e5384f", "#94a3b8"];

function showCategories() {
  fillCategoryList("expense", "catExpense");
  fillCategoryList("income", "catIncome");
}

function fillCategoryList(kind, boxId) {
  var box = $(boxId);
  box.innerHTML = "";

  var names = categories[kind].slice();
  var totals = {};
  var counts = {};
  var sum = 0;

  for (var i = 0; i < transactions.length; i++) {
    var t = transactions[i];
    if (t.type !== kind) continue;
    var cat = t.category || "Other";
    if (names.indexOf(cat) === -1) names.push(cat);   // old or goal categories like "Shopping"
    totals[cat] = (totals[cat] || 0) + t.amount;
    counts[cat] = (counts[cat] || 0) + 1;
    sum += t.amount;
  }

  for (var k = 0; k < names.length; k++) {
    var name = names[k];
    var amount = totals[name] || 0;
    var count = counts[name] || 0;
    var percent = (sum > 0) ? amount / sum * 100 : 0;
    var color = (kind === "income") ? "#12a566" : (categoryColors[name] || categoryPalette[k % categoryPalette.length]);

    var row = makeEl("div", "bar-row");
    var top = makeEl("div", "top");
    var left = makeEl("span", "");
    var dot = makeEl("i", "dot");
    dot.style.background = color;
    left.appendChild(dot);
    left.appendChild(document.createTextNode(name));
    top.appendChild(left);
    top.appendChild(makeEl("span", "", formatMoney(amount)));

    var bg = makeEl("div", "bar-bg");
    var fill = makeEl("div", "bar-fill");
    fill.style.width = percent + "%";
    fill.style.background = color;
    bg.appendChild(fill);

    row.appendChild(top);
    row.appendChild(bg);
    row.appendChild(makeEl("small", "note", count + (count === 1 ? " transaction" : " transactions") + " • " + Math.round(percent) + "%"));
    box.appendChild(row);
  }
}

// ---------- reports and analytics page ----------
function showReports() {
  var now = new Date();
  var income = 0;
  var expense = 0;
  var count = 0;
  var biggest = null;
  var catTotals = {};

  for (var i = 0; i < transactions.length; i++) {
    var t = transactions[i];
    var date = txDate(t);
    if (date.getFullYear() !== now.getFullYear() || date.getMonth() !== now.getMonth()) continue;
    count++;
    if (t.type === "income") {
      income += t.amount;
    } else {
      expense += t.amount;
      var cat = t.category || "Other";
      catTotals[cat] = (catTotals[cat] || 0) + t.amount;
      if (biggest === null || t.amount > biggest.amount) biggest = t;
    }
  }

  var net = income - expense;
  $("repIncome").textContent = formatMoney(income);
  $("repExpense").textContent = formatMoney(expense);
  $("repNet").textContent = (net < 0 ? "-" : "") + formatMoney(Math.abs(net));
  $("repRate").textContent = (income > 0) ? Math.round(net / income * 100) + "%" : "—";

  $("repCount").textContent = count;
  $("repAvgDay").textContent = formatMoney(expense / now.getDate());
  $("repBiggest").textContent = biggest ? biggest.description + " (" + formatMoney(biggest.amount) + ")" : "None yet";

  var topName = "None yet";
  var topAmount = 0;
  for (var name in catTotals) {
    if (catTotals[name] > topAmount) {
      topAmount = catTotals[name];
      topName = name + " (" + formatMoney(catTotals[name]) + ")";
    }
  }
  $("repTopCat").textContent = topName;

  // chart: income and expenses for the last 6 months
  var months = [];
  var maxValue = 0;
  for (var m = 5; m >= 0; m--) {
    var first = new Date(now.getFullYear(), now.getMonth() - m, 1);
    var inc = 0;
    var exp = 0;
    for (var j = 0; j < transactions.length; j++) {
      var tx = transactions[j];
      var d = txDate(tx);
      if (d.getFullYear() === first.getFullYear() && d.getMonth() === first.getMonth()) {
        if (tx.type === "income") inc += tx.amount;
        else exp += tx.amount;
      }
    }
    months.push({ label: first.toLocaleDateString("en-US", { month: "short" }), inc: inc, exp: exp });
    maxValue = Math.max(maxValue, inc, exp);
  }

  var chart = $("repChart");
  chart.innerHTML = "";
  for (var c = 0; c < months.length; c++) {
    var col = makeEl("div", "chart-col");
    var bars = makeEl("div", "chart-bars");

    var barIn = makeEl("div", "chart-bar in");
    barIn.style.height = (maxValue > 0 ? months[c].inc / maxValue * 100 : 0) + "%";
    barIn.title = "Income: " + formatMoney(months[c].inc);

    var barOut = makeEl("div", "chart-bar out");
    barOut.style.height = (maxValue > 0 ? months[c].exp / maxValue * 100 : 0) + "%";
    barOut.title = "Expenses: " + formatMoney(months[c].exp);

    bars.appendChild(barIn);
    bars.appendChild(barOut);
    col.appendChild(bars);
    col.appendChild(makeEl("small", "", months[c].label));
    chart.appendChild(col);
  }
}

// ---------- allowance tracker ----------
function showAllowance() {
  var total = 0;
  var count = 0;
  var last = null;

  // transactions are newest first, so the first allowance we find is the last one
  // (old entries saved as "Salary" are counted too)
  for (var i = 0; i < transactions.length; i++) {
    var t = transactions[i];
    if (t.type === "income" && (t.category === "Allowance" || t.category === "Salary")) {
      total += t.amount;
      count++;
      if (last === null) last = t;
    }
  }

  $("allowTotal").textContent = formatMoney(total);
  $("allowCount").textContent = count;
  $("allowLast").textContent = last ? formatMoney(last.amount) + " • " + last.date : "None yet";
}

// ---------- weekly budget (Monday to Sunday) ----------
// the date of a transaction (old ones only have the date text)
function txDate(t) {
  var date = new Date(t.date);
  if (isNaN(date.getTime())) {
    date = new Date(t.id);
  }
  return date;
}

// the Monday of the week that contains this date
function startOfWeek(date) {
  var d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  var day = d.getDay();                       // 0 = Sunday, 1 = Monday ... 6 = Saturday
  var sinceMonday = (day === 0) ? 6 : day - 1;
  d.setDate(d.getDate() - sinceMonday);
  return d;
}

// expenses of this week (money used to buy a goal is not counted)
function spentThisWeek() {
  var start = startOfWeek(new Date());
  var end = new Date(start);
  end.setDate(end.getDate() + 7);

  var total = 0;
  for (var i = 0; i < transactions.length; i++) {
    var t = transactions[i];
    if (t.type !== "expense" || t.goal) continue;
    var date = txDate(t);
    if (date >= start && date < end) {
      total += t.amount;
    }
  }
  return total;
}

function showWeekly() {
  var budget = currentUser.weeklyBudget || 0;
  var spent = spentThisWeek();
  var now = new Date();
  var start = startOfWeek(now);
  var end = new Date(start);
  end.setDate(end.getDate() + 6);
  var options = { month: "short", day: "numeric" };
  $("weekRange").textContent = "This week: " + start.toLocaleDateString("en-US", options) + " to " + end.toLocaleDateString("en-US", options) + " • goal purchases are not counted";

  if (budget <= 0) {
    $("weekText").textContent = formatMoney(spent) + " spent";
    $("weekFill").style.width = "0%";
    $("weekFill").className = "limit-fill";
    $("weekNote").textContent = "Set a weekly budget below to see how much you can spend each day.";
    return;
  }

  var daysLeft = 7 - ((now.getDay() + 6) % 7);   // days left in the week, including today
  var left = budget - spent;
  var percent = Math.round(spent / budget * 100);
  var level = "limit-fill";
  var note = formatMoney(left) + " left this week. About " + formatMoney(left / daysLeft) + " per day for the next " + daysLeft + (daysLeft === 1 ? " day." : " days.");

  if (left < 0) {
    level = "limit-fill full";
    note = "You are over your weekly budget by " + formatMoney(-left) + ".";
  } else if (percent >= 80) {
    level = "limit-fill warn";
  }

  $("weekText").textContent = formatMoney(spent) + " of " + formatMoney(budget);
  $("weekFill").style.width = Math.min(percent, 100) + "%";
  $("weekFill").className = level;
  $("weekNote").textContent = note;
}

function saveWeekly(event) {
  event.preventDefault();
  var budget = Number($("weekInput").value || 0);

  if (budget < 0 || budget > 100000000) {
    setMsg("weekMsg", "The weekly budget must be between ₱0 and ₱100,000,000.");
    return;
  }

  currentUser.weeklyBudget = budget;
  saveUsers();
  showWeekly();
  showProgress();
  if (budget > 0) {
    setMsg("weekMsg", "Weekly budget saved.", true);
  } else {
    setMsg("weekMsg", "Weekly budget removed.", true);
  }
}

// ---------- hamburger menu (phones) ----------
function toggleMenu() {
  $("sidebar").classList.toggle("open");
  $("overlay").classList.toggle("show");
  $("burger").classList.toggle("open");    // turns the three lines into an X
  document.body.classList.toggle("menu-open");   // stop the page behind from scrolling
}

function closeMenu() {
  $("sidebar").classList.remove("open");
  $("overlay").classList.remove("show");
  $("burger").classList.remove("open");
  document.body.classList.remove("menu-open");
}

// ---------- pages: dashboard, transactions, goals, profile, settings ----------
function showPage(page) {
  closeMenu();   // close the menu on phones after choosing a page
  var pages = ["Dashboard", "History", "Budgets", "Goals", "Categories", "Reports", "Profile", "Settings", "Help"];
  for (var i = 0; i < pages.length; i++) {
    var isThis = (pages[i].toLowerCase() === page);
    $("page" + pages[i]).classList.toggle("hidden", !isThis);
    $("nav" + pages[i]).className = isThis ? "nav active" : "nav";
  }

  if (page === "history") {
    showList();
  }
  if (page === "budgets") {
    showBudgets();
  }
  if (page === "categories") {
    showCategories();
  }
  if (page === "reports") {
    showReports();
  }
  if (page === "goals") {
    showGoals();
  }
  if (page === "profile") {
    fillProfile();
  }
  if (page === "settings") {
    fillSettingsDetails();
    $("setName").value = currentUser.name;
    $("setMax").value = getMaxEntry();
    $("limitMsg").textContent = "";
    $("nameMsg").textContent = "";
    $("pwMsg").textContent = "";
    $("dangerMsg").textContent = "";
  }
}

function setMsg(id, text, good) {
  $(id).textContent = text;
  $(id).className = good ? "message ok" : "message";
}

// fill the profile page with the user's details
function fillProfile() {
  var income = 0;
  var expense = 0;
  for (var i = 0; i < transactions.length; i++) {
    if (transactions[i].type === "income") {
      income += transactions[i].amount;
    } else {
      expense += transactions[i].amount;
    }
  }

  $("pAvatar").textContent = currentUser.name.charAt(0).toUpperCase();
  $("pName").textContent = currentUser.name;
  $("pEmail").textContent = currentUser.email;
  $("dName").textContent = currentUser.name;
  $("dEmail").textContent = currentUser.email;
  $("dSince").textContent = currentUser.joined || "Not available";
  $("dCount").textContent = transactions.length;
  $("dIncome").textContent = formatMoney(income);
  $("dExpense").textContent = formatMoney(expense);
  $("dBalance").textContent = formatMoney(income - expense - getTotals().saved);
}

// ---------- settings ----------
// fill the "User details" box at the top of Settings
function fillSettingsDetails() {
  var weekly = currentUser.weeklyBudget || 0;
  $("setAvatar").textContent = currentUser.name.charAt(0).toUpperCase();
  $("setDetName").textContent = currentUser.name;
  $("setDetEmail").textContent = currentUser.email;
  $("setDetName2").textContent = currentUser.name;
  $("setDetEmail2").textContent = currentUser.email;
  $("setDetSince").textContent = currentUser.joined || "Not available";
  $("setDetTx").textContent = transactions.length;
  $("setDetGoals").textContent = goals.length;
  $("setDetWeekly").textContent = weekly > 0 ? formatMoney(weekly) : "Not set";
  $("setDetMax").textContent = formatMoney(getMaxEntry());
}

function saveName(event) {
  event.preventDefault();
  var name = $("setName").value.trim();
  if (name === "") {
    setMsg("nameMsg", "Please enter your name.");
    return;
  }
  currentUser.name = name;
  saveUsers();
  $("userName").textContent = name;
  $("sideAvatar").textContent = name.charAt(0).toUpperCase();
  $("greeting").textContent = $("greeting").textContent.split(",")[0] + ", " + name.split(" ")[0];
  fillSettingsDetails();
  setMsg("nameMsg", "Name updated.", true);
}

function changePassword(event) {
  event.preventDefault();
  var current = $("currentPw").value;
  var newPassword = $("newPw").value;

  if (current !== currentUser.password) {
    setMsg("pwMsg", "Your current password is incorrect.");
    return;
  }
  if (newPassword.length < 6) {
    setMsg("pwMsg", "New password must be at least 6 characters.");
    return;
  }
  if (newPassword !== $("newPw2").value) {
    setMsg("pwMsg", "New passwords don’t match.");
    return;
  }
  if (newPassword === current) {
    setMsg("pwMsg", "The new password must be different from the old one.");
    return;
  }

  currentUser.password = newPassword;
  saveUsers();
  $("pwForm").reset();
  setMsg("pwMsg", "Password updated.", true);
}

function clearTransactions() {
  if (!confirm("Delete ALL your transactions? This cannot be undone.")) return;
  transactions = [];
  saveTransactions();
  render();
  setMsg("dangerMsg", "All transactions were deleted.", true);
}

function deleteAccount() {
  if (!confirm("Delete your account and all its data? This cannot be undone.")) return;

  // remove this user from the users list
  var kept = [];
  for (var i = 0; i < users.length; i++) {
    if (users[i].email !== currentUser.email) {
      kept.push(users[i]);
    }
  }
  users = kept;
  saveUsers();
  localStorage.removeItem("alkansya_tx_" + currentUser.email);
  localStorage.removeItem("alkansya_goals_" + currentUser.email);

  logout();
  openAuth("login");
  showAuthMessage("Your account was deleted.", true);
}

// ---------- when the page opens ----------
loadUsers();
var savedEmail = localStorage.getItem("alkansya_loggedin");
if (savedEmail && findUser(savedEmail) !== null) {
  startApp(findUser(savedEmail));
} else {
  showLanding();   // not logged in: show the home page first
}