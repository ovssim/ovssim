// ===================== COINS =====================
let coins = parseInt(localStorage.getItem("coins")) || 1000;
localStorage.setItem("coins", coins);

function updateCoins() {
  document.getElementById("coins").textContent = `Coins: ${coins}`;
}
updateCoins();

// ===================== INVENTORY =====================
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

    div.innerHTML = `
      <img src="${item.image}" width="70">
      <p>${item.name}</p>
      <small>${item.price} coins</small><br>
      <button class="sell-btn">Sell</button>
    `;

    div.querySelector(".sell-btn").onclick = () => sellItem(index);

    inv.appendChild(div);
  });
}
renderInventory();

// ===================== CASE DATA =====================
let caseData = null;

fetch("data/cases.json")
  .then(res => res.json())
  .then(data => {
    caseData = data.cases[0];

    document.getElementById("case-container").innerHTML = `
      <img src="${caseData.image}" width="180">
      <p>Price: ${caseData.price} coins</p>
    `;
  });

// ===================== WEIGHTED RNG =====================
function weightedRandom(items) {
  let total = items.reduce((sum, i) => sum + i.weight, 0);
  let random = Math.random() * total;

  for (let item of items) {
    if (random < item.weight) return item;
    random -= item.weight;
  }
}

// ===================== CREATE SPINNER CARD =====================
function createSpinnerItem(item) {
  const div = document.createElement("div");
  div.classList.add("spinner-item", item.rarity.toLowerCase());

  const img = document.createElement("img");
  img.src = item.image;

  div.appendChild(img);
  return div;
}

// ===================== BUILD RANDOM SPINNER =====================
function buildSpinner(items) {
  const strip = document.getElementById("spinner-strip");
  strip.innerHTML = "";

  for (let i = 0; i < 60; i++) {
    const randomItem =
      items[Math.floor(Math.random() * items.length)];

    strip.appendChild(createSpinnerItem(randomItem));
  }
}

// ===================== SPIN TO WINNER =====================
function spinToItem(winItem) {
  const strip = document.getElementById("spinner-strip");
  const cards = strip.querySelectorAll(".spinner-item");

  cards.forEach(card => card.classList.remove("winning"));

  // Put winner ~75% through spin
  const winIndex = Math.floor(cards.length * 0.75);

  // Replace that card with actual winning item
  const winningCard = createSpinnerItem(winItem);
  strip.replaceChild(winningCard, cards[winIndex]);

  const updatedCards = strip.querySelectorAll(".spinner-item");

  const cardWidth = updatedCards[0].offsetWidth + 18;
  const containerWidth =
    document.getElementById("spinner-container").offsetWidth;

  const offset =
    -(winIndex * cardWidth - containerWidth / 2 + cardWidth / 2);

  strip.style.transition = "none";
  strip.style.left = "0px";
  strip.offsetHeight;

  strip.style.transition =
    "left 6s cubic-bezier(.1,.7,0,1)";
  strip.style.left = offset + "px";

  setTimeout(() => {
    updatedCards[winIndex].classList.add("winning");

    const winnerText = document.getElementById("winner-name");
    if (winnerText) {
      winnerText.textContent = winItem.name;
      winnerText.className = winItem.rarity.toLowerCase();
    }

    addToInventory(winItem);

    document.getElementById("open-btn").disabled = false;

  }, 6000);
}

// ===================== OPEN BUTTON =====================
document.getElementById("open-btn").addEventListener("click", () => {
  if (!caseData) return alert("Case not loaded yet!");
  if (coins < caseData.price) return alert("Not enough coins!");

  document.getElementById("open-btn").disabled = true;

  coins -= caseData.price;
  localStorage.setItem("coins", coins);
  updateCoins();

  buildSpinner(caseData.items);

  const winningItem = weightedRandom(caseData.items);

  spinToItem(winningItem);
});


