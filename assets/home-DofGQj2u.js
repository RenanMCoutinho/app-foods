import{l as y,d as h,e as i,a as c,i as b,q as f,h as d,w as l,j as v,k as w,g as S,f as $}from"./firebase-DXeuB9Ti.js";/* empty css              */import{i as E}from"./auth-guard-ahADkYB_.js";let p=[],n=[];async function j(){const t=c.currentUser;if(!t)return;const r=new Date,a=document.querySelector("#data-hoje");a&&(a.textContent=r.toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long"})),document.querySelector(".logout-btn")?.addEventListener("click",async()=>{confirm("Deseja sair?")&&(await b(c),window.location.href="/app-foods/pages/login.html")});const s=window.currentUserData?.supervisorId;await q(s),await T(t.uid),document.querySelector("#select-empresa")?.addEventListener("change",e=>{const o=e.target.value;D(o)})}async function q(t){const r=document.querySelector("#select-empresa");try{const a=t?f(d(i,"empresas"),l("supervisorId","==",t)):d(i,"empresas");p=(await v(a)).docs.map(e=>({id:e.id,...e.data()})),p.forEach(e=>{r.innerHTML+=`<option value="${e.id}">${e.nome}</option>`})}catch(a){console.error("Erro ao carregar empresas",a)}}function D(t){const r=document.querySelector("#card-tipos"),a=document.querySelector("#lista-tipos");if(!t){r.classList.add("hidden");return}const s=p.find(e=>e.id===t);if(!s||!s.tipos?.length){a.innerHTML='<p class="text-sm text-slate-400 italic">Esta empresa não tem tipos de entrega cadastrados.</p>',r.classList.remove("hidden");return}a.innerHTML=s.tipos.map((e,o)=>`
        <button class="btn-add-entrega w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 hover:bg-primary/10 hover:border-primary/30 border border-slate-200 dark:border-slate-700 rounded-xl transition-all group"
            data-empresa-id="${s.id}" data-empresa-nome="${s.nome}" data-tipo-nome="${e.nome}" data-valor="${e.valor}">
            <div class="text-left">
                <p class="font-bold text-sm group-hover:text-primary">${e.nome}</p>
                <p class="text-xs text-slate-500">Toque para registrar</p>
            </div>
            <div class="flex items-center gap-2">
                <span class="font-black text-primary text-base">R$ ${(e.valor||0).toFixed(2).replace(".",",")}</span>
                <div class="h-8 w-8 rounded-full bg-primary/10 group-hover:bg-primary flex items-center justify-center transition-all">
                    <span class="material-symbols-outlined text-primary group-hover:text-white text-lg">add</span>
                </div>
            </div>
        </button>
    `).join(""),a.querySelectorAll(".btn-add-entrega").forEach(e=>{e.addEventListener("click",()=>L(e.dataset))}),r.classList.remove("hidden")}async function L({empresaId:t,empresaNome:r,tipoNome:a,valor:s}){const e=c.currentUser;if(!e)return;const o=document.querySelector(`.btn-add-entrega[data-tipo-nome="${a}"][data-empresa-id="${t}"]`);o&&(o.disabled=!0,o.classList.add("opacity-50"));try{const g=new Date().toISOString().split("T")[0],x=await S(d(i,"entregas"),{motoristaId:e.uid,supervisorId:window.currentUserData?.supervisorId||"",empresaId:t,empresaNome:r,tipoNome:a,valor:parseFloat(s),data:g,status:"concluida",createdAt:$()});n.push({id:x.id,empresaNome:r,tipoNome:a,valor:parseFloat(s),data:g}),m()}catch(u){alert("Erro ao registrar entrega: "+u.message)}finally{o&&(o.disabled=!1,o.classList.remove("opacity-50"))}}async function T(t){const a=new Date().toISOString().split("T")[0];try{n=(await v(f(d(i,"entregas"),l("motoristaId","==",t),l("data","==",a),w("createdAt","desc")))).docs.map(e=>({id:e.id,...e.data()})),m()}catch(s){console.error("Erro ao carregar entregas do dia",s)}}function m(){const t=document.querySelector("#lista-entregas-dia"),r=document.querySelector("#contagem-dia"),a=document.querySelector("#total-dia"),s=n.reduce((e,o)=>e+(o.valor||0),0);if(a&&(a.textContent=`R$ ${s.toFixed(2).replace(".",",")}`),r&&(r.textContent=n.length),!n.length){t.innerHTML=`<div class="p-8 text-center">
            <span class="material-symbols-outlined text-4xl text-slate-200 dark:text-slate-700">inbox</span>
            <p class="text-sm text-slate-400 mt-2">Nenhuma entrega registrada hoje.<br>Selecione uma empresa e adicione!</p>
        </div>`;return}t.innerHTML=n.map(e=>`
        <div class="flex items-center justify-between px-5 py-4" id="entrega-item-${e.id}">
            <div>
                <p class="font-bold text-sm">${e.tipoNome}</p>
                <p class="text-xs text-slate-500">${e.empresaNome}</p>
            </div>
            <div class="flex items-center gap-3">
                <span class="font-black text-primary">R$ ${(e.valor||0).toFixed(2).replace(".",",")}</span>
                <button onclick="removerEntrega('${e.id}')" class="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <span class="material-symbols-outlined text-base">remove_circle</span>
                </button>
            </div>
        </div>
    `).join("")}window.removerEntrega=async t=>{confirm("Remover esta entrega do dia?")&&(await y(h(i,"entregas",t)),n=n.filter(r=>r.id!==t),m())};E(["motorista"],()=>j());
