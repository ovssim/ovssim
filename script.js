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

// Upgrader state
let Upgrader = {
  cases: [],
  selectedWagers: new Set(),
  selectedTargets: new Set(),
  upgrading: false
};

// ===================== INIT =====================
document.addEventListener("DOMContentLoaded", () => {

  // Buttons
  document.getElementById("sell-all-btn").onclick = sellAllItems;
  document.getElementById("add-coins-btn").onclick = () => { coins += 50; updateCoins(); };
  document.getElementById("remove-coins-btn").onclick = () => { coins = Math.max(0, coins - 50); updateCoins(); };

  document.getElementById("admin-give-btn").onclick = adminGiveItem;
  document.getElementById("sort-inv-btn").onclick = sortInventoryByPriceDesc;
  document.getElementById("open-btn").onclick = () => openCases(1);
  document.getElementById("show-case-items-btn").onclick = toggleCaseItems;

  document.getElementById("coinflip-btn").onclick = () => {
    const select = document.getElementById("coinflip-select");
    const index = parseInt(select.value);
    if (!isNaN(index)) coinflipItem(index);
  };

  // DEV TOGGLE INVENTORY
  const toggleBtn = document.getElementById("toggle-inv-btn");
  if (toggleBtn) {
    toggleBtn.onclick = () => {
      const inv = document.getElementById("inventory");
      inv.style.display = inv.style.display === "none" ? "flex" : "none";
    };
  }

  updateCoins();
  renderInventory();
  renderTopDrops();
  loadCases();
  populateCoinflipDropdown();
  updateBackpackValue();
});

// ===================== COINS =====================
function updateCoins() {
  document.getElementById("coins").textContent = `⛃: ${coins.toFixed(2)}`;
  localStorage.setItem("coins", coins);
}

// ===================== INVENTORY =====================
function saveInventory() {
  localStorage.setItem("inventory", JSON.stringify(inventory));
  localStorage.setItem("recentDrops", JSON.stringify(recentDrops));
}

function renderInventory() {
  const container = document.getElementById("inventory");
  container.innerHTML = "";

  inventory.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = `inv-item ${item.rarity.toLowerCase()}`;
    div.innerHTML = `
      <img src="${item.image}">
      <p>${item.name}</p>
      <small>${item.price.toFixed(2)} ⛃</small>
      <button class="sell-btn">Scrap</button>
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

  alert(`Sold all for ${total.toFixed(2)} coins`);
}

function updateBackpackValue() {
  const total = inventory.reduce((s, i) => s + i.price, 0);
  const el = document.getElementById("backpack-value");
  if (el) el.textContent = `Backpack Value: ⛃ ${total.toFixed(2)}`;
}

// ===================== SORT =====================
function sortInventoryByPriceDesc() {
  inventory.sort((a, b) => b.price - a.price);
  saveInventory();
  renderInventory();
}

// ===================== TOP DROPS =====================
function renderTopDrops() {
  const container = document.getElementById("top-drops");
  container.innerHTML = "";

  [...recentDrops]
    .sort((a, b) => b.price - a.price)
    .slice(0, 8)
    .forEach(item => {
      const div = document.createElement("div");
      div.className = `top-drop ${item.rarity.toLowerCase()}`;
      div.innerHTML = `
        <img src="${item.image}">
        <p>${item.name}</p>
        <strong>${item.price.toFixed(2)} ⛃</strong>
      `;
      container.appendChild(div);
    });
}

// ===================== COINFLIP =====================
function populateCoinflipDropdown() {
  const select = document.getElementById("coinflip-select");
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

function coinflipItem(index) {
  const item = inventory[index];
  const coin = document.getElementById("coin");
  const btn = document.getElementById("coinflip-btn");

  btn.disabled = true;

  const win = Math.random() < 0.5;
  const result = win ? "head" : "tail";

  let flips = 0;
  const max = 10;

  const interval = setInterval(() => {
    coin.classList.toggle("head");
    coin.classList.toggle("tail");
    flips++;

    if (flips > max) {
      clearInterval(interval);

      coin.classList.remove("head", "tail");
      coin.classList.add(result);

      if (win) {
        inventory.push({ ...item });
        alert(`Won another ${item.name}`);
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
  }, 150);
}

// ===================== CASES =====================
function loadCases() {
  fetch("data/cases.json")
    .then(r => r.json())
    .then(data => {
      cases = data.cases;

      const display = document.getElementById("case-select-display");
      const options = document.getElementById("case-select-options");

      options.innerHTML = "";

      cases.forEach(c => {
        const div = document.createElement("div");
        div.innerHTML = `<img src="${c.image}"><span>${c.name}</span>`;
        div.onclick = () => {
          selectCase(c.id);
          options.style.display = "none";
        };
        options.appendChild(div);
      });

      selectCase(cases[0].id);

      display.onclick = () => {
        options.style.display =
          options.style.display === "block" ? "none" : "block";
      };
    });
}

function selectCase(id) {
  currentCase = cases.find(c => c.id === id);
  if (!currentCase) return;

  document.getElementById("case-image").src = currentCase.image;
  document.getElementById("case-name").textContent = currentCase.name;
  document.getElementById("open-btn").textContent =
    `⛃ ${currentCase.price}`;
}

// ===================== OPEN CASE =====================
function openCases(count) {
  if (isSpinning || !currentCase) return;
  isSpinning = true;

  for (let i = 0; i < count; i++) {
    if (coins < currentCase.price) break;

    coins -= currentCase.price;
    updateCoins();

    const item = getRandomItem(currentCase.items);
    spinToItem(item);
  }
}

function getRandomItem(items) {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * total;

  for (let i of items) {
    if (r < i.weight) return i;
    r -= i.weight;
  }
  return items[0];
}

// ===================== SPINNER =====================
function spinToItem(winner) {
  const strip = document.getElementById("spinner-strip");
  strip.innerHTML = "";

  const slots = 50;
  const winIndex = 38;

  for (let i = 0; i < slots; i++) {
    let item = currentCase.items[Math.floor(Math.random() * currentCase.items.length)];
    if (i === winIndex) item = winner;

    const div = document.createElement("div");
    div.className = `spinner-item ${item.rarity.toLowerCase()}`;
    div.innerHTML = `<img src="${item.image}">`;
    strip.appendChild(div);
  }

  const itemWidth = 140;
  const offset = -(winIndex * itemWidth - 400);

  strip.style.transition = "transform 3.2s ease";
  strip.style.transform = `translateX(${offset}px)`;

  setTimeout(() => {
    inventory.push(winner);
    recentDrops.push(winner);

    saveInventory();
    renderInventory();
    renderTopDrops();
    populateCoinflipDropdown();
    updateBackpackValue();

    isSpinning = false;
  }, 3200);
}

// ===================== ADMIN PANEL =====================
function adminGiveItem() {
  const panel = document.getElementById("admin-give-panel");
  const box = document.getElementById("admin-give-items");

  if (!adminMode) {
    const pass = prompt("Enter Trading Pass:");
    if (pass !== ADMIN_PASSWORD) return;
    adminMode = true;
  }

  panel.style.display = "block";
  box.innerHTML = "";

  let all = [];
  cases.forEach(c => c.items.forEach(i => all.push(i)));

  all.forEach(item => {
    const div = document.createElement("div");
    div.className = "admin-give-item";
    div.innerHTML = `
      <img src="${item.image}">
      <div>${item.name}</div>
      <button>Trade</button>
    `;

    div.querySelector("button").onclick = () => {
      if (coins < item.price) return alert("No coins");

      coins -= item.price;
      inventory.push({ ...item });

      updateCoins();
      saveInventory();
      renderInventory();
      populateCoinflipDropdown();
      updateBackpackValue();
    };

    box.appendChild(div);
  });

  document.getElementById("admin-give-close").onclick = () => {
    panel.style.display = "none";
    adminMode = false;
  };
}

// ===================== UPGRADER =====================
// (kept stable core, unchanged logic from your version)
function getKey(i) {
  return `${i.name}_${i.price}_${i.image}`;
}

function calculateChance(w, t) {
  if (!w || !t) return 0;
  return Math.max(0, Math.min((w * 0.95 / t) * 100, 100));
}

function updateBackpackValue() {
  const total = inventory.reduce((s, i) => s + i.price, 0);
  const el = document.getElementById("backpack-value");
  if (el) el.textContent = `Backpack Value: ⛃ ${total.toFixed(2)}`;
}
