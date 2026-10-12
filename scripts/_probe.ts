import { chromium } from 'playwright';
(async()=>{
  const br=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  const p=await br.newPage({viewport:{width:900,height:1100}});
  const errs:string[]=[];
  p.on('pageerror',e=>errs.push(e.message));
  await p.goto('http://localhost:3001/ai-image-effects/ai-qr-tree',{waitUntil:'networkidle'});
  await p.waitForSelector('canvas',{timeout:20000}); await p.waitForTimeout(3000);
  const t0=Date.now();
  await p.getByRole('button',{name:'Tap to see QR code',exact:true}).click();
  const samples:string[]=[];
  for(let i=0;i<26;i++){
    const v=await p.evaluate(()=> (window as any).__qrScan);
    samples.push(`${Date.now()-t0}ms=${typeof v==='number'?v.toFixed(3):String(v)}`);
    await p.waitForTimeout(120);
  }
  console.log(samples.join('  '));
  console.log('PAGEERRORS:', errs.length?errs.slice(0,3).join(' | '):'none');
  await br.close();
})().catch(e=>{console.error(e);process.exit(1);});
