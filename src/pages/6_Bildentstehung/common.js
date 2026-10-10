
/* ---------- Station 6: gemeinsamer Teil für 2D und 3D (Maßstab, Messtabelle, Diagramm, Rechenaufgaben, Experiment) ---------- */
(function(){
var LAB=window.LAB,LCOL={40:'#ff922b',100:'#ff6b6b',200:'#69db7c',500:'#4dabf7'};

/* Maßstab am Schirmbild: mm von der Achse aus, zum Ablesen der Bildgröße */
(function(){var cv=$('#scr'),wrap=document.createElement('div');wrap.style.position='relative';cv.parentNode.insertBefore(wrap,cv);wrap.appendChild(cv);
  var NS='http://www.w3.org/2000/svg',svg=document.createElementNS(NS,'svg');svg.setAttribute('viewBox','0 0 '+LAB.SW+' '+LAB.SH);svg.setAttribute('preserveAspectRatio','none');
  svg.setAttribute('aria-hidden','true');svg.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none';
  var h=LAB.SH,c=h/2,html='';
  for(var y=-50;y<=50;y+=5){var yy=c-y,L=y%10===0?6:3.5;html+='<line x1="0" x2="'+L+'" y1="'+yy+'" y2="'+yy+'" stroke="#fff" stroke-width="'+(y%10===0?0.6:0.35)+'"/>';
    if(y%20===0)html+='<text x="7.5" y="'+(yy+1.4)+'" font-size="4" fill="#fff" stroke="#000" stroke-width="0.6" paint-order="stroke" font-family="-apple-system,sans-serif">'+Math.abs(y)+'</text>';}
  html+='<line x1="0" x2="'+LAB.SW+'" y1="'+c+'" y2="'+c+'" stroke="rgba(255,255,255,.25)" stroke-width="0.3" stroke-dasharray="2 2"/>';
  html+='<text x="'+(LAB.SW-2)+'" y="'+(h-2)+'" font-size="3.6" text-anchor="end" fill="#fff" stroke="#000" stroke-width="0.5" paint-order="stroke" font-family="-apple-system,sans-serif">Maßstab in mm</text>';
  svg.innerHTML=html;wrap.appendChild(svg);})();

/* ---------- Messtabelle ---------- */
var KEY='lk5:rows',rows=[];
try{rows=JSON.parse(localStorage.getItem(KEY)||'[]')||[];}catch(e){rows=[];}
if(!Array.isArray(rows))rows=[];
rows=rows.filter(function(r){return r&&isFinite(+r.f)&&isFinite(+r.g)&&isFinite(+r.b)&&isFinite(+r.G);});
function save(){lsSet(KEY,JSON.stringify(rows));navProgress();}
function num(s){return parseFloat(String(s==null?'':s).replace(',','.'));}
var COLS=['BG','bg','sum','inv'];
function truth(r){return {BG:num(r.B)/r.G,bg:r.b/r.g,sum:1/r.g+1/r.b,inv:1/r.f};}
function cell(tr,txt){var td=document.createElement('td');td.textContent=txt;tr.appendChild(td);return td;}
function inputCell(tr,val,onInput){var td=document.createElement('td'),inp=document.createElement('input');inp.inputMode='decimal';inp.value=val==null?'':String(val);
  inp.addEventListener('input',function(){onInput(inp);});td.appendChild(inp);tr.appendChild(td);return inp;}
function renderRows(){
  var tb=$('#mt tbody');tb.innerHTML='';
  rows.forEach(function(r,i){var tr=document.createElement('tr');
    cell(tr,r.f);cell(tr,r.g);cell(tr,r.b);cell(tr,fmt(r.G,0));
    var bIn=inputCell(tr,typeof r.B==='number'?fmt(r.B,1):r.B,function(inp){r.B=inp.value;inp.style.background='';save();chart.request();});bIn.placeholder='ablesen';bIn.dataset.k='B';
    COLS.forEach(function(k){var inp=inputCell(tr,r[k]||'',function(el){r[k]=el.value;el.style.background='';save();});inp.dataset.k=k;});
    var td=document.createElement('td'),del=document.createElement('button');del.className='del';del.type='button';del.setAttribute('aria-label','Zeile löschen');del.textContent='✕';
    del.addEventListener('click',function(){rows.splice(i,1);save();renderRows();});td.appendChild(del);tr.appendChild(td);
    tb.appendChild(tr);});
  chart.request();
}
$$('.take').forEach(function(btn){btn.addEventListener('click',function(){var m,st=LAB.st;
  if(!LAB.isSharp()){m='Das Bild ist noch nicht scharf. Verschiebt zuerst den Schirm, bis „✓ Das Bild ist scharf!“ erscheint.';}
  else{rows.push({f:LAB.f(),g:Math.round(st.g),b:Math.round(st.b),G:st.G,B:''});save();renderRows();m='Messwert '+rows.length+' übernommen. Lest jetzt B am Maßstab ab und tragt es in Schritt 3 ein.';}
  $('#checkMsg').textContent=m;$$('.takeMsg').forEach(function(t){t.textContent=m;});});});
$('#clear').addEventListener('click',function(){if(!rows.length||confirm('Wirklich alle Messwerte löschen?')){rows=[];save();renderRows();}});
$('#checkT').addEventListener('click',function(){var good=0,bad=0,miss=0;
  $$('#mt tbody tr').forEach(function(tr,i){var t=truth(rows[i]);$$('input',tr).forEach(function(inp){var k=inp.dataset.k;if(k==='B'){if(!isFinite(num(inp.value)))miss++;return;}
    var v=num(inp.value);if(!isFinite(v)){inp.style.background='';return;}
    if(!isFinite(t[k])){inp.style.background='';return;}
    var ok=Math.abs(v-t[k])<=Math.max(0.03*Math.abs(t[k]),k==='sum'||k==='inv'?0.00015:0.02);
    inp.style.background=ok?'#d3f9d8':'#ffe3e3';ok?good++:bad++;});});
  $('#checkMsg').textContent=good+' richtig, '+bad+' noch falsch (Rundung bis etwa 3 % ist erlaubt).'+(miss?' Bei '+miss+' Zeilen fehlt noch B – ohne B lässt sich B : G nicht prüfen.':'');});

/* ---------- Diagramm ---------- */
var showCurves=false;
var chart=new HiCanvas($('#chart'),1.6,function(c,w,h){
  c.fillStyle='#fff';c.fillRect(0,0,w,h);
  var pts=rows.filter(function(r){return r.b>0;}),gMax=600,bMax=600;
  pts.forEach(function(r){gMax=Math.max(gMax,r.g*1.15);bMax=Math.max(bMax,r.b*1.15);});
  gMax=Math.min(gMax,4800);bMax=Math.min(bMax,2400);
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
new Toggle($('#curveBtn'),'Kurven nach der Linsengleichung zeigen',false,function(on){showCurves=on;chart.request();});
renderRows();

/* ---------- Rechenaufgaben ---------- */
var Q=[
 {q:'Linse B (f = 100 mm). Eine Kerze steht g = 300 mm vor der Linse. In welchem Abstand b hinter der Linse muss der Schirm stehen?',a:150,u:'mm',sol:'1/b = 1/f − 1/g = 1/100 − 1/300 = 2/300 → b = 150 mm'},
 {q:'Die Kerze aus Aufgabe 5 ist G = 40 mm hoch. Wie hoch ist ihr Bild auf dem Schirm?',a:20,u:'mm',sol:'B = G · b : g = 40 mm · 150 : 300 = 20 mm'},
 {q:'Eure Lochkamera ist 120 mm lang (b = 120 mm). Ihr nehmt Linse B (f = 100 mm). Wie weit muss ein Gegenstand entfernt sein, damit sein Bild scharf ist?',a:600,u:'mm',sol:'1/g = 1/f − 1/b = 1/100 − 1/120 = 1/600 → g = 600 mm'},
 {q:'Ein Baum steht 20 m (= 20 000 mm) entfernt. Wo entsteht sein Bild mit Linse C (f = 200 mm)?',a:202,u:'mm',tol:1.5,sol:'1/b = 1/200 − 1/20000 → b ≈ 202 mm. Bei weit entfernten Gegenständen ist b fast genau f!'},
 {q:'Eine Kamera ist 210 mm lang. Ein Gegenstand 4,2 m entfernt soll scharf sein. Welche Brennweite braucht ihr? Welche eurer Linsen ist das?',a:200,u:'mm',letter:'C',sol:'1/f = 1/g + 1/b = 1/4200 + 1/210 = 21/4200 → f = 200 mm, also Linse C'}
];
var qz=$('#quiz');
Q.forEach(function(it,i){var d=document.createElement('div');d.className='box task';
  d.innerHTML='<b>Aufgabe '+(i+5)+'</b><p style="margin:4px 0 8px">'+it.q+'</p><div class="row" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><input data-save="q'+i+'" inputmode="decimal" aria-label="Ergebnis" style="font:inherit;width:140px;padding:8px;border:1px solid #c9cdd6;border-radius:8px"> '+it.u+
   (it.letter?' · Linse <input data-save="q'+i+'L" aria-label="Linse" maxlength="1" style="font:inherit;width:56px;padding:8px;border:1px solid #c9cdd6;border-radius:8px;text-transform:uppercase">':'')+
   ' <button type="button">Prüfen</button> <span class="res" role="status"></span></div><details><summary>Lösungsweg</summary><div><p>'+it.sol+'</p></div></details>';
  $('button',d).addEventListener('click',function(){var ins=$$('input',d),v=num(ins[0].value),ok=Math.abs(v-it.a)<=(it.tol||Math.max(1,0.02*it.a)),okL=true;
    if(it.letter)okL=(ins[1].value||'').trim().toUpperCase()===it.letter;
    $('.res',d).innerHTML=isFinite(v)?'<span class="'+(ok&&okL?'ok':'no')+'">'+(ok&&okL?'✓ richtig':(ok?'✗ Wert stimmt, aber welche Linse?':'✗ noch nicht'))+'</span>':'';});
  $$('input',d).forEach(function(inp){inp.addEventListener('input',function(){$('.res',d).textContent='';});});
  qz.appendChild(d);});

/* ---------- Experiment-Tabelle: Quotienten rechnen sich bei jeder Änderung neu ---------- */
var ex=$('#exT'),exOn=false;
for(var i=0;i<6;i++){var tr=document.createElement('tr');
  tr.innerHTML='<td><select data-save="el'+i+'" aria-label="Linse"><option></option><option value="40">A (40)</option><option value="100">B (100)</option><option value="200">C (200)</option><option value="500">D (500)</option></select></td>'+
   ['g','b','G','B'].map(function(k){return '<td><input data-save="e'+k+i+'" inputmode="decimal" aria-label="'+k+'"></td>';}).join('')+'<td class="o"></td><td class="o"></td><td class="o"></td><td class="o"></td>';
  ex.appendChild(tr);}
function calcEx(){$$('tr',ex).slice(1).forEach(function(tr){var v=$$('input,select',tr).map(function(e){return num(e.value);}),o=$$('.o',tr);
  if(!exOn){o.forEach(function(x){x.textContent='';});return;}
  var F=v[0],g=v[1],b=v[2],G=v[3],B=v[4];
  o[0].textContent=isFinite(B/G)?fmt(B/G,2):'';o[1].textContent=isFinite(b/g)?fmt(b/g,2):'';
  o[2].textContent=isFinite(1/g+1/b)?fmt(1/g+1/b,4):'';o[3].textContent=isFinite(1/F)?fmt(1/F,4):'';});}
$('#calcEx').addEventListener('click',function(){exOn=true;calcEx();});
$$('input,select',ex).forEach(function(e){e.addEventListener('input',calcEx);e.addEventListener('change',calcEx);});

persistInputs('lk5');
setupCopy($('#copy'),'Lochkamera – Station 6');
})();
