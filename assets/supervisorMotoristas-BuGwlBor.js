import{a as i,j as n,q as l,h as d,e as c,w as a,i as m}from"./firebase-DXeuB9Ti.js";/* empty css              */import{i as u}from"./auth-guard-ahADkYB_.js";async function p(){const s=i.currentUser;if(!s)return;v();const t=document.querySelector("#lista-motoristas");try{const e=await n(l(d(c,"usuarios"),a("role","==","motorista"),a("supervisorId","==",s.uid)));if(e.empty){t.innerHTML='<div class="col-span-3 text-center p-10 text-slate-400">Nenhum motorista atribuído a você ainda.</div>';return}t.innerHTML=e.docs.map(o=>{const r=o.data();return`<div class="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div class="flex items-center gap-4 mb-4">
                    <div class="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span class="material-symbols-outlined text-primary text-2xl">person</span>
                    </div>
                    <div>
                        <p class="font-black">${r.nome||"—"}</p>
                        <p class="text-sm text-slate-500">${r.email||""}</p>
                    </div>
                </div>
                <a href="../supervisor/entregas.html" class="flex items-center gap-2 text-sm text-primary font-semibold hover:underline">
                    <span class="material-symbols-outlined text-sm">inventory_2</span> Ver entregas
                </a>
            </div>`}).join("")}catch(e){t.innerHTML=`<div class="col-span-3 text-center p-10 text-red-400">Erro: ${e.message}</div>`}}function v(){document.querySelector(".logout-btn")?.addEventListener("click",async()=>{confirm("Deseja sair?")&&(await m(i),window.location.href="/app-foods/pages/login.html")})}u(["supervisor"]);window.addEventListener("load",()=>{p()});
