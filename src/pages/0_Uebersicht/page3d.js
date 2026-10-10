
(function(){
var SW=150,SH=110,Bm=150,st={d:2},HAUS_REF=12; // gleiche Belichtung wie in Station 1 und 2
var scr=new ScreenCam($('#scr'),{W:480,H:352,sw:SW,sh:SH});
var v=new View3D($('#v0'),{shadows:true,logDepth:true,env:false,near:0.01,far:9000,minDist:0.12,maxDist:80,fov:40,aspect:1.9,
  pos:[0.62,0.16,0.42],target:[0.02,-0.02,0],
  presets:[{label:'Hinter der Kamera',pos:[0.5,0.05,0.07],target:[0.1,-0.01,0]},{label:'Landschaft',pos:[2.2,0.8,2.6],target:[-12,-1,0]},{label:'Von vorne',pos:[-0.6,0.1,0.35],target:[0.05,0,0]}]});
var tex=null,box=null,rays=null,houseTop=V3(-17.26,3.0,1.62),houseFoot=V3(-17.26,-3,1.62);
var land2=null;
if(v.ok){var s=v.scene,land=makeLandscape();s.add(land);
  /* Rauch, Vögel und Wolken bewegen sich (etwa 30 Bilder pro Sekunde) */
  var lastT=0;v.anim=function(t){if(t-lastT<33)return false;lastT=t;land.userData.tick(t);return true;};s.fog=new T3.Fog(0xa9c3de,200,4600);
  v.renderer.toneMappingExposure=1.0;
  tex=new T3.CanvasTexture($('#scr'));tex.colorSpace=T3.SRGBColorSpace;
  var g=new T3.Group();g.scale.setScalar(0.001);s.add(g);
  box=new CamBox(g,{sw:SW,sh:SH,screenTex:tex});box.update(Bm,st.d);
  box.group.traverse(function(o){if(o.isMesh)o.castShadow=true;});
  // Stativ
  var gy=landHeight(0.07,0),top=-0.07,legM=stdMat(0x22252b,0.5,0.6);
  [[0.25,0.18],[0.25,-0.18],[-0.12,0]].forEach(function(q){var a=V3(0.075,top,0),b=V3(0.075+q[0],landHeight(0.075+q[0],q[1])+0.02,q[1]),L=a.distanceTo(b);
    var leg=new T3.Mesh(new T3.CylinderGeometry(0.008,0.006,L,8),legM);leg.position.copy(a).add(b).multiplyScalar(0.5);leg.quaternion.setFromUnitVectors(V3(0,1,0),a.clone().sub(b).normalize());leg.castShadow=true;s.add(leg);});
  var head=new T3.Mesh(new T3.CylinderGeometry(0.03,0.03,0.012,20),legM);head.position.set(0.075,top+0.004,0);s.add(head);
  rays=new Lines(s,{width:2});
}
function draw(){if(!v.ok)return;box.update(Bm,st.d);var b=Bm/1000,S=[],O=V3(0,0,0),c=[1,0.85,0.3];
  [houseTop,houseFoot].forEach(function(p){var d=O.clone().sub(p).normalize(),t=b/d.x,q=d.clone().multiplyScalar(t);S.push(seg(p,O,scaleC(c,0.25),scaleC(c,0.9)));S.push(seg(O,q,scaleC(c,0.9)));});
  rays.set(S);v.request();}
var pend=false;
function renderScreen(){if(pend)return;pend=true;requestAnimationFrame(function(){pend=false;
  if(!land2)land2=landscapeScene();
  var R=blurDiameter(st.d,Bm,20000,null)/2,E=relBrightness(st.d,Bm);
  scr.render(land2,Bm,R,screenGain(E,HAUS_REF),{near:0.3,far:9000});
  if(tex){tex.needsUpdate=true;v.request();}
  $('#info').textContent='Lichtfleck eines Punktes: '+fmtLen(blurDiameter(st.d,Bm,20000,null))+' · Helligkeit: '+fmt(E,E<1?2:1)+' ×';
});}
new Slider($('#sD'),{label:'Lochdurchmesser d',min:0.2,max:10,value:st.d,log:true,step:0.1,round:0.1,fmt:function(x){return fmt(x,1)+' mm';},onChange:function(x){st.d=x;draw();renderScreen();}});
draw();renderScreen();
})();

