
/* ---------- Schritt 1/2: freies Erkunden, dann Lot und Winkel ---------- */
(function(){
var HD=14,DEG=Math.PI/180,SW=200,SH=125,OX=118,OY=62.5,NG=1.5;
var E={shape:'quader',rot:0,beam:'one',lx:16,ly:22,dir:20,lot:false,win:false};
function rot(pts){var c=Math.cos(E.rot*DEG),s=Math.sin(E.rot*DEG);return pts.map(function(p){var x=p[0],y=p[1];return [OX+x*c-y*s,OY+x*s+y*c];});}
function circ(r,a0,a1,n){var p=[];for(var i=0;i<=n;i++){var a=a0+(a1-a0)*i/n;p.push([r*Math.cos(a),r*Math.sin(a)]);}return p;}
function shapeE(){
  switch(E.shape){
    case 'quader':return rot([[-30,-20],[30,-20],[30,20],[-30,20]]);
    case 'prisma':var h=60*Math.sqrt(3)/2;return rot([[0,-h*0.6],[30,h*0.4],[-30,h*0.4]]);
    case 'kreis':var p=circ(28,0,2*Math.PI,96);p.pop();return rot(p);
    case 'halb':return rot(circ(32,-Math.PI/2,Math.PI/2,64).map(function(q){return [q[0]-10,q[1]];}));
    case 'linse':var R=60,a=35,tm=Math.asin(a/R),sag=R-Math.sqrt(R*R-a*a),T=2*sag+1.5,pts=[],i,th;
      for(i=0;i<=40;i++){th=-tm+2*tm*i/40;pts.push([T/2-R+R*Math.cos(th),R*Math.sin(th)]);}
      for(i=0;i<=40;i++){th=tm-2*tm*i/40;pts.push([-T/2+R-R*Math.cos(th),R*Math.sin(th)]);}
      return rot(pts);
  }
}
function insideE(P,x,y){var c=false;for(var i=0,j=P.length-1;i<P.length;j=i++){var xi=P[i][0],yi=P[i][1],xj=P[j][0],yj=P[j][1];
  if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))c=!c;}return c;}
function traceE(px,py,ux,uy,P){
  var path=[[px,py]],hits=[];
  for(var it=0;it<30;it++){
    var best=1e9,bn=null;
    for(var i=0,j=P.length-1;i<P.length;j=i++){var ax=P[j][0],ay=P[j][1],ex=P[i][0]-ax,ey=P[i][1]-ay,den=ux*ey-uy*ex;if(Math.abs(den)<1e-12)continue;
      var t=((ax-px)*ey-(ay-py)*ex)/den,s=((ax-px)*uy-(ay-py)*ux)/den;if(t>1e-6&&s>=0&&s<=1&&t<best){best=t;var L=Math.hypot(ex,ey);bn=[-ey/L,ex/L];}}
    if(!bn){path.push([px+ux*400,py+uy*400]);break;}
    var qx=px+ux*best,qy=py+uy*best;path.push([qx,qy]);
    var nx=bn[0],ny=bn[1];if(nx*ux+ny*uy>0){nx=-nx;ny=-ny;}
    var inG=insideE(P,qx-ux*1e-3,qy-uy*1e-3),n1=inG?NG:1,n2=inG?1:NG,eta=n1/n2,ci=-(nx*ux+ny*uy),kk=1-eta*eta*(1-ci*ci),u0=[ux,uy],tir=kk<0;
    if(tir){ux=ux+2*ci*nx;uy=uy+2*ci*ny;}else{var f=eta*ci-Math.sqrt(kk);ux=eta*ux+f*nx;uy=eta*uy+f*ny;}
    var L2=Math.hypot(ux,uy);ux/=L2;uy/=L2;
    hits.push({x:qx,y:qy,nx:nx,ny:ny,u0:u0,u1:[ux,uy],into:!inG,tir:tir});
    px=qx+ux*1e-3;py=qy+uy*1e-3;
  }
  return {path:path,hits:hits};
}
var cvE=new HiCanvas($('#cvE'),SW/SH,function(c,w,h){
  var s=w/SW;c.fillStyle='#10131a';c.fillRect(0,0,w,h);
  var P=shapeE();
  c.beginPath();P.forEach(function(p,i){i?c.lineTo(p[0]*s,p[1]*s):c.moveTo(p[0]*s,p[1]*s);});c.closePath();
  c.fillStyle='rgba(165,216,255,.2)';c.fill();c.strokeStyle='rgba(165,216,255,.9)';c.lineWidth=2;c.stroke();
  var ux=Math.cos(E.dir*DEG),uy=Math.sin(E.dir*DEG),offs=E.beam==='one'?[0]:[-5,0,5],main=null;
  c.globalCompositeOperation='lighter';
  offs.forEach(function(o){var r=traceE(E.lx-uy*o,E.ly+ux*o,ux,uy,P);if(o===0)main=r;
    c.strokeStyle='rgba(255,70,60,.95)';c.lineWidth=o===0?3:2;c.beginPath();r.path.forEach(function(q,j){j?c.lineTo(q[0]*s,q[1]*s):c.moveTo(q[0]*s,q[1]*s);});c.stroke();});
  c.globalCompositeOperation='source-over';
  var lines=[];
  if(E.lot)main.hits.slice(0,4).forEach(function(H,k){
    c.save();c.setLineDash([5,5]);c.strokeStyle='rgba(255,255,255,.85)';c.lineWidth=1.5;c.beginPath();
    c.moveTo((H.x+H.nx*22)*s,(H.y+H.ny*22)*s);c.lineTo((H.x-H.nx*22)*s,(H.y-H.ny*22)*s);c.stroke();c.restore();
    if(E.win){
      var a=Math.acos(clamp(-(H.u0[0]*H.nx+H.u0[1]*H.ny),-1,1))/DEG;
      arc(H.x,H.y,[H.nx,H.ny],[-H.u0[0],-H.u0[1]],'#ffd43b','α'+(k+1));
      var b;
      if(H.tir){b=a;arc(H.x,H.y,[H.nx,H.ny],H.u1,'#ff8787','');}
      else{b=Math.acos(clamp(-(H.u1[0]*H.nx+H.u1[1]*H.ny),-1,1))/DEG;arc(H.x,H.y,[-H.nx,-H.ny],H.u1,'#69db7c','β'+(k+1));}
      lines.push('<b>Stelle '+(k+1)+'</b> ('+(H.into?'Luft → Glas':'Glas → Luft')+'): α'+(k+1)+' = '+fmt(a,0)+'°, '+(H.tir?'<b>Totalreflexion</b> – kein Licht tritt aus':'β'+(k+1)+' = '+fmt(b,0)+'°'));
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
new Seg($('#segE'),[{key:'quader',label:'Quader'},{key:'prisma',label:'Prisma'},{key:'kreis',label:'Glaskugel'},{key:'halb',label:'Halbkreis'},{key:'linse',label:'Linse'}],E.shape,function(k){E.shape=k;cvE.request();});
new Seg($('#segEB'),[{key:'one',label:'ein Strahl'},{key:'three',label:'schmales Bündel'}],E.beam,function(k){E.beam=k;cvE.request();});
new Slider($('#sRot'),{label:'Glaskörper drehen',min:-90,max:90,value:0,step:1,round:1,fmt:function(v){return fmt(v,0)+'°';},onChange:function(v){E.rot=v;cvE.request();}});
function tog(id,key){var b=$(id);b.addEventListener('click',function(){E[key]=!E[key];if(key==='win'&&E.win)E.lot=true;if(key==='lot'&&!E.lot)E.win=false;
  $('#btnLot').classList.toggle('on',E.lot);$('#btnLot').textContent=(E.lot?'● ':'○ ')+'Lot einzeichnen';
  $('#btnWin').classList.toggle('on',E.win);$('#btnWin').textContent=(E.win?'● ':'○ ')+'Winkel einzeichnen';cvE.request();});}
tog('#btnLot','lot');tog('#btnWin','win');
$('#unlock').addEventListener('click',function(){$('#lotCtl').style.display='';$('#cvE').scrollIntoView({behavior:'smooth',block:'start'});});
(function(){var el=$('#cvE'),drag=null;
  function pos(ev){var p=cvE.toLocal(ev),s=cvE.w/SW;return [clamp(p.x/s,2,SW-2),clamp(p.y/s,2,SH-2)];}
  function hpos(){return [E.lx+Math.cos(E.dir*DEG)*HD,E.ly+Math.sin(E.dir*DEG)*HD];}
  el.addEventListener('pointerdown',function(e){var q=pos(e),h=hpos(),dl=Math.hypot(q[0]-E.lx,q[1]-E.ly),da=Math.hypot(q[0]-h[0],q[1]-h[1]);drag=dl<da?'l':'a';el.setPointerCapture(e.pointerId);move(e);});
  function move(e){if(!drag)return;var q=pos(e);if(drag==='l'){E.lx=q[0];E.ly=q[1];}else{if(Math.hypot(q[0]-E.lx,q[1]-E.ly)<2)return;E.dir=Math.atan2(q[1]-E.ly,q[0]-E.lx)/DEG;}cvE.request();}
  el.addEventListener('pointermove',move);el.addEventListener('pointerup',function(){drag=null;});el.addEventListener('pointercancel',function(){drag=null;});
})();
})();
persistInputs('lk3g');setupCopy($('#copy'),'Lochkamera – Station 3');
