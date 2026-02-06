let coins = localStorage.getItem("coins");

if (coins === null) {
  coins = 10; // starting coins
  localStorage.setItem("coins", coins);
} else {
  coins = parseInt(coins);
}
let caseData;

fetch("data/cases.json")
  .then(res => res.json())
  .then(data => {
    caseData = data.cases[0];
    document.getElementById("case-container").innerHTML =
      `<img src="${caseData.image}"><p>$${caseData.price}</p>`;
  });

document.getElementById("open-btn").addEventListener("click", () => {
  const item = openCase(caseData.items);

  document.getElementById("result").innerHTML = `
    <h2 class="${item.rarity}">${item.name}</h2>
    <img src="${item.image}">
    <p>$${item.price}</p>
  `;
});

function openCase(items) {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let roll = Math.random() * total;

  for (let item of items) {
    if (roll < item.weight) return item;
    roll -= item.weight;
  }
}
function updateCoins() {
  document.getElementById("coins").textContent =
    `Coins: ${coins}`;
}

updateCoins();
document.getElementById("open-btn").addEventListener("click", () => {
  if (coins < caseData.price * 100) {
    alert("Not enough coins!");
    return;
  }

  coins -= caseData.price * 100;
  localStorage.setItem("coins", coins);
  updateCoins();

  const item = openCase(caseData.items);
  addToInventory(item);
  showResult(item);
});
let inventory = JSON.parse(localStorage.getItem("inventory")) || [];

function addToInventory(item) {
  inventory.push(item);
  localStorage.setItem("inventory", JSON.stringify(inventory));
  renderInventory();
}
function renderInventory() {
  const inv = document.getElementById("inventory");
  inv.innerHTML = "";

  inventory.forEach(item => {
    const div = document.createElement("div");
    div.className = `inv-item ${item.rarity}`;
    div.innerHTML = `
      <img src="${item.image}">
      <p>${item.name}</p>
    `;
    inv.appendChild(div);
  });
}

renderInventory();

