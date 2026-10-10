(function(){
var LENSES={A:40,B:100,C:200,D:500,E:-100,F:-200};
var LCOL={40:'#ff922b',100:'#ff6b6b',200:'#69db7c',500:'#4dabf7'};
var VIEWS={nah:{L:700,R:700},weit:{L:4600,R:1300}};
var LENS_D=50; // Linse fest 50 mm, davor die Blende mit Öffnung d
var st={view:'nah',lens:'B',g:400,b:130,d:30,G:60,focus:false,fpts:false,special:false,construct:false};
var shift=0; // Lage der Linse auf der Bank (0 = Mitte)
function f(){return LENSES[st.lens];}
function bImg(){var F=f();if(Math.abs(st.g-F)<0.5)return Infinity;return st.g*F/(st.g-F);}
function blurD(){return blurDiameter(st.d,st.b,st.g,f());}
/* scharf = Schirm höchstens 1 % (mindestens 1 mm) neben der richtigen Bildweite */
function isSharp(){var F=f(),bi=bImg();return F>0&&isFinite(bi)&&bi>0&&Math.abs(st.b-bi)<=Math.max(1,0.01*bi);}
function mm(v,d){return fmt(v,d===undefined?(Math.abs(v)<20?1:0):d)+' mm';}
var BUND=[{k:1,col:'#ff922b'},{k:0.5,col:'#ffe066'},{k:0,col:'#4dabf7'}];
var SW=150,SH=110,RAILY=-110,TABY=-128;
window.LAB={f:f,st:st,isSharp:isSharp,SW:SW,SH:SH};

/* ---------- 3D: optische Bank ---------- */
function frame(){var V=VIEWS[st.view],c=(st.view==='nah'?-60:-1500),w=V.L+V.R;return {pos:[c+w*0.05,w*0.16,w*0.6],target:[c,0,0]};}
var v=new View3D($('#v6'),{shadows:true,aspect:2.1,maxVH:0.66,pos:frame().pos,target:frame().target,near:3,far:60000,maxDist:9000,ctl:'#ctl6',
  presets:[{label:'Von der Seite',pos:function(){var V=VIEWS[st.view],c=(V.R-V.L)/2;return [c,-20,(V.L+V.R)*0.8];},target:function(){var V=VIEWS[st.view];return [(V.R-V.L)/2,-20,0];}},
           {label:'Kerze von nah',pos:function(){return [shift-st.g+160,60,260];},target:function(){return [shift-st.g,0,0];}},
           {label:'Hinter dem Schirm',pos:function(){return [shift+st.b+280,40,90];},target:function(){return [shift+st.b,0,0];}},
           {label:'Linse von nah',pos:function(){return [shift+90,50,170];},target:function(){return [shift,0,0];}}]});
var D3={};
if(v.ok){(function(){var sc=v.scene;v.labDefaults({shadowSize:2600,key:1.1,hemi:0.7,tx:-200,room:{cx:-1600,cz:0,w:16000,d:12000,floorY:TABY-764,h:3600}});
  var tab=makeTable(9000,1400,TABY,{});tab.position.x=-1600;sc.add(tab);
  var root=D3.root=new T3.Group();sc.add(root);var s=root;
  // Schiene mit Maßband (1 Kästchen = 1 cm, Zahlen in cm) – bleibt fest auf dem Tisch
  var tick=canvasTex(1024,128,function(c,w,h){c.fillStyle='#d9dde3';c.fillRect(0,0,w,h);c.fillStyle='#1d2230';for(var i=0;i<100;i++){var x=i/100*w,L=i%10===0?h*0.62:(i%5===0?h*0.42:h*0.25);c.fillRect(x,0,i%10===0?4:2,L);}});
  tick.wrapS=T3.RepeatWrapping;
  D3.railMat=[stdMat(0xb8bec8,0.35,0.85),stdMat(0xb8bec8,0.35,0.85),stdMat(0xffffff,0.5,0.1,{map:tick}),stdMat(0xb8bec8,0.35,0.85),stdMat(0xb8bec8,0.35,0.85),stdMat(0xb8bec8,0.35,0.85)];
  D3.rail=new T3.Mesh(new T3.BoxGeometry(1,16,34),D3.railMat);D3.rail.castShadow=true;D3.rail.receiveShadow=true;sc.add(D3.rail);
  D3.feet=new T3.Group();sc.add(D3.feet);D3.tick=tick;
  function rider(h){var g=new T3.Group();var m=stdMat(0x30343c,0.45,0.6);var r=new T3.Mesh(new T3.BoxGeometry(44,22,50),m);r.position.y=RAILY+8+11;r.castShadow=true;g.add(r);
    var knob=new T3.Mesh(new T3.CylinderGeometry(4,4,10,16),stdMat(0x111111,0.5));knob.rotation.x=Math.PI/2;knob.position.set(0,RAILY+19,29);g.add(knob);
    var post=new T3.Mesh(new T3.CylinderGeometry(4,4,1,16),stdMat(0xc8ccd3,0.25,0.9));post.castShadow=true;g.add(post);g.userData.post=post;g.userData.setTop=function(top){var y0=RAILY+30;post.scale.y=Math.max(top-y0,1);post.position.y=(top+y0)/2;};g.userData.setTop(h);return g;}
  // Kerze (mittig auf der Achse)
  D3.cg=new T3.Group();s.add(D3.cg);D3.cR=rider(-33);D3.cg.add(D3.cR);D3.cA=new T3.Group();D3.cg.add(D3.cA);
  var plate=new T3.Mesh(new T3.CylinderGeometry(16,18,3,40),stdMat(0xb08d57,0.35,0.85));plate.position.y=-1.5;plate.castShadow=true;D3.cA.add(plate);
  D3.cHit=new T3.Mesh(new T3.BoxGeometry(70,260,70),new T3.MeshBasicMaterial({visible:false}));D3.cg.add(D3.cHit);D3.candle=null;D3.cGsize=-1;
  // Linse mit Blende
  D3.lens=new Lens3D(s);D3.lR=rider(-LENS_D/2-3);s.add(D3.lR);
  D3.irisMat=sharedMat(stdMat(0x1c1f25,0.45,0.7));D3.iris=null;D3.irisD=-1;
  D3.lHit=new T3.Mesh(new T3.BoxGeometry(40,LENS_D+40,LENS_D+40),new T3.MeshBasicMaterial({visible:false}));s.add(D3.lHit);
  // Schirm mit dem Bild
  D3.tex=new T3.CanvasTexture($('#scr'));D3.tex.colorSpace=T3.SRGBColorSpace;
  D3.sg=new T3.Group();s.add(D3.sg);var sg=new T3.PlaneGeometry(SW,SH);sg.rotateY(Math.PI/2);
  var scrMesh=new T3.Mesh(sg,new T3.MeshBasicMaterial({map:D3.tex,side:T3.DoubleSide,toneMapped:false}));scrMesh.layers.set(1);D3.sg.add(scrMesh);
  var fm=stdMat(0x3a3f4a,0.8);[[0,(SH+6)/2,0,4,6,SW+12],[0,-(SH+6)/2,0,4,6,SW+12],[0,0,(SW+6)/2,4,SH,6],[0,0,-(SW+6)/2,4,SH,6]].forEach(function(q){var m=new T3.Mesh(new T3.BoxGeometry(q[3],q[4],q[5]),fm);m.position.set(q[0]+1.5,q[1],q[2]);m.castShadow=true;m.layers.set(1);D3.sg.add(m);});
  D3.sR=rider(-SH/2-6);D3.sg.add(D3.sR);D3.sR.traverse(function(o){o.layers.set(1);});
  D3.sHit=new T3.Mesh(new T3.BoxGeometry(30,SH+20,SW+20),new T3.MeshBasicMaterial({visible:false}));D3.sg.add(D3.sHit);
  // Strahlen, Hilfen
  D3.bs=new BundleSet(s);D3.bs.discs.visible=false;
  D3.spec=new Lines(s,{width:3,additive:false});D3.specV=new Lines(s,{width:2,dashed:true,dash:7,gap:6,additive:false});D3.plane=new Lines(s,{width:1.5,dashed:true,dash:5,gap:6,additive:false});
  D3.axis=new Lines(s,{width:1.2,dashed:true,dash:8,gap:8,additive:false,layer:1});
  D3.dims=new Lines(s,{width:1.4,additive:false});D3.lg=label3d('','plain');D3.lb=label3d('','plain');s.add(D3.lg);s.add(D3.lb);
  D3.fp=new T3.Group();s.add(D3.fp);D3.img=new T3.Group();s.add(D3.img);
  D3.fpMat=sharedMat(new T3.MeshBasicMaterial({color:0xffffff,toneMapped:false}));D3.fpGeo=[new T3.SphereGeometry(4,16,12),new T3.SphereGeometry(3,16,12)];
  D3.names=[label3d('Kerze','dim'),label3d('Linse','dim'),label3d('Schirm','dim')];D3.names.forEach(function(l){s.add(l);});
  v.anim=function(t){if(D3.candle){D3.candle.userData.tick(t);return true;}return false;};
  v.addHandle({obj:D3.cg,plane:function(p){return v.axisPlane(p,V3(1,0,0));},keepOffset:true,origin:function(){return V3(shift-st.g,0,0);},
    move:function(p){st.g=Math.round(clamp(shift-p.x,sG.o.min,sG.o.max));sG.set(st.g,false);upd();}});
  v.addHandle({obj:D3.sHit,plane:function(p){return v.axisPlane(p,V3(1,0,0));},keepOffset:true,origin:function(){return V3(shift+st.b,0,0);},
    move:function(p){st.b=Math.round(clamp(p.x-shift,sB.o.min,sB.o.max));sB.set(st.b,false);upd();}});
  /* Linse verschieben: Kerze und Schirm bleiben stehen, g und b ändern sich gemeinsam */
  v.addHandle({obj:D3.lHit,plane:function(p){return v.axisPlane(p,V3(1,0,0));},keepOffset:true,origin:function(){return V3(shift,0,0);},
    move:function(p){var V=VIEWS[st.view],d=Math.round(p.x-shift),g2=st.g+d,b2=st.b-d;
      if(g2<sG.o.min||g2>sG.o.max||b2<sB.o.min||b2>sB.o.max)return;
      shift+=d;if(shift-g2<-V.L-60||shift+b2>V.R+60){shift-=d;return;}
      st.g=g2;st.b=b2;sG.set(st.g,false);sB.set(st.b,false);upd();}});
})();}
function arrowMesh(x,y1,y2,mat){var g=new T3.Group(),h=Math.abs(y2-y1),dir=y2>y1?1:-1,head=Math.min(12,h*0.4);
  var cyl=new T3.Mesh(new T3.CylinderGeometry(1.6,1.6,Math.max(h-head,0.1),12),mat);cyl.position.set(x,y1+dir*(h-head)/2,0);g.add(cyl);
  var cone=new T3.Mesh(new T3.ConeGeometry(4.5,head,16),mat);cone.position.set(x,y2-dir*head/2,0);if(dir<0)cone.rotation.z=Math.PI;g.add(cone);return g;}
var lastView='',imgMat=null;
function draw3D(){if(!v.ok)return;var V=VIEWS[st.view],F=f(),g=st.g,b=st.b,d=st.d,G=st.G,Gt=G/2,bi=bImg(),xR=V.R-shift;
  D3.root.position.x=shift;
  if(lastView!==st.view){lastView=st.view;var x0=-V.L-80,x1=V.R+80,L=x1-x0;D3.rail.scale.x=L;D3.rail.position.set((x0+x1)/2,RAILY,0);
    D3.tick.repeat.set(L/100,1);D3.tick.offset.x=((x0%100)+100)%100/100;D3.tick.needsUpdate=true;
    clearGroup(D3.feet);[x0+60,x1-60].forEach(function(x){var ft=new T3.Mesh(new T3.BoxGeometry(40,-(TABY-RAILY)-8,140),stdMat(0x2a2e36,0.6,0.4));ft.position.set(x,(TABY+RAILY-8)/2,0);ft.castShadow=true;D3.feet.add(ft);});}
  if(D3.cGsize!==G){D3.cGsize=G;if(D3.candle){D3.cA.remove(D3.candle);disposeDeep(D3.candle);}D3.candle=makeCandle(G,{});D3.cA.add(D3.candle);D3.cA.position.y=-Gt;D3.cR.userData.setTop(-Gt-3);}
  D3.cg.position.x=-g;D3.sg.position.x=b;D3.lR.position.x=0;
  D3.lens.set(LENS_D,1/F,true);D3.lens.group.traverse(function(o){o.layers.set(1);});
  /* Blende */
  if(Math.abs(D3.irisD-d)>1e-3){D3.irisD=d;if(D3.iris){D3.root.remove(D3.iris);D3.iris.geometry.dispose();}
    var gI=new T3.RingGeometry(Math.min(d/2,LENS_D/2),LENS_D/2+6,64,1);gI.rotateY(Math.PI/2);D3.iris=new T3.Mesh(gI,D3.irisMat);D3.iris.position.x=-5;D3.root.add(D3.iris);}
  D3.iris.visible=d<LENS_D-0.1;
  var faint=st.special?0.35:1;
  D3.bs.update({pts:BUND.map(function(p){return {y:p.k*G-Gt,col:p.col};}),g:g,b:b,d:d,P:1/F,nRays:7,beyond:xR,focus:st.focus,markR:3,k:faint,N:40});
  D3.axis.set([seg(V3(-V.L-shift,0,0),V3(xR,0,0),[0.6,0.65,0.75])]);
  // Brennpunkte
  clearGroup(D3.fp);
  if(st.fpts){var a=Math.abs(F),sg=F>0?1:-1;[[-sg*a,'F',0],[sg*a,'F′',0],[-sg*2*a,'2F',1],[sg*2*a,'2F′',1]].forEach(function(p){if(p[0]+shift<-V.L||p[0]+shift>V.R)return;
    var m=new T3.Mesh(D3.fpGeo[p[2]],D3.fpMat);m.position.set(p[0],0,0);m.layers.set(1);D3.fp.add(m);
    var l=label3d(p[1],'plain big');l.position.set(p[0],-18,0);D3.fp.add(l);});}
  // besondere Strahlen (von der Flammenspitze)
  var virt=bi<0,S=[],SV=[],PL=[],xL=-V.L-shift;
  function c(col){return lin(col);}
  if(st.special){PL.push(seg(V3(0,-150,0),V3(0,150,0),lin('#a5d8ff')));
    /* Parallelstrahl */
    S.push(seg(V3(-g,Gt,0),V3(0,Gt,0),c('#ff6b6b')));S.push(seg(V3(0,Gt,0),V3(xR,Gt-Gt/F*xR,0),c('#ff6b6b')));if(virt||F<0)SV.push(seg(V3(0,Gt,0),V3(xL,Gt+Gt/F*(-xL),0),scaleC(c('#ff6b6b'),0.8)));
    /* Mittelpunktstrahl */
    S.push(seg(V3(-g,Gt,0),V3(0,0,0),c('#69db7c')));S.push(seg(V3(0,0,0),V3(xR,-Gt/g*xR,0),c('#69db7c')));if(virt)SV.push(seg(V3(0,0,0),V3(xL,-Gt/g*xL,0),scaleC(c('#69db7c'),0.8)));
    /* Brennpunktstrahl */
    if(isFinite(bi)){var hf=-Gt*F/(g-F),cc=c('#da77f2');
      if(F>0&&g<F){SV.push(seg(V3(-F,0,0),V3(-g,Gt,0),cc));S.push(seg(V3(-g,Gt,0),V3(0,hf,0),cc));}
      else{S.push(seg(V3(-g,Gt,0),V3(0,hf,0),cc));if(F<0)SV.push(seg(V3(0,hf,0),V3(-F,0,0),scaleC(cc,0.8)));}
      S.push(seg(V3(0,hf,0),V3(xR,hf,0),cc));if(virt)SV.push(seg(V3(0,hf,0),V3(xL,hf,0),scaleC(cc,0.8)));}}
  D3.spec.set(S);D3.specV.set(SV);D3.plane.set(PL);
  // Bild einzeichnen (vom Bild des Fußes zum Bild der Spitze)
  clearGroup(D3.img);
  if(st.construct&&isFinite(bi)&&bi>xL&&bi<xR){var yT=-Gt*bi/g,yF=Gt*bi/g;
    if(!imgMat)imgMat=sharedMat(new T3.MeshBasicMaterial({color:0xffa94d,transparent:true,toneMapped:false}));imgMat.opacity=virt?0.55:1;
    D3.img.add(arrowMesh(bi,yF,yT,imgMat));D3.img.traverse(function(o){o.layers.set(1);});
    var l=label3d(virt?'Bild (virtuell)':'Bild','plain');l.el.style.color='#ffa94d';l.position.set(bi,yT+(yT>0?14:-14),0);D3.img.add(l);}
  // Maße g und b
  var yD=RAILY+50,z=0,Dm=[],w=[0.85,0.88,0.95];
  function dim(x1,x2,yy){Dm.push(seg(V3(x1,yy,z),V3(x2,yy,z),w));Dm.push(seg(V3(x1,yy-6,z),V3(x1,yy+6,z),w));Dm.push(seg(V3(x2,yy-6,z),V3(x2,yy+6,z),w));}
  dim(-g,0,yD);dim(0,b,yD);D3.dims.set(Dm);
  D3.lg.el.textContent='g = '+mm(g,0);D3.lg.position.set(-g/2,yD+12,0);D3.lb.el.textContent='b = '+mm(b,0);D3.lb.position.set(b/2,yD+12,0);
  D3.names[0].position.set(-g,Gt+28,0);D3.names[1].position.set(0,LENS_D/2+22,0);D3.names[2].position.set(b,SH/2+18,0);
  v.request();}

/* ---------- Bild auf dem Schirm: echte Abbildung der 3D-Szene ---------- */
var scr=new ScreenCam($('#scr'),{W:480,H:352,sw:SW,sh:SH});
scr.onRender=function(){if(v.ok){D3.tex.needsUpdate=true;v.request();}};
var pend=false;
function renderScreen(){if(pend||!v.ok)return;pend=true;requestAnimationFrame(function(){pend=false;
  var R=blurD()/2,E=relBrightness(st.d,st.b),sc=v.scene,env=sc.environment,fog=sc.fog;sc.environment=null;sc.fog=null;
  scr.render(sc,st.b,R,screenGain(E,300),{pos:V3(shift,0,0),near:14,far:40000,layers:0});sc.environment=env;sc.fog=fog;
});}
function caseText(){var F=f(),g=st.g;if(!(F>0))return '';
  if(Math.abs(g-2*F)<=0.03*2*F)return 'Die Kerze steht genau bei 2F.';
  if(g>2*F)return 'Die Kerze steht weiter weg als 2F.';
  if(Math.abs(g-F)<=0.02*F)return 'Die Kerze steht genau bei F.';
  if(g>F)return 'Die Kerze steht zwischen 2F und F.';
  return 'Die Kerze steht näher an der Linse als F.';}
function upd(){
  draw3D();renderScreen();
  var D=blurD(),F=f(),bi=bImg(),msg,sharp=isSharp();
  $('#mD').textContent=fmtLen(D);$('#mS').innerHTML=sharp?'<span class="ok">ja ✓</span>':'nein';
  var Bfull=st.G*st.b/st.g;
  if(sharp)msg='<span class="ok">✓ Das Bild ist scharf!</span>'+(Bfull>SH?' <span class="warnline">Aber das Bild (B ≈ '+fmt(Bfull,0)+' mm) ist größer als der Schirm (110 mm).</span>':'');
  else if(F<0)msg='<span class="no">Mit einer Zerstreuungslinse entsteht kein Bild auf dem Schirm.</span>';
  else if(Math.abs(st.g-F)<0.5)msg='<span class="no">Die Kerze steht genau im Brennpunkt: Die Strahlen laufen hinter der Linse parallel. Es gibt kein Bild auf dem Schirm, egal wo er steht.</span>';
  else if(!(bi>0))msg='<span class="no">Kein Bild auf dem Schirm – die Kerze steht näher als F. Durch die Linse sähe man ein vergrößertes, aufrechtes Bild (Lupe).</span>';
  else if(bi>sB.o.max)msg='<span class="no">Das scharfe Bild liegt weiter weg, als die Bank reicht.</span>'+(st.view==='nah'?' Wählt die weite Bank.':'');
  else msg='<span class="small">unscharf – verschiebt den Schirm</span>';
  $('#sharpMsg').innerHTML=msg;
  var ct=caseText(),cm=$('#caseMsg');cm.style.display=ct&&(st.fpts||approach.run)?'':'none';cm.textContent=ct;
}
var sG=new Slider($('#sG'),{label:'Abstand Kerze – Linse g',min:20,max:680,value:st.g,log:true,step:1,round:1,fmt:function(v){return fmt(v,0)+' mm';},onChange:function(v){approach.stop();st.g=v;upd();}});
var sB=new Slider($('#sB'),{label:'Abstand Linse – Schirm b',min:10,max:685,value:st.b,log:true,step:1,round:1,fmt:function(v){return fmt(v,0)+' mm';},onChange:function(v){approach.stop();st.b=v;upd();}});
var sD=new Slider($('#sD'),{label:'Öffnung d der Blende',min:5,max:50,value:st.d,step:1,round:1,fmt:function(v){return fmt(v,0)+' mm';},onChange:function(v){st.d=v;upd();}});
var sH=new Slider($('#sH'),{label:'Kerzengröße G',min:20,max:150,value:st.G,step:5,round:5,fmt:function(v){return fmt(v,0)+' mm';},onChange:function(v){st.G=v;upd();}});
function ranges(){var V=VIEWS[st.view];shift=0;sG.o.max=V.L-20;sB.o.max=V.R-15;st.g=clamp(st.g,sG.o.min,sG.o.max);st.b=clamp(st.b,sB.o.min,sB.o.max);sG.set(st.g,false);sB.set(st.b,false);}
var segView=new Seg($('#segView'),[{key:'nah',label:'nah (Bank 1,5 m)'},{key:'weit',label:'weit (Bank 6 m)'}],st.view,function(k){st.view=k;ranges();upd();if(v.ok)v.goTo(frame());});
new Seg($('#segLens'),Object.keys(LENSES).map(function(k){var F=LENSES[k];return {key:k,label:k+' <span class="small" style="color:inherit">('+(F<0?'−':'')+Math.abs(F)+' mm)</span>'};}),st.lens,function(k){
  st.lens=k;approach.stop();if(Math.abs(LENSES[k])>=500&&st.view==='nah'){st.view='weit';segView.set('weit',false);ranges();if(v.ok)v.goTo(frame());}upd();});
var HL={focus:'Scharfen Bildpunkt',fpts:'Brennpunkte F',special:'Besondere Strahlen',construct:'Bild einzeichnen'};
$$('#helpBtns button').forEach(function(btn){var k=btn.dataset.k;new Toggle(btn,HL[k],st[k],function(on){st[k]=on;upd();});});
/* Kerze fährt heran: Der Schirm stellt sich dabei immer scharf */
var approach=new AnimButton($('#approach'),'▶ Kerze fährt heran',12000,function(u){var F=f(),bR=sB.o.max;
  if(!(F>0)){approach.stop();$('#sharpMsg').innerHTML='<span class="no">Das geht nur mit einer Sammellinse (A–D).</span>';return;}
  var g0=Math.min(sG.o.max,Math.max(6*F,300)),g1=Math.max(sG.o.min,F*bR/(bR-F)*1.01);
  if(g1>=g0){approach.stop();$('#sharpMsg').innerHTML='<span class="no">Die Bank ist zu kurz – wählt die weite Bank.</span>';return;}
  st.g=g0*Math.pow(g1/g0,u);st.b=clamp(st.g*F/(st.g-F),sB.o.min,bR);sG.set(st.g,false);sB.set(st.b,false);upd();});
function goLab(){$('#lab').scrollIntoView({behavior:'smooth',block:'start'});}
$('#goLab').addEventListener('click',function(){goLab();if(v.ok)v.goTo({pos:[-60+shift,10,900],target:[-60+shift,0,0]});});$('#goLab2').addEventListener('click',goLab);
ranges();upd();
})();
