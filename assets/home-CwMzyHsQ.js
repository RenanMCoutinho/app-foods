import{l as S,d as E,e as u,a as m,i as $,q as h,h as f,w as g,j as x,k as L,g as T,f as D}from"./firebase-DYe-l1fb.js";/* empty css              */import{i as j}from"./auth-guard-DQKtXjXC.js";import{e as p,a as q,b as l}from"./sanitize-3BjVhz3i.js";let c=[],n=[];async function k(){const t=m.currentUser;if(!t)return;const r=new Date,o=document.querySelector("#data-hoje");o&&(o.textContent=r.toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long"})),document.querySelector(".logout-btn")?.addEventListener("click",async()=>{confirm("Deseja sair?")&&(await $(m),window.location.href="/app-foods/index.html")}),await H(),await R(t.uid),document.querySelector("#select-empresa")?.addEventListener("change",s=>{const e=s.target.value;M(e)})}async function H(){const t=document.querySelector("#select-empresa"),r=window.currentUserData?.matrizesVinculadas||[],o=window.currentUserData?.supervisorId||null;if(r.length===0&&o&&r.push(o),t&&(t.innerHTML='<option value="" disabled selected>Escolha uma empresa</option>'),r.length===0){t&&(t.innerHTML='<option value="" disabled selected>Nenhuma matriz vinculada a você</option>');return}try{let s=[];const e=[];for(let a=0;a<r.length;a+=10)e.push(r.slice(a,a+10));for(const a of e){const i=h(f(u,"empresas"),g("supervisorId","in",a)),d=await x(i);s.push(...d.docs)}if(c=s.map(a=>({id:a.id,...a.data()})),c.sort((a,i)=>(a.nome||"").localeCompare(i.nome||"")),!t)return;c.length===0?t.innerHTML='<option value="" disabled selected>Nenhuma empresa disponível</option>':(t.innerHTML='<option value="" disabled selected>Escolha uma empresa</option>',c.forEach(a=>{t.innerHTML+=`<option value="${l(a.id)}">${p(a.nome)}</option>`}))}catch(s){console.error("Erro ao carregar empresas",s)}}function M(t){const r=document.querySelector("#card-tipos"),o=document.querySelector("#lista-tipos");if(!t){r.classList.add("hidden");return}const s=c.find(e=>e.id===t);if(!s||!s.tipos?.length){o.innerHTML='<p class="text-sm text-slate-400 italic">Esta empresa não tem tipos de entrega cadastrados.</p>',r.classList.remove("hidden");return}o.innerHTML=s.tipos.map((e,a)=>`
        <button class="btn-add-entrega w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 hover:bg-primary/10 hover:border-primary/30 border border-slate-200 dark:border-slate-700 rounded-xl transition-all group"
            data-empresa-id="${l(s.id)}" data-empresa-nome="${l(s.nome)}" data-tipo-nome="${l(e.nome)}" data-valor="${e.valor}">
            <div class="text-left">
                <p class="font-bold text-sm group-hover:text-primary">${p(e.nome)}</p>
                <p class="text-xs text-slate-500">Toque para registrar</p>
            </div>
            <div class="flex items-center gap-2">
                <span class="font-black text-primary text-base">R$ ${(e.valor||0).toFixed(2).replace(".",",")}</span>
                <div class="h-8 w-8 rounded-full bg-primary/10 group-hover:bg-primary flex items-center justify-center transition-all">
                    <span class="material-symbols-outlined text-primary group-hover:text-white text-lg">add</span>
                </div>
            </div>
        </button>
    `).join(""),o.querySelectorAll(".btn-add-entrega").forEach(e=>{e.addEventListener("click",()=>I(e.dataset))}),r.classList.remove("hidden")}async function I({empresaId:t,empresaNome:r,tipoNome:o,valor:s}){const e=m.currentUser;if(!e)return;const a=document.querySelector(`.btn-add-entrega[data-tipo-nome="${o}"][data-empresa-id="${t}"]`);a&&(a.disabled=!0,a.classList.add("opacity-50"));try{const d=new Date().toISOString().split("T")[0],y=c.find(w=>w.id===t)?.supervisorId||window.currentUserData?.supervisorId||"",b=await T(f(u,"entregas"),{motoristaId:e.uid,supervisorId:y,empresaId:t,empresaNome:r,tipoNome:o,valor:parseFloat(s),data:d,status:"concluida",createdAt:D()});n.push({id:b.id,empresaNome:r,tipoNome:o,valor:parseFloat(s),data:d}),v()}catch(i){alert("Erro ao registrar entrega: "+i.message)}finally{a&&(a.disabled=!1,a.classList.remove("opacity-50"))}}async function R(t){const o=new Date().toISOString().split("T")[0];try{n=(await x(h(f(u,"entregas"),g("motoristaId","==",t),g("data","==",o),L("createdAt","desc")))).docs.map(e=>({id:e.id,...e.data()})),v()}catch(s){console.error("Erro ao carregar entregas do dia",s)}}function v(){const t=document.querySelector("#lista-entregas-dia"),r=document.querySelector("#contagem-dia"),o=document.querySelector("#total-dia"),s=n.reduce((e,a)=>e+(a.valor||0),0);if(o&&(o.textContent=`R$ ${s.toFixed(2).replace(".",",")}`),r&&(r.textContent=n.length),!n.length){t.innerHTML=`<div class="p-8 text-center">
            <span class="material-symbols-outlined text-4xl text-slate-200 dark:text-slate-700">inbox</span>
            <p class="text-sm text-slate-400 mt-2">Nenhuma entrega registrada hoje.<br>Selecione uma empresa e adicione!</p>
        </div>`;return}t.innerHTML=n.map(e=>`
        <div class="flex items-center justify-between px-5 py-4" id="entrega-item-${e.id}">
            <div>
                <p class="font-bold text-sm">${p(e.tipoNome)}</p>
                <p class="text-xs text-slate-500">${p(e.empresaNome)}</p>
            </div>
            <div class="flex items-center gap-3">
                <span class="font-black text-primary">R$ ${(e.valor||0).toFixed(2).replace(".",",")}</span>
                <button onclick="removerEntrega('${q(e.id)}')" class="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <span class="material-symbols-outlined text-base">remove_circle</span>
                </button>
            </div>
        </div>
    `).join("")}window.removerEntrega=async t=>{confirm("Remover esta entrega do dia?")&&(await S(E(u,"entregas",t)),n=n.filter(r=>r.id!==t),v())};j(["motorista"],()=>k());
