// ===================== GLOBAL STATE =====================
let coins = parseFloat(localStorage.getItem("coins"));
if (isNaN(coins) || coins < 0) coins = 10;

let inventory = JSON.parse(localStorage.getItem("inventory")) || [];
let recentDrops = JSON.parse(localStorage.getItem("recentDrops")) || [];
let cases = [];
let currentCase = null;

let isSpinning = false;

// ===================== UPGRADER STATE =====================
const Upgrader = {
  cases: [],
  selectedWagers: new Set(),
  selectedTargets: new Set()
};

// ===================== ADMIN =====================
let adminMode = false;
const ADMIN_PASSWORD = "Trading";

// ===================== SAVE =====================
function saveInventory() {
  localStorage.setItem("inventory", JSON.stringify(inventory));
  localStorage.setItem("recentDrops", JSON.stringify(recentDrops));
}

// ===================== INIT =====================
document.addEventListener("DOMContentLoaded", () => {
  updateCoins();
  renderInventory();
  renderTopDrops();
  loadCases();
  populateCoinflipDropdown();
  updateBackpackValue();

  // buttons
  document.getElementById("sell-all-btn").onclick = sellAllItems;
  document.getElementById("add-coins-btn").onclick = () => { coins += 50; updateCoins(); };
  document.getElementById("remove-coins-btn").onclick = () => { coins = Math.max(0, coins - 50); updateCoins(); };

  document.getElementById("coinflip-btn").onclick = () => {
    const i = parseInt(document.getElementById("coinflip-select").value);
    if (!isNaN(i)) coinflipItem(i);
  };

  document.getElementById("open-btn").onclick = () => openCase();
  document.getElementById("show-case-items-btn").onclick = toggleCaseItems;

  document.getElementById("admin-give-btn").onclick = adminGiveItem;
  document.getElementById("sort-inv-btn").onclick = sortInventoryByPriceDesc;

  document.getElementById("toggle-inv-btn").onclick = () => {
    const inv = document.getElementById("inventory");
    inv.style.display = inv.style.display === "none" ? "flex" : "none";
  };

  document.getElementById("upgrade-btn")?.addEventListener("click", upgradeAction);
});

// ===================== COINS =====================
function updateCoins() {
  document.getElementById("coins").textContent = `⛃: ${coins.toFixed(2)}`;
  localStorage.setItem("coins", coins);
}

// ===================== INVENTORY =====================
function renderInventory() {
  const container = document.getElementById("inventory");
  container.innerHTML = "";

  inventory.forEach((item, i) => {
    const div = document.createElement("div");
    div.className = `inv-item ${item.rarity.toLowerCase()}`;
    div.innerHTML = `
      <img src="${item.image}">
      <p>${item.name}</p>
      <small>${item.price.toFixed(2)}</small>
      <button class="sell-btn">Scrap</button>
    `;
    div.querySelector("button").onclick = () => sellItem(i);
    container.appendChild(div);
  });
}

function sellItem(i) {
  coins += inventory[i].price;
  inventory.splice(i, 1);
  saveInventory();
  updateCoins();
  renderInventory();
  populateCoinflipDropdown();
  updateBackpackValue();
}

function sellAllItems() {
  if (!inventory.length) return;
  const total = inventory.reduce((a, b) => a + b.price, 0);
  coins += total;
  inventory = [];
  saveInventory();
  updateCoins();
  renderInventory();
  populateCoinflipDropdown();
  updateBackpackValue();
}

function updateBackpackValue() {
  const total = inventory.reduce((a, b) => a + b.price, 0);
  const el = document.getElementById("backpack-value");
  if (el) el.textContent = `Backpack Value: ⛃ ${total.toFixed(2)}`;
}

// ===================== SORT =====================
function sortInventoryByPriceDesc() {
  inventory.sort((a, b) => b.price - a.price);
  saveInventory();
  renderInventory();
}

// ===================== CASES =====================
function loadCases() {
  fetch("data/cases.json")
    .then(r => r.json())
    .then(data => {
      cases = data.cases;

      Upgrader.cases = cases;

      const display = document.getElementById("case-select-display");
      const options = document.getElementById("case-select-options");
      options.innerHTML = "";

      cases.forEach(c => {
        const div = document.createElement("div");
        div.innerHTML = `<img src="${c.image}"><span>${c.name}</span>`;
        div.onclick = () => selectCase(c.id);
        options.appendChild(div);
      });

      selectCase(cases[0].id);

      display.onclick = () => {
        options.style.display = options.style.display === "block" ? "none" : "block";
      };

      // init upgrader AFTER cases load
      renderWager();
      renderTarget();
      updateUI();
    });
}

function selectCase(id) {
  currentCase = cases.find(c => c.id === id);
  if (!currentCase) return;

  document.getElementById("case-image").src = currentCase.image;
  document.getElementById("case-name").textContent = currentCase.name;
  document.getElementById("open-btn").textContent = `⛃ ${currentCase.price}`;
}

// ===================== CASE ITEMS =====================
function toggleCaseItems() {
  const list = document.getElementById("case-items-list");
  if (!currentCase) return;

  list.style.display = list.style.display === "block" ? "none" : "block";
  list.innerHTML = "";

  const total = currentCase.items.reduce((a, b) => a + b.weight, 0);

  currentCase.items.forEach(item => {
    const rate = ((item.weight / total) * 100).toFixed(2);
    const div = document.createElement("div");
    div.innerHTML = `
      <img src="${item.image}">
      <p>${item.name}</p>
      <small>${item.price} ⛃ | ${rate}%</small>
    `;
    list.appendChild(div);
  });
}

// ===================== CASE OPEN =====================
function openCase() {
  if (isSpinning || !currentCase) return;
  if (coins < currentCase.price) return;

  isSpinning = true;
  coins -= currentCase.price;
  updateCoins();

  const win = getRandomItem(currentCase.items);
  spinToItem(win);
}

function getRandomItem(items) {
  let total = items.reduce((a, b) => a + b.weight, 0);
  let r = Math.random() * total;

  for (let i of items) {
    if (r < i.weight) return i;
    r -= i.weight;
  }
  return items[0];
}

// ===================== SPINNER =====================
function spinToItem(win) {
  const strip = document.getElementById("spinner-strip");
  strip.innerHTML = "";

  const slots = 50;
  const winIndex = 38;

  for (let i = 0; i < slots; i++) {
    let item = currentCase.items[Math.floor(Math.random() * currentCase.items.length)];
    if (i === winIndex) item = win;

    const d = document.createElement("div");
    d.className = "spinner-item";
    d.innerHTML = `<img src="${item.image}">`;
    strip.appendChild(d);
  }

  const offset = -(winIndex * 140 - 500);

  strip.style.transition = "transform 3.2s cubic-bezier(.25,.8,.3,1)";
  strip.style.transform = `translateX(${offset}px)`;

  setTimeout(() => {
    giveItem(win);
    isSpinning = false;
  }, 3200);
}

// ===================== WIN =====================
function giveItem(item) {
  inventory.push(item);
  recentDrops.push(item);
  if (recentDrops.length > 20) recentDrops.shift();

  saveInventory();
  renderInventory();
  renderTopDrops();
  populateCoinflipDropdown();
  updateBackpackValue();
}

// ===================== COINFLIP =====================
function populateCoinflipDropdown() {
  const s = document.getElementById("coinflip-select");
  s.innerHTML = "";

  inventory.forEach((i, idx) => {
    const o = document.createElement("option");
    o.value = idx;
    o.textContent = `${i.name} (${i.price})`;
    s.appendChild(o);
  });
}

function coinflipItem(i) {
  const item = inventory[i];
  if (!item) return;

  const win = Math.random() < 0.5;

  if (win) inventory.push({ ...item });
  else inventory.splice(i, 1);

  saveInventory();
  renderInventory();
  populateCoinflipDropdown();
}

// ===================== TOP DROPS =====================
function renderTopDrops() {
  const c = document.getElementById("top-drops");
  c.innerHTML = "";

  [...recentDrops]
    .sort((a, b) => b.price - a.price)
    .slice(0, 8)
    .forEach(i => {
      const d = document.createElement("div");
      d.innerHTML = `<img src="${i.image}"><p>${i.name}</p>`;
      c.appendChild(d);
    });
}

// ===================== ADMIN =====================
function adminGiveItem() {
  if (!adminMode) {
    if (prompt("Pass?") !== ADMIN_PASSWORD) return;
    adminMode = true;
  }

  const panel = document.getElementById("admin-give-panel");
  const box = document.getElementById("admin-give-items");

  panel.style.display = "block";
  box.innerHTML = "";

  cases.forEach(c =>
    c.items.forEach(i => {
      const d = document.createElement("div");
      d.innerHTML = `
        <img src="${i.image}">
        <span>${i.name}</span>
        <button>Trade</button>
      `;

      d.querySelector("button").onclick = () => {
        inventory.push(i);
        saveInventory();
        renderInventory();
      };

      box.appendChild(d);
    })
  );

  document.getElementById("admin-give-close").onclick = () => {
    panel.style.display = "none";
    adminMode = false;
  };
}

// ===================== UPGRADER =====================
function getKey(i) {
  return i.name + i.price + i.image;
}

function renderWager() {
  const box = document.getElementById("wager-list");
  if (!box) return;
  box.innerHTML = "";

  inventory.forEach(i => {
    const key = getKey(i);

    const div = document.createElement("div");
    div.className = Upgrader.selectedWagers.has(key) ? "selected" : "";
    div.textContent = i.name;

    div.onclick = () => {
      if (Upgrader.selectedWagers.has(key))
        Upgrader.selectedWagers.delete(key);
      else
        Upgrader.selectedWagers.add(key);

      renderWager();
      updateUI();
    };

    box.appendChild(div);
  });
}

function renderTarget() {
  const box = document.getElementById("target-list");
  if (!box) return;
  box.innerHTML = "";

  cases.forEach(c =>
    c.items.forEach(i => {
      const key = getKey(i);

      const div = document.createElement("div");
      div.className = Upgrader.selectedTargets.has(key) ? "selected" : "";
      div.textContent = i.name;

      div.onclick = () => {
        if (Upgrader.selectedTargets.has(key))
          Upgrader.selectedTargets.delete(key);
        else
          Upgrader.selectedTargets.add(key);

        renderTarget();
        updateUI();
      };

      box.appendChild(div);
    })
  );
}

function updateUI() {
  const w = inventory.filter(i => Upgrader.selectedWagers.has(getKey(i)));
  const t = cases.flatMap(c => c.items).filter(i =>
    Upgrader.selectedTargets.has(getKey(i))
  );

  const wc = w.reduce((a, b) => a + b.price, 0);
  const tc = t.reduce((a, b) => a + b.price, 0);

  const chance = tc ? (wc / tc) * 100 : 0;

  document.getElementById("upgrade-chance").textContent =
    `Chance: ${chance.toFixed(2)}%`;

  document.getElementById("upgrade-value").textContent =
    `${wc.toFixed(2)} → ${tc.toFixed(2)}`;
}

function upgradeAction() {
  const w = inventory.filter(i => Upgrader.selectedWagers.has(getKey(i)));
  const t = cases.flatMap(c => c.items).filter(i =>
    Upgrader.selectedTargets.has(getKey(i))
  );

  if (!w.length || !t.length) return;

  const wc = w.reduce((a, b) => a + b.price, 0);
  const tc = t.reduce((a, b) => a + b.price, 0);

  const chance = tc ? (wc / tc) * 100 : 0;
  const roll = Math.random() * 100;

  const success = roll <= chance;

  if (success) t.forEach(i => inventory.push(i));

  w.forEach(i => {
    const idx = inventory.findIndex(x => getKey(x) === getKey(i));
    if (idx !== -1) inventory.splice(idx, 1);
  });

  saveInventory();
  renderInventory();

  Upgrader.selectedWagers.clear();
  Upgrader.selectedTargets.clear();

  renderWager();
  renderTarget();
  updateUI();
}
