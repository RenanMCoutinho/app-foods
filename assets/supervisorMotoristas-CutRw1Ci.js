import{a as b,j as u,q as p,h as v,e as d,w as c,i as h,u as f,d as g}from"./firebase-DXeuB9Ti.js";/* empty css              */import{i as k}from"./auth-guard-ahADkYB_.js";let m=[];async function y(){const s=b.currentUser;if(!s)return;S();try{m=(await u(p(v(d,"empresas"),c("supervisorId","==",s.uid)))).docs.map(t=>({id:t.id,...t.data()}))}catch(a){console.error("Erro ao carregar empresas",a)}const n=document.querySelector("#lista-motoristas");try{const a=await u(p(v(d,"usuarios"),c("role","==","motorista"),c("supervisorId","==",s.uid)));if(a.empty){n.innerHTML='<div class="col-span-3 text-center p-10 text-slate-400">Nenhum motorista atribuído a você ainda.</div>';return}n.innerHTML=a.docs.map(t=>{const e=t.data();e.id=t.id;const r=e.empresasIds?.length||0;return`<div class="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative group">
                <div class="flex items-center gap-4 mb-4">
                    <div class="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span class="material-symbols-outlined text-primary text-2xl">person</span>
                    </div>
                    <div>
                        <p class="font-black">${e.nome||"—"}</p>
                        <p class="text-sm text-slate-500">${e.email||""}</p>
                    </div>
                </div>
                <div class="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <p class="text-xs text-slate-500"><strong class="text-slate-700 dark:text-slate-300">${r}</strong> empresa(s) vinculada(s)</p>
                    <button onclick="abrirModalVincular('${e.id}', '${e.nome}', '${(e.empresasIds||[]).join(",")}')" 
                        class="flex items-center gap-1 text-xs text-primary font-bold hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors">
                        <span class="material-symbols-outlined text-sm">link</span> Vincular
                    </button>
                </div>
            </div>`}).join("")}catch(a){n.innerHTML=`<div class="col-span-3 text-center p-10 text-red-400">Erro: ${a.message}</div>`}L()}function L(){const s=document.querySelector("#modal-vincular"),n=document.querySelector("#btn-fechar-modal"),a=document.querySelector("#btn-salvar-vinculo");n?.addEventListener("click",()=>{s.classList.add("hidden")}),s?.addEventListener("click",t=>{t.target===s&&s.classList.add("hidden")}),a?.addEventListener("click",async()=>{const t=document.querySelector("#modal-motorista-id").value,e=document.querySelector("#btn-salvar-vinculo"),r=document.querySelectorAll(".check-empresa:checked"),i=Array.from(r).map(o=>o.value);e.disabled=!0,e.innerHTML='<span class="material-symbols-outlined animate-spin">progress_activity</span> Salvando...';try{await f(g(d,"usuarios",t),{empresasIds:i}),s.classList.add("hidden"),y()}catch(o){alert("Erro ao salvar vínculos: "+o.message)}finally{e.disabled=!1,e.innerHTML='<span class="material-symbols-outlined">save</span> Salvar Vínculos'}}),window.abrirModalVincular=(t,e,r)=>{const i=r?r.split(","):[];document.querySelector("#nome-motorista-modal").textContent=e,document.querySelector("#modal-motorista-id").value=t;const o=document.querySelector("#lista-empresas-checkbox");m.length===0?o.innerHTML='<p class="text-sm text-slate-500 italic">Você ainda não tem empresas cadastradas.</p>':o.innerHTML=m.map(l=>{const x=i.includes(l.id)?"checked":"";return`
                <label class="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                    <input type="checkbox" value="${l.id}" class="check-empresa w-5 h-5 text-primary border-slate-300 rounded focus:ring-primary" ${x}>
                    <span class="font-medium text-slate-800 dark:text-slate-200 text-sm">${l.nome}</span>
                </label>
                `}).join(""),s.classList.remove("hidden")}}function S(){document.querySelector(".logout-btn")?.addEventListener("click",async()=>{confirm("Deseja sair?")&&(await h(b),window.location.href="/app-foods/pages/login.html")})}k(["supervisor"],()=>y());
