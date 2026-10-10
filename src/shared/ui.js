
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
function Slider(el,o){
  var self=this;this.o=o;this.v=o.value;
  el.classList.add('ctl');
  el.innerHTML='<label></label><div class="row"><button class="pm" aria-label="weniger">−</button><input type="range" min="0" max="1000" step="1"><button class="pm" aria-label="mehr">+</button><output></output></div>';
  $('label',el).textContent=o.label;
  this.input=$('input',el);this.out=$('output',el);
  var b=$$('button',el);
  function toT(v){return o.log?1000*Math.log(v/o.min)/Math.log(o.max/o.min):1000*(v-o.min)/(o.max-o.min);}
  function fromT(t){return o.log?o.min*Math.pow(o.max/o.min,t/1000):o.min+(o.max-o.min)*t/1000;}
  this.toT=toT;
  function snap(v){var s=o.round||0;if(s)v=Math.round(v/s)*s;return clamp(v,o.min,o.max);}
  this.input.addEventListener('input',function(){self.set(snap(fromT(+self.input.value)),true);});
  function stepBy(dir){var st=o.step||((o.max-o.min)/100);self.set(snap(self.v+dir*st),true);}
  [[b[0],-1],[b[1],1]].forEach(function(p){
    var timer=null,rep=null;
    p[0].addEventListener('pointerdown',function(e){e.preventDefault();stepBy(p[1]);timer=setTimeout(function(){rep=setInterval(function(){stepBy(p[1]);},70);},400);});
    var stop=function(){clearTimeout(timer);clearInterval(rep);};
    p[0].addEventListener('pointerup',stop);p[0].addEventListener('pointerleave',stop);p[0].addEventListener('pointercancel',stop);
  });
  this.set(o.value,false);
}
Slider.prototype.set=function(v,fire){this.v=v;this.input.value=Math.round(this.toT(v));this.out.textContent=this.o.fmt?this.o.fmt(v):fmt(v);if(fire&&this.o.onChange)this.o.onChange(v);};

/* ---------- Auswahlknöpfe ---------- */
function Seg(el,items,initial,onChange){
  var self=this;this.value=initial;el.classList.add('seg');el.innerHTML='';
  this.btns=items.map(function(it){
    var b=document.createElement('button');b.innerHTML=it.label;b.dataset.key=it.key;
    b.addEventListener('click',function(){self.set(it.key,true);});el.appendChild(b);return b;});
  this.onChange=onChange;this.set(initial,false);
}
Seg.prototype.set=function(k,fire){this.value=k;this.btns.forEach(function(b){b.classList.toggle('on',b.dataset.key===String(k));});if(fire&&this.onChange)this.onChange(k);};

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
  // Wand mit Loch / Blende
  c.fillStyle='#868e96';var wt=8;
  c.fillRect(xL-wt/2,0,wt,Y(d/2));c.fillRect(xL-wt/2,Y(-d/2),wt,h-Y(-d/2));
  if(o.lens==='box'){c.fillStyle='rgba(255,212,59,.25)';c.strokeStyle='#ffd43b';c.lineWidth=2;var bh=Y(-d/2)-Y(d/2);c.fillRect(xL-14,Y(d/2),28,bh);c.strokeRect(xL-14,Y(d/2),28,bh);
    c.fillStyle='#ffd43b';c.font='bold 22px -apple-system,sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('?',xL,h/2);}
  else if(o.lens==='lens'&&P!==0){var half=Y(-d/2)-h/2,bulge=clamp(Math.abs(P)*900,3,16);
    c.fillStyle='rgba(165,216,255,.35)';c.strokeStyle='#a5d8ff';c.lineWidth=2;c.beginPath();
    if(P>0){c.moveTo(xL,h/2-half);c.quadraticCurveTo(xL+bulge*2,h/2,xL,h/2+half);c.quadraticCurveTo(xL-bulge*2,h/2,xL,h/2-half);}
    else{var e=bulge;c.moveTo(xL-e,h/2-half);c.lineTo(xL+e,h/2-half);c.quadraticCurveTo(xL,h/2,xL+e,h/2+half);c.lineTo(xL-e,h/2+half);c.quadraticCurveTo(xL,h/2,xL-e,h/2-half);}
    c.closePath();c.fill();c.stroke();}
  // Schirm
  c.fillStyle='#e9ecef';c.fillRect(X(b)-2,h*0.04,4,h*0.92);
  c.fillStyle='rgba(255,255,255,.75)';c.font='13px -apple-system,sans-serif';c.textAlign='center';c.textBaseline='top';
  c.fillText('Gegenstand',X(-o.g)+10,4);c.fillText(o.f||o.lens==='box'?'Linse':'Loch',xL,4);c.fillText('Schirm',X(b),4);
  c.textBaseline='bottom';c.fillText('b = '+fmtLen(b),(xL+X(b))/2,h-4);
  c.fillText('g = '+fmtLen(o.g),(X(-o.g)+xL)/2,h-4);
}

/* Durchmesser des Lichtflecks eines Punktes auf dem Schirm (mm) */
function blurDiameter(d,b,g,f){var P=f?1/f:0;return d*Math.abs(1-b*P+b/g);}

/* ---------- Eingaben merken (nur auf diesem Gerät) ---------- */
function persistInputs(prefix){
  $$('input[data-save],textarea[data-save],select[data-save]').forEach(function(el){
    var key=prefix+':'+el.dataset.save;
    try{var v=localStorage.getItem(key);if(v!==null){if(el.type==='checkbox')el.checked=v==='1';else el.value=v;}}catch(e){}
    el.addEventListener('input',function(){try{localStorage.setItem(key,el.type==='checkbox'?(el.checked?'1':'0'):el.value);}catch(e){}});
  });
}
/* Alle Tabellen/Antworten als Text kopieren */
function setupCopy(btn,title){
  if(!btn)return;
  btn.addEventListener('click',function(){
    var lines=[title,''];
    $$('[data-q]').forEach(function(sec){
      lines.push('## '+sec.dataset.q);
      $$('table',sec).forEach(function(t){$$('tr',t).forEach(function(tr){lines.push($$('th,td',tr).map(function(td){var i=$('input,select',td);return i?(i.value||'–'):td.textContent.trim();}).join(' | '));});});
      $$('textarea',sec).forEach(function(t){lines.push(t.value||'–');});
      lines.push('');
    });
    var txt=lines.join('\n');
    function done(ok){btn.textContent=ok?'✓ Kopiert! Jetzt z. B. in Notizen einfügen':'Kopieren nicht möglich';setTimeout(function(){btn.textContent='📋 Ergebnisse kopieren';},2500);}
    if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(txt).then(function(){done(true);},function(){fallback();});}else fallback();
    function fallback(){var ta=document.createElement('textarea');ta.value=txt;document.body.appendChild(ta);ta.select();try{done(document.execCommand('copy'));}catch(e){done(false);}document.body.removeChild(ta);}
  });
}
