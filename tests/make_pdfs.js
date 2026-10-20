const {PDFDocument,StandardFonts}=require('pdf-lib');const fs=require('fs');
(async()=>{for(const [n,name] of [[3,'a3.pdf'],[2,'b2.pdf']]){const d=await PDFDocument.create(),f=await d.embedFont(StandardFonts.Helvetica);for(let i=1;i<=n;i++){const p=d.addPage([612,792]);p.drawText(name+' page '+i,{x:72,y:700,size:36,font:f})}fs.writeFileSync(__dirname+'/samples/'+name,await d.save())}})();
