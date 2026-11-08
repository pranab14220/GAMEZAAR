(() => {
const canvas=document.getElementById("game"),ctx=canvas.getContext("2d");
const $=id=>document.getElementById(id);
const W=360,H=600, lanes=[92,180,268];
let playerLane=1, traffic=[], score=0, best=Number(localStorage.getItem("gamezaar-race-best")||0), speed=1, running=false, last=0, spawn=0, raf=0;
$("best").textContent=String(best).padStart(4,"0");
const colors=["#ff9b54","#70d6ff","#c792ea","#f4d35e"];
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
function car(x,y,color,isPlayer=false){
 rect(x-19,y-28,38,58,"#101729");rect(x-16,y-25,32,52,color);
 rect(x-12,y-18,24,13,"#b9e5ef");rect(x-12,y+4,24,12,"#27354b");
 rect(x-20,y-17,5,13,"#20263a");rect(x+15,y-17,5,13,"#20263a");
 rect(x-20,y+15,5,13,"#20263a");rect(x+15,y+15,5,13,"#20263a");
 rect(x-13,y-25,7,4,"#fff1a6");rect(x+6,y-25,7,4,"#fff1a6");
 if(isPlayer){rect(x-10,y+19,20,3,"#ffe08a");}
}
function drawRoad(t=0){
 rect(0,0,W,H,"#244b3b");for(let y=0;y<H;y+=48){rect(15,y+(t%48),5,20,"#39704b");rect(340,y+(t%48),5,20,"#39704b");}
 rect(48,0,264,H,"#343a4a");rect(55,0,250,H,"#3c4354");
 rect(48,0,5,H,"#f3d77b");rect(307,0,5,H,"#f3d77b");
 for(let y=-40+(t%70);y<H;y+=70){rect(135,y,5,34,"#d9dce2");rect(220,y,5,34,"#d9dce2");}
}
function draw(t=0){drawRoad(t);traffic.forEach(v=>car(lanes[v.lane],v.y,v.color));car(lanes[playerLane],500,"#ff9b54",true);
 // pixel scenery
 rect(5,35,20,8,"#6c9b63");rect(330,100,18,8,"#6c9b63");
}
function reset(){playerLane=1;traffic=[];score=0;speed=1;spawn=0;last=0;$("score").textContent="0000";$("speed").textContent="1x";}
function endGame(){running=false;cancelAnimationFrame(raf);if(score>best){best=score;localStorage.setItem("gamezaar-race-best",best);$("best").textContent=String(best).padStart(4,"0");}
 $("overlayTitle").textContent="Race over!";$("overlayText").textContent="You scored "+score+". Try again and beat your best score."; $("startBtn").textContent="RACE AGAIN";$("overlay").classList.remove("hidden");}
function loop(now){if(!running)return;const dt=Math.min((now-last)/16.67||1,2);last=now;spawn+=dt;
 if(spawn>Math.max(25,68-speed*5)){spawn=0;const lane=Math.floor(Math.random()*3);traffic.push({lane,y:-45,color:colors[Math.floor(Math.random()*colors.length)],passed:false});}
 const roadOffset=(now/18)%70;traffic.forEach(v=>{v.y+=(3.3+speed*.65)*dt;if(!v.passed&&v.y>530){v.passed=true;score+=10;$("score").textContent=String(score).padStart(4,"0");}});
 traffic=traffic.filter(v=>v.y<660);
 for(const v of traffic){if(v.lane===playerLane&&v.y+24>474&&v.y-24<556){draw(roadOffset);endGame();return;}}
 speed=Math.min(8,1+Math.floor(score/80)*.35);$("speed").textContent=speed.toFixed(1)+"x";draw(roadOffset);raf=requestAnimationFrame(loop);}
function start(){reset();running=true;$("overlay").classList.add("hidden");raf=requestAnimationFrame(loop);}
function move(d){if(running)playerLane=Math.max(0,Math.min(2,playerLane+d));}
$("startBtn").addEventListener("click",start);$("leftBtn").addEventListener("pointerdown",e=>{e.preventDefault();move(-1);});$("rightBtn").addEventListener("pointerdown",e=>{e.preventDefault();move(1);});
let touchX=null;canvas.addEventListener("touchstart",e=>{touchX=e.changedTouches[0].clientX;},{passive:true});canvas.addEventListener("touchend",e=>{if(touchX===null)return;const dx=e.changedTouches[0].clientX-touchX;if(Math.abs(dx)>18)move(dx>0?1:-1);touchX=null;},{passive:true});
draw(0);
})();