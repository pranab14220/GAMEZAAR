const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const selectedGame = params.get("game") || "My Awesome Game";
const fields = ["gameTitle","gameSubtitle","difficulty","orientation","accentColor","sceneColor","soundToggle"];
const defaults = {gameTitle:selectedGame,gameSubtitle:"A new adventure begins",difficulty:"Normal",orientation:"portrait",accentColor:"#ff9b54",sceneColor:"#394563",soundToggle:true};
const settingsKey = "gamezaar-builder-v2";
const DB_NAME = "gamezaar-custom-assets";
const DB_STORE = "uploads";
const MAX_TOTAL = 2 * 1024 * 1024;
const assetTypes = [
 {id:"character",title:"Player / Character",desc:"Main player or hero sprite",limit:"150 KB each · 256 × 256 px max",maxKB:150,maxW:256,maxH:256,count:2,options:[["🧑","Hero"],["🤖","Robot"],["🦊","Fox"],["👾","Alien"],["🧙","Wizard"]]},
 {id:"vehicle",title:"Cars / Vehicles",desc:"Vehicles used by the player or traffic",limit:"150 KB each · 256 × 256 px max",maxKB:150,maxW:256,maxH:256,count:5,options:[["🏎️","Racer"],["🚙","SUV"],["🚕","Taxi"],["🏍️","Bike"],["🚜","Truck"]]},
 {id:"enemy",title:"Enemy / Obstacle",desc:"Enemies, barriers and hazards",limit:"100 KB each · 128 × 128 px max",maxKB:100,maxW:128,maxH:128,count:5,options:[["👹","Monster"],["🪨","Rock"],["🚧","Barrier"],["🛸","UFO"],["🐲","Dragon"]]},
 {id:"coin",title:"Coin / Collectible",desc:"Coins, gems and bonus objects",limit:"50 KB each · 64 × 64 px max",maxKB:50,maxW:64,maxH:64,count:5,options:[["🪙","Gold"],["💎","Gem"],["⭐","Star"],["❤️","Heart"],["🔑","Key"]]},
 {id:"background",title:"Game Background",desc:"Choose a background matching your screen orientation",limit:"500 KB each · Landscape 1280 × 720 / Portrait 720 × 1280",maxKB:500,maxW:1280,maxH:1280,count:2,options:[["🌄","Sunset"],["🌃","Night"],["🌲","Forest"],["🏙️","City"],["🏜️","Desert"]]},
 {id:"logo",title:"Game Logo",desc:"Your game title artwork",limit:"100 KB each · 256 × 256 px max",maxKB:100,maxW:256,maxH:256,count:1,options:[["🏆","Champion"],["⚡","Power"],["🔥","Blaze"],["🌟","Star"],["🎮","Arcade"]]},
 {id:"ui",title:"Buttons / Icons",desc:"Small interface symbols and buttons",limit:"30 KB each · 64 × 64 px max",maxKB:30,maxW:64,maxH:64,count:5,options:[["▶️","Play"],["⏸️","Pause"],["⚙️","Settings"],["🏠","Home"],["🔊","Sound"]]},
 {id:"object",title:"Other Objects",desc:"Extra props and decorative items",limit:"100 KB each · 128 × 128 px max",maxKB:100,maxW:128,maxH:128,count:5,options:[["🌳","Tree"],["☁️","Cloud"],["🌈","Rainbow"],["🧱","Block"],["🎁","Gift"]]}
];
let saved = {};
try { saved = JSON.parse(localStorage.getItem(settingsKey) || "{}"); } catch {}
let selectedAssets = saved.selectedAssets || {};
let customAssets = [];
let objectUrls = new Map();
let dbPromise;

function openAssetDB(){
 if(dbPromise)return dbPromise;
 dbPromise=new Promise((resolve,reject)=>{
  const request=indexedDB.open(DB_NAME,1);
  request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(DB_STORE))request.result.createObjectStore(DB_STORE,{keyPath:"id"});};
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error);
 });
 return dbPromise;
}
async function dbPut(record){const db=await openAssetDB();return new Promise((resolve,reject)=>{const tx=db.transaction(DB_STORE,"readwrite");tx.objectStore(DB_STORE).put(record);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}
async function dbDelete(id){const db=await openAssetDB();return new Promise((resolve,reject)=>{const tx=db.transaction(DB_STORE,"readwrite");tx.objectStore(DB_STORE).delete(id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}
async function dbAll(){const db=await openAssetDB();return new Promise((resolve,reject)=>{const tx=db.transaction(DB_STORE,"readonly");const req=tx.objectStore(DB_STORE).getAll();req.onsuccess=()=>resolve(req.result||[]);req.onerror=()=>reject(req.error);});}
function bytesLabel(bytes){return bytes<1024?bytes+" B":(bytes/1024).toFixed(bytes<10240?1:0)+" KB";}
function typeFor(id){return assetTypes.find(x=>x.id===id);}
function getAssets(id){return customAssets.filter(x=>x.type===id);}
function totalBytes(){return customAssets.reduce((sum,x)=>sum+x.size,0);}
function setStatus(message){$("saveStatus").textContent=message;}
function escapeHTML(value){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}

function buildAssetGroups(){
 const root=$("assetGroups");
 root.innerHTML=assetTypes.map(type=>`
  <section class="asset-group" data-asset-group="${type.id}">
   <div class="asset-group-head"><div><h3>${type.title}</h3><p>${type.desc}</p></div><span class="asset-limit">${type.count} max</span></div>
   <div class="asset-options">${type.options.map((option,index)=>`<button type="button" class="asset-option" data-type="${type.id}" data-option="${index}" aria-pressed="false"><span class="asset-glyph">${option[0]}</span><small>${option[1]}</small></button>`).join("")}</div>
   <div class="asset-upload-row"><label class="asset-upload-button">＋ Upload your own<input type="file" accept="image/png,image/jpeg,image/webp" data-upload="${type.id}" multiple></label><span class="asset-upload-note">${type.maxKB} KB max per file</span></div>
   <div class="uploaded-list" data-uploaded-list="${type.id}"></div>
  </section>`).join("");
 root.addEventListener("click",event=>{
  const option=event.target.closest(".asset-option");
  if(option){selectedAssets[option.dataset.type]="preset:"+option.dataset.option;render();return;}
  const remove=event.target.closest("[data-remove-asset]");
  if(remove)removeAsset(remove.dataset.removeAsset);
 });
 root.addEventListener("change",event=>{
  const input=event.target.closest("input[data-upload]");
  if(input&&input.files?.length)handleUploads(input.dataset.upload,[...input.files],input);
 });
}

async function handleUploads(typeId,files,input){
 const type=typeFor(typeId);let added=0;
 for(const file of files){
  if(!["image/png","image/jpeg","image/webp"].includes(file.type)){setStatus("Use PNG, JPG or WebP images only.");continue;}
  if(file.size>type.maxKB*1024){setStatus(file.name+" is too large. Maximum is "+type.maxKB+" KB.");continue;}
  if(getAssets(typeId).length>=type.count){setStatus(type.title+" allows up to "+type.count+" custom uploads.");break;}
  if(totalBytes()+file.size>MAX_TOTAL){setStatus("Custom asset limit reached. One game can use up to 2 MB of uploaded assets.");break;}
  const dimensions=await readDimensions(file);
  if(!dimensions){setStatus("Could not read "+file.name+". Try another image.");continue;}
  let valid=dimensions.width<=type.maxW&&dimensions.height<=type.maxH;
  if(typeId==="background"){
   const landscape=$("orientation").value==="landscape";
   const ratio=dimensions.width/dimensions.height;
   valid=dimensions.width<=(landscape?1280:720)&&dimensions.height<=(landscape?720:1280)&&(landscape?ratio>1:ratio<1);
  }
  if(!valid){
   const hint=typeId==="background"?($("orientation").value==="landscape"?"a landscape image up to 1280 × 720 px":"a portrait image up to 720 × 1280 px"):"an image up to "+type.maxW+" × "+type.maxH+" px";
   setStatus(file.name+" must be "+hint+".");continue;
  }
  const id=typeId+"-"+Date.now()+"-"+Math.random().toString(36).slice(2,7);
  const record={id,type:typeId,name:file.name,size:file.size,width:dimensions.width,height:dimensions.height,blob:file};
  try{await dbPut(record);customAssets.push(record);selectedAssets[typeId]="custom:"+id;added++;}
  catch{setStatus("Could not save this image in your browser storage.");}
 }
 input.value="";
 render();
 if(added)setStatus(added+" custom asset"+(added>1?"s":"")+" added. Your images are saved on this device.");
}
function readDimensions(file){
 return new Promise(resolve=>{
  const url=URL.createObjectURL(file),img=new Image();
  img.onload=()=>{const result={width:img.naturalWidth,height:img.naturalHeight};URL.revokeObjectURL(url);resolve(result);};
  img.onerror=()=>{URL.revokeObjectURL(url);resolve(null);};
  img.src=url;
 });
}
async function removeAsset(id){
 const item=customAssets.find(x=>x.id===id);if(!item)return;
 try{await dbDelete(id);}catch{}
 customAssets=customAssets.filter(x=>x.id!==id);
 if(selectedAssets[item.type]==="custom:"+id)delete selectedAssets[item.type];
 const url=objectUrls.get(id);if(url)URL.revokeObjectURL(url);objectUrls.delete(id);
 render();setStatus("Custom image removed.");
}
function assetLabel(typeId){
 const value=selectedAssets[typeId]||"preset:0";
 if(value.startsWith("custom:"))return customAssets.find(x=>x.id===value.slice(7))?.name||"Your upload";
 const type=typeFor(typeId),index=Number(value.split(":")[1]||0);
 return type.options[index]?.[1]||type.options[0][1];
}
function render(){
 const title=$("gameTitle").value.trim()||"My Awesome Game";
 const subtitle=$("gameSubtitle").value.trim()||"A new adventure begins";
 $("previewTitle").textContent=title;$("previewSubtitle").textContent=subtitle;
 $("pixelScene").style.background=$("sceneColor").value;
 $("previewPlay").style.background=$("accentColor").value;
 $("accentValue").textContent=$("accentColor").value.toUpperCase();
 $("sceneValue").textContent=$("sceneColor").value.toUpperCase();
 $("gameDevice").classList.toggle("landscape-device",$("orientation").value==="landscape");
 $("pixelScene").style.aspectRatio=$("orientation").value==="landscape"?"16 / 9":"9 / 16";
 $("pixelScene").style.height=$("orientation").value==="landscape"?"190px":"250px";
 const char=selectedAssets.character||"preset:0",coin=selectedAssets.coin||"preset:0",bg=selectedAssets.background||"preset:0";
 const charRecord=char.startsWith("custom:")?customAssets.find(x=>x.id===char.slice(7)):null;
 const coinRecord=coin.startsWith("custom:")?customAssets.find(x=>x.id===coin.slice(7)):null;
 const bgRecord=bg.startsWith("custom:")?customAssets.find(x=>x.id===bg.slice(7)):null;
 setPreviewImage($("previewPlayer"),charRecord,"◆", "contain");
 setPreviewImage($("previewCoin"),coinRecord,"●","contain");
 const scene=$("pixelScene");
 if(bgRecord){scene.style.backgroundImage="url('"+objectUrls.get(bgRecord.id)+"')";scene.style.backgroundSize="cover";scene.style.backgroundPosition="center";}
 else{scene.style.backgroundImage="";scene.style.backgroundSize="";}
 const summary=["character","vehicle","enemy","coin","background"].map(id=>assetLabel(id)).join(" · ");
 $("selectedSummary").textContent=summary;
 document.querySelectorAll(".asset-option").forEach(button=>{
  const current=selectedAssets[button.dataset.type]||"preset:0";
  const active=current==="preset:"+button.dataset.option;
  button.classList.toggle("active",active);button.setAttribute("aria-pressed",String(active));
 });
 assetTypes.forEach(type=>{
  const list=document.querySelector('[data-uploaded-list="'+type.id+'"]');
  list.innerHTML=getAssets(type.id).map(item=>{
   let url=objectUrls.get(item.id);
   if(!url){url=URL.createObjectURL(item.blob);objectUrls.set(item.id,url);}
   return `<span class="uploaded-chip"><img src="${url}" alt=""><span>${escapeHTML(item.name)} · ${bytesLabel(item.size)}</span><button type="button" data-remove-asset="${item.id}" aria-label="Remove ${escapeHTML(item.name)}">×</button></span>`;
  }).join("");
 });
 const total=totalBytes();
 $("assetTotal").innerHTML=bytesLabel(total)+' <small>/ 2 MB</small>';
 $("budgetFill").style.width=Math.min(100,total/MAX_TOTAL*100)+"%";
 $("assetBudgetNote").textContent=bytesLabel(MAX_TOTAL-total)+" upload space remaining. Each asset must also meet its own limit.";
}
function setPreviewImage(element,record,fallback,fit){
 if(record){let url=objectUrls.get(record.id);if(!url){url=URL.createObjectURL(record.blob);objectUrls.set(record.id,url);}element.textContent="";element.style.backgroundImage="url('"+url+"')";element.style.backgroundRepeat="no-repeat";element.style.backgroundPosition="center";element.style.backgroundSize=fit;}
 else{element.textContent=fallback;element.style.backgroundImage="";}
}
function setValues(data){fields.forEach(id=>{if(data[id]!==undefined){if($(id).type==="checkbox")$(id).checked=!!data[id];else $(id).value=data[id];}});render();}
fields.forEach(id=>$(id).addEventListener("input",render));
$("orientation").addEventListener("change",()=>{render();setStatus("Screen orientation changed. Upload a matching background image.");});
$("saveGame").addEventListener("click",()=>{
 const data={};fields.forEach(id=>data[id]=$(id).type==="checkbox"?$(id).checked:$(id).value);
 data.selectedAssets=selectedAssets;data.savedAt=new Date().toISOString();
 try{localStorage.setItem(settingsKey,JSON.stringify(data));setStatus("Game settings saved on this device. Custom images are stored in this browser.");}
 catch{setStatus("Browser storage is full. Remove some custom assets and try again.");}
});
$("resetGame").addEventListener("click",()=>{
 if(!confirm("Reset game settings and remove all uploaded custom assets from this device?"))return;
 localStorage.removeItem(settingsKey);
 Promise.all(customAssets.map(item=>dbDelete(item.id))).finally(()=>{
  objectUrls.forEach(url=>URL.revokeObjectURL(url));objectUrls.clear();customAssets=[];selectedAssets={};setValues(defaults);setStatus("Builder settings and custom uploads have been reset.");
 });
});
$("previewPlay").addEventListener("click",()=>setStatus("Your visual preview is ready. The playable game engine and APK/AAB export will be connected in a later build stage."));

async function init(){
 buildAssetGroups();
 try{
  customAssets=await dbAll();
  customAssets.forEach(item=>{if(item.blob&&!objectUrls.has(item.id))objectUrls.set(item.id,URL.createObjectURL(item.blob));});
 }catch{setStatus("Browser storage is unavailable. You can still preview the preset asset options.");}
 setValues({...defaults,...saved});
}
init();
