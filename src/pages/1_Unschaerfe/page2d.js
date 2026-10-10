(function(){
var st={d:1,b:150,g:400,pts:'7',scene:'punkte',beug:false};
var COLS=['rgba(255,107,107,1)','rgba(255,169,77,1)','rgba(255,224,102,1)','rgba(105,219,124,1)','rgba(77,171,247,1)','rgba(151,117,250,1)','rgba(240,101,149,1)'];
var HAUS_G=42000;
function pts(){
  if(st.pts==='1')return [{y:40,col:COLS[0]}];
  if(st.pts==='2')return [{y:30,col:COLS[0]},{y:-30,col:COLS[4]}];
  var a=[];for(var i=0;i<7;i++)a.push({y:60-20*i,col:COLS[i]});return a;
}
function gEff(){return st.scene==='haus'?HAUS_G:st.g;}
function spotGeo(){return blurDiameter(st.d,st.b,gEff(),null);}
function spot(){var D=spotGeo();if(st.beug){var A=airyDiameter(st.d,st.b);D=Math.sqrt(D*D+A*A);}return D;}
var side=new HiCanvas($('#side'),16/10,function(c,w,h){
  drawSideView(c,w,h,{g:st.g,b:st.b,d:st.d,f:null,pts:pts(),ySpan:78,bMax:320,nRays:2,lens:null,maxLeft:0.6});
});
var scr=new ScreenSim($('#scr'),240,176);scr.exposure=0.05; // gleiche Belichtung wie Station 2
$('#scr').style.aspectRatio='15/11';
var pend=false;
function renderScreen(){if(pend)return;pend=true;requestAnimationFrame(function(){pend=false;
  var ppm=240/150,g=gEff(),m=st.b/g; // 1,6 Pixel pro mm (Schirm 15 cm breit)
  SCENES.punkte.pts=pts();
  var sc=SCENES[st.scene==='lampen'?'lampen1':st.scene],objScale={punkte:1,kerze:1.1,lampen:1,haus:140}[st.scene];
  var R=spot()/2*ppm,E=relBrightness(st.d,st.b);
  scr.render(function(o){o.setTransform(-m*ppm*objScale,0,0,m*ppm*objScale,120,88);sc.draw(o);},R,E);
});}
function update(){
  side.request();renderScreen();
  var D=spot(),H=relBrightness(st.d,st.b);
  $('#mD').textContent=fmtLen(D);$('#barD').style.width=clamp(D/20*100,1,100)+'%';
  $('#mH').textContent=(H<10?fmt(H,H<1?2:1):fmt(H,0))+' ×';$('#barH').style.width=clamp(displayGain(H)/1.35*100,2,100)+'%';
  var bi=$('#beugInfo');bi.style.display=st.beug?'':'none';
  if(st.beug)bi.textContent='Beugung ist eingeschaltet: Strahlenmodell allein '+fmtLen(spotGeo())+', Beugung allein '+fmtLen(airyDiameter(st.d,st.b))+'. Die Seitenansicht zeigt weiter nur Strahlen.';
}
var sD=new Slider($('#sD'),{label:'Lochdurchmesser d',min:0.2,max:12,value:st.d,log:true,step:0.1,round:0.1,fmt:function(v){return fmt(v,1)+' mm';},onChange:function(v){anim.stop();st.d=v;update();}});
var sB=new Slider($('#sB'),{label:'Abstand Loch – Schirm b',min:50,max:300,value:st.b,step:5,round:5,fmt:function(v){return fmt(v,0)+' mm';},onChange:function(v){st.b=v;update();}});
var sG=new Slider($('#sG'),{label:'Abstand Gegenstand – Loch g',min:100,max:1000,value:st.g,log:true,step:10,round:10,fmt:function(v){return fmt(v,0)+' mm';},onChange:function(v){st.g=v;update();}});
function sceneCtl(){var h=st.scene==='haus';sG.enable(!h);if(h)sG.out.textContent='42 m';else sG.set(st.g,false);}
new Seg($('#segPts'),[{key:'1',label:'1 Punkt'},{key:'2',label:'2 Punkte'},{key:'7',label:'7 Punkte'}],st.pts,function(k){st.pts=k;update();});
new Seg($('#segScene'),[{key:'punkte',label:'Leuchtpunkte'},{key:'kerze',label:'Kerze'},{key:'lampen',label:'Zwei Lämpchen'},{key:'haus',label:'Haus'}],st.scene,function(k){st.scene=k;sceneCtl();update();});
new Toggle($('#beugBtn'),'Beugung berücksichtigen',false,function(on){st.beug=on;update();});
var anim=new AnimButton($('#anim'),'▶ Loch langsam vergrößern',7000,function(u){var d=0.3*Math.pow(12/0.3,u);st.d=d;sD.set(d,false);update();});
update();
persistInputs('lk1');setupCopy($('#copy'),'Lochkamera – Station 1');
})();
