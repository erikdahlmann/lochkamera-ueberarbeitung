(function(){
var LENSES={none:{n:'ohne Linse',f:null},A:{n:'A',f:40},B:{n:'B',f:100},C:{n:'C',f:200},D:{n:'D',f:500},E:{n:'E',f:-100},F:{n:'F',f:-200}};
var OBJ={haus:{label:'Haus',g:20000,min:5000,max:50000,txt:'vom Haus'},lampen:{label:'Lämpchen',g:2000,min:300,max:5000,txt:'von den Lämpchen'},kerze:{label:'Kerze',g:500,min:300,max:5000,txt:'von der Kerze'}};
var LENS_D=32; // alle Linsen sind 32 mm groß, davor sitzt die Blende
var st={lens:'none',d:10,b:100,obj:'haus',g:20000,focus:false,look:'beide'};
var C3=['#ff6b6b','#69db7c','#4dabf7'];
var P3=[{y:10,col:C3[0]},{y:0,col:C3[1]},{y:-10,col:C3[2]}];
var SW=150,SH=110;

/* --- Schritt 1: Idee --- */
var idea={p:0,target:0,run:false},IG=400,IB=150,ID=24;
var vi=new View3D($('#vIdea'),{shadows:true,aspect:2,pos:[-60,95,520],target:[-150,15,0],maxDist:2400,
  presets:[{label:'Von der Seite',pos:[-130,0,620],target:[-130,0,0]},{label:'Hinter dem Schirm',pos:[420,50,130],target:[90,0,0]},{label:'Box von nah',pos:[-60,40,120],target:[0,0,0]}]});
var ib;
if(vi.ok){vi.labDefaults({shadowSize:600,tx:-150,room:{cx:-200,cz:0,w:7000,d:6000,floorY:-48-764,h:3000}});vi.scene.add(makeTable(1600,800,-48,{grid:50}));
  var ibox=new CamBox(vi.scene,{sw:SW,sh:SH});ibox.update(IB,ID);
  var qb=new T3.Mesh(new T3.BoxGeometry(30,30,30),new T3.MeshPhysicalMaterial({color:0xffd43b,transparent:true,opacity:0.35,roughness:0.2,depthWrite:false,emissive:0x5a4500,emissiveIntensity:0.5}));vi.scene.add(qb);qb.position.x=0;
  vi.scene.add(edgeLines(new T3.BoxGeometry(30,30,30),0xffd43b,0.9));
  var ql=label3d('?','big plain');ql.el.style.fontSize='34px';ql.el.style.color='#ffd43b';vi.scene.add(ql);
  P3.forEach(function(p){var m=ledMesh(p.col,2.4);m.position.set(-IG,p.y,0);vi.scene.add(m);});
  var stand=new T3.Mesh(new T3.BoxGeometry(8,70,20),stdMat(0x20232b,0.5,0.3));stand.position.set(-IG-5,-13,0);stand.castShadow=true;vi.scene.add(stand);
  var lg=label3d('Gegenstand','dim');lg.position.set(-IG,32,0);vi.scene.add(lg);
  ib=new BundleSet(vi.scene);}
function ideaDraw(){if(!vi.ok)return;var P=idea.p*(1/IB+1/IG);ib.update({pts:P3,g:IG,b:IB,d:ID,P:P,nRays:7,k:0.55});vi.request();}
function ideaInfo(){var P=idea.p*(1/IB+1/IG);var D=ID*Math.abs(1-IB*P+IB/IG);$('#ideaTxt').textContent='Lichtfleck: '+fmtLen(D);}
/* Eine einzige Animationsschleife: schnelles Tippen startet keine zweite */
$('#ideaBtn').addEventListener('click',function(){
  idea.target=idea.target?0:1;$('#ideaBtn').textContent=idea.target?'▶ Box ausschalten':'▶ Box einschalten';
  if(idea.run)return;idea.run=true;var last=performance.now();
  (function f(t){var dt=(t-last)/1800;last=t;var dir=idea.target>idea.p?1:-1;idea.p=clamp(idea.p+dir*dt,0,1);
    if((dir>0&&idea.p>=idea.target)||(dir<0&&idea.p<=idea.target)){idea.p=idea.target;}
    ideaDraw();ideaInfo();if(idea.p!==idea.target)requestAnimationFrame(f);else idea.run=false;})(last);
});
ideaDraw();ideaInfo();

/* --- Schritt 2: Labor --- */
function f(){return LENSES[st.lens].f;}
function g(){return st.g;}
function bImage(){var F=f();if(!F)return NaN;return 1/(1/F-1/g());}
var v=new View3D($('#vLab'),{shadows:true,pos:[-200,120,620],target:[40,20,0],maxDist:5000,far:40000,ctl:'#ctl2',
  presets:[{label:'Von der Seite',pos:function(){return [st.b/2-150,0,Math.max(650,st.b*1.3)];},target:function(){return [st.b/2-150,0,0];}},
           {label:'Ganze Kamera',pos:function(){return [st.b/2+80,Math.max(200,st.b*0.5),Math.max(420,st.b*1.1)];},target:function(){return [st.b/2,0,0];}},
           {label:'Hinter dem Schirm',pos:function(){return [st.b+330,60,150];},target:function(){return [st.b,0,0];}},
           {label:'Linse von nah',pos:[-50,45,140],target:[0,0,0]}]});
var box,lens,bs,srcG,lblSrc,iris=null,irisD=-1;
var irisMat=sharedMat(stdMat(0x1c1f25,0.45,0.7));
if(v.ok){v.labDefaults({shadowSize:1400,tx:0,room:{cx:0,cz:0,w:9000,d:7000,floorY:-77-764,h:3200}});v.scene.add(makeTable(3600,1200,-77,{grid:50}));
  box=new CamBox(v.scene,{sw:SW,sh:SH});lens=new Lens3D(v.scene);bs=new BundleSet(v.scene);
  srcG=new T3.Group();v.scene.add(srcG);lblSrc=label3d('','dim');v.scene.add(lblSrc);}
/* Blende: schwarze Scheibe mit Öffnung d direkt vor der Linse */
function setIris(show){if(!v.ok)return;
  if(!show){if(iris)iris.visible=false;return;}
  if(Math.abs(irisD-st.d)>1e-3){irisD=st.d;if(iris){v.scene.remove(iris);iris.geometry.dispose();}
    var gI=new T3.RingGeometry(Math.min(st.d/2,LENS_D/2),LENS_D/2+5,64,1);gI.rotateY(Math.PI/2);iris=new T3.Mesh(gI,irisMat);iris.position.x=-3.2;v.scene.add(iris);}
  iris.visible=st.d<LENS_D-0.1;}
var XMAX=620;
function draw3D(){if(!v.ok)return;
  var F=f(),P=F?1/F:0,G=g(),bi=bImage(),bMax=Math.max(st.b*1.2,150);if(bi>0&&bi<1300)bMax=Math.max(bMax,bi*1.25);
  var pts=P3.map(function(p){return {y:p.y,col:p.col,yp:p.y*Math.max(1,G/150)};});
  box.update(st.b,F?LENS_D+2:st.d);lens.set(LENS_D,P,!!F);setIris(!!F);
  bs.update({pts:pts,g:G,b:st.b,d:Math.min(st.d,F?LENS_D:st.d),P:P,nRays:7,xMax:XMAX,beyond:bMax,focus:st.focus,markR:Math.max(2,st.d*0.12)});
  if(bs.cones.mesh)bs.cones.mesh.visible=st.look!=='strahlen';bs.rays.visible(st.look!=='kegel');bs.dash.visible(st.look!=='kegel');
  clearGroup(srcG);
  if(G<=XMAX){pts.forEach(function(p){var m=ledMesh(p.col,2.6);m.position.set(-G,p.yp,0);srcG.add(m);});lblSrc.el.textContent='Gegenstand (3 Punkte)';lblSrc.position.set(-G,pts[0].yp+18,0);}
  else{lblSrc.el.textContent='Licht '+OBJ[st.obj].txt+' ('+fmtLen(G)+') →';lblSrc.position.set(-XMAX*0.8,pts[0].yp*XMAX/G+30,0);}
  v.request();}
var scr=new ScreenCam($('#scr'),{W:480,H:352,sw:SW,sh:SH});
/* gleiche Belichtung wie in Station 1 (ref je Motiv) */
var MOT={haus:{mk:function(){return landscapeScene();},ref:12,land:true},lampen:{mk:function(){return shiftable(lampsScene(2000,4),2000);},ref:20},kerze:{mk:function(){return shiftable(candleScene(500,152,-82),500);},ref:20}};
var pend=false;
function renderScreen(){if(pend)return;pend=true;requestAnimationFrame(function(){pend=false;
  var M=MOT[st.obj];if(!M.s)M.s=M.mk();
  var Rmm=blurDiameter(Math.min(st.d,f()?LENS_D:st.d),st.b,g(),f())/2,E=relBrightness(st.d,st.b),opt;
  if(M.land){var x=-20+g()/1000;opt={pos:V3(x,landHeight(x,0)+1.4,0),near:0.3,far:9000};}
  else{M.s.userData.setG(g());opt={near:5,far:30000};}
  scr.render(M.s,st.b,Rmm,screenGain(E,M.ref),opt);
});}
/* Diagramm: Lichtfleck über b */
var chart=new MiniChart($('#chartD'),{aspect:2.2,xLabel:'Abstand b in mm',yLabel:'Lichtfleck D in mm'});
function drawChart(){var F=f(),bi=bImage(),xm=(bi>0&&bi<1200)?clamp(bi*2.2,150,1200):600,S=[],ym=0,i,b;
  for(i=0;i<=160;i++){b=10+(xm-10)*i/160;var D=blurDiameter(st.d,b,g(),F);S.push([b,D]);ym=Math.max(ym,D);}
  chart.o.xMax=xm;chart.o.yMax=Math.max(2,Math.min(ym*1.05,60));
  chart.set([{pts:S,color:'#e8590c'}],[{x:st.b,y:blurDiameter(st.d,st.b,g(),F),color:'#1971c2',label:'jetzt'}]);}
function update(){
  draw3D();renderScreen();drawChart();
  var D=blurDiameter(st.d,st.b,g(),f()),H=relBrightness(st.d,st.b);
  $('#mD').textContent=fmtLen(D);$('#barD').style.width=clamp(D/30*100,1,100)+'%';
  $('#mH').textContent=(H<10?fmt(H,H<1?2:1):fmt(H,0))+' ×';$('#barH').style.width=clamp(displayGain(H)/1.35*100,2,100)+'%';
}
new Seg($('#segLens'),Object.keys(LENSES).map(function(k){var L=LENSES[k];return {key:k,label:L.f?L.n+' <span class="small" style="color:inherit">('+(L.f>0?'':'−')+Math.abs(L.f)+' mm)</span>':L.n};}),st.lens,function(k){st.lens=k;sweep.stop();update();});
var sB=new Slider($('#sB'),{label:'Abstand Linse – Schirm b',min:10,max:1200,value:st.b,log:true,step:1,round:1,fmt:function(v){return fmt(v,0)+' mm';},onChange:function(v){sweep.stop();st.b=v;update();}});
var sD=new Slider($('#sD'),{label:'Öffnung d (Loch bzw. Blende vor der Linse)',min:0.5,max:30,value:st.d,log:true,step:0.5,round:0.5,fmt:function(v){return fmt(v,1)+' mm';},onChange:function(v){st.d=v;update();}});
var sG=new Slider($('#sG'),{label:'Abstand Gegenstand – Linse g',min:5000,max:50000,value:st.g,log:true,step:100,round:10,fmt:function(v){return fmtLen(v);},onChange:function(v){st.g=v;update();}});
function objRange(){var O=OBJ[st.obj];sG.o.min=O.min;sG.o.max=O.max;sG.o.step=O.min>=5000?500:50;sG.set(st.g,false);}
new Seg($('#segObj'),Object.keys(OBJ).map(function(k){return {key:k,label:OBJ[k].label+' <span class="small" style="color:inherit">('+fmtLen(OBJ[k].g)+')</span>'};}),st.obj,function(k){st.obj=k;st.g=OBJ[k].g;objRange();update();});
new Seg($('#segLook'),[{key:'beide',label:'Kegel und Strahlen'},{key:'strahlen',label:'nur Strahlen'},{key:'kegel',label:'nur Kegel'}],st.look,function(k){st.look=k;draw3D();});
new Toggle($('#focusBtn'),'Scharfen Bildpunkt zeigen',false,function(on){st.focus=on;draw3D();});
/* Schirm langsam verschieben: von deutlich zu nah bis deutlich zu weit */
var sweep=new AnimButton($('#sweep'),'▶ Schirm langsam verschieben',9000,function(u){var bi=bImage(),b0,b1;
  if(bi>0&&bi<1200){b0=Math.max(10,bi*0.45);b1=Math.min(1200,bi*1.8);}else{b0=30;b1=600;}
  st.b=b0*Math.pow(b1/b0,u);sB.set(st.b,false);update();});
objRange();

/* --- Tabelle --- */
var tb=$('#lensTable');
['A','B','C','D','E','F'].forEach(function(k){
  var L=LENSES[k],tr=document.createElement('tr');
  tr.innerHTML='<td><b>'+k+'</b></td><td>'+(L.f>0?'':'−')+Math.abs(L.f)+' mm</td>'+
   '<td><select data-save="s'+k+'"><option></option><option>ja</option><option>nein</option></select></td>'+
   '<td><input data-save="b'+k+'" inputmode="decimal"></td>'+
   '<td><select data-save="g'+k+'"><option></option><option>sehr klein</option><option>klein</option><option>mittel</option><option>groß</option><option>sehr groß</option><option>–</option></select></td>'+
   '<td class="res" id="res'+k+'"></td>';
  tb.appendChild(tr);
});
$('#check').addEventListener('click',function(){
  ['A','B','C','D','E','F'].forEach(function(k){
    var L=LENSES[k],res=$('#res'+k),sel=$('select[data-save="s'+k+'"]').value,bv=parseFloat(($('input[data-save="b'+k+'"]').value||'').replace(',','.'));
    var ok,msg;
    if(!sel){res.textContent='';return;}
    if(L.f<0){ok=sel==='nein';msg=ok?'richtig: kein Bild auf dem Schirm':'Probiert es nochmal!';}
    else{var bi=1/(1/L.f-1/20000),err=Math.abs(bv-bi)/bi;
      if(sel!=='ja'){ok=false;msg='Es gibt ein scharfes Bild!';}
      else if(!isFinite(bv)){ok=false;msg='b fehlt';}
      else{ok=err<=0.05;msg=err<=0.02?'sehr genau':(ok?'gut':(bv<bi?'zu klein':'zu groß'));}}
    res.innerHTML='<span class="'+(ok?'ok':'no')+'">'+(ok?'✓ ':'✗ ')+msg+'</span>';
  });
  $('#checkNote').textContent='Geprüft werden „scharfes Bild?“ und b. Die Bildgröße vergleicht ihr selbst: Welche Linse macht das größte Bild?';
});
update();
persistInputs('lk2');setupCopy($('#copy'),'Lochkamera – Station 2');
})();
