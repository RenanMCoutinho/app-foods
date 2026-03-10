import{l as b,d as w,e as c,a as p,i as S,q as f,h as m,w as u,j as v,k as E,g as $,f as L}from"./firebase-DYe-l1fb.js";/* empty css              */import{i as T}from"./auth-guard-DQKtXjXC.js";let d=[],n=[];async function D(){const t=p.currentUser;if(!t)return;const r=new Date,o=document.querySelector("#data-hoje");o&&(o.textContent=r.toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long"})),document.querySelector(".logout-btn")?.addEventListener("click",async()=>{confirm("Deseja sair?")&&(await S(p),window.location.href="/app-foods/index.html")}),await j(),await H(t.uid),document.querySelector("#select-empresa")?.addEventListener("change",s=>{const e=s.target.value;q(e)})}async function j(){const t=document.querySelector("#select-empresa"),r=window.currentUserData?.matrizesVinculadas||[],o=window.currentUserData?.supervisorId||null;if(r.length===0&&o&&r.push(o),t&&(t.innerHTML='<option value="" disabled selected>Escolha uma empresa</option>'),r.length===0){t&&(t.innerHTML='<option value="" disabled selected>Nenhuma matriz vinculada a você</option>');return}try{let s=[];const e=[];for(let a=0;a<r.length;a+=10)e.push(r.slice(a,a+10));for(const a of e){const i=f(m(c,"empresas"),u("supervisorId","in",a)),l=await v(i);s.push(...l.docs)}if(d=s.map(a=>({id:a.id,...a.data()})),d.sort((a,i)=>(a.nome||"").localeCompare(i.nome||"")),!t)return;d.length===0?t.innerHTML='<option value="" disabled selected>Nenhuma empresa disponível</option>':(t.innerHTML='<option value="" disabled selected>Escolha uma empresa</option>',d.forEach(a=>{t.innerHTML+=`<option value="${a.id}">${a.nome}</option>`}))}catch(s){console.error("Erro ao carregar empresas",s)}}function q(t){const r=document.querySelector("#card-tipos"),o=document.querySelector("#lista-tipos");if(!t){r.classList.add("hidden");return}const s=d.find(e=>e.id===t);if(!s||!s.tipos?.length){o.innerHTML='<p class="text-sm text-slate-400 italic">Esta empresa não tem tipos de entrega cadastrados.</p>',r.classList.remove("hidden");return}o.innerHTML=s.tipos.map((e,a)=>`
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
    `).join(""),o.querySelectorAll(".btn-add-entrega").forEach(e=>{e.addEventListener("click",()=>k(e.dataset))}),r.classList.remove("hidden")}async function k({empresaId:t,empresaNome:r,tipoNome:o,valor:s}){const e=p.currentUser;if(!e)return;const a=document.querySelector(`.btn-add-entrega[data-tipo-nome="${o}"][data-empresa-id="${t}"]`);a&&(a.disabled=!0,a.classList.add("opacity-50"));try{const l=new Date().toISOString().split("T")[0],h=d.find(y=>y.id===t)?.supervisorId||window.currentUserData?.supervisorId||"",x=await $(m(c,"entregas"),{motoristaId:e.uid,supervisorId:h,empresaId:t,empresaNome:r,tipoNome:o,valor:parseFloat(s),data:l,status:"concluida",createdAt:L()});n.push({id:x.id,empresaNome:r,tipoNome:o,valor:parseFloat(s),data:l}),g()}catch(i){alert("Erro ao registrar entrega: "+i.message)}finally{a&&(a.disabled=!1,a.classList.remove("opacity-50"))}}async function H(t){const o=new Date().toISOString().split("T")[0];try{n=(await v(f(m(c,"entregas"),u("motoristaId","==",t),u("data","==",o),E("createdAt","desc")))).docs.map(e=>({id:e.id,...e.data()})),g()}catch(s){console.error("Erro ao carregar entregas do dia",s)}}function g(){const t=document.querySelector("#lista-entregas-dia"),r=document.querySelector("#contagem-dia"),o=document.querySelector("#total-dia"),s=n.reduce((e,a)=>e+(a.valor||0),0);if(o&&(o.textContent=`R$ ${s.toFixed(2).replace(".",",")}`),r&&(r.textContent=n.length),!n.length){t.innerHTML=`<div class="p-8 text-center">
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
    `).join("")}window.removerEntrega=async t=>{confirm("Remover esta entrega do dia?")&&(await b(w(c,"entregas",t)),n=n.filter(r=>r.id!==t),g())};T(["motorista"],()=>D());
