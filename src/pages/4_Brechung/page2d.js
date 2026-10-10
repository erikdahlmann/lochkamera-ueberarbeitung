
(function(){
var DEG=Math.PI/180;
var MATS={wasser:{l:'Wasser',n:1.33},glas:{l:'Glas',n:1.5},diamant:{l:'Diamant',n:2.42},luft:{l:'Luft',n:1.0}};
var A={alpha:30,mat:'glas',dir:'in',num:true};
function n12(){var n=MATS[A.mat].n;return A.dir==='in'?[1,n]:[n,1];}
function beta(){var nn=n12(),s=nn[0]/nn[1]*Math.sin(A.alpha*DEG);return s>1?null:Math.asin(s)/DEG;}

var cvA=new HiCanvas($('#cvA'),1,function(c,w,h){
  var cx=w/2,cy=h/2,r=Math.min(w,h)*0.42,nn=n12(),b=beta();
  c.fillStyle='#10131a';c.fillRect(0,0,w,h);
  // Material
  var matTop=A.dir!=='in'; // Material oben, wenn Licht aus dem Material kommt
  c.fillStyle='rgba(116,192,252,'+(0.12+0.12*(MATS[A.mat].n-1))+')';
  if(matTop)c.fillRect(0,0,w,cy);else c.fillRect(0,cy,w,h-cy);
  c.fillStyle='rgba(255,255,255,.75)';c.font='15px -apple-system,sans-serif';c.textAlign='left';c.textBaseline='top';
  c.fillText(matTop?MATS[A.mat].l+' (n = '+fmt(MATS[A.mat].n,2)+')':'Luft',10,8);c.textBaseline='bottom';
  c.fillText(matTop?'Luft':MATS[A.mat].l+' (n = '+fmt(MATS[A.mat].n,2)+')',10,h-8);
  // Winkelscheibe
  c.strokeStyle='rgba(255,255,255,.35)';c.lineWidth=1;c.beginPath();c.arc(cx,cy,r,0,7);c.stroke();
  c.font='11px -apple-system,sans-serif';c.textAlign='center';c.textBaseline='middle';
  for(var a=0;a<360;a+=5){var rad=a*DEG,len=a%10?6:12;c.beginPath();c.moveTo(cx+Math.sin(rad)*r,cy-Math.cos(rad)*r);c.lineTo(cx+Math.sin(rad)*(r-len),cy-Math.cos(rad)*(r-len));c.stroke();
    if(a%30===0){var lab=a<=90?a:(a<=270?Math.abs(180-a):360-a);c.fillStyle='rgba(255,255,255,.55)';c.fillText(lab+'°',cx+Math.sin(rad)*(r-24),cy-Math.cos(rad)*(r-24));}}
  // Lot und Grenzfläche
  c.setLineDash([6,6]);c.strokeStyle='rgba(255,255,255,.5)';c.beginPath();c.moveTo(cx,cy-r-10);c.lineTo(cx,cy+r+10);c.stroke();c.setLineDash([]);
  c.strokeStyle='rgba(165,216,255,.9)';c.lineWidth=2;c.beginPath();c.moveTo(0,cy);c.lineTo(w,cy);c.stroke();
  // Strahlen
  var al=A.alpha*DEG,lx=cx-Math.sin(al)*r,ly=cy-Math.cos(al)*r;
  c.globalCompositeOperation='lighter';
  function ray(x1,y1,x2,y2,alpha,wd){c.strokeStyle='rgba(255,70,70,'+alpha+')';c.lineWidth=wd;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();}
  ray(lx,ly,cx,cy,1,4);
  // Reflexion (schwach, bei Totalreflexion stark)
  var refl=b===null?1:0.12+0.5*Math.pow(A.alpha/90,6);
  ray(cx,cy,cx+Math.sin(al)*r,cy-Math.cos(al)*r,refl,b===null?4:2);
  if(b!==null){var bb=b*DEG;ray(cx,cy,cx+Math.sin(bb)*r,cy+Math.cos(bb)*r,0.95,4);}
  c.globalCompositeOperation='source-over';
  // Lampe
  c.save();c.translate(lx,ly);c.rotate(-al+Math.PI);c.fillStyle='#ffd43b';c.fillRect(-12,-24,24,20);c.fillStyle='#fff3bf';c.fillRect(-6,-6,12,6);c.restore();
  c.fillStyle='rgba(255,212,59,.25)';c.beginPath();c.arc(lx,ly,26,0,7);c.fill();
  // Winkelbögen
  if(A.num){
    c.lineWidth=2;c.strokeStyle='#ffd43b';c.beginPath();c.arc(cx,cy,r*0.32,-Math.PI/2-al,-Math.PI/2,false);c.stroke();
    c.fillStyle='#ffd43b';c.font='bold 16px -apple-system,sans-serif';c.fillText('α',cx-Math.sin(al/2)*r*0.42,cy-Math.cos(al/2)*r*0.42);
    if(b!==null){var bb2=b*DEG;c.strokeStyle='#69db7c';c.beginPath();c.arc(cx,cy,r*0.32,Math.PI/2-bb2,Math.PI/2,false);c.stroke();
      c.fillStyle='#69db7c';c.fillText('β',cx+Math.sin(bb2/2)*r*0.42,cy+Math.cos(bb2/2)*r*0.42);}
  }
  if(b===null){c.fillStyle='#ff8787';c.font='bold 18px -apple-system,sans-serif';c.fillText('Totalreflexion!',cx,cy+r*0.55);}
});
function updA(){cvA.request();var b=beta();
  $('#mA').textContent=A.num?fmt(A.alpha,0)+'°':'?';$('#mB').textContent=A.num?(b===null?'–':fmt(b,1)+'°'):'?';if(wave)wave.request();}
var sAlpha=new Slider($('#sAlpha'),{label:'Einfallswinkel α',min:0,max:89,value:A.alpha,step:1,round:1,fmt:function(v){return fmt(v,0)+'°';},onChange:function(v){A.alpha=v;updA();}});
new Seg($('#segMat'),Object.keys(MATS).map(function(k){return {key:k,label:MATS[k].l};}),A.mat,function(k){A.mat=k;updA();});
new Seg($('#segDir'),[{key:'in',label:'aus der Luft'},{key:'out',label:'aus dem Material'}],A.dir,function(k){A.dir=k;updA();});
$('#btnNum').addEventListener('click',function(){A.num=!A.num;this.classList.toggle('on',A.num);updA();});
(function(){var cv=$('#cvA'),drag=false;
  function setFrom(ev){var p=cvA.toLocal(ev),dx=p.x-cvA.w/2,dy=p.y-cvA.h/2;if(dy>0)dy=0;var a=Math.round(Math.atan2(-dx,-dy)/DEG);a=clamp(Math.abs(a),0,89);A.alpha=a;sAlpha.set(a,false);updA();}
  cv.addEventListener('pointerdown',function(e){drag=true;cv.setPointerCapture(e.pointerId);setFrom(e);});
  cv.addEventListener('pointermove',function(e){if(drag)setFrom(e);});
  cv.addEventListener('pointerup',function(){drag=false;});cv.addEventListener('pointercancel',function(){drag=false;});
})();

/* --- Wellenmodell --- */
var wave=null,waveOn=false,wt=0;
(function(){
  var cv=$('#cvW'),WW=200,WH=100,img=null,octx=null,off=document.createElement('canvas');off.width=WW;off.height=WH;octx=off.getContext('2d');img=octx.createImageData(WW,WH);
  wave=new HiCanvas(cv,2,function(c,w,h){
    var nn=n12(),al=A.alpha*DEG,u1x=Math.sin(al),u1y=Math.cos(al),s2=nn[0]/nn[1]*u1x,tir=s2>1,u2y=tir?0:Math.sqrt(1-s2*s2);
    var k1=2*Math.PI/14*nn[0],k2=2*Math.PI/14*nn[1],d=img.data,y0=WH/2,x,y,ph;
    for(y=0;y<WH;y++)for(x=0;x<WW;x++){var X=x-WW/2,Y=y-y0;
      if(Y<0)ph=k1*(u1x*X+u1y*Y);else ph=tir?NaN:k1*u1x*X+k2*u2y*Y;
      var i=(y*WW+x)*4,v=isNaN(ph)?0:(0.5+0.5*Math.cos(ph-wt));v=v*v*v;
      var inMat=(A.dir==='in')?Y>=0:Y<0;
      d[i]=30+200*v;d[i+1]=40+160*v;d[i+2]=(inMat?110:50)+120*v;d[i+3]=255;}
    octx.putImageData(img,0,0);c.imageSmoothingEnabled=true;c.drawImage(off,0,0,w,h);
    c.strokeStyle='rgba(255,255,255,.7)';c.lineWidth=2;c.beginPath();c.moveTo(0,h/2);c.lineTo(w,h/2);c.stroke();
    // Richtungspfeile
    function arrow(x1,y1,dx,dy,col){var L=h*0.35,x2=x1+dx*L,y2=y1+dy*L;c.strokeStyle=col;c.fillStyle=col;c.lineWidth=3;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();
      var a=Math.atan2(dy,dx);c.beginPath();c.moveTo(x2,y2);c.lineTo(x2-12*Math.cos(a-.4),y2-12*Math.sin(a-.4));c.lineTo(x2-12*Math.cos(a+.4),y2-12*Math.sin(a+.4));c.closePath();c.fill();}
    arrow(w/2-u1x*h*0.4,h/2-u1y*h*0.4,u1x,u1y,'#ff6b6b');
    if(!tir)arrow(w/2,h/2,s2,u2y,'#ff6b6b');
  });
  var det=cv.closest('details');
  function loop(){if(!waveOn)return;wt+=0.12;wave.paint();requestAnimationFrame(loop);}
  det.addEventListener('toggle',function(){waveOn=det.open;if(waveOn){wave.resize();loop();}});
})();
updA();

/* --- Schritt 2: Strahlenverfolgung --- */
var B={shape:'sammel',beam:'par',ang:0,n:1.5,R:70,sy:62.5,px:12,py:62.5};
var SW=200,SH=125,CX=80,CY=62.5;
function rectPoly(x0,y0,x1,y1){return [[x0,y0],[x1,y0],[x1,y1],[x0,y1]];}
function lensPoly(R,a,conv){
  var pts=[],N=28,i,th,tm=Math.asin(a/R),sag=R-Math.sqrt(R*R-a*a);
  if(conv){var T=2*sag+1.5;
    for(i=0;i<=N;i++){th=-tm+2*tm*i/N;pts.push([CX+T/2-R+R*Math.cos(th),CY+R*Math.sin(th)]);}
    for(i=0;i<=N;i++){th=tm-2*tm*i/N;pts.push([CX-T/2+R-R*Math.cos(th),CY+R*Math.sin(th)]);}}
  else{var c0=2,E=2*sag+c0;
    for(i=0;i<=N;i++){th=-tm+2*tm*i/N;pts.push([CX+c0/2+R-R*Math.cos(th),CY+R*Math.sin(th)]);}
    for(i=0;i<=N;i++){th=tm-2*tm*i/N;pts.push([CX-c0/2-R+R*Math.cos(th),CY+R*Math.sin(th)]);}}
  return pts;
}
function prismStack(R,a){
  function T(y){return 2*(Math.sqrt(R*R-y*y)-Math.sqrt(R*R-a*a))+1.5;}
  var polys=[],t0=T(4);polys.push(rectPoly(CX-t0/2,CY-8,CX+t0/2,CY+8));
  [[9.5,18],[19.5,26],[27.5,a]].forEach(function(s){var y1=s[0],y2=s[1],t1=T(y1),t2=T(y2);
    [1,-1].forEach(function(sg){polys.push([[CX-t1/2,CY+sg*y1],[CX+t1/2,CY+sg*y1],[CX+t2/2,CY+sg*y2],[CX-t2/2,CY+sg*y2]]);});});
  return polys;
}
function shapes(){
  var R=B.R,a=40;
  switch(B.shape){
    case 'quader':return [rectPoly(CX-25,CY-35,CX+25,CY+35)];
    case 'prisma':var s=60,hgt=s*Math.sqrt(3)/2;return [[[CX,CY-hgt*0.6],[CX+s/2,CY+hgt*0.4],[CX-s/2,CY+hgt*0.4]]];
    case 'stapel':return prismStack(Math.max(R,36),34);
    case 'sammel':return [lensPoly(R,a,true)];
    case 'zerstreu':return [lensPoly(R,a,false)];
  }
}
function inside(poly,x,y){var c=false;for(var i=0,j=poly.length-1;i<poly.length;j=i++){var xi=poly[i][0],yi=poly[i][1],xj=poly[j][0],yj=poly[j][1];
  if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))c=!c;}return c;}
function trace(px,py,ux,uy,polys,n){
  var path=[[px,py]];
  for(var it=0;it<40;it++){
    var best=1e9,bn=null,bp=-1;
    for(var k=0;k<polys.length;k++){var P=polys[k];for(var i=0,j=P.length-1;i<P.length;j=i++){
      var ax=P[j][0],ay=P[j][1],ex=P[i][0]-ax,ey=P[i][1]-ay,den=ux*ey-uy*ex;if(Math.abs(den)<1e-12)continue;
      var t=((ax-px)*ey-(ay-py)*ex)/den,s=((ax-px)*uy-(ay-py)*ux)/den;
      if(t>1e-6&&s>=0&&s<=1&&t<best){best=t;bp=k;var L=Math.hypot(ex,ey);bn=[-ey/L,ex/L];}}}
    if(bp<0){path.push([px+ux*400,py+uy*400]);break;}
    var qx=px+ux*best,qy=py+uy*best;path.push([qx,qy]);
    var nx=bn[0],ny=bn[1];if(nx*ux+ny*uy>0){nx=-nx;ny=-ny;}
    var inGlass=inside(polys[bp],qx-ux*1e-3,qy-uy*1e-3),n1=inGlass?n:1,n2=inGlass?1:n,eta=n1/n2,ci=-(nx*ux+ny*uy),kk=1-eta*eta*(1-ci*ci);
    if(kk<0){ux=ux+2*ci*nx;uy=uy+2*ci*ny;}else{var f=eta*ci-Math.sqrt(kk);ux=eta*ux+f*nx;uy=eta*uy+f*ny;}
    var L2=Math.hypot(ux,uy);ux/=L2;uy/=L2;px=qx+ux*1e-3;py=qy+uy*1e-3;
  }
  return path;
}
var cvB=new HiCanvas($('#cvB'),SW/SH,function(c,w,h){
  var s=w/SW;c.fillStyle='#10131a';c.fillRect(0,0,w,h);
  c.strokeStyle='rgba(255,255,255,.07)';c.lineWidth=1;c.beginPath();
  for(var gx=0;gx<=SW;gx+=10){c.moveTo(gx*s,0);c.lineTo(gx*s,h);}for(var gy=CY%10;gy<=SH;gy+=10){c.moveTo(0,gy*s);c.lineTo(w,gy*s);}c.stroke();
  c.setLineDash([6,6]);c.strokeStyle='rgba(255,255,255,.3)';c.beginPath();c.moveTo(0,CY*s);c.lineTo(w,CY*s);c.stroke();c.setLineDash([]);
  var polys=shapes();
  polys.forEach(function(P){c.beginPath();P.forEach(function(p,i){i?c.lineTo(p[0]*s,p[1]*s):c.moveTo(p[0]*s,p[1]*s);});c.closePath();
    c.fillStyle='rgba(165,216,255,'+(0.08+0.25*(B.n-1))+')';c.fill();c.strokeStyle='rgba(165,216,255,.85)';c.lineWidth=1.5;c.stroke();});
  var rays=[],i,N;
  if(B.beam==='par'){N=9;var ux=Math.cos(B.ang*DEG),uy=Math.sin(B.ang*DEG),span=B.shape==='quader'||B.shape==='prisma'?24:64;
    var offs=[];if(B.shape==='stapel')offs=[-30,-22,-13,-4,0,4,13,22,30];else for(i=0;i<N;i++)offs.push(-span/2+span*i/(N-1));
    offs.forEach(function(off){rays.push([B.px-uy*off,B.sy+ux*off,ux,uy]);});}
  else{N=13;var x0=B.px,y0=B.py,dx=CX-x0,top=Math.atan2(CY-42-y0,dx),bot=Math.atan2(CY+42-y0,dx);
    for(i=0;i<N;i++){var a=top+(bot-top)*i/(N-1);rays.push([x0,y0,Math.cos(a),Math.sin(a)]);}}
  c.globalCompositeOperation='lighter';c.lineWidth=2;c.strokeStyle='rgba(255,90,70,.85)';
  rays.forEach(function(r){var p=trace(r[0],r[1],r[2],r[3],polys,B.n);c.beginPath();p.forEach(function(q,j){j?c.lineTo(q[0]*s,q[1]*s):c.moveTo(q[0]*s,q[1]*s);});c.stroke();});
  c.globalCompositeOperation='source-over';
  // Lampe
  var lx=B.px*s,ly=(B.beam==='par'?B.sy:B.py)*s;c.fillStyle='#ffd43b';c.beginPath();c.arc(lx,ly,9,0,7);c.fill();c.fillStyle='rgba(255,212,59,.25)';c.beginPath();c.arc(lx,ly,20,0,7);c.fill();
});
var segShape=new Seg($('#segShape'),[{key:'quader',label:'Glasquader'},{key:'prisma',label:'Prisma'},{key:'stapel',label:'Linse aus Prismen'},{key:'sammel',label:'Sammellinse'},{key:'zerstreu',label:'Zerstreuungslinse'}],B.shape,function(k){B.shape=k;
  if(k==='prisma'||k==='quader'){B.ang=k==='prisma'?-10:15;sAng.set(B.ang,false);}else{B.ang=0;sAng.set(0,false);}
  B.sy=k==='prisma'?CY+14:(k==='quader'?CY-20:CY);B.py=CY;updB();});
new Seg($('#segBeam'),[{key:'par',label:'paralleles Licht'},{key:'pt',label:'Punktlampe'}],B.beam,function(k){B.beam=k;updB();});
var sAng=new Slider($('#sAng'),{label:'Richtung des Lichts',min:-30,max:30,value:B.ang,step:1,round:1,fmt:function(v){return fmt(v,0)+'°';},onChange:function(v){B.ang=v;updB();}});
new Slider($('#sN'),{label:'Brechzahl n des Glases',min:1,max:2,value:B.n,step:0.01,round:0.01,fmt:function(v){return fmt(v,2);},onChange:function(v){B.n=v;updB();}});
var sR=new Slider($('#sR'),{label:'Wölbung der Linse',min:0,max:100,value:65,step:2,round:1,fmt:function(v){return v<20?'flach':(v<60?'mittel':'stark');},onChange:function(v){B.R=wToR(v);updB();}});
function wToR(v){return 220*Math.pow(42/220,v/100);} // 0 = flach (R groß), 100 = stark (R klein)
B.R=wToR(65);
function updB(){$('#sR').style.opacity=(B.shape==='quader'||B.shape==='prisma')?0.35:1;$('#sAng').style.opacity=B.beam==='par'?1:0.35;cvB.request();}
(function(){var cv=$('#cvB'),drag=false;
  function setFrom(ev){var p=cvB.toLocal(ev),s=cvB.w/SW,y=clamp(p.y/s,5,SH-5);
    if(B.beam==='par'){B.sy=y;}else{B.py=y;B.px=clamp(p.x/s,4,CX-45);}cvB.request();}
  cv.addEventListener('pointerdown',function(e){drag=true;cv.setPointerCapture(e.pointerId);setFrom(e);});
  cv.addEventListener('pointermove',function(e){if(drag)setFrom(e);});
  cv.addEventListener('pointerup',function(){drag=false;});cv.addEventListener('pointercancel',function(){drag=false;});
})();
updB();
persistInputs('lk3');setupCopy($('#copy'),'Lochkamera – Station 4');
})();
