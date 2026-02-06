let coins = localStorage.getItem("coins");

if (coins === null) {
  coins = 1000; // starting coins
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

