(function(){
var LENSES={A:40,B:100,C:200,D:500,E:-100,F:-200};
var VIEWS={nah:{L:700,R:700,grid:50,yf:2},weit:{L:4600,R:1300,grid:200,yf:6}};
var LENS_D=50;
var st={view:'nah',lens:'B',g:400,b:130,d:30,G:60,focus:false,fpts:false,special:false,construct:false};
var shift=0;
function f(){return LENSES[st.lens];}
function bImg(){var F=f();if(Math.abs(st.g-F)<0.5)return Infinity;return st.g*F/(st.g-F);}
function blurD(){return blurDiameter(st.d,st.b,st.g,f());}
function isSharp(){var F=f(),bi=bImg();return F>0&&isFinite(bi)&&bi>0&&Math.abs(st.b-bi)<=Math.max(1,0.01*bi);}
function mm(v,d){return fmt(v,d===undefined?(Math.abs(v)<20?1:0):d)+' mm';}
var ASP=2.2,view={};
var BUND=[{k:1,col:'rgba(255,146,43,1)'},{k:0.5,col:'rgba(255,224,102,1)'},{k:0,col:'rgba(77,171,247,1)'}];
var SW=150,SH=110;
window.LAB={f:f,st:st,isSharp:isSharp,SW:SW,SH:SH};

/* ---------- Seitenansicht (maßstäblich, Linse bei x = 0 in Linsen-Koordinaten) ---------- */
var side=new HiCanvas($('#side'),ASP,function(c,w,h){
  var V=VIEWS[st.view],sx=w/(V.L+V.R),x0=(V.L+shift)*sx,cy=h/2,F=f(),g=st.g,b=st.b,d=st.d,G=st.G,Gt=G/2,bi=bImg();
  view={sx:sx,x0:x0};
  var sy=sx*V.yf;function X(x){return x0+x*sx;}function Y(y){return cy-y*sy;}
  var xL=-V.L-shift,xR=V.R-shift;
  c.fillStyle='#10131a';c.fillRect(0,0,w,h);
  c.strokeStyle='rgba(255,255,255,.06)';c.lineWidth=1;c.beginPath();
  for(var k=-60;k<=60;k++){var q=k*V.grid;c.moveTo(w/2+q*sx,0);c.lineTo(w/2+q*sx,h);c.moveTo(0,cy-q*sx);c.lineTo(w,cy-q*sx);}c.stroke();
  c.strokeStyle='rgba(255,255,255,.4)';c.setLineDash([8,8]);c.beginPath();c.moveTo(0,cy);c.lineTo(w,cy);c.stroke();c.setLineDash([]);
  // Strahlenbündel (begrenzt durch die Blende d)
  var faint=st.special?0.35:1;
  c.globalCompositeOperation='lighter';
  BUND.forEach(function(p){
    var y0=p.k*G-Gt,hs=[],i;for(i=0;i<7;i++)hs.push(-d/2+d*i/6);
    var col=p.col.replace('1)',(0.75*faint)+')');c.strokeStyle=col;c.lineWidth=1.3;
    hs.forEach(function(hh){var s=(hh-y0)/g-hh/F;c.beginPath();c.moveTo(X(-g),Y(y0));c.lineTo(X(0),Y(hh));c.lineTo(X(b),Y(hh+s*b));c.stroke();
      c.save();c.setLineDash([3,5]);c.strokeStyle=p.col.replace('1)',(0.25*faint)+')');c.beginPath();c.moveTo(X(b),Y(hh+s*b));c.lineTo(X(xR),Y(hh+s*xR));c.stroke();c.restore();});
    var ys=hs.map(function(hh){var s=(hh-y0)/g-hh/F;return hh+s*b;}),y1=Math.max.apply(null,ys),y2=Math.min.apply(null,ys);
    c.strokeStyle=p.col;c.lineWidth=6;c.beginPath();c.moveTo(X(b)+4,Y(y1)-1);c.lineTo(X(b)+4,Y(y2)+1);c.stroke();
    if(st.focus&&bi>0&&bi<xR){c.strokeStyle='#fff';c.lineWidth=1.5;c.beginPath();c.arc(X(bi),Y(-y0*bi/g),5,0,7);c.stroke();}
  });
  c.globalCompositeOperation='source-over';
  // Brennpunkte
  if(st.fpts){var a=Math.abs(F),sg=F>0?1:-1;c.fillStyle='#fff';c.font='bold 14px -apple-system,sans-serif';c.textAlign='center';c.textBaseline='top';
    [[-sg*a,'F',5],[sg*a,'F′',5],[-sg*2*a,'2F',3.5],[sg*2*a,'2F′',3.5]].forEach(function(p){if(p[0]<xL||p[0]>xR)return;c.beginPath();c.arc(X(p[0]),cy,p[2],0,7);c.fill();c.fillText(p[1],X(p[0]),cy+8);});}
  // besondere Strahlen (von der Flammenspitze); gestrichelt = Hilfslinie
  var virt=bi<0;
  function line(xa,ya,xb,yb,col,dash){c.save();c.strokeStyle=col;c.lineWidth=dash?1.8:3;if(dash){c.setLineDash([6,5]);c.globalAlpha=.8;}c.beginPath();c.moveTo(X(xa),Y(ya));c.lineTo(X(xb),Y(yb));c.stroke();c.restore();}
  if(st.special){
    c.save();c.setLineDash([4,6]);c.strokeStyle='rgba(165,216,255,.6)';c.lineWidth=1.5;c.beginPath();c.moveTo(X(0),0);c.lineTo(X(0),h);c.stroke();c.restore();
    line(-g,Gt,0,Gt,'#ff6b6b');line(0,Gt,xR,Gt-Gt/F*xR,'#ff6b6b');if(virt||F<0)line(0,Gt,xL,Gt-Gt/F*xL,'#ff6b6b',true);
    line(-g,Gt,0,0,'#69db7c');line(0,0,xR,-Gt/g*xR,'#69db7c');if(virt)line(0,0,xL,-Gt/g*xL,'#69db7c',true);
    if(isFinite(bi)){var hf=-Gt*F/(g-F);
      if(F>0&&g<F){line(-F,0,-g,Gt,'#da77f2',true);line(-g,Gt,0,hf,'#da77f2');}
      else{line(-g,Gt,0,hf,'#da77f2');if(F<0)line(0,hf,-F,0,'#da77f2',true);}
      line(0,hf,xR,hf,'#da77f2');if(virt)line(0,hf,xL,hf,'#da77f2',true);}
  }
  // Bild (vom Bild des Fußes zum Bild der Spitze)
  if(st.construct&&isFinite(bi)&&bi>xL&&bi<xR){var yT=-Gt*bi/g,yF=Gt*bi/g;c.save();c.strokeStyle='#ffa94d';c.fillStyle='#ffa94d';c.lineWidth=4;if(virt)c.setLineDash([7,5]);
    c.beginPath();c.moveTo(X(bi),Y(yF));c.lineTo(X(bi),Y(yT));c.stroke();c.setLineDash([]);var dd=yT>yF?1:-1;c.beginPath();c.moveTo(X(bi),Y(yT));c.lineTo(X(bi)-7,Y(yT)+dd*12);c.lineTo(X(bi)+7,Y(yT)+dd*12);c.closePath();c.fill();
    c.font='bold 13px -apple-system,sans-serif';c.textAlign='center';c.textBaseline=yT>0?'bottom':'top';c.fillText(virt?'Bild (virtuell)':'Bild',X(bi),Y(yT)+(yT>0?-14:14));c.restore();}
  // Linse (50 mm) mit Blende
  var lh=Math.max(LENS_D/2*sy,4),bul=F>0?Math.min(8,2+lh*0.15):-Math.min(8,2+lh*0.15);
  c.fillStyle='rgba(165,216,255,.35)';c.strokeStyle='#a5d8ff';c.lineWidth=2;c.beginPath();
  if(F>0){c.moveTo(X(0),cy-lh);c.quadraticCurveTo(X(0)+bul*2,cy,X(0),cy+lh);c.quadraticCurveTo(X(0)-bul*2,cy,X(0),cy-lh);}
  else{var e=-bul;c.moveTo(X(0)-e,cy-lh);c.lineTo(X(0)+e,cy-lh);c.quadraticCurveTo(X(0),cy,X(0)+e,cy+lh);c.lineTo(X(0)-e,cy+lh);c.quadraticCurveTo(X(0),cy,X(0)-e,cy-lh);}
  c.closePath();c.fill();c.stroke();
  if(d<LENS_D){c.fillStyle='#5c6370';var ih=d/2*sy;c.fillRect(X(0)-12,cy-lh-3,4,lh-ih+3);c.fillRect(X(0)-12,cy+ih,4,lh-ih+3);}
  // Kerze (mittig auf der Achse)
  var kx=X(-g),bw=Math.max(5,G*0.12*sy),bh=G*0.7*sy,base=cy+Gt*sy;
  c.fillStyle='#f1e3c6';c.fillRect(kx-bw/2,base-bh,bw,bh);
  var fl=G*0.3*sy;c.fillStyle='#ffa94d';c.beginPath();c.ellipse(kx,base-bh-fl/2,Math.max(3,bw*0.35),fl/2,0,0,7);c.fill();
  c.fillStyle='rgba(255,212,59,.18)';c.beginPath();c.arc(kx,cy,24,0,7);c.fill();
  // Schirm (11 cm hoch)
  c.fillStyle='#e9ecef';c.fillRect(X(b)-2,Y(SH/2),4,SH*sy);
  c.fillStyle='rgba(255,255,255,.18)';c.beginPath();c.arc(X(b),cy,20,0,7);c.fill();
  c.fillStyle='rgba(255,255,255,.85)';c.font='bold 13px -apple-system,sans-serif';c.textAlign='center';c.textBaseline='top';
  c.fillText('Linse',X(0),4);if(Math.abs(kx-X(0))>50)c.fillText('Kerze',kx,4);if(Math.abs(X(b)-X(0))>50)c.fillText('Schirm',X(b),4);
  function dim(x1,x2,lab,yy){c.strokeStyle='rgba(255,255,255,.7)';c.fillStyle='rgba(255,255,255,.9)';c.lineWidth=1;c.beginPath();c.moveTo(X(x1),yy);c.lineTo(X(x2),yy);c.moveTo(X(x1),yy-5);c.lineTo(X(x1),yy+5);c.moveTo(X(x2),yy-5);c.lineTo(X(x2),yy+5);c.stroke();
    c.textAlign='center';c.textBaseline='bottom';c.font='13px -apple-system,sans-serif';c.fillText(lab,(X(x1)+X(x2))/2,yy-3);}
  dim(-g,0,'g = '+mm(g,0),h-34);dim(0,b,'b = '+mm(b,0),h-10);
});

/* ---------- Bild auf dem Schirm ---------- */
var scr=new ScreenSim($('#scr'),240,176);scr.exposure=0.01;$('#scr').style.aspectRatio='15/11';
var pend=false;
function renderScreen(){if(pend)return;pend=true;requestAnimationFrame(function(){pend=false;
  var ppm=240/SW,m=st.b/st.g,s=st.G/140,k=m*ppm*s;
  var R=blurD()/2*ppm,E=relBrightness(st.d,st.b);
  /* Kerze mittig: Fuß bei −G/2 (Zeichnung der Kerze ist 140 Einheiten hoch, Fuß bei −75) */
  scr.render(function(o){o.setTransform(-k,0,0,k,120,88);o.translate(0,75-70);SCENES.kerze.draw(o);},R,E);
});}
function caseText(){var F=f(),g=st.g;if(!(F>0))return '';
  if(Math.abs(g-2*F)<=0.03*2*F)return 'Die Kerze steht genau bei 2F.';
  if(g>2*F)return 'Die Kerze steht weiter weg als 2F.';
  if(Math.abs(g-F)<=0.02*F)return 'Die Kerze steht genau bei F.';
  if(g>F)return 'Die Kerze steht zwischen 2F und F.';
  return 'Die Kerze steht näher an der Linse als F.';}
function upd(){
  side.request();renderScreen();
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
var segView=new Seg($('#segView'),[{key:'nah',label:'nah (Kästchen = 5 cm)'},{key:'weit',label:'weit (Kästchen = 20 cm)'}],st.view,function(k){st.view=k;ranges();upd();});
new Seg($('#segLens'),Object.keys(LENSES).map(function(k){var F=LENSES[k];return {key:k,label:k+' <span class="small" style="color:inherit">('+(F<0?'−':'')+Math.abs(F)+' mm)</span>'};}),st.lens,function(k){
  st.lens=k;approach.stop();if(Math.abs(LENSES[k])>=500&&st.view==='nah'){st.view='weit';segView.set('weit',false);ranges();}upd();});
var HL={focus:'Scharfen Bildpunkt',fpts:'Brennpunkte F',special:'Besondere Strahlen',construct:'Bild einzeichnen'};
$$('#helpBtns button').forEach(function(btn){var k=btn.dataset.k;new Toggle(btn,HL[k],st[k],function(on){st[k]=on;upd();});});
var approach=new AnimButton($('#approach'),'▶ Kerze fährt heran',12000,function(u){var F=f(),bR=sB.o.max;
  if(!(F>0)){approach.stop();$('#sharpMsg').innerHTML='<span class="no">Das geht nur mit einer Sammellinse (A–D).</span>';return;}
  var g0=Math.min(sG.o.max,Math.max(6*F,300)),g1=Math.max(sG.o.min,F*bR/(bR-F)*1.01);
  if(g1>=g0){approach.stop();$('#sharpMsg').innerHTML='<span class="no">Die Bank ist zu kurz – wählt die weite Bank.</span>';return;}
  st.g=g0*Math.pow(g1/g0,u);st.b=clamp(st.g*F/(st.g-F),sB.o.min,bR);sG.set(st.g,false);sB.set(st.b,false);upd();});
function goLab(){$('#lab').scrollIntoView({behavior:'smooth',block:'start'});}
$('#goLab').addEventListener('click',goLab);$('#goLab2').addEventListener('click',goLab);
/* Ziehen: Kerze, Linse oder Schirm – je nachdem, was am nächsten liegt */
(function(){var el=$('#side'),drag=null,last=0;
  function wx(ev){var p=side.toLocal(ev);return (p.x-view.x0)/view.sx;}  // in Linsen-Koordinaten
  el.addEventListener('pointerdown',function(e){var x=wx(e),dc=Math.abs(x+st.g),dl=Math.abs(x),ds=Math.abs(x-st.b),m=Math.min(dc,dl,ds);
    drag=m===dl?'l':(m===dc?'g':'b');last=x;el.setPointerCapture(e.pointerId);move(e);});
  function move(e){if(!drag)return;var x=wx(e),V=VIEWS[st.view];
    if(drag==='g'){st.g=Math.round(clamp(-x,sG.o.min,sG.o.max));sG.set(st.g,false);}
    else if(drag==='b'){st.b=Math.round(clamp(x,sB.o.min,sB.o.max));sB.set(st.b,false);}
    else{var d=Math.round(x),g2=st.g+d,b2=st.b-d;if(!d||g2<sG.o.min||g2>sG.o.max||b2<sB.o.min||b2>sB.o.max)return;
      if(shift+d-g2<-V.L-60||shift+d+b2>V.R+60)return;shift+=d;st.g=g2;st.b=b2;sG.set(st.g,false);sB.set(st.b,false);}
    approach.stop();upd();}
  el.addEventListener('pointermove',move);el.addEventListener('pointerup',function(){drag=null;});el.addEventListener('pointercancel',function(){drag=null;});
})();
ranges();upd();
})();
