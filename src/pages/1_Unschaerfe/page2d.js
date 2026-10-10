
(function(){
var G=400; // Gegenstand 40 cm vor dem Loch
var st={d:1,b:150,pts:'7',scene:'kerze'};
var COLS=['rgba(255,107,107,1)','rgba(255,169,77,1)','rgba(255,224,102,1)','rgba(105,219,124,1)','rgba(77,171,247,1)','rgba(151,117,250,1)','rgba(240,101,149,1)'];
function pts(){
  if(st.pts==='1')return [{y:40,col:COLS[0]}];
  if(st.pts==='2')return [{y:30,col:COLS[0]},{y:-30,col:COLS[4]}];
  var a=[];for(var i=0;i<7;i++)a.push({y:60-20*i,col:COLS[i]});return a;
}
var side=new HiCanvas($('#side'),16/10,function(c,w,h){
  drawSideView(c,w,h,{g:G,b:st.b,d:st.d,f:null,pts:pts(),ySpan:78,bMax:320,nRays:2,lens:null,maxLeft:0.6});
});
var scr=new ScreenSim($('#scr'),240,180);
$('#scr').style.aspectRatio='4/3';
var pend=false;
function renderScreen(){if(pend)return;pend=true;requestAnimationFrame(function(){pend=false;
  var m=st.b/G,ppm=2; // 2 Pixel pro mm
  var sc=SCENES[st.scene],objScale={kerze:1.1,lampen:2,haus:2}[st.scene];
  var R=blurDiameter(st.d,st.b,G,null)/2*ppm;
  var E=relBrightness(st.d,st.b);
  scr.render(function(o){o.setTransform(-m*ppm*objScale,0,0,m*ppm*objScale,120,90);sc.draw(o);},R,E);
});}
function update(){
  side.request();renderScreen();
  var D=blurDiameter(st.d,st.b,G,null),H=relBrightness(st.d,st.b);
  $('#mD').textContent=fmtLen(D);$('#barD').style.width=clamp(D/20*100,1,100)+'%';
  $('#mH').textContent=(H<10?fmt(H,H<1?2:1):fmt(H,0))+' ×';$('#barH').style.width=clamp(displayGain(H)/1.35*100,2,100)+'%';
}
var sD=new Slider($('#sD'),{label:'Lochdurchmesser d',min:0.2,max:12,value:st.d,log:true,step:0.1,round:0.1,fmt:function(v){return fmt(v,1)+' mm';},onChange:function(v){st.d=v;update();}});
var sB=new Slider($('#sB'),{label:'Abstand Loch – Schirm b',min:50,max:300,value:st.b,step:5,round:5,fmt:function(v){return fmt(v,0)+' mm';},onChange:function(v){st.b=v;update();}});
new Seg($('#segPts'),[{key:'1',label:'1 Punkt'},{key:'2',label:'2 Punkte'},{key:'7',label:'7 Punkte'}],st.pts,function(k){st.pts=k;update();});
new Seg($('#segScene'),[{key:'kerze',label:'Kerze'},{key:'lampen',label:'Zwei Lämpchen'},{key:'haus',label:'Haus'}],st.scene,function(k){st.scene=k;update();});
var running=false;
$('#anim').addEventListener('click',function(){
  if(running)return;running=true;var t0=performance.now(),T=7000;
  (function f(t){var u=Math.min(1,(t-t0)/T);var d=0.3*Math.pow(12/0.3,u);st.d=d;sD.set(d,false);update();
    if(u<1)requestAnimationFrame(f);else running=false;})(t0);
});
update();
persistInputs('lk1');setupCopy($('#copy'),'Lochkamera – Station 1');
})();
