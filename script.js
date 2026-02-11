// ----------------- Spinner Arrows & Center -----------------
const leftArrow = document.getElementById("winner-left");
const rightArrow = document.getElementById("winner-right");
const spinnerContainer = document.getElementById("spinner-container");

function updateArrowPositions(targetIndex){
  const strip = document.getElementById("spinner-strip");
  const imgs = strip.querySelectorAll("img");
  if(!imgs.length) return;

  const imgWidth = imgs[0].offsetWidth + 10;
  const containerWidth = spinnerContainer.offsetWidth;
  const offset = -(targetIndex * imgWidth - containerWidth/2 + imgWidth/2);

  strip.style.left = `${offset}px`;

  // Position arrows at the center
  leftArrow.style.left = `${containerWidth/2 - 50}px`;
  rightArrow.style.left = `${containerWidth/2 + 50}px`;
}

// Call on window resize to keep arrows aligned
window.addEventListener("resize", ()=>{ 
  const winningImg = document.querySelector("#spinner-strip img.winning");
  if(winningImg){
    const imgs = [...document.querySelectorAll("#spinner-strip img")];
    const index = imgs.indexOf(winningImg);
    updateArrowPositions(index);
  }
});

// ----------------- Spin to item -----------------
function spinToItem(item){
  const strip = document.getElementById("spinner-strip");
  const imgs = strip.querySelectorAll("img");
  if(!imgs.length) return;
  imgs.forEach(img=>img.classList.remove("winning"));

  const matches=[...imgs].map((img,i)=>img.src.endsWith(item.image)?i:-1).filter(i=>i>=0);
  const targetIndex=matches.length ? matches[Math.floor(Math.random()*matches.length)] : 0;

  const imgWidth = imgs[0].offsetWidth + 10;
  const containerWidth = spinnerContainer.offsetWidth;
  const offset = -(targetIndex * imgWidth - containerWidth/2 + imgWidth/2);

  strip.style.transition="none";
  strip.style.left="0px";
  strip.offsetHeight;
  strip.style.transition="left 6s cubic-bezier(.1,.7,0,1)";
  strip.style.left=`${offset}px`;

  // Highlight arrows and color by rarity
  let color="white";
  switch(item.rarity.toLowerCase()){
    case "common": color="gray"; break;
    case "uncommon": color="green"; break;
    case "rare": color="blue"; break;
    case "strange": color="orange"; break;
    case "unusual": color="purple"; break;
    case "legendary": color="gold"; break;
    case "mythical": color="violet"; break;
  }
  leftArrow.style.color=color;
  rightArrow.style.color=color;
  leftArrow.classList.add("glow");
  rightArrow.classList.add("glow");

  // Glow winning item after spin
  setTimeout(()=>{
    imgs[targetIndex].classList.add("winning");
    updateArrowPositions(targetIndex);
  },6000);
}

