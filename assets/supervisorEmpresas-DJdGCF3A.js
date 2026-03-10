import{a as p,j as m,q as u,w as x,h as v,e as l,i as b,d as g}from"./firebase-MPfUmMKw.js";/* empty css              */import{i as d}from"./auth-guard-DjEyVMOS.js";async function y(r){const o=document.querySelector("#lista-empresas");o.innerHTML='<div class="text-center p-10 text-slate-400">Carregando...</div>';try{const n=await m(u(v(l,"empresas"),x("supervisorId","==",r)));if(n.empty){o.innerHTML=`<div class="text-center p-16 text-slate-400">
                <span class="material-symbols-outlined text-6xl opacity-20 block mb-3">business</span>
                <p class="text-sm font-medium">Nenhuma empresa cadastrada.</p>
                <p class="text-xs mt-1">Clique em "Nova Empresa" para começar.</p>
            </div>`;return}const c={Desjejum:{icon:"wb_sunny",color:"text-amber-500 bg-amber-50"},Almoço:{icon:"restaurant",color:"text-orange-500 bg-orange-50"},Janta:{icon:"dinner_dining",color:"text-indigo-500 bg-indigo-50"},Ceia:{icon:"nightlight",color:"text-purple-500 bg-purple-50"},"B.O":{icon:"package_2",color:"text-red-500 bg-red-50"}};o.innerHTML=n.docs.map(t=>{const e=t.data(),s=(e.tipos||[]).map(a=>{const i=c[a.nome]||{icon:"local_shipping",color:"text-primary bg-primary/10"};return`<div class="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div class="flex items-center gap-2">
                        <span class="${i.color} p-1.5 rounded-lg">
                            <span class="material-symbols-outlined text-base">${i.icon}</span>
                        </span>
                        <span class="text-sm font-semibold">${a.nome}</span>
                    </div>
                    <span class="font-black text-primary text-sm">R$ ${(a.valor||0).toFixed(2).replace(".",",")}</span>
                </div>`}).join("");return`<div class="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div class="flex items-start justify-between mb-4">
                    <div>
                        <h3 class="font-black text-lg leading-tight">${e.nome||"—"}</h3>
                        ${e.endereco?`<p class="text-sm text-slate-500 flex items-center gap-1 mt-0.5"><span class="material-symbols-outlined text-sm">pin_drop</span>${e.endereco}</p>`:""}
                        ${e.cnpj?`<p class="text-xs text-slate-400 mt-0.5">${e.cnpj}</p>`:""}
                    </div>
                    <div class="flex gap-2 shrink-0 ml-4">
                        <button onclick="editarEmpresa('${t.id}')" class="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                            <span class="material-symbols-outlined text-lg">edit</span>
                        </button>
                        <button onclick="excluirEmpresa('${t.id}')" class="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <span class="material-symbols-outlined text-lg">delete</span>
                        </button>
                    </div>
                </div>
                ${s?`<div class="space-y-2">${s}</div>`:'<p class="text-xs text-slate-400 italic">Nenhum tipo de entrega configurado.</p>'}
            </div>`}).join("")}catch(n){o.innerHTML=`<div class="text-center p-10 text-red-400">Erro: ${n.message}</div>`}}window.editarEmpresa=async r=>{const o=p.currentUser,c=(await m(u(v(l,"empresas"),x("supervisorId","==",o.uid)))).docs.find(e=>e.id===r);if(!c)return;const t=c.data();document.querySelector("#empresa-id").value=r,document.querySelector("#empresa-nome").value=t.nome||"",document.querySelector("#empresa-endereco").value=t.endereco||"",document.querySelector("#empresa-cnpj").value=t.cnpj||"",document.querySelector("#modal-titulo").textContent="Editar Empresa",document.querySelectorAll(".tipo-check").forEach(e=>{e.checked=!1,e.closest(".tipo-item").querySelector(".valor-field").classList.add("hidden"),e.closest(".tipo-item").classList.remove("ring-2","ring-primary")}),(t.tipos||[]).forEach(e=>{const s=document.querySelector(`.tipo-check[data-tipo="${e.nome}"]`);if(s){s.checked=!0;const a=s.closest(".tipo-item");a.querySelector(".valor-field").classList.remove("hidden"),a.querySelector(".tipo-valor").value=e.valor||"",a.classList.add("ring-2","ring-primary");const i=s.closest("label").querySelector(".text-xs.text-slate-400");i&&(i.textContent="Ativo")}}),document.querySelector("#modal-empresa").classList.remove("hidden")};window.excluirEmpresa=async r=>{confirm("Excluir esta empresa?")&&(await b(g(l,"empresas",r)),y(p.currentUser?.uid))};d(["supervisor"],()=>d());
