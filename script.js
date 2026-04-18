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


// ======================= UPGRADER CORE =======================

let ALL_ITEMS = [];
let wagerItems = [];
let targetItems = [];
let upgrading = false;

// ======================= INIT LOAD =======================
async function initUpgrader() {
  try {
    const res = await fetch("cases.json");
    const data = await res.json();

    ALL_ITEMS = [];

    data.cases.forEach(c => {
      c.items.forEach(i => {
        ALL_ITEMS.push({
          name: i.name,
          price: Number(i.price),
          image: i.image,
          rarity: i.rarity || "common"
        });
      });
    });

    buildTargetUI();
    observeInventory(); // IMPORTANT FIX
  } catch (err) {
    console.error("Upgrader failed to load cases.json", err);
  }
}

// ======================= OBSERVE INVENTORY =======================
function observeInventory() {
  const inv = document.getElementById("inventory");
  if (!inv) return;

  const obs = new MutationObserver(() => {
    hookInventory();
  });

  obs.observe(inv, { childList: true, subtree: true });

  hookInventory();
}

// ======================= HOOK INVENTORY =======================
function hookInventory() {
  const items = document.querySelectorAll("#inventory .inv-item");

  items.forEach(el => {
    if (el.dataset.upgraded) return;
    el.dataset.upgraded = "true";

    el.addEventListener("click", () => {
      const name = el.dataset.name || el.querySelector("img")?.alt;
      const priceText = el.innerText.match(/[\d.]+/);

      if (!priceText) return;

      const item = {
        name,
        price: parseFloat(priceText[0]),
        image: el.querySelector("img")?.src,
        rarity: el.dataset.rarity || "common"
      };

      toggle(wagerItems, item);
      updateUI();
    });
  });
}

// ======================= TARGET UI =======================
function buildTargetUI() {
  const box = document.getElementById("target-list");
  if (!box) return;

  box.innerHTML = "";

  
  const pool = [...ALL_ITEMS, ...ALL_ITEMS, ...ALL_ITEMS];

  pool.forEach(item => {
    const div = document.createElement("div");
    div.className = "upgrade-item " + item.rarity;

    div.innerHTML = `
      <img src="${item.image}">
      <div>
        <div>${item.name}</div>
        <small>$${item.price.toFixed(2)}</small>
      </div>
    `;

    div.onclick = () => {
      toggle(targetItems, item);
      updateUI();
    };

    box.appendChild(div);
  });
}

// ======================= TOGGLE =======================
function toggle(arr, item) {
  const i = arr.findIndex(x => x.name === item.name && x.price === item.price);

  if (i >= 0) arr.splice(i, 1);
  else arr.push(item);
}

// ======================= VALUE =======================
function total(arr) {
  return arr.reduce((a, b) => a + (b.price || 0), 0);
}

// ======================= UI =======================
function updateUI() {
  const w = total(wagerItems);
  const t = total(targetItems);

  const chanceEl = document.getElementById("upgrade-chance");
  const valueEl = document.getElementById("upgrade-value");
  const btn = document.getElementById("upgrade-btn");

  if (!w || !t) {
    chanceEl.innerText = "Chance: 0%";
    valueEl.innerText = "0 → 0";
    return;
  }

  let chance = (w * 0.95 / t) * 100;

  if (chance > 100) {
    chanceEl.innerText = "Upgrade Blocked (Target Too Cheap)";
    btn.disabled = true;
    return;
  }

  btn.disabled = false;

  chanceEl.innerText = `Chance: ${chance.toFixed(2)}%`;
  valueEl.innerText = `${w.toFixed(2)} ⛃ → ${t.toFixed(2)} ⛃`;
}

// ======================= UPGRADE =======================
document.getElementById("upgrade-btn").onclick = async () => {
  if (upgrading) return;

  const w = total(wagerItems);
  const t = total(targetItems);

  if (!w || !t) return;

  let chance = (w * 0.95 / t) * 100;

  if (chance > 100) return;

  upgrading = true;

  document.getElementById("upgrade-btn").disabled = true;

  await spinAnimation(chance);

  const roll = Math.random() * 100;

  if (roll <= chance) {
    alert("UPGRADE SUCCESS!");
  } else {
    alert("UPGRADE FAILED!");
  }

  wagerItems = [];
  targetItems = [];

  updateUI();
  buildTargetUI();

  upgrading = false;
  document.getElementById("upgrade-btn").disabled = false;
};

// ======================= SPIN (SMOOTH PERIMETER STYLE) =======================
function spinAnimation(chance) {
  return new Promise(resolve => {
    const canvas = document.getElementById("upgrade-wheel");
    if (!canvas) return resolve();

    const ctx = canvas.getContext("2d");

    let start = performance.now();

    function loop(t) {
      let p = Math.min((t - start) / 2500, 1);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(150, 150);
      ctx.rotate(p * Math.PI * 8);

      ctx.beginPath();
      ctx.arc(0, 0, 120, 0, Math.PI * 2);
      ctx.strokeStyle = "gold";
      ctx.lineWidth = 6;
      ctx.stroke();

      ctx.restore();

      if (p < 1) requestAnimationFrame(loop);
      else resolve();
    }

    requestAnimationFrame(loop);
  });
}

// ======================= START =======================
initUpgrader();
