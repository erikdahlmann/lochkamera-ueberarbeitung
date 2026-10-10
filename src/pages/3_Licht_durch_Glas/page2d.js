
/* ---------- Schritt 1/2: freies Erkunden, dann Lot und Winkel ---------- */
(function(){
var HD=14,DEG=Math.PI/180,SW=200,SH=125,OX=118,OY=62.5,NG=1.5;
var E={shape:'quader',rot:0,beam:'one',lx:16,ly:22,dir:20,lot:false,win:false,spot:'alle'};
function rotFn(){var c=Math.cos(E.rot*DEG),s=Math.sin(E.rot*DEG);return function(x,y){return [OX+x*c-y*s,OY+x*s+y*c];};}
function shapeE(){var S;
  switch(E.shape){
    case 'quader':S=shapeFrom([[-30,-20],[30,-20],[30,20],[-30,20]]);break;
    case 'prisma':var h=60*Math.sqrt(3)/2;S=shapeFrom([[0,-h*0.6],[30,h*0.4],[-30,h*0.4]]);break;
    case 'kreis':S=shapeFrom([{arc:1,cx:0,cy:0,r:28,a0:0,a1:2*Math.PI*95/96,n:95}]);break;
    case 'halb':S=shapeFrom([{arc:1,cx:-10,cy:0,r:32,a0:-Math.PI/2,a1:Math.PI/2,n:64}]);break;
    case 'linse':S=lensShape(0,0,60,35,true);break;
  }
  return shapeMap(S,rotFn());
}
var pulseT=0,mainPath=null;
var cvE=new HiCanvas($('#cvE'),SW/SH,function(c,w,h){
  var s=w/SW;c.fillStyle='#10131a';c.fillRect(0,0,w,h);
  var S0=shapeE(),P=S0.pts;
  /* Raster: 1 Kästchen = 1 cm */
  c.strokeStyle='rgba(255,255,255,.07)';c.lineWidth=1;c.beginPath();for(var gx=0;gx<=SW;gx+=10){c.moveTo(gx*s,0);c.lineTo(gx*s,h);}for(var gy=OY%10;gy<=SH;gy+=10){c.moveTo(0,gy*s);c.lineTo(w,gy*s);}c.stroke();
  c.beginPath();P.forEach(function(p,i){i?c.lineTo(p[0]*s,p[1]*s):c.moveTo(p[0]*s,p[1]*s);});c.closePath();
  c.fillStyle='rgba(165,216,255,.2)';c.fill();c.strokeStyle='rgba(165,216,255,.9)';c.lineWidth=2;c.stroke();
  var ux=Math.cos(E.dir*DEG),uy=Math.sin(E.dir*DEG),offs=E.beam==='one'?[0]:[-5,0,5],main=null;
  c.globalCompositeOperation='lighter';
  offs.forEach(function(o){var r=traceShapes(E.lx-uy*o,E.ly+ux*o,ux,uy,[S0],NG);if(o===0)main=r;
    c.strokeStyle='rgba(255,70,60,.95)';c.lineWidth=o===0?3:2;c.beginPath();r.path.forEach(function(q,j){j?c.lineTo(q[0]*s,q[1]*s):c.moveTo(q[0]*s,q[1]*s);});c.stroke();});
  c.globalCompositeOperation='source-over';
  var lines=[];
  mainPath=main.path;
  /* Lichtpunkt, der den Strahl entlangläuft */
  (function(){var L=0,segs=[];for(var i=1;i<main.path.length;i++){var a=main.path[i-1],b=main.path[i],l=Math.hypot(b[0]-a[0],b[1]-a[1]);segs.push([a,b,l]);L+=l;}
    if(!L)return;var d=(pulseT*0.06)%Math.min(L,400),k=0;while(k<segs.length-1&&d>segs[k][2]){d-=segs[k][2];k++;}var q=segs[k],u=clamp(d/q[2],0,1),x=(q[0][0]+(q[1][0]-q[0][0])*u)*s,y=(q[0][1]+(q[1][1]-q[0][1])*u)*s;
    var gr=c.createRadialGradient(x,y,0,x,y,12);gr.addColorStop(0,'rgba(255,255,255,.95)');gr.addColorStop(.4,'rgba(255,170,150,.6)');gr.addColorStop(1,'rgba(255,80,60,0)');c.fillStyle=gr;c.beginPath();c.arc(x,y,12,0,7);c.fill();})();
  if(E.lot)main.hits.slice(0,4).forEach(function(H,k){
    if(E.spot!=='alle'&&String(k+1)!==E.spot)return;
    c.save();c.setLineDash([5,5]);c.strokeStyle='rgba(255,255,255,.85)';c.lineWidth=1.5;c.beginPath();
    c.moveTo((H.x+H.nx*22)*s,(H.y+H.ny*22)*s);c.lineTo((H.x-H.nx*22)*s,(H.y-H.ny*22)*s);c.stroke();c.restore();
    if(E.win){
      var a=Math.acos(clamp(-(H.u0[0]*H.nx+H.u0[1]*H.ny),-1,1))/DEG;
      arc(H.x,H.y,[H.nx,H.ny],[-H.u0[0],-H.u0[1]],'#ffd43b','α'+(k+1));
      var b;
      if(H.tir){b=a;arc(H.x,H.y,[H.nx,H.ny],H.u1,'#ff8787','');}
      else{b=Math.acos(clamp(-(H.u1[0]*H.nx+H.u1[1]*H.ny),-1,1))/DEG;arc(H.x,H.y,[-H.nx,-H.ny],H.u1,'#69db7c','β'+(k+1));}
      lines.push('<b>Stelle '+(k+1)+'</b> ('+(H.into?'Luft → Glas':'Glas → Luft')+'): α'+(k+1)+' = '+fmt(a,0)+'°, '+(H.tir?'<b>kein Licht kommt heraus</b> – es wird ganz zurückgeworfen (mehr dazu in Station 4)':'β'+(k+1)+' = '+fmt(b,0)+'°'));
    }
    c.fillStyle='#fff';c.font='bold 13px -apple-system,sans-serif';c.textAlign='center';c.textBaseline='middle';
  });
  function arc(x,y,v1,v2,col,lab){var a1=Math.atan2(v1[1],v1[0]),a2=Math.atan2(v2[1],v2[0]),d=a2-a1;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;
    var r=11*s;c.strokeStyle=col;c.lineWidth=2.5;c.beginPath();c.arc(x*s,y*s,r,a1,a1+d,d<0);c.stroke();
    if(lab){var m=a1+d/2;c.fillStyle=col;c.font='bold 14px -apple-system,sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(lab,x*s+Math.cos(m)*(r+12),y*s+Math.sin(m)*(r+12));}}
  // Lampe und Zielpunkt
  c.fillStyle='rgba(255,212,59,.25)';c.beginPath();c.arc(E.lx*s,E.ly*s,22,0,7);c.fill();c.fillStyle='#ffd43b';c.beginPath();c.arc(E.lx*s,E.ly*s,9,0,7);c.fill();
  var hx=(E.lx+ux*HD)*s,hy=(E.ly+uy*HD)*s;c.fillStyle='rgba(255,255,255,.15)';c.beginPath();c.arc(hx,hy,20,0,7);c.fill();c.strokeStyle='#fff';c.lineWidth=2.5;c.beginPath();c.arc(hx,hy,9,0,7);c.stroke();
  $('#angList').innerHTML=E.win?lines.join('<br>'):(E.lot?'Tippe auf „Winkel einzeichnen“, um die Winkel zu sehen.':'');
});
new Seg($('#segE'),[{key:'quader',label:'Quader'},{key:'prisma',label:'Prisma'},{key:'kreis',label:'Glaszylinder'},{key:'halb',label:'Halbzylinder'},{key:'linse',label:'Linse'}],E.shape,function(k){E.shape=k;sRot.enable(k!=='kreis');cvE.request();});
new Seg($('#segEB'),[{key:'one',label:'ein Strahl'},{key:'three',label:'schmales Bündel'}],E.beam,function(k){E.beam=k;cvE.request();});
var sRot=new Slider($('#sRot'),{label:'Glaskörper drehen',min:-90,max:90,value:0,step:1,round:1,fmt:function(v){return fmt(v,0)+'°';},onChange:function(v){E.rot=v;cvE.request();}});
new Seg($('#segSpot'),[{key:'alle',label:'allen Stellen'},{key:'1',label:'Stelle 1'},{key:'2',label:'Stelle 2'},{key:'3',label:'Stelle 3'}],E.spot,function(k){E.spot=k;cvE.request();});
var tLot=new Toggle($('#btnLot'),'Lot einzeichnen',false,function(on){E.lot=on;if(!on){E.win=false;tWin.set(false);}cvE.request();});
var tWin=new Toggle($('#btnWin'),'Winkel einzeichnen',false,function(on){E.win=on;if(on){E.lot=true;tLot.set(true);}cvE.request();});
function unlock(scroll){$('#lotCtl').style.display='';lsSet('lk3g-frei','1');if(scroll)$('#cvE').scrollIntoView({behavior:'smooth',block:'start'});}
$('#unlock').addEventListener('click',function(){unlock(true);});
if(lsGet('lk3g-frei')==='1')unlock(false);
/* Animation des Lichtpunkts nur, wenn das Bild sichtbar ist */
var visE=true;if('IntersectionObserver' in window)new IntersectionObserver(function(es){visE=es[0].isIntersecting;},{}).observe($('#cvE'));
(function loop(t){pulseT=t;if(visE)cvE.paint();requestAnimationFrame(loop);})(0);
(function(){var el=$('#cvE'),drag=null;
  function pos(ev){var p=cvE.toLocal(ev),s=cvE.w/SW;return [clamp(p.x/s,2,SW-2),clamp(p.y/s,2,SH-2)];}
  function hpos(){return [E.lx+Math.cos(E.dir*DEG)*HD,E.ly+Math.sin(E.dir*DEG)*HD];}
  el.addEventListener('pointerdown',function(e){var q=pos(e),h=hpos(),dl=Math.hypot(q[0]-E.lx,q[1]-E.ly),da=Math.hypot(q[0]-h[0],q[1]-h[1]);drag=dl<da?'l':'a';el.setPointerCapture(e.pointerId);move(e);});
  function move(e){if(!drag)return;var q=pos(e);if(drag==='l'){E.lx=q[0];E.ly=q[1];}else{if(Math.hypot(q[0]-E.lx,q[1]-E.ly)<2)return;E.dir=Math.atan2(q[1]-E.ly,q[0]-E.lx)/DEG;}cvE.request();}
  el.addEventListener('pointermove',move);el.addEventListener('pointerup',function(){drag=null;});el.addEventListener('pointercancel',function(){drag=null;});
})();
})();
persistInputs('lk3g');setupCopy($('#copy'),'Lochkamera – Station 3');
