(function(){
var DEG=Math.PI/180;
var MATS={wasser:{l:'Wasser',n:1.33,tint:0x74c0fc,op:0.42},glas:{l:'Glas',n:1.5,tint:0xa5d8ff,op:0.45},diamant:{l:'Diamant',n:2.42,tint:0xe5dbff,op:0.6},luft:{l:'Luft',n:1.0,tint:0xffffff,op:0.08}};
var A={alpha:30,mat:'glas',dir:'in',num:true};
function n12(){var n=MATS[A.mat].n;return A.dir==='in'?[1,n]:[n,1];}
function beta(){var nn=n12(),s=nn[0]/nn[1]*Math.sin(A.alpha*DEG);return s>1?null:Math.asin(s)/DEG;}

/* ---------- Winkelscheibe in 3D ---------- */
var RD=100,HB=9,TH=3;
var vA=new View3D($('#vA'),{shadows:true,aspect:1.15,maxVH:0.7,pos:[0,200,250],target:[0,0,10],minDist:60,maxDist:900,maxPolar:Math.PI*0.49,ctl:'#ctlA',
  presets:[{label:'Von oben (messen)',ortho:true,pos:[0,500,0],target:[0,0,0],size:118},{label:'Flach',pos:[150,45,150],target:[0,8,0]}],hint:'Lampe ziehen · daneben: drehen'});
var dA={};
if(vA.ok){(function(){var s=vA.scene;vA.labDefaults({shadowSize:250,key:1.2,room:{cx:0,cz:-500,w:6000,d:5200,floorY:-764,h:3000}});s.add(makeTable(1400,800,0,{}));
  var tex=canvasTex(2048,2048,function(c,w){var cx=w/2,r=w*0.48;c.fillStyle='#f4f1ea';c.beginPath();c.arc(cx,cx,r,0,7);c.fill();
    c.strokeStyle='#1d2230';c.fillStyle='#1d2230';c.textAlign='center';c.textBaseline='middle';
    for(var a=0;a<360;a++){var rad=a*DEG,len=a%10===0?70:(a%5===0?44:24);c.lineWidth=a%10===0?5:3;c.beginPath();c.moveTo(cx+Math.sin(rad)*r,cx-Math.cos(rad)*r);c.lineTo(cx+Math.sin(rad)*(r-len),cx-Math.cos(rad)*(r-len));c.stroke();
      if(a%10===0){var lab=a<=90?a:(a<=270?Math.abs(180-a):360-a);c.save();c.translate(cx+Math.sin(rad)*(r-115),cx-Math.cos(rad)*(r-115));c.rotate(rad);c.font='bold 54px -apple-system,Helvetica,Arial,sans-serif';c.fillText(lab+'°',0,0);c.restore();}}
    c.lineWidth=3;c.beginPath();c.arc(cx,cx,r-160,0,7);c.stroke();
    c.setLineDash([22,18]);c.lineWidth=5;c.beginPath();c.moveTo(cx,cx-r);c.lineTo(cx,cx+r);c.stroke();c.setLineDash([]);
    c.lineWidth=4;c.beginPath();c.moveTo(cx-r,cx);c.lineTo(cx+r,cx);c.stroke();
    c.beginPath();c.arc(cx,cx,10,0,7);c.fill();});
  var disc=new T3.Mesh(new T3.CylinderGeometry(RD*1.04,RD*1.04,TH,96),[stdMat(0xdedad0,0.6),stdMat(0xffffff,0.7,0,{map:tex}),stdMat(0xdedad0,0.6)]);disc.position.y=TH/2;disc.rotation.y=Math.PI/2;disc.receiveShadow=true;disc.castShadow=true;s.add(disc);
  dA.body=new GlassBody(s,{op:0.45,edge:0x1c7ed6});dA.lastKey='';
  /* farbige Fläche unter dem Glas: hier ist das Material */
  dA.tintMat=new T3.MeshBasicMaterial({color:0x74c0fc,transparent:true,opacity:0.28,depthWrite:false,side:T3.DoubleSide});dA.tint=null;
  dA.beam=new Lines(s,{width:3.4,additive:false});dA.glow=new Lines(s,{width:12,opacity:0.3});dA.arcs=new Lines(s,{width:3,additive:false});
  dA.lot=new Lines(s,{width:1.6,dashed:true,dash:4,gap:4,additive:false});
  dA.lamp=new Lamp3D(s,{w:6});dA.la=label3d('α','plain big');dA.la.el.style.color='#ffd43b';s.add(dA.la);dA.lb=label3d('β','plain big');dA.lb.el.style.color='#69db7c';s.add(dA.lb);
  dA.tir=label3d('Totalreflexion!','warn');s.add(dA.tir);dA.mL=label3d('','dim');dA.mM=label3d('','dim');s.add(dA.mL);s.add(dA.mM);
  vA.addHandle({obj:dA.lamp.hit,plane:function(){return new T3.Plane(V3(0,1,0),-HB);},move:function(p){var z=Math.min(p.z,0);var a=Math.round(Math.atan2(-p.x,-z)/DEG);a=clamp(Math.abs(a),0,89);A.alpha=a;sAlpha.set(a,false);updA();}});
})();}
function drawA(){if(!vA.ok)return;var nn=n12(),b=beta(),M=MATS[A.mat],matTop=A.dir!=='in';
  var key=A.mat+A.dir;if(key!==dA.lastKey){dA.lastKey=key;var R2=RD*0.82,pts=[];for(var i=0;i<=64;i++){var t=Math.PI*i/64;pts.push([R2*Math.cos(t),(matTop?-1:1)*R2*Math.sin(t)]);}
    dA.body.mat.color.set(M.tint);dA.body.mat.opacity=M.op;dA.body.set([pts],function(x,y){return [x,y];},18,TH);
    if(dA.tint){vA.scene.remove(dA.tint);dA.tint.geometry.dispose();}
    var sh=new T3.Shape();pts.forEach(function(p,i){i?sh.lineTo(p[0],-p[1]):sh.moveTo(p[0],-p[1]);});
    var tg=new T3.ShapeGeometry(sh);tg.rotateX(-Math.PI/2);dA.tint=new T3.Mesh(tg,dA.tintMat);dA.tint.position.y=TH+0.15;dA.tintMat.color.set(M.tint);dA.tintMat.opacity=A.mat==='luft'?0:0.3;vA.scene.add(dA.tint);}
  var al=A.alpha*DEG,R=[0.95,0.06,0.04],S=[],Gw=[],L=[],AR=[];
  var lp=V3(-Math.sin(al)*RD*1.08,HB,-Math.cos(al)*RD*1.08),O=V3(0,HB,0);
  S.push(seg(lp,O,R));Gw.push(seg(lp,O,scaleC(R,0.9)));
  var refl=b===null?1:0.12+0.5*Math.pow(A.alpha/90,6),rp=V3(Math.sin(al)*RD,HB,-Math.cos(al)*RD);
  S.push(seg(O,rp,scaleC(R,1)));if(refl<0.5){S.pop();}Gw.push(seg(O,rp,scaleC(R,0.9*refl)));
  if(b!==null){var bb=b*DEG,tp=V3(Math.sin(bb)*RD,HB,Math.cos(bb)*RD);S.push(seg(O,tp,R));Gw.push(seg(O,tp,scaleC(R,0.85)));}
  dA.beam.set(S);dA.glow.set(Gw);
  L.push(seg(V3(0,TH+0.4,-RD*1.08),V3(0,TH+0.4,RD*1.08),[1,1,1]));dA.lot.set(L);
  dA.lamp.group.position.set(-Math.sin(al)*RD*1.12,7,-Math.cos(al)*RD*1.12);dA.lamp.group.rotation.y=Math.atan2(-Math.cos(al),Math.sin(al));
  var rr=RD*0.32,h=TH+0.6;
  if(A.num){var pa=[];for(var i=0;i<=24;i++){var t=al*i/24;pa.push(V3(-Math.sin(t)*rr,h,-Math.cos(t)*rr));}AR=AR.concat(polySegs(pa,lin('#ffd43b')));
    dA.la.visible=true;dA.la.position.set(-Math.sin(al/2)*RD*0.43,h+2,-Math.cos(al/2)*RD*0.43);
    if(b!==null){var bb2=b*DEG,pb=[];for(var j=0;j<=24;j++){var t2=bb2*j/24;pb.push(V3(Math.sin(t2)*rr,h,Math.cos(t2)*rr));}AR=AR.concat(polySegs(pb,lin('#69db7c')));
      dA.lb.visible=true;dA.lb.position.set(Math.sin(bb2/2)*RD*0.43,h+2,Math.cos(bb2/2)*RD*0.43);}else dA.lb.visible=false;}
  else{dA.la.visible=false;dA.lb.visible=false;}
  dA.arcs.set(AR);
  dA.tir.visible=b===null;dA.tir.position.set(0,HB+14,RD*0.5);
  dA.mL.el.textContent='Luft';dA.mL.position.set(-RD*0.75,4,matTop?RD*0.75:-RD*0.75);
  dA.mM.el.textContent=M.l+' (n = '+fmt(M.n,2)+')';dA.mM.position.set(RD*0.55,24,matTop?-RD*0.55:RD*0.55);
  vA.request();}
var abChart=makeABChart($('#chartAB'),MATS);
function updA(){drawA();var b=beta();
  $('#mA').textContent=A.num?fmt(A.alpha,0)+'°':'?';$('#mB').textContent=A.num?(b===null?'–':fmt(b,1)+'°'):'?';drawW();abChart.update(A.mat,A.dir,A.alpha);}
var sAlpha=new Slider($('#sAlpha'),{label:'Einfallswinkel α',min:0,max:89,value:A.alpha,step:1,round:1,fmt:function(v){return fmt(v,0)+'°';},onChange:function(v){sweepA.stop();A.alpha=v;updA();}});
new Seg($('#segMat'),Object.keys(MATS).map(function(k){return {key:k,label:MATS[k].l};}),A.mat,function(k){A.mat=k;updA();});
new Seg($('#segDir'),[{key:'in',label:'aus der Luft'},{key:'out',label:'aus dem Material'}],A.dir,function(k){A.dir=k;updA();});
new Toggle($('#btnNum'),'Winkel anzeigen',true,function(on){A.num=on;updA();});
var sweepA=new AnimButton($('#sweepA'),'▶ α von 0° bis 89° durchfahren',7000,function(u){A.alpha=Math.round(u*89);sAlpha.set(A.alpha,false);updA();});

/* ---------- Wellenmodell in 3D (bei Totalreflexion mit zurücklaufender Welle) ---------- */
var WVS='uniform float u1x,u1y,s2,u2y,k1,k2,wt,tir,dirIn;varying float vV;varying float vMat;varying vec3 vP;\n'+
 'void main(){vec3 p=position;float X=p.x,Y=p.z;float v;\n'+
 'if(Y<0.0){float a=0.5+0.5*cos(k1*(u1x*X+u1y*Y)-wt);if(tir>0.5){float r=0.5+0.5*cos(k1*(u1x*X-u1y*Y)-wt);v=0.5*(a+r);}else v=a;}\n'+
 'else{v=(tir>0.5)?0.0:0.5+0.5*cos(k1*u1x*X+k2*u2y*Y-wt);}\n'+
 'v=v*v*v;vV=v;vMat=(dirIn>0.5)?step(0.0,Y):1.0-step(0.0,Y);p.y=v*5.0;vP=(modelMatrix*vec4(p,1.0)).xyz;\n'+
 'gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}';
var WFS='varying float vV;varying float vMat;varying vec3 vP;\n'+
 'void main(){vec3 n=normalize(cross(dFdx(vP),dFdy(vP)));if(n.y<0.0)n=-n;float sh=0.55+0.45*max(dot(n,normalize(vec3(-0.4,1.0,0.5))),0.0);\n'+
 'vec3 c=vec3(30.0+200.0*vV,40.0+160.0*vV,(vMat>0.5?110.0:50.0)+120.0*vV)/255.0;c*=sh;gl_FragColor=vec4(c,1.0);}';
var vW=null,wU=null,wt=0,dW={},wRun=true,wLast=0;
(function(){var det=$('#vW').closest('details');
  function init(){if(vW)return;vW=new View3D($('#vW'),{aspect:2,pos:[0,170,190],target:[0,0,5],env:false,minDist:60,maxDist:800,presets:[{label:'Von oben',ortho:true,pos:[0,300,0],target:[0,0,0],size:52},{label:'Flach',pos:[-60,40,170],target:[0,0,0]}]});
    if(!vW.ok)return;var s=vW.scene;
    wU={u1x:{value:0},u1y:{value:1},s2:{value:0},u2y:{value:1},k1:{value:1},k2:{value:1},wt:{value:0},tir:{value:0},dirIn:{value:1}};
    var pg=new T3.PlaneGeometry(200,100,260,130);pg.rotateX(-Math.PI/2);
    var m=new T3.Mesh(pg,new T3.ShaderMaterial({uniforms:wU,vertexShader:WVS,fragmentShader:WFS,side:T3.DoubleSide}));s.add(m);
    dW.line=new Lines(s,{width:2.5,additive:false,layer:0});dW.line.set([seg(V3(-100,6,0),V3(100,6,0),[1,1,1])]);
    dW.arrows=new T3.Group();s.add(dW.arrows);
    dW.l1=label3d('','dim');dW.l2=label3d('','dim');s.add(dW.l1);s.add(dW.l2);
    /* zeitbasiert, unabhängig von der Bildrate */
    vW.anim=function(t){var dt=wLast?Math.min(0.1,(t-wLast)/1000):0;wLast=t;if(!det.open||!wRun)return false;wt+=dt*7;wU.wt.value=wt;return true;};
    drawW();}
  det.addEventListener('toggle',function(){if(det.open)setTimeout(init,30);});
  $('#wavePause').addEventListener('click',function(){wRun=!wRun;this.textContent=wRun?'⏸ Wellen anhalten':'▶ Wellen weiterlaufen lassen';});
})();
function arrow3(from,dir,len,col){var g=new T3.Group(),m=new T3.MeshBasicMaterial({color:col,toneMapped:false});
  var c=new T3.Mesh(new T3.CylinderGeometry(1.2,1.2,len-8,12),m);c.position.y=(len-8)/2;g.add(c);var h=new T3.Mesh(new T3.ConeGeometry(3.4,8,16),m);h.position.y=len-4;g.add(h);
  g.position.copy(from);g.quaternion.setFromUnitVectors(V3(0,1,0),dir.clone().normalize());return g;}
function drawW(){if(!vW||!vW.ok)return;var nn=n12(),al=A.alpha*DEG,u1x=Math.sin(al),u1y=Math.cos(al),s2=nn[0]/nn[1]*u1x,tir=s2>1,u2y=tir?0:Math.sqrt(1-s2*s2);
  wU.u1x.value=u1x;wU.u1y.value=u1y;wU.s2.value=s2;wU.u2y.value=u2y;wU.k1.value=2*Math.PI/14*nn[0];wU.k2.value=2*Math.PI/14*nn[1];wU.tir.value=tir?1:0;wU.dirIn.value=A.dir==='in'?1:0;
  clearGroup(dW.arrows);
  dW.arrows.add(arrow3(V3(-u1x*40,14,-u1y*40),V3(u1x,0,u1y),36,0xff6b6b));
  if(!tir)dW.arrows.add(arrow3(V3(0,14,0),V3(s2,0,u2y),36,0xff6b6b));
  else dW.arrows.add(arrow3(V3(0,14,0),V3(u1x,0,-u1y),36,0xffa8a8));
  var M=MATS[A.mat];dW.l1.el.textContent=A.dir==='in'?'Luft':M.l;dW.l2.el.textContent=A.dir==='in'?M.l:'Luft';dW.l1.position.set(-80,10,-40);dW.l2.position.set(-80,10,40);
  vW.request();}
updA();

/* ---------- Schritt 2: Strahlenverfolgung durch Glaskörper ---------- */
var B={shape:'sammel',beam:'par',ang:0,n:1.5,R:70,sy:62.5,px:12,py:62.5,edge:false};
var SW=200,SH=125,CX=80,CY=62.5,HB2=10,HG=22;
function rect(x0,y0,x1,y1){return shapeFrom([[x0,y0],[x1,y0],[x1,y1],[x0,y1]]);}
function prismStack(R,a){
  function T(y){return 2*(Math.sqrt(R*R-y*y)-Math.sqrt(R*R-a*a))+1.5;}
  var polys=[],t0=T(4);polys.push(rect(CX-t0/2,CY-8,CX+t0/2,CY+8));
  [[9.5,18],[19.5,26],[27.5,a]].forEach(function(s){var y1=s[0],y2=s[1],t1=T(y1),t2=T(y2);
    [1,-1].forEach(function(sg){polys.push(shapeFrom([[CX-t1/2,CY+sg*y1],[CX+t1/2,CY+sg*y1],[CX+t2/2,CY+sg*y2],[CX-t2/2,CY+sg*y2]]));});});
  return polys;
}
function shapes(){
  var R=B.R,a=40;
  switch(B.shape){
    case 'quader':return [rect(CX-25,CY-35,CX+25,CY+35)];
    case 'prisma':var s=60,hgt=s*Math.sqrt(3)/2;return [shapeFrom([[CX,CY-hgt*0.6],[CX+s/2,CY+hgt*0.4],[CX-s/2,CY+hgt*0.4]])];
    case 'stapel':return prismStack(Math.max(R,36),34);
    case 'sammel':return [lensShape(CX,CY,R,a,true)];
    case 'zerstreu':return [lensShape(CX,CY,R,a,false)];
  }
}
var X0=100,Y0=62.5;
function W(x,y,h){return V3(x-X0,h==null?HB2:h,y-Y0);}
var vB=new View3D($('#vB'),{shadows:true,pos:[-20,150,250],target:[0,0,0],minDist:40,maxDist:900,maxPolar:Math.PI*0.49,ctl:'#ctlB',
  presets:[{label:'Von oben (messen)',ortho:true,pos:[0,400,0],target:[0,0,0],size:70},{label:'Flach am Tisch',pos:[-150,35,110],target:[0,10,0]},{label:'Hinter der Linse',pos:[200,60,40],target:[-20,10,0]}],hint:'Lampe ziehen · daneben: drehen'});
var dB={};
if(vB.ok){(function(){var s=vB.scene;vB.labDefaults({shadowSize:300,key:1.3,room:{cx:0,cz:-400,w:6000,d:5200,floorY:-764,h:3000}});s.add(makeTable(1600,900,0,{}));
  var board=new T3.Mesh(new T3.BoxGeometry(SW+30,3,SH+30),stdMat(0xe9ecef,0.7));board.position.y=-1.3;board.receiveShadow=true;s.add(board);
  var paper=new T3.Mesh(new T3.PlaneGeometry(SW,SH),stdMat(0x1d2027,0.85));paper.rotation.x=-Math.PI/2;paper.position.y=0.25;paper.receiveShadow=true;s.add(paper);
  var pg=makeGrid(SW,SH,10,0x5d6474);pg.position.y=0.35;s.add(pg);
  var ax=new Lines(s,{width:1.5,dashed:true,dash:5,gap:5,additive:false,layer:0});ax.set([seg(W(0,CY,0.6),W(SW,CY,0.6),[0.75,0.78,0.85])]);
  dB.body=new GlassBody(s,{op:0.3});dB.key='';dB.rays=new Lines(s,{width:2.2});dB.glow=new Lines(s,{width:8,opacity:0.18});
  dB.wide=new Lamp3D(s,{w:66});dB.pt=new T3.Group();s.add(dB.pt);
  var bulb=ledMesh('#ffe8a0',4.5);bulb.position.y=HB2;dB.pt.add(bulb);var post=new T3.Mesh(new T3.CylinderGeometry(1.5,2.5,HB2-4,12),stdMat(0x30343c,0.5,0.5));post.position.y=(HB2-4)/2;dB.pt.add(post);
  dB.ptHit=new T3.Mesh(new T3.SphereGeometry(13,12,8),new T3.MeshBasicMaterial({visible:false}));dB.ptHit.position.y=HB2;dB.pt.add(dB.ptHit);
  /* Brennpunkt-Markierung */
  dB.F=new T3.Group();var fm=new T3.Mesh(new T3.SphereGeometry(2.2,16,12),new T3.MeshBasicMaterial({color:0xffffff,toneMapped:false}));fm.position.y=HB2;dB.F.add(fm);
  dB.Fl=label3d('F','plain big');dB.Fl.position.set(0,HB2+9,0);dB.F.add(dB.Fl);s.add(dB.F);
  vB.addHandle({obj:dB.wide.hit,plane:function(){return new T3.Plane(V3(0,1,0),-HB2);},keepOffset:true,origin:function(){return W(B.px,B.sy);},move:function(p){B.sy=clamp(p.z+Y0,5,SH-5);drawB();}});
  vB.addHandle({obj:dB.ptHit,plane:function(){return new T3.Plane(V3(0,1,0),-HB2);},keepOffset:true,origin:function(){return W(B.px,B.py);},move:function(p){B.py=clamp(p.z+Y0,5,SH-5);B.px=clamp(p.x+X0,4,CX-45);drawB();}});
})();}
function isLens(){return B.shape==='sammel'||B.shape==='zerstreu'||B.shape==='stapel';}
function focusInfo(polys){var el=$('#focusInfo');
  if(!isLens()){el.style.display='none';return null;}el.style.display='';
  if(B.shape==='stapel'){el.textContent='Linse aus Prismen: Die Strahlen treffen sich nur ungefähr in einem Bereich – nicht in einem Punkt.';return null;}
  var F=findFocus(polys,B.n,CX,CY);
  if(F.none){el.textContent='n = 1: Das Glas bricht nicht. Die Linse hat keine Wirkung, es gibt keinen Brennpunkt.';return null;}
  if(F.virtual){el.textContent='Zerstreuungslinse: Die Strahlen laufen auseinander. Verlängert man sie nach hinten, scheinen sie von einem Punkt '+fmt(-F.f,0)+' mm vor der Linse zu kommen.';return F;}
  el.innerHTML='Brennpunkt F (achsennahe Strahlen): <b>'+fmt(F.f,0)+' mm</b> hinter der Linsenmitte'+(B.beam==='pt'?' · Mit der Punktlampe treffen sich die Strahlen im <b>Bildpunkt</b>, nicht in F.':'.');return F;}
function drawB(){
  var polys=shapes(),k=B.shape+'|'+B.R.toFixed(2);
  var F=focusInfo(polys);
  if(!vB.ok)return;
  if(k!==dB.key){dB.key=k;dB.body.set(polys.map(function(p){return p.pts;}),function(x,y){return [x-X0,y-Y0];},HG,0.4);}
  dB.body.setOpacity(0.08+0.3*(B.n-1));
  var rays=[],i,N,white=B.beam==='weiss';
  if(B.beam!=='pt'){var ux=Math.cos(B.ang*DEG),uy=Math.sin(B.ang*DEG),span;
    if(B.shape==='quader'||B.shape==='prisma')span=white?0:24;else span=B.edge?64:22;
    N=white?((B.shape==='prisma'||B.shape==='quader')?1:5):9;
    var offs=[];if(B.shape==='stapel')offs=[-30,-22,-13,-4,0,4,13,22,30];else for(i=0;i<N;i++)offs.push(N>1?-span/2+span*i/(N-1):0);
    offs.forEach(function(off){rays.push([B.px-uy*off,B.sy+ux*off,ux,uy]);});
    dB.wide.group.visible=true;dB.pt.visible=false;dB.wide.group.position.copy(W(B.px-2,B.sy,7));dB.wide.group.rotation.y=-B.ang*DEG;
    dB.wide.group.scale.set(1,1,Math.max(14,span+8)/68);}
  else{N=13;var x0=B.px,y0=B.py,dx=CX-x0,hh=B.edge?42:20,top=Math.atan2(CY-hh-y0,dx),bot=Math.atan2(CY+hh-y0,dx);
    for(i=0;i<N;i++){var a=top+(bot-top)*i/(N-1);rays.push([x0,y0,Math.cos(a),Math.sin(a)]);}
    dB.wide.group.visible=false;dB.pt.visible=true;dB.pt.position.copy(W(B.px,B.py,0));}
  var S=[],G=[],cols=white?dispColors():[{c:null,d:0}],sc=(B.n-1)/0.5;
  cols.forEach(function(cc){var R=cc.c?scaleC(lin(cc.c),1.4):[1,0.3,0.2],n=B.n+cc.d*sc;
    rays.forEach(function(r){var p=traceShapes(r[0],r[1],r[2],r[3],polys,n).path;var m=p.length;p[m-1]=clipEnd(p[m-2],p[m-1],-5,-5,SW+5,SH+5);
      var w3=p.map(function(q){return W(q[0],q[1]);});S=S.concat(polySegs(w3,scaleC(R,white?0.8:1.1)));G=G.concat(polySegs(w3,scaleC(R,0.6)));});});
  dB.rays.set(S);dB.glow.set(G);
  dB.F.visible=!!(F&&!F.virtual&&F.x>0&&F.x<SW&&B.beam==='par'&&B.ang===0);if(dB.F.visible)dB.F.position.copy(W(F.x,CY,0));
  vB.request();}
var segShape=new Seg($('#segShape'),[{key:'quader',label:'Glasquader'},{key:'prisma',label:'Prisma'},{key:'stapel',label:'Linse aus Prismen'},{key:'sammel',label:'Sammellinse'},{key:'zerstreu',label:'Zerstreuungslinse'}],B.shape,function(k){B.shape=k;
  if(k==='prisma'||k==='quader'){B.ang=k==='prisma'?-10:15;sAng.set(B.ang,false);}else{B.ang=0;sAng.set(0,false);}
  B.sy=k==='prisma'?CY+14:(k==='quader'?CY-20:CY);B.py=CY;updB();});
new Seg($('#segBeam'),[{key:'par',label:'paralleles Licht'},{key:'pt',label:'Punktlampe'},{key:'weiss',label:'weißes Licht'}],B.beam,function(k){B.beam=k;updB();});
new Toggle($('#btnEdge'),'Randstrahlen zeigen',false,function(on){B.edge=on;updB();});
var sAng=new Slider($('#sAng'),{label:'Richtung des Lichts',min:-30,max:30,value:B.ang,step:1,round:1,fmt:function(v){return fmt(v,0)+'°';},onChange:function(v){B.ang=v;updB();}});
new Slider($('#sN'),{label:'Brechzahl n des Glases',min:1,max:2,value:B.n,step:0.01,round:0.01,fmt:function(v){return fmt(v,2);},onChange:function(v){B.n=v;updB();}});
var sR=new Slider($('#sR'),{label:'Wölbung der Linse',min:0,max:100,value:65,step:2,round:1,fmt:function(v){return (v<20?'flach':(v<60?'mittel':'stark'))+' (R = '+fmt(wToR(v),0)+' mm)';},onChange:function(v){B.R=wToR(v);updB();}});
function wToR(v){return 220*Math.pow(42/220,v/100);}
B.R=wToR(65);
function updB(){sR.enable(isLens());sAng.enable(B.beam!=='pt');drawB();}
updB();
persistInputs('lk3');setupCopy($('#copy'),'Lochkamera – Station 4');
})();
