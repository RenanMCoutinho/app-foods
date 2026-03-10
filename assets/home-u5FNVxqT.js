import{i as l,d as c,e as d}from"./firebase-MPfUmMKw.js";/* empty css              */import{i as o}from"./auth-guard-DjEyVMOS.js";let t=[];function m(){const a=document.querySelector("#lista-entregas-dia"),r=document.querySelector("#contagem-dia"),n=document.querySelector("#total-dia"),s=t.reduce((e,i)=>e+(i.valor||0),0);if(n&&(n.textContent=`R$ ${s.toFixed(2).replace(".",",")}`),r&&(r.textContent=t.length),!t.length){a.innerHTML=`<div class="p-8 text-center">
            <span class="material-symbols-outlined text-4xl text-slate-200 dark:text-slate-700">inbox</span>
            <p class="text-sm text-slate-400 mt-2">Nenhuma entrega registrada hoje.<br>Selecione uma empresa e adicione!</p>
        </div>`;return}a.innerHTML=t.map(e=>`
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
    `).join("")}window.removerEntrega=async a=>{confirm("Remover esta entrega do dia?")&&(await l(c(d,"entregas",a)),t=t.filter(r=>r.id!==a),m())};o(["motorista"],()=>o());
