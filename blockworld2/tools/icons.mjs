import {chromium} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']});
try {const page=await browser.newPage();const svg=(await readFile('public/icon.svg')).toString('base64');for(const size of [180,192,512]){const data=await page.evaluate(async({svg,size})=>{const image=new Image();image.src='data:image/svg+xml;base64,'+svg;await image.decode();const c=document.createElement('canvas');c.width=c.height=size;const ctx=c.getContext('2d');ctx.fillStyle='#244f4b';ctx.fillRect(0,0,size,size);ctx.drawImage(image,0,0,size,size);return c.toDataURL('image/png').split(',')[1];},{svg,size});await writeFile(`public/icon-${size}.png`,Buffer.from(data,'base64'));}}finally{await browser.close();}
