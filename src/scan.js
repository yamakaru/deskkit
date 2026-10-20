/* FileMoss document scanner core: edge detection, perspective warp, scan filters. Pure canvas/JS, no uploads. */
var Scan=(function(){var S={};
function gray(d,n){var g=new Float32Array(n);for(var i=0,j=0;i<n;i++,j+=4)g[i]=0.299*d[j]+0.587*d[j+1]+0.114*d[j+2];return g}
function boxBlur(a,w,h,r){var t=new Float32Array(w*h),o=new Float32Array(w*h),x,y,s,k;
 for(y=0;y<h;y++){s=0;for(x=-r;x<=r;x++)s+=a[y*w+Math.min(w-1,Math.max(0,x))];for(x=0;x<w;x++){t[y*w+x]=s/(2*r+1);s+=a[y*w+Math.min(w-1,x+r+1)]-a[y*w+Math.max(0,x-r)]}}
 for(x=0;x<w;x++){s=0;for(y=-r;y<=r;y++)s+=t[Math.min(h-1,Math.max(0,y))*w+x];for(y=0;y<h;y++){o[y*w+x]=s/(2*r+1);s+=t[Math.min(h-1,y+r+1)*w+x]-t[Math.max(0,y-r)*w+x]}}return o}
S.otsu=function(g){var hist=new Float64Array(256),n=g.length,i;for(i=0;i<n;i++)hist[Math.max(0,Math.min(255,g[i]|0))]++;var sum=0;for(i=0;i<256;i++)sum+=i*hist[i];
 var sB=0,wB=0,best=0,th=127;for(i=0;i<256;i++){wB+=hist[i];if(!wB)continue;var wF=n-wB;if(!wF)break;sB+=i*hist[i];var mB=sB/wB,mF=(sum-sB)/wF,v=wB*wF*(mB-mF)*(mB-mF);if(v>best){best=v;th=i}}return th};
function hull(P){P.sort(function(a,b){return a[0]-b[0]||a[1]-b[1]});var cr=function(o,a,b){return (a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0])},L=[],U=[],i;
 for(i=0;i<P.length;i++){while(L.length>=2&&cr(L[L.length-2],L[L.length-1],P[i])<=0)L.pop();L.push(P[i])}for(i=P.length-1;i>=0;i--){while(U.length>=2&&cr(U[U.length-2],U[U.length-1],P[i])<=0)U.pop();U.push(P[i])}L.pop();U.pop();return L.concat(U)}
function area(q){var a=0;for(var i=0;i<q.length;i++){var p=q[i],r=q[(i+1)%q.length];a+=p[0]*r[1]-r[0]*p[1]}return Math.abs(a)/2}
/* largest-area quadrilateral inscribed in the convex hull (exact search over hull vertices, hull is small) */
function bestQuad(H){var n=H.length;if(n<4)return null;var step=Math.max(1,Math.floor(n/60)),idx=[];for(var i=0;i<n;i+=step)idx.push(i);var m=idx.length,best=-1,bq=null;
 for(var a=0;a<m;a++)for(var c=a+2;c<m;c++){var A=H[idx[a]],C=H[idx[c]],b1=-1,bb=null,d1=-1,dd=null;
  for(var b=a+1;b<c;b++){var B=H[idx[b]],t=Math.abs((C[0]-A[0])*(B[1]-A[1])-(C[1]-A[1])*(B[0]-A[0]));if(t>b1){b1=t;bb=B}}
  for(var d=c+1;d<m+a;d++){var D=H[idx[d%m]],t2=Math.abs((C[0]-A[0])*(D[1]-A[1])-(C[1]-A[1])*(D[0]-A[0]));if(t2>d1){d1=t2;dd=D}}
  if(bb&&dd&&b1+d1>best){best=b1+d1;bq=[A,bb,C,dd]}}return bq}
S.order=function(q){var cx=0,cy=0;q.forEach(function(p){cx+=p[0]/4;cy+=p[1]/4});q=q.slice().sort(function(a,b){return Math.atan2(a[1]-cy,a[0]-cx)-Math.atan2(b[1]-cy,b[0]-cx)});
 var k=0,mn=Infinity;q.forEach(function(p,i){if(p[0]+p[1]<mn){mn=p[0]+p[1];k=i}});return [0,1,2,3].map(function(i){return q[(k+i)%4]})}; /* tl,tr,br,bl (clockwise in screen coords) */
/* detect document quad in an image/canvas. Returns [[x,y]x4] in source pixel coords, or null. */
S.detect=function(src){var W=src.naturalWidth||src.width,H=src.naturalHeight||src.height,sc=Math.min(1,400/Math.max(W,H)),w=Math.max(8,Math.round(W*sc)),h=Math.max(8,Math.round(H*sc));
 var c=document.createElement('canvas');c.width=w;c.height=h;var x=c.getContext('2d');x.drawImage(src,0,0,w,h);var g=boxBlur(gray(x.getImageData(0,0,w,h).data,w*h),w,h,2),th=S.otsu(g);
 var cand=[];[1,0].forEach(function(bright){var lab=new Int32Array(w*h).fill(-1),stack=new Int32Array(w*h),bestN=0,bestPts=null,id=0;
  for(var s=0;s<w*h;s++){if(lab[s]>=0||((g[s]>th)?1:0)!==bright)continue;var sp=0,cnt=0,pts=[],touch=0;stack[sp++]=s;lab[s]=id;
   while(sp){var p=stack[--sp],px=p%w,py=(p-px)/w;cnt++;if(px===0||py===0||px===w-1||py===h-1)touch++;
    var nb=[px>0?p-1:-1,px<w-1?p+1:-1,py>0?p-w:-1,py<h-1?p+w:-1];for(var k=0;k<4;k++){var q=nb[k];if(q>=0&&lab[q]<0&&((g[q]>th)?1:0)===bright){lab[q]=id;stack[sp++]=q}}
    var C=function(q){return (g[q]>th?1:0)!==bright};if(px===0||py===0||px===w-1||py===h-1||C(p-1)||C(p+1)||C(p-w)||C(p+w))pts.push([px,py])}
   if(cnt>bestN&&touch<0.5*(2*w+2*h)){bestN=cnt;bestPts=pts}id++}
  if(bestPts&&bestN>0.08*w*h&&bestN<0.97*w*h){var hl=hull(bestPts),q=bestQuad(hl);if(q){var a=area(q),fill=bestN/a;cand.push({q:q,score:a*(fill>1.05?0:Math.min(1,fill))*(bright?1.15:1),a:a})}}});
 if(!cand.length)return null;cand.sort(function(a,b){return b.score-a.score});var best=cand[0];if(best.a<0.1*w*h)return null;
 return S.order(best.q.map(function(p){return [Math.max(0,Math.min(W,(p[0]+0.5)/sc)),Math.max(0,Math.min(H,(p[1]+0.5)/sc))]}))};
S.fullQuad=function(W,H,inset){var m=inset||0;return [[m*W,m*H],[W-m*W,m*H],[W-m*W,H-m*H],[m*W,H-m*H]]};
function solve(A,b){var n=b.length,i,j,k;for(i=0;i<n;i++){var mx=i;for(k=i+1;k<n;k++)if(Math.abs(A[k][i])>Math.abs(A[mx][i]))mx=k;var t=A[i];A[i]=A[mx];A[mx]=t;t=b[i];b[i]=b[mx];b[mx]=t;
 for(k=i+1;k<n;k++){var f=A[k][i]/A[i][i];for(j=i;j<n;j++)A[k][j]-=f*A[i][j];b[k]-=f*b[i]}}var x=new Array(n);for(i=n-1;i>=0;i--){var s=b[i];for(j=i+1;j<n;j++)s-=A[i][j]*x[j];x[i]=s/A[i][i]}return x}
/* homography mapping points p[i] -> q[i] */
S.homography=function(p,q){var A=[],b=[];for(var i=0;i<4;i++){var x=p[i][0],y=p[i][1],u=q[i][0],v=q[i][1];A.push([x,y,1,0,0,0,-u*x,-u*y]);b.push(u);A.push([0,0,0,x,y,1,-v*x,-v*y]);b.push(v)}var h=solve(A,b);h.push(1);return h};
/* true width:height of the paper from its perspective quad, assuming a pinhole camera centred on the image (Zhang & He, whiteboard scanning) */
S.aspect=function(q,W,H){var u0=W/2,v0=H/2,m1=[q[0][0],q[0][1],1],m2=[q[1][0],q[1][1],1],m3=[q[3][0],q[3][1],1],m4=[q[2][0],q[2][1],1];
 var cr=function(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]},dt=function(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]};
 var k2=dt(cr(m1,m4),m3)/dt(cr(m2,m4),m3),k3=dt(cr(m1,m4),m2)/dt(cr(m3,m4),m2),n2=[k2*m2[0]-m1[0],k2*m2[1]-m1[1],k2*m2[2]-m1[2]],n3=[k3*m3[0]-m1[0],k3*m3[1]-m1[1],k3*m3[2]-m1[2]];
 var f2=-((n2[0]*n3[0]-(n2[0]*n3[2]+n2[2]*n3[0])*u0+n2[2]*n3[2]*u0*u0)+(n2[1]*n3[1]-(n2[1]*n3[2]+n2[2]*n3[1])*v0+n2[2]*n3[2]*v0*v0))/(n2[2]*n3[2]);
 var r;if(isFinite(f2)&&f2>0&&Math.abs(n2[2]*n3[2])>1e-12){var Q=function(n){var a=n[0]-u0*n[2],b=n[1]-v0*n[2];return (a*a+b*b)/f2+n[2]*n[2]};r=Math.sqrt(Q(n2)/Q(n3))}else r=Math.sqrt((n2[0]*n2[0]+n2[1]*n2[1])/(n3[0]*n3[0]+n3[1]*n3[1]));
 return isFinite(r)&&r>0.1&&r<10?r:null};
S.outSize=function(q,maxDim,W,H){var d=function(a,b){return Math.hypot(a[0]-b[0],a[1]-b[1])},w=Math.max(d(q[0],q[1]),d(q[3],q[2])),h=Math.max(d(q[0],q[3]),d(q[1],q[2]));
 var r=W&&H?S.aspect(q,W,H):null,naive=w/h;if(r&&Math.abs(Math.log(r/naive))<0.35){if(w/h>r)h=w/r;else w=h*r}var s=Math.min(1,(maxDim||2400)/Math.max(w,h));return [Math.max(1,Math.round(w*s)),Math.max(1,Math.round(h*s))]};
S.warp=function(src,q,maxDim){var W=src.naturalWidth||src.width,H=src.naturalHeight||src.height,sz=S.outSize(q,maxDim,W,H),ow=sz[0],oh=sz[1];
 var ic=document.createElement('canvas');ic.width=W;ic.height=H;var ix=ic.getContext('2d');ix.drawImage(src,0,0);var sd=ix.getImageData(0,0,W,H).data;
 var hm=S.homography([[0,0],[ow,0],[ow,oh],[0,oh]],q),oc=document.createElement('canvas');oc.width=ow;oc.height=oh;var ox=oc.getContext('2d'),od=ox.createImageData(ow,oh),D=od.data;
 for(var y=0;y<oh;y++)for(var x=0;x<ow;x++){var X=x+0.5,Y=y+0.5,z=hm[6]*X+hm[7]*Y+1,sx=(hm[0]*X+hm[1]*Y+hm[2])/z-0.5,sy=(hm[3]*X+hm[4]*Y+hm[5])/z-0.5;
  var x0=Math.floor(sx),y0=Math.floor(sy),fx=sx-x0,fy=sy-y0;if(x0<0){x0=0;fx=0}if(y0<0){y0=0;fy=0}if(x0>=W-1){x0=W-2;fx=1}if(y0>=H-1){y0=H-2;fy=1}
  var i00=(y0*W+x0)*4,i10=i00+4,i01=i00+W*4,i11=i01+4,o=(y*ow+x)*4;for(var c=0;c<3;c++)D[o+c]=(sd[i00+c]*(1-fx)+sd[i10+c]*fx)*(1-fy)+(sd[i01+c]*(1-fx)+sd[i11+c]*fx)*fy;D[o+3]=255}
 ox.putImageData(od,0,0);return oc};
/* filters: original | enhance (magic color) | gray | bw */
S.filter=function(cv,mode){if(mode==='original')return cv;var w=cv.width,h=cv.height,x=cv.getContext('2d'),id=x.getImageData(0,0,w,h),d=id.data,n=w*h,g=gray(d,n),i,j;
 if(mode==='gray'){var lo=pct(g,0.01),hi=pct(g,0.99);for(i=0,j=0;i<n;i++,j+=4){var v=clamp((g[i]-lo)*255/Math.max(1,hi-lo));d[j]=d[j+1]=d[j+2]=v}}
 else{var r=Math.max(8,Math.round(Math.max(w,h)/40)),bg=bgEstimate(g,w,h,r);
  if(mode==='bw'){var m=boxBlur(g,w,h,Math.max(6,Math.round(Math.max(w,h)/60)));for(i=0,j=0;i<n;i++,j+=4){var nv=g[i]/Math.max(1,bg[i]),v2=(g[i]<m[i]*0.88&&nv<0.8)?0:255;d[j]=d[j+1]=d[j+2]=v2}}
  else{for(i=0,j=0;i<n;i++,j+=4){var f=255/Math.max(30,bg[i]);for(var c=0;c<3;c++){var t=d[j+c]*f;t=(t-25)*1.15;d[j+c]=clamp(t>238?255:t)}}}}
 x.putImageData(id,0,0);return cv};
function clamp(v){return v<0?0:v>255?255:v}
function pct(g,p){var h=new Uint32Array(256);for(var i=0;i<g.length;i++)h[g[i]|0]++;var t=g.length*p,s=0;for(i=0;i<256;i++){s+=h[i];if(s>=t)return i}return 255}
/* paper brightness: max-filter on a small image (removes text), then blur, then upsample */
function bgEstimate(g,w,h,r){var sw=Math.max(4,Math.round(w/r*4)),sh=Math.max(4,Math.round(h/r*4)),s=new Float32Array(sw*sh),x,y;
 for(y=0;y<sh;y++)for(x=0;x<sw;x++){var x0=Math.floor(x*w/sw),x1=Math.floor((x+1)*w/sw),y0=Math.floor(y*h/sh),y1=Math.floor((y+1)*h/sh),mx=0;for(var yy=y0;yy<y1;yy+=1)for(var xx=x0;xx<x1;xx+=1){var v=g[yy*w+xx];if(v>mx)mx=v}s[y*sw+x]=mx}
 var t=new Float32Array(sw*sh);for(y=0;y<sh;y++)for(x=0;x<sw;x++){var mm=0;for(var dy=-2;dy<=2;dy++)for(var dx=-2;dx<=2;dx++){var X=Math.min(sw-1,Math.max(0,x+dx)),Y=Math.min(sh-1,Math.max(0,y+dy));if(s[Y*sw+X]>mm)mm=s[Y*sw+X]}t[y*sw+x]=mm}
 t=boxBlur(t,sw,sh,2);var o=new Float32Array(w*h);for(y=0;y<h;y++){var fy=Math.min(sh-1.001,Math.max(0,(y+0.5)*sh/h-0.5)),y0=Math.floor(fy),ay=fy-y0;for(x=0;x<w;x++){var fx=Math.min(sw-1.001,Math.max(0,(x+0.5)*sw/w-0.5)),x0=Math.floor(fx),ax=fx-x0;
  o[y*w+x]=(t[y0*sw+x0]*(1-ax)+t[y0*sw+x0+1]*ax)*(1-ay)+(t[(y0+1)*sw+x0]*(1-ax)+t[(y0+1)*sw+x0+1]*ax)*ay}}return o}
S.rotate=function(cv,quarter){quarter=((quarter%4)+4)%4;if(!quarter)return cv;var o=document.createElement('canvas');o.width=quarter%2?cv.height:cv.width;o.height=quarter%2?cv.width:cv.height;var x=o.getContext('2d');x.translate(o.width/2,o.height/2);x.rotate(quarter*Math.PI/2);x.drawImage(cv,-cv.width/2,-cv.height/2);return o};
S.clone=function(cv){var o=document.createElement('canvas');o.width=cv.width;o.height=cv.height;o.getContext('2d').drawImage(cv,0,0);return o};
/* OCR (lazy-loaded tesseract.js, self-hosted, English) */
var worker=null;S.ocrWorker=function(onProgress){if(worker)return worker;worker=UI.loadScript('/assets/tess/tesseract.min.js').then(function(){return Tesseract.createWorker('eng',1,{workerPath:'/assets/tess/worker.min.js',corePath:'/assets/tess/',langPath:'/assets/tess/lang',gzip:true,logger:function(m){S._onp&&S._onp(m)}})});worker.catch(function(){worker=null});return worker};
S.ocr=function(img,onProgress){S._onp=onProgress;return S.ocrWorker().then(function(w){return w.recognize(img)}).then(function(r){return r.data})};
return S;})();
