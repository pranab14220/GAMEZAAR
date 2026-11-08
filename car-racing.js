(() => {
"use strict";
const canvas=document.getElementById("game"),ctx=canvas.getContext("2d");
const $=id=>document.getElementById(id);
const W=360,H=600,lanes=[112,180,248];
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
 const x=b.side===0?0:304,y=b.y,w=56,h=b.h;
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
 drawSky();
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
   ctx.fillStyle="#689451";ctx.fillRect(x+4,y+5,5,5);ctx.fillRect(x+11,y+12,4,5);
   ctx.fillStyle="#59696a";ctx.fillRect(x+8,y+37,2,19);ctx.fillRect(x+8,y+37,12,2);
   glowRect(x+17,y+34,4,4,"#ffe1a0",7);
  }
 }
 // asphalt roadway and darker shoulders
 ctx.fillStyle="#26353d";ctx.fillRect(78,0,204,H);
 const asphalt=ctx.createLinearGradient(78,0,282,0);asphalt.addColorStop(0,"#35434a");asphalt.addColorStop(.5,"#465158");asphalt.addColorStop(1,"#35434a");
 ctx.fillStyle=asphalt;ctx.fillRect(82,0,196,H);
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
function drawCar(x,y,color,player=false,tilt=0){
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
 ctx.fillStyle="#648b91";ctx.fillRect(-7,3,14,8);ctx.fillStyle="#182c37";ctx.fillRect(-9,14,18,3);
 // rear glass and trunk
 ctx.fillStyle="#203845";ctx.fillRect(-9,18,18,6);ctx.fillStyle="#527985";ctx.fillRect(-7,19,14,3);
 ctx.fillStyle="#222d34";ctx.fillRect(-11,25,22,3);
 // headlamps, tail lamps and tiny pixel details
 glowRect(-11,-27,6,3,"#fff3bd",9);glowRect(5,-27,6,3,"#fff3bd",9);
 glowRect(-12,24,6,3,"#ff4b52",7);glowRect(6,24,6,3,"#ff4b52",7);
 ctx.fillStyle="#f7d78e";ctx.fillRect(-2,-25,4,2);
 if(player){ctx.fillStyle="#fff0b0";ctx.fillRect(-2,-1,4,3);ctx.fillStyle="#a92f38";ctx.fillRect(-2,16,4,2);}
 ctx.restore();
}
function draw(){
 drawRoad();
 traffic.forEach(v=>drawCar(lanes[v.lane],v.y,v.color,false));
 drawCar(playerX,500,"#df454c",true,playerTilt);
}
function speedForScore(s){return Number((1+Math.floor(s/100)*0.1).toFixed(1));}
function reset(){playerLane=1;playerX=lanes[1];playerTilt=0;traffic=[];score=0;speed=1;spawn=0;crashing=false;$("score").textContent="0000";$("speed").textContent="1.0x";}
function endGame(){
 if(crashing)return;
 running=false;crashing=true;crashStarted=performance.now();explosion={x:playerX,y:500};
 if(score>best){best=score;localStorage.setItem("gamezaar-race-best",best);$("best").textContent=String(best).padStart(4,"0");}
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
  $("overlayTitle").textContent="Race over!";$("overlayText").textContent="You scored "+score+". Try again and beat your best score.";
  $("startBtn").textContent="RACE AGAIN";$("overlay").classList.remove("hidden");
 }
}
function frame(now){
 const dt=Math.min((now-last)/16.67||1,2);last=now;
 world+=(running?1.8+speed*2.65:2.2)*dt;
 if(running){
  // Smoothly steer toward the selected lane and lean the car into the turn.
  const targetX=lanes[playerLane],previousX=playerX;
  playerX+=(targetX-playerX)*Math.min(1,.19*dt);
  const horizontalVelocity=playerX-previousX;
  playerTilt+=(Math.max(-.18,Math.min(.18,horizontalVelocity*.045))-playerTilt)*Math.min(1,.22*dt);
  if(Math.abs(targetX-playerX)<.45){playerX=targetX;playerTilt*=.75;}
  spawn+=dt;
  if(spawn>Math.max(20,64-speed*8)){spawn=0;const lane=Math.floor(Math.random()*3);traffic.push({lane,y:-48,color:trafficColors[Math.floor(Math.random()*trafficColors.length)],passed:false});}
  traffic.forEach(v=>{v.y+=(1.7+speed*2.85)*dt;if(!v.passed&&v.y>535){v.passed=true;score+=10;$("score").textContent=String(score).padStart(4,"0");sound(760,.045,"triangle",.018);}});
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
 reset();running=true;$("overlay").classList.add("hidden");startSound();
}
function move(d){if(running){const next=Math.max(0,Math.min(2,playerLane+d));if(next!==playerLane){playerLane=next;steerSound();}}}
$("startBtn").addEventListener("click",start);
$("leftBtn").addEventListener("pointerdown",e=>{e.preventDefault();move(-1);});
$("rightBtn").addEventListener("pointerdown",e=>{e.preventDefault();move(1);});
let touchX=null;
canvas.addEventListener("touchstart",e=>{touchX=e.changedTouches[0].clientX;},{passive:true});
canvas.addEventListener("touchend",e=>{if(touchX===null)return;const dx=e.changedTouches[0].clientX-touchX;if(Math.abs(dx)>18)move(dx>0?1:-1);touchX=null;},{passive:true});
draw();raf=requestAnimationFrame(frame);
})();