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
 const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,"#334b42");g.addColorStop(1,"#192f32");ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 // leafy green city verges, with pixel clusters
 for(let i=0;i<42;i++){const x=(i*47+13)%W,y=(i*83+world*.45)%(H+30)-15;
  ctx.fillStyle=i%2?"#263f37":"#40543e";ctx.fillRect(x,y,10,7);ctx.fillRect(x-4,y+4,7,7);ctx.fillRect(x+5,y+5,8,6);
  if(i%3===0){ctx.fillStyle="#78814c";ctx.fillRect(x+2,y+2,2,2);}
 }
}
function drawBuilding(b){
 const x=b.side===0?0:W-b.w,y=b.y;
 ctx.fillStyle="#596b67";ctx.fillRect(x,y,b.w,b.h);
 ctx.fillStyle="#9b9a7b";ctx.fillRect(x+3,y+4,b.w-6,7);
 ctx.fillStyle="#384e52";ctx.fillRect(x+5,y+15,b.w-10,b.h-20);
 for(let row=0;row<4;row++)for(let col=0;col<3;col++){
  const wx=x+8+col*10,wy=y+23+row*18;
  ctx.fillStyle=(row+col+b.seed*10)%3<1?"#d8b47c":"#263c49";ctx.fillRect(wx,wy,6,10);
  ctx.fillStyle="#81918a";ctx.fillRect(wx+2,wy,1,10);
 }
 ctx.fillStyle="#c1ae85";ctx.fillRect(x,y+b.h-8,b.w,8);
 // sidewalk planters and little trees
 if(b.seed>.32){const tx=x+(b.side===0?b.w-15:5),ty=y+b.h-34;
  ctx.fillStyle="#815d48";ctx.fillRect(tx+4,ty+15,9,10);
  ctx.fillStyle="#315f43";ctx.fillRect(tx,ty+3,17,15);ctx.fillStyle="#67964e";ctx.fillRect(tx+4,ty,9,8);
 }
}
function drawRoad(){
 drawSky();
 buildings.forEach(b=>{const yy=((b.y+world*.72)%(H+190))-90;drawBuilding({...b,y:yy});});
 // tiled sidewalks and curb
 ctx.fillStyle="#8b9b8d";ctx.fillRect(38,0,284,H);
 for(let y=-20+(world%34);y<H;y+=34){ctx.fillStyle="#aab2a0";ctx.fillRect(39,y,282,1);ctx.fillStyle="#687e7c";ctx.fillRect(42,y+13,276,1);}
 // road with asphalt texture
 ctx.fillStyle="#34454b";ctx.fillRect(75,0,210,H);
 ctx.fillStyle="#3e5052";ctx.fillRect(81,0,198,H);
 for(let i=0;i<65;i++){const x=82+(i*37%194),y=(i*59+world*1.15)%(H);ctx.fillStyle=i%2?"rgba(20,35,43,.16)":"rgba(170,178,150,.10)";ctx.fillRect(x,y,2,3);}
 // yellow road edge lines and white dashed center
 ctx.fillStyle="#e8bb46";ctx.fillRect(76,0,3,H);ctx.fillRect(281,0,3,H);
 for(let y=-54+(world%78);y<H;y+=78){ctx.fillStyle="#e8e6d7";ctx.fillRect(177,y,6,38);}
 // road shoulder blocks inspired by the reference track
 for(let y=-24+(world%44);y<H;y+=44){ctx.fillStyle="#e8dfc5";ctx.fillRect(70,y,5,22);ctx.fillStyle="#d58b3e";ctx.fillRect(70,y+22,5,22);ctx.fillStyle="#e8dfc5";ctx.fillRect(285,y,5,22);ctx.fillStyle="#d58b3e";ctx.fillRect(285,y+22,5,22);}
}
function drawCar(x,y,color,player=false,tilt=0){
 ctx.save();ctx.translate(x,y);ctx.rotate(tilt);
 // shadow and wheels
 ctx.fillStyle="rgba(4,12,18,.55)";ctx.fillRect(-17,-23,38,52);
 ctx.fillStyle="#101820";ctx.fillRect(-19,-19,6,14);ctx.fillRect(13,-19,6,14);ctx.fillRect(-19,8,6,14);ctx.fillRect(13,8,6,14);
 // detailed body silhouette
 ctx.fillStyle="#17232c";ctx.fillRect(-15,-28,30,57);ctx.fillRect(-18,-20,36,39);
 ctx.fillStyle=color;ctx.fillRect(-13,-27,26,53);ctx.fillRect(-16,-17,32,35);
 ctx.fillStyle=player?"#ffd18b":"#d6d9d2";ctx.fillRect(-10,-24,20,5);
 // windscreen and rear glass
 ctx.fillStyle="#243f50";ctx.fillRect(-10,-16,20,13);ctx.fillStyle="#80c8d1";ctx.fillRect(-8,-14,16,8);
 ctx.fillStyle="#203745";ctx.fillRect(-10,5,20,10);ctx.fillStyle="#5d8590";ctx.fillRect(-8,7,16,6);
 // roof stripe / hood details
 ctx.fillStyle=player?"#ffe1a0":"rgba(255,255,255,.55)";ctx.fillRect(-2,-25,4,7);ctx.fillRect(-2,16,4,6);
 ctx.fillStyle="#111c24";ctx.fillRect(-12,-1,24,4);
 ctx.restore();
 // glowing lamps are drawn after body for pixel shine
 glowRect(x-10,y-27,6,3,"#fff2b0",6);glowRect(x+4,y-27,6,3,"#fff2b0",6);
 if(player){glowRect(x-11,y+24,7,3,"#ff4d59",8);glowRect(x+4,y+24,7,3,"#ff4d59",8);}
}
function draw(){
 drawRoad();
 traffic.forEach(v=>drawCar(lanes[v.lane],v.y,v.color,false));
 drawCar(playerX,500,"#df454c",true,playerTilt);
}
function speedForScore(s){return Number((1+Math.floor(s/200)*0.1).toFixed(1));}
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