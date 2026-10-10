
(function(){
var LENSES={A:40,B:100,C:200,D:500,E:-100,F:-200};
var LCOL={40:'#ff922b',100:'#ff6b6b',200:'#69db7c',500:'#4dabf7'};
var VIEWS={nah:{L:640,R:460},weit:{L:2400,R:1200}};
var st={view:'nah',lens:'B',g:400,b:130,d:30,G:60,focus:false,fpts:false,special:false,construct:false};
function f(){return LENSES[st.lens];}
function bImg(){var F=f();if(Math.abs(st.g-F)<0.5)return Infinity;return st.g*F/(st.g-F);}
function blurD(){return blurDiameter(st.d,st.b,st.g,f());}
function isSharp(){return blurD()<0.4;}
function mm(v,d){return fmt(v,d===undefined?(Math.abs(v)<20?1:0):d)+' mm';}
var BUND=[{k:1,col:'#ff922b'},{k:0.5,col:'#ffe066'},{k:0,col:'#4dabf7'}];
var SW=150,SH=110,RAILY=-110,TABY=-128;

/* ---------- 3D: optische Bank ---------- */
function frame(){var V=VIEWS[st.view],c=(st.view==='nah'?-90:-560),w=V.L+V.R;return {pos:[c+w*0.1,w*0.36,w*0.86],target:[c,-40,0]};}
var v=new View3D($('#v6'),{shadows:true,aspect:2.1,maxVH:0.66,pos:frame().pos,target:frame().target,near:3,far:40000,maxDist:9000,
  presets:[{label:'Von der Seite',pos:function(){var V=VIEWS[st.view],c=(V.R-V.L)/2;return [c,-20,(V.L+V.R)*0.8];},target:function(){var V=VIEWS[st.view];return [(V.R-V.L)/2,-20,0];}},
           {label:'Kerze von nah',pos:function(){return [-st.g+160,60,260];},target:function(){return [-st.g,st.G*0.5,0];}},
           {label:'Hinter dem Schirm',pos:function(){return [st.b+280,40,90];},target:function(){return [st.b,0,0];}},
           {label:'Linse von nah',pos:[90,50,170],target:[0,0,0]}]});
var D3={};
if(v.ok){(function(){var s=v.scene;v.labDefaults({shadowSize:2600,key:1.1,hemi:0.7,tx:-200});
  var tab=makeTable(9000,1400,TABY,{});tab.position.x=-600;s.add(tab);
  // Schiene mit Maßband (1 Kästchen = 1 cm, Zahlen in cm)
  var tick=canvasTex(1024,128,function(c,w,h){c.fillStyle='#d9dde3';c.fillRect(0,0,w,h);c.fillStyle='#1d2230';for(var i=0;i<100;i++){var x=i/100*w,L=i%10===0?h*0.62:(i%5===0?h*0.42:h*0.25);c.fillRect(x,0,i%10===0?4:2,L);}});
  tick.wrapS=T3.RepeatWrapping;
  D3.railMat=[stdMat(0xb8bec8,0.35,0.85),stdMat(0xb8bec8,0.35,0.85),stdMat(0xffffff,0.5,0.1,{map:tick}),stdMat(0xb8bec8,0.35,0.85),stdMat(0xb8bec8,0.35,0.85),stdMat(0xb8bec8,0.35,0.85)];
  D3.rail=new T3.Mesh(new T3.BoxGeometry(1,16,34),D3.railMat);D3.rail.castShadow=true;D3.rail.receiveShadow=true;s.add(D3.rail);
  D3.feet=new T3.Group();s.add(D3.feet);D3.tick=tick;
  function rider(h){var g=new T3.Group();var m=stdMat(0x30343c,0.45,0.6);var r=new T3.Mesh(new T3.BoxGeometry(44,22,50),m);r.position.y=RAILY+8+11;r.castShadow=true;g.add(r);
    var knob=new T3.Mesh(new T3.CylinderGeometry(4,4,10,16),stdMat(0x111111,0.5));knob.rotation.x=Math.PI/2;knob.position.set(0,RAILY+19,29);g.add(knob);
    var post=new T3.Mesh(new T3.CylinderGeometry(4,4,1,16),stdMat(0xc8ccd3,0.25,0.9));post.castShadow=true;g.add(post);g.userData.post=post;g.userData.setTop=function(top){var y0=RAILY+30;post.scale.y=Math.max(top-y0,1);post.position.y=(top+y0)/2;};g.userData.setTop(h);return g;}
  // Kerze
  D3.cg=new T3.Group();s.add(D3.cg);D3.cR=rider(-3);D3.cg.add(D3.cR);
  var plate=new T3.Mesh(new T3.CylinderGeometry(16,18,3,40),stdMat(0xb08d57,0.35,0.85));plate.position.y=-1.5;plate.castShadow=true;D3.cg.add(plate);
  D3.cHit=new T3.Mesh(new T3.BoxGeometry(70,1,70),new T3.MeshBasicMaterial({visible:false}));D3.cg.add(D3.cHit);D3.candle=null;D3.cGsize=-1;
  // Linse
  D3.lens=new Lens3D(s);D3.lR=rider(-20);s.add(D3.lR);
  // Schirm mit echtem Bild
  D3.tex=new T3.CanvasTexture($('#scr'));D3.tex.colorSpace=T3.SRGBColorSpace;
  D3.sg=new T3.Group();s.add(D3.sg);var sg=new T3.PlaneGeometry(SW,SH);sg.rotateY(Math.PI/2);
  var scrMesh=new T3.Mesh(sg,new T3.MeshBasicMaterial({map:D3.tex,side:T3.DoubleSide,toneMapped:false}));scrMesh.layers.set(1);D3.sg.add(scrMesh);
  var fm=stdMat(0x3a3f4a,0.8);[[0,(SH+6)/2,0,4,6,SW+12],[0,-(SH+6)/2,0,4,6,SW+12],[0,0,(SW+6)/2,4,SH,6],[0,0,-(SW+6)/2,4,SH,6]].forEach(function(q){var m=new T3.Mesh(new T3.BoxGeometry(q[3],q[4],q[5]),fm);m.position.set(q[0]+1.5,q[1],q[2]);m.castShadow=true;m.layers.set(1);D3.sg.add(m);});
  D3.sR=rider(-SH/2-6);D3.sg.add(D3.sR);D3.sR.traverse(function(o){o.layers.set(1);});
  D3.sHit=new T3.Mesh(new T3.BoxGeometry(30,SH+20,SW+20),new T3.MeshBasicMaterial({visible:false}));D3.sg.add(D3.sHit);
  // Strahlen, Hilfen
  D3.bs=new BundleSet(s);D3.bs.discs.visible=false;
  D3.spec=new Lines(s,{width:3,additive:false});D3.specV=new Lines(s,{width:2,dashed:true,dash:7,gap:6,additive:false});D3.plane=new Lines(s,{width:1.5,dashed:true,dash:5,gap:6,additive:false});
  D3.dims=new Lines(s,{width:1.4,additive:false});D3.lg=label3d('','plain');D3.lb=label3d('','plain');s.add(D3.lg);s.add(D3.lb);
  D3.fp=new T3.Group();s.add(D3.fp);D3.img=new T3.Group();s.add(D3.img);
  D3.names=[label3d('Kerze','dim'),label3d('Linse','dim'),label3d('Schirm','dim')];D3.names.forEach(function(l){s.add(l);});
  v.anim=function(t){if(D3.candle){D3.candle.userData.tick(t);return true;}return false;};
  v.addHandle({obj:D3.cg,plane:function(p){return v.axisPlane(p,V3(1,0,0));},keepOffset:true,origin:function(){return V3(-st.g,0,0);},move:function(p){st.g=Math.round(clamp(-p.x,sG.o.min,sG.o.max));sG.set(st.g,false);upd();}});
  v.addHandle({obj:D3.sHit,plane:function(p){return v.axisPlane(p,V3(1,0,0));},keepOffset:true,origin:function(){return V3(st.b,0,0);},move:function(p){st.b=Math.round(clamp(p.x,sB.o.min,sB.o.max));sB.set(st.b,false);upd();}});
})();}
var lastView='';
function draw3D(){if(!v.ok)return;var V=VIEWS[st.view],F=f(),g=st.g,b=st.b,d=st.d,G=st.G,bi=bImg(),xR=V.R;
  if(lastView!==st.view){lastView=st.view;var x0=-V.L-80,x1=V.R+80,L=x1-x0;D3.rail.scale.x=L;D3.rail.position.set((x0+x1)/2,RAILY,0);
    D3.tick.repeat.set(L/100,1);D3.tick.offset.x=((x0%100)+100)%100/100;D3.tick.needsUpdate=true;
    while(D3.feet.children.length)D3.feet.remove(D3.feet.children[0]);[x0+60,x1-60].forEach(function(x){var ft=new T3.Mesh(new T3.BoxGeometry(40,TABY-RAILY>0?1:-(TABY-RAILY)-8,140),stdMat(0x2a2e36,0.6,0.4));ft.position.set(x,(TABY+RAILY-8)/2,0);ft.castShadow=true;D3.feet.add(ft);});}
  if(D3.cGsize!==G){D3.cGsize=G;if(D3.candle)D3.cg.remove(D3.candle);D3.candle=makeCandle(G,{});D3.cg.add(D3.candle);}
  D3.cg.position.x=-g;D3.sg.position.x=b;D3.lR.position.x=0;D3.lR.userData.setTop(-d/2-3);
  D3.lens.set(d,1/F,true);D3.lens.group.traverse(function(o){o.layers.set(1);});
  var faint=st.special?0.35:1;
  D3.bs.update({pts:BUND.map(function(p){return {y:p.k*G,col:p.col};}),g:g,b:b,d:d,P:1/F,nRays:7,beyond:xR,focus:st.focus,markR:3,k:faint,N:40});
  // Brennpunkte
  while(D3.fp.children.length)D3.fp.remove(D3.fp.children[0]);
  if(st.fpts){var a=Math.abs(F),sg=F>0?1:-1;[[-sg*a,'F',4],[sg*a,'F′',4],[-sg*2*a,'2F',3],[sg*2*a,'2F′',3]].forEach(function(p){if(p[0]<-V.L||p[0]>V.R)return;
    var m=new T3.Mesh(new T3.SphereGeometry(p[2],16,12),new T3.MeshBasicMaterial({color:0xffffff,toneMapped:false}));m.position.set(p[0],0,0);m.layers.set(1);D3.fp.add(m);
    var l=label3d(p[1],'plain big');l.position.set(p[0],-16,0);D3.fp.add(l);});}
  // besondere Strahlen (von der Flammenspitze)
  var virt=bi<0,S=[],SV=[],PL=[];
  function sray(col,xa,ya,h0,slope){var c=lin(col);S.push(seg(V3(xa,ya,0),V3(0,h0,0),c));S.push(seg(V3(0,h0,0),V3(xR,h0+slope*xR,0),c));
    if(virt)SV.push(seg(V3(0,h0,0),V3(-V.L,h0-slope*V.L,0),scaleC(c,0.8)));}
  if(st.special){PL.push(seg(V3(0,-150,0),V3(0,150,0),lin('#a5d8ff')));
    sray('#ff6b6b',-g,G,G,-G/F);sray('#69db7c',-g,G,0,-G/g);
    if(isFinite(bi)){var hf=-G*F/(g-F);if(F>0&&g<F)sray('#da77f2',-F,0,hf,0);else sray('#da77f2',-g,G,hf,0);}}
  D3.spec.set(S);D3.specV.set(SV);D3.plane.set(PL);
  // Bild einzeichnen
  while(D3.img.children.length)D3.img.remove(D3.img.children[0]);
  if(st.construct&&isFinite(bi)&&bi>-V.L&&bi<xR){var B=-G*bi/g,col=0xffa94d,m=new T3.MeshBasicMaterial({color:col,transparent:virt,opacity:virt?0.55:1,toneMapped:false}),hB=Math.abs(B),dir=B>0?1:-1,head=Math.min(12,hB*0.4);
    var cyl=new T3.Mesh(new T3.CylinderGeometry(1.6,1.6,Math.max(hB-head,0.1),12),m);cyl.position.set(bi,dir*(hB-head)/2,0);D3.img.add(cyl);
    var cone=new T3.Mesh(new T3.ConeGeometry(4.5,head,16),m);cone.position.set(bi,dir*(hB-head/2),0);if(dir<0)cone.rotation.z=Math.PI;D3.img.add(cone);
    D3.img.traverse(function(o){o.layers.set(1);});var l=label3d(virt?'Bild (virtuell)':'Bild','plain');l.el.style.color='#ffa94d';l.position.set(bi,B+dir*14,0);D3.img.add(l);}
  // Maße g und b
  var yD=RAILY+50,z=0,Dm=[],w=[0.85,0.88,0.95];
  function dim(x1,x2,yy){Dm.push(seg(V3(x1,yy,z),V3(x2,yy,z),w));Dm.push(seg(V3(x1,yy-6,z),V3(x1,yy+6,z),w));Dm.push(seg(V3(x2,yy-6,z),V3(x2,yy+6,z),w));}
  dim(-g,0,yD);dim(0,b,yD);D3.dims.set(Dm);
  D3.lg.el.textContent='g = '+mm(g,0);D3.lg.position.set(-g/2,yD+10,0);D3.lb.el.textContent='b = '+mm(b,0);D3.lb.position.set(b/2,yD-12,0);
  D3.names[0].position.set(-g,G+25,0);D3.names[1].position.set(0,d/2+24,0);D3.names[2].position.set(b,SH/2+18,0);
  v.request();}

/* ---------- Bild auf dem Schirm: echte Abbildung der 3D-Szene ---------- */
var scr=new ScreenCam($('#scr'),{W:480,H:352,sw:SW,sh:SH});
scr.onRender=function(){if(v.ok){D3.tex.needsUpdate=true;v.request();}};
var pend=false;
function renderScreen(){if(pend||!v.ok)return;pend=true;requestAnimationFrame(function(){pend=false;
  var R=blurD()/2,E=relBrightness(st.d,st.b),sc=v.scene,env=sc.environment;sc.environment=null;
  scr.render(sc,st.b,R,screenGain(E,300),{near:14,far:40000,layers:0});sc.environment=env;
});}
function upd(){
  draw3D();renderScreen();
  var D=blurD();$('#mD').textContent=fmtLen(D);$('#mB').textContent=mm(st.G*st.b/st.g);
  var bi=bImg(),msg;
  if(isSharp())msg='<span class="ok">✓ Das Bild ist scharf!</span>';
  else if(f()<0)msg='<span class="no">Mit einer Zerstreuungslinse gibt es kein scharfes Bild.</span>';
  else if(!(bi>0))msg='<span class="no">Kein scharfes Bild möglich – die Kerze ist zu nah an der Linse.</span>';
  else msg='<span class="small">unscharf – verschiebt den Schirm</span>';
  $('#sharpMsg').innerHTML=msg;
}
var sG=new Slider($('#sG'),{label:'Abstand Kerze – Linse g',min:20,max:680,value:st.g,log:true,step:1,round:1,fmt:function(v){return fmt(v,0)+' mm';},onChange:function(v){st.g=v;upd();}});
var sB=new Slider($('#sB'),{label:'Abstand Linse – Schirm b',min:10,max:480,value:st.b,log:true,step:1,round:1,fmt:function(v){return fmt(v,0)+' mm';},onChange:function(v){st.b=v;upd();}});
var sD=new Slider($('#sD'),{label:'Linsendurchmesser d',min:5,max:50,value:st.d,step:1,round:1,fmt:function(v){return fmt(v,0)+' mm';},onChange:function(v){st.d=v;upd();}});
var sH=new Slider($('#sH'),{label:'Kerzengröße G',min:20,max:150,value:st.G,step:5,round:5,fmt:function(v){return fmt(v,0)+' mm';},onChange:function(v){st.G=v;upd();}});
function ranges(){var V=VIEWS[st.view];sG.o.max=V.L-20;sB.o.max=V.R-15;st.g=clamp(st.g,sG.o.min,sG.o.max);st.b=clamp(st.b,sB.o.min,sB.o.max);sG.set(st.g,false);sB.set(st.b,false);}
var segView=new Seg($('#segView'),[{key:'nah',label:'nah (Bank 1,1 m)'},{key:'weit',label:'weit (Bank 3,6 m)'}],st.view,function(k){st.view=k;ranges();upd();if(v.ok)v.goTo(frame());});
new Seg($('#segLens'),Object.keys(LENSES).map(function(k){var F=LENSES[k];return {key:k,label:k+' <span class="small" style="color:inherit">('+(F<0?'−':'')+Math.abs(F)+' mm)</span>'};}),st.lens,function(k){
  st.lens=k;if(Math.abs(LENSES[k])>=500&&st.view==='nah'){st.view='weit';segView.set('weit',false);ranges();if(v.ok)v.goTo(frame());}upd();});
var HL={focus:'Scharfen Bildpunkt',fpts:'Brennpunkte F',special:'Besondere Strahlen',construct:'Bild einzeichnen'};
$$('#helpBtns button').forEach(function(btn){btn.addEventListener('click',function(){var k=btn.dataset.k;st[k]=!st[k];btn.classList.toggle('on',st[k]);btn.textContent=(st[k]?'● ':'○ ')+HL[k];draw3D();});});
function goLab(){$('#lab').scrollIntoView({behavior:'smooth',block:'start'});}
$('#goLab').addEventListener('click',function(){goLab();if(v.ok)v.goTo({pos:[-60,10,900],target:[-60,0,0]});});$('#goLab2').addEventListener('click',goLab);
ranges();upd();

/* ---------- Messtabelle ---------- */
var KEY='lk5:rows',rows=[];
try{rows=JSON.parse(localStorage.getItem(KEY)||'[]')||[];}catch(e){rows=[];}
function save(){try{localStorage.setItem(KEY,JSON.stringify(rows));}catch(e){}}
function num(s){return parseFloat(String(s||'').replace(',','.'));}
var COLS=['BG','bg','sum','inv'];
function truth(r){return {BG:r.B/r.G,bg:r.b/r.g,sum:1/r.g+1/r.b,inv:1/r.f};}
function renderRows(){
  var tb=$('#mt tbody');tb.innerHTML='';
  rows.forEach(function(r,i){var tr=document.createElement('tr');
    tr.innerHTML='<td>'+r.f+'</td><td>'+r.g+'</td><td>'+r.b+'</td><td>'+fmt(r.G,0)+'</td><td>'+fmt(r.B,1)+'</td>'+
      COLS.map(function(k){return '<td><input inputmode="decimal" data-k="'+k+'" value="'+(r[k]||'')+'"></td>';}).join('')+'<td><button class="del" aria-label="Zeile löschen">✕</button></td>';
    $$('input',tr).forEach(function(inp){inp.addEventListener('input',function(){r[inp.dataset.k]=inp.value;inp.style.background='';save();});});
    $('.del',tr).addEventListener('click',function(){rows.splice(i,1);save();renderRows();});
    tb.appendChild(tr);});
  chart.request();
}
$$('.take').forEach(function(btn){btn.addEventListener('click',function(){var m;
  if(f()<0||!isSharp()){m='Das Bild ist noch nicht scharf. Verschiebt zuerst den Schirm, bis „✓ Das Bild ist scharf!“ erscheint.';}
  else{rows.push({f:f(),g:Math.round(st.g),b:Math.round(st.b),G:st.G,B:Math.round(st.G*st.b/st.g*10)/10});save();renderRows();m='Messwert '+rows.length+' übernommen (Tabelle in Schritt 3).';}
  $('#checkMsg').textContent=m;$$('.takeMsg').forEach(function(t){t.textContent=m;});});});
$('#clear').addEventListener('click',function(){if(!rows.length||confirm('Wirklich alle Messwerte löschen?')){rows=[];save();renderRows();}});
$('#checkT').addEventListener('click',function(){var good=0,bad=0;
  $$('#mt tbody tr').forEach(function(tr,i){var t=truth(rows[i]);$$('input',tr).forEach(function(inp){var v=num(inp.value);if(!isFinite(v)){inp.style.background='';return;}
    var ok=Math.abs(v-t[inp.dataset.k])<=Math.max(0.03*Math.abs(t[inp.dataset.k]),inp.dataset.k==='sum'||inp.dataset.k==='inv'?0.00015:0.02);
    inp.style.background=ok?'#d3f9d8':'#ffe3e3';ok?good++:bad++;});});
  $('#checkMsg').textContent=good+' richtig, '+bad+' noch falsch (Rundung bis etwa 3 % ist erlaubt).';});

/* ---------- Diagramm ---------- */
var showCurves=false;
var chart=new HiCanvas($('#chart'),1.6,function(c,w,h){
  c.fillStyle='#fff';c.fillRect(0,0,w,h);
  var pts=rows.filter(function(r){return r.b>0;}),gMax=600,bMax=600;
  pts.forEach(function(r){gMax=Math.max(gMax,r.g*1.15);bMax=Math.max(bMax,r.b*1.15);});
  gMax=Math.min(gMax,2400);bMax=Math.min(bMax,2400);
  var L=56,B=40,T=14,R=14,W=w-L-R,H=h-T-B;
  function X(g){return L+g/gMax*W;}function Y(b){return T+H-b/bMax*H;}
  function step(m){var r=m/6,p=Math.pow(10,Math.floor(Math.log(r)/Math.LN10)),n=r/p;return (n<1.5?1:n<3?2:n<7?5:10)*p;}
  c.strokeStyle='#e9ecef';c.fillStyle='#5d6577';c.font='12px -apple-system,sans-serif';c.lineWidth=1;
  var sg=step(gMax),sb=step(bMax),v;
  c.textAlign='center';c.textBaseline='top';for(v=0;v<=gMax;v+=sg){c.beginPath();c.moveTo(X(v),T);c.lineTo(X(v),T+H);c.stroke();c.fillText(fmt(v,0),X(v),T+H+4);}
  c.textAlign='right';c.textBaseline='middle';for(v=0;v<=bMax;v+=sb){c.beginPath();c.moveTo(L,Y(v));c.lineTo(L+W,Y(v));c.stroke();c.fillText(fmt(v,0),L-6,Y(v));}
  c.strokeStyle='#1d2230';c.beginPath();c.moveTo(L,T);c.lineTo(L,T+H);c.lineTo(L+W,T+H);c.stroke();
  c.fillStyle='#1d2230';c.font='bold 13px -apple-system,sans-serif';c.textAlign='right';c.textBaseline='bottom';c.fillText('g in mm',L+W,T+H+36);
  c.save();c.translate(14,T+H/2);c.rotate(-Math.PI/2);c.textAlign='center';c.textBaseline='middle';c.fillText('b in mm',0,0);c.restore();
  var fs={};pts.forEach(function(r){fs[r.f]=1;});
  if(showCurves)Object.keys(fs).forEach(function(F){F=+F;c.strokeStyle=LCOL[F]||'#868e96';c.lineWidth=2;c.beginPath();var first=true;
    for(var g=F*1.01;g<=gMax;g+=gMax/400){var b=g*F/(g-F);if(b>bMax*1.05){first=true;continue;}first?c.moveTo(X(g),Y(b)):c.lineTo(X(g),Y(b));first=false;}c.stroke();
    c.setLineDash([4,4]);c.beginPath();c.moveTo(X(F),T);c.lineTo(X(F),T+H);c.moveTo(L,Y(F));c.lineTo(L+W,Y(F));c.stroke();c.setLineDash([]);});
  pts.forEach(function(r){c.fillStyle=LCOL[r.f]||'#868e96';c.strokeStyle='#1d2230';c.lineWidth=1;c.beginPath();c.arc(X(r.g),Y(r.b),6,0,7);c.fill();c.stroke();});
  var lx=L+10;c.font='13px -apple-system,sans-serif';c.textAlign='left';c.textBaseline='middle';
  Object.keys(fs).forEach(function(F,i){c.fillStyle=LCOL[F]||'#868e96';c.beginPath();c.arc(lx+6,T+12+i*20,6,0,7);c.fill();c.fillStyle='#1d2230';c.fillText('f = '+F+' mm',lx+16,T+12+i*20);});
  if(!pts.length){c.fillStyle='#868e96';c.textAlign='center';c.fillText('Noch keine Messwerte – oben „Messwert übernehmen“ tippen.',L+W/2,T+H/2);}
});
$('#curveBtn').addEventListener('click',function(){showCurves=!showCurves;this.textContent=(showCurves?'● ':'○ ')+'Kurven nach der Linsengleichung zeigen';this.classList.toggle('on',showCurves);chart.request();});
renderRows();

/* ---------- Rechenaufgaben ---------- */
var Q=[
 {q:'Linse B (f = 100 mm). Eine Kerze steht g = 300 mm vor der Linse. In welchem Abstand b hinter der Linse muss der Schirm stehen?',a:150,u:'mm',sol:'1/b = 1/f − 1/g = 1/100 − 1/300 = 2/300 → b = 150 mm'},
 {q:'Die Kerze aus Aufgabe 5 ist G = 40 mm hoch. Wie hoch ist ihr Bild auf dem Schirm?',a:20,u:'mm',sol:'B = G · b : g = 40 mm · 150 : 300 = 20 mm'},
 {q:'Eure Lochkamera ist 120 mm lang (b = 120 mm). Ihr nehmt Linse B (f = 100 mm). Wie weit muss ein Gegenstand entfernt sein, damit sein Bild scharf ist?',a:600,u:'mm',sol:'1/g = 1/f − 1/b = 1/100 − 1/120 = 1/600 → g = 600 mm'},
 {q:'Ein Baum steht 20 m (= 20 000 mm) entfernt. Wo entsteht sein Bild mit Linse C (f = 200 mm)?',a:202,u:'mm',tol:1.5,sol:'1/b = 1/200 − 1/20000 → b ≈ 202 mm. Bei weit entfernten Gegenständen ist b fast genau f!'},
 {q:'Eine Kamera ist 210 mm lang. Ein Gegenstand 4,2 m entfernt soll scharf sein. Welche Brennweite braucht ihr? Welche eurer Linsen ist das?',a:200,u:'mm',sol:'1/f = 1/g + 1/b = 1/4200 + 1/210 = 21/4200 → f = 200 mm, also Linse C'}
];
var qz=$('#quiz');
Q.forEach(function(it,i){var d=document.createElement('div');d.className='box task';
  d.innerHTML='<b>Aufgabe '+(i+5)+'</b><p style="margin:4px 0 8px">'+it.q+'</p><div class="row" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><input data-save="q'+i+'" inputmode="decimal" style="font:inherit;width:140px;padding:8px;border:1px solid #c9cdd6;border-radius:8px"> '+it.u+
   ' <button>Prüfen</button> <span class="res"></span></div><details><summary>Lösungsweg</summary><div><p>'+it.sol+'</p></div></details>';
  $('button',d).addEventListener('click',function(){var v=num($('input',d).value),ok=Math.abs(v-it.a)<=(it.tol||Math.max(1,0.02*it.a));
    $('.res',d).innerHTML=isFinite(v)?'<span class="'+(ok?'ok':'no')+'">'+(ok?'✓ richtig':'✗ noch nicht')+'</span>':'';});
  qz.appendChild(d);});

/* ---------- Experiment-Tabelle ---------- */
var ex=$('#exT');
for(var i=0;i<6;i++){var tr=document.createElement('tr');
  tr.innerHTML='<td><select data-save="el'+i+'"><option></option><option value="100">B (100)</option><option value="200">C (200)</option><option value="40">A (40)</option><option value="500">D (500)</option></select></td>'+
   ['g','b','G','B'].map(function(k){return '<td><input data-save="e'+k+i+'" inputmode="decimal"></td>';}).join('')+'<td class="o"></td><td class="o"></td><td class="o"></td><td class="o"></td>';
  ex.appendChild(tr);}
$('#calcEx').addEventListener('click',function(){$$('tr',ex).slice(1).forEach(function(tr){var v=$$('input,select',tr).map(function(e){return num(e.value);}),o=$$('.o',tr);
  var F=v[0],g=v[1],b=v[2],G=v[3],B=v[4];
  o[0].textContent=isFinite(B/G)?fmt(B/G,2):'';o[1].textContent=isFinite(b/g)?fmt(b/g,2):'';
  o[2].textContent=isFinite(1/g+1/b)?fmt(1/g+1/b,4):'';o[3].textContent=isFinite(1/F)?fmt(1/F,4):'';});});

persistInputs('lk5');
// Kopieren: Messtabelle (mit Eingaben) wird über data-q mitgenommen
setupCopy($('#copy'),'Lochkamera – Station 6');
})();

