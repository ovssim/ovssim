// ===================== GLOBAL STATE =====================
let coins = parseFloat(localStorage.getItem("coins"));
if (isNaN(coins) || coins < 0) coins = 10;

let inventory = JSON.parse(localStorage.getItem("inventory")) || [];
let recentDrops = JSON.parse(localStorage.getItem("recentDrops")) || [];
let cases = [];
let currentCase = null;

let isSpinning = false;
let adminMode = false;
const ADMIN_PASSWORD = "Trading";

// ===================== INIT =====================
document.addEventListener("DOMContentLoaded", () => {
  safeBind("admin-give-btn", adminGiveItem);
  safeBind("sell-all-btn", sellAllItems);
  safeBind("add-coins-btn", () => { coins += 50; updateCoins(); });
  safeBind("remove-coins-btn", () => { coins = Math.max(0, coins - 50); updateCoins(); });
  safeBind("open-btn", () => openCases(1));
  safeBind("show-case-items-btn", toggleCaseItems);
  safeBind("coinflip-btn", handleCoinflip);

  const sortBtn = document.getElementById("sort-inv-btn");
  if (sortBtn) sortBtn.onclick = sortInventoryByPriceDesc;

  updateCoins();
  renderInventory();
  renderTopDrops();
  loadCases();
  populateCoinflipDropdown();
  updateBackpackValue();
});

// ===================== SAFE BINDER =====================
function safeBind(id, fn) {
  const el = document.getElementById(id);
  if (el) el.addEventListener("click", fn);
}

// ===================== COINS =====================
function updateCoins() {
  const el = document.getElementById("coins");
  if (el) el.textContent = `⛃: ${coins.toFixed(2)}`;
  localStorage.setItem("coins", coins);
}

// ===================== INVENTORY =====================
function saveInventory() {
  localStorage.setItem("inventory", JSON.stringify(inventory));
  localStorage.setItem("recentDrops", JSON.stringify(recentDrops));
}

function renderInventory() {
  const container = document.getElementById("inventory");
  if (!container) return;

  container.innerHTML = "";

  inventory.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = `inv-item ${item.rarity.toLowerCase()}`;

    div.innerHTML = `
      <img src="${item.image}">
      <p>${item.name}</p>
      <small>${item.price.toFixed(2)} coins</small>
      <button class="sell-btn theme-btn">Scrap</button>
    `;

    div.querySelector(".sell-btn").onclick = () => sellItem(index);
    container.appendChild(div);
  });
}

function sellItem(index) {
  coins += inventory[index].price;
  inventory.splice(index, 1);
  saveInventory();
  updateCoins();
  renderInventory();
  populateCoinflipDropdown();
  updateBackpackValue();
}

function sellAllItems() {
  if (!inventory.length) return alert("Backpack empty.");

  const total = inventory.reduce((s, i) => s + i.price, 0);
  coins += total;
  inventory = [];

  saveInventory();
  updateCoins();
  renderInventory();
  populateCoinflipDropdown();
  updateBackpackValue();

  alert(`Scrapped Backpack for ${total.toFixed(2)} coins.`);
}

function updateBackpackValue() {
  const el = document.getElementById("backpack-value");
  if (!el) return;

  const total = inventory.reduce((s, i) => s + i.price, 0);
  el.textContent = `Backpack Value: ⛃ ${total.toFixed(2)}`;
}

function sortInventoryByPriceDesc() {
  inventory.sort((a, b) => b.price - a.price);
  saveInventory();
  renderInventory();
  updateBackpackValue();
}

// ===================== CASE ITEMS =====================
function toggleCaseItems() {
  const list = document.getElementById("case-items-list");
  if (!list || !currentCase) return;

  list.style.display = list.style.display === "block" ? "none" : "block";
  if (list.style.display !== "block") return;

  list.innerHTML = "";

  const totalWeight = currentCase.items.reduce((s, i) => s + i.weight, 0);

  currentCase.items
    .slice()
    .sort((a, b) => b.price - a.price)
    .forEach(item => {
      const rate = ((item.weight / totalWeight) * 100).toFixed(2);

      const div = document.createElement("div");
      div.className = `inv-item ${item.rarity.toLowerCase()}`;
      div.innerHTML = `
        <img src="${item.image}">
        <p>${item.name}</p>
        <small>${item.price.toFixed(2)} coins</small>
        <small>${rate}% chance</small>
      `;
      list.appendChild(div);
    });
}

// ===================== TOP DROPS =====================
function renderTopDrops() {
  const container = document.getElementById("top-drops");
  if (!container) return;

  container.innerHTML = "";

  recentDrops
    .slice()
    .sort((a, b) => b.price - a.price)
    .slice(0, 8)
    .forEach(item => {
      const div = document.createElement("div");
      div.className = `top-drop ${item.rarity.toLowerCase()}`;
      div.innerHTML = `
        <img src="${item.image}">
        <p>${item.name}</p>
        <strong>${item.price.toFixed(2)} coins</strong>
      `;
      container.appendChild(div);
    });
}

// ===================== COINFLIP =====================
function populateCoinflipDropdown() {
  const select = document.getElementById("coinflip-select");
  if (!select) return;

  select.innerHTML = "";

  if (!inventory.length) {
    select.innerHTML = `<option>No items</option>`;
    select.disabled = true;
    return;
  }

  select.disabled = false;

  inventory.forEach((item, index) => {
    const opt = document.createElement("option");
    opt.value = index;
    opt.textContent = `${item.name} (${item.price.toFixed(2)})`;
    select.appendChild(opt);
  });
}

function handleCoinflip() {
  const select = document.getElementById("coinflip-select");
  const index = parseInt(select?.value);
  if (isNaN(index)) return;

  coinflipItem(index);
}

function coinflipItem(index) {
  const item = inventory[index];
  const coin = document.getElementById("coin");
  const btn = document.getElementById("coinflip-btn");

  if (!item || !coin || !btn) return;

  btn.disabled = true;

  const win = Math.random() < 0.5;
  const result = win ? "head" : "tail";

  let flips = 0;

  const interval = setInterval(() => {
    coin.classList.toggle("head");
    coin.classList.toggle("tail");

    if (++flips > 10) {
      clearInterval(interval);

      coin.classList.remove("head", "tail");
      coin.classList.add(result);

      if (win) {
        inventory.push({ ...item });
        alert(`Won ${item.name}`);
      } else {
        inventory.splice(index, 1);
        alert(`Lost ${item.name}`);
      }

      saveInventory();
      renderInventory();
      populateCoinflipDropdown();
      updateBackpackValue();

      btn.disabled = false;
    }
  }, 120);
}

// ===================== CASES =====================
function loadCases() {
  fetch("data/cases.json")
    .then(r => r.json())
    .then(data => {
      cases = data.cases || [];

      const display = document.getElementById("case-select-display");
      const options = document.getElementById("case-select-options");

      if (!display || !options) return;

      options.innerHTML = "";

      cases.forEach(c => {
        const div = document.createElement("div");
        div.innerHTML = `<img src="${c.image}"><span>${c.name}</span>`;
        div.onclick = () => selectCase(c.id);
        options.appendChild(div);
      });

      selectCase(cases[0]?.id);

      display.onclick = () => {
        options.style.display = options.style.display === "block" ? "none" : "block";
      };
    });
}

function selectCase(id) {
  currentCase = cases.find(c => c.id === id);
  if (!currentCase) return;

  document.getElementById("case-image").src = currentCase.image;
  document.getElementById("case-name").textContent = currentCase.name;
}

// ===================== OPEN CASE =====================
function openCases() {
  if (isSpinning || !currentCase) return;
  isSpinning = true;

  if (coins < currentCase.price) return (isSpinning = false);

  coins -= currentCase.price;
  updateCoins();

  const item = getRandomItem(currentCase.items);
  showWinner(item);

  setTimeout(() => (isSpinning = false), 200);
}

function getRandomItem(items) {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * total;

  for (const i of items) {
    if (r < i.weight) return i;
    r -= i.weight;
  }

  return items[0];
}

// ===================== WIN =====================
function showWinner(item) {
  inventory.push(item);
  recentDrops.push(item);

  if (recentDrops.length > 20) recentDrops.shift();

  saveInventory();
  renderInventory();
  renderTopDrops();
  populateCoinflipDropdown();
  updateBackpackValue();
}

// ===================== ADMIN =====================
function adminGiveItem() {
  const pass = prompt("Passkey:");
  if (pass !== ADMIN_PASSWORD) return alert("Wrong");

  adminMode = true;
  alert("Admin enabled");
}
