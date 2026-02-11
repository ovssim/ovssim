let coins = parseFloat(localStorage.getItem("coins")) || 1000;
localStorage.setItem("coins", coins);

function updateCoins() {
  document.getElementById("coins").textContent = `Coins: ${coins.toFixed(2)}`;
}
updateCoins();

let inventory = JSON.parse(localStorage.getItem("inventory")) || [];
function saveInventory(){ localStorage.setItem("inventory", JSON.stringify(inventory)); }
function addToInventory(item){ inventory.push(item); saveInventory(); renderInventory(); }
function sellItem(index){ coins += inventory[index].price; coins=parseFloat(coins.toFixed(2)); inventory.splice(index,1); updateCoins(); saveInventory(); renderInventory(); }

function renderInventory(){
  const inv = document.getElementById("inventory");
  inv.innerHTML = "";
  inventory.forEach((item,index)=>{
    const div=document.createElement("div");
    div.className=`inv-item ${item.rarity.toLowerCase()}`;
    div.innerHTML=`<img src="${item.image}" alt="${item.name}"><p>${item.name}</p><small>${item.price} coins</small><br><button class="sell-btn">Sell</button>`;
    div.querySelector(".sell-btn").onclick=()=>sellItem(index);
    inv.appendChild(div);
  });
}
renderInventory();

let caseData=null;
fetch("data/cases.json")
.then(res=>res.json())
.then(data=>{
  if(!data.cases||!data.cases.length)throw new Error("No cases found");
  caseData=data.cases[0];
  const container=document.getElementById("case-container");
  container.innerHTML=`<img src="${caseData.image}" alt="${caseData.name}"><p>${caseData.name} - Price: ${caseData.price} coins</p>`;
  populateSpinner(caseData.items);
})
.catch(err=>{ console.error(err); alert("Failed to load cases.json"); });

function rollItem(items){
  const total=items.reduce((s,i)=>s+i.weight,0);
  let roll=Math.random()*total;
  for(let item of items){ if(roll<item.weight) return item; roll-=item.weight; }
}

function populateSpinner(items){
  const strip=document.getElementById("spinner-strip");
  strip.innerHTML="";
  let wheel=[];
  for(let i=0;i<10;i++) wheel.push(...items);
  wheel.sort(()=>Math.random()-0.5);
  wheel.forEach(item=>{
    const img=document.createElement("img");
    img.src=item.image;
    img.className=item.rarity.toLowerCase();
    img.alt=item.name;
    strip.appendChild(img);
  });
}

function spinToItem(item){
  const strip=document.getElementById("spinner-strip");
  const imgs=strip.querySelectorAll("img");
  if(!imgs.length) return;
  imgs.forEach(img=>img.classList.remove("winning"));

  const matches=[...imgs].map((img,i)=>img.src.endsWith(item.image)?i:-1).filter(i=>i>=0);
  const targetIndex=matches.length ? matches[Math.floor(Math.random()*matches.length)] : 0;

  const imgWidth=imgs[0].offsetWidth + 10;
  const containerWidth=document.getElementById("spinner-container").offsetWidth;
  const offset=-(targetIndex*imgWidth - containerWidth/2 + imgWidth/2);

  strip.style.transition="none";
  strip.style.left="0px";
  strip.offsetHeight;
  strip.style.transition="left 6s cubic-bezier(.1,.7,0,1)";
  strip.style.left=`${offset}px`;

  const leftArrow=document.getElementById("winner-left");
  const rightArrow=document.getElementById("winner-right");
  let color="white";
  if(item.rarity.toLowerCase()=="common") color="gray";
  else if(item.rarity.toLowerCase()=="strange") color="orange";
  else if(item.rarity.toLowerCase()=="unusual") color="purple";
  leftArrow.style.color=color; rightArrow.style.color=color;
  leftArrow.classList.add("glow"); rightArrow.classList.add("glow");

  setTimeout(()=>{ imgs[targetIndex].classList.add("winning"); },6000);
}

document.getElementById("open-btn").onclick=()=>{
  if(!caseData) return alert("Case not loaded yet!");
  if(coins<caseData.price) return alert("Not enough coins!");

  const btn=document.getElementById("open-btn");
  btn.disabled=true;
  coins=parseFloat((coins-caseData.price).toFixed(2));
  localStorage.setItem("coins",coins);
  updateCoins();

  populateSpinner(caseData.items);

  const item=rollItem(caseData.items);
  spinToItem(item);

  setTimeout(()=>{
    addToInventory(item);
    showResult(item);
    btn.disabled=false;
  },6000);
};

function showResult(item){
  document.getElementById("result").innerHTML=`<h2 class="${item.rarity}">${item.name}</h2><img src="${item.image}" alt="${item.name}"><p>Value: ${item.price} coins</p>`;
}
