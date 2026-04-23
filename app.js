let bible=[];
let view='read';

fetch('data/kjv.json')
.then(r=>r.json())
.then(d=>{bible=d;render();});

function showTab(v){view=v;render();}

function render(){
let c=document.getElementById('content');
c.innerHTML='';

if(view==='read'){
bible.forEach(v=>{
let d=document.createElement('div');
d.className='verse';
d.innerHTML=`<b>${v.book} ${v.chapter}:${v.verse}</b><br>${v.text}`;
d.onclick=()=>saveFav(v);
c.appendChild(d);
});
}

if(view==='fav'){
let favs=JSON.parse(localStorage.getItem('favs')||'[]');
favs.forEach(v=>{
let d=document.createElement('div');
d.className='verse';
d.innerHTML=`<b>${v.book} ${v.chapter}:${v.verse}</b><br>${v.text}`;
c.appendChild(d);
});
}
}

document.getElementById('search').addEventListener('input',e=>{
let t=e.target.value.toLowerCase();
let filtered=bible.filter(v=>v.text.toLowerCase().includes(t));
let c=document.getElementById('content');
c.innerHTML='';
filtered.forEach(v=>{
let d=document.createElement('div');
d.className='verse';
d.innerHTML=`<b>${v.book} ${v.chapter}:${v.verse}</b><br>${v.text}`;
c.appendChild(d);
});
});

function saveFav(v){
let favs=JSON.parse(localStorage.getItem('favs')||'[]');
favs.push(v);
localStorage.setItem('favs',JSON.stringify(favs));
alert('Salvo nos favoritos ⭐');
}
