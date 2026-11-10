(() => {
"use strict";
const canvas=document.getElementById("game");let ctx=canvas.getContext("2d");
const $=id=>document.getElementById(id);
const W=360,H=600,lanes=[112,180,248];
const CFG=(()=>{try{return JSON.parse(sessionStorage.getItem("gamezaar-live-preview-v1")||"{}")}catch{return{}}})();
window.__GAMEZAAR_PREVIEW_CONFIG_VERSION=CFG.updatedAt||0;
const SCORE_RULES=CFG.scoreSystem||{overtake:{enabled:true,points:10},coin:{enabled:true,points:5},survival:{enabled:true,points:1}};
const PREVIEW_KEYS={coins:"gamezaar-preview-coins-v2",unlocked:"gamezaar-preview-unlocked-v2",selected:"gamezaar-preview-selected-v2",best:"gamezaar-preview-best-v2"};
let survivalClock=0,customImages={},customImageTypes={},presetImages=[],animatedHazardNodes=new Map();
function loadCustomImages(){try{const req=indexedDB.open("gamezaar-custom-assets",1);req.onsuccess=()=>{const db=req.result;if(!db.objectStoreNames.contains("uploads"))return;const q=db.transaction("uploads","readonly").objectStore("uploads").getAll();q.onsuccess=()=>{(q.result||[]).forEach(item=>{if(item.kind==="image"&&item.blob){const img=new Image();img.decoding="async";img.src=URL.createObjectURL(item.blob);img.onload=()=>draw();customImages[item.id]=img;customImageTypes[item.id]=item.blob.type||"";}});};};}catch(e){}}
function customAsset(type){const v=CFG.selectedAssets?.[type];return typeof v==="string"&&v.startsWith("custom:")?customImages[v.slice(7)]:null;}
function updateAnimatedHazards(){const wrap=document.querySelector(".canvas-wrap");if(!wrap)return;if(!running){animatedHazardNodes.forEach(n=>n.remove());animatedHazardNodes.clear();return;}wrap.style.position="relative";const cr=canvas.getBoundingClientRect(),wr=wrap.getBoundingClientRect(),sx=cr.width/W,sy=cr.height/H,active=new Set();roadHazards.forEach(h=>{const id=h.asset?.startsWith("custom:")?h.asset.slice(7):"",custom=customImages[id];if(!id||customImageTypes[id]!=="image/gif"||!custom)return;active.add(h);let node=animatedHazardNodes.get(h);if(!node){node=document.createElement("img");node.src=custom.src;node.alt="";node.draggable=false;node.style.cssText="position:absolute;z-index:2;pointer-events:none;object-fit:contain;transform:translate(-50%,-50%)";wrap.appendChild(node);animatedHazardNodes.set(h,node);}node.style.left=(cr.left-wr.left+lanes[h.lane]*sx)+"px";node.style.top=(cr.top-wr.top+h.y*sy)+"px";node.style.width=(38*sx)+"px";node.style.height=(38*sy)+"px";});animatedHazardNodes.forEach((node,h)=>{if(!active.has(h)){node.remove();animatedHazardNodes.delete(h);}});}
function presetAsset(type,index){const v=CFG.selectedAssets?.[type];const i=typeof v==="string"&&v.startsWith("preset:")?Number(v.split(":")[1])||0:index||0;const list=type==="vehicle"?window.GAMEZAAR_PLAYER_CARS:type==="trafficCars"?window.GAMEZAAR_TRAFFIC_CARS:null;return list?.[i]?.src||null;}

const GARAGE_DESIGNS=window.GAMEZAAR_GARAGE_CARS||[];
const PLAYER_VALUE=CFG.selectedAssets?.vehicle||"preset:0";
const PLAYER_INDEX=typeof PLAYER_VALUE==="string"&&PLAYER_VALUE.startsWith("preset:")?Math.max(0,Math.min(4,Number(PLAYER_VALUE.split(":")[1])||0)):0;
const PLAYER_NAME=CFG.assetOptions?.vehicle?.[PLAYER_INDEX]?.[1]||window.GAMEZAAR_PLAYER_CARS?.[PLAYER_INDEX]?.name||"Player Car";
const CAR_LIST=[
 {id:"player",name:PLAYER_NAME,color:"#df454c",accent:"#ffe0a1",type:"player",garageIndex:-1,price:0},
 ...GARAGE_DESIGNS.map((car,i)=>({id:["garage-0","garage-1","garage-2","garage-3","garage-4","garage-5","garage-6","garage-7"][i],name:String(CFG.garageNames?.[i]||CFG.garageCars?.[i]?.name||car.name).trim().slice(0,24)||car.name,color:["#df454c","#238bd5","#73bd45","#8755d7","#ed9a28","#20b8ae","#ed5c9b","#d9e0e8"][i],accent:["#ffe0a1","#9df0ff","#e4ff9c","#e5c5ff","#fff0a1","#bafff3","#ffd0e4","#7c9ab8"][i],type:"garage",garageIndex:i,src:car.src,uploadId:(CFG.garageCars?.[i]||{}).uploadId||null,price:Math.max(0,Math.floor(Number(CFG.garagePrices?.[i]??[30,50,70,90,120,150,200,250][i])||0))}))
];
function readJSON(key,fallback){try{const v=JSON.parse(localStorage.getItem(key));return Array.isArray(v)?v:fallback;}catch(e){return fallback;}}
let coins=Math.max(0,Number(localStorage.getItem(PREVIEW_KEYS.coins)||0));
const legacyIds=["starter","ocean","venom","royal","sunfire","neon","blaze","phantom"];
let unlocked=readJSON(PREVIEW_KEYS.unlocked,["player"]).map(id=>id==="starter"?"garage-0":legacyIds.includes(id)?"garage-"+legacyIds.indexOf(id):id).filter(id=>CAR_LIST.some(c=>c.id===id));
if(!unlocked.includes("player"))unlocked.unshift("player");
let selectedCarId=localStorage.getItem(PREVIEW_KEYS.selected)||"player";
selectedCarId=selectedCarId==="starter"?"garage-0":legacyIds.includes(selectedCarId)?"garage-"+legacyIds.indexOf(selectedCarId):selectedCarId;
if(!unlocked.includes(selectedCarId))selectedCarId="player";
let selectedCar=CAR_LIST.find(c=>c.id===selectedCarId)||CAR_LIST[0];
let playerLane=1,playerX=lanes[1],playerTilt=0,traffic=[],score=0,best=Number(localStorage.getItem(PREVIEW_KEYS.best)||0);
let speed=1,running=false,crashing=false,crashStarted=0,last=0,spawn=0,world=0,raf=0,audio=null,explosion={x:180,y:500};
let roadCoins=[],coinSpawn=0,nextCoinSpawn=900+Math.random()*300,coinsThisRace=0,scorePopups=[],trafficSpawnIndex=0;
let roadHazards=[],hazardSpawn=0,nextHazardSpawn=720+Math.random()*240;
const trafficColors=["#ff754f","#55d9ff","#c58cff","#ffd166","#65e6a8"];
const buildings=[];
for(let side=0;side<2;side++){
 let y=-30;
 while(y<H+80){const h=65+Math.random()*85,w=side?38+Math.random()*23:38+Math.random()*23;
 buildings.push({side,y,h,w,seed:Math.random(),windows:Array.from({length:12},()=>Math.random())});y+=h+8;}
}
$("best").textContent=String(best).padStart(4,"0");
$("coins").textContent=String(coins).padStart(4,"0");
function saveGarage(){localStorage.setItem(PREVIEW_KEYS.coins,String(coins));localStorage.setItem(PREVIEW_KEYS.unlocked,JSON.stringify(unlocked));localStorage.setItem(PREVIEW_KEYS.selected,selectedCarId);}
function renderPreview(){
 const pc=$("carPreview"),pctx=pc.getContext("2d");pctx.clearRect(0,0,pc.width,pc.height);
 pctx.fillStyle="#2b3853";pctx.fillRect(0,0,pc.width,pc.height);
 pctx.fillStyle="#43516c";pctx.fillRect(20,15,140,120);
 const old=ctx;ctx=pctx;drawSelectedCar(90,75,selectedCar,54,91);ctx=old;
}
function renderGarage(){
 $("garageCoins").textContent=String(coins);
 $("coins").textContent=String(coins).padStart(4,"0");
 $("selectedCarName").textContent=selectedCar.name;
 const owned=unlocked.includes(selectedCar.id);
 $("selectedCarStatus").textContent=owned?"OWNED • READY TO RACE":"LOCKED • "+selectedCar.price+" COINS";
 $("garageList").innerHTML=CAR_LIST.map(car=>{
  const isOwned=unlocked.includes(car.id),isSelected=car.id===selectedCar.id;
  return '<button type="button" class="garage-car '+(isSelected?'selected ':'')+(!isOwned?'locked':'')+'" data-car="'+car.id+'" aria-label="'+car.name+(isOwned?', owned':', '+car.price+' coins')+'"><span class="car-swatch" style="background:'+car.color+'"></span><strong>'+car.name+'</strong><small>'+(isOwned?'OWNED':'🪙 '+car.price)+'</small></button>';
 }).join("");
 $("startBtn").textContent=owned?(score>0?"RACE AGAIN":"START RACE"):"BUY • 🪙 "+selectedCar.price;
 $("startBtn").dataset.mode=owned?"start":"buy";
 renderPreview();
}
function selectCar(id){
 const car=CAR_LIST.find(c=>c.id===id);if(!car)return;
 selectedCar=car;selectedCarId=id;localStorage.setItem(PREVIEW_KEYS.selected,id);
 $("garageMessage").textContent="";
 renderGarage();
}
$("garageList").addEventListener("click",e=>{const item=e.target.closest("[data-car]");if(item)selectCar(item.dataset.car);});
$("startBtn").addEventListener("click",()=>{
 if(unlocked.includes(selectedCar.id)){start();return;}
 if(coins<selectedCar.price){$("garageMessage").textContent="Can't buy! Earn more coins.";sound(150,.12,"square",.025);return;}
 coins-=selectedCar.price;unlocked.push(selectedCar.id);saveGarage();$("garageMessage").textContent=selectedCar.name+" unlocked!";renderGarage();sound(620,.12,"triangle",.04);
});
function sound(freq=440,duration=.08,type="sine",volume=.035){
 try{audio=audio||new (window.AudioContext||window.webkitAudioContext)();if(audio.state==="suspended")audio.resume();
 const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.setValueAtTime(freq,audio.currentTime);
 g.gain.setValueAtTime(volume,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);
 o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+duration);
 }catch(e){}
}
function blastSound(){
 try{audio=audio||new (window.AudioContext||window.webkitAudioContext)();if(audio.state==="suspended")audio.resume();
 const length=Math.floor(audio.sampleRate*.48),buffer=audio.createBuffer(1,length,audio.sampleRate),data=buffer.getChannelData(0);
 for(let i=0;i<length;i++)data[i]=(Math.random()*2-1)*(1-i/length);
 const src=audio.createBufferSource(),filter=audio.createBiquadFilter(),gain=audio.createGain();
 filter.type="lowpass";filter.frequency.setValueAtTime(900,audio.currentTime);filter.frequency.exponentialRampToValueAtTime(90,audio.currentTime+.45);
 gain.gain.setValueAtTime(.32,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.48);
 src.buffer=buffer;src.connect(filter);filter.connect(gain);gain.connect(audio.destination);src.start();
 sound(75,.38,"sawtooth",.055);
 }catch(e){sound(90,.4,"sawtooth",.07);}
}
function startSound(){
 sound(95,.28,"sawtooth",.045);setTimeout(()=>sound(170,.22,"sawtooth",.04),100);setTimeout(()=>sound(310,.18,"triangle",.035),220);
}
function steerSound(){sound(240,.055,"square",.018);setTimeout(()=>sound(360,.045,"triangle",.012),28);}

function glowRect(x,y,w,h,color,blur=8){ctx.save();ctx.shadowColor=color;ctx.shadowBlur=blur;ctx.fillStyle=color;ctx.fillRect(x,y,w,h);ctx.restore();ctx.fillStyle=color;ctx.fillRect(x,y,w,h);}
function pixelText(text,x,y,size,color){ctx.save();ctx.font="bold "+size+"px monospace";ctx.fillStyle=color;ctx.shadowColor=color;ctx.shadowBlur=7;ctx.fillText(text,x,y);ctx.restore();}
function drawSky(){
 const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,"#71816a");g.addColorStop(.55,"#536b56");g.addColorStop(1,"#344d43");ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 // grass, shrubs and little stone details along both outer edges
 for(let i=0;i<90;i++){
  const x=(i*71+17)%W,y=(i*97+world*.58)%(H+24)-12;
  if(x>70&&x<290)continue;
  ctx.fillStyle=i%3===0?"#233e34":i%3===1?"#405b3e":"#66734a";
  ctx.fillRect(x,y,5+(i%3)*2,4);ctx.fillRect(x-2,y+4,7,4);
  if(i%4===0){ctx.fillStyle="#9a9a64";ctx.fillRect(x+2,y+2,2,2);}
 }
}
function drawBuilding(b){
 const x=b.side===0?0:304,y=b.y,w=56,h=b.h;const custom=customAsset("bgBuilding");if(custom?.complete){ctx.drawImage(custom,x,y,w,h);return;}
 // deep shadow, facade and roof ledge
 ctx.fillStyle="#263b42";ctx.fillRect(x+2,y+3,w,h);
 ctx.fillStyle=b.seed>.5?"#9a9078":"#697e79";ctx.fillRect(x,y,w-2,h-2);
 ctx.fillStyle="#c2b28c";ctx.fillRect(x,y,w-2,5);
 ctx.fillStyle="#4b6263";ctx.fillRect(x+4,y+9,w-10,h-18);
 // windows in a crisp pixel grid
 for(let row=0;row<4;row++)for(let col=0;col<2;col++){
  const wx=x+8+col*21,wy=y+16+row*19;
  ctx.fillStyle=((row*3+col+b.seed*10)%4<2)?"#f5c879":"#263e4b";
  ctx.fillRect(wx,wy,12,12);ctx.fillStyle="#9aaba0";ctx.fillRect(wx+5,wy,2,12);ctx.fillRect(wx,wy+5,12,1);
 }
 // shop awning / sign at street level
 ctx.fillStyle="#273e46";ctx.fillRect(x+3,y+h-24,w-9,18);
 ctx.fillStyle=b.seed>.5?"#d8754e":"#e5b45e";ctx.fillRect(x+5,y+h-22,w-13,5);
 ctx.fillStyle="#f7dca0";ctx.fillRect(x+8,y+h-21,w-19,2);
 ctx.fillStyle="#27343a";ctx.fillRect(x+8,y+h-14,w-19,8);
 // doorway and glowing shop window
 ctx.fillStyle="#182d38";ctx.fillRect(x+6,y+h-14,9,14);
 ctx.fillStyle="#f4c06e";ctx.fillRect(x+20,y+h-14,17,9);
 ctx.fillStyle="#fff0ae";ctx.fillRect(x+22,y+h-12,3,3);
}
function drawRoad(){
 drawSky();const land=customAsset("bgLand");if(land?.complete)ctx.drawImage(land,0,0,W,H);
 // moving city blocks on either side of the road
 buildings.forEach(b=>{const yy=((b.y+world*.78)%(H+190))-90;drawBuilding({...b,y:yy});});
 // sidewalks with paving slabs and drain covers
 ctx.fillStyle="#b2aa91";ctx.fillRect(56,0,22,H);ctx.fillRect(282,0,22,H);
 for(let y=-30+(world%32);y<H;y+=32){
  ctx.fillStyle="#d0c4a4";ctx.fillRect(57,y,20,1);ctx.fillRect(283,y+15,20,1);
  ctx.fillStyle="#89948a";ctx.fillRect(60,y+8,2,2);ctx.fillRect(296,y+22,3,3);
 }
 // planters, trees and street lamps scroll with the city
 for(let y=-95+(world%190);y<H+80;y+=190){
  for(const x of [62,286]){
   ctx.fillStyle="#75533e";ctx.fillRect(x+2,y+24,14,13);
   ctx.fillStyle="#294b3b";ctx.fillRect(x,y+5,18,22);ctx.fillRect(x+3,y,12,8);
   const tree=customAsset("bgTree");if(tree?.complete)ctx.drawImage(tree,x-6,y-5,30,34);else{ctx.fillStyle="#689451";ctx.fillRect(x+4,y+5,5,5);ctx.fillRect(x+11,y+12,4,5);}
   ctx.fillStyle="#59696a";ctx.fillRect(x+8,y+37,2,19);ctx.fillRect(x+8,y+37,12,2);
   glowRect(x+17,y+34,4,4,"#ffe1a0",7);
  }
 }
 // asphalt roadway and darker shoulders
 ctx.fillStyle="#26353d";ctx.fillRect(78,0,204,H);
 const asphalt=ctx.createLinearGradient(78,0,282,0);asphalt.addColorStop(0,"#35434a");asphalt.addColorStop(.5,"#465158");asphalt.addColorStop(1,"#35434a");
 ctx.fillStyle=asphalt;ctx.fillRect(82,0,196,H);const customRoad=customAsset("bgRoad");if(customRoad?.complete)ctx.drawImage(customRoad,82,0,196,H);
 // subtle worn pixel texture
 for(let i=0;i<100;i++){const x=84+(i*43%192),y=(i*67+world*1.22)%H;ctx.fillStyle=i%2?"rgba(15,25,31,.16)":"rgba(205,197,164,.10)";ctx.fillRect(x,y,2+(i%3),2);}
 // yellow edge lines, lane separators and moving dashed markers
 ctx.fillStyle="#e2b94d";ctx.fillRect(79,0,3,H);ctx.fillRect(279,0,3,H);
 for(let y=-58+(world%82);y<H;y+=82){
  ctx.fillStyle="#d9d8c8";ctx.fillRect(145,y,3,39);ctx.fillRect(212,y,3,39);
 }
 // alternating curb blocks, white and burnt orange like the reference track
 for(let y=-26+(world%46);y<H;y+=46){
  ctx.fillStyle="#f0e8d1";ctx.fillRect(74,y,5,23);ctx.fillStyle="#d88739";ctx.fillRect(74,y+23,5,23);
  ctx.fillStyle="#f0e8d1";ctx.fillRect(281,y,5,23);ctx.fillStyle="#d88739";ctx.fillRect(281,y+23,5,23);
 }
}
function drawCar(x,y,color,player=false,tilt=0,accent="#ffe0a1"){
 ctx.save();ctx.translate(x,y);ctx.rotate(tilt);
 // soft contact shadow
 ctx.fillStyle="rgba(7,13,18,.5)";ctx.beginPath();ctx.ellipse(1,4,20,32,0,0,Math.PI*2);ctx.fill();
 // rubber tyres with tread and wheel wells
 ctx.fillStyle="#10171d";
 for(const side of [-1,1]){ctx.fillRect(side*13-3,-20,7,14);ctx.fillRect(side*13-3,7,7,14);
  ctx.fillStyle="#59636a";ctx.fillRect(side*13-2,-17,5,2);ctx.fillRect(side*13-2,10,5,2);ctx.fillStyle="#10171d";}
 // lower chassis and front/rear bumpers
 ctx.fillStyle="#111b23";ctx.beginPath();ctx.moveTo(-12,-29);ctx.quadraticCurveTo(-17,-25,-17,-15);ctx.lineTo(-17,18);ctx.quadraticCurveTo(-16,29,-10,30);ctx.lineTo(10,30);ctx.quadraticCurveTo(16,28,17,18);ctx.lineTo(17,-15);ctx.quadraticCurveTo(16,-27,11,-29);ctx.closePath();ctx.fill();
 // glossy painted car body
 const body=ctx.createLinearGradient(-16,0,16,0);body.addColorStop(0,"#702d32");body.addColorStop(.22,color);body.addColorStop(.72,color);body.addColorStop(1,"#762e34");
 ctx.fillStyle=body;ctx.beginPath();ctx.moveTo(-11,-28);ctx.quadraticCurveTo(-14,-27,-14,-17);ctx.lineTo(-15,15);ctx.quadraticCurveTo(-15,27,-9,28);ctx.lineTo(9,28);ctx.quadraticCurveTo(15,26,15,15);ctx.lineTo(14,-17);ctx.quadraticCurveTo(14,-27,10,-28);ctx.closePath();ctx.fill();
 // fenders and hood highlights
 ctx.fillStyle="rgba(255,255,255,.22)";ctx.fillRect(-12,-22,3,30);ctx.fillRect(9,-22,3,30);
 ctx.fillStyle=player?"#f6d8a0":"#d6d8d0";ctx.fillRect(-10,-26,20,3);
 // front windscreen, dashboard and seats
 ctx.fillStyle="#152b39";ctx.fillRect(-10,-18,20,13);ctx.fillStyle="#5c8995";ctx.fillRect(-8,-17,16,9);
 ctx.fillStyle="#b4c5bd";ctx.fillRect(-1,-17,2,9);ctx.fillStyle="#182b35";ctx.fillRect(-10,-4,20,3);
 // roof panel and side windows
 ctx.fillStyle=player?"#d9e1d5":"#263e4b";ctx.fillRect(-9,1,18,13);
 ctx.fillStyle="#648b91";ctx.fillRect(-7,3,14,8);if(player){ctx.fillStyle=accent;ctx.fillRect(-2,3,4,8);}ctx.fillStyle="#182c37";ctx.fillRect(-9,14,18,3);
 // rear glass and trunk
 ctx.fillStyle="#203845";ctx.fillRect(-9,18,18,6);ctx.fillStyle="#527985";ctx.fillRect(-7,19,14,3);
 ctx.fillStyle="#222d34";ctx.fillRect(-11,25,22,3);
 // headlamps, tail lamps and tiny pixel details
 glowRect(-11,-27,6,3,"#fff3bd",9);glowRect(5,-27,6,3,"#fff3bd",9);
 glowRect(-12,24,6,3,"#ff4b52",7);glowRect(6,24,6,3,"#ff4b52",7);
 ctx.fillStyle="#f7d78e";ctx.fillRect(-2,-25,4,2);
 if(player){ctx.fillStyle=accent;ctx.fillRect(-3,-23,6,12);ctx.fillStyle="#fff0b0";ctx.fillRect(-2,-1,4,3);ctx.fillStyle=accent;ctx.fillRect(-2,16,4,2);}
 ctx.restore();
}
function selectedCarImage(car){
 if(car.type==="player"){
  const upload=customAsset("vehicle");if(upload?.complete&&upload.naturalWidth)return upload;
  const src=presetAsset("vehicle",PLAYER_INDEX);if(!src)return null;
  const key=PLAYER_INDEX;if(!presetImages[key]){presetImages[key]=new Image();presetImages[key].src=src;}return presetImages[key].complete&&presetImages[key].naturalWidth?presetImages[key]:null;
 }
 const upload=car.uploadId?customImages[car.uploadId]:null;if(upload?.complete&&upload.naturalWidth)return upload;
 const key=20+car.garageIndex;if(!presetImages[key]){presetImages[key]=new Image();presetImages[key].src=car.src;}return presetImages[key].complete&&presetImages[key].naturalWidth?presetImages[key]:null;
}
function drawSelectedCar(x,y,car,width,height,tilt=0){
 const img=selectedCarImage(car);
 if(img){
  ctx.save();ctx.translate(x,y);ctx.rotate(tilt);
  // Normalize every preset car to the same visible body dimensions as Blue Flame.
  // Player SVG body bounds: 154x252 in a 256x256 viewBox.
  // Garage SVG body bounds: 96x123 in a 128x128 viewBox.
  let bodyWidth=img.naturalWidth,bodyHeight=img.naturalHeight,sourceWidth=img.naturalWidth,sourceHeight=img.naturalHeight;
  if(car.type==="player"&&img.src.startsWith("data:image/svg+xml")){
   bodyWidth=154;bodyHeight=252;sourceWidth=256;sourceHeight=256;
  }else if(car.type==="garage"&&img.src.startsWith("data:image/svg+xml")){
   bodyWidth=96;bodyHeight=123;sourceWidth=128;sourceHeight=128;
  }
  const referenceScale=Math.min(width/(car.type==="player"?154:154),height/252);
  const targetBodyWidth=154*referenceScale,targetBodyHeight=252*referenceScale;
  const dw=sourceWidth*(targetBodyWidth/bodyWidth),dh=sourceHeight*(targetBodyHeight/bodyHeight);
  ctx.drawImage(img,-dw/2,-dh/2,dw,dh);
  ctx.restore();
 }else drawCar(x,y,car.color,true,tilt,car.accent);
}
function drawCoin(x,y,now){
 const custom=customAsset("coin");if(custom?.complete){ctx.drawImage(custom,x-12,y-12,24,24);return;}
 const pulse=1+Math.sin(now/115)*.09;
 ctx.save();ctx.translate(x,y);ctx.scale(pulse,1);
 ctx.shadowColor="#ffd34e";ctx.shadowBlur=15;
 ctx.fillStyle="#9b5b12";ctx.beginPath();ctx.ellipse(0,0,10,13,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle="#ffbd32";ctx.beginPath();ctx.ellipse(0,-1,8,11,0,0,Math.PI*2);ctx.fill();
 ctx.shadowBlur=0;ctx.strokeStyle="#fff0a0";ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,-1,4,7,0,0,Math.PI*2);ctx.stroke();
 ctx.fillStyle="#fff4bd";ctx.fillRect(-2,-7,2,3);ctx.fillRect(3,2,2,2);
 ctx.restore();
 if(Math.floor(now/150)%2===0){ctx.fillStyle="rgba(255,239,155,.9)";ctx.fillRect(x+12,y-12,3,3);ctx.fillRect(x-15,y+7,2,2);}
}
function drawRoadHazard(x,y,now){
 const custom=customAsset("roadHazards");
 if(custom?.complete&&custom.naturalWidth){const id=(CFG.selectedAssets?.roadHazards||"").slice(7);if(customImageTypes[id]==="image/gif")return;ctx.drawImage(custom,x-19,y-19,38,38);return;}
 const choice=CFG.selectedAssets?.roadHazards||"preset:0";
 const idx=choice.startsWith("preset:")?Math.max(0,Math.min(4,Number(choice.split(":")[1])||0)):0;
 ctx.save();ctx.translate(x,y);
 if(idx===0){
  ctx.fillStyle="#101820";ctx.beginPath();ctx.ellipse(0,2,17,12,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle="#69747b";ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,2,13,8,0,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle="rgba(0,0,0,.5)";ctx.beginPath();ctx.ellipse(-3,1,7,4,0,0,Math.PI*2);ctx.fill();
 }else if(idx===1){
  ctx.fillStyle="#111923";ctx.beginPath();ctx.moveTo(-19,3);ctx.quadraticCurveTo(-16,-11,-4,-8);ctx.quadraticCurveTo(8,-16,17,-3);ctx.quadraticCurveTo(22,8,8,11);ctx.quadraticCurveTo(-8,15,-19,3);ctx.fill();
  ctx.fillStyle="rgba(65,205,220,.7)";ctx.beginPath();ctx.ellipse(4,-4,7,2,Math.sin(now/180)*.25,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="rgba(255,255,255,.8)";ctx.fillRect(8,-7,5,2);
 }else if(idx===2){
  ctx.rotate(Math.sin(now/260)*.07);ctx.strokeStyle="#765033";ctx.lineWidth=8;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(-18,7);ctx.lineTo(17,-6);ctx.stroke();
  ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-5,2);ctx.lineTo(-11,-9);ctx.moveTo(5,-2);ctx.lineTo(12,9);ctx.moveTo(11,-4);ctx.lineTo(15,-13);ctx.stroke();
  ctx.fillStyle="#b58a59";ctx.fillRect(-19,4,5,5);ctx.fillRect(14,-9,5,5);
 }else if(idx===3){
  for(let i=0;i<5;i++){const a=i*1.25;const sx=Math.cos(a)*8,sy=Math.sin(a)*7;ctx.fillStyle=["#727b80","#9ca3a4","#59636a"][i%3];ctx.beginPath();ctx.moveTo(sx-5,sy+4);ctx.lineTo(sx-2,sy-5);ctx.lineTo(sx+5,sy-3);ctx.lineTo(sx+6,sy+4);ctx.closePath();ctx.fill();}
 }else{
  ctx.fillStyle="#17191c";ctx.beginPath();ctx.ellipse(0,5,13,16,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle="#70777b";ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(0,5,8,11,0,0,Math.PI*2);ctx.stroke();
  for(let i=0;i<3;i++){const fx=-8+i*8,flame=9+Math.sin(now/75+i*1.8)*4;ctx.fillStyle=i===1?"#ffe36a":"#ff7835";ctx.beginPath();ctx.moveTo(fx-5,0);ctx.quadraticCurveTo(fx-7,-flame,fx, -flame-5);ctx.quadraticCurveTo(fx+8,-flame,fx+5,0);ctx.fill();}
  ctx.fillStyle="rgba(100,105,110,.55)";ctx.beginPath();ctx.arc(12,-16+Math.sin(now/170)*2,5,0,Math.PI*2);ctx.fill();
 }
 ctx.restore();
}
function draw(){
 drawRoad();
 roadHazards.forEach(h=>drawRoadHazard(lanes[h.lane],h.y,performance.now(),h.asset));
  updateAnimatedHazards();
 traffic.forEach(v=>{const x=lanes[v.lane],y=v.y,upload=customAsset("trafficCars");const design=v.design||"preset:0";const idx=Math.max(0,Math.min(4,Number(String(design).split(":")[1])||0));const isTruck=idx===1;const drawW=isTruck?40:42;const drawH=isTruck?60:40;const individualUpload=customAsset("trafficCar"+idx)||upload;ctx.save();ctx.translate(x,y);ctx.rotate(Math.PI);if(individualUpload?.complete&&individualUpload.naturalWidth){ctx.drawImage(individualUpload,-drawW/2,-drawH/2,drawW,drawH);ctx.restore();return;}const car=window.GAMEZAAR_TRAFFIC_CARS?.[idx];if(car?.src){let img=presetImages[10+idx];if(!img){img=new Image();img.src=car.src;presetImages[10+idx]=img;}if(img.complete&&img.naturalWidth){ctx.drawImage(img,-drawW/2,-drawH/2,drawW,drawH);ctx.restore();return;}}ctx.restore();drawCar(x,y,["#ef343d","#f28b19","#18b94e","#ffbd18","#f4f6f8"][idx],false,Math.PI);});
 roadCoins.forEach(c=>drawCoin(lanes[c.lane],c.y,performance.now()));
 scorePopups=scorePopups.filter(p=>p.life>0);
 scorePopups.forEach(p=>{ctx.save();ctx.globalAlpha=Math.min(1,p.life/18);ctx.font="bold 13px monospace";ctx.textAlign="center";ctx.fillStyle="#fff0a0";ctx.shadowColor="#ffb84d";ctx.shadowBlur=8;ctx.fillText("+"+(p.value??10),p.x,p.y);ctx.restore();p.y-=.65;p.life-=1;});
 drawSelectedCar(playerX,500,selectedCar,30,45,playerTilt);
}
function speedForScore(s){return Number((1+Math.floor(s/100)*0.1).toFixed(1));}
function reset(){survivalClock=0;playerLane=1;playerX=lanes[1];playerTilt=0;traffic=[];trafficSpawnIndex=0;roadCoins=[];roadHazards=[];animatedHazardNodes.forEach(n=>n.remove());animatedHazardNodes.clear();hazardSpawn=0;nextHazardSpawn=720+Math.random()*240;scorePopups=[];coinSpawn=0;nextCoinSpawn=900+Math.random()*300;coinsThisRace=0;score=0;speed=1;spawn=0;crashing=false;last=performance.now();$("score").textContent="0000";$("speed").textContent="1.0x";if(raf)cancelAnimationFrame(raf);}
function endGame(){
 if(crashing)return;
 running=false;crashing=true;crashStarted=performance.now();explosion={x:playerX,y:500};
 if(score>best){best=score;localStorage.setItem(PREVIEW_KEYS.best,best);$("best").textContent=String(best).padStart(4,"0");}
 blastSound();
 if(navigator.vibrate)navigator.vibrate([120,55,180,60,260]);
 $("raceShell").classList.remove("screen-shake");void $("raceShell").offsetWidth;$("raceShell").classList.add("screen-shake");
}
function drawExplosion(now){
 const age=now-crashStarted,progress=Math.min(age/650,1),radius=12+progress*58;
 ctx.save();ctx.globalAlpha=1-progress*.55;
 for(let i=0;i<12;i++){const a=i*Math.PI/6+progress*1.8,dist=radius*(.55+(i%3)*.18);
  const x=explosion.x+Math.cos(a)*dist,y=explosion.y+Math.sin(a)*dist;
  glowRect(x-4,y-4,8,8,i%3===0?"#fff4a3":i%3===1?"#ff9b45":"#ff4d65",16);
 }
 ctx.beginPath();ctx.arc(explosion.x,explosion.y,Math.max(2,radius*.48),0,Math.PI*2);
 ctx.fillStyle="rgba(255,135,55,"+(1-progress)+")";ctx.shadowColor="#ff743c";ctx.shadowBlur=28;ctx.fill();
 ctx.restore();
 if(age>720){
  crashing=false;$("raceShell").classList.remove("screen-shake");
  $("overlayTitle").textContent="Race over!";
  $("overlayText").textContent="You scored "+score+" and collected "+coinsThisRace+" road coins. Choose your next ride!";
  $("garageMessage").textContent="";renderGarage();$("overlay").classList.remove("hidden");
 }
}
function frame(now){
 const dt=Math.min((now-last)/16.67||1,2);last=now;
 world+=(running?1.8+speed*2.65:3.8)*dt;
 if(running){
  // Smoothly steer toward the selected lane and lean the car into the turn.
  const targetX=lanes[playerLane],previousX=playerX;
  playerX+=(targetX-playerX)*Math.min(1,.19*dt);
  const horizontalVelocity=playerX-previousX;
  playerTilt+=(Math.max(-.18,Math.min(.18,horizontalVelocity*.045))-playerTilt)*Math.min(1,.22*dt);
  if(Math.abs(targetX-playerX)<.45){playerX=targetX;playerTilt*=.75;}
  survivalClock+=dt;if(survivalClock>=60){const seconds=Math.floor(survivalClock/60);survivalClock-=seconds*60;if(SCORE_RULES.survival?.enabled!==false)score+=seconds*Math.max(0,Math.floor(Number(SCORE_RULES.survival?.points)||0));$("score").textContent=String(score).padStart(4,"0");}
  spawn+=dt;
  // Spawn traffic in readable waves: mostly pairs in two lanes, sometimes
  // a single car. A pair always leaves one complete lane open and is staggered
  // vertically so the player has time to choose and move through the gap.
  const selectedTrafficDesigns=Array.isArray(CFG.selectedAssets?.trafficCars)?CFG.selectedAssets.trafficCars.filter(x=>typeof x==="string"&&/^preset:[0-4]$/.test(x)):[];
  const trafficSpawnInterval=8;
  if(spawn>trafficSpawnInterval&&!traffic.some(v=>v.y<115)){
   spawn=0;
   const makeCar=(lane,y)=>{
    const design=selectedTrafficDesigns.length?selectedTrafficDesigns[trafficSpawnIndex++%selectedTrafficDesigns.length]:"preset:0";
    traffic.push({lane,y,design,passed:false});
   };
   if(Math.random()<0.68){
    const openLane=Math.floor(Math.random()*3);
    const blockedLanes=[0,1,2].filter(lane=>lane!==openLane);
    if(Math.random()<0.5)blockedLanes.reverse();
    const stagger=78+Math.random()*24;
    makeCar(blockedLanes[0],-58);
    makeCar(blockedLanes[1],-58-stagger);
   }else{
    makeCar(Math.floor(Math.random()*3),-58);
   }
  }
  traffic.forEach(v=>{v.y+=(1.7+speed*2.45)*dt;if(!v.passed&&v.y>535){v.passed=true;if(SCORE_RULES.overtake?.enabled!==false)score+=Math.max(0,Math.floor(Number(SCORE_RULES.overtake?.points)||0));scorePopups.push({x:lanes[v.lane],y:510,life:34,value:Math.max(0,Math.floor(Number(SCORE_RULES.overtake?.points)||0))});$("score").textContent=String(score).padStart(4,"0");}});
  // Spawn the currently selected road hazard every 12–16 seconds.
  if(typeof CFG.selectedAssets?.roadHazards==="string"){
   hazardSpawn+=dt;
   if(hazardSpawn>=nextHazardSpawn){
    hazardSpawn=0;nextHazardSpawn=720+Math.random()*240;
    const available=[0,1,2].filter(lane=>!traffic.some(v=>v.lane===lane&&v.y>-150&&v.y<130)&&!roadHazards.some(h=>h.lane===lane&&h.y>-100&&h.y<120));
    if(available.length)roadHazards.push({lane:available[Math.floor(Math.random()*available.length)],y:-42,asset:selectedHazards[Math.floor(Math.random()*selectedHazards.length)]});
   }
  }
  roadHazards.forEach(h=>{h.y+=(1.7+speed*2.5)*dt;});
  roadHazards=roadHazards.filter(h=>h.y<660);
  // A road coin appears roughly every 15–20 seconds: only touching it adds to the wallet.
  coinSpawn+=dt;
  if(coinSpawn>=nextCoinSpawn){
   coinSpawn=0;nextCoinSpawn=900+Math.random()*300;
   const available=[0,1,2].filter(lane=>!traffic.some(v=>v.lane===lane&&v.y>-190&&v.y<150));
   if(available.length){
    const lane=available[Math.floor(Math.random()*available.length)];
    roadCoins.push({lane,y:-34});
   }
  }
  roadCoins.forEach(c=>{c.y+=(1.7+speed*2.85)*dt;});
  roadCoins=roadCoins.filter(c=>{
   if(Math.abs(lanes[c.lane]-playerX)<23&&Math.abs(c.y-500)<29){
    coins+=1;coinsThisRace+=1;if(SCORE_RULES.coin?.enabled!==false)score+=Math.max(0,Math.floor(Number(SCORE_RULES.coin?.points)||0));localStorage.setItem(PREVIEW_KEYS.coins,String(coins));
    $("coins").textContent=String(coins).padStart(4,"0");$("garageCoins").textContent=String(coins);$("score").textContent=String(score).padStart(4,"0");
    sound(880,.09,"triangle",.04);setTimeout(()=>sound(1180,.07,"sine",.025),45);return false;
   }
   return c.y<650;
  });
  traffic=traffic.filter(v=>v.y<660);
  speed=speedForScore(score);$("speed").textContent=speed.toFixed(1)+"x";
  for(const v of traffic){
   // Check actual horizontal overlap while the player's car is changing lanes.
   if(Math.abs(lanes[v.lane]-playerX)<27 && Math.abs(v.y-500)<43){endGame();break;}
  }
  for(const h of roadHazards){
   if(Math.abs(lanes[h.lane]-playerX)<25&&Math.abs(h.y-500)<38){endGame();break;}
  }
 }
 draw();
 if(crashing)drawExplosion(now);
 raf=requestAnimationFrame(frame);
}
function start(){
 reset();running=true;crashing=false;last=performance.now();$("overlay").classList.add("hidden");startSound();raf=requestAnimationFrame(frame);
}
function move(d){if(running){const next=Math.max(0,Math.min(2,playerLane+d));if(next!==playerLane){playerLane=next;steerSound();}}}
$("leftBtn").addEventListener("pointerdown",e=>{e.preventDefault();move(-1);});
$("rightBtn").addEventListener("pointerdown",e=>{e.preventDefault();move(1);});
let touchX=null;
canvas.addEventListener("touchstart",e=>{touchX=e.changedTouches[0].clientX;},{passive:true});
canvas.addEventListener("touchend",e=>{if(touchX===null)return;const dx=e.changedTouches[0].clientX-touchX;if(Math.abs(dx)>18)move(dx>0?1:-1);touchX=null;},{passive:true});
renderGarage();draw();loadCustomImages();last=performance.now();raf=requestAnimationFrame(frame);
})();
window.addEventListener("message",event=>{
 if(event.data?.type!=="GAMEZAAR_PREVIEW_REFRESH")return;
 const incoming=event.data.config;
 if(!incoming)return;
 const version=incoming.updatedAt||0;
 if(version===window.__GAMEZAAR_PREVIEW_CONFIG_VERSION)return;
 try{sessionStorage.setItem("gamezaar-live-preview-v1",JSON.stringify(incoming));}catch(e){}
 location.reload();
});
