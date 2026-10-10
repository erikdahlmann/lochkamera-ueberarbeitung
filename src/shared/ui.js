
"use strict";
window.addEventListener('error',function(e){if(e&&e.message&&e.message.indexOf('ResizeObserver')>=0){e.preventDefault();e.stopImmediatePropagation();return false;}},true);
(function(){var n=document.getElementById('nojs');if(n)n.style.display='none';})();

function $(s,r){return (r||document).querySelector(s);}
function $$(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));}
function clamp(x,a,b){return x<a?a:(x>b?b:x);}
function fmt(x,dec){dec=dec||0;return Number(x).toLocaleString('de-DE',{minimumFractionDigits:dec,maximumFractionDigits:dec});}
function fmtLen(mm){ // mm -> lesbarer Text
  if(!isFinite(mm)) return '∞';
  if(Math.abs(mm)>=1000) return fmt(mm/1000,2)+' m';
  if(Math.abs(mm)>=100) return fmt(mm,0)+' mm';
  if(Math.abs(mm)>=10) return fmt(mm,1)+' mm';
  return fmt(mm,2)+' mm';
}

/* ---------- Canvas mit hoher Auflösung, passt sich der Breite an ---------- */
function HiCanvas(canvas,aspect,draw){
  var self=this;this.canvas=canvas;this.ctx=canvas.getContext('2d');this.aspect=aspect;this.draw=draw;this.w=0;this.h=0;this.dpr=1;
  var pending=false;
  this.request=function(){if(pending)return;pending=true;requestAnimationFrame(function(){pending=false;self.paint();});};
  this.resize=function(){
    var w=canvas.clientWidth||canvas.parentNode.clientWidth||600;
    var h=Math.round(w/self.aspect);
    canvas.style.height=h+'px';
    self.dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.round(w*self.dpr);canvas.height=Math.round(h*self.dpr);
    self.w=w;self.h=h;self.paint();
  };
  this.paint=function(){if(!self.w)return;self.ctx.setTransform(self.dpr,0,0,self.dpr,0,0);self.draw(self.ctx,self.w,self.h);};
  // Neu zeichnen nur bei Fenster-/Drehänderung (kein ResizeObserver: führt in Safari zu Fehlermeldungen)
  var lastW=0;function check(){var w=canvas.clientWidth;if(w&&Math.abs(w-lastW)>1){lastW=w;self.resize();}}
  window.addEventListener('resize',function(){setTimeout(check,80);});
  window.addEventListener('orientationchange',function(){setTimeout(check,300);});
  window.addEventListener('load',function(){setTimeout(check,50);});
  setTimeout(check,400);
  setTimeout(self.resize,0);
}
HiCanvas.prototype.toLocal=function(ev){var r=this.canvas.getBoundingClientRect();return {x:ev.clientX-r.left,y:ev.clientY-r.top};};

/* ---------- Schieberegler mit +/- Knöpfen ---------- */
var _sliderId=0;
function Slider(el,o){
  var self=this;this.o=o;this.v=o.value;this.el=el;var id='sl'+(++_sliderId);
  el.classList.add('ctl');
  el.innerHTML='<label for="'+id+'"></label><div class="row"><button type="button" class="pm" aria-label="weniger">−</button><input id="'+id+'" type="range" min="0" max="1000" step="1"><button type="button" class="pm" aria-label="mehr">+</button><output for="'+id+'"></output></div>';
  $('label',el).textContent=o.label;
  this.input=$('input',el);this.out=$('output',el);
  var b=$$('button',el);
  function toT(v){return o.log?1000*Math.log(v/o.min)/Math.log(o.max/o.min):1000*(v-o.min)/(o.max-o.min);}
  function fromT(t){return o.log?o.min*Math.pow(o.max/o.min,t/1000):o.min+(o.max-o.min)*t/1000;}
  this.toT=toT;
  function snap(v){var s=o.round||0;if(s)v=Math.round(v/s)*s;return clamp(v,o.min,o.max);}
  this.input.addEventListener('input',function(){self.set(snap(fromT(+self.input.value)),true);});
  /* Pfeiltasten auf dem Regler: genau ein Schritt */
  this.input.addEventListener('keydown',function(e){var d={ArrowLeft:-1,ArrowDown:-1,ArrowRight:1,ArrowUp:1}[e.key];if(!d)return;e.preventDefault();stepBy(d);});
  function stepBy(dir){var st=o.step||((o.max-o.min)/100);self.set(snap(self.v+dir*st),true);}
  [[b[0],-1],[b[1],1]].forEach(function(p){
    var timer=null,rep=null,viaPointer=false;
    p[0].addEventListener('pointerdown',function(e){e.preventDefault();viaPointer=true;stepBy(p[1]);timer=setTimeout(function(){rep=setInterval(function(){stepBy(p[1]);},70);},400);});
    var stop=function(){clearTimeout(timer);clearInterval(rep);};
    p[0].addEventListener('pointerup',stop);p[0].addEventListener('pointerleave',stop);p[0].addEventListener('pointercancel',stop);
    /* Tastatur und Bedienungshilfen lösen nur "click" aus */
    p[0].addEventListener('click',function(){if(viaPointer){viaPointer=false;return;}stepBy(p[1]);});
  });
  this.set(o.value,false);
}
Slider.prototype.set=function(v,fire){this.v=v;this.input.value=Math.round(this.toT(v));var txt=this.o.fmt?this.o.fmt(v):fmt(v);this.out.textContent=txt;
  this.input.setAttribute('aria-valuetext',txt);if(fire&&this.o.onChange)this.o.onChange(v);};
/* Regler sichtbar abschalten (z. B. wenn er gerade nichts bewirkt) */
Slider.prototype.enable=function(on){this.el.classList.toggle('off',!on);this.input.disabled=!on;$$('button',this.el).forEach(function(b){b.disabled=!on;});};

/* ---------- Auswahlknöpfe ---------- */
function Seg(el,items,initial,onChange){
  var self=this;this.value=initial;el.classList.add('seg');el.setAttribute('role','group');el.innerHTML='';
  this.btns=items.map(function(it){
    var b=document.createElement('button');b.type='button';b.innerHTML=it.label;b.dataset.key=it.key;
    b.addEventListener('click',function(){self.set(it.key,true);});el.appendChild(b);return b;});
  this.onChange=onChange;this.set(initial,false);
}
Seg.prototype.set=function(k,fire){this.value=k;this.btns.forEach(function(b){var on=b.dataset.key===String(k);b.classList.toggle('on',on);b.setAttribute('aria-pressed',on?'true':'false');});if(fire&&this.onChange)this.onChange(k);};

/* ---------- Ein/Aus-Knopf: zeigt ○/● und meldet den Zustand an Bedienungshilfen ---------- */
function markToggle(btn,on,label){btn.classList.toggle('on',!!on);btn.setAttribute('aria-pressed',on?'true':'false');btn.textContent=(on?'● ':'○ ')+label;}
function Toggle(btn,label,initial,onChange){var self=this;this.on=!!initial;this.btn=btn;this.label=label;btn.type='button';markToggle(btn,this.on,label);
  btn.addEventListener('click',function(){self.set(!self.on,true);});this.onChange=onChange;}
Toggle.prototype.set=function(on,fire){this.on=!!on;markToggle(this.btn,this.on,this.label);if(fire&&this.onChange)this.onChange(this.on);};

/* ---------- Helligkeit ----------
   Lichtmenge pro Fläche auf dem Schirm ~ d² / b².
   rel = Vielfaches von "1-mm-Loch bei b = 100 mm". */
function relBrightness(d,b){return d*d*(100/b)*(100/b);}
function displayGain(rel){ // für die Darstellung: logarithmisch, wie unser Auge
  return clamp((Math.log(rel)/Math.LN10+1.2)/2.6,0.03,1.35);
}

/* Helligkeit wie unser Auge sie empfindet (logarithmisch), 0…255 */
function tone(v){if(v<=0)return 0;var t=(Math.log(v)*0.4343+2.8)/3.3;return t<0?0:(t>1?255:t*255);}

/* ---------- Bild auf dem Schirm: jeder Punkt wird zu einem Lichtfleck ----------
   Das (umgedrehte) Bild wird mit einer Kreisscheibe vom Radius R (in Pixeln) "verschmiert". */
function ScreenSim(canvas,W,H){
  canvas.width=W;canvas.height=H;this.canvas=canvas;this.ctx=canvas.getContext('2d');this.W=W;this.H=H;
  this.off=document.createElement('canvas');this.off.width=W;this.off.height=H;
  this.octx=this.off.getContext('2d',{willReadFrequently:true});
  this.exposure=0.1;this.P=new Float32Array(H*(W+1)*3);this.img=this.ctx.createImageData(W,H);
}
ScreenSim.prototype.render=function(drawObj,R,E){ // E = Lichtmenge pro Fläche (relativ)
  var W=this.W,H=this.H,o=this.octx,x,y,i,j;
  o.setTransform(1,0,0,1,0,0);o.globalAlpha=1;o.globalCompositeOperation='source-over';o.fillStyle='#000';o.fillRect(0,0,W,H);
  o.save();drawObj(o);o.restore();
  var src=o.getImageData(0,0,W,H).data,P=this.P,W3=(W+1)*3;
  for(y=0;y<H;y++){var a0=0,a1=0,a2=0,base=y*W3;P[base]=P[base+1]=P[base+2]=0;
    for(x=0;x<W;x++){i=(y*W+x)*4;a0+=src[i];a1+=src[i+1];a2+=src[i+2];j=base+(x+1)*3;P[j]=a0;P[j+1]=a1;P[j+2]=a2;}}
  R=clamp(R,0,70);
  var rows=[],wsum=0,dy;
  if(R<0.5){rows.push([0,0,0,1]);wsum=1;}
  else{var Rc=Math.ceil(R+0.5);for(dy=-Rc;dy<=Rc;dy++){var rw=Math.min(1,R+0.5-Math.abs(dy));if(rw<=0)continue;
    var wf=Math.sqrt(Math.max(0,R*R-dy*dy)),wi=Math.floor(wf),fr=wf-wi;rows.push([dy,wi,fr,rw]);wsum+=rw*(2*wi+1+2*fr);}}
  var out=this.img.data,k=E*this.exposure/wsum/255,nr=rows.length;
  for(y=0;y<H;y++){for(x=0;x<W;x++){var s0=0,s1=0,s2=0;
    for(var r=0;r<nr;r++){var row=rows[r],yy=y+row[0];if(yy<0||yy>=H)continue;var b=yy*W3,wi2=row[1],w=row[3];
      var xa=x-wi2,xb=x+wi2;if(xa<0)xa=0;if(xb>W-1)xb=W-1;
      var ja=b+xa*3,jb=b+(xb+1)*3;s0+=w*(P[jb]-P[ja]);s1+=w*(P[jb+1]-P[ja+1]);s2+=w*(P[jb+2]-P[ja+2]);
      if(row[2]>0){var wf2=w*row[2],xl=x-wi2-1,xr=x+wi2+1;
        if(xl>=0){ja=b+xl*3;jb=ja+3;s0+=wf2*(P[jb]-P[ja]);s1+=wf2*(P[jb+1]-P[ja+1]);s2+=wf2*(P[jb+2]-P[ja+2]);}
        if(xr<W){ja=b+xr*3;jb=ja+3;s0+=wf2*(P[jb]-P[ja]);s1+=wf2*(P[jb+1]-P[ja+1]);s2+=wf2*(P[jb+2]-P[ja+2]);}}}
    i=(y*W+x)*4;var L=Math.max(s0,s1,s2)*k,q=L>0?tone(L)/L:0;out[i]=s0*k*q;out[i+1]=s1*k*q;out[i+2]=s2*k*q;out[i+3]=255;}}
  this.ctx.putImageData(this.img,0,0);
};

/* ---------- Motive (Koordinaten in mm, y nach oben, Mitte = optische Achse) ---------- */
var SCENES={
  lampen:{name:'Zwei Lämpchen',h:60,draw:function(c){
    function lamp(x,y,r,col){var g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'#fff');g.addColorStop(.5,col);g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,7);c.fill();}
    lamp(-22,10,6,'#ffd43b');lamp(22,10,6,'#ffd43b');lamp(-6,-22,4,'#74c0fc');lamp(6,-22,4,'#74c0fc');}},
  kerze:{name:'Kerze',h:150,draw:function(c){
    c.fillStyle='#f1e3c6';c.fillRect(-14,-75,28,95);
    c.fillStyle='#333';c.fillRect(-1,20,2,8);
    var g=c.createRadialGradient(0,42,2,0,40,22);g.addColorStop(0,'#fff');g.addColorStop(.35,'#ffe066');g.addColorStop(.75,'#ff922b');g.addColorStop(1,'rgba(255,100,0,0)');
    c.fillStyle=g;c.beginPath();c.ellipse(0,42,11,22,0,0,7);c.fill();}},
  /* Station 1: Lämpchen enger zusammen (gelb ±16 mm, blau ±4,8 mm) */
  lampen1:{name:'Zwei Lämpchen',h:60,draw:function(c){
    function lamp(x,y,r,col){var g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'#fff');g.addColorStop(.5,col);g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,7);c.fill();}
    lamp(-16,16,4,'#ffd43b');lamp(16,16,4,'#ffd43b');lamp(-4.8,-22.4,2.7,'#74c0fc');lamp(4.8,-22.4,2.7,'#74c0fc');}},
  /* Leuchtpunkte wie im Modell; pts wird von der Seite gesetzt */
  punkte:{name:'Leuchtpunkte',h:140,pts:[],draw:function(c){
    SCENES.punkte.pts.forEach(function(p){var g=c.createRadialGradient(0,p.y,0,0,p.y,5);g.addColorStop(0,'#fff');g.addColorStop(.45,p.col);g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.beginPath();c.arc(0,p.y,5,0,7);c.fill();});}},
  haus:{name:'Haus',h:120,draw:function(c){
    c.fillStyle='#4dabf7';c.fillRect(-3000,-10,6000,3000);
    c.fillStyle='#ffe066';c.beginPath();c.arc(55,55,13,0,7);c.fill();
    c.fillStyle='#2f9e44';c.fillRect(-3000,-3000,6000,2990);
    c.fillStyle='#f8f0e3';c.fillRect(-40,-30,60,45);
    c.fillStyle='#e03131';c.beginPath();c.moveTo(-48,15);c.lineTo(-10,48);c.lineTo(28,15);c.closePath();c.fill();
    c.fillStyle='#1c7ed6';c.fillRect(-30,-8,14,12);c.fillRect(-2,-8,14,12);
    c.fillStyle='#7f5539';c.fillRect(-18,-30,12,16);
    c.fillStyle='#795548';c.fillRect(48,-30,6,22);c.fillStyle='#37b24d';c.beginPath();c.arc(51,-2,14,0,7);c.fill();}}
};

/* ---------- Seitenansicht: Strahlengang durch Loch oder Linse ----------
   o = {g,b,d,f (null = nur Loch), pts:[{y,col}], ySpan, bMax, nRays, lens:'box'|'lens'|null, showFocus, power (statt f)} */
function drawSideView(c,w,h,o){
  c.fillStyle='#10131a';c.fillRect(0,0,w,h);
  var P=(o.power!==undefined)?o.power:(o.f?1/o.f:0); // Brechkraft in 1/mm
  var x0=w*0.05,avail=w*0.92,total=o.g+o.bMax,sxL,sxR,broken=false;
  if(o.g/total<=(o.maxLeft||0.45)){sxL=sxR=avail/total;}else{broken=true;sxL=avail*0.33/o.g;sxR=avail*0.67/o.bMax;}
  var xL=x0+o.g*sxL;
  function X(z){return z<0?xL+z*sxL:xL+z*sxR;}
  var sy=h*0.44/o.ySpan;function Y(y){return h/2-y*sy;}
  // Achse
  c.strokeStyle='rgba(255,255,255,.25)';c.setLineDash([6,6]);c.lineWidth=1;c.beginPath();c.moveTo(0,h/2);c.lineTo(w,h/2);c.stroke();c.setLineDash([]);
  if(broken){c.fillStyle='#10131a';c.fillRect(x0+(xL-x0)*0.45,h/2-8,14,16);c.strokeStyle='rgba(255,255,255,.5)';c.beginPath();
    var bx=x0+(xL-x0)*0.45;c.moveTo(bx-3,h/2+8);c.lineTo(bx+3,h/2-8);c.moveTo(bx+9,h/2+8);c.lineTo(bx+15,h/2-8);c.stroke();}
  var b=o.b,d=o.d,nR=o.nRays||7;
  c.globalCompositeOperation='lighter';
  o.pts.forEach(function(p){
    var hs=[],k;for(k=0;k<nR;k++)hs.push(-d/2+d*k/(nR-1));
    // Für weit entfernte Gegenstände: Punkte so behandeln, als hätten sie einen größeren Winkelabstand, damit die Bildpunkte getrennt sichtbar sind
    var yp=o.angRef?p.y*Math.max(1,o.g/o.angRef):p.y;
    var ys=hs.map(function(hh){var s=(hh-yp)/o.g-hh*P;return hh+s*b;});
    var yMin=Math.min.apply(null,ys),yMax=Math.max.apply(null,ys);
    // Lichtkegel
    c.fillStyle=p.col.replace('1)','.16)');
    c.beginPath();c.moveTo(X(-o.g),Y(p.y));c.lineTo(xL,Y(d/2));c.lineTo(xL,Y(-d/2));c.closePath();c.fill();
    c.beginPath();c.moveTo(xL,Y(d/2));c.lineTo(X(b),Y(ys[nR-1]));c.lineTo(X(b),Y(ys[0]));c.lineTo(xL,Y(-d/2));c.closePath();c.fill();
    c.strokeStyle=p.col.replace('1)','.7)');c.lineWidth=1.2;
    hs.forEach(function(hh,i){c.beginPath();c.moveTo(X(-o.g),Y(p.y));c.lineTo(xL,Y(hh));c.lineTo(X(b),Y(ys[i]));c.stroke();});
    // Weiterlauf (gedachter Strahl hinter dem Schirm)
    if(o.showBeyond){c.strokeStyle=p.col.replace('1)','.22)');c.setLineDash([4,5]);var zE=o.bMax;
      hs.forEach(function(hh){var s=(hh-yp)/o.g-hh*P;c.beginPath();c.moveTo(X(b),Y(hh+s*b));c.lineTo(X(zE),Y(hh+s*zE));c.stroke();});c.setLineDash([]);}
    // Fleck auf dem Schirm
    c.strokeStyle=p.col;c.lineWidth=7;c.beginPath();c.moveTo(X(b)+4,Y(yMax)-1);c.lineTo(X(b)+4,Y(yMin)+1);c.stroke();
    if(o.showFocus&&P>0){var bi=1/(P-1/o.g);if(bi>0&&bi<o.bMax*1.02){var yi=-yp*bi/o.g;c.strokeStyle='#fff';c.lineWidth=1.5;c.beginPath();c.arc(X(bi),Y(yi),5,0,7);c.stroke();}}
  });
  c.globalCompositeOperation='source-over';
  // Gegenstand (Pfeil)
  var ys2=o.pts.map(function(p){return p.y;}),top=Math.max.apply(null,ys2),bot=Math.min.apply(null,ys2);
  if(o.pts.length>1){c.strokeStyle='rgba(255,255,255,.6)';c.lineWidth=3;c.beginPath();c.moveTo(X(-o.g),Y(bot));c.lineTo(X(-o.g),Y(top));c.stroke();}
  o.pts.forEach(function(p){c.fillStyle=p.col;c.beginPath();c.arc(X(-o.g),Y(p.y),5,0,7);c.fill();});
  // Wand mit Loch; mit Linse: Öffnung so groß wie die Linse, davor die Blende mit Öffnung d
  c.fillStyle='#868e96';var wt=8,hole=(o.lensD&&o.f)?Math.max(o.lensD,d):d;
  c.fillRect(xL-wt/2,0,wt,Y(hole/2));c.fillRect(xL-wt/2,Y(-hole/2),wt,h-Y(-hole/2));
  if(o.lensD&&o.f&&d<o.lensD){c.fillStyle='#2b2f36';c.fillRect(xL-wt-4,Y(o.lensD/2),5,Y(d/2)-Y(o.lensD/2));c.fillRect(xL-wt-4,Y(-d/2),5,Y(-o.lensD/2)-Y(-d/2));}
  if(o.lens==='box'){c.fillStyle='rgba(255,212,59,.25)';c.strokeStyle='#ffd43b';c.lineWidth=2;var bh=Y(-d/2)-Y(d/2);c.fillRect(xL-14,Y(d/2),28,bh);c.strokeRect(xL-14,Y(d/2),28,bh);
    c.fillStyle='#ffd43b';c.font='bold 22px -apple-system,sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('?',xL,h/2);}
  else if(o.lens==='lens'&&P!==0){var half=Y(-(o.lensD||d)/2)-h/2,bulge=clamp(Math.abs(P)*900,3,16);
    c.fillStyle='rgba(165,216,255,.35)';c.strokeStyle='#a5d8ff';c.lineWidth=2;c.beginPath();
    if(P>0){c.moveTo(xL,h/2-half);c.quadraticCurveTo(xL+bulge*2,h/2,xL,h/2+half);c.quadraticCurveTo(xL-bulge*2,h/2,xL,h/2-half);}
    else{var e=bulge;c.moveTo(xL-e,h/2-half);c.lineTo(xL+e,h/2-half);c.quadraticCurveTo(xL,h/2,xL+e,h/2+half);c.lineTo(xL-e,h/2+half);c.quadraticCurveTo(xL,h/2,xL-e,h/2-half);}
    c.closePath();c.fill();c.stroke();}
  // Schirm
  c.fillStyle='#e9ecef';c.fillRect(X(b)-2,h*0.04,4,h*0.92);
  c.fillStyle='rgba(255,255,255,.85)';c.font='bold 14px -apple-system,sans-serif';c.textAlign='center';c.textBaseline='top';
  c.fillText('Gegenstand',X(-o.g)+10,4);c.fillText(o.f||o.lens==='box'?'Linse':'Loch',xL,4);c.fillText('Schirm',X(b),4);
  c.textBaseline='bottom';c.fillText('b = '+fmtLen(b),(xL+X(b))/2,h-4);
  c.fillText('g = '+fmtLen(o.g),(X(-o.g)+xL)/2,h-4);
}

/* Durchmesser des Lichtflecks eines Punktes auf dem Schirm (mm) */
function blurDiameter(d,b,g,f){var P=f?1/f:0;return d*Math.abs(1-b*P+b/g);}

/* ---------- Eingaben merken (nur auf diesem Gerät) ----------
   data-save="name"  → Schlüssel prefix:name
   data-save-old="lk4:fin" → alter Schlüssel, aus dem beim ersten Öffnen übernommen wird */
var LK_STORE_OK=true;
function lsGet(k){try{return localStorage.getItem(k);}catch(e){LK_STORE_OK=false;return null;}}
function lsSet(k,v){try{localStorage.setItem(k,v);savedBadge(true);return true;}catch(e){LK_STORE_OK=false;savedBadge(false);return false;}}
var _badgeT=null;
function savedBadge(ok){var b=document.getElementById('saveBadge');
  if(!b){b=document.createElement('div');b.id='saveBadge';b.setAttribute('role','status');document.body.appendChild(b);}
  b.textContent=ok?'✓ gespeichert':'⚠ Speichern nicht möglich (privates Fenster?)';b.className=ok?'show':'show bad';
  clearTimeout(_badgeT);_badgeT=setTimeout(function(){b.className=ok?'':'bad';},ok?1200:6000);}
function persistInputs(prefix){
  window.LK_PREFIX=prefix;
  $$('input[data-save],textarea[data-save],select[data-save]').forEach(function(el){
    var key=prefix+':'+el.dataset.save;
    var v=lsGet(key);
    if(v===null&&el.dataset.saveOld){v=lsGet(el.dataset.saveOld);if(v!==null)lsSet(key,v);}
    if(v!==null){if(el.type==='checkbox')el.checked=v==='1';else el.value=v;}
    var save=function(){lsSet(key,el.type==='checkbox'?(el.checked?'1':'0'):el.value);navProgress();};
    el.addEventListener('input',save);if(el.tagName==='SELECT')el.addEventListener('change',save);
  });
  navProgress();
}

/* ---------- Alle Antworten als Text kopieren, Drucken ----------
   Geht jede Karte durch: Überschrift, Tabellen zeilenweise, alle übrigen Felder mit ihrer Aufgabe. */
function fieldValue(el){if(el.tagName==='SELECT'){var o=el.options[el.selectedIndex];return o&&o.value!==''?o.text:'';}return el.value;}
function collectResults(title){
  var lines=[title,new Date().toLocaleDateString('de-DE'),''];
  $$('main section.card, main > .box').forEach(function(sec){
    var fields=$$('input,textarea,select',sec).filter(function(el){return !el.closest('.v3d')&&el.type!=='range'&&el.type!=='button';});
    if(!fields.length)return;
    var h=$('h2',sec);lines.push('## '+(h?h.textContent.trim():(sec.dataset.q||'')));
    var doneTables=[],lastLabel=null;
    fields.forEach(function(el){
      var t=el.closest('table');
      if(t){if(doneTables.indexOf(t)>=0)return;doneTables.push(t);
        $$('tr',t).forEach(function(tr){var cells=$$('th,td',tr).map(function(td){var i=$('input,select,textarea',td);if(i)return fieldValue(i)||'–';return td.textContent.trim();});
          if(cells.join('').replace(/[–\s|]/g,''))lines.push(cells.join(' | '));});
        lastLabel=null;return;}
      var box=el.closest('.box,details,[data-q]'),lab='';
      if(box){var b=$('b,summary',box);lab=b?b.textContent.trim():(box.dataset.q||'');}
      if(lab&&lab!==lastLabel){lines.push(lab+':');lastLabel=lab;}
      var v=fieldValue(el);lines.push(v?v:'–');
    });
    lines.push('');
  });
  return lines.join('\n');
}
function setupCopy(btn,title){
  if(!btn)return;
  btn.addEventListener('click',function(){
    var txt=collectResults(title);
    function done(ok){btn.textContent=ok?'✓ Kopiert! Jetzt z. B. in Notizen einfügen':'Kopieren nicht möglich';setTimeout(function(){btn.textContent='📋 Ergebnisse kopieren';},2500);}
    if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(txt).then(function(){done(true);},function(){fallback();});}else fallback();
    function fallback(){var ta=document.createElement('textarea');ta.value=txt;document.body.appendChild(ta);ta.select();try{done(document.execCommand('copy'));}catch(e){done(false);}document.body.removeChild(ta);}
  });
  var pr=document.createElement('button');pr.type='button';pr.textContent='🖨 Drucken / als PDF';pr.style.marginLeft='8px';
  pr.addEventListener('click',function(){$$('details').forEach(function(d){if(!d.closest('.legal'))d.dataset.wasOpen=d.open?'1':'';});window.print();});
  btn.parentNode.insertBefore(pr,btn.nextSibling);
}

/* ---------- Navigation: Fortschritt der Stationen (aus dem lokalen Speicher) ---------- */
function navProgress(){
  $$('.lknav a[data-prefix]').forEach(function(a){
    var p=a.dataset.prefix+':',n=+a.dataset.n||1,cnt=0;
    try{for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k.indexOf(p)===0&&(localStorage.getItem(k)||'').replace(/\[\]/,'').trim())cnt++;}}catch(e){}
    a.classList.toggle('started',cnt>0);a.classList.toggle('done',cnt>=Math.max(1,Math.round(n*0.6)));
    a.title=cnt?(cnt+' Antworten gespeichert'):'noch nichts eingetragen';
  });
}
document.addEventListener('DOMContentLoaded',navProgress);

/* ---------- Strahlenverfolgung durch Glaskörper (Tischebene, mm) ----------
   Ein Körper ist {pts:[[x,y],…], arcs:[{i0,i1,cx,cy,r}]}: Die Kanten zwischen den Punkten i0…i1
   liegen auf einem Kreis. Dort wird mit dem echten Kreis gerechnet (genaue Normale). */
function shapeFrom(parts){var pts=[],arcs=[];
  parts.forEach(function(p){if(p.arc){var i0=pts.length,n=p.n||48;
      for(var i=0;i<=n;i++){var a=p.a0+(p.a1-p.a0)*i/n;pts.push([p.cx+p.r*Math.cos(a),p.cy+p.r*Math.sin(a)]);}
      arcs.push({i0:i0,i1:pts.length-1,cx:p.cx,cy:p.cy,r:p.r});}
    else pts.push([p[0],p[1]]);});
  /* doppelte Punkte am Übergang entfernen (Indizes nachführen) */
  return {pts:pts,arcs:arcs};}
function shapeMap(s,fn){return {pts:s.pts.map(function(p){return fn(p[0],p[1]);}),arcs:s.arcs.map(function(a){var c=fn(a.cx,a.cy);return {i0:a.i0,i1:a.i1,cx:c[0],cy:c[1],r:a.r};})};}
function insidePoly(P,x,y){var c=false;for(var i=0,j=P.length-1;i<P.length;j=i++){var xi=P[i][0],yi=P[i][1],xj=P[j][0],yj=P[j][1];
  if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))c=!c;}return c;}
/* n: Brechzahl (Zahl). Liefert {path:[[x,y]…], hits:[{x,y,nx,ny,u0,u1,into,tir}]} */
function traceShapes(px,py,ux,uy,shapes,n,maxLen){
  var path=[[px,py]],hits=[];maxLen=maxLen||400;
  for(var it=0;it<40;it++){
    var best=1e9,bn=null,bs=-1,bq=null;
    for(var k=0;k<shapes.length;k++){var S=shapes[k],P=S.pts;
      for(var i=0,j=P.length-1;i<P.length;j=i++){
        var ax=P[j][0],ay=P[j][1],ex=P[i][0]-ax,ey=P[i][1]-ay,den=ux*ey-uy*ex;if(Math.abs(den)<1e-12)continue;
        var t=((ax-px)*ey-(ay-py)*ex)/den,s=((ax-px)*uy-(ay-py)*ux)/den;
        if(t>1e-6&&s>=-1e-9&&s<=1+1e-9&&t<best){
          var L=Math.hypot(ex,ey),nrm=[-ey/L,ex/L],tt=t;
          /* Kante auf einem Kreisbogen? Dann genau mit dem Kreis schneiden */
          for(var a=0;a<S.arcs.length;a++){var A=S.arcs[a];if(i>A.i0&&i<=A.i1){
            var ox=px-A.cx,oy=py-A.cy,B=ux*ox+uy*oy,C=ox*ox+oy*oy-A.r*A.r,D=B*B-C;
            if(D>=0){var r1=-B-Math.sqrt(D),r2=-B+Math.sqrt(D),tc=Math.abs(r1-t)<Math.abs(r2-t)?r1:r2;
              if(tc>1e-6&&Math.abs(tc-t)<2){tt=tc;var qx0=px+ux*tt-A.cx,qy0=py+uy*tt-A.cy;nrm=[qx0/A.r,qy0/A.r];}}
            break;}}
          if(tt<best){best=tt;bn=nrm;bs=k;}}}}
    if(bs<0){path.push([px+ux*maxLen,py+uy*maxLen]);break;}
    var qx=px+ux*best,qy=py+uy*best;path.push([qx,qy]);
    var nx=bn[0],ny=bn[1];if(nx*ux+ny*uy>0){nx=-nx;ny=-ny;}
    var inG=insidePoly(shapes[bs].pts,qx-ux*1e-3,qy-uy*1e-3),n1=inG?n:1,n2=inG?1:n,eta=n1/n2,ci=-(nx*ux+ny*uy),kk=1-eta*eta*(1-ci*ci),u0=[ux,uy],tir=kk<0;
    if(tir){ux=ux+2*ci*nx;uy=uy+2*ci*ny;}else{var f=eta*ci-Math.sqrt(kk);ux=eta*ux+f*nx;uy=eta*uy+f*ny;}
    var L2=Math.hypot(ux,uy);ux/=L2;uy/=L2;
    hits.push({x:qx,y:qy,nx:nx,ny:ny,u0:u0,u1:[ux,uy],into:!inG,tir:tir});
    px=qx+ux*1e-3;py=qy+uy*1e-3;
  }
  return {path:path,hits:hits};
}
/* Sammellinse (bikonvex) bzw. Zerstreuungslinse (bikonkav) als Körper, Mitte (cx,cy), Radius R, halbe Höhe a */
function lensShape(cx,cy,R,a,conv){var tm=Math.asin(a/R),sag=R-Math.sqrt(R*R-a*a);
  if(conv){var T=2*sag+1.5;return shapeFrom([{arc:1,cx:cx+T/2-R,cy:cy,r:R,a0:-tm,a1:tm,n:40},{arc:1,cx:cx-T/2+R,cy:cy,r:R,a0:Math.PI-tm,a1:Math.PI+tm,n:40}]);}
  var c0=2;return shapeFrom([{arc:1,cx:cx+c0/2+R,cy:cy,r:R,a0:Math.PI+tm,a1:Math.PI-tm,n:40},{arc:1,cx:cx-c0/2-R,cy:cy,r:R,a0:tm,a1:-tm,n:40}]);}

/* ---------- Beugung: Durchmesser des Beugungsscheibchens (grünes Licht, 550 nm) ---------- */
var LAMBDA=0.00055;
function airyDiameter(d,b){return 2.44*LAMBDA*b/d;}

/* ---------- Kleines Diagramm ----------
   o: aspect, xMax, yMax, xLabel, yLabel, xUnit, yUnit; draw(series, marks) */
function MiniChart(canvas,o){var self=this;this.o=o;this.series=[];this.marks=[];
  this.hc=new HiCanvas(canvas,o.aspect||1.8,function(c,w,h){self.paint(c,w,h);});}
MiniChart.prototype.set=function(series,marks){this.series=series||[];this.marks=marks||[];this.hc.request();};
MiniChart.prototype.paint=function(c,w,h){var o=this.o;
  c.fillStyle='#fff';c.fillRect(0,0,w,h);
  var L=50,B=36,T=12,R=12,W=w-L-R,H=h-T-B,xm=o.xMax,ym=o.yMax,x0=o.xMin||0,y0=o.yMin||0;
  function X(v){return L+(v-x0)/(xm-x0)*W;}function Y(v){return T+H-(v-y0)/(ym-y0)*H;}
  function step(m){var r=m/5,p=Math.pow(10,Math.floor(Math.log(r)/Math.LN10)),n=r/p;return (n<1.5?1:n<3?2:n<7?5:10)*p;}
  c.font='12px -apple-system,sans-serif';c.lineWidth=1;var v,sx=step(xm-x0),sy=step(ym-y0);
  c.strokeStyle='#e9ecef';c.fillStyle='#5d6577';c.textAlign='center';c.textBaseline='top';
  for(v=Math.ceil(x0/sx)*sx;v<=xm+1e-9;v+=sx){c.beginPath();c.moveTo(X(v),T);c.lineTo(X(v),T+H);c.stroke();c.fillText(fmt(v,sx<1?1:0),X(v),T+H+4);}
  c.textAlign='right';c.textBaseline='middle';
  for(v=Math.ceil(y0/sy)*sy;v<=ym+1e-9;v+=sy){c.beginPath();c.moveTo(L,Y(v));c.lineTo(L+W,Y(v));c.stroke();c.fillText(fmt(v,sy<1?1:0),L-6,Y(v));}
  c.strokeStyle='#1d2230';c.beginPath();c.moveTo(L,T);c.lineTo(L,T+H);c.lineTo(L+W,T+H);c.stroke();
  c.fillStyle='#1d2230';c.font='bold 13px -apple-system,sans-serif';c.textAlign='right';c.textBaseline='bottom';c.fillText(o.xLabel||'',L+W,h-2);
  c.save();c.translate(13,T+H/2);c.rotate(-Math.PI/2);c.textAlign='center';c.textBaseline='middle';c.fillText(o.yLabel||'',0,0);c.restore();
  c.save();c.beginPath();c.rect(L,T,W,H);c.clip();
  this.series.forEach(function(s){c.strokeStyle=s.color||'#1971c2';c.lineWidth=s.width||2.5;c.setLineDash(s.dash||[]);c.beginPath();var first=true;
    s.pts.forEach(function(p){if(p==null||!isFinite(p[1])){first=true;return;}first?c.moveTo(X(p[0]),Y(p[1])):c.lineTo(X(p[0]),Y(p[1]));first=false;});c.stroke();
    if(s.dots){c.fillStyle=s.color;s.pts.forEach(function(p){if(p&&isFinite(p[1])){c.beginPath();c.arc(X(p[0]),Y(p[1]),4,0,7);c.fill();}});}});
  c.setLineDash([]);
  this.marks.forEach(function(m){c.fillStyle=m.color||'#d9480f';c.strokeStyle='#1d2230';c.beginPath();c.arc(X(m.x),Y(m.y),m.r||6,0,7);c.fill();c.stroke();
    if(m.label){c.fillStyle='#1d2230';c.font='bold 12px -apple-system,sans-serif';c.textAlign='left';c.textBaseline='bottom';c.fillText(m.label,X(m.x)+8,Y(m.y)-4);}});
  c.restore();
  if(this.o.legend){var lx=L+10,ly=T+12;c.font='12px -apple-system,sans-serif';c.textAlign='left';c.textBaseline='middle';
    this.o.legend.forEach(function(l,i){c.strokeStyle=l.color;c.lineWidth=3;c.setLineDash(l.dash||[]);c.beginPath();c.moveTo(lx,ly+i*18);c.lineTo(lx+22,ly+i*18);c.stroke();c.setLineDash([]);c.fillStyle='#1d2230';c.fillText(l.label,lx+28,ly+i*18);});}
};

/* ---------- Animation mit Pause ----------
   Knopf startet, pausiert und setzt fort. step(u) bekommt 0…1, Dauer T in ms. */
function AnimButton(btn,labels,T,step,onEnd){var self=this;this.u=0;this.run=false;this.btn=btn;this.labels=labels;btn.type='button';
  var last=0;function frame(t){if(!self.run)return;var dt=last?t-last:16;last=t;self.u=Math.min(1,self.u+dt/T);step(self.u);
    if(self.u>=1){self.run=false;self.u=0;self.show();if(onEnd)onEnd();return;}requestAnimationFrame(frame);}
  btn.addEventListener('click',function(){if(self.run){self.run=false;self.show();return;}self.run=true;last=0;self.show();requestAnimationFrame(frame);});
  this.show();}
AnimButton.prototype.show=function(){this.btn.textContent=this.run?'⏸ Pause':(this.u>0?'▶ Weiter':this.labels);this.btn.setAttribute('aria-pressed',this.run?'true':'false');};
AnimButton.prototype.stop=function(){this.run=false;this.u=0;this.show();};
