import sys
from PIL import Image,ImageDraw,ImageFont
W,H=1200,630;im=Image.new("RGB",(W,H));d=ImageDraw.Draw(im)
for y in range(H):
    t=y/H;d.line([(0,y),(W,y)],fill=(int(20+(22-20)*t),int(83+(101-83)*t*1.4),int(45+(52-45)*t)))
d.rounded_rectangle([90,170,250,330],38,fill=(34,197,94));d.polygon([(135,200),(190,200),(215,225),(215,300),(135,300)],fill="white");d.polygon([(190,200),(190,225),(215,225)],fill=(187,247,208))
d.ellipse([150,255,185,290],fill=(22,163,74))
B=ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",96);R=ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",32)
d.text((290,180),"File",font=B,fill="white");d.text((290+d.textlength("File",font=B),180),"Moss",font=B,fill=(134,239,172))
d.text((292,300),"Free private file tools — PDF, image, OCR & more",font=R,fill=(220,252,231))
d.text((92,420),"🔒 Files never leave your device".replace("🔒 ",""),font=R,fill="white")
d.text((92,540),sys.argv[1].replace("https://",""),font=R,fill=(187,247,208))
im.save("dist/og.png")
