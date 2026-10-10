
(function(){
var LENSES={A:40,B:100,C:200,D:500,E:-100,F:-200};
var LCOL={40:'#ff922b',100:'#ff6b6b',200:'#69db7c',500:'#4dabf7'};
var VIEWS={nah:{L:640,R:460,grid:50,yf:2},weit:{L:2400,R:1200,grid:100,yf:4}};
var st={view:'nah',lens:'B',g:400,b:130,d:30,G:60,focus:false,fpts:false,special:false,construct:false};
function f(){return LENSES[st.lens];}
function bImg(){var F=f();if(Math.abs(st.g-F)<0.5)return Infinity;return st.g*F/(st.g-F);}
function blurD(){return blurDiameter(st.d,st.b,st.g,f());}
function isSharp(){return blurD()<0.4;}
function mm(v,d){return fmt(v,d===undefined?(Math.abs(v)<20?1:0):d)+' mm';}
var ASP=2.2,view={};
var BUND=[{k:1,col:'rgba(255,146,43,1)'},{k:0.5,col:'rgba(255,224,102,1)'},{k:0,col:'rgba(77,171,247,1)'}];

/* ---------- Seitenansicht (maßstäblich) ---------- */
var side=new HiCanvas($('#side'),ASP,function(c,w,h){
  var V=VIEWS[st.view],sx=w/(V.L+V.R),x0=V.L*sx,cy=h/2,F=f(),g=st.g,b=st.b,d=st.d,G=st.G,bi=bImg();
  view={sx:sx,x0:x0};
  var sy=sx*V.yf;function X(x){return x0+x*sx;}function Y(y){return cy-y*sy;}
  c.fillStyle='#10131a';c.fillRect(0,0,w,h);
  c.strokeStyle='rgba(255,255,255,.06)';c.lineWidth=1;c.beginPath();
  for(var k=-60;k<=60;k++){var q=k*V.grid;c.moveTo(X(q),0);c.lineTo(X(q),h);c.moveTo(0,Y(q/V.yf));c.lineTo(w,Y(q/V.yf));}c.stroke();
  c.strokeStyle='rgba(255,255,255,.4)';c.beginPath();c.moveTo(0,cy);c.lineTo(w,cy);c.stroke();
  var xR=V.R;
  // Strahlenbündel
  var faint=st.special?0.35:1;
  c.globalCompositeOperation='lighter';
  BUND.forEach(function(p){
    var y0=p.k*G,hs=[],i;for(i=0;i<7;i++)hs.push(-d/2+d*i/6);
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
    [[-sg*a,'F',5],[sg*a,'F′',5],[-sg*2*a,'2F',3.5],[sg*2*a,'2F′',3.5]].forEach(function(p){if(p[0]<-V.L||p[0]>V.R)return;c.beginPath();c.arc(X(p[0]),cy,p[2],0,7);c.fill();c.fillText(p[1],X(p[0]),cy+8);});}
  // besondere Strahlen (von der Flammenspitze)
  var virt=bi<0;
  function sray(col,xa,ya,h0,slope){c.strokeStyle=col;c.lineWidth=3;c.beginPath();c.moveTo(X(xa),Y(ya));c.lineTo(X(0),Y(h0));c.lineTo(X(xR),Y(h0+slope*xR));c.stroke();
    if(virt){c.save();c.setLineDash([6,5]);c.lineWidth=1.8;c.globalAlpha=.7;c.beginPath();c.moveTo(X(0),Y(h0));c.lineTo(X(-V.L),Y(h0-slope*V.L));c.stroke();c.restore();}}
  if(st.special){
    c.save();c.setLineDash([4,6]);c.strokeStyle='rgba(165,216,255,.6)';c.lineWidth=1.5;c.beginPath();c.moveTo(X(0),0);c.lineTo(X(0),h);c.stroke();c.restore();
    sray('#ff6b6b',-g,G,G,-G/F);
    sray('#69db7c',-g,G,0,-G/g);
    if(isFinite(bi)){var hf=-G*F/(g-F);if(F>0&&g<F)sray('#da77f2',-F,0,hf,0);else sray('#da77f2',-g,G,hf,0);}
  }
  // Bild
  if(st.construct&&isFinite(bi)&&bi>-V.L&&bi<xR){var B=-G*bi/g;c.save();c.strokeStyle='#ffa94d';c.fillStyle='#ffa94d';c.lineWidth=4;if(virt)c.setLineDash([7,5]);
    c.beginPath();c.moveTo(X(bi),cy);c.lineTo(X(bi),Y(B));c.stroke();c.setLineDash([]);var dd=B>0?1:-1;c.beginPath();c.moveTo(X(bi),Y(B));c.lineTo(X(bi)-7,Y(B)+dd*12);c.lineTo(X(bi)+7,Y(B)+dd*12);c.closePath();c.fill();
    c.font='bold 13px -apple-system,sans-serif';c.textAlign='center';c.textBaseline=B>0?'bottom':'top';c.fillText(virt?'Bild (virtuell)':'Bild',X(bi),Y(B)+(B>0?-14:14));c.restore();}
  // Linse (echter Durchmesser d) mit Fassung
  var lh=Math.max(d/2*sy,4),bul=F>0?Math.min(8,2+lh*0.15):-Math.min(8,2+lh*0.15);
  c.fillStyle='rgba(165,216,255,.35)';c.strokeStyle='#a5d8ff';c.lineWidth=2;c.beginPath();
  if(F>0){c.moveTo(X(0),cy-lh);c.quadraticCurveTo(X(0)+bul*2,cy,X(0),cy+lh);c.quadraticCurveTo(X(0)-bul*2,cy,X(0),cy-lh);}
  else{var e=-bul;c.moveTo(X(0)-e,cy-lh);c.lineTo(X(0)+e,cy-lh);c.quadraticCurveTo(X(0),cy,X(0)+e,cy+lh);c.lineTo(X(0)-e,cy+lh);c.quadraticCurveTo(X(0),cy,X(0)-e,cy-lh);}
  c.closePath();c.fill();c.stroke();
  // Kerze
  var kx=X(-g),bw=Math.max(5,G*0.12*sy),bh=G*0.7*sy;
  c.fillStyle='#f1e3c6';c.fillRect(kx-bw/2,cy-bh,bw,bh);
  var fl=G*0.3*sy;c.fillStyle='#ffa94d';c.beginPath();c.ellipse(kx,cy-bh-fl/2,Math.max(3,bw*0.35),fl/2,0,0,7);c.fill();
  c.fillStyle='rgba(255,212,59,.18)';c.beginPath();c.arc(kx,cy-bh/2,24,0,7);c.fill();
  // Schirm (15 cm hoch)
  c.fillStyle='#e9ecef';c.fillRect(X(b)-2,Y(75),4,150*sy);
  c.fillStyle='rgba(255,255,255,.18)';c.beginPath();c.arc(X(b),cy,20,0,7);c.fill();
  c.fillStyle='rgba(255,255,255,.8)';c.font='13px -apple-system,sans-serif';c.textAlign='center';c.textBaseline='top';
  c.fillText('Linse',X(0),4);if(Math.abs(kx-X(0))>50)c.fillText('Kerze',kx,4);if(Math.abs(X(b)-X(0))>50)c.fillText('Schirm',X(b),4);
  function dim(x1,x2,lab,yy){c.strokeStyle='rgba(255,255,255,.7)';c.fillStyle='rgba(255,255,255,.9)';c.lineWidth=1;c.beginPath();c.moveTo(X(x1),yy);c.lineTo(X(x2),yy);c.moveTo(X(x1),yy-5);c.lineTo(X(x1),yy+5);c.moveTo(X(x2),yy-5);c.lineTo(X(x2),yy+5);c.stroke();
    c.textAlign='center';c.textBaseline='bottom';c.fillText(lab,(X(x1)+X(x2))/2,yy-3);}
  dim(-g,0,'g = '+mm(g,0),h-34);dim(0,b,'b = '+mm(b,0),h-10);
});

/* ---------- Bild auf dem Schirm ---------- */
var scr=new ScreenSim($('#scr'),240,180);scr.exposure=0.01;
var pend=false;
function renderScreen(){if(pend)return;pend=true;requestAnimationFrame(function(){pend=false;
  var ppm=1.6,m=st.b/st.g,s=st.G/140,k=m*ppm*s;
  var R=blurD()/2*ppm,E=relBrightness(st.d,st.b);
  scr.render(function(o){o.setTransform(-k,0,0,k,120,90);o.translate(0,75);SCENES.kerze.draw(o);},R,E);
});}
function upd(){
  side.request();renderScreen();
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
var segView=new Seg($('#segView'),[{key:'nah',label:'nah (Kästchen = 5 cm)'},{key:'weit',label:'weit (Kästchen = 10 cm)'}],st.view,function(k){st.view=k;ranges();upd();});
new Seg($('#segLens'),Object.keys(LENSES).map(function(k){var F=LENSES[k];return {key:k,label:k+' <span class="small" style="color:inherit">('+(F<0?'−':'')+Math.abs(F)+' mm)</span>'};}),st.lens,function(k){
  st.lens=k;if(Math.abs(LENSES[k])>=500&&st.view==='nah'){st.view='weit';segView.set('weit',false);ranges();}upd();});
var HL={focus:'Scharfen Bildpunkt',fpts:'Brennpunkte F',special:'Besondere Strahlen',construct:'Bild einzeichnen'};
$$('#helpBtns button').forEach(function(btn){btn.addEventListener('click',function(){var k=btn.dataset.k;st[k]=!st[k];btn.classList.toggle('on',st[k]);btn.textContent=(st[k]?'● ':'○ ')+HL[k];side.request();});});
function goLab(){$('#lab').scrollIntoView({behavior:'smooth',block:'start'});}
$('#goLab').addEventListener('click',goLab);$('#goLab2').addEventListener('click',goLab);
(function(){var el=$('#side'),drag=null;
  function wx(ev){var p=side.toLocal(ev);return (p.x-view.x0)/view.sx;}
  el.addEventListener('pointerdown',function(e){var x=wx(e);drag=Math.abs(x+st.g)<Math.abs(x-st.b)?'g':'b';el.setPointerCapture(e.pointerId);move(e);});
  function move(e){if(!drag)return;var x=wx(e);if(drag==='g'){st.g=Math.round(clamp(-x,sG.o.min,sG.o.max));sG.set(st.g,false);}else{st.b=Math.round(clamp(x,sB.o.min,sB.o.max));sB.set(st.b,false);}upd();}
  el.addEventListener('pointermove',move);el.addEventListener('pointerup',function(){drag=null;});el.addEventListener('pointercancel',function(){drag=null;});
})();
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

