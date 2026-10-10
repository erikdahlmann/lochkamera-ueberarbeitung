
/* ---------- Schritt 1/2: freies Erkunden, dann Lot und Winkel (3D) ---------- */
(function(){
var HD=14,DEG=Math.PI/180,SW=200,SH=125,OX=118,OY=62.5,NG=1.5,HB=10,HG=22;
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
/* 2D (x nach rechts, y nach unten) → 3D */
var CX=100,CY=62.5;
function W(x,y,h){return V3(x-CX,h==null?HB:h,y-CY);}
function mp(x,y){return [x-CX,y-CY];}
var v=new View3D($('#vE'),{shadows:true,pos:[0,230,215],target:[0,0,8],maxDist:900,minDist:40,maxPolar:Math.PI*0.49,
  presets:[{label:'Von oben',pos:[0,330,1],target:[0,0,0]},{label:'Flach am Tisch',pos:[-40,40,200],target:[0,10,0]},{label:'Von der Lampe',pos:[-130,70,-50],target:[0,8,0]}],
  hint:'Lampe und Ring ziehen · daneben: Ansicht drehen'});
var glass,lamp,ring,beam,glow,lot,arcs,dots,labs=[];
if(v.ok){
  v.labDefaults({shadowSize:300,key:1.3});
  var tab=makeTable(320,220,0,{grid:10,gridOp:0.28});v.scene.add(tab);
  var paper=new T3.Mesh(new T3.PlaneGeometry(SW,SH),stdMat(0x1d2027,0.85));paper.rotation.x=-Math.PI/2;paper.position.y=0.2;paper.receiveShadow=true;v.scene.add(paper);
  var pg=new T3.GridHelper(SW,20,0x5d6474,0x3c424f);pg.scale.z=SH/SW;pg.position.y=0.3;v.scene.add(pg);
  glass=new GlassBody(v.scene,{op:0.32});
  lamp=new Lamp3D(v.scene,{w:8});ring=new RingHandle(v.scene);
  beam=new Lines(v.scene,{width:3.2});glow=new Lines(v.scene,{width:11,opacity:0.22});
  lot=new Lines(v.scene,{width:1.6,dashed:true,dash:3,gap:3,additive:false,layer:1});arcs=new Lines(v.scene,{width:2.6,additive:false});
  dots=new T3.Group();v.scene.add(dots);
  v.addHandle({obj:lamp.hit,plane:function(){return new T3.Plane(V3(0,1,0),-HB);},keepOffset:true,origin:function(){return W(E.lx,E.ly);},
    move:function(p){E.lx=clamp(p.x+CX,2,SW-2);E.ly=clamp(p.z+CY,2,SH-2);draw();}});
  v.addHandle({obj:ring.hit,plane:function(){return new T3.Plane(V3(0,1,0),-HB);},
    move:function(p){var x=p.x+CX,y=p.z+CY;if(Math.hypot(x-E.lx,y-E.ly)<2)return;E.dir=Math.atan2(y-E.ly,x-E.lx)/DEG;draw();}});
}
var lastShape='';
var RED=[1.0,0.12,0.08];
function draw(){
  var P=shapeE(),ux=Math.cos(E.dir*DEG),uy=Math.sin(E.dir*DEG),offs=E.beam==='one'?[0]:[-5,0,5],main=null,S=[],Gs=[];
  offs.forEach(function(o){var r=traceE(E.lx-uy*o,E.ly+ux*o,ux,uy,P);if(o===0)main=r;
    var pts=r.path.slice();var n=pts.length;pts[n-1]=clipEnd(pts[n-2],pts[n-1],-50,-40,SW+50,SH+40);
    var w3=pts.map(function(q){return W(q[0],q[1]);});
    S=S.concat(polySegs(w3,scaleC(RED,o===0?1.6:1.2)));Gs=Gs.concat(polySegs(w3,scaleC(RED,0.9)));});
  var lines=[],L=[],A=[];
  if(v.ok){
    var k=E.shape+'|'+E.rot;if(k!==lastShape){lastShape=k;glass.set([P],mp,HG,0.4);}
    beam.set(S);glow.set(Gs);
    lamp.group.position.copy(W(E.lx,E.ly,HB-7+7));lamp.group.position.y=7;lamp.group.rotation.y=-E.dir*DEG;
    ring.group.position.copy(W(E.lx+ux*HD,E.ly+uy*HD,HB));
    while(dots.children.length)dots.remove(dots.children[0]);
    main.hits.forEach(function(H){var s=glowSprite([1,0.2,0.12],9,0.9);s.position.copy(W(H.x,H.y));dots.add(s);});
    labs.forEach(function(l){v.scene.remove(l);});labs=[];
  }
  if(E.lot)main.hits.slice(0,4).forEach(function(H,k){
    L.push(seg(W(H.x+H.nx*22,H.y+H.ny*22),W(H.x-H.nx*22,H.y-H.ny*22),[1,1,1]));
    if(E.win){
      var a=Math.acos(clamp(-(H.u0[0]*H.nx+H.u0[1]*H.ny),-1,1))/DEG;
      arc(H.x,H.y,[H.nx,H.ny],[-H.u0[0],-H.u0[1]],'#ffd43b','α'+(k+1));
      var b;
      if(H.tir){b=a;arc(H.x,H.y,[H.nx,H.ny],H.u1,'#ff8787','');}
      else{b=Math.acos(clamp(-(H.u1[0]*H.nx+H.u1[1]*H.ny),-1,1))/DEG;arc(H.x,H.y,[-H.nx,-H.ny],H.u1,'#69db7c','β'+(k+1));}
      lines.push('<b>Stelle '+(k+1)+'</b> ('+(H.into?'Luft → Glas':'Glas → Luft')+'): α'+(k+1)+' = '+fmt(a,0)+'°, '+(H.tir?'<b>Totalreflexion</b> – kein Licht tritt aus':'β'+(k+1)+' = '+fmt(b,0)+'°'));
    }
  });
  function arc(x,y,v1,v2,col,lab){var a1=Math.atan2(v1[1],v1[0]),a2=Math.atan2(v2[1],v2[0]),d=a2-a1;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;
    var r=11,c=lin(col),pts=[];for(var i=0;i<=24;i++){var t=a1+d*i/24;pts.push(W(x+Math.cos(t)*r,y+Math.sin(t)*r,HB+0.3));}A=A.concat(polySegs(pts,c));
    if(lab&&v.ok){var m=a1+d/2,l=label3d(lab,'plain big');l.el.style.color=col;l.position.copy(W(x+Math.cos(m)*(r+7),y+Math.sin(m)*(r+7),HB+1));v.scene.add(l);labs.push(l);}}
  if(v.ok){lot.set(L);arcs.set(A);v.request();}
  $('#angList').innerHTML=E.win?lines.join('<br>'):(E.lot?'Tippe auf „Winkel einzeichnen“, um die Winkel zu sehen.':'');
}
new Seg($('#segE'),[{key:'quader',label:'Quader'},{key:'prisma',label:'Prisma'},{key:'kreis',label:'Glaskugel'},{key:'halb',label:'Halbkreis'},{key:'linse',label:'Linse'}],E.shape,function(k){E.shape=k;draw();});
new Seg($('#segEB'),[{key:'one',label:'ein Strahl'},{key:'three',label:'schmales Bündel'}],E.beam,function(k){E.beam=k;draw();});
new Slider($('#sRot'),{label:'Glaskörper drehen',min:-90,max:90,value:0,step:1,round:1,fmt:function(v){return fmt(v,0)+'°';},onChange:function(v){E.rot=v;draw();}});
function tog(id,key){var b=$(id);b.addEventListener('click',function(){E[key]=!E[key];if(key==='win'&&E.win)E.lot=true;if(key==='lot'&&!E.lot)E.win=false;
  $('#btnLot').classList.toggle('on',E.lot);$('#btnLot').textContent=(E.lot?'● ':'○ ')+'Lot einzeichnen';
  $('#btnWin').classList.toggle('on',E.win);$('#btnWin').textContent=(E.win?'● ':'○ ')+'Winkel einzeichnen';draw();});}
tog('#btnLot','lot');tog('#btnWin','win');
$('#unlock').addEventListener('click',function(){$('#lotCtl').style.display='';$('#vE').scrollIntoView({behavior:'smooth',block:'start'});});
draw();
})();
persistInputs('lk3g');setupCopy($('#copy'),'Lochkamera – Station 3');

