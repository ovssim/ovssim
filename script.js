// -------------------- Coins --------------------
let coins = parseInt(localStorage.getItem("coins")) || 1000; // starting coins
localStorage.setItem("coins", coins);

function updateCoins() {
  document.getElementById("coins").textContent = `Coins: ${coins}`;
}

updateCoins();

// -------------------- Inventory --------------------
let inventory = JSON.parse(localStorage.getItem("inventory")) || [];

function addToInventory(item) {
  inventory.push(item);
  localStorage.setItem("inventory", JSON.stringify(inventory));
  renderInventory();
}

function renderInventory() {
  const inv = document.getElementById("inventory");
  inv.innerHTML = "";

  inventory.forEach(item => {
    const div = document.createElement("div");
    div.className = `inv-item ${item.rarity}`;
    div.innerHTML = `
      <img src="${item.image}">
      <p>${item.name}</p>
    `;
    inv.appendChild(div);
  });
}

renderInventory();

// -------------------- Case Data --------------------
let caseData;

fetch("data/cases.json")
  .then(res => res.json())
  .then(data => {
    caseData = data.cases[0];
    document.getElementById("case-container").innerHTML =
      `<img src="${caseData.image}"><p>Price: ${caseData.price} coins</p>`;
  });

// -------------------- Case Opening --------------------
function openCase(items) {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let roll = Math.random() * total;

  for (let item of items) {
    if (roll < item.weight) return item;
    roll -= item.weight;
  }
}

// Show the opening result
function showResult(item) {
  document.getElementById("result").innerHTML = `
    <h2 class="${item.rarity}">${item.name}</h2>
    <img src="${item.image}">
    <p>Value: ${item.price} coins</p>
  `;
}

// -------------------- Open Button --------------------
document.getElementById("open-btn").addEventListener("click", () => {
  if (!caseData) return alert("Case not loaded yet!");
  
  if (coins < caseData.price) {
    return alert("Not enough coins!");
  }

  coins -= caseData.price;
  localStorage.setItem("coins", coins);
  updateCoins();

  const item = openCase(caseData.items);
  addToInventory(item);
  showResult(item);
});

