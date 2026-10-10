/* =====================================================================
   3D-Werkzeuge für die Lochkamera-Stationen (three.js ist eingebettet)
   Einheiten: 1 = 1 mm (außer in der Landschaft: 1 = 1 m).
   Optische Achse = x-Achse, Licht läuft in +x-Richtung, y = oben.
   ===================================================================== */
var T3=window.THREE;
var DEG3=Math.PI/180;
function V3(x,y,z){return new T3.Vector3(x,y,z);}
function lin(hex){var c=new T3.Color(hex);return [c.r,c.g,c.b];}
function webglOK(){try{var c=document.createElement('canvas');return !!(window.WebGL2RenderingContext&&c.getContext('webgl2'));}catch(e){return false;}}

/* ---------- Zufall und Rauschen (für Landschaft, Folie usw.) ---------- */
function rng(seed){var a=seed>>>0;return function(){a=(a+0x6D2B79F5)>>>0;var t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
function hash2(x,y){var h=Math.sin(x*127.1+y*311.7)*43758.5453;return h-Math.floor(h);}
function vnoise(x,y){var xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
  var a=hash2(xi,yi),b=hash2(xi+1,yi),c=hash2(xi,yi+1),d=hash2(xi+1,yi+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;}
function fbm(x,y,oct){var s=0,a=0.5,f=1,n=oct||5;for(var i=0;i<n;i++){s+=a*vnoise(x*f+i*17.3,y*f-i*9.1);f*=2.03;a*=0.5;}return s/(1-Math.pow(0.5,n));}
function smooth(a,b,x){var t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);}

/* ---------- Texturen aus dem Canvas ---------- */
function canvasTex(w,h,draw,srgb){var c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);var t=new T3.CanvasTexture(c);if(srgb!==false)t.colorSpace=T3.SRGBColorSpace;t.anisotropy=4;return t;}
var _glowTex=null;
function glowTex(){if(_glowTex)return _glowTex;_glowTex=canvasTex(128,128,function(c,w){var g=c.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.18,'rgba(255,255,255,.55)');g.addColorStop(.45,'rgba(255,255,255,.12)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(0,0,128,128);});return _glowTex;}
function glowSprite(rgb,size,strength){var m=new T3.SpriteMaterial({map:glowTex(),color:new T3.Color(rgb[0]*strength,rgb[1]*strength,rgb[2]*strength),blending:T3.AdditiveBlending,depthWrite:false,transparent:true});
  var s=new T3.Sprite(m);s.scale.set(size,size,1);return s;}
var _foilTex=null;
function foilBump(){if(_foilTex)return _foilTex;var R=rng(7);_foilTex=canvasTex(256,256,function(c){c.fillStyle='#808080';c.fillRect(0,0,256,256);
  for(var i=0;i<260;i++){var x=R()*256,y=R()*256,r=8+R()*30,a=R()*6.3,v=Math.floor(90+R()*80);c.fillStyle='rgba('+v+','+v+','+v+',.35)';c.beginPath();
    c.moveTo(x,y);c.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);c.lineTo(x+Math.cos(a+2)*r*.8,y+Math.sin(a+2)*r*.8);c.closePath();c.fill();}},false);
  _foilTex.wrapS=_foilTex.wrapT=T3.RepeatWrapping;return _foilTex;}

/* ---------- Materialien ---------- */
function glassMat(tint,op){return new T3.MeshPhysicalMaterial({color:tint||0xcdeeff,metalness:0,roughness:0.04,transparent:true,opacity:op==null?0.3:op,
  clearcoat:1,clearcoatRoughness:0.03,envMapIntensity:1.6,side:T3.DoubleSide,depthWrite:false,specularIntensity:1});}
function edgeLines(geo,col,op,ang){var e=new T3.LineSegments(new T3.EdgesGeometry(geo,ang||25),new T3.LineBasicMaterial({color:col||0xa5d8ff,transparent:true,opacity:op==null?0.7:op,depthWrite:false}));return e;}
function stdMat(col,rough,metal,extra){var m=new T3.MeshStandardMaterial({color:col,roughness:rough==null?0.6:rough,metalness:metal||0});if(extra)Object.keys(extra).forEach(function(k){m[k]=extra[k];});return m;}

/* ---------- Beschriftungen im Raum ---------- */
function label3d(html,cls){var d=document.createElement('div');d.className='l3d '+(cls||'');d.innerHTML=html;var o=new T3.CSS2DObject(d);o.center.set(0.5,0.5);o.el=d;return o;}

/* ---------- Leuchtende Linien (Lichtstrahlen) ----------
   set([[x1,y1,z1,x2,y2,z2, r,g,b (, r2,g2,b2)], …]) – Farben linear, Helligkeit durch Größe der Farbwerte */
function Lines(parent,o){o=o||{};this.o=o;this.parent=parent;this.obj=null;
  this.mat=new T3.LineMaterial({linewidth:o.width||2,vertexColors:true,transparent:true,opacity:o.opacity==null?1:o.opacity,depthWrite:false,
    dashed:!!o.dashed,dashSize:o.dash||5,gapSize:o.gap||5,worldUnits:false,toneMapped:false});
  if(o.additive!==false)this.mat.blending=T3.AdditiveBlending;
}
Lines.prototype.set=function(segs){
  if(this.obj){this.parent.remove(this.obj);this.obj.geometry.dispose();this.obj=null;}
  if(!segs||!segs.length)return;
  var n=segs.length,pos=new Float32Array(n*6),col=new Float32Array(n*6);
  for(var i=0;i<n;i++){var s=segs[i];for(var k=0;k<6;k++)pos[i*6+k]=s[k];
    col[i*6]=s[6];col[i*6+1]=s[7];col[i*6+2]=s[8];
    if(s.length>=12){col[i*6+3]=s[9];col[i*6+4]=s[10];col[i*6+5]=s[11];}else{col[i*6+3]=s[6];col[i*6+4]=s[7];col[i*6+5]=s[8];}}
  var g=new T3.LineSegmentsGeometry();g.setPositions(pos);g.setColors(col);
  var L=new T3.LineSegments2(g,this.mat);if(this.o.dashed)L.computeLineDistances();L.frustumCulled=false;L.layers.set(this.o.layer==null?1:this.o.layer);L.renderOrder=this.o.order||5;
  this.obj=L;this.parent.add(L);
};
Lines.prototype.visible=function(v){if(this.obj)this.obj.visible=v;};
function seg(a,b,c,c2){var s=[a.x,a.y,a.z,b.x,b.y,b.z,c[0],c[1],c[2]];if(c2)s.push(c2[0],c2[1],c2[2]);return s;}
function scaleC(c,k){return [c[0]*k,c[1]*k,c[2]*k];}

/* ---------- Lichtkegel: Fläche zwischen zwei Ringen (oder Spitze und Ring) ---------- */
function Bundle(parent,o){o=o||{};this.parent=parent;this.mesh=null;
  this.mat=new T3.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:o.opacity==null?0.22:o.opacity,blending:T3.AdditiveBlending,depthWrite:false,side:T3.DoubleSide,toneMapped:false});this.layer=o.layer==null?1:o.layer;}
Bundle.prototype.clear=function(){if(this.mesh){this.parent.remove(this.mesh);this.mesh.geometry.dispose();this.mesh=null;}};
/* rings: Liste von {A:[Vector3…], B:[Vector3…], cA:[r,g,b], cB:[r,g,b]} – A und B gleich lang (geschlossene Ringe) */
Bundle.prototype.set=function(rings){
  this.clear();if(!rings.length)return;
  var pos=[],col=[],idx=[],base=0;
  rings.forEach(function(R){var n=R.A.length,i;
    for(i=0;i<n;i++){pos.push(R.A[i].x,R.A[i].y,R.A[i].z);col.push(R.cA[0],R.cA[1],R.cA[2]);}
    for(i=0;i<n;i++){pos.push(R.B[i].x,R.B[i].y,R.B[i].z);col.push(R.cB[0],R.cB[1],R.cB[2]);}
    for(i=0;i<n;i++){var j=(i+1)%n;idx.push(base+i,base+j,base+n+i,base+j,base+n+j,base+n+i);}
    base+=2*n;});
  var g=new T3.BufferGeometry();g.setAttribute('position',new T3.Float32BufferAttribute(pos,3));g.setAttribute('color',new T3.Float32BufferAttribute(col,3));g.setIndex(idx);
  var m=new T3.Mesh(g,this.mat);m.frustumCulled=false;m.layers.set(this.layer);m.renderOrder=4;this.mesh=m;this.parent.add(m);
};
/* Ring mit Radius r in der Ebene x = konst. um (x,y,z) */
function ringYZ(x,y,z,r,n){var a=[];for(var i=0;i<n;i++){var t=i/n*Math.PI*2;a.push(V3(x,y+Math.cos(t)*r,z+Math.sin(t)*r));}return a;}

/* ---------- Aufräumen: Geometrien und eigene Materialien freigeben ---------- */
function disposeDeep(obj){obj.traverse(function(o){if(o.geometry)o.geometry.dispose();
  if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(function(m){if(!m.userData||!m.userData.shared)m.dispose();});}});}
function clearGroup(g){while(g.children.length){var c=g.children[g.children.length-1];g.remove(c);disposeDeep(c);}}
function sharedMat(m){m.userData.shared=true;return m;}

/* ---------- Die 3D-Ansicht ----------
   o: aspect, maxVH, fov, near, far, pos:[x,y,z], target:[x,y,z], presets:[{label,pos,target, ortho?, size?}],
      shadows, exposure, minDist, maxDist, logDepth, ctl (Regler, die im Vollbild mitkommen), hint */
function View3D(host,o){
  o=o||{};var self=this;this.o=o;this.host=host;this.dirty=true;this.handles=[];this.active=false;this.orthoOn=false;
  host.classList.add('v3d');host.innerHTML='';
  var wrap=document.createElement('div');wrap.className='v3d-wrap'+(o.light?' light':'');host.appendChild(wrap);this.wrap=wrap;
  var file=(location.pathname.split('/').pop()||'');
  function fail(msg){wrap.innerHTML='<div class="v3d-err">'+msg+'<br><br><a style="color:#ffc078" href="../lochkamera/'+file+'">Zur einfachen Fassung (2D) wechseln</a></div>';wrap.style.height='auto';self.ok=false;self.request=function(){};self.goTo=function(){};}
  if(!webglOK()){fail('Die 3D-Ansicht kann auf diesem Gerät nicht angezeigt werden (WebGL 2 fehlt). Bitte aktualisiere iPadOS/Safari.');return;}
  var r;
  try{r=this.renderer=new T3.WebGLRenderer({antialias:true,alpha:true,logarithmicDepthBuffer:!!o.logDepth,powerPreference:'high-performance'});}
  catch(err){fail('Die 3D-Ansicht konnte nicht gestartet werden (zu viele 3D-Ansichten offen oder Grafik überlastet). Lade die Seite neu.');return;}
  this.ok=true;
  r.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  r.outputColorSpace=T3.SRGBColorSpace;r.toneMapping=T3.ACESFilmicToneMapping;r.toneMappingExposure=o.exposure||1;r.setClearColor(0x000000,0);
  if(o.shadows){r.shadowMap.enabled=true;r.shadowMap.type=T3.PCFSoftShadowMap;}
  wrap.appendChild(r.domElement);
  r.domElement.addEventListener('webglcontextlost',function(e){e.preventDefault();fail('Die Grafik wurde vom Gerät angehalten. Lade die Seite neu.');});
  var lab=this.labels=new T3.CSS2DRenderer();lab.domElement.className='v3d-labels';wrap.appendChild(lab.domElement);
  var note=document.createElement('div');note.className='v3d-note';wrap.appendChild(note);var noteT=null;
  this.note=function(txt,ms){note.textContent=txt;note.classList.add('show');clearTimeout(noteT);noteT=setTimeout(function(){note.classList.remove('show');},ms||1600);};
  var rail=document.createElement('div');rail.className='v3d-rail';rail.title='Hier mit dem Finger scrollen';wrap.appendChild(rail);
  var sc=this.scene=new T3.Scene();
  var persp=this.persp=new T3.PerspectiveCamera(o.fov||32,1.6,o.near||1,o.far||20000);persp.layers.enable(1);
  var ortho=this.ortho=new T3.OrthographicCamera(-1,1,1,-1,o.near||1,o.far||20000);ortho.layers.enable(1);
  this.camera=persp;
  if(o.env!==false){var pm=new T3.PMREMGenerator(r);sc.environment=pm.fromScene(new T3.RoomEnvironment(),0.04).texture;sc.environmentIntensity=o.envI==null?0.5:o.envI;pm.dispose();}

  /* --- Ziehen von Objekten (wird VOR der Kamerasteuerung registriert und hat Vorrang) --- */
  var ray=new T3.Raycaster(),ndc=new T3.Vector2(),drag=null,el=r.domElement;this.raycaster=ray;
  function setNdc(e){var b=el.getBoundingClientRect();ndc.set((e.clientX-b.left)/b.width*2-1,-(e.clientY-b.top)/b.height*2+1);ray.setFromCamera(ndc,self.camera);}
  function visibleDeep(obj){while(obj){if(!obj.visible)return false;obj=obj.parent;}return true;}
  el.addEventListener('pointerdown',function(e){
    self.setActive(true,e.pointerType==='mouse');
    if(drag){e.stopImmediatePropagation();return;}
    var hs=self.handles.filter(function(h){return h.enabled!==false&&visibleDeep(h.obj);});if(!hs.length)return;
    setNdc(e);var best=null;
    hs.forEach(function(h){var hit=ray.intersectObject(h.obj,true);if(hit.length&&(!best||hit[0].distance<best.d))best={h:h,d:hit[0].distance,p:hit[0].point};});
    if(!best)return;
    e.stopImmediatePropagation();e.preventDefault();
    drag={h:best.h,id:e.pointerId};try{el.setPointerCapture(e.pointerId);}catch(err){}
    drag.plane=best.h.plane?best.h.plane(best.p):new T3.Plane().setFromNormalAndCoplanarPoint(self.camera.getWorldDirection(V3()).negate(),best.p);
    var p0=V3();ray.ray.intersectPlane(drag.plane,p0);drag.off=best.h.keepOffset?best.h.origin().clone().sub(p0):V3();
    if(best.h.start)best.h.start(best.p);wrap.style.cursor='grabbing';
  });
  el.addEventListener('pointermove',function(e){
    if(drag){e.stopImmediatePropagation();if(e.pointerId!==drag.id)return;setNdc(e);var p=V3();if(ray.ray.intersectPlane(drag.plane,p)){p.add(drag.off);drag.h.move(p);self.dirty=true;}return;}
    if(e.pointerType==='mouse'&&self.handles.length){setNdc(e);var over=self.handles.some(function(h){return h.enabled!==false&&visibleDeep(h.obj)&&ray.intersectObject(h.obj,true).length;});wrap.style.cursor=over?'grab':'';}
  });
  function end(e){if(drag&&(!e||e.pointerId===drag.id)){if(drag.h.end)drag.h.end();drag=null;wrap.style.cursor='';}}
  el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);el.addEventListener('lostpointercapture',end);

  /* --- Mausrad: erst zoomen, wenn die Szene angeklickt wurde; sonst scrollt die Seite --- */
  wrap.addEventListener('wheel',function(e){if(!self.active&&!self.orthoOn){e.stopPropagation();self.note('Zum Zoomen erst in die Szene klicken');}},{capture:true,passive:true});
  document.addEventListener('pointerdown',function(e){if(!host.contains(e.target))self.setActive(false);},true);

  var ctl=this.controls=new T3.OrbitControls(persp,el);
  ctl.enableDamping=true;ctl.dampingFactor=0.12;ctl.rotateSpeed=0.75;ctl.zoomSpeed=0.9;ctl.screenSpacePanning=true;
  ctl.minDistance=o.minDist||10;ctl.maxDistance=o.maxDist||8000;if(o.maxPolar!=null)ctl.maxPolarAngle=o.maxPolar;
  ctl.addEventListener('change',function(){self.dirty=true;});
  var P0=o.pos||[300,200,600],T0=o.target||[0,0,0];persp.position.set(P0[0],P0[1],P0[2]);ctl.target.set(T0[0],T0[1],T0[2]);ctl.update();

  /* --- Knopfleiste: Ansichten, Vollbild --- */
  var bar=document.createElement('div');bar.className='v3d-bar';host.appendChild(bar);this.bar=bar;
  var presets=(o.presets||[]).slice();presets.unshift({label:'↺ Start',pos:o.pos||P0,target:o.target||T0});
  presets.forEach(function(p){var b=document.createElement('button');b.type='button';b.textContent=p.label;b.addEventListener('click',function(){self.goTo(p);});bar.appendChild(b);});
  var fb=document.createElement('button');fb.type='button';fb.textContent='⛶ Groß';bar.appendChild(fb);
  var ctlEl=null,ctlHome=null,ctlBox=null;
  function setFull(on){
    host.classList.toggle('v3d-full',on);document.body.classList.toggle('v3d-lock',on);fb.textContent=on?'✕ Zurück':'⛶ Groß';
    if(o.ctl){ctlEl=typeof o.ctl==='string'?document.querySelector(o.ctl):o.ctl;}
    if(ctlEl){if(on&&!ctlHome){ctlHome=document.createComment('regler');ctlEl.parentNode.insertBefore(ctlHome,ctlEl);ctlBox=document.createElement('div');ctlBox.className='v3d-ctl';ctlBox.appendChild(ctlEl);host.appendChild(ctlBox);}
      else if(!on&&ctlHome){ctlHome.parentNode.insertBefore(ctlEl,ctlHome);ctlHome.parentNode.removeChild(ctlHome);ctlHome=null;host.removeChild(ctlBox);ctlBox=null;}}
    setTimeout(self.check,30);if(on)fb.focus();}
  fb.addEventListener('click',function(){setFull(!host.classList.contains('v3d-full'));});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&host.classList.contains('v3d-full'))setFull(false);});
  var hint=document.createElement('span');hint.className='v3d-hint';hint.textContent=o.hint||'Ein Finger: drehen · zwei Finger: zoomen und verschieben';bar.appendChild(hint);

  /* --- Größe: nur bei Fenster-/Drehänderung (kein ResizeObserver) --- */
  var lastW=0,lastH=0;
  this.resize=function(){var w=wrap.clientWidth;if(!w)return;var full=host.classList.contains('v3d-full');
    var h=full?Math.max(200,host.clientHeight-bar.offsetHeight-(ctlBox?ctlBox.offsetHeight:0)-22):Math.min(Math.round(w/(o.aspect||1.6)),Math.round((window.innerHeight||800)*(o.maxVH||0.62)));
    h=Math.max(h,220);wrap.style.height=full?'':h+'px';if(full)h=wrap.clientHeight||h;
    if(w===lastW&&h===lastH)return;lastW=w;lastH=h;
    r.setSize(w,h);lab.setSize(w,h);persp.aspect=w/h;persp.updateProjectionMatrix();self.fitOrtho();self.dirty=true;};
  this.check=function(){lastW=0;self.resize();};
  window.addEventListener('resize',function(){setTimeout(self.check,80);});
  window.addEventListener('orientationchange',function(){setTimeout(self.check,350);});
  window.addEventListener('load',function(){setTimeout(self.check,50);});
  var det=host.closest?host.closest('details'):null;if(det)det.addEventListener('toggle',function(){setTimeout(self.check,20);});
  setTimeout(self.check,0);setTimeout(self.check,500);

  /* --- Zeichnen nur, wenn nötig und sichtbar --- */
  this.visible=true;
  if('IntersectionObserver' in window){new IntersectionObserver(function(es){self.visible=es[0].isIntersecting;if(self.visible)self.dirty=true;else self.setActive(false);},{rootMargin:'120px'}).observe(wrap);}
  this.anim=null;
  function loop(t){requestAnimationFrame(loop);
    if(self._tween){var u=Math.min(1,(t-self._tween.t0)/700);u=u*u*(3-2*u);persp.position.lerpVectors(self._tween.p0,self._tween.p1,u);ctl.target.lerpVectors(self._tween.q0,self._tween.q1,u);self.dirty=true;if(u>=1)self._tween=null;}
    if(!self.visible||!wrap.clientWidth)return;
    if(!self.orthoOn&&ctl.update())self.dirty=true;
    if(self.anim&&self.anim(t))self.dirty=true;
    if(self.dirty){self.dirty=false;self.render();}}
  requestAnimationFrame(loop);
}
View3D.prototype.setActive=function(on,mouse){if(!this.ok)return;this.active=!!on;this.wrap.classList.toggle('active',!!on&&!!mouse);};
View3D.prototype.request=function(){this.dirty=true;};
View3D.prototype.render=function(){if(this.beforeRender)this.beforeRender();this.renderer.render(this.scene,this.camera);this.labels.render(this.scene,this.camera);};
View3D.prototype.fitOrtho=function(){var c=this.ortho,s=this.orthoSize||100,a=this.persp.aspect||1.6;c.left=-s*a;c.right=s*a;c.top=s;c.bottom=-s;c.updateProjectionMatrix();};
/* Draufsicht ohne Perspektive (zum Ablesen von Winkeln); Drehen ist dann gesperrt */
View3D.prototype.setOrtho=function(p){var pos=typeof p.pos==='function'?p.pos():p.pos,tg=typeof p.target==='function'?p.target():p.target;
  this.orthoOn=true;this.orthoSize=typeof p.size==='function'?p.size():(p.size||100);var c=this.ortho;c.position.set(pos[0],pos[1],pos[2]);c.up.set(0,0,-1);c.lookAt(tg[0],tg[1],tg[2]);
  this.fitOrtho();this.camera=c;this.controls.enabled=false;this._tween=null;this.note('Draufsicht zum Messen · „↺ Start“ zum Drehen',2600);this.dirty=true;};
View3D.prototype.goTo=function(p){if(p.ortho)return this.setOrtho(p);
  if(this.orthoOn){this.orthoOn=false;this.camera=this.persp;this.controls.enabled=true;}
  var pos=typeof p.pos==='function'?p.pos():p.pos,tg=typeof p.target==='function'?p.target():p.target;
  this._tween={t0:performance.now(),p0:this.persp.position.clone(),p1:V3(pos[0],pos[1],pos[2]),q0:this.controls.target.clone(),q1:V3(tg[0],tg[1],tg[2])};};
/* h: {obj, move(p), plane(hitPoint)?, start?, end?, keepOffset?, origin()?} */
View3D.prototype.addHandle=function(h){this.handles.push(h);return h;};
/* Ebene durch Punkt p, die die Achse "axis" enthält und möglichst zur Kamera zeigt (für Verschieben entlang einer Achse) */
View3D.prototype.axisPlane=function(p,axis){var d=this.camera.getWorldDirection(V3());var n=d.clone().sub(axis.clone().multiplyScalar(d.dot(axis)));if(n.lengthSq()<1e-6)n=V3(0,1,0);return new T3.Plane().setFromNormalAndCoplanarPoint(n.normalize(),p);};
View3D.prototype.labDefaults=function(o){o=o||{};var s=this.scene;
  var hemi=new T3.HemisphereLight(0xdfe9ff,0x262a33,o.hemi==null?0.9:o.hemi);s.add(hemi);
  var key=new T3.DirectionalLight(0xffffff,o.key==null?1.6:o.key);key.position.set(o.kx||-300,o.ky||700,o.kz||500);s.add(key);
  if(this.o.shadows){key.castShadow=true;key.shadow.mapSize.set(2048,2048);var S=o.shadowSize||900;var sc2=key.shadow.camera;sc2.left=-S;sc2.right=S;sc2.top=S;sc2.bottom=-S;sc2.near=10;sc2.far=4000;key.shadow.bias=-0.0004;key.shadow.radius=4;
    key.target.position.set(o.tx||0,0,0);s.add(key.target);}
  if(o.room){var R=o.room;this.room=makeLabRoom(s,R);
    /* Kamera bleibt im Raum */
    var lim=0.46*Math.min(R.w,R.d);this.controls.maxDistance=Math.min(this.controls.maxDistance,lim);
    if(this.o.maxPolar==null)this.controls.maxPolarAngle=Math.PI*0.56;}
  this.key=key;return key;};

/* ---------- Experimentiertisch: Platte mit Kante, Gestell bis zum Boden ---------- */
var _benchTex=null;
function benchTex(){if(_benchTex)return _benchTex;var R=rng(3);_benchTex=canvasTex(1024,1024,function(c,w){
  c.fillStyle='#4a4f59';c.fillRect(0,0,w,w);
  for(var i=0;i<9000;i++){var v=Math.floor(62+R()*34);c.fillStyle='rgba('+v+','+(v+4)+','+(v+10)+',.22)';c.fillRect(R()*w,R()*w,1+R()*3,1+R()*3);}
  for(var k=0;k<40;k++){c.strokeStyle='rgba(255,255,255,'+(0.015+R()*0.03)+')';c.lineWidth=1+R()*2;c.beginPath();var x=R()*w,y=R()*w;c.moveTo(x,y);c.lineTo(x+(R()-0.5)*260,y+(R()-0.5)*60);c.stroke();}});
  _benchTex.wrapS=_benchTex.wrapT=T3.RepeatWrapping;return _benchTex;}
function tableTex(){var t=benchTex().clone();t.needsUpdate=true;return t;}
function makeTable(w,d,y,o){o=o||{};var g=new T3.Group();
  var t=tableTex();t.repeat.set(w/600,d/600);
  var top=new T3.Mesh(new T3.BoxGeometry(w,24,d),[stdMat(0x2a2d33,0.6),stdMat(0x2a2d33,0.6),stdMat(0x7d838e,0.82,0,{map:t}),stdMat(0x2a2d33,0.6),stdMat(0x3a3f48,0.5),stdMat(0x3a3f48,0.5)]);
  top.position.y=y-12;top.receiveShadow=true;g.add(top);
  /* helle Kantenleiste */
  var edgeM=stdMat(0x9aa3b0,0.35,0.6);[[0,d/2+3,w+6,6],[0,-d/2-3,w+6,6]].forEach(function(q){var m=new T3.Mesh(new T3.BoxGeometry(q[2],26,q[3]),edgeM);m.position.set(q[0],y-12,q[1]);g.add(m);});
  if(o.legs!==false){var H=o.legH||740,legM=stdMat(0x23262c,0.45,0.7);
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(function(s){var L=new T3.Mesh(new T3.BoxGeometry(50,H,50),legM);L.position.set(s[0]*(w/2-70),y-24-H/2,s[1]*(d/2-70));L.castShadow=true;g.add(L);});
    var rail=new T3.Mesh(new T3.BoxGeometry(w-140,40,30),legM);rail.position.set(0,y-24-H*0.82,-(d/2-70));g.add(rail);
    /* Schubladenschrank unter dem Tisch */
    if(w>900){var cab=new T3.Mesh(new T3.BoxGeometry(Math.min(600,w*0.25),H*0.75,d*0.8),stdMat(0x3b4250,0.7));cab.position.set(w/2-Math.min(600,w*0.25)/2-90,y-24-H*0.4,0);g.add(cab);
      for(var k=0;k<3;k++){var hd=new T3.Mesh(new T3.BoxGeometry(160,14,10),stdMat(0xc8ccd3,0.3,0.9));hd.position.set(cab.position.x,y-24-H*0.13-k*H*0.24,d*0.4+6);g.add(hd);}}}
  if(o.grid){var gr=new T3.GridHelper(Math.max(w,d),Math.round(Math.max(w,d)/(o.grid)),0x8a93a6,0x59606e);gr.material.transparent=true;gr.material.opacity=o.gridOp||0.35;gr.material.depthWrite=false;gr.position.y=y+0.15;
    gr.scale.set(w/Math.max(w,d),1,d/Math.max(w,d));g.add(gr);}
  return g;}
/* Raster mit echten Zentimeter-Kästchen (w × d mm, Schritt mm) */
function makeGrid(w,d,step,c1,c2){var pts=[],x,z;for(x=-w/2;x<=w/2+1e-6;x+=step)pts.push(x,0,-d/2,x,0,d/2);for(z=-d/2;z<=d/2+1e-6;z+=step)pts.push(-w/2,0,z,w/2,0,z);
  var g=new T3.BufferGeometry();g.setAttribute('position',new T3.Float32BufferAttribute(pts,3));
  return new T3.LineSegments(g,new T3.LineBasicMaterial({color:c1||0x5d6474,transparent:true,opacity:0.8}));}

/* ---------- Physikraum als Hintergrund (abgedunkelt, Einheit mm) ----------
   o: cx, cz (Mitte), w (x-Ausdehnung), d (z-Ausdehnung), floorY, h (Höhe) */
function chalkBoardTex(){return canvasTex(2048,700,function(c,w,h){
  var g=c.createLinearGradient(0,0,w,h);g.addColorStop(0,'#203a2e');g.addColorStop(1,'#18301f');c.fillStyle=g;c.fillRect(0,0,w,h);
  var R=rng(21);for(var i=0;i<260;i++){c.fillStyle='rgba(255,255,255,'+(R()*0.035)+')';c.beginPath();c.ellipse(R()*w,R()*h,40+R()*160,8+R()*30,R()*3,0,7);c.fill();}
  c.strokeStyle='rgba(240,240,230,.7)';c.fillStyle='rgba(240,240,230,.72)';c.lineWidth=5;c.lineCap='round';c.lineJoin='round';
  c.font='bold 64px "Chalkboard SE","Comic Sans MS","Segoe Print",sans-serif';c.fillText('Optik',70,100);
  c.font='46px "Chalkboard SE","Comic Sans MS","Segoe Print",sans-serif';
  /* Lochkamera-Skizze */
  c.strokeRect(120,250,260,190);c.beginPath();c.moveTo(120,320);c.lineTo(120,370);c.stroke();
  c.fillStyle='#ffd166';c.beginPath();c.moveTo(40,240);c.lineTo(52,285);c.lineTo(28,285);c.closePath();c.fill();
  c.strokeStyle='rgba(255,209,102,.9)';c.beginPath();c.moveTo(40,240);c.lineTo(380,450);c.moveTo(40,300);c.lineTo(380,390);c.stroke();
  c.strokeStyle='rgba(240,240,230,.85)';c.fillStyle='rgba(240,240,230,.88)';c.fillText('Bild steht Kopf!',110,520);
  /* Linse mit Strahlen */
  var lx=900,ly=330;c.beginPath();c.ellipse(lx,ly,22,150,0,0,7);c.stroke();
  c.beginPath();c.moveTo(560,ly);c.lineTo(1320,ly);c.setLineDash([18,14]);c.stroke();c.setLineDash([]);
  c.strokeStyle='rgba(255,140,140,.95)';[-110,-55,55,110].forEach(function(hh){c.beginPath();c.moveTo(600,ly+hh);c.lineTo(lx,ly+hh);c.lineTo(1080,ly);c.lineTo(1250,ly-hh*0.94);c.stroke();});
  c.fillStyle='rgba(240,240,230,.88)';c.beginPath();c.arc(1080,ly,9,0,7);c.fill();c.fillText('F',1066,ly+66);c.fillText('f',985,ly-14);
  c.fillText('1/f = 1/g + 1/b',1420,250);c.fillText('B : G = b : g',1420,350);
  c.font='40px "Chalkboard SE","Comic Sans MS","Segoe Print",sans-serif';c.fillText('Luft → Glas: zum Lot hin',1420,470);c.fillText('α > β',1420,540);
  /* Datum */c.font='34px "Chalkboard SE","Comic Sans MS",sans-serif';c.fillText(new Date().toLocaleDateString('de-DE'),w-260,70);});}
function blindsTex(){return canvasTex(256,512,function(c,w,h){c.fillStyle='#9aa1aa';c.fillRect(0,0,w,h);
  for(var y=0;y<h;y+=16){c.fillStyle='#c9ced6';c.fillRect(0,y,w,11);c.fillStyle='#6d747e';c.fillRect(0,y+11,w,2);c.fillStyle='#fff7e0';c.fillRect(0,y+13,w,3);}});}
function blindsEmit(){return canvasTex(256,512,function(c,w,h){c.fillStyle='#000';c.fillRect(0,0,w,h);for(var y=0;y<h;y+=16){c.fillStyle='#fff3d0';c.fillRect(0,y+13,w,3);}});}
function spectrumTex(){return canvasTex(768,1024,function(c,w,h){c.fillStyle='#f4f1ea';c.fillRect(0,0,w,h);
  c.fillStyle='#1d2230';c.font='bold 64px -apple-system,Helvetica,Arial,sans-serif';c.fillText('Das Licht',50,110);
  c.font='34px -apple-system,Helvetica,Arial,sans-serif';c.fillText('sichtbares Spektrum',52,170);
  var g=c.createLinearGradient(50,0,w-50,0);['#7a00ff','#3d3dff','#00a2ff','#00e07a','#c8ff00','#ffd800','#ff7a00','#ff1a1a'].forEach(function(col,i,a){g.addColorStop(i/(a.length-1),col);});
  c.fillStyle=g;c.fillRect(50,220,w-100,120);c.fillStyle='#1d2230';c.font='28px -apple-system,Helvetica,Arial,sans-serif';c.fillText('400 nm',50,385);c.fillText('700 nm',w-150,385);
  /* Prisma */c.strokeStyle='#1d2230';c.lineWidth=6;c.beginPath();c.moveTo(380,470);c.lineTo(520,720);c.lineTo(240,720);c.closePath();c.stroke();
  c.lineWidth=8;c.strokeStyle='#fff';c.beginPath();c.moveTo(60,640);c.lineTo(320,600);c.stroke();c.strokeStyle='#999';c.lineWidth=3;c.beginPath();c.moveTo(60,640);c.lineTo(320,600);c.stroke();
  ['#ff1a1a','#ff7a00','#ffd800','#00e07a','#00a2ff','#7a00ff'].forEach(function(col,i){c.strokeStyle=col;c.lineWidth=7;c.beginPath();c.moveTo(450,610);c.lineTo(720,620+i*26);c.stroke();});
  c.fillStyle='#1d2230';c.font='30px -apple-system,Helvetica,Arial,sans-serif';c.fillText('c ≈ 300 000 km/s',50,850);c.fillText('Licht breitet sich',50,910);c.fillText('geradlinig aus.',50,955);});}
function clockTex(){return canvasTex(256,256,function(c,w){c.fillStyle='#f8f9fa';c.beginPath();c.arc(128,128,124,0,7);c.fill();c.strokeStyle='#1d2230';c.lineWidth=8;c.stroke();
  for(var i=0;i<12;i++){var a=i/12*Math.PI*2;c.lineWidth=i%3?4:8;c.beginPath();c.moveTo(128+Math.sin(a)*100,128-Math.cos(a)*100);c.lineTo(128+Math.sin(a)*114,128-Math.cos(a)*114);c.stroke();}
  var d=new Date(),hh=(d.getHours()%12+d.getMinutes()/60)/12*Math.PI*2,mm=d.getMinutes()/60*Math.PI*2;c.lineCap='round';
  c.lineWidth=9;c.beginPath();c.moveTo(128,128);c.lineTo(128+Math.sin(hh)*60,128-Math.cos(hh)*60);c.stroke();c.lineWidth=6;c.beginPath();c.moveTo(128,128);c.lineTo(128+Math.sin(mm)*92,128-Math.cos(mm)*92);c.stroke();
  c.fillStyle='#c92a2a';c.beginPath();c.arc(128,128,8,0,7);c.fill();});}
function floorTex(){var t=canvasTex(512,512,function(c,w){c.fillStyle='#3a3f47';c.fillRect(0,0,w,w);var R=rng(5);
  for(var i=0;i<3000;i++){var v=Math.floor(48+R()*30);c.fillStyle='rgba('+v+','+(v+3)+','+(v+6)+',.35)';c.fillRect(R()*w,R()*w,2,2);}
  c.strokeStyle='rgba(0,0,0,.35)';c.lineWidth=3;c.strokeRect(0,0,w,w);});t.wrapS=t.wrapT=T3.RepeatWrapping;return t;}
function wallTex(){var t=canvasTex(512,512,function(c,w){c.fillStyle='#767a78';c.fillRect(0,0,w,w);var R=rng(8);
  for(var i=0;i<5000;i++){var v=Math.floor(120+R()*40);c.fillStyle='rgba('+v+','+v+','+(v-6)+',.08)';c.fillRect(R()*w,R()*w,3,3);}});t.wrapS=t.wrapT=T3.RepeatWrapping;return t;}
function makeLabRoom(scene,o){
  var G=new T3.Group();G.name='raum';scene.add(G);
  var cx=o.cx||0,cz=o.cz||0,W=o.w,D=o.d,fy=o.floorY,H=o.h||3200,top=fy+H;
  function plane(w,h,mat,x,y,z,ry,rx){var m=new T3.Mesh(new T3.PlaneGeometry(w,h),mat);m.position.set(x,y,z);m.rotation.set(rx||0,ry||0,0);G.add(m);return m;}
  var ft=floorTex();ft.repeat.set(W/500,D/500);
  var floor=plane(W,D,stdMat(0xffffff,0.85,0,{map:ft}),cx,fy,cz,0,-Math.PI/2);floor.receiveShadow=true;
  var wt=wallTex();wt.repeat.set(W/1500,H/1500);var wallM=stdMat(0xffffff,0.95,0,{map:wt}),lowM=stdMat(0x4c5562,0.8);
  plane(W,H,wallM,cx,fy+H/2,cz-D/2,0);plane(W,H,wallM,cx,fy+H/2,cz+D/2,Math.PI);
  plane(D,H,wallM,cx-W/2,fy+H/2,cz,Math.PI/2);plane(D,H,wallM,cx+W/2,fy+H/2,cz,-Math.PI/2);
  /* Sockelstreifen */
  var bh=1000;plane(W,bh,lowM,cx,fy+bh/2,cz-D/2+2,0);plane(W,bh,lowM,cx,fy+bh/2,cz+D/2-2,Math.PI);plane(D,bh,lowM,cx-W/2+2,fy+bh/2,cz,Math.PI/2);plane(D,bh,lowM,cx+W/2-2,fy+bh/2,cz,-Math.PI/2);
  plane(W,D,stdMat(0x23262c,0.95),cx,top,cz,0,Math.PI/2);
  /* Deckenleuchten (aus, leicht glimmend) */
  for(var i=-1;i<=1;i+=2)for(var k=-1;k<=1;k+=2){var lp=new T3.Mesh(new T3.BoxGeometry(1200,30,300),new T3.MeshStandardMaterial({color:0xdfe3ea,emissive:0x8090a0,emissiveIntensity:0.25,roughness:0.5}));lp.position.set(cx+i*W*0.22,top-20,cz+k*D*0.2);G.add(lp);}
  /* Tafel an der Rückwand */
  var bw=Math.min(4400,W*0.42),bhh=bw*700/2048;
  var board=new T3.Mesh(new T3.PlaneGeometry(bw,bhh),stdMat(0xffffff,0.9,0,{map:chalkBoardTex()}));board.position.set(cx-W*0.08,fy+950+bhh/2,cz-D/2+8);G.add(board);
  var frM=stdMat(0xb8bec8,0.35,0.8);[[0,bhh/2+15,bw+60,30],[0,-bhh/2-15,bw+60,30],[bw/2+15,0,30,bhh],[-bw/2-15,0,30,bhh]].forEach(function(q){var f=new T3.Mesh(new T3.BoxGeometry(q[2],q[3],24),frM);f.position.set(board.position.x+q[0],board.position.y+q[1],board.position.z+4);G.add(f);});
  var tray=new T3.Mesh(new T3.BoxGeometry(bw,20,90),frM);tray.position.set(board.position.x,board.position.y-bhh/2-40,board.position.z+45);G.add(tray);
  for(var c2=0;c2<4;c2++){var ch=new T3.Mesh(new T3.CylinderGeometry(7,7,80,8),stdMat([0xffffff,0xffd43b,0xff8787,0x74c0fc][c2],0.9));ch.rotation.z=Math.PI/2;ch.position.set(tray.position.x-bw*0.3+c2*120,tray.position.y+17,tray.position.z);G.add(ch);}
  /* Poster und Uhr */
  var post=new T3.Mesh(new T3.PlaneGeometry(900,1200),stdMat(0xffffff,0.8,0,{map:spectrumTex()}));post.position.set(board.position.x+bw/2+800,fy+1750,cz-D/2+6);G.add(post);
  var clock=new T3.Mesh(new T3.CircleGeometry(190,48),stdMat(0xffffff,0.6,0,{map:clockTex()}));clock.position.set(board.position.x-bw/2-600,fy+2350,cz-D/2+10);G.add(clock);
  /* Fenster mit geschlossenen Jalousien (linke Wand) */
  var bt=blindsTex(),be=blindsEmit();bt.wrapT=be.wrapT=T3.RepeatWrapping;bt.repeat.set(1,3);be.repeat.set(1,3);
  for(var w2=-1;w2<=1;w2++){var win=new T3.Mesh(new T3.PlaneGeometry(1500,1800),new T3.MeshStandardMaterial({map:bt,emissiveMap:be,emissive:0xfff0c8,emissiveIntensity:1.6,roughness:0.7}));
    win.position.set(cx-W/2+8,fy+1900,cz+w2*D*0.3);win.rotation.y=Math.PI/2;G.add(win);
    var wf=new T3.Mesh(new T3.BoxGeometry(40,1880,1580),stdMat(0xe9ecef,0.5));wf.position.set(cx-W/2+2,fy+1900,cz+w2*D*0.3);G.add(wf);
    var sill=new T3.Mesh(new T3.BoxGeometry(220,30,1640),stdMat(0xdee2e6,0.4));sill.position.set(cx-W/2+110,fy+985,cz+w2*D*0.3);G.add(sill);}
  /* Schrank mit Glastüren (rechte Wand) */
  var cabW=Math.min(2600,D*0.45),cab=new T3.Group();cab.position.set(cx+W/2-260,fy,cz-D*0.12);G.add(cab);
  var body=new T3.Mesh(new T3.BoxGeometry(500,2200,cabW),stdMat(0x5b6574,0.7));body.position.y=1100;cab.add(body);
  var shelfM=stdMat(0xadb5bd,0.5);for(var s2=0;s2<4;s2++){var sh=new T3.Mesh(new T3.BoxGeometry(460,20,cabW-40),shelfM);sh.position.set(-10,700+s2*420,0);cab.add(sh);
    var R=rng(30+s2);for(var it=0;it<6;it++){var tall=120+R()*220,isCyl=R()>0.45,geo=isCyl?new T3.CylinderGeometry(40+R()*30,45+R()*30,tall,16):new T3.BoxGeometry(120+R()*140,tall,160+R()*120);
      var obj=new T3.Mesh(geo,isCyl?glassMat(0xd0ebff,0.35):stdMat([0xf2c230,0x868e96,0x1d2230,0xe8590c][it%4],0.6,0.2));obj.position.set(-20,710+s2*420+tall/2,-cabW/2+120+it*(cabW-240)/5);cab.add(obj);}}
  var glassD=new T3.Mesh(new T3.PlaneGeometry(cabW-40,2000),glassMat(0xe7f5ff,0.12));glassD.position.set(-252,1150,0);glassD.rotation.y=-Math.PI/2;cab.add(glassD);
  /* Nebel: Raum verschwimmt nach hinten */
  var R2=Math.max(W,D);scene.fog=new T3.Fog(0x161a22,R2*0.45,R2*1.25);
  return G;}


/* ---------- Kerze ---------- */
var FLAME_VS='uniform float time;uniform float amp;varying float vH;varying vec3 vN;varying vec3 vV;\n'+
 'void main(){vH=uv.y;vec3 p=position;float w=pow(vH,1.6);p.x+=sin(time*7.3+vH*3.0)*amp*w;p.z+=cos(time*5.1+vH*2.0)*amp*0.7*w;p.y*=1.0+0.05*sin(time*11.0);\n'+
 'vec4 mv=modelViewMatrix*vec4(p,1.0);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}';
var FLAME_FS='uniform float glow;varying float vH;varying vec3 vN;varying vec3 vV;\n'+
 'void main(){float fr=abs(dot(normalize(vN),normalize(vV)));\n'+
 'vec3 base=vec3(0.12,0.25,1.0)*2.5;vec3 outer=vec3(1.0,0.36,0.05)*4.0;vec3 core=vec3(1.0,0.86,0.58)*12.0;\n'+
 'float c=smoothstep(0.35,0.95,fr)*smoothstep(0.05,0.3,vH)*(1.0-smoothstep(0.5,0.95,vH));vec3 col=mix(outer,core,c);col=mix(base,col,smoothstep(0.0,0.22,vH));\n'+
 'float a=smoothstep(0.0,0.45,fr)*(1.0-smoothstep(0.8,1.0,vH));gl_FragColor=vec4(col*a*glow,1.0);\n'+
 '#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}';
/* G = Gesamthöhe (Wachs + Flamme). Fuß bei y = 0. */
function makeCandle(G,o){o=o||{};var g=new T3.Group();
  var bodyH=G*0.7,rad=Math.max(G*0.075,3),flH=G*0.3,flW=flH*0.24;
  var wax=new T3.MeshStandardMaterial({color:0xf6ead2,roughness:0.55,metalness:0,emissive:0x6a3a10,emissiveIntensity:0.45});
  var prof=[];prof.push(new T3.Vector2(0,0));prof.push(new T3.Vector2(rad,0));prof.push(new T3.Vector2(rad,bodyH*0.97));prof.push(new T3.Vector2(rad*0.86,bodyH));prof.push(new T3.Vector2(rad*0.25,bodyH*0.985));prof.push(new T3.Vector2(0,bodyH*0.99));
  var body=new T3.Mesh(new T3.LatheGeometry(prof,40),wax);body.castShadow=true;body.receiveShadow=true;g.add(body);
  var wick=new T3.Mesh(new T3.CylinderGeometry(Math.max(rad*0.06,0.35),Math.max(rad*0.06,0.35),flH*0.22,8),stdMat(0x1a1410,0.9));wick.position.y=bodyH+flH*0.08;g.add(wick);
  var fp=[];for(var i=0;i<=24;i++){var t=i/24;var r=flW*Math.pow(Math.sin(Math.PI*Math.pow(t,0.62)),1.15)*(1-0.25*t);fp.push(new T3.Vector2(Math.max(r,0.0001),t*flH));}
  var fm=new T3.ShaderMaterial({uniforms:{time:{value:0},amp:{value:flW*0.12},glow:{value:o.glow||1}},vertexShader:FLAME_VS,fragmentShader:FLAME_FS,transparent:true,blending:T3.AdditiveBlending,depthWrite:false,side:T3.DoubleSide});
  var flame=new T3.Mesh(new T3.LatheGeometry(fp,28),fm);flame.position.y=bodyH+flH*0.02;g.add(flame);
  var halo=glowSprite([1,0.55,0.18],flH*2.6,o.halo==null?1.2:o.halo);halo.position.y=bodyH+flH*0.45;g.add(halo);
  var halo2=glowSprite([1,0.8,0.5],flH*0.9,2.5);halo2.position.y=bodyH+flH*0.4;g.add(halo2);
  var light=new T3.PointLight(0xffa64d,o.light==null?G*G*25:o.light,0,2);light.position.y=bodyH+flH*0.45;g.add(light);
  g.userData={flameMat:fm,light:light,bodyH:bodyH,flH:flH,rad:rad,tick:function(t){fm.uniforms.time.value=t/1000;light.intensity=(o.light==null?G*G*25:o.light)*(0.92+0.08*Math.sin(t/90)*Math.sin(t/37));}};
  return g;}

/* ---------- Landschaft (Einheit: Meter). Kamera im Ursprung schaut in −x-Richtung. ---------- */
var SKY_VS='varying vec3 vDir;void main(){vDir=(modelMatrix*vec4(position,0.0)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);gl_Position.z=gl_Position.w;}';
var SKY_FS='uniform vec3 sunDir;varying vec3 vDir;void main(){vec3 d=normalize(vDir);float h=max(d.y,0.0);\n'+
 'vec3 zen=vec3(0.10,0.30,0.75);vec3 hor=vec3(0.62,0.76,0.92);vec3 c=mix(hor,zen,pow(h,0.5));\n'+
 'if(d.y<0.0)c=mix(hor,vec3(0.42,0.5,0.45),min(1.0,-d.y*5.0));\n'+
 'float s=max(dot(d,normalize(sunDir)),0.0);c+=vec3(1.0,0.82,0.55)*(pow(s,6.0)*0.35+pow(s,60.0)*0.8);c+=vec3(1.0,0.95,0.85)*smoothstep(0.99955,0.99975,s)*60.0;\n'+
 'gl_FragColor=vec4(c,1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}';
var LAND_SUN=new T3.Vector3(0.55,0.62,0.62).normalize();
var LAND_HOUSE={x:-20,z:0.4};
function landHeight(x,z){
  var d=Math.sqrt(x*x+z*z);
  var h=-3+(fbm(x/30,z/30,4)-0.5)*1.4;
  h+=smooth(35,260,d)*(fbm(x/140+3,z/140,5)-0.35)*55*smooth(-30,-90,x);
  h+=1.7*Math.exp(-(x*x+z*z)/18);                                 // kleiner Hügel, auf dem die Kamera steht
  var dh=Math.sqrt((x-LAND_HOUSE.x)*(x-LAND_HOUSE.x)+(z-LAND_HOUSE.z)*(z-LAND_HOUSE.z));
  var k=smooth(9,16,dh);h=-3+(h+3)*k;                               // ebener Bauplatz
  return h;}
function mergeGeos(list){ // nicht indizierte Geometrien mit position/normal/color zusammenfügen
  var P=[],N=[],C=[];list.forEach(function(it){var g=it.g.index?it.g.toNonIndexed():it.g;g.applyMatrix4(it.m||new T3.Matrix4());var p=g.attributes.position.array,n=g.attributes.normal.array;
    for(var i=0;i<p.length;i++){P.push(p[i]);N.push(n[i]);}var c=new T3.Color(it.c);for(var j=0;j<p.length/3;j++){C.push(c.r,c.g,c.b);}});
  var o=new T3.BufferGeometry();o.setAttribute('position',new T3.Float32BufferAttribute(P,3));o.setAttribute('normal',new T3.Float32BufferAttribute(N,3));o.setAttribute('color',new T3.Float32BufferAttribute(C,3));return o;}
function M4(x,y,z,sx,sy,sz,ry){var m=new T3.Matrix4();m.compose(V3(x,y,z),new T3.Quaternion().setFromAxisAngle(V3(0,1,0),ry||0),V3(sx||1,sy||1,sz||1));return m;}
function makeLandscape(o){o=o||{};var G=new T3.Group(),R=rng(42);
  // Himmel
  var sky=new T3.Mesh(new T3.SphereGeometry(4000,48,24),new T3.ShaderMaterial({uniforms:{sunDir:{value:LAND_SUN}},vertexShader:SKY_VS,fragmentShader:SKY_FS,side:T3.BackSide,depthWrite:false,fog:false}));sky.renderOrder=-10;sky.frustumCulled=false;G.add(sky);
  // Licht
  var hemi=new T3.HemisphereLight(0xcfe3ff,0x5d7a45,1.0);G.add(hemi);
  var sun=new T3.DirectionalLight(0xffefd6,3.0);sun.position.copy(LAND_SUN).multiplyScalar(120).add(V3(LAND_HOUSE.x,0,LAND_HOUSE.z));sun.target.position.set(LAND_HOUSE.x,-3,LAND_HOUSE.z);G.add(sun);G.add(sun.target);
  sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);var sc=sun.shadow.camera;sc.left=-32;sc.right=32;sc.top=32;sc.bottom=-32;sc.near=1;sc.far=300;sun.shadow.bias=-0.0006;sun.shadow.normalBias=0.03;
  var fill=new T3.DirectionalLight(0xdfe8ff,0.5);fill.position.set(-60,30,-40);G.add(fill);
  // Boden: fein aufgelöst in der Nähe, grob in der Ferne
  var c1=new T3.Color(0x689f4a),c2=new T3.Color(0x4b8236),c3=new T3.Color(0xa3b866),cp=new T3.Color(0xc2a77f),cr=new T3.Color(0x7f8a6a),tmp=new T3.Color();
  function groundMesh(w,d,cx,nx,nz,dip){var tg=new T3.PlaneGeometry(w,d,nx,nz);tg.rotateX(-Math.PI/2);tg.translate(cx,0,0);
    var pa=tg.attributes.position,cols=[];
    for(var i=0;i<pa.count;i++){var x=pa.getX(i),z=pa.getZ(i),y=landHeight(x,z);
      if(dip){var inX=Math.min(x-(-110),40-x),inZ=Math.min(z+75,75-z),inn=Math.min(inX,inZ);if(inn>0)y-=smooth(0,6,inn)*0.6;}
      pa.setY(i,y);
      var n=fbm(x/9,z/9,4),m=fbm(x/45+9,z/45,3),fine=vnoise(x*1.7,z*1.7);tmp.copy(c1).lerp(c2,clamp(n*1.6-0.45,0,1)).lerp(c3,clamp((m-0.52)*2.6,0,1));
      tmp.multiplyScalar(0.9+0.2*fine);
      if(y>12)tmp.lerp(cr,clamp((y-12)/25,0,0.6));
      var pz=Math.sin(x*0.25)*0.9+0.4;if(x>-17.3&&x<40&&Math.abs(z-pz)<0.8+0.15*fbm(x,z,2))tmp.copy(cp).multiplyScalar(0.9+0.2*fine);   // Weg zum Haus
      cols.push(tmp.r,tmp.g,tmp.b);}
    tg.setAttribute('color',new T3.Float32BufferAttribute(cols,3));tg.computeVertexNormals();
    var gm=new T3.Mesh(tg,new T3.MeshStandardMaterial({vertexColors:true,roughness:0.95}));gm.receiveShadow=true;G.add(gm);}
  groundMesh(150,150,-35,300,300,false);
  groundMesh(1800,1600,-560,220,200,true);
  // Berge in der Ferne
  var mg=[];for(var k=0;k<16;k++){var ang=(-1+2*k/15)*1.25+(R()-0.5)*0.12,dist=2600+R()*1200,hh=200+R()*330,rr=hh*(1.7+R()*0.8);
    var cg=new T3.ConeGeometry(rr,hh,40,12,true);var cpos=cg.attributes.position,ccol=[];
    for(var j=0;j<cpos.count;j++){var vx=cpos.getX(j),vy=cpos.getY(j),vz=cpos.getZ(j),t=(vy+hh/2)/hh,nz=fbm(vx/90+k*7,vz/90,4);var s=1+0.35*(nz-0.5);
      cpos.setX(j,vx*s);cpos.setZ(j,vz*s);cpos.setY(j,vy+(nz-0.5)*hh*0.25*(1-t));
      var snow=t>0.68+0.12*(nz-0.5);var cc=snow?new T3.Color(0xf4f7fb):new T3.Color(0x5f6f7f).lerp(new T3.Color(0x4f6a45),clamp(0.6-t,0,1));ccol.push(cc.r,cc.g,cc.b);}
    cg.setAttribute('color',new T3.Float32BufferAttribute(ccol,3));cg.computeVertexNormals();
    var mm=new T3.Mesh(cg,new T3.MeshStandardMaterial({vertexColors:true,roughness:1,flatShading:true}));mm.position.set(-Math.cos(ang)*dist,hh/2-25,-Math.sin(ang)*dist);G.add(mm);}
  // Haus
  var H=new T3.Group();H.position.set(LAND_HOUSE.x,-3,LAND_HOUSE.z);H.rotation.y=-0.42;G.add(H);
  var wall=stdMat(0xf3ece0,0.85),trim=stdMat(0xffffff,0.6),glass=new T3.MeshStandardMaterial({color:0x29435f,roughness:0.08,metalness:0.3,emissive:0x5c86b5,emissiveIntensity:0.35});
  var roofT=canvasTex(256,256,function(c){c.fillStyle='#a53b27';c.fillRect(0,0,256,256);var r2=rng(5);for(var y=0;y<256;y+=16){c.fillStyle='rgba(60,15,8,.55)';c.fillRect(0,y,256,3);
    for(var x=(y/16%2)*12;x<256;x+=24){var v=Math.floor(r2()*40);c.fillStyle='rgba('+(150+v)+','+(50+v/2)+',30,.35)';c.fillRect(x,y+3,22,13);c.fillStyle='rgba(40,10,5,.4)';c.fillRect(x+22,y+3,2,13);}}});
  roofT.wrapS=roofT.wrapT=T3.RepeatWrapping;roofT.repeat.set(3,2.5);
  var roofM=stdMat(0xffffff,0.75,0,{map:roofT});
  function box(w,h,d,m,x,y,z){var b=new T3.Mesh(new T3.BoxGeometry(w,h,d),m);b.position.set(x,y,z);b.castShadow=true;b.receiveShadow=true;H.add(b);return b;}
  box(6.2,0.35,7.2,stdMat(0x8f8a80,0.9),0,0.17,0);box(6,3.4,7,wall,0,1.85,0);
  var gs=new T3.Shape();gs.moveTo(-3.5,0);gs.lineTo(3.5,0);gs.lineTo(0,2.45);gs.closePath();
  [3,-3].forEach(function(px){var gg=new T3.ExtrudeGeometry(gs,{depth:0.2,bevelEnabled:false});gg.rotateY(Math.PI/2);var m=new T3.Mesh(gg,wall);m.position.set(px-0.1,3.55,0);m.castShadow=true;H.add(m);});
  var th=Math.atan2(2.45,3.5),L=Math.sqrt(3.5*3.5+2.45*2.45)+0.55;
  [1,-1].forEach(function(sg){var rf=new T3.Mesh(new T3.BoxGeometry(6.9,0.2,L),roofM);rf.rotation.x=sg*th;rf.position.set(0,3.55+1.225-0.2*Math.sin(th)+0.12,sg*(1.75+0.2*Math.cos(th)));rf.castShadow=true;rf.receiveShadow=true;H.add(rf);});
  box(0.6,1.9,0.6,stdMat(0x8a4b3a,0.9),-1.2,5.0,-1.7);box(0.75,0.12,0.75,stdMat(0x555555,0.8),-1.2,5.95,-1.7);
  function win(x,y,z,w,h){box(0.12,h+0.16,w+0.16,trim,x,y,z);var gl=box(0.06,h,w,glass,x+0.05,y,z);gl.castShadow=false;box(0.08,h,0.06,trim,x+0.08,y,z);box(0.08,0.06,w,trim,x+0.08,y+h*0.12,z);box(0.3,0.08,w+0.3,trim,x+0.12,y-h/2-0.08,z);}
  win(3.02,2.2,2.1,1.15,1.35);win(3.02,2.2,-2.1,1.15,1.35);
  box(0.12,2.25,1.15,trim,3.02,1.47,0);box(0.08,2.1,1.0,stdMat(0x7a4a2a,0.6),3.06,1.42,0);box(0.1,0.1,0.1,stdMat(0xd4af37,0.3,0.9),3.13,1.4,0.35);
  var rw=new T3.Mesh(new T3.CylinderGeometry(0.38,0.38,0.1,32),glass);rw.rotation.z=Math.PI/2;rw.position.set(3.12,4.45,0);H.add(rw);var rr2=new T3.Mesh(new T3.TorusGeometry(0.4,0.06,8,32),trim);rr2.rotation.y=Math.PI/2;rr2.position.set(3.14,4.45,0);H.add(rr2);
  // Seitenfenster (sonnige Seite)
  [[1.4],[-1.4]].forEach(function(p){box(1.15,1.35,0.12,trim,p[0],2.2,-3.52);var g2=box(1.0,1.2,0.06,glass,p[0],2.2,-3.56);g2.castShadow=false;});
  // Bäume: Laubbäume
  function leafTree(x,z,s,seed){var r3=rng(seed),gy=landHeight(x,z),parts=[];
    parts.push({g:new T3.CylinderGeometry(0.18*s,0.3*s,3.2*s,10),m:M4(0,1.6*s,0),c:0x5b3d27});
    for(var q=0;q<7;q++){var a=r3()*6.3,rad=(0.3+r3()*1.1)*s;parts.push({g:new T3.IcosahedronGeometry((1.3+r3()*0.9)*s,2),m:M4(Math.cos(a)*rad,(3.6+r3()*2.2)*s,Math.sin(a)*rad,1,0.85+r3()*0.3,1),c:[0x3f7d2a,0x4c8f33,0x356f24,0x5a9a3b][q%4]});}
    var mesh=new T3.Mesh(mergeGeos(parts),new T3.MeshStandardMaterial({vertexColors:true,roughness:0.9}));mesh.position.set(x,gy-0.1,z);mesh.castShadow=true;mesh.receiveShadow=true;G.add(mesh);}
  leafTree(-17.5,-8.6,1.25,1);leafTree(-24,7.5,0.95,2);leafTree(-9,-13,0.8,3);leafTree(-31,-11,1.1,4);leafTree(-12,12,0.85,5);leafTree(-40,3,1.2,6);
  // Nadelwald (Instanzen)
  var cg2=mergeGeos([{g:new T3.CylinderGeometry(0.15,0.22,1.6,6),m:M4(0,0.8,0),c:0x4a3322},{g:new T3.ConeGeometry(1.5,2.6,9),m:M4(0,2.3,0),c:0x2c5a2a},{g:new T3.ConeGeometry(1.2,2.2,9),m:M4(0,3.6,0),c:0x2f6230},{g:new T3.ConeGeometry(0.85,1.9,9),m:M4(0,4.8,0),c:0x346a33}]);
  var NT=420,inst=new T3.InstancedMesh(cg2,new T3.MeshStandardMaterial({vertexColors:true,roughness:0.95}),NT),mtx=new T3.Matrix4(),cnt=0;
  for(var q=0;q<1400&&cnt<NT;q++){var tx=-45-R()*260,tz=(R()-0.5)*420;if(Math.abs(tz)<16&&tx>-60)continue;if(fbm(tx/40,tz/40,3)<0.48)continue;
    var s2=1.4+R()*1.6;mtx.compose(V3(tx,landHeight(tx,tz)-0.2,tz),new T3.Quaternion().setFromAxisAngle(V3(0,1,0),R()*6),V3(s2,s2*(0.9+R()*0.4),s2));inst.setMatrixAt(cnt,mtx);inst.setColorAt(cnt,new T3.Color().setHSL(0.3+R()*0.06,0.35+R()*0.2,0.55+R()*0.35));cnt++;}
  inst.count=cnt;inst.castShadow=true;inst.receiveShadow=true;G.add(inst);
  // Zaun und Büsche
  var fence=[];for(var fz=-9;fz<=9;fz+=1.5){if(Math.abs(fz)<1.4)continue;fence.push({g:new T3.BoxGeometry(0.12,1.1,0.12),m:M4(-13.2,landHeight(-13.2,fz)+0.55,fz),c:0xd9cbb0});}
  fence.push({g:new T3.BoxGeometry(0.06,0.1,7.7),m:M4(-13.2,-2.35,-5.05),c:0xd9cbb0});fence.push({g:new T3.BoxGeometry(0.06,0.1,7.7),m:M4(-13.2,-2.35,5.05),c:0xd9cbb0});
  fence.push({g:new T3.BoxGeometry(0.06,0.1,7.7),m:M4(-13.2,-2.75,-5.05),c:0xd9cbb0});fence.push({g:new T3.BoxGeometry(0.06,0.1,7.7),m:M4(-13.2,-2.75,5.05),c:0xd9cbb0});
  var fm=new T3.Mesh(mergeGeos(fence),new T3.MeshStandardMaterial({vertexColors:true,roughness:0.8}));fm.castShadow=true;G.add(fm);
  var bush=[];[[-16.6,3.2],[-16.6,-3.6],[-16.8,4.4],[-16.4,-4.8],[-22,-5.2]].forEach(function(p,i){bush.push({g:new T3.IcosahedronGeometry(0.75+0.2*(i%2),2),m:M4(p[0],landHeight(p[0],p[1])+0.4,p[1],1.3,0.8,1.2),c:[0x3d7a2f,0x4d8a36][i%2]});});
  var bm=new T3.Mesh(mergeGeos(bush),new T3.MeshStandardMaterial({vertexColors:true,roughness:0.9}));bm.castShadow=true;G.add(bm);
  // Blumenwiese (kleine bunte Punkte)
  var fl=[];var r4=rng(11);for(var q2=0;q2<260;q2++){var fx=-9-r4()*28,fz2=(r4()-0.5)*40;if(Math.abs(fx+20)<5&&Math.abs(fz2)<5)continue;fl.push({g:new T3.SphereGeometry(0.035,5,4),m:M4(fx,landHeight(fx,fz2)+0.1,fz2),c:[0xffffff,0xffe066,0xff8787,0xb197fc][q2%4]});}
  G.add(new T3.Mesh(mergeGeos(fl),new T3.MeshStandardMaterial({vertexColors:true,roughness:0.7})));
  // Wolken
  var cm=new T3.MeshStandardMaterial({color:0xffffff,roughness:1,emissive:0xb8c4d6,emissiveIntensity:0.35});var r5=rng(9),clouds=[];
  for(var cl=0;cl<11;cl++){var ca=(-1+2*cl/10)*0.95+(r5()-0.5)*0.15,cd=500+r5()*900,cy=110+r5()*230,parts2=[];
    for(var pp=0;pp<9;pp++){parts2.push({g:new T3.IcosahedronGeometry(22+r5()*26,2),m:M4((r5()-0.5)*110,(r5()-0.2)*22,(r5()-0.5)*70,1,0.62,1),c:0xffffff});}
    var cmesh=new T3.Mesh(mergeGeos(parts2),cm);cmesh.position.set(-Math.cos(ca)*cd,cy,-Math.sin(ca)*cd);cmesh.userData.z0=cmesh.position.z;G.add(cmesh);clouds.push(cmesh);}
  /* Teich mit Schilf */
  var px=-9,pz=-9,py=landHeight(px,pz)+0.04;
  var pond=new T3.Mesh(new T3.CircleGeometry(1,48),new T3.MeshStandardMaterial({color:0x4f7fa8,roughness:0.08,metalness:0.2,emissive:0x23405c,emissiveIntensity:0.6}));
  pond.rotation.x=-Math.PI/2;pond.scale.set(3.4,2.2,1);pond.position.set(px,py,pz);pond.receiveShadow=true;G.add(pond);
  var shore=new T3.Mesh(new T3.RingGeometry(1,1.18,48),stdMat(0x7d6b4f,0.95));shore.rotation.x=-Math.PI/2;shore.scale.set(3.4,2.2,1);shore.position.set(px,py+0.01,pz);G.add(shore);
  var reed=[],r6=rng(17);for(var q3=0;q3<40;q3++){var a3=r6()*6.3,rx=px+Math.cos(a3)*3.6*(0.95+r6()*0.15),rz=pz+Math.sin(a3)*2.4*(0.95+r6()*0.15),hh2=0.6+r6()*0.7;
    reed.push({g:new T3.CylinderGeometry(0.015,0.025,hh2,4),m:M4(rx,landHeight(rx,rz)+hh2/2,rz),c:[0x6b8f3a,0x8aa64a,0x5d7d33][q3%3]});}
  var reedM=new T3.Mesh(mergeGeos(reed),new T3.MeshStandardMaterial({vertexColors:true,roughness:0.9}));reedM.castShadow=true;G.add(reedM);
  /* Rauch aus dem Schornstein */
  H.updateMatrixWorld(true);var chim=H.localToWorld(V3(-1.2,6.1,-1.7));
  var smokeTex=canvasTex(64,64,function(c){var g=c.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(215,215,215,.75)');g.addColorStop(1,'rgba(215,215,215,0)');c.fillStyle=g;c.fillRect(0,0,64,64);});
  var smoke=[];for(var k2=0;k2<14;k2++){var sm=new T3.Sprite(new T3.SpriteMaterial({map:smokeTex,transparent:true,depthWrite:false,opacity:0.6}));sm.userData.ph=k2/14;G.add(sm);smoke.push(sm);}
  /* Vögel */
  var birds=[],bm2=new T3.MeshBasicMaterial({color:0x2b2d33,side:T3.DoubleSide});
  for(var b2=0;b2<6;b2++){var bg=new T3.Group(),wg=new T3.PlaneGeometry(0.55,0.12);wg.translate(0.27,0,0);
    var w1=new T3.Mesh(wg,bm2),w2=new T3.Mesh(wg,bm2);w2.scale.x=-1;bg.add(w1);bg.add(w2);bg.userData={w1:w1,w2:w2,ph:b2*1.3,r:26+b2*2.5,h:20+b2*1.6};G.add(bg);birds.push(bg);}
  function tick(t){var s=t/1000;
    smoke.forEach(function(sm){var u=(s*0.12+sm.userData.ph)%1;sm.position.set(chim.x+u*2.2+Math.sin(u*9+sm.userData.ph*6)*0.25,chim.y+u*7,chim.z+u*1.2);var sz=0.6+u*2.6;sm.scale.set(sz,sz,1);sm.material.opacity=0.85*(1-u)*Math.min(1,u*8);});
    birds.forEach(function(bg,i){var d=bg.userData,a=s*0.18+d.ph;bg.position.set(LAND_HOUSE.x-6+Math.cos(a)*d.r,d.h+Math.sin(s*0.7+i)*0.6,LAND_HOUSE.z+Math.sin(a)*d.r*0.6);bg.rotation.y=-a;
      var fl=Math.sin(s*9+i*2)*0.6;d.w1.rotation.x=fl;d.w2.rotation.x=fl;});
    clouds.forEach(function(c,i){c.position.z=c.userData.z0+Math.sin(s*0.01+i)*60;});}
  tick(0);G.userData.tick=tick;
  G.userData.sun=sun;
  return G;}
function landscapeScene(){var s=new T3.Scene();s.add(makeLandscape());s.fog=new T3.Fog(0xa9c3de,200,4600);return s;}

/* ---------- Bild auf dem Schirm (echte Lochkamera-Abbildung) ----------
   Eine Kamera im Loch schaut auf das Motiv; das Bild wird um 180° gedreht (wie auf dem Schirm)
   und mit einer Kreisscheibe (Lichtfleck) weichgezeichnet. */
var SCR_VS='varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}';
var SCR_FS='uniform sampler2D tSrc;uniform float R;uniform vec2 res;uniform float gain;varying vec2 vUv;\n'+
 'vec3 aces(vec3 x){return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.0,1.0);}\n'+
 'void main(){vec2 uv=1.0-vUv;vec3 s=vec3(0.0);\n'+
 'if(R<0.6){s=textureLod(tSrc,uv,0.0).rgb;}else{float lod=max(0.0,log2(R*0.3));\n'+
 ' for(int i=0;i<112;i++){float fi=float(i);float rr=sqrt((fi+0.5)/112.0)*R;float a=fi*2.39996323;s+=textureLod(tSrc,uv+vec2(cos(a),sin(a))*rr/res,lod).rgb;}s/=112.0;}\n'+
 'vec2 q=vUv-0.5;float vig=1.0-0.35*dot(q,q);vec3 c=aces(s*gain*vig);float l=dot(c,vec3(0.2126,0.7152,0.0722));c=max(mix(vec3(l),c,1.06),0.0);c=pow(c,vec3(1.0/2.2));\n'+
 'float n=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);c+=(n-0.5)*0.012;gl_FragColor=vec4(c,1.0);}';
/* o: W,H (Pixel), sw, sh (Schirmgröße in mm) */
function ScreenCam(canvas,o){this.o=o;this.ok=webglOK();if(!this.ok)return;
  var r=this.renderer=new T3.WebGLRenderer({canvas:canvas,antialias:false,preserveDrawingBuffer:true,alpha:false});
  r.setPixelRatio(1);r.setSize(o.W,o.H,false);r.outputColorSpace=T3.LinearSRGBColorSpace;r.toneMapping=T3.NoToneMapping;r.shadowMap.enabled=true;r.shadowMap.type=T3.PCFSoftShadowMap;
  var half=r.extensions.has('EXT_color_buffer_float')||r.extensions.has('EXT_color_buffer_half_float');
  this.rt=new T3.WebGLRenderTarget(o.W,o.H,{type:half?T3.HalfFloatType:T3.UnsignedByteType,generateMipmaps:true,minFilter:T3.LinearMipmapLinearFilter,magFilter:T3.LinearFilter,samples:4});
  this.cam=new T3.PerspectiveCamera(40,o.sw/o.sh,0.1,10000);
  this.mat=new T3.ShaderMaterial({uniforms:{tSrc:{value:this.rt.texture},R:{value:0},res:{value:new T3.Vector2(o.W,o.H)},gain:{value:1}},vertexShader:SCR_VS,fragmentShader:SCR_FS,depthTest:false,depthWrite:false});
  this.qs=new T3.Scene();var q=new T3.Mesh(new T3.PlaneGeometry(2,2),this.mat);q.frustumCulled=false;this.qs.add(q);this.qc=new T3.OrthographicCamera(-1,1,1,-1,0,1);
  canvas.style.aspectRatio=o.sw+' / '+o.sh;canvas.style.width='100%';canvas.style.height='auto';
}
/* b: Abstand Loch–Schirm (mm), Rmm: Radius des Lichtflecks (mm), gain: Helligkeit; p: {pos, look, near, far, layers} */
ScreenCam.prototype.render=function(scene,b,Rmm,gain,p){if(!this.ok)return;p=p||{};var c=this.cam,o=this.o,r=this.renderer;
  c.fov=Math.min(2*Math.atan(o.sh/2/b)/DEG3,150);c.aspect=o.sw/o.sh;c.near=p.near||0.5;c.far=p.far||8000;
  c.position.copy(p.pos||V3(0,0,0));c.up.set(0,1,0);c.lookAt(p.look||V3(-1,0,0).add(c.position));c.layers.set(p.layers||0);c.updateProjectionMatrix();
  r.setRenderTarget(this.rt);r.setClearColor(p.bg==null?0x000000:p.bg,1);r.clear();r.render(scene,c);r.setRenderTarget(null);
  this.mat.uniforms.R.value=Math.min(Rmm*o.H/o.sh,140);this.mat.uniforms.gain.value=gain;r.render(this.qs,this.qc);
  if(this.onRender)this.onRender();};
/* Helligkeit des Bildes (wie unser Auge, logarithmisch). E = Lichtmenge pro Fläche (relativ) */
function screenGain(E,ref){return clamp(Math.pow(E/ref,0.42),0.004,6);}

/* ---------- Lochkamera als 3D-Modell (Schnittmodell) ----------
   o: sw, sh (Schirm in mm), pw, ph (Vorderwand), screenTex (Textur fürs Schirmbild) */
function CamBox(parent,o){var self=this;this.o=o;var g=this.group=new T3.Group();parent.add(g);
  var pw=o.pw||o.sw+40,ph=o.ph||o.sh+40;this.pw=pw;this.ph=ph;
  this.foil=new T3.MeshStandardMaterial({color:0xdfe3e8,metalness:0.92,roughness:0.3,bumpMap:foilBump(),bumpScale:0.6});
  this.plate=null;this.d=-1;
  var card=stdMat(0x2a2e37,0.92),cardIn=stdMat(0x15171c,0.95);
  var wallT=2;
  this.bottom=new T3.Mesh(new T3.BoxGeometry(1,wallT,pw),card);this.bottom.receiveShadow=true;this.bottom.castShadow=true;g.add(this.bottom);
  this.back=new T3.Mesh(new T3.BoxGeometry(1,ph,wallT),[card,card,card,card,card,cardIn]);this.back.castShadow=true;g.add(this.back);
  var clearM=new T3.MeshPhysicalMaterial({color:0x9fb3c8,transparent:true,opacity:0.07,roughness:0.1,depthWrite:false,side:T3.DoubleSide});
  this.top=new T3.Mesh(new T3.BoxGeometry(1,wallT,pw),clearM);g.add(this.top);this.near=new T3.Mesh(new T3.BoxGeometry(1,ph,wallT),clearM);g.add(this.near);
  this.edges=new T3.Group();g.add(this.edges);
  var scrM=o.screenTex?new T3.MeshBasicMaterial({map:o.screenTex,side:T3.DoubleSide,toneMapped:false}):new T3.MeshStandardMaterial({color:0x8d8c86,roughness:0.95,transparent:true,opacity:0.94,side:T3.DoubleSide});
  this.screenMat=scrM;
  var sg=new T3.PlaneGeometry(o.sw,o.sh);sg.rotateY(Math.PI/2);this.screen=new T3.Mesh(sg,scrM);g.add(this.screen);
  // Rahmen um den Schirm: 4 Leisten
  this.frameParts=[];var fm=stdMat(0x3a3f4a,0.8);
  [[0,(o.sh+4)/2,0,3,4,o.sw+8],[0,-(o.sh+4)/2,0,3,4,o.sw+8],[0,0,(o.sw+4)/2,3,o.sh,4],[0,0,-(o.sw+4)/2,3,o.sh,4]].forEach(function(q){var m=new T3.Mesh(new T3.BoxGeometry(q[3],q[4],q[5]),fm);m.position.set(q[0],q[1],q[2]);m.userData.p=q;self.frameParts.push(m);g.add(m);});
  this.labels={hole:label3d('Loch','dim'),screen:label3d('Schirm','dim')};g.add(this.labels.hole);g.add(this.labels.screen);
}
CamBox.prototype.setHole=function(d){if(Math.abs(d-this.d)<1e-3)return;this.d=d;
  if(this.plate){this.group.remove(this.plate);this.plate.geometry.dispose();}
  var pw=this.pw,ph=this.ph,s=new T3.Shape();s.moveTo(-pw/2,-ph/2);s.lineTo(pw/2,-ph/2);s.lineTo(pw/2,ph/2);s.lineTo(-pw/2,ph/2);s.closePath();
  var hp=new T3.Path();hp.absarc(0,0,Math.max(d/2,0.05),0,Math.PI*2,true);s.holes.push(hp);
  var g=new T3.ExtrudeGeometry(s,{depth:1.2,bevelEnabled:false,curveSegments:Math.max(24,Math.min(96,Math.round(d*6)))});g.rotateY(Math.PI/2);g.translate(-1.2,0,0);
  this.plate=new T3.Mesh(g,this.foil);this.plate.castShadow=true;this.group.add(this.plate);};
CamBox.prototype.update=function(b,d){var pw=this.pw,ph=this.ph,L=b+4;this.setHole(d);
  this.bottom.scale.x=L;this.bottom.position.set(L/2,-ph/2-1,0);this.top.scale.x=L;this.top.position.set(L/2,ph/2+1,0);
  this.back.scale.x=L;this.back.position.set(L/2,0,-pw/2-1);this.near.scale.x=L;this.near.position.set(L/2,0,pw/2+1);
  this.screen.position.x=b;this.frameParts.forEach(function(m){m.position.x=b+1.6;});
  while(this.edges.children.length){var c=this.edges.children.pop();c.geometry.dispose();}
  var eg=new T3.BoxGeometry(L,ph+4,pw+4);var e=edgeLines(eg,0x9fb3c8,0.35);e.position.set(L/2,0,0);this.edges.add(e);
  this.labels.hole.position.set(0,ph/2+12,0);this.labels.screen.position.set(b,ph/2+12,0);};

/* ---------- Runde Linse (Drehkörper um die x-Achse) ---------- */
function lensGeo(d,P){var a=Math.max(d/2,0.5),n=1.5,pts=[],N=24,i,t,sag,R;
  if(P>0){R=Math.max(2*(n-1)/P,a*1.02);sag=R-Math.sqrt(R*R-a*a);var e=0.6;
    for(i=0;i<=N;i++){var yy=a*i/N;pts.push(new T3.Vector2(yy,-(e+sag-(R-Math.sqrt(R*R-yy*yy)))));}
    for(i=N;i>=0;i--){var y2=a*i/N;pts.push(new T3.Vector2(y2,(e+sag-(R-Math.sqrt(R*R-y2*y2)))));}}
  else if(P<0){R=Math.max(2*(n-1)/(-P),a*1.02);sag=R-Math.sqrt(R*R-a*a);var c0=0.6;
    for(i=0;i<=N;i++){var y3=a*i/N;pts.push(new T3.Vector2(y3,-(c0+(R-Math.sqrt(R*R-y3*y3)))));}
    for(i=N;i>=0;i--){var y4=a*i/N;pts.push(new T3.Vector2(y4,(c0+(R-Math.sqrt(R*R-y4*y4)))));}}
  else{pts=[new T3.Vector2(0,-0.8),new T3.Vector2(a,-0.8),new T3.Vector2(a,0.8),new T3.Vector2(0,0.8)];}
  pts[0].x=0.0001;pts[pts.length-1].x=0.0001;
  var g=new T3.LatheGeometry(pts,64);g.rotateZ(-Math.PI/2);g.computeVertexNormals();return g;}
function Lens3D(parent){var g=this.group=new T3.Group();parent.add(g);this.mat=glassMat(0xd9f2ff,0.38);this.mesh=null;this.rim=null;this.key='';}
Lens3D.prototype.set=function(d,P,show){this.group.visible=!!show;if(!show)return;var k=d.toFixed(2)+'|'+P.toFixed(6);if(k===this.key)return;this.key=k;
  if(this.mesh){this.group.remove(this.mesh);this.mesh.geometry.dispose();this.group.remove(this.edge);this.edge.geometry.dispose();this.group.remove(this.rim);this.rim.geometry.dispose();}
  var lg=lensGeo(d,P);this.mesh=new T3.Mesh(lg,this.mat);this.mesh.renderOrder=6;this.group.add(this.mesh);
  this.edge=edgeLines(lg,0xbfe6ff,0.55,40);this.group.add(this.edge);
  this.rim=new T3.Mesh(new T3.TorusGeometry(d/2+1.4,1.4,10,64),stdMat(0x2b2f36,0.4,0.6));this.rim.rotation.y=Math.PI/2;this.group.add(this.rim);};

/* ---------- Motive für das Schirmbild (Einheit mm, Loch im Ursprung, Motiv bei x = −g) ---------- */
function candleScene(g,G,footY){var s=new T3.Scene();var c=makeCandle(G,{});c.position.set(-g,footY,0);s.add(c);
  var plate=new T3.Mesh(new T3.CylinderGeometry(c.userData.rad*2.2,c.userData.rad*2.6,3,40),stdMat(0xb08d57,0.35,0.8));plate.position.set(-g,footY-1.5,0);s.add(plate);
  var tb=new T3.Mesh(new T3.PlaneGeometry(6000,6000),stdMat(0x5a4636,0.75));tb.rotation.x=-Math.PI/2;tb.position.set(-g,footY-3,0);tb.receiveShadow=true;s.add(tb);
  var wall=new T3.Mesh(new T3.PlaneGeometry(8000,6000),stdMat(0x6a6f7a,0.95));wall.rotation.y=Math.PI/2;wall.position.set(-g-700,0,0);s.add(wall);
  s.add(new T3.AmbientLight(0x6070a0,0.06));s.userData.candle=c;return s;}
/* Zwei gelbe und zwei blaue Lämpchen; lay = [x gelb, y gelb, x blau, y blau] in Einheiten von k */
var LAMPS_STD=[22,10,6,-22];
function lampsScene(g,k,lay){var s=new T3.Scene();lay=lay||LAMPS_STD;
  var board=new T3.Mesh(new T3.PlaneGeometry(220*k,150*k),stdMat(0x1b1d22,0.6));board.rotation.y=Math.PI/2;board.position.set(-g-6*k,0,0);s.add(board);
  [[lay[0],lay[1],6,[1,0.78,0.22]],[-lay[0],lay[1],6,[1,0.78,0.22]],[lay[2],lay[3],4,[0.35,0.68,1]],[-lay[2],lay[3],4,[0.35,0.68,1]]].forEach(function(L){
    var x=-g,y=L[1]*k,z=-L[0]*k,r=L[2]*k*0.42,c=L[3];
    var bulb=new T3.Mesh(new T3.SphereGeometry(r,24,16),new T3.MeshBasicMaterial({color:new T3.Color(c[0]*7,c[1]*7,c[2]*7)}));bulb.position.set(x,y,z);s.add(bulb);
    var gl=glowSprite(c,r*5,1.2);gl.position.set(x+r,y,z);s.add(gl);
    var sock=new T3.Mesh(new T3.CylinderGeometry(r*0.8,r*0.8,4*k,20),stdMat(0x8a8f99,0.4,0.8));sock.rotation.z=Math.PI/2;sock.position.set(x-r-1*k,y,z);s.add(sock);
    var pl=new T3.PointLight(new T3.Color(c[0],c[1],c[2]),k*k*900,0,2);pl.position.set(x+r*2,y,z);s.add(pl);});
  s.add(new T3.AmbientLight(0xffffff,0.02));return s;}
/* Leiste mit farbigen Leuchtpunkten (wie im 3D-Modell von Station 1) */
function ledsScene(g,pts){var s=new T3.Scene();
  var board=new T3.Mesh(new T3.BoxGeometry(6,170,40),stdMat(0x20232b,0.5,0.3));board.position.set(-g-6,0,0);s.add(board);
  pts.forEach(function(p){var m=ledMesh(p.col,3.2);m.position.set(-g,p.y,0);s.add(m);});
  s.add(new T3.AmbientLight(0xffffff,0.03));return s;}
/* Motiv verschiebbar: Alles wandert in eine Gruppe; setG(g) stellt den Abstand ein */
function shiftable(s,g0){var grp=new T3.Group();while(s.children.length)grp.add(s.children[0]);s.add(grp);s.userData.setG=function(g){grp.position.x=g0-g;};return s;}
/* Leuchtpunkt (LED) für 3D-Modelle */
function ledMesh(hex,r){var c=lin(hex),g=new T3.Group();
  var m=new T3.Mesh(new T3.SphereGeometry(r,20,14),new T3.MeshBasicMaterial({color:new T3.Color(c[0]*3,c[1]*3,c[2]*3)}));g.add(m);
  var s=glowSprite(c,r*7,1.1);g.add(s);return g;}

/* ---------- Lichtbündel von Punkten durch Loch/Linse auf den Schirm ----------
   o: pts [{y,col,yp}], g, b, d, P (Brechkraft 1/mm), xMax (wie weit links gezeichnet wird),
      nRays (Strahlen in der Zeichenebene), beyond (bis wohin gestrichelt weiter), N (Ringpunkte) */
function BundleSet(scene){this.cones=new Bundle(scene,{opacity:0.11});this.rays=new Lines(scene,{width:1.7});this.dash=new Lines(scene,{width:1.2,dashed:true,dash:6,gap:6});
  this.discs=new T3.Group();scene.add(this.discs);this.marks=new T3.Group();scene.add(this.marks);}
BundleSet.prototype.update=function(o){
  var N=o.N||48,R=[],S=[],D=[],self=this,a=o.d/2,b=o.b,g=o.g,P=o.P||0,xMax=o.xMax||1e9,nR=o.nRays||7,kk0=o.k==null?1:o.k;
  while(this.discs.children.length){var c0=this.discs.children.pop();c0.geometry.dispose();c0.material.dispose();}
  while(this.marks.children.length){var m0=this.marks.children.pop();if(m0.geometry)m0.geometry.dispose();}
  o.pts.forEach(function(p){var c=scaleC(lin(p.col),kk0),yp=p.yp==null?p.y:p.yp,S0=V3(-g,yp,0);
    function after(h,x){var sy=(h.y-yp)/g-h.y*P,sz=h.z/g-h.z*P;return V3(x,h.y+sy*x,h.z+sz*x);}
    function before(h){if(g<=xMax)return S0.clone();var t=xMax/g;return V3(-xMax,h.y+(yp-h.y)*t,h.z+(0-h.z)*t);}
    var far=g>xMax,cS=far?scaleC(c,0.0):scaleC(c,0.45);
    var A=ringYZ(0,0,0,a,N),B0=A.map(before),B1=A.map(function(h){return after(h,b);});
    R.push({A:B0,B:A,cA:cS,cB:scaleC(c,0.9)});R.push({A:A,B:B1,cA:scaleC(c,0.9),cB:scaleC(c,0.7)});
    for(var i=0;i<nR;i++){var hy=nR>1?-a+2*a*i/(nR-1):0,h=V3(0,hy,0);S.push(seg(before(h),h,far?[0,0,0]:scaleC(c,0.2),scaleC(c,0.5)));S.push(seg(h,after(h,b),scaleC(c,0.5)));
      if(o.beyond&&o.beyond>b)D.push(seg(after(h,b),after(h,o.beyond),scaleC(c,0.22),scaleC(c,0.02)));}
    var k=1-b*P+b/g,cy=-yp*b/g,rr=Math.max(Math.abs(k)*a,0.25);
    var cd=lin(p.col);var dm=new T3.Mesh(new T3.CircleGeometry(rr,48),new T3.MeshBasicMaterial({color:new T3.Color(cd[0],cd[1],cd[2]),transparent:true,opacity:0.85,depthWrite:false,side:T3.DoubleSide,toneMapped:false}));
    dm.rotation.y=Math.PI/2;dm.position.set(b-0.5,cy,0);self.discs.add(dm);var dm2=dm.clone();dm2.position.x=b+0.5;self.discs.add(dm2);
    if(o.focus&&P>0){var bi=1/(P-1/g);if(bi>0&&bi<(o.beyond||b)*1.02){var mk=new T3.Mesh(new T3.TorusGeometry(Math.max(2,o.markR||3),0.5,8,32),new T3.MeshBasicMaterial({color:0xffffff,toneMapped:false}));mk.rotation.y=Math.PI/2;mk.position.set(bi,-yp*bi/g,0);self.marks.add(mk);}}
  });
  this.cones.set(R);this.rays.set(S);this.dash.set(D);
};

/* ---------- Glaskörper aus 2D-Umrissen (Tischebene). map(x,y) liefert [X,Z] ---------- */
function GlassBody(parent,o){o=o||{};this.parent=parent;this.o=o;this.items=[];this.mat=glassMat(o.tint||0xcdeeff,o.op==null?0.3:o.op);}
GlassBody.prototype.set=function(polys,map,height,y0){var self=this;
  this.items.forEach(function(m){self.parent.remove(m);m.geometry.dispose();});this.items=[];
  polys.forEach(function(P){var sh=new T3.Shape();P.forEach(function(p,i){var q=map(p[0],p[1]);if(i)sh.lineTo(q[0],-q[1]);else sh.moveTo(q[0],-q[1]);});sh.closePath();
    var g=new T3.ExtrudeGeometry(sh,{depth:height,bevelEnabled:false,curveSegments:4});g.rotateX(-Math.PI/2);g.translate(0,y0||0,0);g.computeVertexNormals();
    var m=new T3.Mesh(g,self.mat);m.renderOrder=6;self.parent.add(m);self.items.push(m);
    var e=edgeLines(g,self.o.edge||0xa5d8ff,0.75,20);self.parent.add(e);self.items.push(e);});};
GlassBody.prototype.setOpacity=function(op){this.mat.opacity=op;};
/* Experimentierleuchte: Gehäuse zeigt in lokale +x-Richtung */
function Lamp3D(parent,o){o=o||{};var g=this.group=new T3.Group();parent.add(g);var w=o.w||12;
  var body=new T3.Mesh(new T3.BoxGeometry(22,14,w+2),stdMat(0xf2c230,0.45,0.25));body.position.x=-11;body.castShadow=true;g.add(body);
  var cap=new T3.Mesh(new T3.BoxGeometry(2,15,w+3),stdMat(0x23262d,0.5,0.4));cap.position.x=0.5;g.add(cap);
  var slit=new T3.Mesh(new T3.BoxGeometry(0.6,9,Math.max(1.2,w-2)),new T3.MeshBasicMaterial({color:new T3.Color(4,3.2,2),toneMapped:true}));slit.position.x=1.7;g.add(slit);
  var gl=glowSprite([1,0.8,0.5],18,0.9);gl.position.x=3;g.add(gl);
  this.hit=new T3.Mesh(new T3.BoxGeometry(34,26,Math.max(26,w+12)),new T3.MeshBasicMaterial({visible:false}));this.hit.position.x=-10;g.add(this.hit);}
function RingHandle(parent){var g=this.group=new T3.Group();parent.add(g);
  var t=new T3.Mesh(new T3.TorusGeometry(5,1.1,12,40),new T3.MeshStandardMaterial({color:0xffffff,emissive:0x777777,roughness:0.3}));t.rotation.x=Math.PI/2;g.add(t);
  this.hit=new T3.Mesh(new T3.CylinderGeometry(11,11,10,24),new T3.MeshBasicMaterial({visible:false}));g.add(this.hit);}
/* Polylinie in Segmente umwandeln */
function polySegs(pts,c,c2){var a=[];for(var i=1;i<pts.length;i++)a.push(seg(pts[i-1],pts[i],c,c2));return a;}
/* Strecke an Rechteck abschneiden (2D) */
function clipEnd(p,q,x0,y0,x1,y1){var t=1,dx=q[0]-p[0],dy=q[1]-p[1];
  if(dx>0)t=Math.min(t,(x1-p[0])/dx);if(dx<0)t=Math.min(t,(x0-p[0])/dx);if(dy>0)t=Math.min(t,(y1-p[1])/dy);if(dy<0)t=Math.min(t,(y0-p[1])/dy);t=Math.max(t,0);return [p[0]+dx*t,p[1]+dy*t];}
