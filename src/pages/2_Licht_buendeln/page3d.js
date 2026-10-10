
(function(){
var LENSES={none:{n:'ohne Linse',f:null},A:{n:'A',f:40},B:{n:'B',f:100},C:{n:'C',f:200},D:{n:'D',f:500},E:{n:'E',f:-100},F:{n:'F',f:-200}};
var OBJ={haus:{label:'Haus, 20 m',g:20000,txt:'vom Haus (20 m entfernt)'},lampen:{label:'Lämpchen, 2 m',g:2000,txt:'von den Lämpchen (2 m entfernt)'},kerze:{label:'Kerze, 50 cm',g:500,txt:'Kerze'}};
var st={lens:'none',d:10,b:100,obj:'haus',focus:false};
var C3=['#ff6b6b','#69db7c','#4dabf7'];
var P3=[{y:10,col:C3[0]},{y:0,col:C3[1]},{y:-10,col:C3[2]}];
var SW=150,SH=110;

/* --- Schritt 1: Idee --- */
var idea={p:0,target:0},IG=400,IB=150,ID=24;
var vi=new View3D($('#vIdea'),{shadows:true,aspect:2,pos:[-60,260,700],target:[-130,-5,0],maxDist:2500,
  presets:[{label:'Von der Seite',pos:[-130,0,620],target:[-130,0,0]},{label:'Hinter dem Schirm',pos:[420,50,130],target:[90,0,0]},{label:'Box von nah',pos:[-60,40,120],target:[0,0,0]}]});
var ib;
if(vi.ok){vi.labDefaults({shadowSize:600,tx:-150});vi.scene.add(makeTable(1300,700,-48,{grid:50}));
  var ibox=new CamBox(vi.scene,{sw:80,sh:56});ibox.update(IB,ID);
  var qb=new T3.Mesh(new T3.BoxGeometry(30,30,30),new T3.MeshPhysicalMaterial({color:0xffd43b,transparent:true,opacity:0.35,roughness:0.2,depthWrite:false,emissive:0x5a4500,emissiveIntensity:0.5}));vi.scene.add(qb);qb.position.x=0;
  vi.scene.add(edgeLines(new T3.BoxGeometry(30,30,30),0xffd43b,0.9));
  var ql=label3d('?','big plain');ql.el.style.fontSize='34px';ql.el.style.color='#ffd43b';vi.scene.add(ql);
  P3.forEach(function(p){var m=ledMesh(p.col,2.4);m.position.set(-IG,p.y,0);vi.scene.add(m);});
  var stand=new T3.Mesh(new T3.BoxGeometry(8,70,20),stdMat(0x20232b,0.5,0.3));stand.position.set(-IG-5,-13,0);stand.castShadow=true;vi.scene.add(stand);
  var lg=label3d('Gegenstand','dim');lg.position.set(-IG,32,0);vi.scene.add(lg);
  ib=new BundleSet(vi.scene);}
function ideaDraw(){if(!vi.ok)return;var P=idea.p*(1/IB+1/IG);ib.update({pts:P3,g:IG,b:IB,d:ID,P:P,nRays:7,k:0.55});vi.request();}
function ideaInfo(){var P=idea.p*(1/IB+1/IG);var D=ID*Math.abs(1-IB*P+IB/IG);$('#ideaTxt').textContent='Lichtfleck: '+fmtLen(D);}
$('#ideaBtn').addEventListener('click',function(){
  idea.target=idea.target?0:1;$('#ideaBtn').textContent=idea.target?'▶ Box ausschalten':'▶ Box einschalten';
  var from=idea.p,t0=performance.now();
  (function f(t){var u=Math.min(1,(t-t0)/1800);u=u*u*(3-2*u);idea.p=from+(idea.target-from)*u;ideaDraw();ideaInfo();if(u<1)requestAnimationFrame(f);})(t0);
});
ideaDraw();ideaInfo();

/* --- Schritt 2: Labor --- */
function f(){return LENSES[st.lens].f;}
function g(){return OBJ[st.obj].g;}
function bImage(){var F=f();if(!F)return NaN;return 1/(1/F-1/g());}
var v=new View3D($('#vLab'),{shadows:true,pos:[-160,230,560],target:[40,-5,0],maxDist:5000,far:30000,
  presets:[{label:'Von der Seite',pos:function(){return [st.b/2-150,0,Math.max(650,st.b*1.3)];},target:function(){return [st.b/2-150,0,0];}},
           {label:'Ganze Kamera',pos:function(){return [st.b/2+80,Math.max(200,st.b*0.5),Math.max(420,st.b*1.1)];},target:function(){return [st.b/2,0,0];}},
           {label:'Hinter dem Schirm',pos:function(){return [st.b+330,60,150];},target:function(){return [st.b,0,0];}},
           {label:'Linse von nah',pos:[-50,45,140],target:[0,0,0]}]});
var box,lens,bs,srcG,lblSrc;
if(v.ok){v.labDefaults({shadowSize:1400,tx:0});v.scene.add(makeTable(3600,1200,-77,{grid:50}));
  box=new CamBox(v.scene,{sw:SW,sh:SH});lens=new Lens3D(v.scene);bs=new BundleSet(v.scene);
  srcG=new T3.Group();v.scene.add(srcG);lblSrc=label3d('','dim');v.scene.add(lblSrc);}
var XMAX=620;
function draw3D(){if(!v.ok)return;
  var F=f(),P=F?1/F:0,G=g(),bi=bImage(),bMax=Math.max(st.b*1.2,150);if(bi>0&&bi<1300)bMax=Math.max(bMax,bi*1.25);
  var pts=P3.map(function(p){return {y:p.y,col:p.col,yp:p.y*Math.max(1,G/150)};});
  box.update(st.b,F?st.d+2:st.d);lens.set(st.d,P,!!F);
  bs.update({pts:pts,g:G,b:st.b,d:st.d,P:P,nRays:7,xMax:XMAX,beyond:bMax,focus:st.focus,markR:Math.max(2,st.d*0.12)});
  while(srcG.children.length)srcG.remove(srcG.children[0]);
  if(G<=XMAX){pts.forEach(function(p){var m=ledMesh(p.col,2.6);m.position.set(-G,p.yp,0);srcG.add(m);});lblSrc.el.textContent='Gegenstand (3 Punkte der Kerze)';lblSrc.position.set(-G,pts[0].yp+18,0);}
  else{lblSrc.el.textContent='Licht '+OBJ[st.obj].txt+' →';lblSrc.position.set(-XMAX*0.8,pts[0].yp*XMAX/G+30,0);}
  v.request();}
var scr=new ScreenCam($('#scr'),{W:480,H:352,sw:SW,sh:SH});
var MOT={haus:{mk:function(){return landscapeScene();},ref:70,land:true},lampen:{mk:function(){return lampsScene(2000,4);},ref:120},kerze:{mk:function(){return candleScene(500,152,-82);},ref:120}};
var pend=false;
function renderScreen(){if(pend)return;pend=true;requestAnimationFrame(function(){pend=false;
  var M=MOT[st.obj];if(!M.s)M.s=M.mk();
  var Rmm=blurDiameter(st.d,st.b,g(),f())/2,E=relBrightness(st.d,st.b);
  scr.render(M.s,st.b,Rmm,screenGain(E,M.ref),M.land?{near:0.3,far:9000}:{near:5,far:30000});
});}
function update(){
  draw3D();renderScreen();
  var D=blurDiameter(st.d,st.b,g(),f()),H=relBrightness(st.d,st.b);
  $('#mD').textContent=fmtLen(D);$('#barD').style.width=clamp(D/30*100,1,100)+'%';
  $('#mH').textContent=(H<10?fmt(H,H<1?2:1):fmt(H,0))+' ×';$('#barH').style.width=clamp(displayGain(H)/1.35*100,2,100)+'%';
}
new Seg($('#segLens'),Object.keys(LENSES).map(function(k){var L=LENSES[k];return {key:k,label:L.f?L.n+' <span class="small" style="color:inherit">('+(L.f>0?'':'−')+Math.abs(L.f)+' mm)</span>':L.n};}),st.lens,function(k){st.lens=k;update();});
var sB=new Slider($('#sB'),{label:'Abstand Linse – Schirm b',min:10,max:1200,value:st.b,log:true,step:1,round:1,fmt:function(v){return fmt(v,0)+' mm';},onChange:function(v){st.b=v;update();}});
var sD=new Slider($('#sD'),{label:'Loch- bzw. Linsendurchmesser d',min:0.5,max:30,value:st.d,log:true,step:0.5,round:0.5,fmt:function(v){return fmt(v,1)+' mm';},onChange:function(v){st.d=v;update();}});
new Seg($('#segObj'),Object.keys(OBJ).map(function(k){return {key:k,label:OBJ[k].label};}),st.obj,function(k){st.obj=k;update();});
$('#focusBtn').addEventListener('click',function(){st.focus=!st.focus;this.textContent=(st.focus?'● ':'○ ')+'Scharfen Bildpunkt zeigen';this.classList.toggle('on',st.focus);draw3D();});

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
    if(L.f<0){ok=sel==='nein';msg=ok?'richtig':'Probiert es nochmal!';}
    else{var bi=1/(1/L.f-1/20000);
      if(sel!=='ja'){ok=false;msg='Es gibt ein scharfes Bild!';}
      else if(!isFinite(bv)){ok=false;msg='b fehlt';}
      else{ok=Math.abs(bv-bi)/bi<0.05;msg=ok?'sehr genau':(bv<bi?'etwas zu klein':'etwas zu groß');}}
    res.innerHTML='<span class="'+(ok?'ok':'no')+'">'+(ok?'✓ ':'✗ ')+msg+'</span>';
  });
});
update();
persistInputs('lk2');setupCopy($('#copy'),'Lochkamera – Station 2');
})();

