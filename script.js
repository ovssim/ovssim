// ================= COINS =================
let coins = parseInt(localStorage.getItem("coins")) || 1000;
localStorage.setItem("coins", coins);

function updateCoins() {
  document.getElementById("coins").textContent = `Coins: ${coins}`;
}
updateCoins();

// ================= INVENTORY =================
let inventory = JSON.parse(localStorage.getItem("inventory")) || [];
let recentDrops = JSON.parse(localStorage.getItem("recentDrops")) || [];

function saveData() {
  localStorage.setItem("inventory", JSON.stringify(inventory));
  localStorage.setItem("coins", coins);
  localStorage.setItem("recentDrops", JSON.stringify(recentDrops));
}

function addToInventory(item) {
  inventory.push(item);
  saveData();
  renderInventory();
}

function sellItem(index) {
  coins += inventory[index].price;
  inventory.splice(index, 1);
  saveData();
  updateCoins();

  // flash coins green
  const coinsEl = document.getElementById("coins");
  coinsEl.style.color = "lime";
  setTimeout(() => coinsEl.style.color = "white", 500);

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
      <small>${item.price} coins</small><br>
      <button class="sell-btn">Sell</button>
    `;

    div.querySelector(".sell-btn").onclick = () => sellItem(index);

    inv.appendChild(div);
  });
}
renderInventory();

// ================= INVENTORY TOGGLE =================
document.getElementById("toggle-inv-btn").addEventListener("click", () => {
  const inv = document.getElementById("inventory");
  inv.classList.toggle("hidden");
});

// ================= COIN ADJUST =================
document.getElementById("add-coins-btn").addEventListener("click", () => {
  coins += 50;
  updateCoins();
  saveData();
});

document.getElementById("remove-coins-btn").addEventListener("click", () => {
  coins -= 50;
  if (coins < 0) coins = 0;
  updateCoins();
  saveData();
});

// ================= CASE DATA =================
let caseData;
let caseDataList = [];

fetch("data/cases.json")
  .then(res => res.json())
  .then(data => {
    caseDataList = data.cases;
    populateCaseSelect();
    selectCase(caseDataList[0].id); // default to first case
  });

// Populate the select dropdown
function populateCaseSelect() {
  const select = document.getElementById("case-select");
  select.innerHTML = "";

  caseDataList.forEach(c => {
    const option = document.createElement("option");
    option.value = c.id;
    option.textContent = c.name;
    select.appendChild(option);
  });

  select.addEventListener("change", () => {
    selectCase(select.value);
  });
}

// Change the current case
function selectCase(caseId) {
  caseData = caseDataList.find(c => c.id === caseId);
  document.getElementById("case-image").src = caseData.image;
  document.getElementById("case-name").textContent = caseData.name;
  document.getElementById("open-btn").textContent = `Open for ${caseData.price} coins`;

  // preload images of the new case
  caseData.items.forEach(item => {
    const img = new Image();
    img.src = item.image;
  });
}

// ================= RNG =================
function weightedRandom(items) {
  const total = items.reduce((sum, i) => sum + i.weight, 0);
  let roll = Math.random() * total;

  for (let item of items) {
    if (roll < item.weight) return item;
    roll -= item.weight;
  }
}

// ================= SPINNER =================
function buildSpinner(winItem) {
  const strip = document.getElementById("spinner-strip");
  strip.innerHTML = "";

  const randomItems = [];
  const totalItems = 60;
  const winIndex = Math.floor(totalItems / 2);

  for (let i = 0; i < totalItems; i++) {
    const random = caseData.items[Math.floor(Math.random() * caseData.items.length)];
    randomItems.push(random);
  }
  randomItems[winIndex] = winItem;

  // Preload spinner images
  const imagePromises = randomItems.map(item => {
    return new Promise(resolve => {
      const img = new Image();
      img.src = item.image;
      img.onload = resolve;
      img.onerror = resolve;
    });
  });

  Promise.all(imagePromises).then(() => {
    randomItems.forEach(item => {
      const div = document.createElement("div");
      div.className = `spinner-item ${item.rarity.toLowerCase()}`;
      div.innerHTML = `<img src="${item.image}">`;
      strip.appendChild(div);
    });

    const itemWidth = strip.querySelector(".spinner-item").offsetWidth + 20;
    const distance = winIndex * itemWidth * -1 + strip.parentElement.offsetWidth / 2 - itemWidth / 2;

    strip.style.transition = "none";
    strip.style.left = "0px";
    strip.offsetHeight;

    strip.style.transition = "left 8s cubic-bezier(.1,.7,0,1)";
    strip.style.left = `${distance}px`;
  });
}

// ================= OPEN BUTTON =================
document.getElementById("open-btn").addEventListener("click", () => {
  if (!caseData) return;

  if (coins < caseData.price) {
    const coinsEl = document.getElementById("coins");
    coinsEl.style.color = "red";
    setTimeout(() => coinsEl.style.color = "white", 1000);
    return;
  }

  coins -= caseData.price;
  updateCoins();
  saveData();

  const winItem = weightedRandom(caseData.items);
  buildSpinner(winItem);

  setTimeout(() => {
    document.getElementById("winner-name").textContent =
      `You won: ${winItem.name}`;
    addToInventory(winItem);
    addRecentDrop(winItem);
  }, 8000);
});

// ================= TOP DROPS =================
function addRecentDrop(item) {
  recentDr
