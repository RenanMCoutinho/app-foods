import{l as x,d as y,e as i,a as l,i as b,q as f,h as c,w as p,j as v,k as w,g as E,f as S}from"./firebase-DXeuB9Ti.js";/* empty css              */import{i as $}from"./auth-guard-ahADkYB_.js";let d=[],n=[];async function L(){const t=l.currentUser;if(!t)return;const a=new Date,o=document.querySelector("#data-hoje");o&&(o.textContent=a.toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long"})),document.querySelector(".logout-btn")?.addEventListener("click",async()=>{confirm("Deseja sair?")&&(await b(l),window.location.href="/app-foods/pages/login.html")});const r=window.currentUserData?.supervisorId;await T(r),await D(t.uid),document.querySelector("#select-empresa")?.addEventListener("change",e=>{const s=e.target.value;j(s)})}async function T(t){const a=document.querySelector("#select-empresa"),o=window.currentUserData?.empresasIds||[];if(a.innerHTML='<option value="" disabled selected>Escolha uma empresa</option>',o.length===0){a.innerHTML='<option value="" disabled selected>Nenhuma empresa vinculada</option>';return}try{const r=t?f(c(i,"empresas"),p("supervisorId","==",t)):c(i,"empresas");d=(await v(r)).docs.map(s=>({id:s.id,...s.data()})).filter(s=>o.includes(s.id)),d.length===0?a.innerHTML='<option value="" disabled selected>Nenhuma empresa vinculada</option>':d.forEach(s=>{a.innerHTML+=`<option value="${s.id}">${s.nome}</option>`})}catch(r){console.error("Erro ao carregar empresas",r)}}function j(t){const a=document.querySelector("#card-tipos"),o=document.querySelector("#lista-tipos");if(!t){a.classList.add("hidden");return}const r=d.find(e=>e.id===t);if(!r||!r.tipos?.length){o.innerHTML='<p class="text-sm text-slate-400 italic">Esta empresa não tem tipos de entrega cadastrados.</p>',a.classList.remove("hidden");return}o.innerHTML=r.tipos.map((e,s)=>`
        <button class="btn-add-entrega w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 hover:bg-primary/10 hover:border-primary/30 border border-slate-200 dark:border-slate-700 rounded-xl transition-all group"
            data-empresa-id="${r.id}" data-empresa-nome="${r.nome}" data-tipo-nome="${e.nome}" data-valor="${e.valor}">
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
    `).join(""),o.querySelectorAll(".btn-add-entrega").forEach(e=>{e.addEventListener("click",()=>q(e.dataset))}),a.classList.remove("hidden")}async function q({empresaId:t,empresaNome:a,tipoNome:o,valor:r}){const e=l.currentUser;if(!e)return;const s=document.querySelector(`.btn-add-entrega[data-tipo-nome="${o}"][data-empresa-id="${t}"]`);s&&(s.disabled=!0,s.classList.add("opacity-50"));try{const g=new Date().toISOString().split("T")[0],h=await E(c(i,"entregas"),{motoristaId:e.uid,supervisorId:window.currentUserData?.supervisorId||"",empresaId:t,empresaNome:a,tipoNome:o,valor:parseFloat(r),data:g,status:"concluida",createdAt:S()});n.push({id:h.id,empresaNome:a,tipoNome:o,valor:parseFloat(r),data:g}),m()}catch(u){alert("Erro ao registrar entrega: "+u.message)}finally{s&&(s.disabled=!1,s.classList.remove("opacity-50"))}}async function D(t){const o=new Date().toISOString().split("T")[0];try{n=(await v(f(c(i,"entregas"),p("motoristaId","==",t),p("data","==",o),w("createdAt","desc")))).docs.map(e=>({id:e.id,...e.data()})),m()}catch(r){console.error("Erro ao carregar entregas do dia",r)}}function m(){const t=document.querySelector("#lista-entregas-dia"),a=document.querySelector("#contagem-dia"),o=document.querySelector("#total-dia"),r=n.reduce((e,s)=>e+(s.valor||0),0);if(o&&(o.textContent=`R$ ${r.toFixed(2).replace(".",",")}`),a&&(a.textContent=n.length),!n.length){t.innerHTML=`<div class="p-8 text-center">
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
    `).join("")}window.removerEntrega=async t=>{confirm("Remover esta entrega do dia?")&&(await x(y(i,"entregas",t)),n=n.filter(a=>a.id!==t),m())};$(["motorista"],()=>L());
