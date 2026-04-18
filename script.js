// ===================== GLOBAL STATE =====================
let coins = parseFloat(localStorage.getItem("coins"));
if (isNaN(coins) || coins < 0) coins = 10;

let inventory = JSON.parse(localStorage.getItem("inventory")) || [];
let recentDrops = JSON.parse(localStorage.getItem("recentDrops")) || [];
let cases = [];
let currentCase = null;

let isSpinning = false; // Prevent multiple opens

// Admin password system
let adminMode = false;
const ADMIN_PASSWORD = "Trading";

// ===================== INIT =====================
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("admin-give-btn").onclick = adminGiveItem;
const sortBtn = document.getElementById("sort-inv-btn");
if (sortBtn) sortBtn.onclick = sortInventoryByPriceDesc;
  updateCoins();
  renderInventory();
  renderTopDrops();
  loadCases();
  populateCoinflipDropdown();
  updateBackpackValue();

  // Buttons
  document.getElementById("sell-all-btn").onclick = sellAllItems;
  document.getElementById("add-coins-btn").onclick = () => { coins += 50.00; updateCoins(); };
  document.getElementById("remove-coins-btn").onclick = () => { coins = Math.max(0, coins - 50.00); updateCoins(); };
  document.getElementById("coinflip-btn").onclick = () => {
    const select = document.getElementById("coinflip-select");
    const index = parseInt(select.value);
    if (!isNaN(index)) coinflipItem(index);
  };
  document.getElementById("open-btn").onclick = () => openCases(1); // single-case open
  document.getElementById("show-case-items-btn").onclick = toggleCaseItems;
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
  if (inventory.length === 0) return alert("Backpack empty.");
  const total = inventory.reduce((sum, i) => sum + i.price, 0);
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
  const total = inventory.reduce((sum, item) => sum + item.price, 0);

  const el = document.getElementById("backpack-value");
  if (el) {
    el.textContent = `Backpack Value: ⛃ ${total.toFixed(2)}`;
  }
}

// ===================== SORT INVENTORY =====================
function sortInventoryByPriceDesc() {
  inventory.sort((a, b) => b.price - a.price);
  saveInventory();
  renderInventory();
  updateBackpackValue();
}

// ===================== SHOW CASE ITEMS =====================
function toggleCaseItems() {
  const list = document.getElementById("case-items-list");
  if (!currentCase) return;

  if (list.style.display === "block") {
    list.style.display = "none";
    return;
  }

  list.style.display = "block";
  list.innerHTML = "";

  const totalWeight = currentCase.items.reduce((sum, i) => sum + i.weight, 0);
  const sortedItems = [...currentCase.items].sort((a, b) => b.price - a.price);

  sortedItems.forEach(item => {
    const dropRate = ((item.weight / totalWeight) * 100).toFixed(2);
    const div = document.createElement("div");
    div.className = `inv-item ${item.rarity.toLowerCase()}`;
    div.innerHTML = `
      <img src="${item.image}">
      <p>${item.name}</p>
      <small>${item.price.toFixed(2)} coins</small>
      <small style="font-size:14px; margin-top:5px;">⊹ ${dropRate}% ⊹ chance</small>
    `;
    list.appendChild(div);
  });
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
        <strong>${item.price.toFixed(2)} coins</strong>
      `;
      container.appendChild(div);
    });
}

// ===================== COINFLIP =====================
function populateCoinflipDropdown() {
  const select = document.getElementById("coinflip-select");
  select.innerHTML = "";

  if (inventory.length === 0) {
    select.innerHTML = `<option>No items available</option>`;
    select.disabled = true;
    return;
  }

  select.disabled = false;
  inventory.forEach((item, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = `${item.name} (${item.price.toFixed(2)} coins)`;
    select.appendChild(option);
  });
}

function coinflipItem(index) {
  const item = inventory[index];
  const coin = document.getElementById("coin");
  const flipBtn = document.getElementById("coinflip-btn");
  flipBtn.disabled = true;

  const win = Math.random() < 0.5;
  const finalClass = win ? "head" : "tail";

  let flips = 0;
  const totalFlips = 10;

  const flipInterval = setInterval(() => {
    coin.classList.toggle("head");
    coin.classList.toggle("tail");
    flips++;

    if (flips > totalFlips) {
      clearInterval(flipInterval);
      coin.classList.remove("head", "tail");
      coin.classList.add(finalClass);

      if (win) {
        inventory.push({ ...item });
        alert(`You won another ${item.name} 🎉!`);
      } else {
        inventory.splice(index, 1);
        alert(`You lost, your ${item.name} was destroyed.`);
      }
      updateBackpackValue();
      saveInventory();
      renderInventory();
      populateCoinflipDropdown();
      flipBtn.disabled = false;
    }
  }, 150);
}

// ===================== CASE SYSTEM =====================
function loadCases() {
  fetch("data/cases.json")
    .then(res => res.json())
    .then(data => {
      cases = data.cases;
      const display = document.getElementById("case-select-display");
      const options = document.getElementById("case-select-options");
      options.innerHTML = "";

      cases.forEach(c => {
        const div = document.createElement("div");
        div.innerHTML = `<img src="${c.image}"><span>${c.name} (${c.price.toFixed(2)} coins)</span>`;
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

      document.addEventListener("click", (e) => {
        if (!display.contains(e.target) && !options.contains(e.target)) {
          options.style.display = "none";
        }
      });
    });
}

function selectCase(id) {
  currentCase = cases.find(c => c.id === id);
  if (!currentCase) return;

  document.getElementById("case-image").src = currentCase.image;
  document.getElementById("case-name").textContent = currentCase.name;
  document.getElementById("open-btn").textContent = `⛃ ${currentCase.price.toFixed(2)} ⛃`;

  const display = document.getElementById("case-select-display");
  display.innerHTML = `<img src="${currentCase.image}"><span>${currentCase.name} (${currentCase.price.toFixed(2)} coins)</span>`;
}

// ===================== OPEN CASES =====================
function openCases(count) {
  if (isSpinning) return; // CASE LOCK
  if (!currentCase) return;

  isSpinning = true;

  for (let i = 0; i < count; i++) {
    if (coins < currentCase.price) break;
    coins -= currentCase.price;
    updateCoins();

    const winningItem = getRandomItem(currentCase.items);
    spinToItem(winningItem);
  }
}

function getRandomItem(items) {
  const total = items.reduce((sum, i) => sum + i.weight, 0);
  let roll = Math.random() * total;
  for (let item of items) {
    if (roll < item.weight) return item;
    roll -= item.weight;
  }
  return items[0];
}

// ===================== SPINNER =====================
function spinToItem(winningItem) {
  const strip = document.getElementById("spinner-strip");
  strip.innerHTML = "";

  const slots = 50;
  const winnerIndex = 38;

  for (let i = 0; i < slots; i++) {
    let item = currentCase.items[Math.floor(Math.random() * currentCase.items.length)];
    if (i === winnerIndex) item = winningItem;

    const div = document.createElement("div");
    div.className = `spinner-item ${item.rarity.toLowerCase()}`;
    div.innerHTML = `<img src="${item.image}">`;
    div.style.filter = "grayscale(100%)";
    strip.appendChild(div);
  }

  strip.offsetHeight;

  const itemWidth = strip.children[0].offsetWidth + 30;
  const containerWidth = document.getElementById("spinner-container").offsetWidth;

  const randomSpot = (Math.random() + Math.random()) / 2;
  const edgePadding = itemWidth * 0.1;
  const randomOffsetInsideItem = (randomSpot - 0.5) * (itemWidth - edgePadding);
  const jitter = (Math.random() - 0.5) * 3;

  const offset = -(
    winnerIndex * itemWidth
    - containerWidth / 2
    + itemWidth / 2
    + randomOffsetInsideItem
    + jitter
  );

  strip.style.transition = "none";
  strip.style.transform = "translateX(0)";
  strip.offsetHeight;
  strip.style.transition = "transform 3.2s cubic-bezier(.25,.85,.35,1)";
  strip.style.transform = `translateX(${offset}px)`;

  const interval = setInterval(() => {
    const children = Array.from(strip.children);
    const centerX = strip.parentElement.getBoundingClientRect().left + containerWidth / 2;
    children.forEach((child) => {
      const rect = child.getBoundingClientRect();
      const dist = Math.abs(rect.left + rect.width / 2 - centerX);
      const factor = Math.max(0, 1 - dist / (containerWidth / 2));
      child.style.filter = `grayscale(${(1 - factor) * 77}%) brightness(${0.6 + 0.4 * factor})`;
    });
  }, 30);

  setTimeout(() => {
    clearInterval(interval);

    const children = Array.from(strip.children);
    children.forEach((child, i) => {
      if (i === winnerIndex) {
        child.style.filter = "grayscale(0%) brightness(1)";
        animateWinner(child);
      } else {
        child.style.filter = "grayscale(35%) brightness(0.6)";
      }
    });

    showWinner(winningItem);

    // unlock case after spin
    setTimeout(() => {
      isSpinning = false;
    }, 200);

  }, 3200);
}

// ===================== WIN ITEM ANIMATION =====================
function animateWinner(element) {
  let scale = 1;
  let growing = true;

  function frame() {
    if (growing) {
      scale += 0.005;
      if (scale >= 1.2) growing = false;
    } else {
      scale -= 0.005;
      if (scale <= 1) growing = true;
    }
    element.style.transform = `scale(${scale})`;
    requestAnimationFrame(frame);
  }

  frame();
}

// ===================== WINNER =====================
function showWinner(item) {
  inventory.push(item);
  recentDrops.push(item);
  if (recentDrops.length > 20) recentDrops.shift();

  saveInventory();
  renderInventory();
  renderTopDrops();
  populateCoinflipDropdown();
  updateBackpackValue();

  const winnerBox = document.getElementById("winner-name");
  if (winnerBox) {
    winnerBox.textContent = item.name;
    winnerBox.className = item.rarity.toLowerCase();
  }
}

// ===================== ADMIN GIVE =====================
function adminGiveItem() {
  const panel = document.getElementById("admin-give-panel");
  const itemsContainer = document.getElementById("admin-give-items");

  if (!adminMode) {
    const password = prompt("Enter Trading passkey:");
    if (password !== ADMIN_PASSWORD) return alert("Incorrect Trading Passkey.");
    adminMode = true;
    alert("Trading Mode Enabled.");
  }

  panel.style.display = "block";
  itemsContainer.innerHTML = "";

  let allItems = [];
  cases.forEach(c => c.items.forEach(item => allItems.push(item)));

  allItems.forEach((item) => {
    const div = document.createElement("div");
    div.className = "admin-give-item";
    div.innerHTML = `
      <img src="${item.image}">
      <div class="admin-give-info">
        <span class="name">${item.name}</span>
        <span class="price">${item.price.toFixed(2)} coins</span>
      </div>
      <button>Trade</button>
    `;
    div.querySelector("button").onclick = () => {
      if (coins < item.price) return alert("Not enough coins.");
      coins -= item.price;
      updateCoins();
      inventory.push({ ...item });
      saveInventory();
      renderInventory();
      populateCoinflipDropdown();
      updateBackpackValue();
      alert(`Traded ${item.name} for ${item.price.toFixed(2)} coins`);
    };
    itemsContainer.appendChild(div);
  });

  document.getElementById("admin-give-close").onclick = () => {
    panel.style.display = "none";
    adminMode = false;
  };
}


/* =========================
   UPGRADER SYSTEM 
   ========================= */
console.log("UPGRADER LOADED");

let Upgrader = {
  cases: [],
  selectedWager: null,
  selectedTarget: null,
  upgrading: false
};

/* ---------- INIT ---------- */

function initUpgrader() {
  createLoadButtons();
  syncUpgraderData();
  renderWager();
  renderTarget();
  updateUI();
}

/* ---------- SYNC GAME DATA ---------- */

function syncUpgraderData() {
  Upgrader.cases = cases || [];
}

/* ---------- INVENTORY ---------- */

function getInventory() {
  return inventory || [];
}

/* ---------- ITEM UI ---------- */

function itemCard(item) {
  return `
    <div class="upgrade-item ${item.rarity}">
      <img src="${item.image}" width="40" height="40">
      <div>
        <div>${item.name}</div>
        <small>${item.price.toFixed(2)} ⛃</small>
      </div>
    </div>
  `;
}

/* ---------- ALL CASE ITEMS ---------- */

function getAllSiteItems() {
  let all = [];

  Upgrader.cases.forEach(c => {
    (c.items || []).forEach(i => all.push(i));
  });

  return all;
}

/* ---------- WAGER ---------- */

function renderWager() {
  const box = document.getElementById("wager-list");
  if (!box) return;

  box.innerHTML = "";

  const inv = getInventory();

  if (!inv.length) {
    box.innerHTML = "<small>No items in inventory</small>";
    return;
  }

  inv.forEach(item => {
    const div = document.createElement("div");
    div.innerHTML = itemCard(item);

    div.onclick = () => {
      Upgrader.selectedWager = item;
      updateUI();
    };

    box.appendChild(div);
  });

  updateUI();
}

/* ---------- TARGET ---------- */

function renderTarget() {
  const box = document.getElementById("target-list");
  if (!box) return;

  box.innerHTML = "";

  const items = getAllSiteItems();

  if (!items.length) {
    box.innerHTML = "<small>No cases loaded</small>";
    return;
  }

  items.forEach(item => {
    const div = document.createElement("div");
    div.innerHTML = itemCard(item);

    div.onclick = () => {
      Upgrader.selectedTarget = item;
      updateUI();
    };

    box.appendChild(div);
  });

  updateUI();
}

/* ---------- CHANCE ---------- */

function calculateChance(w, t) {
  if (!w || !t) return 0;

  let chance = (w.price * 0.95 / t.price) * 100;

  if (chance > 100) return 0;
  if (chance < 0) return 0;

  return chance;
}

/* ---------- UI ---------- */

function updateUI() {
  const chanceBox = document.getElementById("upgrade-chance");
  const valueBox = document.getElementById("upgrade-value");

  if (!chanceBox || !valueBox) return;

  if (!Upgrader.selectedWager || !Upgrader.selectedTarget) {
    chanceBox.innerText = "Chance: 0%";
    valueBox.innerText = "0 ⛃ → 0 ⛃";
    return;
  }

  const w = Upgrader.selectedWager;
  const t = Upgrader.selectedTarget;

  const chance = calculateChance(w, t);

  chanceBox.innerText = `Chance: ${chance.toFixed(2)}%`;
  valueBox.innerText = `${w.price} ⛃ → ${t.price} ⛃`;
}

/* ---------- UPGRADE WHEEL ANIMATION ---------- */

function spinUpgradeWheel(success) {
  const canvas = document.getElementById("upgrade-wheel");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  const size = 220;
  canvas.width = size;
  canvas.height = size;

  let angle = 0;
  let targetAngle = Math.random() * Math.PI * 2 + 12 * Math.PI;

  if (!success) {
    targetAngle += Math.PI;
  }

  function draw() {
    ctx.clearRect(0, 0, size, size);

    // base circle
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, 80, 0, Math.PI * 2);
    ctx.fillStyle = "#222";
    ctx.fill();

    // pointer
    ctx.fillStyle = "#fff";
    ctx.fillRect(size / 2 - 2, 10, 4, 20);

    // rotating indicator
    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.rotate(angle);

    ctx.fillStyle = success ? "lime" : "red";
    ctx.fillRect(-5, -70, 10, 40);

    ctx.restore();

    angle += (targetAngle - angle) * 0.08;

    if (Math.abs(targetAngle - angle) > 0.01) {
      requestAnimationFrame(draw);
    }
  }

  draw();
}

/* ---------- UPGRADE BUTTON ---------- */

document.getElementById("upgrade-btn")?.addEventListener("click", () => {
  if (Upgrader.upgrading) return;

  const w = Upgrader.selectedWager;
  const t = Upgrader.selectedTarget;

  if (!w || !t) return;

  const chance = calculateChance(w, t);

  if (chance <= 0) {
    alert("Invalid upgrade");
    return;
  }

  Upgrader.upgrading = true;

  const btn = document.getElementById("upgrade-btn");
  if (btn) btn.innerText = "Upgrading...";

  setTimeout(() => {
    const roll = Math.random() * 100;
    const success = roll <= chance;

    spinUpgradeWheel(success);

    if (success) {
      alert("UPGRADE SUCCESS!");
      inventory.push(t);
    } else {
      alert("UPGRADE FAILED!");
    }

    saveInventory();
    renderInventory();

    Upgrader.upgrading = false;
    if (btn) btn.innerText = "Upgrade";

    renderWager();
    updateUI();

  }, 2000);
});

/* ---------- LOAD BUTTONS ---------- */

function createLoadButtons() {
  const sides = document.querySelectorAll(".upgrader-side");

  const wagerSide = sides[0];
  const targetSide = sides[1];

  if (wagerSide && !document.getElementById("load-wager-btn")) {
    const btn = document.createElement("button");
    btn.id = "load-wager-btn";
    btn.className = "theme-btn";
    btn.innerText = "Load Wager Items";
    btn.onclick = renderWager;
    wagerSide.prepend(btn);
  }

  if (targetSide && !document.getElementById("load-target-btn")) {
    const btn = document.createElement("button");
    btn.id = "load-target-btn";
    btn.className = "theme-btn";
    btn.innerText = "Load Target Items";
    btn.onclick = renderTarget;
    targetSide.prepend(btn);
  }
}

/* ---------- INIT ---------- */

window.addEventListener("load", () => {
  initUpgrader();
});
