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

// ================= CASE =================
let caseData;

fetch("data/cases.json")
  .then(res => res.json())
  .then(data => {
    caseData = data.cases[0];

    document.getElementById("case-image").src = caseData.image;
    document.getElementById("case-name").textContent = caseData.name;
    document.getElementById("open-btn").textContent = `Open for ${caseData.price} coins`;
  });

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

  for (let i = 0; i < 60; i++) {
    const random = caseData.items[Math.floor(Math.random() * caseData.items.length)];
    randomItems.push(random);
  }

  randomItems[55] = winItem; // Winning item near the end

  randomItems.forEach(item => {
    const div = document.createElement("div");
    div.className = `spinner-item ${item.rarity.toLowerCase()}`;
    div.innerHTML = `<img src="${item.image}">`;
    strip.appendChild(div);
  });

  strip.style.transition = "none";
  strip.style.left = "0px";
  strip.offsetHeight;

  strip.style.transition = "left 8s cubic-bezier(.1,.7,0,1)";
  strip.style.left = "-5500px";
}

// ================= OPEN BUTTON =================
document.getElementById("open-btn").addEventListener("click", () => {
  if (!caseData) return;
  if (coins < caseData.price) return alert("Not enough coins!");

  coins -= caseData.price;
  updateCoins();
  saveData();

  const winItem = weightedRandom(caseData.items);

  buildSpinner(winItem);

  setTimeout(() => {
    document.getElementById("winner-name").textContent = `You won: ${winItem.name}`;
    addToInventory(winItem);
    addRecentDrop(winItem);
  }, 8000);
});

// ================= TOP DROPS =================
function addRecentDrop(item) {
  recentDrops.push(item);
  if (recentDrops.length > 20) recentDrops.shift();
  saveData();
  renderTopDrops();
}

function renderTopDrops() {
  const container = document.getElementById("top-drops");
  container.innerHTML = "";

  const sorted = [...recentDrops]
    .sort((a, b) => b.price - a.price)
    .slice(0, 8);

  sorted.forEach(item => {
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

renderTopDrops();
