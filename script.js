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

// ===================== UPGRADER STATE =====================
let Upgrader = {
  cases: [],
  selectedWagers: new Set(),
  selectedTargets: new Set(),
  upgrading: false
};

// ===================== SAFE HELPERS =====================
const $ = (id) => document.getElementById(id);

function safeBind(id, event, fn) {
  const el = $(id);
  if (el) el.addEventListener(event, fn);
}

// ===================== INIT =====================
document.addEventListener("DOMContentLoaded", () => {
  updateCoins();
  renderInventory();
  renderTopDrops();
  loadCases();
  populateCoinflipDropdown();
  updateBackpackValue();

  // buttons (SAFE BINDING)
  safeBind("sell-all-btn", "click", sellAllItems);
  safeBind("add-coins-btn", "click", () => { coins += 50; updateCoins(); });
  safeBind("remove-coins-btn", "click", () => { coins = Math.max(0, coins - 50); updateCoins(); });

  safeBind("coinflip-btn", "click", () => {
    const select = $("coinflip-select");
    const index = parseInt(select?.value);
    if (!isNaN(index)) coinflipItem(index);
  });

  safeBind("open-btn", "click", () => openCases(1));
  safeBind("show-case-items-btn", "click", toggleCaseItems);

  safeBind("admin-give-btn", "click", adminGiveItem);

  const sortBtn = $("sort-inv-btn");
  if (sortBtn) sortBtn.onclick = sortInventoryByPriceDesc;
});

// ===================== COINS =====================
function updateCoins() {
  const el = $("coins");
  if (el) el.textContent = `⛃: ${coins.toFixed(2)}`;
  localStorage.setItem("coins", coins);
}

// ===================== INVENTORY =====================
function saveInventory() {
  localStorage.setItem("inventory", JSON.stringify(inventory));
  localStorage.setItem("recentDrops", JSON.stringify(recentDrops));
}

function renderInventory() {
  const container = $("inventory");
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
  const total = inventory.reduce((s, i) => s + i.price, 0);
  const el = $("backpack-value");
  if (el) el.textContent = `Backpack Value: ⛃ ${total.toFixed(2)}`;
}

// ===================== SORT =====================
function sortInventoryByPriceDesc() {
  inventory.sort((a, b) => b.price - a.price);
  saveInventory();
  renderInventory();
  updateBackpackValue();
}

// ===================== CASE SYSTEM =====================
function loadCases() {
  fetch("data/cases.json")
    .then(r => r.json())
    .then(data => {
      cases = data.cases || [];

      const display = $("case-select-display");
      const options = $("case-select-options");

      if (!display || !options) return;

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

      selectCase(cases[0]?.id);

      display.onclick = () => {
        options.style.display =
          options.style.display === "block" ? "none" : "block";
      };

      // INIT UPGRADER AFTER CASES LOAD
      Upgrader.cases = cases;
      renderWager();
      renderTarget();
      updateUI();
    });
}

function selectCase(id) {
  currentCase = cases.find(c => c.id === id);
  if (!currentCase) return;

  $("case-image").src = currentCase.image;
  $("case-name").textContent = currentCase.name;
  $("open-btn").textContent = `⛃ ${currentCase.price.toFixed(2)}`;

  const display = $("case-select-display");
  if (display) {
    display.innerHTML = `
      <img src="${currentCase.image}">
      <span>${currentCase.name}</span>
    `;
  }
}

// ===================== CASE ITEMS =====================
function toggleCaseItems() {
  const list = $("case-items-list");
  if (!currentCase || !list) return;

  list.style.display = list.style.display === "block" ? "none" : "block";
  if (list.style.display !== "block") return;

  list.innerHTML = "";

  const totalWeight = currentCase.items.reduce((s, i) => s + i.weight, 0);

  currentCase.items.forEach(item => {
    const rate = ((item.weight / totalWeight) * 100).toFixed(2);

    const div = document.createElement("div");
    div.className = `inv-item ${item.rarity.toLowerCase()}`;
    div.innerHTML = `
      <img src="${item.image}">
      <p>${item.name}</p>
      <small>${item.price.toFixed(2)}</small>
      <small>${rate}%</small>
    `;

    list.appendChild(div);
  });
}

// ===================== COINFLIP =====================
function populateCoinflipDropdown() {
  const select = $("coinflip-select");
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

  const coin = $("coin");
  const btn = $("coinflip-btn");

  if (!coin || !btn) return;

  btn.disabled = true;

  const win = Math.random() < 0.5;
  const final = win ? "head" : "tail";

  let flips = 0;

  const interval = setInterval(() => {
    coin.classList.toggle("head");
    coin.classList.toggle("tail");

    if (++flips > 10) {
      clearInterval(interval);

      coin.classList.remove("head", "tail");
      coin.classList.add(final);

      if (win) inventory.push({ ...item });
      else inventory.splice(index, 1);

      saveInventory();
      renderInventory();
      populateCoinflipDropdown();
      updateBackpackValue();

      btn.disabled = false;
    }
  }, 120);
}

// ===================== CASE OPEN =====================
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

// ===================== SPIN =====================
function spinToItem(item) {
  const strip = $("spinner-strip");
  if (!strip) return;

  strip.innerHTML = "";

  for (let i = 0; i < 50; i++) {
    const it = currentCase.items[Math.floor(Math.random() * currentCase.items.length)];
    const div = document.createElement("div");
    div.className = "spinner-item";
    div.innerHTML = `<img src="${it.image}">`;
    strip.appendChild(div);
  }

  const winDiv = document.createElement("div");
  winDiv.className = "spinner-item";
  winDiv.innerHTML = `<img src="${item.image}">`;
  strip.children[38].replaceWith(winDiv);

  setTimeout(() => {
    inventory.push(item);
    recentDrops.push(item);

    if (recentDrops.length > 20) recentDrops.shift();

    saveInventory();
    renderInventory();
    renderTopDrops();
    populateCoinflipDropdown();
    updateBackpackValue();

    isSpinning = false;
  }, 3200);
}

// ===================== TOP DROPS =====================
function renderTopDrops() {
  const container = $("top-drops");
  if (!container) return;

  container.innerHTML = "";

  [...recentDrops]
    .sort((a, b) => b.price - a.price)
    .slice(0, 8)
    .forEach(item => {
      const div = document.createElement("div");
      div.className = "top-drop";
      div.innerHTML = `
        <img src="${item.image}">
        <p>${item.name}</p>
        <strong>${item.price}</strong>
      `;
      container.appendChild(div);
    });
}

// ===================== ADMIN =====================
function adminGiveItem() {
  const panel = $("admin-give-panel");
  const container = $("admin-give-items");

  if (!panel || !container) return;

  if (!adminMode) {
    const pass = prompt("Passkey:");
    if (pass !== ADMIN_PASSWORD) return alert("Wrong");
    adminMode = true;
  }

  panel.style.display = "block";
  container.innerHTML = "";

  let items = [];
  cases.forEach(c => c.items.forEach(i => items.push(i)));

  items.forEach(item => {
    const div = document.createElement("div");
    div.innerHTML = `
      <img src="${item.image}">
      <span>${item.name}</span>
      <button>Trade</button>
    `;

    div.querySelector("button").onclick = () => {
      coins -= item.price;
      inventory.push({ ...item });

      saveInventory();
      updateCoins();
      renderInventory();
      populateCoinflipDropdown();
      updateBackpackValue();
    };

    container.appendChild(div);
  });

  $("admin-give-close").onclick = () => {
    panel.style.display = "none";
    adminMode = false;
  };
}

// ===================== UPGRADER CORE =====================
function getKey(i) {
  return `${i.name}_${i.price}_${i.image}`;
}

function renderWager() {
  const box = $("wager-list");
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
      if (Upgrader.selectedWagers.has(key))
        Upgrader.selectedWagers.delete(key);
      else Upgrader.selectedWagers.add(key);

      renderWager();
      updateUI();
    };

    box.appendChild(div);
  });
}

function renderTarget() {
  const box = $("target-list");
  if (!box) return;

  box.innerHTML = "";

  const all = [];

  cases.forEach(c =>
    c.items.forEach(i => all.push(i))
  );

  all.forEach(item => {
    const key = getKey(item);

    const div = document.createElement("div");
    div.className = `upgrade-item ${Upgrader.selectedTargets.has(key) ? "selected" : ""}`;

    div.innerHTML = `
      <img src="${item.image}">
      <div>${item.name}</div>
      <small>${item.price}</small>
    `;

    div.onclick = () => {
      if (Upgrader.selectedTargets.has(key))
        Upgrader.selectedTargets.delete(key);
      else Upgrader.selectedTargets.add(key);

      renderTarget();
      updateUI();
    };

    box.appendChild(div);
  });
}

function updateUI() {
  const c = $("upgrade-chance");
  const v = $("upgrade-value");

  if (!c || !v) return;

  const w = inventory.filter(i => Upgrader.selectedWagers.has(getKey(i)));
  const t = [];

  cases.forEach(ca =>
    ca.items.forEach(i => {
      if (Upgrader.selectedTargets.has(getKey(i))) t.push(i);
    })
  );

  const wTotal = w.reduce((s, i) => s + i.price, 0);
  const tTotal = t.reduce((s, i) => s + i.price, 0);

  const chance = tTotal ? Math.min((wTotal / tTotal) * 100, 100) : 0;

  c.textContent = `Chance: ${chance.toFixed(2)}%`;
  v.textContent = `${wTotal} → ${tTotal}`;
}
