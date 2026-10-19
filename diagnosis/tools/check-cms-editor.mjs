import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import {webcrypto} from 'node:crypto';
import * as model from '../cms-content.mjs';import * as catalog from '../data/copy-catalog.mjs';
const elements=new Map(),events={};
function element(id){if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',value:'',dataset:{},addEventListener(){},replaceChildren(){this.innerHTML='';},close(){},showModal(){},contentWindow:{postMessage(){} }});return elements.get(id);}
let draft={content:structuredClone(model.DEFAULT_CONTENT),version:1},published={version:1};const calls=[];
const api={restoreAuth:async()=>true,readState:async()=>({draft:structuredClone(draft),published}),revisions:async()=>[],saveDraft:async(payload,expected)=>{assert.equal(expected,draft.version);draft={content:payload,version:draft.version+1};calls.push('save');return {version:draft.version};},publish:async(d,p)=>{assert.equal(d,draft.version);assert.equal(p,published.version);calls.push('publish');return {version:++published.version};},logout:async()=>{},login:async()=>true};
const context=vm.createContext({document:{querySelector:element,addEventListener:(type,fn)=>(events[type]??=[]).push(fn)},window:{addEventListener(){}},crypto:webcrypto,structuredClone,console,confirm:()=>true,setTimeout,clearTimeout,Date,location:{origin:'https://example.org'}});
const modules={'./api.mjs':api,'../cms-content.mjs?v=cms3':model,'../data/copy-catalog.mjs?v=cms3':catalog};
const module=new vm.SourceTextModule(fs.readFileSync('diagnosis/admin/cms.mjs','utf8'),{context});
await module.link(async name=>{const data=modules[name];return new vm.SyntheticModule(Object.keys(data),function(){for(const [k,v]of Object.entries(data))this.setExport(k,v);},{context});});await module.evaluate();
async function click(dataset={},id=''){for(const fn of events.click)fn({target:{closest:()=>({dataset,id})}});await new Promise(setImmediate);}
for(const section of ['site','intro','personal','organization','courses','domains','advice','copy','links','history']){await click({section});assert.notEqual(element('#editor').innerHTML,'');assert.notEqual(element('#message').className,'error');}
await click({section:'personal'});assert.match(element('#editor').innerHTML,/P01/);assert.match(element('#editor').innerHTML,/선택지 문구/);
for(const fn of events.input)fn({target:{dataset:{path:JSON.stringify(['definition','personal',0,'text'])},value:'CMS에서 수정한 질문'}});
assert.equal(element('#publish').disabled,true);await click({},'save');assert.equal(draft.content.definition.personal[0].text,'CMS에서 수정한 질문');assert.equal(element('#publish').disabled,false);await click({},'publish');assert.deepEqual(calls,['save','publish']);
await click({},'logout');assert.equal(element('#workspace').hidden,true);assert.equal(element('#editor').innerHTML,'');console.log('CMS editor: 10 sections, edit→save→publish, logout cleanup passed (mock API, no production writes).');
