
/* ---------- Station 4: gemeinsame Teile für 2D und 3D ---------- */
/* α-β-Diagramm: merkt sich je Material und Richtung, bis zu welchem α schon gemessen wurde */
function makeABChart(canvas,MATS){
  var ch=new MiniChart(canvas,{aspect:2.4,xMax:90,yMax:90,xLabel:'Einfallswinkel α in °',yLabel:'Brechungswinkel β in °'});
  var seen={},COL={wasser:'#1971c2',glas:'#2b8a3e',diamant:'#9c36b5',luft:'#868e96'};
  return {update:function(mat,dir,alpha){
    var key=mat+'|'+dir,n=MATS[mat].n,nn=dir==='in'?[1,n]:[n,1];
    seen[key]=Math.max(seen[key]||0,alpha);
    var series=[{pts:[[0,0],[90,90]],color:'#ced4da',width:1.5,dash:[5,5]}],legend=[],marks=[];
    Object.keys(seen).forEach(function(k){var p=k.split('|'),m=p[0],d=p[1],n2=MATS[m].n,q=d==='in'?[1,n2]:[n2,1],pts=[];
      for(var a=0;a<=seen[k]+1e-9;a+=0.5){var s=q[0]/q[1]*Math.sin(a*Math.PI/180);pts.push([a,s>1?NaN:Math.asin(s)*180/Math.PI]);}
      var cur=k===key;series.push({pts:pts,color:COL[m],width:cur?3:1.6,dash:d==='in'?[]:[7,4]});
      legend.push({label:MATS[m].l+(d==='in'?' (aus der Luft)':' (aus dem Material)'),color:COL[m],dash:d==='in'?[]:[7,4]});});
    var s0=nn[0]/nn[1]*Math.sin(alpha*Math.PI/180);
    if(s0<=1)marks.push({x:alpha,y:Math.asin(s0)*180/Math.PI,color:COL[mat],label:'jetzt'});
    ch.o.legend=legend.length>4?legend.slice(-4):legend;ch.set(series,marks);}};
}
/* Brennpunkt eines Glaskörpers: achsennaher Parallelstrahl (Höhe 1 mm), Schnitt mit der Achse */
function findFocus(shapes,n,CXl,CYl){
  if(Math.abs(n-1)<1e-3)return {none:true};
  var r=traceShapes(0,CYl-1,1,0,shapes,n,600),p=r.path;if(p.length<3)return {none:true};
  var a=p[p.length-2],b=p[p.length-1],dx=b[0]-a[0],dy=b[1]-a[1];if(Math.abs(dy)<1e-9)return {none:true};
  var t=(CYl-a[1])/dy,x=a[0]+dx*t;return {x:x,f:x-CXl,virtual:t<0};
}
/* Farben für weißes Licht: Brechzahl-Zuschlag (etwa dreifach verstärkt) */
function dispColors(){return [{c:'#ff3b30',d:-0.008},{c:'#ff9500',d:-0.004},{c:'#ffd60a',d:0},{c:'#34c759',d:0.005},{c:'#32d2ff',d:0.010},{c:'#3a6bff',d:0.017},{c:'#af52de',d:0.030}];}
