// ================= COINS =================
let coins = parseInt(localStorage.getItem("coins")) || 1000;
updateCoins();

function updateCoins() {
  document.getElementById("coins").textContent = `Coins: ${coins}`;
}

// Add/Subtract 50 Coins
document.getElementById("add50").onclick = () => { coins += 50; localStorage.setItem("coins", coins); updateCoins(); };
document.getElementById("remove50").onclick = () => { coins -= 50; localStorage.setItem("coins", coins); updateCoins(); };

// ================= INVENTORY =================
let inventory = JSON.parse(localStorage.getItem("inventory")) || [];

function saveInventory() {
  localStorage.setItem("inventory", JSON.stringify(inventory));
}

function addToInventory(item) {
  inventory.push(item);
  saveInventory();
  renderInventory();
}

function sellItem(index) {
  coins += inventory[index].price;
  inventory.splice(index, 1);
  localStorage.setItem("coins", coins);
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
    div.innerHTML = `<img src="${item.image}" width="70"><p>${item.name}</p><small>${item.price} coins</small><br><button class="sell-btn">Sell</button>`;
    div.querySelector(".sell-btn").onclick = () => sellItem(index);
    inv.appendChild(div);
  });
}

// Toggle Inventory
document.getElementById("toggle-inventory").onclick = () => {
  const inv = document.getElementById("inventory");
  inv.style.display = inv.style.display === "none" ? "flex" : "none";
};

// ================= CASE DATA =================
let caseData = null;
let allCases = [];

fetch("data/cases.json")
  .then(res => res.json())
  .then(data => {
    allCases = data.cases;
    populateCaseMenu();
    loadCase(allCases[0]);
  });

function populateCaseMenu() {
  const menu = document.getElementById("case-menu");
  allCases.forEach((c, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = c.name;
    menu.appendChild(opt);
  });

  menu.onchange = () => loadCase(allCases[menu.value]);
}

function loadCase(c) {
  caseData = c;
  document.getElementById("case-container").innerHTML = `<img src="${c.image}" width="180"><p>Price: ${c.price} coins</p>`;
  document.getElementById("open-btn").textContent = `Open Case`;
}

// ================= RNG =================
function weightedRandom(items) {
  const total = items.reduce((sum, i) => sum + i.weight, 0);
  let roll = Math.random() * total;
  for (let i of items) {
    if (roll < i.weight) return i;
    roll -= i.weight;
  }
}

// ================= SPINNER =================
function createSpinnerItem(item) {
  const div = document.createElement("div");
  div.classList.add("spinner-item", item.rarity.toLowerCase());
  const img = document.createElement("img");
  img.src = item.image;
  div.appendChild(img);
  return div;
}

function buildSpinner(items) {
  const strip = document.getElementById("spinner-strip");
  strip.innerHTML = "";
  for (let i = 0; i < 60; i++) {
    const rand = items[Math.floor(Math.random() * items.length)];
    strip.appendChild(createSpinnerItem(rand));
  }
}

function spinToItem(winItem) {
  const strip = document.getElementById("spinner-strip");
  const cards = strip.querySelectorAll(".spinner-item");
  cards.forEach(c => c.classList.remove("winning"));

  const winIndex = Math.floor(cards.length * 0.75);
  strip.replaceChild(createSpinnerItem(winItem), cards[winIndex]);

  const cardWidth = cards[0].offsetWidth + 18;
  const containerWidth = document.getElementById("spinner-container").offsetWidth;
  const offset = -(winIndex * cardWidth - containerWidth / 2 + cardWidth / 2);

  strip.style.transition = "none";
  strip.style.left = "0px";
  strip.offsetHeight;
  strip.style.transition = "left 6s cubic-bezier(.1,.7,0,1)";
  strip.style.left = offset + "px";

  setTimeout(() => {
    strip.querySelectorAll(".spinner-item")[winIndex].classList.add("winning");
    document.getElementById("result").textContent = `You won: ${winItem.name}`;
    addToInventory(winItem);
    document.getElementById("open-btn").disabled = false;
  }, 6000);
}

// ================= OPEN BUTTON =================
document.getElementById("open-btn").onclick = () => {
  if (!caseData) return alert("Case not loaded!");
  if (coins < caseData.price) return alert("Not enough coins!");

  coins -= caseData.price;
  updateCoins();
  localStorage.setItem("coins", coins);

  buildSpinner(caseData.items);
  spinToItem(weightedRandom(caseData.items));

  document.getElementById("open-btn").disabled = true;
};

