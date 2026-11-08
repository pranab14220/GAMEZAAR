(() => {
"use strict";
const canvas=document.getElementById("game"),ctx=canvas.getContext("2d");
const $=id=>document.getElementById(id);
const W=360,H=600,lanes=[96,180,264];
let playerLane=1,playerX=lanes[1],playerTilt=0,traffic=[],score=0,best=Number(localStorage.getItem("gamezaar-race-best")||0);
let speed=1,running=false,crashing=false,crashStarted=0,last=0,spawn=0,world=0,raf=0,audio=null,explosion={x:180,y:500};
const trafficColors=["#ff754f","#55d9ff","#c58cff","#ffd166","#65e6a8"];
const buildings=[];
for(let side=0;side<2;side++){
 let y=-30;
 while(y<H+80){const h=65+Math.random()*85,w=side?38+Math.random()*23:38+Math.random()*23;
 buildings.push({side,y,h,w,seed:Math.random(),windows:Array.from({length:12},()=>Math.random())});y+=h+8;}
}
$("best").textContent=String(best).padStart(4,"0");
function sound(freq=440,duration=.08,type="sine",volume=.035){
 try{audio=audio||new (window.AudioContext||window.webkitAudioContext)();if(audio.state==="suspended")audio.resume();
 const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.setValueAtTime(freq,audio.currentTime);
 g.gain.setValueAtTime(volume,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);
 o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+duration);
 }catch(e){}
}
function glowRect(x,y,w,h,color,blur=8){ctx.save();ctx.shadowColor=color;ctx.shadowBlur=blur;ctx.fillStyle=color;ctx.fillRect(x,y,w,h);ctx.restore();ctx.fillStyle=color;ctx.fillRect(x,y,w,h);}
function pixelText(text,x,y,size,color){ctx.save();ctx.font="bold "+size+"px monospace";ctx.fillStyle=color;ctx.shadowColor=color;ctx.shadowBlur=7;ctx.fillText(text,x,y);ctx.restore();}
function drawSky(){
 const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,"#07182b");g.addColorStop(.55,"#102c42");g.addColorStop(1,"#14253a");ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 // distant glowing skyline
 for(let i=0;i<22;i++){const x=i*18-5,h=75+(i*37%115);ctx.fillStyle="#10263b";ctx.fillRect(x,90-h*.35,15,h*.55);
  if(i%3===0){glowRect(x+5,110-h*.25,3,5,"#f69a54",5);glowRect(x+10,125-h*.25,2,4,"#53cfff",5);}
 }
}
function drawBuilding(b){
 const x=b.side===0?0:W-b.w,y=b.y;
 ctx.fillStyle="#101e31";ctx.fillRect(x,y,b.w,b.h);
 ctx.fillStyle="#20334a";ctx.fillRect(x+3,y+4,b.w-6,5);
 ctx.fillStyle="#091728";ctx.fillRect(x+4,y+13,b.w-8,b.h-18);
 for(let row=0;row<4;row++)for(let col=0;col<3;col++){
  const lit=b.windows[(row*3+col)]>.24;
  if(lit){const c=(row+col)%3===0?"#ffad58":(row+col)%3===1?"#48d9e9":"#f66c83";
   glowRect(x+7+col*9,y+22+row*18,5,9,c,5);}
 }
 ctx.fillStyle="#31465b";ctx.fillRect(x,y+b.h-7,b.w,7);
 if(b.seed>.45){glowRect(x+5,y+b.h-27,b.w-10,12,b.seed>.7?"#ff8b4b":"#31cbd1",7);}
}
function drawRoad(){
 drawSky();
 // city blocks slide continuously behind the road
 buildings.forEach(b=>{const yy=((b.y+world*.8)%(H+190))-90;drawBuilding({...b,y:yy});});
 // sidewalks and curb lights
 ctx.fillStyle="#172c37";ctx.fillRect(42,0,276,H);
 for(let y=-30+(world%54);y<H;y+=54){
  glowRect(30,y,8,20,"#ff9b54",7);glowRect(322,y+20,7,17,"#48d9e9",7);
 }
 // road with subtle blue neon edges
 const road=ctx.createLinearGradient(48,0,312,0);road.addColorStop(0,"#202a3c");road.addColorStop(.5,"#30394b");road.addColorStop(1,"#202a3c");
 ctx.fillStyle=road;ctx.fillRect(48,0,264,H);
 glowRect(47,0,3,H,"#f6b75c",8);glowRect(310,0,3,H,"#f6b75c",8);
 // lane markers scroll even before Start Race
 for(let y=-54+(world%76);y<H;y+=76){
  glowRect(135,y,5,36,"#9ba9c6",5);glowRect(220,y,5,36,"#9ba9c6",5);
 }
 // small road reflections
 for(let i=0;i<8;i++){const y=(i*91+world*1.5)%(H);ctx.fillStyle="rgba(69,190,220,.12)";ctx.fillRect(62,y,3,17);}
}
function drawCar(x,y,color,player=false){
 ctx.save();
 ctx.shadowColor=color;ctx.shadowBlur=player?16:9;
 ctx.fillStyle="#080f1c";ctx.fillRect(x-20,y-27,40,58);
 ctx.fillStyle=color;ctx.fillRect(x-16,y-25,32,52);
 ctx.fillStyle="#162f47";ctx.fillRect(x-12,y-17,24,14);
 ctx.fillStyle="#8deaff";ctx.fillRect(x-10,y-15,20,9);
 ctx.fillStyle="#19283d";ctx.fillRect(x-12,y+3,24,12);
 ctx.fillStyle="#070d18";ctx.fillRect(x-20,y-17,5,14);ctx.fillRect(x+15,y-17,5,14);ctx.fillRect(x-20,y+12,5,14);ctx.fillRect(x+15,y+12,5,14);
 ctx.restore();
 glowRect(x-12,y-25,7,3,"#fff0a0",5);glowRect(x+5,y-25,7,3,"#fff0a0",5);
 if(player){glowRect(x-12,y+22,8,3,"#ff4c6a",6);glowRect(x+4,y+22,8,3,"#ff4c6a",6);}
}
function draw(){
 drawRoad();
 traffic.forEach(v=>drawCar(lanes[v.lane],v.y,v.color));
 drawCar(playerX,500,"#ff9851",true,playerTilt);
}
function speedForScore(s){return Number((1+Math.floor(s/200)*0.1).toFixed(1));}
function reset(){playerLane=1;playerX=lanes[1];playerTilt=0;traffic=[];score=0;speed=1;spawn=0;crashing=false;$("score").textContent="0000";$("speed").textContent="1.0x";}
function endGame(){
 if(crashing)return;
 running=false;crashing=true;crashStarted=performance.now();explosion={x:playerX,y:500};
 if(score>best){best=score;localStorage.setItem("gamezaar-race-best",best);$("best").textContent=String(best).padStart(4,"0");}
 sound(105,.42,"sawtooth",.075);sound(62,.5,"triangle",.055);
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
  $("overlayTitle").textContent="Race over!";$("overlayText").textContent="You scored "+score+". Try again and beat your best score.";
  $("startBtn").textContent="RACE AGAIN";$("overlay").classList.remove("hidden");
 }
}
function frame(now){
 const dt=Math.min((now-last)/16.67||1,2);last=now;
 world+=(running?3.1+speed*.8:2.2)*dt;
 if(running){
  // Smoothly steer toward the selected lane and lean the car into the turn.
  const targetX=lanes[playerLane],previousX=playerX;
  playerX+=(targetX-playerX)*Math.min(1,.19*dt);
  const horizontalVelocity=playerX-previousX;
  playerTilt+=(Math.max(-.18,Math.min(.18,horizontalVelocity*.045))-playerTilt)*Math.min(1,.22*dt);
  if(Math.abs(targetX-playerX)<.45){playerX=targetX;playerTilt*=.75;}
  spawn+=dt;
  if(spawn>Math.max(24,68-speed*8)){spawn=0;const lane=Math.floor(Math.random()*3);traffic.push({lane,y:-48,color:trafficColors[Math.floor(Math.random()*trafficColors.length)],passed:false});}
  traffic.forEach(v=>{v.y+=(3.2+speed*1.35)*dt;if(!v.passed&&v.y>535){v.passed=true;score+=10;$("score").textContent=String(score).padStart(4,"0");sound(760,.045,"triangle",.018);}});
  traffic=traffic.filter(v=>v.y<660);
  speed=speedForScore(score);$("speed").textContent=speed.toFixed(1)+"x";
  for(const v of traffic){
   // Check actual horizontal overlap while the player's car is changing lanes.
   if(Math.abs(lanes[v.lane]-playerX)<27 && Math.abs(v.y-500)<43){endGame();break;}
  }
 }
 draw();
 if(crashing)drawExplosion(now);
 raf=requestAnimationFrame(frame);
}
function start(){
 reset();running=true;$("overlay").classList.add("hidden");sound(520,.1,"square",.035);setTimeout(()=>sound(780,.12,"square",.025),90);
}
function move(d){if(running){playerLane=Math.max(0,Math.min(2,playerLane+d));sound(300,.035,"triangle",.012);}}
$("startBtn").addEventListener("click",start);
$("leftBtn").addEventListener("pointerdown",e=>{e.preventDefault();move(-1);});
$("rightBtn").addEventListener("pointerdown",e=>{e.preventDefault();move(1);});
let touchX=null;
canvas.addEventListener("touchstart",e=>{touchX=e.changedTouches[0].clientX;},{passive:true});
canvas.addEventListener("touchend",e=>{if(touchX===null)return;const dx=e.changedTouches[0].clientX-touchX;if(Math.abs(dx)>18)move(dx>0?1:-1);touchX=null;},{passive:true});
draw();raf=requestAnimationFrame(frame);
})();