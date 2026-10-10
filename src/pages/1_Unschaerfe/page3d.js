
(function(){
var G=400; // Gegenstand 40 cm vor dem Loch
var st={d:1,b:150,pts:'7',scene:'kerze'};
var COLS=['#ff6b6b','#ffa94d','#ffe066','#69db7c','#4dabf7','#9775fa','#f06595'];
var SW=120,SH=90;
function pts(){
  if(st.pts==='1')return [{y:40,col:COLS[0]}];
  if(st.pts==='2')return [{y:30,col:COLS[0]},{y:-30,col:COLS[4]}];
  var a=[];for(var i=0;i<7;i++)a.push({y:60-20*i,col:COLS[i]});return a;
}
/* ---------- 3D-Modell ---------- */
var v=new View3D($('#v1'),{shadows:true,pos:[-60,230,560],target:[-110,-5,0],near:2,far:20000,maxDist:3000,
  presets:[{label:'Von der Seite',pos:[-120,0,820],target:[-120,0,0]},{label:'Von oben',pos:[-120,900,2],target:[-120,0,0]},{label:'Hinter dem Schirm',pos:[560,70,170],target:[120,-5,0]},{label:'Ins Loch schauen',pos:[-70,28,70],target:[0,0,0]}]});
var tableY=-68;
if(v.ok){
v.labDefaults({shadowSize:700,tx:-150});
v.scene.add(makeTable(1600,900,tableY,{grid:50}));
var box=new CamBox(v.scene,{sw:SW,sh:SH});
// Gegenstand: Leiste mit Leuchtpunkten
var objG=new T3.Group();v.scene.add(objG);
var stand=new T3.Mesh(new T3.BoxGeometry(10,150,26),stdMat(0x20232b,0.5,0.3));stand.position.set(-G-6,(75+tableY)/2+3,0);stand.scale.y=(75-tableY)/150;stand.castShadow=true;v.scene.add(stand);
var foot=new T3.Mesh(new T3.BoxGeometry(60,6,60),stdMat(0x20232b,0.5,0.3));foot.position.set(-G-6,tableY+3,0);foot.castShadow=true;v.scene.add(foot);
var lblObj=label3d('Gegenstand','dim');lblObj.position.set(-G,95,0);v.scene.add(lblObj);
var cones=new Bundle(v.scene,{opacity:0.2}),rays=new Lines(v.scene,{width:1.6}),discs=new T3.Group();v.scene.add(discs);
var lastPts='';
}
function build3D(){if(!v.ok)return;
  var P=pts(),key=st.pts;
  if(key!==lastPts){lastPts=key;while(objG.children.length)objG.remove(objG.children[0]);P.forEach(function(p){var m=ledMesh(p.col,3.2);m.position.set(-G,p.y,0);objG.add(m);});}
  box.update(st.b,st.d);
  var b=st.b,r=st.d/2,k=1+b/G,N=48,R=[],S=[];
  while(discs.children.length){var c0=discs.children.pop();c0.geometry.dispose();c0.material.dispose();}
  P.forEach(function(p){var c=lin(p.col),A=ringYZ(0,0,0,r,N),apex=[],B=[],cy=-p.y*b/G;
    for(var i=0;i<N;i++){apex.push(V3(-G,p.y,0));B.push(V3(b,cy+A[i].y*k,A[i].z*k));}
    R.push({A:apex,B:A,cA:scaleC(c,0.5),cB:scaleC(c,1.1)});R.push({A:A,B:B,cA:scaleC(c,1.1),cB:scaleC(c,0.8)});
    [r,-r].forEach(function(h){S.push(seg(V3(-G,p.y,0),V3(0,h,0),scaleC(c,0.35),scaleC(c,0.75)));S.push(seg(V3(0,h,0),V3(b,cy+h*k,0),scaleC(c,0.75)));});
    var dm=new T3.Mesh(new T3.CircleGeometry(Math.max(r*k,0.25),48),new T3.MeshBasicMaterial({color:new T3.Color(c[0],c[1],c[2]),transparent:true,opacity:0.9,depthWrite:false,side:T3.DoubleSide,toneMapped:false}));
    dm.rotation.y=Math.PI/2;dm.position.set(b-0.4,cy,0);discs.add(dm);
    var dm2=dm.clone();dm2.position.x=b+0.4;discs.add(dm2);});
  cones.set(R);rays.set(S);v.request();
}
/* ---------- Schirmbild ---------- */
var scr=new ScreenCam($('#scr'),{W:480,H:360,sw:SW,sh:SH});
var MOT={kerze:{s:null,mk:function(){return candleScene(G,152,-82);},ref:1.2},lampen:{s:null,mk:function(){return lampsScene(G,2);},ref:1.2},haus:{s:null,mk:function(){return landscapeScene();},ref:0.22,far:9000,pos:V3(22,0.2,0)}};
var pend=false;
function renderScreen(){if(pend)return;pend=true;requestAnimationFrame(function(){pend=false;
  var M=MOT[st.scene];if(!M.s)M.s=M.mk();
  var Rmm=blurDiameter(st.d,st.b,G,null)/2,E=relBrightness(st.d,st.b);
  scr.render(M.s,st.b,Rmm,screenGain(E,M.ref),M.pos?{pos:M.pos,near:0.3,far:M.far}:{near:5,far:20000});
});}
function update(){
  build3D();renderScreen();
  var D=blurDiameter(st.d,st.b,G,null),H=relBrightness(st.d,st.b);
  $('#mD').textContent=fmtLen(D);$('#barD').style.width=clamp(D/20*100,1,100)+'%';
  $('#mH').textContent=(H<10?fmt(H,H<1?2:1):fmt(H,0))+' ×';$('#barH').style.width=clamp(displayGain(H)/1.35*100,2,100)+'%';
}
var sD=new Slider($('#sD'),{label:'Lochdurchmesser d',min:0.2,max:12,value:st.d,log:true,step:0.1,round:0.1,fmt:function(v){return fmt(v,1)+' mm';},onChange:function(v){st.d=v;update();}});
var sB=new Slider($('#sB'),{label:'Abstand Loch – Schirm b',min:50,max:300,value:st.b,step:5,round:5,fmt:function(v){return fmt(v,0)+' mm';},onChange:function(v){st.b=v;update();}});
new Seg($('#segPts'),[{key:'1',label:'1 Punkt'},{key:'2',label:'2 Punkte'},{key:'7',label:'7 Punkte'}],st.pts,function(k){st.pts=k;update();});
new Seg($('#segScene'),[{key:'kerze',label:'Kerze'},{key:'lampen',label:'Zwei Lämpchen'},{key:'haus',label:'Haus in der Landschaft'}],st.scene,function(k){st.scene=k;update();});
var running=false;
$('#anim').addEventListener('click',function(){
  if(running)return;running=true;var t0=performance.now(),T=7000;
  (function f(t){var u=Math.min(1,(t-t0)/T);var d=0.3*Math.pow(12/0.3,u);st.d=d;sD.set(d,false);update();
    if(u<1)requestAnimationFrame(f);else running=false;})(t0);
});
update();
persistInputs('lk1');setupCopy($('#copy'),'Lochkamera – Station 1');
})();

