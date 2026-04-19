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
   UPGRADE SYSTEM (FIXED FULL)
========================= */

let Upgrader = {
  cases: [],
  selectedWagers: [],
  selectedTargets: [],
  upgrading: false
};

/* =========================
   SAFE KEY
========================= */
function getKey(item, index = 0) {
  return `${item.name}|${item.price}|${item.image}|${index}`;
}

/* =========================
   INIT
========================= */
window.addEventListener("load", () => {
  waitForCases(() => {
    Upgrader.cases = cases || [];
    createLoadButtons();
    renderWager();
    renderTarget();
    updateUI();
  });
});

function waitForCases(cb) {
  if (!cases || !cases.length) {
    setTimeout(() => waitForCases(cb), 150);
    return;
  }
  cb();
}

/* =========================
   LOAD BUTTONS
========================= */
function createLoadButtons() {
  const wagerParent = document.querySelector("#wager-list")?.parentElement;
  const targetParent = document.querySelector("#target-list")?.parentElement;

  if (wagerParent && !document.getElementById("load-wager-btn")) {
    const btn = document.createElement("button");
    btn.id = "load-wager-btn";
    btn.className = "theme-btn";
    btn.textContent = "Load Wager Items";
    btn.onclick = renderWager;
    wagerParent.prepend(btn);
  }

  if (targetParent && !document.getElementById("load-target-btn")) {
    const btn = document.createElement("button");
    btn.id = "load-target-btn";
    btn.className = "theme-btn";
    btn.textContent = "Load Target Items";
    btn.onclick = renderTarget;
    targetParent.prepend(btn);
  }
}

/* =========================
   WAGER RENDER
========================= */
function renderWager() {
  const box = document.getElementById("wager-list");
  if (!box) return;

  box.innerHTML = "";

  inventory.forEach((item, index) => {
    const key = getKey(item, index);
    const selected = Upgrader.selectedWagers.some(i => i.key === key);

    const div = document.createElement("div");
    div.className = `upgrade-item ${item.rarity} ${selected ? "selected" : ""}`;

    div.innerHTML = `
      <img src="${item.image}">
      <small>${item.name}</small>
      <small>${item.price.toFixed(2)} ⛃</small>
    `;

    div.onclick = () => {
      const exists = Upgrader.selectedWagers.find(i => i.key === key);

      if (exists) {
        Upgrader.selectedWagers = Upgrader.selectedWagers.filter(i => i.key !== key);
      } else {
        Upgrader.selectedWagers.push({ item, index, key });
      }

      renderWager();
      updateUI();
    };

    box.appendChild(div);
  });
}

/* =========================
   TARGET RENDER
========================= */
function renderTarget() {
  const box = document.getElementById("target-list");
  if (!box) return;

  box.innerHTML = "";

  let allItems = [];
  cases.forEach(c => {
    if (c?.items) {
      c.items.forEach(i => allItems.push(i));
    }
  });

  allItems.forEach((item, index) => {
    const key = getKey(item, index);
    const selected = Upgrader.selectedTargets.some(i => i.key === key);

    const div = document.createElement("div");
    div.className = `upgrade-item ${item.rarity} ${selected ? "selected" : ""}`;

    div.innerHTML = `
      <img src="${item.image}">
      <small>${item.name}</small>
      <small>${item.price.toFixed(2)} ⛃</small>
    `;

    div.onclick = () => {
      const exists = Upgrader.selectedTargets.find(i => i.key === key);

      if (exists) {
        Upgrader.selectedTargets = Upgrader.selectedTargets.filter(i => i.key !== key);
      } else {
        Upgrader.selectedTargets.push({ item, index, key });
      }

      renderTarget();
      updateUI();
    };

    box.appendChild(div);
  });
}

/* =========================
   CIRCLE UPDATE (THIS FIXES YOUR ISSUE)
========================= */
function updateUpgradeCircle(chance, state = "idle") {
  const circle = document.getElementById("upgrade-circle");
  if (!circle) return;

  let color = "#00bfff"; // cyan default

  if (state === "win") color = "#00ff88";
  if (state === "lose") color = "#ff3b3b";

  circle.style.background = `conic-gradient(
    ${color} 0% ${chance}%,
    rgba(0, 191, 255, 0.15) ${chance}% 100%
  )`;

  circle.style.boxShadow =
    state === "win"
      ? "0 0 25px #00ff88"
      : state === "lose"
      ? "0 0 25px #ff3b3b"
      : "0 0 25px #00bfff";
}

/* =========================
   UI UPDATE
========================= */
function updateUI() {
  const chanceBox = document.getElementById("upgrade-chance");
  const valueBox = document.getElementById("upgrade-value");

  const wager = Upgrader.selectedWagers.reduce((a, b) => a + b.item.price, 0);
  const target = Upgrader.selectedTargets.reduce((a, b) => a + b.item.price, 0);

  const chance = target ? Math.min(100, (wager * 0.95 / target) * 100) : 0;

  if (chanceBox) chanceBox.textContent = `Chance: ${chance.toFixed(2)}%`;
  if (valueBox) valueBox.textContent = `${wager.toFixed(2)} ⛃ → ${target.toFixed(2)} ⛃`;

  updateUpgradeCircle(chance, "idle");
}

/* =========================
   UPGRADE BUTTON (2 SECOND PAUSE + FIXED CIRCLE)
========================= */
document.getElementById("upgrade-btn").onclick = () => {
  if (Upgrader.upgrading) return;
  if (!Upgrader.selectedWagers.length || !Upgrader.selectedTargets.length) return;

  const wager = Upgrader.selectedWagers.reduce((a, b) => a + b.item.price, 0);
  const target = Upgrader.selectedTargets.reduce((a, b) => a + b.item.price, 0);

  const chance = Math.min(100, (wager * 0.95 / target) * 100);

  Upgrader.upgrading = true;

  // show cyan preview first
  updateUpgradeCircle(chance, "idle");

  setTimeout(() => {
    const win = Math.random() * 100 <= chance;

    if (win) {
      Upgrader.selectedTargets.forEach(t => inventory.push({ ...t.item }));
    }

    Upgrader.selectedWagers
      .sort((a, b) => b.index - a.index)
      .forEach(w => inventory.splice(w.index, 1));

    updateUpgradeCircle(chance, win ? "win" : "lose");

    Upgrader.selectedWagers = [];
    Upgrader.selectedTargets = [];

    saveInventory();
    renderInventory();
    renderWager();
    renderTarget();
    updateUI();

    Upgrader.upgrading = false;
  }, 2000);
};
