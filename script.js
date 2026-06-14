// initializing all the variables from the index

const form = document.querySelector("#expense-form");
const descriptionInput = document.querySelector("#description");
const amountInput = document.querySelector("#amount");
const categoryInput = document.querySelector("#category");
const dateInput = document.querySelector("#date");
const errorMessage = document.querySelector("#error-message");

const filterCategory = document.querySelector("#filter-category");
const sortOption = document.querySelector("#sort-option");
const expenseList = document.querySelector("#expense-list");

const overallTotal = document.querySelector("#overall-total");
const expenseCount = document.querySelector("#expense-count");
const categoryTotals = document.querySelector("#category-totals");

const convertBtn = document.querySelector("#convert-btn");
const convertedTotal = document.querySelector("#converted-total");
const convertError = document.querySelector("#convert-error");

// save all data and store it in the expenses array
let expenses = loadExpenses();
//convert date to standard format
dateInput.value = new Date().toISOString().split("T")[0];
// convert the array to text 
function saveExpenses() {
  localStorage.setItem("expenses", JSON.stringify(expenses));
}
//parse the list and load all the expenses 
function loadExpenses() {
  try {
    const storedExpenses = localStorage.getItem("expenses");
    return storedExpenses ? JSON.parse(storedExpenses) : [];
  } catch {
    return [];
  }
}
//formats currency with 2 decimal places 
function formatCurrency(amount) {
  return `$${amount.toFixed(2)}`;
}

function getVisibleExpenses() {
  let visibleExpenses = [...expenses];

  if (filterCategory.value !== "All") {
    visibleExpenses = visibleExpenses.filter(function(expense) {
      return expense.category === filterCategory.value;
    });
  }

  if (sortOption.value === "date-desc") {
    visibleExpenses.sort(function(a, b) {
      return new Date(b.date) - new Date(a.date);
    });
  } else if (sortOption.value === "date-asc") {
    visibleExpenses.sort(function(a, b) {
      return new Date(a.date) - new Date(b.date);
    });
  } else if (sortOption.value === "amount-desc") {
    visibleExpenses.sort(function(a, b) {
      return b.amount - a.amount;
    });
  } else if (sortOption.value === "amount-asc") {
    visibleExpenses.sort(function(a, b) {
      return a.amount - b.amount;
    });
  }

  return visibleExpenses;
}

function render() {
  const visibleExpenses = getVisibleExpenses();

  expenseList.innerHTML = "";

  if (visibleExpenses.length === 0) {
    expenseList.innerHTML = `<p>No expenses to show.</p>`;
  } else {
    const rows = visibleExpenses.map(function(expense) {
      return `
        <div class="expense-row">
          <span>${expense.description}</span>
          <span>${formatCurrency(expense.amount)}</span>
          <span>${expense.category}</span>
          <span>${expense.date}</span>
          <button data-id="${expense.id}">Delete</button>
        </div>
      `;
    });

    expenseList.innerHTML = rows.join("");
  }

  const total = visibleExpenses.reduce(function(sum, expense) {
    return sum + expense.amount;
  }, 0);

  overallTotal.textContent = formatCurrency(total);
  expenseCount.textContent = visibleExpenses.length;

  const totalsByCategory = visibleExpenses.reduce(function(totals, expense) {
    totals[expense.category] = (totals[expense.category] || 0) + expense.amount;
    return totals;
  }, {});

  categoryTotals.innerHTML = Object.keys(totalsByCategory)
    .map(function(category) {
      return `<p>${category}: ${formatCurrency(totalsByCategory[category])}</p>`;
    })
    .join("");
}

form.addEventListener("submit", function(event) {
  event.preventDefault();

  const description = descriptionInput.value.trim();
  const amount = Number(amountInput.value);
  const category = categoryInput.value;
  const date = dateInput.value;

  if (description === "") {
    errorMessage.textContent = "Description cannot be empty.";
    return;
  }

  if (amount <= 0) {
    errorMessage.textContent = "Amount must be greater than 0.";
    return;
  }

  if (date === "") {
    errorMessage.textContent = "Please choose a date.";
    return;
  }

  const newExpense = {
    id: Date.now(),
    description: description,
    amount: amount,
    category: category,
    date: date
  };

  expenses.push(newExpense);
  saveExpenses();
  render();

  form.reset();
  dateInput.value = new Date().toISOString().split("T")[0];
  errorMessage.textContent = "";
});

expenseList.addEventListener("click", function(event) {
  if (event.target.tagName === "BUTTON") {
    const id = Number(event.target.dataset.id);

    expenses = expenses.filter(function(expense) {
      return expense.id !== id;
    });

    saveExpenses();
    render();
  }
});

filterCategory.addEventListener("change", render);
sortOption.addEventListener("change", render);

convertBtn.addEventListener("click", async function() {
  const visibleExpenses = getVisibleExpenses();

  const total = visibleExpenses.reduce(function(sum, expense) {
    return sum + expense.amount;
  }, 0);

  convertBtn.disabled = true;
  convertBtn.textContent = "Converting...";
  convertedTotal.textContent = "";
  convertError.textContent = "";

  try {
    const response = await fetch("https://open.er-api.com/v6/latest/USD");

    if (!response.ok) {
      throw new Error("Bad response");
    }

    const data = await response.json();
    const eurRate = data.rates.EUR;
    const eurTotal = total * eurRate;

    convertedTotal.textContent = `EUR Total: €${eurTotal.toFixed(2)}`;
  } catch {
    convertError.textContent = "Could not convert currency. Please try again.";
  } finally {
    convertBtn.disabled = false;
    convertBtn.textContent = "Convert to EUR";
  }
});

render();