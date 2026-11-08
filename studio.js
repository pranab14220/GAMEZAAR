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
 {id:"vehicle",title:"Player Car",desc:"Choose the car controlled by the player",limit:"150 KB · 256 × 256 px max",maxKB:150,maxW:256,maxH:256,count:5,options:[["🏎️","Street Racer"],["🚗","Sport Coupe"],["🚙","Rally SUV"],["🏁","Formula"],["🚘","Supercar"]]},
 {id:"enemy",title:"Traffic & Obstacles",desc:"Cars, barriers and hazards on the road",limit:"100 KB · 128 × 128 px max",maxKB:100,maxW:128,maxH:128,count:5,options:[["🚕","Taxi"],["🚚","Truck"],["🚧","Barrier"],["🛻","Pickup"],["🚓","Police Car"]]},
 {id:"coin",title:"Coins & Collectibles",desc:"Objects the player can collect on the road",limit:"50 KB · 64 × 64 px max",maxKB:50,maxW:64,maxH:64,count:5,options:[["🪙","Gold Coin"],["💎","Gem"],["⭐","Star"],["💰","Bonus"],["🏅","Medal"]]},
 {id:"logo",title:"Game Logo",desc:"Artwork for your racing game's title",limit:"100 KB · 256 × 256 px max",maxKB:100,maxW:256,maxH:256,count:5,options:[["🏆","Champion"],["⚡","Turbo"],["🔥","Blaze"],["🏎️","Racer"],["🌟","Legend"]]}
];
const backgroundTypes = [
 {id:"bgTree",title:"Trees",desc:"Roadside trees and plants",limit:"100 KB · 128 × 128 px max",maxKB:100,maxW:128,maxH:128,count:5,options:[["🌲","Pine"],["🌳","Oak"],["🌴","Palm"],["🌵","Cactus"],["🍁","Autumn"]]},
 {id:"bgRoad",title:"Road",desc:"The road surface and lane markings",limit:"500 KB · 1280 × 720 px max",maxKB:500,maxW:1280,maxH:720,count:5,options:[["🛣️","Highway"],["🌆","City Road"],["🏁","Race Track"],["🌧️","Wet Road"],["🌙","Night Road"]]},
 {id:"bgLand",title:"Land / Ground",desc:"Grass, sand, snow and roadside ground",limit:"300 KB · 1280 × 720 px max",maxKB:300,maxW:1280,maxH:720,count:5,options:[["🌱","Green Grass"],["🏜️","Desert"],["❄️","Snow"],["🟫","Dirt"],["🌾","Countryside"]]},
 {id:"bgSky",title:"Sky",desc:"Sky and weather appearance",limit:"300 KB · 1280 × 720 px max",maxKB:300,maxW:1280,maxH:720,count:5,options:[["☀️","Sunny"],["🌤️","Cloudy"],["🌇","Sunset"],["🌌","Starry"],["🌧️","Rainy"]]},
 {id:"bgBuilding",title:"Buildings",desc:"City buildings and roadside structures",limit:"200 KB · 256 × 256 px max",maxKB:200,maxW:256,maxH:256,count:5,options:[["🏙️","Skyscrapers"],["🏢","Offices"],["🏘️","Houses"],["🏭","Factories"],["🏬","Shops"]]},
 {id:"bgDecor",title:"Roadside Details",desc:"Lights, signs, fences and other scenery",limit:"100 KB · 128 × 128 px max",maxKB:100,maxW:128,maxH:128,count:5,options:[["💡","Street Lights"],["🚦","Signals"],["🪧","Road Signs"],["🧱","Fence"],["⛰️","Hills"]]}
];
const buttonTypes = [
 {id:"btnPlay",title:"Play Button",desc:"Main start/play control",limit:"30 KB · 128 × 64 px max",maxKB:30,maxW:128,maxH:64,count:5,options:[["▶️","Classic"],["🟠","Round"],["🟩","Pixel"],["⚡","Neon"],["🏁","Racing"]]},
 {id:"btnPause",title:"Pause Button",desc:"Pause the race",limit:"30 KB · 64 × 64 px max",maxKB:30,maxW:64,maxH:64,count:5,options:[["⏸️","Classic"],["Ⅱ","Slim"],["🟧","Round"],["▥","Pixel"],["⏯️","Modern"]]},
 {id:"btnResume",title:"Resume Button",desc:"Continue a paused race",limit:"30 KB · 128 × 64 px max",maxKB:30,maxW:128,maxH:64,count:5,options:[["▶️","Classic"],["⏵","Modern"],["🟢","Round"],["⚡","Neon"],["🏎️","Turbo"]]},
 {id:"btnRestart",title:"Restart Button",desc:"Restart the current race",limit:"30 KB · 64 × 64 px max",maxKB:30,maxW:64,maxH:64,count:5,options:[["🔄","Classic"],["↻","Minimal"],["🟠","Round"],["⟲","Pixel"],["⚡","Neon"]]},
 {id:"btnHome",title:"Home Button",desc:"Return to the game home screen",limit:"30 KB · 64 × 64 px max",maxKB:30,maxW:64,maxH:64,count:5,options:[["🏠","Classic"],["⌂","Minimal"],["🏡","Cute"],["🟠","Round"],["🏁","Racing"]]},
 {id:"btnSettings",title:"Settings Button",desc:"Open game settings",limit:"30 KB · 64 × 64 px max",maxKB:30,maxW:64,maxH:64,count:5,options:[["⚙️","Classic"],["🔧","Tools"],["☷","Minimal"],["🟠","Round"],["🎛️","Control"]]}
];
const soundTypes = [
 {id:"soundButton",title:"Button Sounds",desc:"Tap, play, pause and menu button feedback",options:["Soft Click","Arcade Pop","Retro Beep","Digital Tap","Classic UI"]},
 {id:"soundCollision",title:"Collision / Crash",desc:"Impact and crash sound effect",options:["Crash Hit","Metal Impact","Arcade Explosion","Heavy Smash","Retro Blast"]},
 {id:"soundCoin",title:"Coin Collection",desc:"Play when a coin or reward is collected",options:["Coin Chime","Cash Ring","Bright Sparkle","Retro Pickup","Gem Collect"]},
 {id:"soundMusic",title:"Background Music",desc:"Looping music during the race",options:["Energetic Race","Retro Racing","Synth Drive","Chill Highway","Epic Chase"]},
];
let saved = {};
try { saved = JSON.parse(localStorage.getItem(settingsKey) || "{}"); } catch {}
let selectedAssets = saved.selectedAssets || {};
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
function allImageTypes(){return [...imageTypes,...backgroundTypes,...buttonTypes];}
function typeFor(id){return allImageTypes().find(x=>x.id===id);}
function getAssets(id){return customAssets.filter(x=>x.type===id);}
function totalBytes(){return customAssets.reduce((sum,x)=>sum+x.size,0);}
function setStatus(message){$("saveStatus").textContent=message;}
function escapeHTML(value){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function groupMarkup(type){
 return `<section class="asset-group" data-asset-group="${type.id}">
  <button type="button" class="asset-group-toggle" aria-expanded="false"><span><b>${type.title}</b><small>${type.desc}</small></span><span class="asset-chevron">＋</span></button>
  <div class="asset-group-panel" hidden>
   <div class="asset-group-meta"><span>${type.limit}</span><span>5 styles + your upload</span></div>
   <div class="asset-options">${type.options.map((option,index)=>`<button type="button" class="asset-option" data-type="${type.id}" data-option="${index}" aria-pressed="false"><span class="asset-glyph">${option[0]}</span><small>${option[1]}</small></button>`).join("")}</div>
   <div class="asset-upload-row"><label class="asset-upload-button">＋ Upload your own<input type="file" accept="image/png,image/jpeg,image/webp" data-upload="${type.id}" multiple></label><span class="asset-upload-note">Up to 5 uploads · ${type.maxKB} KB each</span></div>
   <div class="uploaded-list" data-uploaded-list="${type.id}"></div>
  </div>
 </section>`;
}
function buildAssetGroups(){
 $("assetGroups").innerHTML=imageTypes.map(groupMarkup).join("");
 $("backgroundGroups").innerHTML=backgroundTypes.map(groupMarkup).join("");
 $("buttonGroups").innerHTML=buttonTypes.map(groupMarkup).join("");
 document.querySelectorAll(".asset-groups").forEach(root=>{
  root.addEventListener("click",event=>{
   const toggle=event.target.closest(".asset-group-toggle");
   if(toggle){const panel=toggle.parentElement.querySelector(".asset-group-panel"),open=panel.hidden;panel.hidden=!open;toggle.setAttribute("aria-expanded",String(open));toggle.querySelector(".asset-chevron").textContent=open?"−":"＋";return;}
   const option=event.target.closest(".asset-option");
   if(option){selectedAssets[option.dataset.type]="preset:"+option.dataset.option;render();return;}
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
 const type=typeFor(typeId);let added=0;
 for(const file of files){
  if(!["image/png","image/jpeg","image/webp"].includes(file.type)){setStatus("Use PNG, JPG or WebP images only.");continue;}
  if(file.size>type.maxKB*1024){setStatus(file.name+" is too large. Maximum is "+type.maxKB+" KB.");continue;}
  if(getAssets(typeId).length>=5){setStatus("You can save up to 5 custom uploads for "+type.title+".");break;}
  if(totalBytes()+file.size>MAX_TOTAL){setStatus("Custom asset limit reached. One game can use up to 2 MB of uploaded assets.");break;}
  const dimensions=await readDimensions(file);if(!dimensions){setStatus("Could not read "+file.name+".");continue;}
  let valid=dimensions.width<=type.maxW&&dimensions.height<=type.maxH;
  if(typeId==="bgRoad"||typeId==="bgLand"||typeId==="bgSky"){valid=dimensions.width<=1280&&dimensions.height<=720;}
  if(!valid){setStatus(file.name+" exceeds the recommended dimensions for "+type.title+".");continue;}
  const id=typeId+"-"+Date.now()+"-"+Math.random().toString(36).slice(2,7),record={id,type:typeId,kind:"image",name:file.name,size:file.size,width:dimensions.width,height:dimensions.height,blob:file};
  try{await dbPut(record);customAssets.push(record);selectedAssets[typeId]="custom:"+id;added++;}catch{setStatus("Could not save this image in browser storage.");}
 }
 input.value="";render();if(added)setStatus(added+" custom image(s) added for "+type.title+".");
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
 const item=customAssets.find(x=>x.id===id);if(!item)return;try{await dbDelete(id);}catch{}
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
function render(){
 const title=$("gameTitle").value.trim()||"My Awesome Game",subtitle=$("gameSubtitle").value.trim()||"A new adventure begins";
 $("previewTitle").textContent=title;$("previewSubtitle").textContent=subtitle;$("pixelScene").style.background=$("sceneColor").value;$("previewPlay").style.background=$("accentColor").value;
 $("accentValue").textContent=$("accentColor").value.toUpperCase();$("sceneValue").textContent=$("sceneColor").value.toUpperCase();
 $("gameDevice").classList.toggle("landscape-device",$("orientation").value==="landscape");
 $("pixelScene").style.aspectRatio=$("orientation").value==="landscape"?"16 / 9":"9 / 16";$("pixelScene").style.height=$("orientation").value==="landscape"?"190px":"320px";
 const carValue=selectedAssets.vehicle||"preset:0",carRecord=carValue.startsWith("custom:")?customAssets.find(x=>x.id===carValue.slice(7)):null;
 setPreviewImage($("previewPlayer"),carRecord,"🏎️","contain");
 const bgRecordValue=selectedAssets.bgSky||"preset:0",bgRecord=bgRecordValue.startsWith("custom:")?customAssets.find(x=>x.id===bgRecordValue.slice(7)):null;
 if(bgRecord){const url=getObjectUrl(bgRecord);$("pixelScene").style.backgroundImage="url('"+url+"')";$("pixelScene").style.backgroundSize="cover";}else{$("pixelScene").style.backgroundImage="";}
 const summary=[["Car",assetLabel("vehicle")],["Road",assetLabel("bgRoad")],["Land",assetLabel("bgLand")],["Sky",assetLabel("bgSky")],["Tree",assetLabel("bgTree")],["Play",assetLabel("btnPlay")],["Pause",assetLabel("btnPause")]].map(x=>x.join(": ")).join(" · ");
 $("selectedSummary").textContent=summary;
 document.querySelectorAll(".asset-option").forEach(button=>{const current=selectedAssets[button.dataset.type]||"preset:0",active=current==="preset:"+button.dataset.option;button.classList.toggle("active",active);button.setAttribute("aria-pressed",String(active));});
 allImageTypes().forEach(type=>{
  const list=document.querySelector('[data-uploaded-list="'+type.id+'"]');if(!list)return;
  list.innerHTML=getAssets(type.id).map(item=>{const url=getObjectUrl(item);return `<span class="uploaded-chip"><img src="${url}" alt=""><span>${escapeHTML(item.name)} · ${bytesLabel(item.size)}</span><button type="button" data-remove-asset="${item.id}" aria-label="Remove upload">×</button></span>`;}).join("");
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
 const data={};fields.forEach(id=>data[id]=$(id).value);data.selectedAssets=selectedAssets;data.selectedSounds=selectedSounds;data.soundEnabled=soundEnabled;data.savedAt=new Date().toISOString();
 try{localStorage.setItem(settingsKey,JSON.stringify(data));setStatus("Racing game settings saved on this device. Uploaded files remain in this browser.");}catch{setStatus("Browser storage is full. Remove some uploads and try again.");}
});
$("resetGame").addEventListener("click",()=>{
 if(!confirm("Reset racing game settings and remove all uploaded images and sounds from this device?"))return;
 localStorage.removeItem(settingsKey);Promise.all(customAssets.map(item=>dbDelete(item.id))).finally(()=>{objectUrls.forEach(url=>URL.revokeObjectURL(url));objectUrls.clear();customAssets=[];selectedAssets={};selectedSounds={};soundEnabled={};setValues(defaults);setStatus("Builder settings and all custom uploads have been reset.");});
});
$("previewPlay").addEventListener("click",()=>setStatus("This is a customization preview. The playable racing engine and APK/AAB export are not connected yet."));
async function init(){
 buildAssetGroups();buildSoundGroups();
 try{customAssets=await dbAll();customAssets.forEach(item=>{if(item.blob&&!objectUrls.has(item.id))objectUrls.set(item.id,URL.createObjectURL(item.blob));});}catch{setStatus("Browser storage is unavailable. You can still select preset designs.");}
 setValues({...defaults,...saved});selectedAssets=saved.selectedAssets||{};selectedSounds=saved.selectedSounds||{};soundEnabled=saved.soundEnabled||{};render();
}
init();