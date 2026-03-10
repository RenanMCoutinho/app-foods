import{a as h,m as w,d as v,e as x,h as k,w as D,T as y,q as F,j as $}from"./firebase-DXeuB9Ti.js";/* empty css              */import{i as L}from"./auth-guard-ahADkYB_.js";function q(a){const t=a.toDate?a.toDate():new Date(a),i=["Domingo","Segunda-feira","Terça-feira","Quarta-feira","Quinta-feira","Sexta-feira","Sábado"][t.getDay()],p=String(t.getDate()).padStart(2,"0"),f=String(t.getMonth()+1).padStart(2,"0"),g=t.getFullYear();return`${i}, ${p}/${f}/${g}`}function E(a){const[t,n,i]=a.split("/").map(Number),p=new Date(i,n-1,t);return["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"][p.getDay()]}function R(a){const[t,n,i]=a.split("-");return new Date(+t,+n-1,+i,0,0,0,0)}function I(a){const[t,n,i]=a.split("-");return new Date(+t,+n-1,+i,23,59,59,999)}function T(){const a=document.querySelector("#relatorioDias"),t=document.querySelector("#totalRelatorio"),n=document.querySelector("#btnFiltrar"),i=document.querySelector("#dataInicio"),p=document.querySelector("#dataFim");async function f(d,o){try{const s=h.currentUser;if(!s)return[];let e="motorista";const r=await w(v(x,"usuarios",s.uid));r.exists()&&(e=r.data().role||"motorista");const m=k(x,"entregas");let l=[D("timestamp",">=",y.fromDate(d)),D("timestamp","<=",y.fromDate(o))];e==="motorista"&&l.push(D("motoristaId","==",s.uid));const u=F(m,...l),c=await $(u);return c.empty?[]:c.docs.map(b=>({id:b.id,...b.data()}))}catch(s){return console.error(s),alert("Erro ao buscar entregas."),[]}}function g(d){if(!a)return;if(a.innerHTML="",d.length===0){a.innerHTML=`
                <div class="p-12 text-center text-slate-400">
                    <span class="material-symbols-outlined text-4xl mb-2 opacity-20">search_off</span>
                    <p>Nenhum registro encontrado para este período.</p>
                </div>
            `,t&&(t.textContent="0,00");return}const o={};let s=0;d.forEach(e=>{const r=q(e.timestamp);o[r]||(o[r]=[]),o[r].push(e),s+=e.valorFrete}),Object.keys(o).sort((e,r)=>{const[m,l,u]=e.split("/").map(Number),[c,b,S]=r.split("/").map(Number);return new Date(u,l-1,m)-new Date(S,b-1,c)}).forEach(e=>{const r=E(e);let m=0;const l=document.createElement("div");l.className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-6";let u="";o[e].forEach(c=>{m+=c.valorFrete,u+=`
                    <tr class="border-b border-slate-50 dark:border-slate-800/50">
                        <td class="px-6 py-4 text-sm">
                            <div class="font-bold text-slate-900 dark:text-white">${c.nomeEmpresa}</div>
                            <div class="text-[10px] text-slate-500 uppercase font-black">${c.tipoEntrega}</div>
                        </td>
                        <td class="px-6 py-4 text-sm text-right font-black text-primary">
                            R$ ${c.valorFrete.toLocaleString("pt-BR",{minimumFractionDigits:2})}
                        </td>
                    </tr>
                `}),l.innerHTML=`
                <div class="bg-slate-50/50 dark:bg-slate-800/50 px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <span class="text-xs font-black uppercase text-slate-500 tracking-widest">${r}, ${e}</span>
                    <span class="text-sm font-black text-primary">Total: R$ ${m.toLocaleString("pt-BR",{minimumFractionDigits:2})}</span>
                </div>
                <table class="w-full text-left border-collapse">
                    <tbody>${u}</tbody>
                </table>
            `,a.appendChild(l)}),t&&(t.textContent=s.toLocaleString("pt-BR",{minimumFractionDigits:2}))}n&&(n.onclick=async()=>{const d=i.value,o=p.value;if(!d||!o){alert("Informe as duas datas para filtrar.");return}const s=R(d),e=I(o),r=await f(s,e);g(r)})}L([],()=>T());
