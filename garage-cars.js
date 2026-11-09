(()=> {
const designs=[
["Lambo V12","#f02f42","#ffd9df","wedge"],["Bugatti Royale","#1675d5","#b8e8ff","lux"],["Ferrari Rosso","#e83c32","#fff0d8","sport"],["McLaren Aero","#f3aa24","#fff2b7","classic"],["Porsche GT","#12a86b","#b7ffe0","wide"],["Dodge Viper","#30394e","#a8b8d5","stealth"],["Koenigsegg X","#a34ce0","#f0caff","neon"],["Pagani Phantom","#d9e4ee","#80c7ed","future"]
];
function svg(name,body,glass,style,i){
 const stripe=i%2?'<path d="M60 8h8v42h-8z M60 78h8v42h-8z" fill="'+glass+'"/>':'';
 const fin=style==="future"?'<path d="M28 26L8 13v23l20 8 M100 26l20-13v23l-20 8" fill="'+body+'" stroke="#101827" stroke-width="3"/>':'';
 const d='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><ellipse cx="64" cy="68" rx="48" ry="58" fill="#050914" opacity=".35"/><g fill="#080e19"><rect x="10" y="23" width="14" height="30" rx="5"/><rect x="104" y="23" width="14" height="30" rx="5"/><rect x="10" y="78" width="14" height="30" rx="5"/><rect x="104" y="78" width="14" height="30" rx="5"/></g>'+fin+'<path d="M40 4Q64 -2 88 4L108 26 112 95Q105 121 64 125Q23 121 16 95L20 26Z" fill="'+body+'" stroke="#111827" stroke-width="5"/><path d="M34 19Q64 9 94 19L100 43Q64 52 28 43Z" fill="'+glass+'" stroke="#d9e9f5" stroke-width="2"/><path d="M27 51Q64 42 101 51L96 73Q64 84 32 73Z" fill="#17283d" stroke="#a5c7d9" stroke-width="3"/><path d="M30 83Q64 94 98 83L91 109Q64 119 37 109Z" fill="'+body+'" stroke="#111827" stroke-width="3"/>'+stripe+'<path d="M25 100l20 7-5 10-18-6 M103 100l-20 7 5 10 18-6" fill="#ffefc5"/><path d="M34 12l11-6 7 7-13 10 M94 12L83 6l-7 7 13 10" fill="#fff" opacity=".8"/></svg>';
 return "data:image/svg+xml;charset=UTF-8,"+encodeURIComponent(d);
}
window.GAMEZAAR_GARAGE_CARS=designs.map((d,i)=>({name:d[0],src:svg(d[0],d[1],d[2],d[3],i)}));
})();