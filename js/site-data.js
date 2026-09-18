(function(){
  const KEY='labPortfolioCMS';
  const isPreview=location.search.includes('edit=1')||location.search.includes('preview=1');
  const DRAFT='labPortfolioCMSDraft', PUBLISHED='labPortfolioCMSPublished';
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const attr=s=>esc(s).replace(/javascript:/gi,'');
  async function getData(){
    if(!isPreview && window.CMS_CLOUD?.ready()){try{const row=await window.CMS_CLOUD.getState();if(row?.published_data && Object.keys(row.published_data).length){localStorage.setItem(PUBLISHED,JSON.stringify(row.published_data));localStorage.setItem(KEY,JSON.stringify(row.published_data));return row.published_data}}catch(e){console.warn('Cloud CMS read failed; falling back to local/default.',e)}}
    try{const saved=localStorage.getItem(isPreview?DRAFT:PUBLISHED) || (!isPreview&&localStorage.getItem(KEY));if(saved)return JSON.parse(saved)}catch(e){}
    try{return await (await fetch('data/site-default.json',{cache:'no-store'})).json()}catch(e){return null}
  }
  function setText(sel,v){const el=document.querySelector(sel);if(el&&v!==undefined)el.textContent=v??''}
  function render(d){if(!d)return;
    setText('#s1-name',d.profile?.name);setText('#s1-anchor .u',d.profile?.anchor);setText('#s1-claim',d.profile?.claim);
    const title=document.querySelector('#s1-title');if(title&&d.profile?.title){const pill=title.querySelector('.pill');title.textContent=d.profile.title+' · ';if(pill)title.appendChild(pill)}
    const car=document.querySelector('#s1-career ul');if(car&&d.profile?.career)car.innerHTML=d.profile.career.map(x=>'<li>'+esc(x)+'</li>').join('');
    const portrait=document.querySelector('#s1-portrait');if(portrait&&d.profile?.portrait){portrait.innerHTML='<img src="'+attr(d.profile.portrait)+'" alt="'+esc(d.profile.name||'인물 사진')+'" style="width:100%;height:100%;object-fit:cover;border-radius:inherit">'}
    if(d.metrics){const ns=document.querySelectorAll('#s3-numbers .n');[d.metrics.institutions,d.metrics.hours,d.metrics.learners].forEach((v,i)=>{if(ns[i])ns[i].textContent=v||'—'});}
    const cards=document.querySelectorAll('#s2-grid>li');(d.assets||[]).slice(0,4).forEach((a,i)=>{const card=cards[i];if(!card)return;const ph=card.querySelector('.shot');if(ph&&a.image){ph.innerHTML='<img src="'+attr(a.image)+'" alt="'+esc(a.title||'')+'" style="width:100%;height:100%;object-fit:cover;border-radius:inherit">'}const t=card.querySelector('.t'),dd=card.querySelector('.d');if(t)t.textContent=a.title||'';if(dd)dd.textContent=a.desc||''});
    const rows=document.querySelectorAll('#s4-table tbody tr');(d.courses||[]).slice(0,5).forEach((c,i)=>{const td=rows[i]?.querySelectorAll('td');if(td){td[0].textContent=c.name||'';td[1].textContent=c.target||'';td[2].textContent=c.hours||'';td[3].textContent=c.content||''}});
    const ladder=document.querySelectorAll('#s5-ladder .t');(d.kaim||[]).slice(0,5).forEach((v,i)=>{if(ladder[i])ladder[i].textContent=v});
    if(d.diagnosis){const a=document.querySelector('#s6-cta .btn-main');if(a){a.textContent=d.diagnosis.button||'예비진단 시작하기';if(d.diagnosis.url){a.href=attr(d.diagnosis.url);a.removeAttribute('data-pending')}}}
    if(d.book){setText('#s7-book .bt',d.book.title);const bs=document.querySelector('#s7-book .bs');if(bs)bs.textContent=d.book.intro||'한 줄 소개';const bm=document.querySelector('#s7-book .bm');if(bm)bm.innerHTML='출판사 '+esc(d.book.publisher||'【채움】')+' · '+esc(d.book.year||'【발행연도】')+'<br>후속작 「휴먼 프리미엄」 집필 중';const cover=document.querySelector('#s7-book .cover .ph');if(cover&&d.book.image)cover.innerHTML='<img src="'+attr(d.book.image)+'" alt="'+esc(d.book.title||'도서 표지')+'" style="width:100%;height:100%;object-fit:cover;border-radius:inherit">'}
    if(d.contact){document.querySelectorAll('a[href^="tel:"]').forEach(a=>{a.href='tel:'+attr(d.contact.phone);a.textContent=d.contact.phone});document.querySelectorAll('a[href^="mailto:"]').forEach(a=>{a.href='mailto:'+attr(d.contact.email);a.textContent=d.contact.email});const site=document.querySelector('#s8-info .site a');if(site&&d.contact.site){site.href=attr(d.contact.site);site.textContent=d.contact.site.replace(/^https?:\/\//,'')}}
    if(d.channels){const items=document.querySelectorAll('#s7-channels li');if(items[0]){const el=items[0].querySelector('.cn');if(d.channels.youtube)el.innerHTML='<a class="lk" href="'+attr(d.channels.youtube)+'">유튜브 — 해피브레인</a>'}if(items[1]){const el=items[1].querySelector('.cn');if(d.channels.blog)el.innerHTML='<a class="lk" href="'+attr(d.channels.blog)+'">블로그 — 해피브레인의 AI행정 노트</a>'}if(items[2]&&d.channels.library){items[2].querySelector('.cn').innerHTML='<a class="lk" href="'+attr(d.channels.library)+'">학습 자료실</a>';items[2].querySelector('.cd').innerHTML='공직자용 학습 자료'}}
  }
  getData().then(render);
})();
