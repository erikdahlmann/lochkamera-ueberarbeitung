(function(){
var st={d:1,b:150,g:400,pts:'7',scene:'punkte',look:'beide',beug:false};
var COLS=['#ff6b6b','#ffa94d','#ffe066','#69db7c','#4dabf7','#9775fa','#f06595'];
var SW=150,SH=110,HAUS_G=42000; // das Haus steht 42 m vor der Kamera
function pts(){
  if(st.pts==='1')return [{y:40,col:COLS[0]}];
  if(st.pts==='2')return [{y:30,col:COLS[0]},{y:-30,col:COLS[4]}];
  var a=[];for(var i=0;i<7;i++)a.push({y:60-20*i,col:COLS[i]});return a;
}
function gEff(){return st.scene==='haus'?HAUS_G:st.g;}
function spotGeo(){return blurDiameter(st.d,st.b,gEff(),null);}
function spot(){var D=spotGeo();if(st.beug){var A=airyDiameter(st.d,st.b);D=Math.sqrt(D*D+A*A);}return D;}
/* ---------- 3D-Modell ---------- */
var tableY=-68;
var v=new View3D($('#v1'),{shadows:true,pos:[-60,230,560],target:[-110,-5,0],near:2,far:30000,maxDist:3000,ctl:'#ctl1',
  presets:[{label:'Von der Seite',pos:function(){return [-st.g/2+40,0,Math.max(820,st.g*1.6)];},target:function(){return [-st.g/2+40,0,0];}},
           {label:'Von oben',ortho:true,pos:function(){return [-st.g/2+60,900,0];},target:function(){return [-st.g/2+60,0,0];},size:function(){return Math.max(240,(st.g+260)/3.1);}},
           {label:'Hinter dem Schirm',pos:[560,70,170],target:[120,-5,0]},{label:'Ins Loch schauen',pos:[-70,28,70],target:[0,0,0]}]});
if(v.ok){
v.labDefaults({shadowSize:900,tx:-200,room:{cx:-250,cz:0,w:7600,d:6400,floorY:tableY-764,h:3000}});
v.scene.add(makeTable(2000,1000,tableY,{grid:50}));
var box=new CamBox(v.scene,{sw:SW,sh:SH});
// Gegenstand: Leiste mit Leuchtpunkten
var objG=new T3.Group();v.scene.add(objG);
var leds=new T3.Group();objG.add(leds);
var stand=new T3.Mesh(new T3.BoxGeometry(10,150,26),stdMat(0x20232b,0.5,0.3));stand.position.set(-6,(75+tableY)/2+3,0);stand.scale.y=(75-tableY)/150;stand.castShadow=true;objG.add(stand);
var foot=new T3.Mesh(new T3.BoxGeometry(60,6,60),stdMat(0x20232b,0.5,0.3));foot.position.set(-6,tableY+3,0);foot.castShadow=true;objG.add(foot);
var lblObj=label3d('Gegenstand','dim');lblObj.position.set(0,95,0);objG.add(lblObj);
var cones=new Bundle(v.scene,{opacity:0.2}),rays=new Lines(v.scene,{width:1.6}),discs=new T3.Group();v.scene.add(discs);
var dimL=new Lines(v.scene,{width:1.3,additive:false}),gLab=label3d('','plain');v.scene.add(gLab);
var lastPts='';
}
function build3D(){if(!v.ok)return;
  var P=pts(),key=st.pts,G=st.g;
  objG.position.x=-G;
  if(key!==lastPts){lastPts=key;clearGroup(leds);P.forEach(function(p,i){var m=ledMesh(p.col,3.2);m.position.set(0,p.y,0);leds.add(m);
    var n=label3d(String(i+1),'num');n.position.set(-16,p.y,0);leds.add(n);});}
  box.update(st.b,st.d);
  var b=st.b,r=st.d/2,k=1+b/G,N=48,R=[],S=[];
  clearGroup(discs);
  P.forEach(function(p){var c=lin(p.col),A=ringYZ(0,0,0,r,N),apex=[],B=[],cy=-p.y*b/G;
    for(var i=0;i<N;i++){apex.push(V3(-G,p.y,0));B.push(V3(b,cy+A[i].y*k,A[i].z*k));}
    R.push({A:apex,B:A,cA:scaleC(c,0.5),cB:scaleC(c,1.1)});R.push({A:A,B:B,cA:scaleC(c,1.1),cB:scaleC(c,0.8)});
    [r,-r].forEach(function(h){S.push(seg(V3(-G,p.y,0),V3(0,h,0),scaleC(c,0.35),scaleC(c,0.75)));S.push(seg(V3(0,h,0),V3(b,cy+h*k,0),scaleC(c,0.75)));});
    var dm=new T3.Mesh(new T3.CircleGeometry(Math.max(r*k,0.25),48),new T3.MeshBasicMaterial({color:new T3.Color(c[0],c[1],c[2]),transparent:true,opacity:0.9,depthWrite:false,side:T3.DoubleSide,toneMapped:false}));
    dm.rotation.y=Math.PI/2;dm.position.set(b-0.4,cy,0);discs.add(dm);
    var dm2=new T3.Mesh(dm.geometry,dm.material);dm2.rotation.y=Math.PI/2;dm2.position.set(b+0.4,cy,0);discs.add(dm2);});
  cones.set(R);rays.set(S);
  if(cones.mesh)cones.mesh.visible=st.look!=='strahlen';rays.visible(st.look!=='kegel');
  // Maßpfeil g auf dem Tisch
  var y=tableY+1,z=140,w=[0.85,0.88,0.95];
  dimL.set([seg(V3(-G,y,z),V3(0,y,z),w),seg(V3(-G,y,z-12),V3(-G,y,z+12),w),seg(V3(0,y,z-12),V3(0,y,z+12),w),
            seg(V3(0,y,z+40),V3(b,y,z+40),w),seg(V3(b,y,z+28),V3(b,y,z+52),w)]);
  gLab.el.textContent='g = '+fmt(G,0)+' mm';gLab.position.set(-G/2,y+12,z);
  v.request();
}
/* ---------- Schirmbild ---------- */
var scr=new ScreenCam($('#scr'),{W:480,H:352,sw:SW,sh:SH});
var LAMP_LAY=[10,10,3,-14]; // gelb ±16 mm, blau ±4,8 mm (k = 1,6)
var MOT={punkte:{mk:function(){return shiftable(ledsScene(400,pts()),400);},ref:3,key:function(){return st.pts;}},
         kerze:{mk:function(){return shiftable(candleScene(400,152,-82),400);},ref:8},
         lampen:{mk:function(){return shiftable(lampsScene(400,1.6,LAMP_LAY),400);},ref:8},
         haus:{mk:function(){return landscapeScene();},ref:3,far:9000,pos:V3(22,0.2,0)}};
var pend=false;
function renderScreen(){if(pend)return;pend=true;requestAnimationFrame(function(){pend=false;
  var M=MOT[st.scene],k=M.key?M.key():'';
  if(!M.s||M.k!==k){if(M.s)disposeDeep(M.s);M.s=M.mk();M.k=k;}
  if(M.s.userData.setG)M.s.userData.setG(st.g);
  var Rmm=spot()/2,E=relBrightness(st.d,st.b);
  scr.render(M.s,st.b,Rmm,screenGain(E,M.ref),M.pos?{pos:M.pos,near:0.3,far:M.far}:{near:5,far:20000});
});}
function update(){
  build3D();renderScreen();
  var D=spot(),H=relBrightness(st.d,st.b);
  $('#mD').textContent=fmtLen(D);$('#barD').style.width=clamp(D/20*100,1,100)+'%';
  $('#mH').textContent=(H<10?fmt(H,H<1?2:1):fmt(H,0))+' ×';$('#barH').style.width=clamp(displayGain(H)/1.35*100,2,100)+'%';
  var bi=$('#beugInfo');bi.style.display=st.beug?'':'none';
  if(st.beug)bi.textContent='Beugung ist eingeschaltet: Strahlenmodell allein '+fmtLen(spotGeo())+', Beugung allein '+fmtLen(airyDiameter(st.d,st.b))+'. Das 3D-Modell zeigt weiter nur Strahlen.';
}
var sD=new Slider($('#sD'),{label:'Lochdurchmesser d',min:0.2,max:12,value:st.d,log:true,step:0.1,round:0.1,fmt:function(v){return fmt(v,1)+' mm';},onChange:function(v){anim.stop();st.d=v;update();}});
var sB=new Slider($('#sB'),{label:'Abstand Loch – Schirm b',min:50,max:300,value:st.b,step:5,round:5,fmt:function(v){return fmt(v,0)+' mm';},onChange:function(v){st.b=v;update();}});
var sG=new Slider($('#sG'),{label:'Abstand Gegenstand – Loch g',min:100,max:1000,value:st.g,log:true,step:10,round:10,fmt:function(v){return fmt(v,0)+' mm';},onChange:function(v){st.g=v;update();}});
function sceneCtl(){var h=st.scene==='haus';sG.enable(!h);if(h)sG.out.textContent='42 m';else sG.set(st.g,false);}
new Seg($('#segPts'),[{key:'1',label:'1 Punkt'},{key:'2',label:'2 Punkte'},{key:'7',label:'7 Punkte'}],st.pts,function(k){st.pts=k;update();});
new Seg($('#segScene'),[{key:'punkte',label:'Leuchtpunkte'},{key:'kerze',label:'Kerze'},{key:'lampen',label:'Zwei Lämpchen'},{key:'haus',label:'Haus in der Landschaft'}],st.scene,function(k){st.scene=k;sceneCtl();update();});
new Seg($('#segLook'),[{key:'beide',label:'Kegel und Strahlen'},{key:'strahlen',label:'nur Strahlen'},{key:'kegel',label:'nur Kegel'}],st.look,function(k){st.look=k;build3D();});
new Toggle($('#beugBtn'),'Beugung berücksichtigen',false,function(on){st.beug=on;update();});
var anim=new AnimButton($('#anim'),'▶ Loch langsam vergrößern',7000,function(u){var d=0.3*Math.pow(12/0.3,u);st.d=d;sD.set(d,false);update();});
update();
persistInputs('lk1');setupCopy($('#copy'),'Lochkamera – Station 1');
})();
