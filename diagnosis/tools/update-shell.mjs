import fs from 'node:fs';
import {siteHeader,siteFooter} from '../site-shell.mjs';
for(const [file,base] of [['../index.html','./'],['../admin/index.html','../']]){
 const url=new URL(file,import.meta.url);let html=fs.readFileSync(url,'utf8');
 for(const [kind,content] of [['header',siteHeader(base)],['footer',siteFooter(base)]]){
  const pattern=new RegExp(`<!-- site-${kind}:start -->[\\s\\S]*?<!-- site-${kind}:end -->`);
  if(!pattern.test(html))throw Error(`${file}: ${kind} placeholder missing`);
  html=html.replace(pattern,`<!-- site-${kind}:start -->${content}<!-- site-${kind}:end -->`);
 }
 fs.writeFileSync(url,html);
}
