
/* ---------- Schritt 1/2: freies Erkunden, dann Lot und Winkel (3D) ---------- */
(function(){
var HD=14,DEG=Math.PI/180,SW=200,SH=125,OX=118,OY=62.5,NG=1.5,HB=10,HG=22;
var E={shape:'quader',rot:0,beam:'one',lx:16,ly:22,dir:20,lot:false,win:false,spot:'alle'};
/* Glaskörper als Umriss (mit echten Kreisbögen), gedreht um (OX,OY) */
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
/* 2D (x nach rechts, y nach unten) → 3D */
var CX=100,CY=62.5;
function W(x,y,h){return V3(x-CX,h==null?HB:h,y-CY);}
function mp(x,y){return [x-CX,y-CY];}
var v=new View3D($('#vE'),{shadows:true,pos:[0,120,265],target:[0,0,-12],maxDist:900,minDist:40,maxPolar:Math.PI*0.49,ctl:'#ctl3',
  presets:[{label:'Von oben (messen)',ortho:true,pos:[0,400,0],target:[0,0,0],size:72},{label:'Flach am Tisch',pos:[-40,40,200],target:[0,10,0]},{label:'Von der Lampe',pos:[-130,70,-50],target:[0,8,0]}],
  hint:'Lampe und Ring ziehen · daneben: Ansicht drehen'});
var glass,lamp,ring,beam,glow,lot,arcs,dots,pulse,labs=[],pathPts=[],pathLen=0;
if(v.ok){
  v.labDefaults({shadowSize:300,key:1.3,room:{cx:0,cz:-400,w:6000,d:5200,floorY:-764,h:3000}});
  v.scene.add(makeTable(1600,900,0,{}));
  var board=new T3.Mesh(new T3.BoxGeometry(SW+30,3,SH+30),stdMat(0xe9ecef,0.7));board.position.y=-1.3;board.receiveShadow=true;v.scene.add(board);
  var paper=new T3.Mesh(new T3.PlaneGeometry(SW,SH),stdMat(0x1d2027,0.85));paper.rotation.x=-Math.PI/2;paper.position.y=0.25;paper.receiveShadow=true;v.scene.add(paper);
  var pg=makeGrid(SW,SH,10,0x5d6474);pg.position.y=0.35;v.scene.add(pg);
  glass=new GlassBody(v.scene,{op:0.32});
  lamp=new Lamp3D(v.scene,{w:8});ring=new RingHandle(v.scene);
  beam=new Lines(v.scene,{width:3.2});glow=new Lines(v.scene,{width:11,opacity:0.22});
  lot=new Lines(v.scene,{width:1.6,dashed:true,dash:3,gap:3,additive:false,layer:1});arcs=new Lines(v.scene,{width:2.6,additive:false});
  dots=new T3.Group();v.scene.add(dots);
  pulse=glowSprite([1,0.75,0.6],10,1.6);v.scene.add(pulse);
  v.addHandle({obj:lamp.hit,plane:function(){return new T3.Plane(V3(0,1,0),-HB);},keepOffset:true,origin:function(){return W(E.lx,E.ly);},
    move:function(p){E.lx=clamp(p.x+CX,2,SW-2);E.ly=clamp(p.z+CY,2,SH-2);draw();}});
  v.addHandle({obj:ring.hit,plane:function(){return new T3.Plane(V3(0,1,0),-HB);},
    move:function(p){var x=p.x+CX,y=p.z+CY;if(Math.hypot(x-E.lx,y-E.ly)<2)return;E.dir=Math.atan2(y-E.ly,x-E.lx)/DEG;draw();}});
  /* Lichtpunkt läuft den Strahl entlang (zeigt die Laufrichtung) */
  v.anim=function(t){if(!pathLen)return false;var s=(t*0.06)%pathLen,i=0;while(i<pathPts.length-2&&s>pathPts[i].L)i++;
    var a=pathPts[i],b=pathPts[i+1],u=(s-(a.L-a.seg))/a.seg;u=clamp(u,0,1);pulse.position.lerpVectors(a.p0,a.p1,u);return true;};
}
var lastShape='';
var RED=[1.0,0.12,0.08];
function draw(){
  var S0=shapeE(),P=S0.pts,ux=Math.cos(E.dir*DEG),uy=Math.sin(E.dir*DEG),offs=E.beam==='one'?[0]:[-5,0,5],main=null,S=[],Gs=[];
  offs.forEach(function(o){var r=traceShapes(E.lx-uy*o,E.ly+ux*o,ux,uy,[S0],NG);if(o===0)main=r;
    var pts=r.path.slice();var n=pts.length;pts[n-1]=clipEnd(pts[n-2],pts[n-1],-50,-40,SW+50,SH+40);
    if(o===0){pathPts=[];pathLen=0;for(var i=1;i<pts.length;i++){var p0=W(pts[i-1][0],pts[i-1][1],HB+0.6),p1=W(pts[i][0],pts[i][1],HB+0.6),sg=p0.distanceTo(p1);if(sg<1e-6)continue;pathLen+=sg;pathPts.push({p0:p0,p1:p1,seg:sg,L:pathLen});}}
    var w3=pts.map(function(q){return W(q[0],q[1]);});
    S=S.concat(polySegs(w3,scaleC(RED,o===0?1.6:1.2)));Gs=Gs.concat(polySegs(w3,scaleC(RED,0.9)));});
  var lines=[],L=[],A=[];
  if(v.ok){
    var k=E.shape+'|'+E.rot;if(k!==lastShape){lastShape=k;glass.set([P],mp,HG,0.4);}
    beam.set(S);glow.set(Gs);
    lamp.group.position.copy(W(E.lx,E.ly));lamp.group.position.y=7;lamp.group.rotation.y=-E.dir*DEG;
    ring.group.position.copy(W(E.lx+ux*HD,E.ly+uy*HD,HB));
    clearGroup(dots);
    main.hits.forEach(function(H){var s=glowSprite([1,0.2,0.12],9,0.9);s.position.copy(W(H.x,H.y));dots.add(s);});
    labs.forEach(function(l){v.scene.remove(l);});labs=[];
  }
  if(E.lot)main.hits.slice(0,4).forEach(function(H,k){
    if(E.spot!=='alle'&&String(k+1)!==E.spot)return;
    L.push(seg(W(H.x+H.nx*22,H.y+H.ny*22),W(H.x-H.nx*22,H.y-H.ny*22),[1,1,1]));
    if(E.win){
      var a=Math.acos(clamp(-(H.u0[0]*H.nx+H.u0[1]*H.ny),-1,1))/DEG;
      arc(H.x,H.y,[H.nx,H.ny],[-H.u0[0],-H.u0[1]],'#ffd43b','α'+(k+1));
      var b;
      if(H.tir){b=a;arc(H.x,H.y,[H.nx,H.ny],H.u1,'#ff8787','');}
      else{b=Math.acos(clamp(-(H.u1[0]*H.nx+H.u1[1]*H.ny),-1,1))/DEG;arc(H.x,H.y,[-H.nx,-H.ny],H.u1,'#69db7c','β'+(k+1));}
      lines.push('<b>Stelle '+(k+1)+'</b> ('+(H.into?'Luft → Glas':'Glas → Luft')+'): α'+(k+1)+' = '+fmt(a,0)+'°, '+(H.tir?'<b>kein Licht kommt heraus</b> – es wird ganz zurückgeworfen (mehr dazu in Station 4)':'β'+(k+1)+' = '+fmt(b,0)+'°'));
    }
  });
  function arc(x,y,v1,v2,col,lab){var a1=Math.atan2(v1[1],v1[0]),a2=Math.atan2(v2[1],v2[0]),d=a2-a1;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;
    var r=11,c=lin(col),pts=[];for(var i=0;i<=24;i++){var t=a1+d*i/24;pts.push(W(x+Math.cos(t)*r,y+Math.sin(t)*r,HB+0.3));}A=A.concat(polySegs(pts,c));
    if(lab&&v.ok){var m=a1+d/2,l=label3d(lab,'plain big');l.el.style.color=col;l.position.copy(W(x+Math.cos(m)*(r+7),y+Math.sin(m)*(r+7),HB+1));v.scene.add(l);labs.push(l);}}
  if(v.ok){lot.set(L);arcs.set(A);v.request();}
  $('#angList').innerHTML=E.win?lines.join('<br>'):(E.lot?'Tippe auf „Winkel einzeichnen“, um die Winkel zu sehen.':'');
}
new Seg($('#segE'),[{key:'quader',label:'Quader'},{key:'prisma',label:'Prisma'},{key:'kreis',label:'Glaszylinder'},{key:'halb',label:'Halbzylinder'},{key:'linse',label:'Linse'}],E.shape,function(k){E.shape=k;sRot.enable(k!=='kreis');draw();});
new Seg($('#segEB'),[{key:'one',label:'ein Strahl'},{key:'three',label:'schmales Bündel'}],E.beam,function(k){E.beam=k;draw();});
var sRot=new Slider($('#sRot'),{label:'Glaskörper drehen',min:-90,max:90,value:0,step:1,round:1,fmt:function(v){return fmt(v,0)+'°';},onChange:function(v){E.rot=v;draw();}});
new Seg($('#segSpot'),[{key:'alle',label:'allen Stellen'},{key:'1',label:'Stelle 1'},{key:'2',label:'Stelle 2'},{key:'3',label:'Stelle 3'}],E.spot,function(k){E.spot=k;draw();});
var tLot=new Toggle($('#btnLot'),'Lot einzeichnen',false,function(on){E.lot=on;if(!on){E.win=false;tWin.set(false);}draw();});
var tWin=new Toggle($('#btnWin'),'Winkel einzeichnen',false,function(on){E.win=on;if(on){E.lot=true;tLot.set(true);}draw();});
function unlock(scroll){$('#lotCtl').style.display='';lsSet('lk3g-frei','1');if(scroll)$('#vE').scrollIntoView({behavior:'smooth',block:'start'});}
$('#unlock').addEventListener('click',function(){unlock(true);});
if(lsGet('lk3g-frei')==='1')unlock(false);
draw();
})();
persistInputs('lk3g');setupCopy($('#copy'),'Lochkamera – Station 3');
