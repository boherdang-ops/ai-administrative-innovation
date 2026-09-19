const menu=document.querySelector('#menu'),header=document.querySelector('header');
menu?.addEventListener('click',()=>header.classList.toggle('nav-open'));
document.querySelectorAll('nav a').forEach(a=>a.addEventListener('click',()=>header.classList.remove('nav-open')));
const sections=[...document.querySelectorAll('main section[id]')];
const links=[...document.querySelectorAll('nav a')];
const io=new IntersectionObserver(entries=>entries.forEach(e=>{
 if(e.isIntersecting){links.forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+e.target.id))}
}),{rootMargin:'-30% 0px -60% 0px',threshold:0});
sections.forEach(s=>io.observe(s));
