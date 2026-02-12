// ================= COINS =================
let coins = parseInt(localStorage.getItem("coins")) || 1000;
updateCoins();
function updateCoins(){
  document.getElementById("coins").textContent = `Coins: ${coins}`;
  localStorage.setItem("coins", coins);
}

// ================= INVENTORY =================
let inventory = JSON.parse(localStorage.getItem("inventory")) || [];
let recentDrops = JSON.parse(localStorage.getItem("recentDrops")) || [];

function saveData(){
  localStorage.setItem("inventory", JSON.stringify(inventory));
  localStorage.setItem("recentDrops", JSON.stringify(recentDrops));
}

function addToInventory(item){
  inventory.push(item);
  saveData();
  renderInventory();
}

function renderInventory(){
  const inv = document.getElementById("inventory");
  inv.innerHTML = "";
  inventory.forEach((i, index)=>{
    const div = document.createElement("div");
    div.className = `inv-item ${i.rarity.toLowerCase()}`;
    div.innerHTML = `<img src="${i.image}"><p>${i.name}</p><small>${i.price} coins</small><br><button class="sell-btn">Sell</button>`;
    div.querySelector(".sell-btn").onclick = ()=>{
      coins += i.price;
      inventory.splice(index, 1);
      updateCoins();
      saveData();
      renderInventory();
    };
    inv.appendChild(div);
  });
}
renderInventory();

// Toggle inventory
document.getElementById("toggle-inv-btn").onclick = ()=>document.getElementById("inventory").classList.toggle("hidden");

// Coins buttons
document.getElementById("add-coins-btn").onclick = ()=>{ coins+=50; updateCoins(); };
document.getElementById("remove-coins-btn").onclick = ()=>{ coins=Math.max(0, coins-50); updateCoins(); };

// ================= CASE DATA =================
let caseDataList = [];
let caseData;

fetch("data/cases.json").then(r => r.json()).then(d=>{
  caseDataList = d.cases;
  populateCaseSelect();
  selectCase(caseDataList[0].id);
});

function populateCaseSelect(){
  const select = document.getElementById("case-select");
  select.innerHTML = "";
  caseDataList.forEach(c=>{
    const o = document.createElement("option");
    o.value = c.id;
    o.textContent = c.name;
    select.appendChild(o);
  });
  select.addEventListener("change", ()=>selectCase(select.value));
  document.getElementById("show-select-btn").onclick = ()=>select.classList.toggle("hidden");
}

function selectCase(id){
  caseData = caseDataList.find(c=>c.id===id);
  document.getElementById("case-name").textContent = caseData.name;
  document.getElementById("case-image").src = caseData.image;
  document.getElementById("open-btn").textContent = `Open for ${caseData.price} coins`;

  // Preload item images
  caseData.items.forEach(i => { const img = new Image(); img.src = i.image; });
}

// ================= RNG =================
function weightedRandom(items){
  let t = items.reduce((s,i)=>s+i.weight,0);
  let r = Math.random()*t;
  for(let i of items){
    if(r<i.weight) return i;
    r-=i.weight;
  }
}

// ================= SPINNER =================
let lastWonDiv = null;

function buildSpinner(win){
  const strip = document.getElementById("spinner-strip");
  strip.innerHTML = "";

  // Create repeated items
  const arr = [];
  const repeats = 12;
  for(let i=0;i<repeats;i++) caseData.items.forEach(it=>arr.push(it));

  // Ensure winning item is included
  const winIndex = arr.length - Math.floor(caseData.items.length/2) - 1;
  arr[winIndex] = win;

  // Preload images
  const preloads = arr.map(i=>new Promise(r=>{
    const img = new Image();
    img.src = i.image;
    img.onload = r; img.onerror = r;
  }));

  Promise.all(preloads).then(()=>{
    arr.forEach(i=>{
      const div = document.createElement("div");
      div.className = `spinner-item ${i.rarity.toLowerCase()}`;
      div.innerHTML = `<img src="${i.image}">`;
      strip.appendChild(div);
    });

    const containerWidth = document.getElementById("spinner-container").offsetWidth;
    const itemWidth = strip.querySelector(".spinner-item").offsetWidth + 20; // margin
    const dist = itemWidth * winIndex - containerWidth / 2 + itemWidth / 2;

    if(lastWonDiv) lastWonDiv.classList.remove("highlight-won");
    strip.style.transition = "none";
    strip.style.transform = "translateX(0px)";
    strip.offsetHeight; // force reflow

    requestAnimationFrame(()=>{
      strip.style.transition = "transform 11s cubic-bezier(.25,.1,.25,1)";
      strip.style.transform = `translateX(-${dist}px)`;
    });

    setTimeout(()=>{
      const d = strip.children[winIndex];
      if(d){
        d.classList.add("highlight-won");
        d.classList.add(win.rarity.toLowerCase());
        lastWonDiv = d;
      }
    }, 11000);
  });
}

// ================= OPEN BUTTON =================
document.getElementById("open-btn").onclick = ()=>{
  if(!caseData) return;
  if(coins < caseData.price){
    const c = document.getElementById("coins");
    c.style.color = "red";
    setTimeout(()=>c.style.color="white",1000);
    return;
  }
  coins -= caseData.price;
  updateCoins();
  const won = weightedRandom(caseData.items);
  buildSpinner(won);
  setTimeout(()=>{
    document.getElementById("winner-name").textContent = `You won: ${won.name}`;
    addToInventory(won);
    addRecentDrop(won);
  }, 11000);
};

// ================= TOP DROPS =================
function addRecentDrop(i){
  recentDrops.push(i);
  if(recentDrops.length > 20) recentDrops.shift();
  saveData();
  renderTopDrops();
}

function renderTopDrops(){
  const c = document.getElementById("top-drops");
  c.innerHTML = "";
  [...recentDrops].sort((a,b)=>b.price-a.price).slice(0,8).forEach(i=>{
    const d = document.createElement("div");
    d.className = `top-drop ${i.rarity.toLowerCase()}`;
    d.innerHTML = `<img src="${i.image}"><p>${i.name}</p><strong>${i.price} coins</strong>`;
    c.appendChild(d);
  });
}
renderTopDrops();
