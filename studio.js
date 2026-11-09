const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const selectedGame = params.get("game") || "My Awesome Game";
const fields = ["gameTitle","gameSubtitle","difficulty","orientation","accentColor","sceneColor"];
const defaults = {gameTitle:selectedGame,gameSubtitle:"A new adventure begins",difficulty:"Normal",orientation:"landscape",accentColor:"#ff9b54",sceneColor:"#394563"};
const settingsKey = "gamezaar-builder-v3";
const DB_NAME = "gamezaar-custom-assets";
const DB_STORE = "uploads";
const MAX_TOTAL = 2 * 1024 * 1024;
const imageTypes = [
 {id:"vehicle",title:"Player Car",desc:"Choose one of the five custom top-down cars from your example racing game",limit:"150 KB · 256 × 256 px max",maxKB:150,maxW:256,maxH:256,count:5,options:[["🔴","Red Racing"],["🔵","Blue Flame"],["🟡","Yellow Checker"],["🟢","Green Arrow"],["⚪","White Blue Stripe"]]},
 {id:"trafficCars",title:"Traffic Cars",desc:"Choose the vehicles approaching from the opposite direction (select up to all 5)",limit:"100 KB · 128 × 128 px max",maxKB:100,maxW:128,maxH:128,count:5,multi:true,options:[["🚗","Red Sedan"],["🚚","Cargo Truck"],["🏎️","Green Sports"],["🚌","Yellow Bus"],["🚑","Ambulance"]]},
 {id:"roadBarriers",title:"Road Barriers",desc:"Choose one barrier style for road obstacles",limit:"100 KB · 128 × 128 px max",maxKB:100,maxW:128,maxH:128,count:5,options:[["🚧","Construction"],["🛑","Stop Block"],["🪵","Wood Barrier"],["🧱","Brick Block"],["⛔","Road Block"]]},
 {id:"roadHazards",title:"Road Hazards",desc:"Choose one hazard style to avoid while driving",limit:"100 KB · 128 × 128 px max",maxKB:100,maxW:128,maxH:128,count:5,options:[["🛢️","Oil Drum"],["🪨","Rock"],["🕳️","Pothole"],["🔥","Fire"],["⚠️","Warning Cone"]]},
 {id:"coin",title:"Coins & Collectibles",desc:"Objects the player can collect on the road",limit:"50 KB · 64 × 64 px max",maxKB:50,maxW:64,maxH:64,count:5,options:[["🪙","Gold Coin"],["💎","Gem"],["⭐","Star"],["💰","Bonus"],["🏅","Medal"]]},
 {id:"logo",title:"Game Logo",desc:"Artwork for your racing game's title",limit:"100 KB · 256 × 256 px max",maxKB:100,maxW:256,maxH:256,count:5,options:[["🏆","Champion"],["⚡","Turbo"],["🔥","Blaze"],["🏎️","Racer"],["🌟","Legend"]]}
];
const garageUploadTypes=Array.from({length:8},(_,i)=>({id:"garageCar"+i,title:"Garage Car "+(i+1),desc:"Optional custom image for garage car "+(i+1),limit:"150 KB · 256 × 256 px max",maxKB:150,maxW:256,maxH:256,count:1,options:[]}));
const defaultGaragePrices=[30,50,70,90,120,150,180,220];
let garagePrices=[...defaultGaragePrices];
const treeClimateTypes = [
 {id:"summer",title:"Summer",options:[["🌳","Mango Tree"],["🌴","Palm Tree"],["🌿","Neem Tree"],["🌳","Banyan Tree"],["🌼","Flowering Tree"]]},
 {id:"winter",title:"Winter",options:[["🌲","Pine Tree"],["🌲","Fir Tree"],["🌳","Birch Tree"],["🍂","Bare Winter Tree"],["🌲","Spruce Tree"]]},
 {id:"desert",title:"Desert",options:[["🌵","Saguaro Cactus"],["🌴","Date Palm"],["🌵","Barrel Cactus"],["🌿","Desert Shrub"],["🌳","Acacia Tree"]]},
 {id:"tropical",title:"Tropical",options:[["🌴","Coconut Palm"],["🌴","Banana Plant"],["🌳","Rainforest Tree"],["🌺","Hibiscus Tree"],["🌴","Tropical Fern"]]},
 {id:"autumn",title:"Autumn",options:[["🍁","Red Maple"],["🍂","Golden Birch"],["🍁","Orange Oak"],["🌳","Autumn Elm"],["🍂","Falling Leaves Tree"]]}
];
const roadClimateTypes = [
 {id:"summer",title:"Summer",options:[["🛣️","Sunlit Asphalt"],["🚘","City Boulevard"],["🛤️","Country Highway"],["🏁","Dry Raceway"],["🌇","Hot Sunset Road"]]},
 {id:"winter",title:"Winter",options:[["❄️","Snow Covered Road"],["🧊","Icy Highway"],["🌨️","Snowfall Road"],["🌲","Frozen Forest Road"],["🌫️","Foggy Winter Road"]]},
 {id:"desert",title:"Desert",options:[["🏜️","Sandy Highway"],["🌵","Desert Asphalt"],["🟠","Dusty Road"],["🛣️","Rocky Desert Road"],["🌅","Dune Road"]]},
 {id:"tropical",title:"Tropical",options:[["🌴","Island Highway"],["🌧️","Rainforest Road"],["🌿","Jungle Road"],["🌊","Coastal Road"],["🌺","Tropical Village Road"]]},
 {id:"autumn",title:"Autumn",options:[["🍂","Leaf Covered Road"],["🍁","Maple Avenue"],["🌳","Golden Forest Road"],["🌦️","Autumn Wet Road"],["🌆","Autumn City Road"]]}
];
const landClimateTypes = [
 {id:"summer",title:"Summer",options:[["🌱","Green Grass"],["🌾","Dry Meadow"],["🌻","Sunny Field"],["🟫","Warm Soil"],["🌿","Green Countryside"]]},
 {id:"winter",title:"Winter",options:[["❄️","Deep Snow"],["🧊","Frozen Ground"],["🌨️","Snowy Field"],["🌲","Snowy Forest Floor"],["🤍","Frosty Ground"]]},
 {id:"desert",title:"Desert",options:[["🏜️","Golden Sand"],["🟠","Red Sand"],["🪨","Rocky Desert"],["🌵","Cactus Ground"],["⛰️","Dry Badlands"]]},
 {id:"tropical",title:"Tropical",options:[["🌴","Jungle Floor"],["🌿","Lush Green Ground"],["🍃","Rainforest Floor"],["🌊","Coastal Sand"],["🌺","Tropical Grass"]]},
 {id:"autumn",title:"Autumn",options:[["🍂","Fallen Leaves"],["🍁","Golden Leaf Ground"],["🟤","Brown Forest Soil"],["🌾","Harvest Field"],["🌳","Autumn Park Ground"]]}
];
const treeOptions = treeClimateTypes.flatMap(group=>group.options);
const climateGroupsByType = {bgTree:treeClimateTypes,bgRoad:roadClimateTypes,bgLand:landClimateTypes};
let selectedClimateByGroup = {bgTree:"summer",bgRoad:"summer",bgLand:"summer"};
const backgroundTypes = [
 {id:"bgTree",title:"Trees",desc:"Choose a climate, then select from five matching roadside tree and plant designs",limit:"100 KB · 128 × 128 px max",maxKB:100,maxW:128,maxH:128,count:5,options:treeOptions},
 {id:"bgRoad",title:"Road",desc:"Choose a climate, then select a matching road surface and style",limit:"500 KB · 1280 × 720 px max",maxKB:500,maxW:1280,maxH:720,count:25,options:roadClimateTypes.flatMap(group=>group.options)},
 {id:"bgLand",title:"Land / Ground",desc:"Choose a climate, then select matching roadside land and ground designs",limit:"300 KB · 1280 × 720 px max",maxKB:300,maxW:1280,maxH:720,count:25,options:landClimateTypes.flatMap(group=>group.options)},
 {id:"bgBuilding",title:"Houses",desc:"Choose the houses shown along the outer edges of the scene",limit:"200 KB · 256 × 256 px max",maxKB:200,maxW:256,maxH:256,count:5,options:[["🏘️","Houses"],["🏡","Small Homes"],["🏢","City Buildings"],["🏠","Modern Homes"],["🏚️","Old Houses"]]}
];
const buttonTypes = [
 {id:"btnPlay",title:"Play Button",desc:"Main start/play control",limit:"30 KB · 128 × 64 px max",maxKB:30,maxW:128,maxH:64,count:5,options:[["▶️","Classic"],["🟠","Round"],["🟩","Pixel"],["⚡","Neon"],["🏁","Racing"]]},
 {id:"btnPause",title:"Pause Button",desc:"Pause the race",limit:"30 KB · 64 × 64 px max",maxKB:30,maxW:64,maxH:64,count:5,options:[["⏸️","Classic"],["Ⅱ","Slim"],["🟧","Round"],["▥","Pixel"],["⏯️","Modern"]]},
 {id:"btnResume",title:"Resume Button",desc:"Continue a paused race",limit:"30 KB · 128 × 64 px max",maxKB:30,maxW:128,maxH:64,count:5,options:[["▶️","Classic"],["⏵","Modern"],["🟢","Round"],["⚡","Neon"],["🏎️","Turbo"]]},
 {id:"btnRestart",title:"Restart Button",desc:"Restart the current race",limit:"30 KB · 64 × 64 px max",maxKB:30,maxW:64,maxH:64,count:5,options:[["🔄","Classic"],["↻","Minimal"],["🟠","Round"],["⟲","Pixel"],["⚡","Neon"]]},
 {id:"btnSettings",title:"Settings Button",desc:"Open game settings",limit:"30 KB · 64 × 64 px max",maxKB:30,maxW:64,maxH:64,count:5,options:[["⚙️","Classic"],["🔧","Tools"],["☷","Minimal"],["🟠","Round"],["🎛️","Control"]]}
];
const soundTypes = [
 {id:"soundButton",title:"Button Sounds",desc:"Tap, play, pause and menu button feedback",options:["Soft Click","Arcade Pop","Retro Beep","Digital Tap","Classic UI"]},
 {id:"soundCollision",title:"Collision / Crash",desc:"Impact and crash sound effect",options:["Crash Hit","Metal Impact","Arcade Explosion","Heavy Smash","Retro Blast"]},
 {id:"soundCoin",title:"Coin Collection",desc:"Play when a coin or reward is collected",options:["Coin Chime","Cash Ring","Bright Sparkle","Retro Pickup","Gem Collect"]},
 {id:"soundMusic",title:"Background Music",desc:"Looping music during the race",options:["Energetic Race","Retro Racing","Synth Drive","Chill Highway","Epic Chase"]},
 {id:"soundGameOver",title:"Game Over Sound",desc:"Play when the player crashes or the run ends",options:["Arcade Game Over","Low Fail Tone","Crash Finish","Retro Lose","Short Sad Jingle"]},
];
let saved = {};
try { saved = JSON.parse(localStorage.getItem(settingsKey) || "{}"); } catch {}
let selectedAssets = {bgBuilding:"preset:0",trafficCars:["preset:0","preset:1","preset:2","preset:3","preset:4"],...(saved.selectedAssets || {})};
let selectedSounds = saved.selectedSounds || {};
let soundEnabled = saved.soundEnabled || {};
let customAssets = [];
let objectUrls = new Map();
let dbPromise;
function openAssetDB(){
 if(dbPromise)return dbPromise;
 dbPromise=new Promise((resolve,reject)=>{const request=indexedDB.open(DB_NAME,1);request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(DB_STORE))request.result.createObjectStore(DB_STORE,{keyPath:"id"});};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
 return dbPromise;
}
async function dbPut(record){const db=await openAssetDB();return new Promise((resolve,reject)=>{const tx=db.transaction(DB_STORE,"readwrite");tx.objectStore(DB_STORE).put(record);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}
async function dbDelete(id){const db=await openAssetDB();return new Promise((resolve,reject)=>{const tx=db.transaction(DB_STORE,"readwrite");tx.objectStore(DB_STORE).delete(id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}
async function dbAll(){const db=await openAssetDB();return new Promise((resolve,reject)=>{const tx=db.transaction(DB_STORE,"readonly");const req=tx.objectStore(DB_STORE).getAll();req.onsuccess=()=>resolve(req.result||[]);req.onerror=()=>reject(req.error);});}
function bytesLabel(bytes){return bytes<1024?bytes+" B":(bytes/1024).toFixed(bytes<10240?1:0)+" KB";}
function allImageTypes(){return [...imageTypes,...garageUploadTypes,...backgroundTypes,...buttonTypes];}
function typeFor(id){return allImageTypes().find(x=>x.id===id);}
function getAssets(id){return customAssets.filter(x=>x.type===id);}
function totalBytes(){return customAssets.reduce((sum,x)=>sum+x.size,0);}
function setStatus(message){$("saveStatus").textContent=message;}
function showImageUploadError(typeId,message){
 setStatus(message);
 const list=document.querySelector('[data-uploaded-list="'+typeId+'"]');
 if(list){list.innerHTML='<div class="upload-error-message" role="alert">⚠️ '+escapeHTML(message)+'</div>';list.scrollIntoView({behavior:"smooth",block:"center"});}
}
function escapeHTML(value){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function garageMarkup(){return `<section class="garage-studio-section"><div class="garage-studio-heading"><b>🏁 Garage Cars</b><small>8 stylish cars stay locked in the game Garage until players buy them with coins.</small></div><div class="garage-studio-grid">${(window.GAMEZAAR_GARAGE_CARS||[]).map((car,i)=>`<article class="garage-studio-car"><div class="garage-studio-art"><img src="${car.src}" alt="${car.name}"></div><strong>${car.name}</strong><label>Price (coins)<input type="number" min="0" step="1" data-garage-price="${i}" value="${garagePrices[i]??defaultGaragePrices[i]}"></label><label class="garage-upload-label">＋ Upload car ${i+1}<input type="file" accept="image/png,image/jpeg,image/webp" data-upload="garageCar${i}"></label><small>150 KB max · optional</small><div class="uploaded-list" data-uploaded-list="garageCar${i}"></div></article>`).join("")}</div></section>`;}
function groupMarkup(type){
 const climateGroups=climateGroupsByType[type.id];
 const climateMarkup=climateGroups
  ? `<div class="tree-climate-tabs">${climateGroups.map(group=>`<button type="button" class="tree-climate-tab" data-climate-group="${type.id}" data-climate="${group.id}" aria-pressed="false">${group.title}</button>`).join("")}</div><div class="asset-options" data-climate-options="${type.id}"></div>`
  : `<div class="asset-options">${type.options.map((option,index)=>`<button type="button" class="asset-option" data-type="${type.id}" data-option="${index}" aria-pressed="false">${type.id==="vehicle"&&window.GAMEZAAR_PLAYER_CARS?.[index]?`<img class="player-car-option-image" src="${window.GAMEZAAR_PLAYER_CARS[index].src}" alt="${option[1]}">`:type.id==="trafficCars"&&window.GAMEZAAR_TRAFFIC_CARS?.[index]?`<img class="traffic-car-option-image" src="${window.GAMEZAAR_TRAFFIC_CARS[index].src}" alt="${option[1]}">`:`<span class="asset-glyph">${option[0]}</span>`}<small>${option[1]}</small></button>`).join("")}</div>`;
 return `<section class="asset-group" data-asset-group="${type.id}">
  <button type="button" class="asset-group-toggle" aria-expanded="false"><span><b>${type.title}</b><small>${type.desc}</small></span><span class="asset-chevron">＋</span></button>
  <div class="asset-group-panel" hidden>
   <div class="asset-group-meta"><span>${type.limit}</span><span>${type.multi?"Choose up to 5 designs":climateGroups?"5 climate categories · 5 designs each":"5 styles + your upload"}</span></div>
   ${climateMarkup}
   <div class="asset-upload-row"><label class="asset-upload-button">＋ Upload your own<input type="file" accept="image/png,image/jpeg,image/webp" data-upload="${type.id}"></label><span class="asset-upload-note">1 upload maximum · ${type.maxKB} KB</span></div>
   <div class="uploaded-list" data-uploaded-list="${type.id}"></div>
  </div>
 </section>`;
}
function buildAssetGroups(){
 const groups=imageTypes.map(groupMarkup);groups.splice(1,0,garageMarkup());$("assetGroups").innerHTML=groups.join("");
 $("backgroundGroups").innerHTML=backgroundTypes.map(groupMarkup).join("");
 $("buttonGroups").innerHTML=buttonTypes.map(groupMarkup).join("");
 document.querySelectorAll(".asset-groups").forEach(root=>{
  root.addEventListener("click",event=>{
   const toggle=event.target.closest(".asset-group-toggle");
   if(toggle){const panel=toggle.parentElement.querySelector(".asset-group-panel"),open=panel.hidden;panel.hidden=!open;toggle.setAttribute("aria-expanded",String(open));toggle.querySelector(".asset-chevron").textContent=open?"−":"＋";return;}
   const climate=event.target.closest("[data-climate-group]");
   if(climate){selectedClimateByGroup[climate.dataset.climateGroup]=climate.dataset.climate;render();return;}
   const option=event.target.closest(".asset-option");
   if(option){const type=typeFor(option.dataset.type);if(type?.multi){const key=option.dataset.type,values=Array.isArray(selectedAssets[key])?selectedAssets[key]:[];const value="preset:"+option.dataset.option;selectedAssets[key]=values.includes(value)?values.filter(item=>item!==value):values.length<5?[...values,value]:values;setStatus("Selected "+selectedAssets[key].length+" of 5 traffic vehicles.");}else{selectedAssets[option.dataset.type]="preset:"+option.dataset.option;}render();return;}
   const remove=event.target.closest("[data-remove-asset]");
   if(remove)removeAsset(remove.dataset.removeAsset);
  });
  root.addEventListener("change",event=>{const input=event.target.closest("input[data-upload]");if(input&&input.files?.length)handleImageUploads(input.dataset.upload,[...input.files],input);});
 });
}
function buildSoundGroups(){
 $("soundGroups").innerHTML=soundTypes.map(type=>`<section class="sound-group" data-sound-group="${type.id}">
  <div class="sound-group-head"><div><b>${type.title}</b><small>${type.desc}</small></div><label class="sound-switch"><input type="checkbox" data-sound-toggle="${type.id}" checked><span>ON</span></label></div>
  <div class="sound-options">${type.options.map((name,index)=>`<button type="button" class="sound-option" data-sound-type="${type.id}" data-sound-option="${index}">${name}</button>`).join("")}</div>
  <div class="sound-upload-row"><label class="asset-upload-button">＋ Upload sound<input type="file" accept="audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/x-m4a" data-sound-upload="${type.id}"></label><span class="sound-selected" data-sound-selected="${type.id}">Selected: ${type.options[0]}</span></div>
  <div class="uploaded-list" data-sound-file="${type.id}"></div>
 </section>`).join("");
 $("soundGroups").addEventListener("click",event=>{const option=event.target.closest(".sound-option");if(option){selectedSounds[option.dataset.soundType]="preset:"+option.dataset.soundOption;render();playSoundPreview(option.dataset.soundType,Number(option.dataset.soundOption));return;}const play=event.target.closest("[data-play-audio]");if(play){const item=customAssets.find(x=>x.id===play.dataset.playAudio);if(item){const audio=new Audio(getObjectUrl(item));audio.play().catch(()=>setStatus("Could not play this audio file."));}return;}const remove=event.target.closest("[data-remove-asset]");if(remove)removeAsset(remove.dataset.removeAsset);});
 $("soundGroups").addEventListener("change",event=>{
  const toggle=event.target.closest("[data-sound-toggle]");if(toggle){soundEnabled[toggle.dataset.soundToggle]=toggle.checked;toggle.nextElementSibling.textContent=toggle.checked?"ON":"OFF";return;}
  const input=event.target.closest("input[data-sound-upload]");if(input&&input.files?.[0])handleSoundUpload(input.dataset.soundUpload,input.files[0],input);
 });
}
async function handleImageUploads(typeId,files,input){
 const type=typeFor(typeId),file=files[0];
 if(!file){input.value="";return;}
 if(getAssets(typeId).length>=1){showImageUploadError(typeId,"A design is already uploaded for "+type.title+". Tap × on its preview and confirm delete before uploading another.");input.value="";return;}
 if(!["image/png","image/jpeg","image/webp"].includes(file.type)){showImageUploadError(typeId,"Upload nahi ho sakta: sirf PNG, JPG ya WebP image select karo.");input.value="";return;}
 if(file.size>type.maxKB*1024){showImageUploadError(typeId,"Upload nahi ho sakta: "+file.name+" file bahut badi hai. "+type.title+" ke liye maximum size "+type.maxKB+" KB hai.");input.value="";return;}
 if(totalBytes()+file.size>MAX_TOTAL){showImageUploadError(typeId,"Upload nahi ho sakta: sabhi custom uploads ka total limit 2 MB hai. Pehle koi purani file delete karo.");input.value="";return;}
 const dimensions=await readDimensions(file);if(!dimensions){showImageUploadError(typeId,"Upload nahi ho sakta: "+file.name+" image open nahi ho pa rahi.");input.value="";return;}
 let valid=dimensions.width<=type.maxW&&dimensions.height<=type.maxH;
 if(typeId==="bgRoad"||typeId==="bgLand"){valid=dimensions.width<=1280&&dimensions.height<=720;}
 if(!valid){showImageUploadError(typeId,"Upload nahi ho sakta: "+file.name+" ka image size "+type.title+" ke allowed dimensions se bada hai.");input.value="";return;}
 const id=typeId+"-"+Date.now()+"-"+Math.random().toString(36).slice(2,7),record={id,type:typeId,kind:"image",name:file.name,size:file.size,width:dimensions.width,height:dimensions.height,blob:file};
 try{await dbPut(record);customAssets.push(record);selectedAssets[typeId]="custom:"+id;render();setStatus("Image uploaded. Its preview is shown directly below the Upload button.");document.querySelector('[data-uploaded-list="'+typeId+'"]')?.scrollIntoView({behavior:"smooth",block:"nearest"});}
 catch{setStatus("Could not save this image in browser storage.");}
 input.value="";
}
function readDimensions(file){return new Promise(resolve=>{const url=URL.createObjectURL(file),img=new Image();img.onload=()=>{const result={width:img.naturalWidth,height:img.naturalHeight};URL.revokeObjectURL(url);resolve(result);};img.onerror=()=>{URL.revokeObjectURL(url);resolve(null);};img.src=url;});}
async function handleSoundUpload(typeId,file,input){
 const allowed=["audio/mpeg","audio/wav","audio/x-wav","audio/ogg","audio/mp4","audio/x-m4a"];
 if(!allowed.includes(file.type)&&! /\.(mp3|wav|ogg|m4a)$/i.test(file.name)){setStatus("Use MP3, WAV, OGG or M4A audio.");input.value="";return;}
 if(file.size>500*1024){setStatus("Sound file must be 500 KB or smaller.");input.value="";return;}
 if(totalBytes()+file.size>MAX_TOTAL){setStatus("Custom asset limit reached. One game can use up to 2 MB.");input.value="";return;}
 const old=getAssets(typeId);for(const item of old){await dbDelete(item.id);customAssets=customAssets.filter(x=>x.id!==item.id);}
 const id=typeId+"-"+Date.now(),record={id,type:typeId,kind:"audio",name:file.name,size:file.size,blob:file};
 try{await dbPut(record);customAssets.push(record);selectedSounds[typeId]="custom:"+id;render();setStatus("Sound uploaded for "+soundTypes.find(x=>x.id===typeId).title+".");}catch{setStatus("Could not save this sound.");}
 input.value="";
}
function playSoundPreview(typeId,index){
 try{const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return;const ctx=new Ctx(),osc=ctx.createOscillator(),gain=ctx.createGain();const base=[440,660,520,780,330][index%5];osc.type=index%2?"square":"sine";osc.frequency.setValueAtTime(base,ctx.currentTime);osc.frequency.exponentialRampToValueAtTime(Math.max(90,base/2),ctx.currentTime+.16);gain.gain.setValueAtTime(.08,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.2);osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+.21);osc.onended=()=>ctx.close();}catch{}
}
async function removeAsset(id){
 const item=customAssets.find(x=>x.id===id);if(!item)return;
 if(item.kind==="image"&&!confirm("Delete this uploaded image? You must delete it before uploading a different design."))return;
 try{await dbDelete(id);}catch{}
 customAssets=customAssets.filter(x=>x.id!==id);
 if(item.kind==="audio"){if(selectedSounds[item.type]==="custom:"+id)delete selectedSounds[item.type];}
 else if(selectedAssets[item.type]==="custom:"+id)delete selectedAssets[item.type];
 const url=objectUrls.get(id);if(url)URL.revokeObjectURL(url);objectUrls.delete(id);render();setStatus("Custom upload removed.");
}
function assetLabel(typeId){
 const value=selectedAssets[typeId]||"preset:0";if(value.startsWith("custom:"))return customAssets.find(x=>x.id===value.slice(7))?.name||"Your upload";
 const type=typeFor(typeId),index=Number(value.split(":")[1]||0);return type.options[index]?.[1]||type.options[0][1];
}
function soundLabel(typeId){
 const value=selectedSounds[typeId]||"preset:0";if(value.startsWith("custom:"))return customAssets.find(x=>x.id===value.slice(7))?.name||"Uploaded sound";
 const type=soundTypes.find(x=>x.id===typeId);return type.options[Number(value.split(":")[1]||0)]||type.options[0];
}
function syncLivePreviewData(){
 const data={};fields.forEach(id=>data[id]=$(id).value);data.selectedAssets=selectedAssets;data.garagePrices=garagePrices;data.garageCars=(window.GAMEZAAR_GARAGE_CARS||[]).map((car,i)=>({name:car.name,price:garagePrices[i]??defaultGaragePrices[i],uploadId:(selectedAssets["garageCar"+i]||"").startsWith("custom:")?selectedAssets["garageCar"+i].slice(7):null}));data.selectedSounds=selectedSounds;data.soundEnabled=soundEnabled;data.climateSelections=selectedClimateByGroup;data.assetOptions=Object.fromEntries(allImageTypes().map(type=>[type.id,type.options]));data.updatedAt=Date.now();
 try{sessionStorage.setItem("gamezaar-live-preview-v1",JSON.stringify(data));}catch{}
 if(playablePreviewFrame&&playablePreviewFrame.contentWindow&&playablePreviewFrame.getAttribute("src")!=="about:blank")playablePreviewFrame.contentWindow.postMessage({type:"GAMEZAAR_PREVIEW_REFRESH"},"*");
}
function render(){
 syncLivePreviewData();
 const title=$("gameTitle").value.trim()||"My Awesome Game",subtitle=$("gameSubtitle").value.trim()||"A new adventure begins";
 $("previewTitle").textContent=title;$("previewSubtitle").textContent=subtitle;$("pixelScene").style.background=$("sceneColor").value;$("previewPlay").style.background=$("accentColor").value;
 $("accentValue").textContent=$("accentColor").value.toUpperCase();$("sceneValue").textContent=$("sceneColor").value.toUpperCase();
 $("gameDevice").classList.toggle("landscape-device",$("orientation").value==="landscape");
 $("pixelScene").style.aspectRatio=$("orientation").value==="landscape"?"16 / 9":"9 / 16";$("pixelScene").style.height=$("orientation").value==="landscape"?"190px":"320px";
 const carValue=selectedAssets.vehicle||"preset:0",carRecord=carValue.startsWith("custom:")?customAssets.find(x=>x.id===carValue.slice(7)):null;
 if(carRecord){setPreviewImage($("previewPlayer"),carRecord,"🏎️","contain");}else{const car=window.GAMEZAAR_PLAYER_CARS?.[Number((carValue.split(":")[1]||0))]||window.GAMEZAAR_PLAYER_CARS?.[0];$("previewPlayer").textContent="";$("previewPlayer").style.backgroundImage=car?"url(\""+car.src+"\")":"";$("previewPlayer").style.backgroundRepeat="no-repeat";$("previewPlayer").style.backgroundPosition="center";$("previewPlayer").style.backgroundSize="contain";}
  const summary=[["Car",assetLabel("vehicle")],["Houses",assetLabel("bgBuilding")],["Road",assetLabel("bgRoad")],["Ground",assetLabel("bgLand")],["Trees",assetLabel("bgTree")],["Play",assetLabel("btnPlay")],["Pause",assetLabel("btnPause")]].map(x=>x.join(": ")).join(" · ");
 $("selectedSummary").textContent=summary;
 Object.entries(climateGroupsByType).forEach(([typeId,groups])=>{
  const optionsBox=document.querySelector('[data-climate-options="'+typeId+'"]');
  if(!optionsBox)return;
  const climate=groups.find(group=>group.id===selectedClimateByGroup[typeId])||groups[0];
  const offset=groups.slice(0,groups.indexOf(climate)).reduce((sum,group)=>sum+group.options.length,0);
  optionsBox.innerHTML=climate.options.map((option,index)=>`<button type="button" class="asset-option" data-type="${typeId}" data-option="${offset+index}" aria-pressed="false"><span class="asset-glyph">${option[0]}</span><small>${option[1]}</small></button>`).join("");
 });
 document.querySelectorAll(".tree-climate-tab").forEach(button=>{const active=button.dataset.climate===selectedClimateByGroup[button.dataset.climateGroup];button.classList.toggle("active",active);button.setAttribute("aria-pressed",String(active));});
 document.querySelectorAll(".asset-option").forEach(button=>{const type=typeFor(button.dataset.type);const current=selectedAssets[button.dataset.type]||(type?.multi?[]:"preset:0");const active=type?.multi?current.includes("preset:"+button.dataset.option):current==="preset:"+button.dataset.option;button.classList.toggle("active",active);button.classList.toggle("multi-selected",!!type?.multi&&active);button.setAttribute("aria-pressed",String(active));});
 allImageTypes().forEach(type=>{
  const list=document.querySelector('[data-uploaded-list="'+type.id+'"]');if(!list)return;
  const uploads=getAssets(type.id);
  list.innerHTML=uploads.length?'<div class="uploaded-preview-heading">YOUR UPLOADED IMAGE PREVIEW</div>'+uploads.map(item=>{const url=getObjectUrl(item);return `<div class="uploaded-image-preview"><img src="${url}" alt="Preview of ${escapeHTML(item.name)}"><button type="button" class="uploaded-image-remove" data-remove-asset="${item.id}" aria-label="Delete uploaded image" title="Delete image">×</button><div class="uploaded-image-caption">${escapeHTML(item.name)} · ${bytesLabel(item.size)} · ${item.width} × ${item.height}px</div></div>`;}).join(""):"";
 });
 document.querySelectorAll(".sound-option").forEach(button=>{const current=selectedSounds[button.dataset.soundType]||"preset:0";button.classList.toggle("active",current==="preset:"+button.dataset.soundOption);});
 soundTypes.forEach(type=>{
  const selected=document.querySelector('[data-sound-selected="'+type.id+'"]');if(selected)selected.textContent="Selected: "+soundLabel(type.id);
  const toggle=document.querySelector('[data-sound-toggle="'+type.id+'"]');if(toggle){toggle.checked=soundEnabled[type.id]!==false;toggle.nextElementSibling.textContent=toggle.checked?"ON":"OFF";}
  const list=document.querySelector('[data-sound-file="'+type.id+'"]');if(list)list.innerHTML=getAssets(type.id).map(item=>`<span class="uploaded-chip"><span>♪ ${escapeHTML(item.name)} · ${bytesLabel(item.size)}</span><button type="button" data-play-audio="${item.id}" aria-label="Play uploaded sound">▶</button><button type="button" data-remove-asset="${item.id}" aria-label="Remove sound">×</button></span>`).join("");
 });
 const total=totalBytes();$("assetTotal").innerHTML=bytesLabel(total)+' <small>/ 2 MB</small>';$("budgetFill").style.width=Math.min(100,total/MAX_TOTAL*100)+"%";$("assetBudgetNote").textContent=bytesLabel(MAX_TOTAL-total)+" upload space remaining across images and sounds.";
}
function getObjectUrl(item){let url=objectUrls.get(item.id);if(!url){url=URL.createObjectURL(item.blob);objectUrls.set(item.id,url);}return url;}
function setPreviewImage(element,record,fallback,fit){if(record){element.textContent="";element.style.backgroundImage="url('"+getObjectUrl(record)+"')";element.style.backgroundRepeat="no-repeat";element.style.backgroundPosition="center";element.style.backgroundSize=fit;}else{element.textContent=fallback;element.style.backgroundImage="";}}
function setValues(data){fields.forEach(id=>{if(data[id]!==undefined)$(id).value=data[id];});render();}
fields.forEach(id=>$(id).addEventListener("input",render));
$("orientation").addEventListener("change",()=>{render();setStatus("Orientation changed. Choose background images matching your scene.");});
$("saveGame").addEventListener("click",()=>{
 const data={};fields.forEach(id=>data[id]=$(id).value);data.selectedAssets=selectedAssets;data.garagePrices=garagePrices;data.garageCars=(window.GAMEZAAR_GARAGE_CARS||[]).map((car,i)=>({name:car.name,price:garagePrices[i]??defaultGaragePrices[i],uploadId:(selectedAssets["garageCar"+i]||"").startsWith("custom:")?selectedAssets["garageCar"+i].slice(7):null}));data.selectedSounds=selectedSounds;data.soundEnabled=soundEnabled;data.climateSelections=selectedClimateByGroup;data.assetOptions=Object.fromEntries(allImageTypes().map(type=>[type.id,type.options]));data.savedAt=new Date().toISOString();
 try{localStorage.setItem(settingsKey,JSON.stringify(data));setStatus("Racing game settings saved on this device. Uploaded files remain in this browser.");}catch{setStatus("Browser storage is full. Remove some uploads and try again.");}
});
$("resetGame").addEventListener("click",()=>{
 if(!confirm("Reset racing game settings and remove all uploaded images and sounds from this device?"))return;
 localStorage.removeItem(settingsKey);Promise.all(customAssets.map(item=>dbDelete(item.id))).finally(()=>{objectUrls.forEach(url=>URL.revokeObjectURL(url));objectUrls.clear();customAssets=[];selectedAssets={bgBuilding:"preset:0",trafficCars:["preset:0","preset:1","preset:2","preset:3","preset:4"]};garagePrices=[...defaultGaragePrices];selectedSounds={};soundEnabled={};selectedClimateByGroup={bgTree:"summer",bgRoad:"summer",bgLand:"summer"};setValues(defaults);setStatus("Builder settings and all custom uploads have been reset.");});
});
$("previewPlay").addEventListener("click",()=>setStatus("This is a customization preview. The playable racing engine and APK/AAB export are not connected yet."));
async function init(){
 buildAssetGroups();buildSoundGroups();
 try{customAssets=await dbAll();customAssets.forEach(item=>{if(item.blob&&!objectUrls.has(item.id))objectUrls.set(item.id,URL.createObjectURL(item.blob));});}catch{setStatus("Browser storage is unavailable. You can still select preset designs.");}
 setValues({...defaults,...saved});selectedAssets={bgBuilding:"preset:0",trafficCars:["preset:0","preset:1","preset:2","preset:3","preset:4"],...(saved.selectedAssets||{})};if(typeof selectedAssets.trafficCars==="string")selectedAssets.trafficCars=[selectedAssets.trafficCars];garagePrices=defaultGaragePrices.map((v,i)=>Math.max(0,Math.floor(Number(saved.garagePrices?.[i]??v)||0)));selectedSounds=saved.selectedSounds||{};soundEnabled=saved.soundEnabled||{};selectedClimateByGroup={bgTree:"summer",bgRoad:"summer",bgLand:"summer",...(saved.climateSelections||{}),...(saved.treeClimate?{bgTree:saved.treeClimate}:{})};render();
}
init();

// Floating popup for testing the playable racing template.
const floatingPreviewButton=$("floatingPreviewButton");
const playablePreviewModal=$("playablePreviewModal");
const playablePreviewFrame=$("playablePreviewFrame");
const closePlayablePreview=$("closePlayablePreview");
function openPlayablePreview(){
 playablePreviewModal.classList.add("open");
 playablePreviewModal.setAttribute("aria-hidden","false");
 if(playablePreviewFrame.getAttribute("src")==="about:blank")syncLivePreviewData();playablePreviewFrame.src="./preview.html?game="+encodeURIComponent(params.get("game")||"Car Racing");
 document.body.style.overflow="hidden";
 closePlayablePreview.focus();
}
function closePlayablePreviewModal(){
 playablePreviewModal.classList.remove("open");
 playablePreviewModal.setAttribute("aria-hidden","true");
 playablePreviewFrame.src="about:blank";
 document.body.style.overflow="";
 floatingPreviewButton.focus();
}
floatingPreviewButton.addEventListener("click",openPlayablePreview);
closePlayablePreview.addEventListener("click",closePlayablePreviewModal);
window.addEventListener("message",event=>{if(event.data?.type==="GAMEZAAR_PREVIEW_CLOSE"&&playablePreviewModal.classList.contains("open"))closePlayablePreviewModal();});
playablePreviewModal.addEventListener("click",event=>{if(event.target===playablePreviewModal)closePlayablePreviewModal();});
document.addEventListener("keydown",event=>{if(event.key==="Escape"&&playablePreviewModal.classList.contains("open"))closePlayablePreviewModal();});
