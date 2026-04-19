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
  document.getElementById("admin-give-btn").onclick = adminGiveItem;
  const sortBtn = document.getElementById("sort-inv-btn");
  if (sortBtn) sortBtn.onclick = sortInventoryByPriceDesc;

  document.getElementById("sell-all-btn").onclick = sellAllItems;
  document.getElementById("add-coins-btn").onclick = () => { coins += 50; updateCoins(); };
  document.getElementById("remove-coins-btn").onclick = () => { coins = Math.max(0, coins - 50); updateCoins(); };

  document.getElementById("coinflip-btn").onclick = () => {
    const select = document.getElementById("coinflip-select");
    const index = parseInt(select.value);
    if (!isNaN(index)) coinflipItem(index);
  };

  document.getElementById("open-btn").onclick = () => openCases(1);
  document.getElementById("show-case-items-btn").onclick = toggleCaseItems;

  updateCoins();
  renderInventory();
  renderTopDrops();
  populateCoinflipDropdown();
  updateBackpackValue();

  loadCases();
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
      <small>${item.price.toFixed(2)} coins</small>
      <button class="sell-btn">Scrap</button>
    `;
    div.querySelector(".sell-btn").onclick = () => sellItem(index);
    container.appendChild(div);
  });

  renderUpgrader();
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
  if (!inventory.length) return alert("Backpack empty");
  const total = inventory.reduce((s, i) => s + i.price, 0);
  coins += total;
  inventory = [];
  saveInventory();
  updateCoins();
  renderInventory();
  populateCoinflipDropdown();
  updateBackpackValue();
  alert(`Scrapped for ${total.toFixed(2)} coins`);
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
  updateBackpackValue();
}

// ===================== CASES =====================
function loadCases() {
  fetch("data/cases.json")
    .then(res => res.json())
    .then(data => {
      cases = data.cases;
      Upgrader.cases = cases;

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
        options.style.display = options.style.display === "block" ? "none" : "block";
      };

      document.addEventListener("click", e => {
        if (!display.contains(e.target) && !options.contains(e.target)) {
          options.style.display = "none";
        }
      });

      // 🔥 IMPORTANT FIX
      renderUpgrader();
    });
}

function selectCase(id) {
  currentCase = cases.find(c => c.id === id);
  if (!currentCase) return;

  document.getElementById("case-image").src = currentCase.image;
  document.getElementById("case-name").textContent = currentCase.name;
  document.getElementById("open-btn").textContent = `⛃ ${currentCase.price}`;

  const display = document.getElementById("case-select-display");
  display.innerHTML = `<img src="${currentCase.image}"><span>${currentCase.name}</span>`;
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
    showWinner(item);
  }

  setTimeout(() => isSpinning = false, 200);
}

function getRandomItem(items) {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let roll = Math.random() * total;

  for (let i of items) {
    if (roll < i.weight) return i;
    roll -= i.weight;
  }
  return items[0];
}

function showWinner(item) {
  inventory.push(item);
  recentDrops.push(item);
  if (recentDrops.length > 20) recentDrops.shift();

  saveInventory();
  renderInventory();
  renderTopDrops();
  populateCoinflipDropdown();
  updateBackpackValue();

  const w = document.getElementById("winner-name");
  if (w) w.textContent = item.name;
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

  inventory.forEach((item, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = `${item.name} (${item.price})`;
    select.appendChild(opt);
  });
}

function coinflipItem(index) {
  const item = inventory[index];
  const win = Math.random() < 0.5;

  if (win) inventory.push({ ...item });
  else inventory.splice(index, 1);

  saveInventory();
  renderInventory();
  populateCoinflipDropdown();
  updateBackpackValue();

  alert(win ? "WIN!" : "LOSS!");
}

// ===================== ADMIN =====================
function adminGiveItem() {
  const panel = document.getElementById("admin-give-panel");
  const box = document.getElementById("admin-give-items");

  if (!adminMode) {
    const pw = prompt("Pass:");
    if (pw !== ADMIN_PASSWORD) return;
    adminMode = true;
  }

  panel.style.display = "block";
  box.innerHTML = "";

  let all = [];
  cases.forEach(c => c.items.forEach(i => all.push(i)));

  all.forEach(item => {
    const div = document.createElement("div");
    div.innerHTML = `
      <img src="${item.image}">
      <span>${item.name}</span>
      <button>Trade</button>
    `;

    div.querySelector("button").onclick = () => {
      if (coins < item.price) return;
      coins -= item.price;
      inventory.push(item);
      updateCoins();
      saveInventory();
      renderInventory();
      populateCoinflipDropdown();
    };

    box.appendChild(div);
  });

  document.getElementById("admin-give-close").onclick = () => {
    panel.style.display = "none";
    adminMode = false;
  };
}

// ===================== UPGRADER =====================
function key(i) {
  return `${i.name}_${i.price}_${i.image}`;
}

function renderUpgrader() {
  const w = document.getElementById("wager-list");
  const t = document.getElementById("target-list");
  if (!w || !t) return;

  w.innerHTML = "";
  t.innerHTML = "";

  inventory.forEach(i => {
    const k = key(i);
    const div = document.createElement("div");
    div.className = `upgrade-item ${Upgrader.selectedWagers.has(k) ? "selected" : ""}`;
    div.innerHTML = `<img src="${i.image}"><div>${i.name}</div>`;
    div.onclick = () => {
      Upgrader.selectedWagers.has(k)
        ? Upgrader.selectedWagers.delete(k)
        : Upgrader.selectedWagers.add(k);
      renderUpgrader();
      updateUpgradeUI();
    };
    w.appendChild(div);
  });

  cases.forEach(c => c.items.forEach(i => {
    const k = key(i);
    const div = document.createElement("div");
    div.className = `upgrade-item ${Upgrader.selectedTargets.has(k) ? "selected" : ""}`;
    div.innerHTML = `<img src="${i.image}"><div>${i.name}</div>`;
    div.onclick = () => {
      Upgrader.selectedTargets.has(k)
        ? Upgrader.selectedTargets.delete(k)
        : Upgrader.selectedTargets.add(k);
      renderUpgrader();
      updateUpgradeUI();
    };
    t.appendChild(div);
  }));

  updateUpgradeUI();
}

function updateUpgradeUI() {
  const w = inventory.filter(i => Upgrader.selectedWagers.has(key(i)));
  const t = cases.flatMap(c => c.items).filter(i => Upgrader.selectedTargets.has(key(i)));

  const wc = w.reduce((a,b)=>a+b.price,0);
  const tc = t.reduce((a,b)=>a+b.price,0);

  const chance = wc && tc ? Math.min((wc/tc)*100,100) : 0;

  document.getElementById("upgrade-chance").textContent = `Chance: ${chance.toFixed(2)}%`;
  document.getElementById("upgrade-value").textContent = `${wc} → ${tc}`;
}
