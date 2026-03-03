// ===================== GLOBAL STATE =====================
let coins = parseFloat(localStorage.getItem("coins"));
if (isNaN(coins) || coins < 0) coins = 100;

let inventory = JSON.parse(localStorage.getItem("inventory")) || [];
let recentDrops = JSON.parse(localStorage.getItem("recentDrops")) || [];
let cases = [];
let currentCase = null;

// ===================== INIT =====================
document.addEventListener("DOMContentLoaded", () => {
  updateCoins();
  renderInventory();
  renderTopDrops();
  loadCases();
  populateCoinflipDropdown();
  loadBattleCases();

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
  document.getElementById("switch-mode-btn").onclick = toggleMode;
  document.getElementById("battle-start-btn").onclick = startCaseBattle;

  document.getElementById("show-case-items-btn").onclick = toggleCaseItems;
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
}

function sellAllItems() {
  if (inventory.length === 0) return alert("Backpack is empty.");
  const total = inventory.reduce((sum, i) => sum + i.price, 0);
  coins += total;
  inventory = [];
  saveInventory();
  updateCoins();
  renderInventory();
  populateCoinflipDropdown();
  alert(`Sold everything for ${total.toFixed(2)} coins.`);
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
        div.innerHTML = `<img src="${c.image}"><span>${c.name} (${c.price} coins)</span>`;
        div.onclick = () => { selectCase(c.id); options.style.display = "none"; };
        options.appendChild(div);
      });

      selectCase(cases[0].id);

      display.onclick = () => { options.style.display = options.style.display === "block" ? "none" : "block"; };

      document.addEventListener("click", (e) => {
        if (!display.contains(e.target) && !options.contains(e.target)) options.style.display = "none";
      });
    });
}

function selectCase(id) {
  currentCase = cases.find(c => c.id === id);
  if (!currentCase) return;

  document.getElementById("case-image").src = currentCase.image;
  document.getElementById("case-name").textContent = currentCase.name;
  document.getElementById("open-btn").textContent = ` ${currentCase.price} Coins`;

  const display = document.getElementById("case-select-display");
  display.innerHTML = `<img src="${currentCase.image}"><span>${currentCase.name} (${currentCase.price} coins)</span>`;
}

function toggleCaseItems() {
  const list = document.getElementById("case-items-list");
  if (list.style.display === "block") {
    list.style.display = "none";
    list.innerHTML = "";
    return;
  }

  list.innerHTML = "";
  currentCase.items.forEach(i => {
    const div = document.createElement("div");
    div.className = `case-item ${i.rarity.toLowerCase()}`;
    div.innerHTML = `<img src="${i.image}"><span>${i.name} - ${i.price} coins</span>`;
    list.appendChild(div);
  });
  list.style.display = "block";
}

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

  setTimeout(() => showWinner(winningItem), 3200);
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
  winnerBox.textContent = item.name;
  winnerBox.className = item.rarity.toLowerCase();
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
  const flipBtn = document.getElementById("coinflip-btn");
  flipBtn.disabled = true;

  const win = Math.random() < 0.5;

  coin.style.backgroundImage = `url('${item.image}')`;
  coin.style.transform = "rotateY(0deg)";

  let flips = 0;
  const totalFlips = 10;

  const flipInterval = setInterval(() => {
    flips++;
    coin.style.transform = `rotateY(${flips * 180}deg)`;

    if (flips > totalFlips) {
      clearInterval(flipInterval);
      coin.style.transform = "rotateY(0deg)";

      if (win) {
        inventory.push({ ...item });
        alert(`You won another ${item.name} 🎉!`);
      } else {
        inventory.splice(index, 1);
        alert(`You lost, your ${item.name} was removed.`);
      }

      saveInventory();
      renderInventory();
      populateCoinflipDropdown();
      flipBtn.disabled = false;
    }
  }, 150);
}

// ===================== TOP DROPS =====================
function renderTopDrops() {
  const container = document.getElementById("top-drops");
  container.innerHTML = "";

  [...recentDrops]
    .sort((a,b)=>b.price-a.price)
    .slice(0,8)
    .forEach(item => {
      const div = document.createElement("div");
      div.className = `top-drop ${item.rarity.toLowerCase()}`;
      div.innerHTML = `<img src="${item.image}"><p>${item.name}</p><strong>${item.price} coins</strong>`;
      container.appendChild(div);
    });
}

// ===================== TOGGLE MODE =====================
function toggleMode() {
  const normal = document.getElementById("normal-section");
  const battle = document.getElementById("battle-section");
  if (normal.style.display !== "none") {
    normal.style.display = "none";
    battle.style.display = "block";
  } else {
    normal.style.display = "block";
    battle.style.display = "none";
  }
}

// ===================== CASE BATTLE =====================
function loadBattleCases() {
  const select = document.getElementById("battle-case-select");
  select.innerHTML = "";
  cases.forEach(c => {
    const option = document.createElement("option");
    option.value = c.id;
    option.textContent = `${c.name} (${c.price} coins)`;
    select.appendChild(option);
  });
  select.onchange = updateBattleButton;
  updateBattleButton();
}

function updateBattleButton() {
  const select = document.getElementById("battle-case-select");
  const caseObj = cases.find(c => c.id === select.value);
  document.getElementById("battle-start-btn").textContent = ` ${caseObj.price} Coins`;
}

function startCaseBattle() {
  const select = document.getElementById("battle-case-select");
  const caseObj = cases.find(c => c.id === select.value);
  if (!caseObj) return;
  if (coins < caseObj.price) return alert("Not enough coins.");

  coins -= caseObj.price;
  updateCoins();

  let playerItem, botItem;
  do {
    playerItem = getRandomItem(caseObj.items);
    botItem = getRandomItem(caseObj.items);
  } while(playerItem.price === botItem.price);

  spinBattle(playerItem, botItem, caseObj);
}

function spinBattle(playerItem, botItem, caseObj) {
  const playerStrip = document.getElementById("battle-spinner-player-strip");
  const botStrip = document.getElementById("battle-spinner-bot-strip");
  playerStrip.innerHTML = "";
  botStrip.innerHTML = "";

  const slots = 30;
  const winnerIndex = 20;

  for (let i=0;i<slots;i++){
    let pItem = caseObj.items[Math.floor(Math.random()*caseObj.items.length)];
    let bItem = caseObj.items[Math.floor(Math.random()*caseObj.items.length)];
    if (i===winnerIndex){ pItem = playerItem; bItem = botItem; }

    const pDiv = document.createElement("div");
    pDiv.className = `spinner-item ${pItem.rarity.toLowerCase()}`;
    pDiv.innerHTML = `<img src="${pItem.image}">`;
    playerStrip.appendChild(pDiv);

    const bDiv = document.createElement("div");
    bDiv.className = `spinner-item ${bItem.rarity.toLowerCase()}`;
    bDiv.innerHTML = `<img src="${bItem.image}">`;
    botStrip.appendChild(bDiv);
  }

  const itemWidth = playerStrip.children[0].offsetWidth + 10;
  const containerWidth = 400;
  const offset = -(winnerIndex*itemWidth - containerWidth/2 + itemWidth/2);

  playerStrip.style.transition = "transform 3s cubic-bezier(.25,.85,.35,1)";
  botStrip.style.transition = "transform 3s cubic-bezier(.25,.85,.35,1)";
  playerStrip.style.transform = `translateX(${offset}px)`;
  botStrip.style.transform = `translateX(${offset}px)`;

  setTimeout(()=>{
    const winnerBox = document.getElementById("battle-winner");
    if(playerItem.price>botItem.price){
      inventory.push(playerItem, botItem);
      winnerBox.textContent = `Player Wins! You got ${playerItem.name} & ${botItem.name}`;
      winnerBox.className = playerItem.rarity.toLowerCase();
    } else {
      winnerBox.textContent = `Bot Wins!`;
      winnerBox.className = "";
    }
    saveInventory();
    renderInventory();
    populateCoinflipDropdown();
  },3100);
}
