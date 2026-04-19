// ===================== GLOBAL STATE =====================
let coins = parseFloat(localStorage.getItem("coins"));
if (isNaN(coins) || coins < 0) coins = 10;

let inventory = JSON.parse(localStorage.getItem("inventory")) || [];
let recentDrops = JSON.parse(localStorage.getItem("recentDrops")) || [];
let cases = [];
let currentCase = null;

let isSpinning = false;

// Admin
let adminMode = false;
const ADMIN_PASSWORD = "Trading";

// ===================== UPGRADER STATE =====================
const Upgrader = {
  cases: [],
  selectedWagers: new Set(),
  selectedTargets: new Set(),
  upgrading: false
};

// ===================== UTIL =====================
function getKey(item) {
  return `${item.name}_${item.price}_${item.image}`;
}

function getInventory() {
  return inventory || [];
}

// ===================== INIT =====================
document.addEventListener("DOMContentLoaded", () => {

  // buttons (safe binding)
  document.getElementById("admin-give-btn")?.addEventListener("click", adminGiveItem);
  document.getElementById("sell-all-btn")?.addEventListener("click", sellAllItems);
  document.getElementById("add-coins-btn")?.addEventListener("click", () => { coins += 50; updateCoins(); });
  document.getElementById("remove-coins-btn")?.addEventListener("click", () => { coins = Math.max(0, coins - 50); updateCoins(); });

  document.getElementById("coinflip-btn")?.addEventListener("click", () => {
    const i = parseInt(document.getElementById("coinflip-select")?.value);
    if (!isNaN(i)) coinflipItem(i);
  });

  document.getElementById("open-btn")?.addEventListener("click", () => openCases(1));
  document.getElementById("show-case-items-btn")?.addEventListener("click", toggleCaseItems);

  const sortBtn = document.getElementById("sort-inv-btn");
  if (sortBtn) sortBtn.onclick = sortInventoryByPriceDesc;

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
  updateBackpackValue();
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
      <button class="sell-btn">Scrap</button>
    `;

    div.querySelector(".sell-btn").onclick = () => sellItem(index);

    container.appendChild(div);
  });

  populateCoinflipDropdown();
}

function sellItem(index) {
  coins += inventory[index].price;
  inventory.splice(index, 1);

  saveInventory();
  updateCoins();
  renderInventory();
}

function sellAllItems() {
  if (!inventory.length) return alert("Backpack empty");

  const total = inventory.reduce((a, b) => a + b.price, 0);
  coins += total;
  inventory = [];

  saveInventory();
  updateCoins();
  renderInventory();

  alert(`Scrapped for ${total.toFixed(2)} coins`);
}

function updateBackpackValue() {
  const el = document.getElementById("backpack-value");
  if (!el) return;

  const total = inventory.reduce((a, b) => a + b.price, 0);
  el.textContent = `Backpack Value: ⛃ ${total.toFixed(2)}`;
}

// ===================== SORT =====================
function sortInventoryByPriceDesc() {
  inventory.sort((a, b) => b.price - a.price);
  saveInventory();
  renderInventory();
}

// ===================== CASE ITEMS =====================
function toggleCaseItems() {
  const list = document.getElementById("case-items-list");
  if (!list || !currentCase) return;

  list.style.display = list.style.display === "block" ? "none" : "block";

  if (list.style.display !== "block") return;

  list.innerHTML = "";

  const total = currentCase.items.reduce((s, i) => s + i.weight, 0);

  currentCase.items
    .sort((a, b) => b.price - a.price)
    .forEach(item => {
      const rate = ((item.weight / total) * 100).toFixed(2);

      const div = document.createElement("div");
      div.className = `inv-item ${item.rarity.toLowerCase()}`;
      div.innerHTML = `
        <img src="${item.image}">
        <p>${item.name}</p>
        <small>${item.price.toFixed(2)}</small>
        <small>${rate}% chance</small>
      `;
      list.appendChild(div);
    });
}

// ===================== TOP DROPS =====================
function renderTopDrops() {
  const el = document.getElementById("top-drops");
  if (!el) return;

  el.innerHTML = "";

  [...recentDrops]
    .sort((a, b) => b.price - a.price)
    .slice(0, 8)
    .forEach(item => {
      const div = document.createElement("div");
      div.className = `top-drop ${item.rarity.toLowerCase()}`;
      div.innerHTML = `
        <img src="${item.image}">
        <p>${item.name}</p>
        <strong>${item.price.toFixed(2)}</strong>
      `;
      el.appendChild(div);
    });
}

// ===================== COINFLIP =====================
function populateCoinflipDropdown() {
  const select = document.getElementById("coinflip-select");
  if (!select) return;

  select.innerHTML = "";

  if (!inventory.length) {
    select.innerHTML = `<option>No items</option>`;
    return;
  }

  inventory.forEach((item, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = `${item.name} (${item.price})`;
    select.appendChild(opt);
  });
}

function coinflipItem(index) {
  const item = inventory[index];
  if (!item) return;

  const coin = document.getElementById("coin");
  const btn = document.getElementById("coinflip-btn");
  btn.disabled = true;

  const win = Math.random() < 0.5;

  let flips = 0;
  const max = 10;

  const loop = setInterval(() => {
    coin.classList.toggle("head");
    coin.classList.toggle("tail");

    if (++flips > max) {
      clearInterval(loop);

      if (win) {
        inventory.push({ ...item });
        alert("Won!");
      } else {
        inventory.splice(index, 1);
        alert("Lost item");
      }

      saveInventory();
      renderInventory();
      btn.disabled = false;
    }
  }, 120);
}

// ===================== CASE SYSTEM =====================
function loadCases() {
  fetch("data/cases.json")
    .then(r => r.json())
    .then(data => {
      cases = data.cases;
      Upgrader.cases = cases;

      selectCase(cases[0].id);

      renderUpgrader();
    });
}

function selectCase(id) {
  currentCase = cases.find(c => c.id === id);
  if (!currentCase) return;

  document.getElementById("case-image").src = currentCase.image;
  document.getElementById("case-name").textContent = currentCase.name;
  document.getElementById("open-btn").textContent = `⛃ ${currentCase.price}`;
}

// ===================== OPEN CASE =====================
function openCases(count) {
  if (isSpinning || !currentCase) return;

  isSpinning = true;

  for (let i = 0; i < count; i++) {
    if (coins < currentCase.price) break;

    coins -= currentCase.price;
    updateCoins();

    const win = getRandomItem(currentCase.items);
    giveItem(win);
  }

  setTimeout(() => isSpinning = false, 300);
}

function getRandomItem(items) {
  const total = items.reduce((a, b) => a + b.weight, 0);
  let r = Math.random() * total;

  for (const i of items) {
    if (r < i.weight) return i;
    r -= i.weight;
  }

  return items[0];
}

function giveItem(item) {
  inventory.push(item);
  recentDrops.push(item);

  if (recentDrops.length > 20) recentDrops.shift();

  saveInventory();
  renderInventory();
  renderTopDrops();
}

// ===================== ADMIN =====================
function adminGiveItem() {
  const pass = prompt("Passkey:");
  if (pass !== ADMIN_PASSWORD) return;

  const panel = document.getElementById("admin-give-panel");
  const box = document.getElementById("admin-give-items");

  panel.style.display = "block";
  box.innerHTML = "";

  cases.forEach(c => {
    c.items.forEach(item => {
      const div = document.createElement("div");

      div.innerHTML = `
        <span>${item.name}</span>
        <button>Trade</button>
      `;

      div.querySelector("button").onclick = () => {
        if (coins < item.price) return;

        coins -= item.price;
        inventory.push(item);

        saveInventory();
        updateCoins();
        renderInventory();
      };

      box.appendChild(div);
    });
  });

  document.getElementById("admin-give-close").onclick = () => {
    panel.style.display = "none";
  };
}

// ===================== UPGRADER FIXED =====================
function renderUpgrader() {
  renderWager();
  renderTarget();
  updateUpgraderUI();
}

function renderWager() {
  const box = document.getElementById("wager-list");
  if (!box) return;

  box.innerHTML = "";

  inventory.forEach(item => {
    const key = getKey(item);
    const div = document.createElement("div");

    div.className = `upgrade-item ${Upgrader.selectedWagers.has(key) ? "selected" : ""}`;

    div.innerHTML = `
      <img src="${item.image}">
      <div>${item.name}</div>
      <small>${item.price}</small>
    `;

    div.onclick = () => {
      if (Upgrader.selectedWagers.has(key)) {
        Upgrader.selectedWagers.delete(key);
      } else {
        Upgrader.selectedWagers.add(key);
      }
      renderWager();
      updateUpgraderUI();
    };

    box.appendChild(div);
  });
}

function renderTarget() {
  const box = document.getElementById("target-list");
  if (!box) return;

  box.innerHTML = "";

  cases.forEach(c => {
    c.items.forEach(item => {
      const key = getKey(item);

      const div = document.createElement("div");
      div.className = `upgrade-item ${Upgrader.selectedTargets.has(key) ? "selected" : ""}`;

      div.innerHTML = `
        <img src="${item.image}">
        <div>${item.name}</div>
        <small>${item.price}</small>
      `;

      div.onclick = () => {
        if (Upgrader.selectedTargets.has(key)) {
          Upgrader.selectedTargets.delete(key);
        } else {
          Upgrader.selectedTargets.add(key);
        }
        renderTarget();
        updateUpgraderUI();
      };

      box.appendChild(div);
    });
  });
}

function updateUpgraderUI() {
  const w = inventory
    .filter(i => Upgrader.selectedWagers.has(getKey(i)))
    .reduce((a, b) => a + b.price, 0);

  const t = cases.flatMap(c => c.items)
    .filter(i => Upgrader.selectedTargets.has(getKey(i)))
    .reduce((a, b) => a + b.price, 0);

  const chance = t ? Math.min(100, (w / t) * 95) : 0;

  document.getElementById("upgrade-chance").textContent = `Chance: ${chance.toFixed(2)}%`;
  document.getElementById("upgrade-value").textContent = `${w} → ${t}`;
}

// ===================== UPGRADE =====================
document.getElementById("upgrade-btn")?.addEventListener("click", () => {
  if (Upgrader.upgrading) return;

  const wItems = inventory.filter(i => Upgrader.selectedWagers.has(getKey(i)));
  const tItems = cases.flatMap(c => c.items)
    .filter(i => Upgrader.selectedTargets.has(getKey(i)));

  if (!wItems.length || !tItems.length) return;

  const w = wItems.reduce((a, b) => a + b.price, 0);
  const t = tItems.reduce((a, b) => a + b.price, 0);

  const chance = Math.min(100, (w / t) * 95);

  Upgrader.upgrading = true;

  setTimeout(() => {
    const win = Math.random() * 100 <= chance;

    if (win) {
      tItems.forEach(i => inventory.push(i));
    }

    wItems.forEach(wi => {
      const idx = inventory.findIndex(i => getKey(i) === getKey(wi));
      if (idx !== -1) inventory.splice(idx, 1);
    });

    Upgrader.selectedWagers.clear();
    Upgrader.selectedTargets.clear();

    saveInventory();
    renderInventory();
    renderUpgrader();

    Upgrader.upgrading = false;
  }, 1500);
});
