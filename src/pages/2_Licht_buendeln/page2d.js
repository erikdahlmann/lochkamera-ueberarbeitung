
(function(){
var LENSES={none:{n:'ohne Linse',f:null},A:{n:'A',f:40},B:{n:'B',f:100},C:{n:'C',f:200},D:{n:'D',f:500},E:{n:'E',f:-100},F:{n:'F',f:-200}};
var OBJ={haus:{label:'Haus, 20 m',g:20000,scene:'haus',s:70},lampen:{label:'Lämpchen, 2 m',g:2000,scene:'lampen',s:4},kerze:{label:'Kerze, 50 cm',g:500,scene:'kerze',s:1}};
var st={lens:'none',d:10,b:100,obj:'haus',focus:false};
var C3=['rgba(255,107,107,1)','rgba(105,219,124,1)','rgba(77,171,247,1)'];
var P3=[{y:10,col:C3[0]},{y:0,col:C3[1]},{y:-10,col:C3[2]}];

/* --- Schritt 1: Idee --- */
var idea={p:0,target:0};
var IG=400,IB=150;
var ideaCv=new HiCanvas($('#ideaCv'),16/7,function(c,w,h){
  drawSideView(c,w,h,{g:IG,b:IB,d:24,power:idea.p*(1/IB+1/IG),pts:P3,ySpan:28,bMax:170,nRays:7,lens:'box',maxLeft:0.75});
});
function ideaInfo(){var P=idea.p*(1/IB+1/IG);var D=24*Math.abs(1-IB*P+IB/IG);$('#ideaTxt').textContent='Lichtfleck: '+fmtLen(D);}
$('#ideaBtn').addEventListener('click',function(){
  idea.target=idea.target?0:1;$('#ideaBtn').textContent=idea.target?'▶ Box ausschalten':'▶ Box einschalten';
  var from=idea.p,t0=performance.now();
  (function f(t){var u=Math.min(1,(t-t0)/1800);u=u*u*(3-2*u);idea.p=from+(idea.target-from)*u;ideaCv.request();ideaInfo();if(u<1)requestAnimationFrame(f);})(t0);
});
ideaInfo();

/* --- Schritt 2: Labor --- */
function f(){return LENSES[st.lens].f;}
function g(){return OBJ[st.obj].g;}
function bImage(){var F=f();if(!F)return NaN;var bi=1/(1/F-1/g());return bi;}
var side=new HiCanvas($('#side'),16/10,function(c,w,h){
  var bi=bImage(),bMax=Math.max(st.b*1.2,150);if(bi>0&&bi<1300)bMax=Math.max(bMax,bi*1.25);
  drawSideView(c,w,h,{g:g(),b:st.b,d:st.d,f:f(),pts:P3,ySpan:Math.max(18,st.d*0.6),bMax:bMax,nRays:7,lens:f()?'lens':null,showBeyond:true,showFocus:st.focus,angRef:150});
});
var scr=new ScreenSim($('#scr'),240,180);scr.exposure=0.01;
var pend=false;
function renderScreen(){if(pend)return;pend=true;requestAnimationFrame(function(){pend=false;
  var O=OBJ[st.obj],ppm=1.6,m=st.b/O.g,F=f();
  // Abbildungsmaßstab: bei einer Linse über den Mittelpunktstrahl ebenfalls b/g
  var R=blurDiameter(st.d,st.b,O.g,F)/2*ppm;
  var E=relBrightness(st.d,st.b),sc=SCENES[O.scene];
  scr.render(function(o){o.setTransform(-m*ppm*O.s,0,0,m*ppm*O.s,120,90);sc.draw(o);},R,E);
});}
function update(){
  side.request();renderScreen();
  var D=blurDiameter(st.d,st.b,g(),f()),H=relBrightness(st.d,st.b);
  $('#mD').textContent=fmtLen(D);$('#barD').style.width=clamp(D/30*100,1,100)+'%';
  $('#mH').textContent=(H<10?fmt(H,H<1?2:1):fmt(H,0))+' ×';$('#barH').style.width=clamp(displayGain(H)/1.35*100,2,100)+'%';
}
new Seg($('#segLens'),Object.keys(LENSES).map(function(k){var L=LENSES[k];return {key:k,label:L.f?L.n+' <span class="small" style="color:inherit">('+(L.f>0?'':'−')+Math.abs(L.f)+' mm)</span>':L.n};}),st.lens,function(k){st.lens=k;update();});
var sB=new Slider($('#sB'),{label:'Abstand Linse – Schirm b',min:10,max:1200,value:st.b,log:true,step:1,round:1,fmt:function(v){return fmt(v,0)+' mm';},onChange:function(v){st.b=v;update();}});
var sD=new Slider($('#sD'),{label:'Loch- bzw. Linsendurchmesser d',min:0.5,max:30,value:st.d,log:true,step:0.5,round:0.5,fmt:function(v){return fmt(v,1)+' mm';},onChange:function(v){st.d=v;update();}});
new Seg($('#segObj'),Object.keys(OBJ).map(function(k){return {key:k,label:OBJ[k].label};}),st.obj,function(k){st.obj=k;update();});
$('#focusBtn').addEventListener('click',function(){st.focus=!st.focus;this.textContent=(st.focus?'● ':'○ ')+'Scharfen Bildpunkt zeigen';this.classList.toggle('on',st.focus);side.request();});

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
