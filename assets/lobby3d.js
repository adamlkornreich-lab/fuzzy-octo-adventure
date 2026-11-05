/* The Wreck: the 3D front door of Pirates of Ybor.
   © 2026 Adam Kornreich / R.A. Consulting ❤ Pops & Pippy */
(function(){
var stage=document.getElementById('stage3d'),cv=document.getElementById('wreck3d');if(!stage||!cv||!window.P3D)return;
var E;try{E=P3D.create(cv,{shore:17,fog:.000008})}catch(e){E=null}
if(!E){document.documentElement.classList.add('no3d');return}
document.documentElement.classList.add('has3d');
var M=P3D.M,rnd=P3D.rnd,gl=E.gl,b=new P3D.Builder();
/* beach */
var N=90,sz=150,H=function(x,z){var d=z+6;var s=(d-8)*.11+.25*Math.sin(x*.13)+.14*Math.sin(x*.41+z*.3)+.05*Math.sin(x*1.3+z*1.7);s=z>-9?Math.max(s,-1.2+(z+9)*.34):-1.6;return Math.min(s,2.1+.25*Math.sin(x*.2+z*.15))};
for(var i=0;i<N;i++)for(var j=0;j<N;j++){var X=function(k){return(k/N-.5)*sz},Z=function(k){return k/N*72-14},x0=X(i),x1=X(i+1),z0=Z(j),z1=Z(j+1),n=.95+.07*rnd(i*3.1+j*7.7),wet=(z0<19?.72:1),c=[.72*n*wet,.57*n*wet,.39*n*wet];
 b.quad([x0,H(x0,z0),z0],[x0,H(x0,z1),z1],[x1,H(x1,z1),z1],[x1,H(x1,z0),z0],c)}
var bow=M.trs([-11,.1,4],.13,-.075),stern=M.trs([11.4,.15,3.5],-.16,.06),dark=[.07,.04,.025],mast=[.24,.14,.07],sail=[.82,.75,.6],glow=[1,.73,.34,0];
/* bow half */
b.m=bow;
b.hull({x0:-12,x1:9,st:22,ring:14,w:function(t){return 5*Math.pow(Math.sin(Math.min(t*1.8+.02,Math.PI/2)),.72)},h:function(t){return 6.5+2.4*Math.pow(1-t,3)-.5*t},keel:function(t){return .3+2.6*Math.pow(1-t,5)},brk:1});
b.cyl([-12,7.6,0],[-19,11,0],.28,.1,mast,8);b.cyl([-1,5,0],[-1.8,18,.3],.42,.22,mast,10);b.box([-1.8,15.5,.2],[.3,.3,10],mast);
b.cyl([-1.8,18,.3],[-1.4,19.4,.9],.22,.04,mast,6);
var o=b.m;b.m=M.mul(o,M.trs([-1.8,0,.4],0));b.sail([0,15.3,0],9.5,7.5,sail,1.1,14,10);b.m=o;
[[-6.5,7.3],[-3.2,6.95],[.2,6.7],[3.6,6.4]].forEach(function(p){b.cyl([p[0],4.15,4.3],[p[0],4.15,5.8],.2,.16,dark,8);b.box([p[0],4.15,4.25],[1.1,.95,.3],[.04,.02,.015])});
[[-5,8.2,2.2],[-2.5,8,-1.5],[1.8,7.6,2.2]].forEach(function(p){b.cyl([p[0],p[1]-.7,p[2]],[p[0],p[1]+.3,p[2]],.55,.55,[.35,.21,.1],10)});
b.cyl([-8,8.3,0],[-8,10.2,0],.05,.05,dark,4);b.box([-8,10.3,0],[.34,.5,.34],glow);
/* ribs at the break */
[6,7.2,8.2].forEach(function(x,k){for(var a=0;a<7;a++){var t0=a/7*Math.PI,t1=(a+1)/7*Math.PI,rr=4.6-k*.2;b.cyl([x,6.4-Math.sin(t0)*5.6,Math.cos(t0)*rr],[x,6.4-Math.sin(t1)*5.6,Math.cos(t1)*rr],.17,.15,[.17,.09,.05],5)}});
/* stern half with castle */
b.m=stern;
b.hull({x0:-9,x1:12,st:22,ring:14,w:function(t){return 5.1*(1-.22*Math.pow(t,2))},h:function(t){return 6.1+1.3*t+.6*t*t},keel:function(t){return .3+1.6*Math.pow(t,4)},brk:-1});
b.box([7.5,9.7,0],[9,3.6,8.2],[.34,.19,.095]);b.box([7.5,11.65,0],[9.6,.35,8.7],[.2,.11,.06]);b.box([9.8,13.1,0],[4.6,2.6,6.6],[.3,.17,.09]);b.box([9.8,14.55,0],[5,.3,7],[.2,.11,.06]);
[3.8,5.8,7.8,9.8,11.2].forEach(function(x,i){b.box([x,9.8,4.14],[1.35,1.6,.08],[.08,.05,.03]);b.box([x,9.8,4.2],[1.05,1.28,.05],glow)});[8.6,10.8].forEach(function(x){b.box([x,13.2,3.33],[1.1,1.15,.07],glow)});
b.box([3.2,10,4.25],[.2,3.6,.2],dark);b.box([12.1,10,4.25],[.2,3.6,.2],dark);
b.cyl([-1,5,0],[-.2,20,-.2],.45,.24,mast,10);b.box([-.2,17.3,0],[.3,.3,11],mast);var q=b.m;b.m=M.mul(q,M.trs([-.2,0,.4],0));b.sail([0,17,0],10.5,8.5,sail,1.15,14,10);b.m=q;
b.cyl([-.2,20,-.2],[-.2,22.4,-.2],.06,.05,dark,4);b.box([1.1,21.9,-.2],[2.5,1.4,.04],[.05,.04,.06,.6]);
[1,3.6].forEach(function(x){b.cyl([x-3,4.1,4.4],[x-3,4.1,5.9],.2,.16,dark,8);b.box([x-3,4.1,4.3],[1.1,.95,.3],[.04,.02,.015])});
[-6,-7.3,-8.3].forEach(function(x,k){for(var a=0;a<7;a++){var t0=a/7*Math.PI,t1=(a+1)/7*Math.PI,rr=4.7-k*.2;b.cyl([x,6-Math.sin(t0)*5.2,Math.cos(t0)*rr],[x,6-Math.sin(t1)*5.2,Math.cos(t1)*rr],.17,.15,[.17,.09,.05],5)}});
b.m=M.id();
/* treasure chest in the gap */
var ch=[.42,.23,.1],brass=[.82,.62,.24];b.box([0,1.62,14],[3,1.5,1.9],ch);b.box([0,2.72,13.85],[3.05,.7,1.9],[.5,.28,.12]);[-1.1,1.1].forEach(function(x){b.box([x,2,14.98],[.26,2.2,.08],brass)});b.box([0,2.05,15],[.5,.5,.1],brass);
for(i=0;i<46;i++){var a2=rnd(i)*6.28,r2=1.2+rnd(i+50)*3.6;b.cyl([Math.cos(a2)*r2,.95+rnd(i+9)*.15+1.1-.65,15.2+Math.sin(a2)*r2*.5],[Math.cos(a2)*r2,1.08+rnd(i+9)*.15+1.1-.65,15.2+Math.sin(a2)*r2*.5],.26,.26,[1,.76,.25,.45],8)}
/* palms */
function palm(x,z,h,lean){var y=H(x,z)-.2,px=x,py=y,seg=6;for(var k=0;k<seg;k++){var nx=px+lean*(k+1)*.09,ny=py+h/seg;b.cyl([px,py,z],[nx,ny,z],.42-k*.045,.37-k*.045,[.3-.02*k,.2,.12],7);px=nx;py=ny}
 for(k=0;k<9;k++){var a=k/9*6.283+x,ca=Math.cos(a),sa=Math.sin(a),L=4.6+rnd(k+x),prev=[px,py,z];for(var s=1;s<=5;s++){var t=s/5,pt=[px+ca*L*t,py+1.5*t-3.2*t*t,z+sa*L*t],w=.75*Math.sin(t*3.14)+.08,side=[-sa*w,0,ca*w],pw=.75*Math.sin((s-1)/5*3.14)+.08,ps=[-sa*pw,0,ca*pw],c=[.12+.05*rnd(k),.34+.1*rnd(k+3),.14];b.quad([prev[0]-ps[0],prev[1],prev[2]-ps[2]],[prev[0]+ps[0],prev[1],prev[2]+ps[2]],[pt[0]+side[0],pt[1],pt[2]+side[2]],[pt[0]-side[0],pt[1],pt[2]-side[2]],c);prev=pt}}
 for(k=0;k<3;k++)b.ball([px+Math.cos(k*2)*.4,py-.25,z+Math.sin(k*2)*.4],.26,[.23,.15,.08],5)}
palm(-31,20,14,3);palm(-37,16,11,-2);palm(33,21,15,-3);palm(40,15,12,2);palm(-25,31,11,4);palm(28,33,10,-3);
/* barrels, crates, wreckage */
[[-7,16],[-8.4,17.2],[8,16.6],[12,13.6]].forEach(function(p,i){var y=H(p[0],p[1]);b.cyl([p[0],y-.1,p[1]],[p[0],y+1.5,p[1]],.68,.68,[.37,.21,.1],12);[.3,1.1].forEach(function(d){b.cyl([p[0],y+d,p[1]],[p[0],y+d+.13,p[1]],.71,.71,[.14,.1,.08],12)})});
b.box([10.3,H(10,16)+.5,16.2],[1.5,1.2,1.5],[.47,.31,.15],.5);b.box([-12,H(-12,14)+.4,14.5],[1.4,1,1.4],[.45,.29,.14],.9);
[[3,10,.4],[-4,8.5,1.1],[5.5,18,2]].forEach(function(p){var y=H(p[0],p[1])+.05;b.box([p[0],y,p[1]],[4,.16,.55],[.38,.24,.13],p[2])});
/* torches */
var torches=[[-3.8,21],[3.8,21],[-16,17],[17,17]];torches.forEach(function(p){var y=H(p[0],p[1]);b.cyl([p[0],y-.2,p[1]],[p[0],y+3,p[1]],.09,.11,[.2,.11,.06],6);b.cyl([p[0],y+3,p[1]],[p[0],y+3.3,p[1]],.2,.26,[.1,.07,.05],7)});
/* Ybor skyline over the far water */
for(i=0;i<46;i++){var sx=-210+i*9.4+rnd(i)*4,sh=4+rnd(i+.5)*17,sw=5+rnd(i+.2)*5;if(Math.abs(sx-60)<26)continue;b.box([sx,sh/2,-235],[sw,sh,5],[.1,.06,.17,.7]);for(var w2=0;w2<Math.floor(sh/4);w2++)if(rnd(i*9+w2)>.45)b.box([sx+(rnd(w2+i)-.5)*(sw*.6),2+w2*3.6,-232.3],[1,1.1,.1],[1,.78,.42,0])}
var world=b.mesh(gl);
E.lights=[[-3.8,4.1,21],[3.8,4.1,21],[0,3.3,15],[7,10,10.5],[-16,4,17],[17,4,17]];E.lightC=[1.05,.56,.2];
var cats=E.texture('assets/watermark.png');
/* hot spots */
var spots=[].slice.call(stage.querySelectorAll('[data-at]')).map(function(a){return{el:a,p:a.getAttribute('data-at').split(',').map(Number)}});
var yaw=0,pitch=0,tY=0,tP=0,dolly=0,dT=0,drag=null,reduced=matchMedia('(prefers-reduced-motion:reduce)').matches,flyTo=null,flyS=0,visible=true;
new IntersectionObserver(function(e){visible=e[0].isIntersecting;if(visible)req()},{threshold:0}).observe(stage);
stage.addEventListener('pointerdown',function(e){if(e.target.closest('a'))return;drag={x:e.clientX,y:e.clientY,yaw:tY,p:tP}});
addEventListener('pointermove',function(e){if(drag){tY=Math.max(-.62,Math.min(.62,drag.yaw-(e.clientX-drag.x)*.003));tP=Math.max(-.09,Math.min(.2,drag.p+(e.clientY-drag.y)*.0016))}});
addEventListener('pointerup',function(){drag=null});
spots.forEach(function(s){s.el.addEventListener('click',function(ev){if(reduced||ev.metaKey||ev.ctrlKey)return;ev.preventDefault();flyTo=s;flyS=performance.now();setTimeout(function(){location.href=s.el.getAttribute('href')},720)})});
var t0=performance.now(),raf=0;function req(){if(!raf)raf=requestAnimationFrame(frame)}
function pts(t){var a=[];for(var i=0;i<46;i++){var k=i*1.73,x=Math.sin(k)*26+Math.sin(t*.13+k)*2.5,z=8+((i*7.3)%24)+Math.cos(t*.17+k)*1.6,y=1.3+((i*2.1)%9)+Math.sin(t*.5+k)*.8,tw=.4+.6*Math.pow(Math.max(Math.sin(t*1.8+k*3),0),2);a.push([x,y,z,.13+.09*rnd(i),1,.82,.42,tw])}
 torches.forEach(function(p,n){var y=H(p[0],p[1])+3.4;for(var k=0;k<6;k++){var f=(t*1.1+k/6+n*.3)%1;a.push([p[0]+Math.sin(k*2+t*5)*.14,y+f*1,p[1],.5*(1-f)+.1,1,.5+.3*(1-f),.15,1-f])}});return a}
function frame(now){raf=0;var t=(now-t0)/1000;yaw+=(tY-yaw)*.07;pitch+=(tP-pitch)*.07;
 var aspect=cv.clientWidth/Math.max(cv.clientHeight,1),sway=reduced?0:Math.sin(t*.16)*.065,portrait=aspect<.9,fov=portrait?.72:.62,R=Math.min(78,Math.max(50,30/(Math.tan(fov/2)*aspect))),ang=yaw+sway,hgt=12.5+pitch*40+(reduced?0:Math.sin(t*.23)*.35),
 at=[0,portrait?13:9.2,1],eye=[Math.sin(ang)*R,hgt,3+Math.cos(ang)*R];
 if(flyTo){var f=Math.min((now-flyS)/720,1);f=f*f*(3-2*f);at=[at[0]+(flyTo.p[0]-at[0])*f,at[1]+(flyTo.p[1]-at[1])*f,at[2]+(flyTo.p[2]-at[2])*f];eye=[eye[0]+(flyTo.p[0]-eye[0])*f*.82,eye[1]+(flyTo.p[1]-eye[1])*f*.7,eye[2]+(flyTo.p[2]+3-eye[2])*f*.82]}
 E.camera(eye,at,fov);E.sky(t);E.sea(reduced?0:t);E.lights[0][1]=4.1+Math.sin(t*9)*.05;E.lights[1][1]=4.1+Math.sin(t*8+1)*.05;E.lightC=[1.05+.1*Math.sin(t*7),.56,.2];E.begin(reduced?0:t);E.draw(world);
 E.sprite([0,3.1,15],10+.7*Math.sin(t*1.5),10,null,[1,.72,.28,.5]);torches.forEach(function(p){E.sprite([p[0],H(p[0],p[1])+3.7,p[1]],3.8+.3*Math.sin(t*6+p[0]),3.8,null,[1,.5,.15,.75])});
 E.sprite([7,10,8],18,10,null,[1,.72,.32,.1]);
 E.sprite([-8,H(-8,20)+2.05,20],4.2,4.3,cats,[1,1,1,1],true);E.points(pts(t));
 spots.forEach(function(s){var p=E.project(s.p);var hw=(s.w=s.w||s.el.offsetWidth)/2+6,px=Math.max(hw,Math.min(cv.clientWidth-hw,p.x));s.el.style.transform='translate(-50%,-100%) translate('+px.toFixed(1)+'px,'+p.y.toFixed(1)+'px)';s.el.style.visibility=p.front?'visible':'hidden'});
 document.documentElement.setAttribute('data-3d-frame','1');
 if(visible&&!document.hidden)req()}
document.addEventListener('visibilitychange',function(){if(!document.hidden)req()});req();
})();
