import{a as h,i as M,j as R,q as F,h as N,e as T,w as b,k as y}from"./firebase-DYe-l1fb.js";/* empty css              */import{i as B}from"./auth-guard-DQKtXjXC.js";let s,e;async function G(){const a=h.currentUser;if(!a)return;const r=document.querySelector("#welcome-message");r&&(r.textContent=`Olá, ${window.currentUserData?.nome||a.email.split("@")[0]}!`),document.querySelector(".logout-btn")?.addEventListener("click",async()=>{confirm("Deseja sair?")&&(await M(h),window.location.href="/app-foods/index.html")});const i=new Date;s=i.getFullYear(),e=i.getMonth(),document.querySelector("#btn-mes-anterior")?.addEventListener("click",()=>{e===0?(e=11,s--):e--,f(a.uid)}),document.querySelector("#btn-mes-proximo")?.addEventListener("click",()=>{e===11?(e=0,s++):e++,f(a.uid)}),f(a.uid)}async function f(a){const r=document.querySelector("#mes-label"),i=new Date(s,e,1);r&&(r.textContent=i.toLocaleDateString("pt-BR",{month:"long",year:"numeric"}));const g=`${s}-${String(e+1).padStart(2,"0")}-01`,w=new Date(s,e+1,0).getDate(),S=`${s}-${String(e+1).padStart(2,"0")}-${String(w).padStart(2,"0")}`,c=document.querySelector("#kpi-total"),d=document.querySelector("#kpi-ganhos"),l=document.querySelector("#kpi-dias"),u=document.querySelector("#historico-mes");c&&(c.textContent="..."),d&&(d.textContent="..."),l&&(l.textContent="...");try{const o=(await R(F(N(T,"entregas"),b("motoristaId","==",a),b("data",">=",g),b("data","<=",S),y("data","desc"),y("createdAt","desc")))).docs.map(t=>({id:t.id,...t.data()})),k=o.reduce((t,p)=>t+(p.valor||0),0),v=new Set(o.map(t=>t.data)).size;if(c&&(c.textContent=o.length),d&&(d.textContent=`R$ ${k.toFixed(2).replace(".",",")}`),l&&(l.textContent=v),!o.length){u.innerHTML=`<div class="p-8 text-center">
                <span class="material-symbols-outlined text-4xl text-slate-200">bar_chart</span>
                <p class="text-sm text-slate-400 mt-2">Sem entregas neste mês.</p>
            </div>`;return}const m={};o.forEach(t=>{m[t.data]||(m[t.data]=[]),m[t.data].push(t)}),u.innerHTML=Object.entries(m).map(([t,p])=>{const $=p.reduce((n,E)=>n+(E.valor||0),0),[D,q,L]=t.split("-"),C=new Date(Number(D),Number(q)-1,Number(L)).toLocaleDateString("pt-BR",{weekday:"short",day:"2-digit",month:"short"}),j=p.map(n=>`
                <div class="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <div>
                        <p class="text-sm font-semibold">${n.tipoNome||"—"}</p>
                        <p class="text-xs text-slate-400">${n.empresaNome||"—"}</p>
                    </div>
                    <span class="font-bold text-primary text-sm">R$ ${(n.valor||0).toFixed(2).replace(".",",")}</span>
                </div>
            `).join("");return`<div class="border-b border-slate-100 dark:border-slate-800 last:border-0">
                <div class="flex items-center justify-between px-5 py-3 bg-slate-50 dark:bg-slate-800/50">
                    <span class="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">${C}</span>
                    <span class="text-xs font-black text-primary">R$ ${$.toFixed(2).replace(".",",")}</span>
                </div>
                ${j}
            </div>`}).join("")}catch(x){console.error("Erro ao carregar mês:",x),u.innerHTML=`<div class="p-8 text-center text-red-400 text-sm">Erro: ${x.message}</div>`}}B(["motorista"],()=>G());
