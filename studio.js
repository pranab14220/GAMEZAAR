const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const selectedGame = params.get("game") || "My Awesome Game";
const fields = ["gameTitle","gameSubtitle","difficulty","orientation","accentColor","sceneColor","soundToggle"];
const defaults = {gameTitle:selectedGame,gameSubtitle:"A new adventure begins",difficulty:"Normal",orientation:"portrait",accentColor:"#ff9b54",sceneColor:"#394563",soundToggle:true};
const storageKey = "gamezaar-studio-v1";
let saved = {};
try { saved = JSON.parse(localStorage.getItem(storageKey) || "{}"); } catch {}
function setValues(data){fields.forEach(id=>{if(data[id]!==undefined){if($(id).type==="checkbox")$(id).checked=!!data[id];else $(id).value=data[id];}});render();}
function render(){
 const title=$("gameTitle").value.trim()||"My Awesome Game";
 const subtitle=$("gameSubtitle").value.trim()||"A new adventure begins";
 $("previewTitle").textContent=title;$("previewSubtitle").textContent=subtitle;
 $("pixelScene").style.background=$("sceneColor").value;
 $("previewPlay").style.background=$("accentColor").value;
 $("accentValue").textContent=$("accentColor").value.toUpperCase();
 $("sceneValue").textContent=$("sceneColor").value.toUpperCase();
 $("gameDevice").style.aspectRatio=$("orientation").value==="landscape"?"1.25 / 1":"auto";
}
fields.forEach(id=>$(id).addEventListener("input",render));
$("saveGame").addEventListener("click",()=>{
 const data={};fields.forEach(id=>data[id]=$(id).type==="checkbox"?$(id).checked:$(id).value);
 localStorage.setItem(storageKey,JSON.stringify(data));
 $("saveStatus").textContent="Saved on this device. Your settings will be here when you return.";
});
$("resetGame").addEventListener("click",()=>{localStorage.removeItem(storageKey);setValues(defaults);$("saveStatus").textContent="Settings reset to the starter theme.";});
$("previewPlay").addEventListener("click",()=>{$("saveStatus").textContent="Playable game preview is coming next. Your customization controls are working.";});
setValues({...defaults,...saved});
