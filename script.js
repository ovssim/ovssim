// ===================== GLOBAL STATE =====================
let coins = parseFloat(localStorage.getItem("coins")) || 100;
let inventory = JSON.parse(localStorage.getItem("inventory")) || [];
let cases = [];
let currentCase = null;
let recentDrops = JSON.parse(localStorage.getItem("recentDrops")) || [];

// ===================== INIT =====================
document.addEventListener("DOMContentLoaded", () => {
  updateCoins();
  renderInventory();
  renderTopDrops();
  loadCases();

  // Button Events
  document.getElementById("toggle-inv-btn").onclick = () =>
    document.getElementById("inventory").classList.toggle("hidden");

  document.getElementById("add-coins-btn").onclick = () => {
    coins += 0.10;
    updateCoins();
  };

  document.getElementById("remove-coins-btn").onclick = () => {
    coins = Math.max(0, coins - 0.04);
    updateCoins();
  };

  document.getElementById("show-items-btn").onclick = toggleCaseItems;
});

// ===================== COINS =====================
function updateCoins() {
  document.getElementById("coins").textContent = `Coins: ${coins.toFixed(2)}`;
  localStorage.setItem("coins", coins);
}

// ===================== INVENTORY =====================
function saveInventory() {
  localStorage.setItem("inventory", JSON.stringify(inventory));
  localStorage.setItem("recentDrops", JSON.stringify(recentDrops));
}

function addToInventory(item) {
  inventory.push(item);
  recentDrops.push(item);
  if (recentDrops.length > 20) recentDrops.shift();
  saveInventory();
  renderInventory();
  renderTopDrops();
}

function sellItem(index) {
  coins += inventory[index].price;
  inventory.splice(index, 1);
  saveInventory();
  updateCoins();
  renderInventory();
}

function renderInventory() {
  const inv = document.getElementById("inventory");
  inv.innerHTML = "";

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
    inv.appendChild(div);
  });
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
      d.className = `top-drop ${i.rarity.toLowerCase()}`;
      d.innerHTML = `<img src="${i.image}"><p>${i.name}</p><strong>${i.price} coins</strong>`;
      c.appendChild(d);
    });
}

// ===================== LOAD CASES =====================
function loadCases() {
  fetch("data/cases.json")
    .then(res => res.json())
    .then(data => {
      cases = data.cases;
      populateCaseSelect();
      selectCase(cases[0].id);
    });
}

function populateCaseSelect() {
  const select = document.getElementById("case-select");
  select.innerHTML = "";
  cases.forEach(c => {
    const option = document.createElement("option");
    option.value = c.id;
    option.textContent = `${c.name} (${c.price} coins)`;
    select.appendChild(option);
  });

  select.onchange = () => selectCase(select.value);
  document.getElementById("show-select-btn").onclick = () =>
    select.classList.toggle("hidden");
}

function selectCase(id) {
  currentCase = cases.find(c => c.id === id);
  if (!currentCase) return;

  document.getElementById("case-image").src = currentCase.image;
  document.getElementById("case-name").textContent = currentCase.name;
  document.getElementById("open-btn").textContent = `Open for ${currentCase.price} Coins`;

  // Preload images
  currentCase.items.forEach(i => new Image().src = i.image);

  // Hide case items list when switching
  document.getElementById("case-items-list").classList.add("hidden");
  document.getElementById("case-items-list").innerHTML = "";
}

// ===================== CASE ITEMS LIST =====================
function toggleCaseItems() {
  const listDiv = document.getElementById("case-items-list");
  listDiv.classList.toggle("hidden");

  if (!currentCase) return;
  if (!listDiv.classList.contains("hidden")) {
    listDiv.innerHTML = ""; // Clear before filling
    currentCase.items
      .sort((a, b) => b.price - a.price) // Descending by price
      .forEach(i => {
        const itemDiv = document.createElement("div");
        itemDiv.className = `inv-item ${i.rarity.toLowerCase()}`;
        const chance = ((i.weight / currentCase.items.reduce((s, it) => s + it.weight, 0)) * 100).toFixed(2);
        itemDiv.innerHTML = `
          <img src="${i.image}">
          <p>${i.name}</p>
          <small>${i.price} coins | ${chance}% chance</small>
        `;
        listDiv.appendChild(itemDiv);
      });
  }
}

// ===================== WEIGHTED RNG =====================
function getRandomItem(items) {
  const totalWeight = items.reduce((sum, i) => sum + i.weight, 0);
  let roll = Math.random() * totalWeight;
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

  const totalSlots = 50;
  const winnerIndex = 38;
  const items = currentCase.items;

  for (let i = 0; i < totalSlots; i++) {
    let item = items[Math.floor(Math.random() * items.length)];
    if (i === winnerIndex) item = winningItem;
    const div = document.createElement("div");
    div.className = `spinner-item ${item.rarity.toLowerCase()}`;
    div.innerHTML = `<img src="${item.image}">`;
    strip.appendChild(div);
  }

  const spinnerItems = strip.querySelectorAll(".spinner-item");
  const itemWidth = spinnerItems[0].offsetWidth + 30; 
  const containerWidth = document.getElementById("spinner-container").offsetWidth;
  const offset = -(winnerIndex * itemWidth - containerWidth / 2 + itemWidth / 2);

  strip.style.transition = "none";
  strip.style.transform = "translateX(0px)";
  strip.offsetHeight;

  strip.style.transition = "transform 3.2s cubic-bezier(.25,.85,.35,1)";
  strip.style.transform = `translateX(${offset}px)`;

  setTimeout(() => {
    spinnerItems[winnerIndex].classList.add("highlight-won");
    showWinner(winningItem);
  }, 3200);
}

// ===================== SHOW WINNER =====================
function showWinner(item) {
  const nameBox = document.getElementById("winner-name");
  if (nameBox) {
    nameBox.textContent = `You won: ${item.name}`;
    nameBox.className = item.rarity.toLowerCase();
  }
  addToInventory(item);
}

// ===================== OPEN BUTTON =====================
document.getElementById("open-btn").addEventListener("click", () => {
  if (!currentCase) return;
  if (coins < currentCase.price) {
    alert("Not enough coins!");
    return;
  }

  coins -= currentCase.price;
  updateCoins();

  const winningItem = getRandomItem(currentCase.items);
  spinToItem(winningItem);
});
