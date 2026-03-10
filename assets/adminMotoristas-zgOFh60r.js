import{i as m,d as x,e as a,q as i,h as d,w as o,j as b}from"./firebase-MPfUmMKw.js";/* empty css              */import{i as c}from"./auth-guard-DjEyVMOS.js";let y=[];async function f(t=""){const e=document.querySelector("#lista-motoristas");e.innerHTML='<tr><td colspan="4" class="text-center p-10 text-slate-400">Carregando...</td></tr>';try{let s=t?i(d(a,"usuarios"),o("role","==","motorista"),o("supervisorId","==",t)):i(d(a,"usuarios"),o("role","==","motorista"));const n=await b(s);if(n.empty){e.innerHTML='<tr><td colspan="4" class="text-center p-10 text-slate-400">Nenhum motorista encontrado.</td></tr>';return}e.innerHTML=n.docs.map(l=>{const r=l.data(),p=y.find(u=>u.id===r.supervisorId);return`<tr>
                <td class="px-6 py-4 font-semibold">${r.nome||"—"}</td>
                <td class="px-6 py-4 text-slate-500 hidden md:table-cell">${r.email||"—"}</td>
                <td class="px-6 py-4 hidden md:table-cell"><span class="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">${p?.nome||"Sem supervisor"}</span></td>
                <td class="px-6 py-4">
                    <button onclick="excluirMotorista('${l.id}')" class="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><span class="material-symbols-outlined text-lg">delete</span></button>
                </td>
            </tr>`}).join("")}catch(s){e.innerHTML=`<tr><td colspan="4" class="text-center p-10 text-red-400">Erro: ${s.message}</td></tr>`}}window.excluirMotorista=async t=>{confirm("Excluir este motorista?")&&(await m(x(a,"usuarios",t)),f())};c(["admin"],()=>c());
