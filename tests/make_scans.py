"""Generate realistic 'phone photo of a document' samples with known corner positions."""
import json,numpy as np,random
from PIL import Image,ImageDraw,ImageFont,ImageFilter
random.seed(1);np.random.seed(1)
F="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf";FB="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
def paper(lines):
    W,H=1275,1650;im=Image.new("RGB",(W,H),(247,245,238));d=ImageDraw.Draw(im)
    d.text((110,110),lines[0],font=ImageFont.truetype(FB,72),fill=(20,20,30));y=260
    for l in lines[1:]:
        d.text((110,y),l,font=ImageFont.truetype(F,40),fill=(30,30,40));y+=70
    d.rectangle([110,y+30,1165,y+34],fill=(40,40,120));return im
def coeffs(dst,src):
    A=[];b=[]
    for (x,y),(u,v) in zip(dst,src):A+=[[x,y,1,0,0,0,-u*x,-u*y],[0,0,0,x,y,1,-v*x,-v*y]];b+=[u,v]
    return np.linalg.solve(np.array(A,float),np.array(b,float)).tolist()
def photo(name,lines,quad,size,bg):
    W,H=size;p=paper(lines);pw,ph=p.size
    base=np.random.normal(0,14,(H,W,3))+np.array(bg,float)
    if bg[0]>bg[2]: base+=np.sin(np.arange(W)/9.0)[None,:,None]*10  # wood grain
    bgim=Image.fromarray(np.clip(base,0,255).astype("uint8")).filter(ImageFilter.GaussianBlur(1.2))
    c=coeffs(quad,[(0,0),(pw,0),(pw,ph),(0,ph)])
    warped=p.transform((W,H),Image.PERSPECTIVE,c,Image.BICUBIC)
    mask=Image.new("L",(pw,ph),255).transform((W,H),Image.PERSPECTIVE,c,Image.BICUBIC)
    # shadow
    sh=Image.new("L",(W,H),0);ImageDraw.Draw(sh).polygon([(x+14,y+18) for x,y in quad],fill=110);sh=sh.filter(ImageFilter.GaussianBlur(14))
    bgim=Image.composite(Image.new("RGB",(W,H),(0,0,0)),bgim,sh)
    im=Image.composite(warped,bgim,mask)
    a=np.asarray(im).astype(float);g=np.linspace(1.0,0.78,W)[None,:,None]*np.linspace(1.0,0.9,H)[:,None,None]   # uneven lighting
    a=a*g+np.random.normal(0,4,a.shape);Image.fromarray(np.clip(a,0,255).astype("uint8")).save(f"tests/samples/{name}",quality=88)
    return quad
def cam(size,tilt_x,tilt_y,rot_z,dist,f,shift=(0,0)):
    """Project an 8.5x11 sheet through a pinhole camera centred on the image -> physically consistent corners."""
    import math
    W,H=size;pts=[(-4.25,-5.5),(4.25,-5.5),(4.25,5.5),(-4.25,5.5)];ax,ay,az=map(math.radians,(tilt_x,tilt_y,rot_z));out=[]
    for x,y in pts:
        x,y=x*math.cos(az)-y*math.sin(az),x*math.sin(az)+y*math.cos(az);z=0
        y,z=y*math.cos(ax)-z*math.sin(ax),y*math.sin(ax)+z*math.cos(ax)
        x,z=x*math.cos(ay)+z*math.sin(ay),-x*math.sin(ay)+z*math.cos(ay)
        x+=shift[0];y+=shift[1];z+=dist;out.append((round(W/2+f*x/z,1),round(H/2+f*y/z,1)))
    return out
L1=["INVOICE 10457","Bill to: Northwind Traders","Date: October 20, 2026","Consulting services 40 hours","Total amount due: $4,800.00","Payment terms: Net 30"]
L2=["MEETING NOTES","Project kickoff with the design team","Agree on budget and timeline","Next review on Friday afternoon","Owner: Jordan Smith"]
Q={"scan1.jpg":photo("scan1.jpg",L1,cam((1500,2000),18,-8,3,16,1500),(1500,2000),(105,70,45)),
   "scan2.jpg":photo("scan2.jpg",L2,cam((1600,1700),-10,12,-22,17,1500,(0.4,0)),(1600,1700),(70,72,78))}
json.dump(Q,open("tests/samples/scans.json","w"))
paper(L1).save("tests/samples/ocr_clean.png")
print("ok")
