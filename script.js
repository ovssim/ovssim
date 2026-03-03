// ===================== GLOBAL STATE =====================
let coins = parseFloat(localStorage.getItem("coins"));
if (isNaN(coins) || coins < 0) coins = 100;

let inventory = JSON.parse(localStorage.getItem("inventory")) || [];
let recentDrops = JSON.parse(localStorage.getItem("recentDrops")) || [];
let cases = [];
let currentCase = null;

// ===================== LOAD CASES =====================
function loadCases() {
  fetch("data/cases.json")
    .then(res => res.json())
    .then(data => {
      cases = data.cases;

      // Main case dropdown
      const display = document.getElementById("case-select-display");
      const options = document.getElementById("case-select-options");
      options.innerHTML = "";
      cases.forEach(c => {
        const div = document.createElement("div");
        div.innerHTML = `<img src="${c.image}"><span>${c.name} (${c.price} coins)</span>`;
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

      // Battle case dropdown
      const battleSelect = document.getElementById("battle-case-select");
      battleSelect.innerHTML = "";
      cases.forEach(c => {
        const option = document.createElement("option");
        option.value = c.id;
        option.textContent = `${c.name} (${c.price} coins)`;
        battleSelect.appendChild(option);
      });
    });
}

function selectCase(id) {
  currentCase = cases.find(c => c.id === id);
  if (!currentCase) return;

  document.getElementById("case-image").src = currentCase.image;
  document.getElementById("case-name").textContent = currentCase.name;
  document.getElementById("open-btn").textContent = ` ${currentCase.price} Coins`;
}

// ===================== INIT =====================
document.addEventListener("DOMContentLoaded", () => {
  updateCoins();
  renderInventory();
  renderTopDrops();
  loadCases();
  populateCoinflipDropdown();

  // Buttons
  document.getElementById("sell-all-btn").onclick = sellAllItems;
  document.getElementById("add-coins-btn").onclick = () => { coins += 50; updateCoins(); };
  document.getElementById("remove-coins-btn").onclick = () => { coins = Math.max(0, coins - 5); updateCoins(); };
  document.getElementById("coinflip-btn").onclick = () => {
    const select = document.getElementById("coinflip-select");
    const index = parseInt(select.value);
    if (!isNaN(index)) coinflipItem(index);
  };
  document.getElementById("open-btn").onclick = openCase;

  // Toggle between main and battle mode
  document.getElementById("toggle-mode-btn").onclick = toggleMode;

  // Start battle button
  document.getElementById("start-battle-btn").onclick = startBattle;
});

// ===================== COINS =====================
function updateCoins() {
  document.getElementById("coins").textContent = `Balance: ${coins.toFixed(2)}`;
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
      <small>${item.price} coins</small>
      <button class="sell-btn theme-btn">Sell</button>
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
}

function sellAllItems() {
  if (inventory.length === 0) return alert("Inventory empty.");
  const total = inventory.reduce((sum, i) => sum + i.price, 0);
  coins += total;
  inventory = [];
  saveInventory();
  updateCoins();
  renderInventory();
  populateCoinflipDropdown();
  alert(`Sold everything for ${total.toFixed(2)} coins.`);
}

// ===================== SHOW / HIDE CASE ITEMS + ODDS =====================
document.getElementById("show-case-items-btn").onclick = () => {
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
      <small>${item.price} coins</small>
      <small style="font-size:14px; margin-top:5px;">🎯 ${dropRate}% chance</small>
    `;
    list.appendChild(div);
  });
};

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
        <strong>${item.price} coins</strong>
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
    option.textContent = `${item.name} (${item.price} coins)`;
    select.appendChild(option);
  });
}

function coinflipItem(index) {
  const item = inventory[index];
  const coin = document.getElementById("coin");
  const coinImage = document.getElementById("coin-image");
  const flipBtn = document.getElementById("coinflip-btn");
  flipBtn.disabled = true;

  const win = Math.random() < 0.5;
  const finalClass = win ? "head" : "tail";
  coinImage.src = win ? "images/items/coin-head.png" : "images/items/coin-tail.png";

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
        alert(`You lost, your ${item.name} was evicerated.`);
      }

      saveInventory();
      renderInventory();
      populateCoinflipDropdown();
      flipBtn.disabled = false;
    }
  }, 150);
}

// ===================== CASE SYSTEM =====================
function openCase() {
  if (!currentCase) return;
  if (coins < currentCase.price) return alert("Not enough coins.");

  coins -= currentCase.price;
  updateCoins();

  const winningItem = getRandomItem(currentCase.items);
  spinToItem(winningItem);
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
    strip.appendChild(div);
  }

  const itemWidth = strip.children[0].offsetWidth + 30;
  const containerWidth = document.getElementById("spinner-container").offsetWidth;
  const offset = -(winnerIndex * itemWidth - containerWidth / 2 + itemWidth / 2);

  strip.style.transition = "none";
  strip.style.transform = "translateX(0)";
  strip.offsetHeight;

  strip.style.transition = "transform 3.2s cubic-bezier(.25,.85,.35,1)";
  strip.style.transform = `translateX(${offset}px)`;

  setTimeout(() => {
    showWinner(winningItem);
  }, 3200);
}

function showWinner(item) {
  inventory.push(item);
  recentDrops.push(item);
  if (recentDrops.length > 20) recentDrops.shift();

  saveInventory();
  renderInventory();
  renderTopDrops();
  populateCoinflipDropdown();

  const winnerBox = document.getElementById("winner-name");
  if (winnerBox) {
    winnerBox.textContent = item.name;
    winnerBox.className = item.rarity.toLowerCase();
  }
}

// ===================== TOGGLE MAIN / BATTLE =====================
function toggleMode() {
  const main = document.getElementById("main-section");
  const battle = document.getElementById("battle-section");
  const btn = document.getElementById("toggle-mode-btn");

  if (battle.style.display === "none") {
    battle.style.display = "block";
    main.style.display = "none";
    btn.textContent = "Switch to Cases/Coinflip";
  } else {
    battle.style.display = "none";
    main.style.display = "block";
    btn.textContent = "Switch to Battle Mode";
  }
}

// ===================== CASE BATTLE =====================
function startBattle() {
  const select = document.getElementById("battle-case-select");
  const battleCase = cases.find(c => c.id === select.value);
  if (!battleCase) return;

  if (coins < battleCase.price) return alert("Not enough coins to battle.");
  coins -= battleCase.price;
  updateCoins();

  // Unbox player and bot items
  let playerItem = getRandomItem(battleCase.items);
  let botItem = getRandomItem(battleCase.items);

  // Reroll on tie
  while (playerItem.price === botItem.price) {
    playerItem = getRandomItem(battleCase.items);
    botItem = getRandomItem(battleCase.items);
  }

  spinBattle(playerItem, botItem);
}

function spinBattle(playerItem, botItem) {
  const playerStrip = document.getElementById("battle-spinner-player-strip");
  const botStrip = document.getElementById("battle-spinner-bot-strip");

  playerStrip.innerHTML = "";
  botStrip.innerHTML = "";

  const slots = 30;
  const winnerIndex = 15;

  for (let i = 0; i < slots; i++) {
    let pItem = currentCase.items[Math.floor(Math.random() * currentCase.items.length)];
    let bItem = currentCase.items[Math.floor(Math.random() * currentCase.items.length)];
    if (i === winnerIndex) { pItem = playerItem; bItem = botItem; }

    const pDiv = document.createElement("div");
    pDiv.className = `battle-spinner-item ${pItem.rarity.toLowerCase()}`;
    pDiv.innerHTML = `<img src="${pItem.image}">`;
    playerStrip.appendChild(pDiv);

    const bDiv = document.createElement("div");
    bDiv.className = `battle-spinner-item ${bItem.rarity.toLowerCase()}`;
    bDiv.innerHTML = `<img src="${bItem.image}">`;
    botStrip.appendChild(bDiv);
  }

  const itemWidth = playerStrip.children[0].offsetWidth + 30;
  const containerWidth = document.querySelector(".battle-spinner-container").offsetWidth;
  const offset = -(winnerIndex * itemWidth - containerWidth / 2 + itemWidth / 2);

  [playerStrip, botStrip].forEach(strip => {
    strip.style.transition = "none";
    strip.style.transform = "translateX(0)";
    strip.offsetHeight;
    strip.style.transition = "transform 3s cubic-bezier(.25,.85,.35,1)";
    strip.style.transform = `translateX(${offset}px)`;
  });

  setTimeout(() => {
    const winnerBox = document.getElementById("battle-winner-name");
    let winner;
    if (playerItem.price > botItem.price) {
      winner = "PLAYER WINS!";
      inventory.push(playerItem, botItem);
      winnerBox.textContent = winner;
      winnerBox.className = playerItem.rarity.toLowerCase();
    } else {
      winner = "BOT WINS!";
      winnerBox.textContent = winner;
      winnerBox.className = botItem.rarity.toLowerCase();
    }

    saveInventory();
    renderInventory();
    renderTopDrops();
    populateCoinflipDropdown();
  }, 3200);
}
