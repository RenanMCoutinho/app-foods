import { collection, query, where, getDocs, Timestamp, getDoc, doc } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { db, auth } from "../services/firebase.js";
import { formatarData, criarInicioDoDiaLocal, criarFimDoDiaLocal, nomeDiaSemana } from "../utils/date.js";

export function initRelatorio() {
    const relatorioDias = document.querySelector("#relatorioDias");
    const totalRelatorio = document.querySelector("#totalRelatorio");
    const btnFiltrar = document.querySelector("#btnFiltrar");
    const dataInicioInput = document.querySelector("#dataInicio");
    const dataFimInput = document.querySelector("#dataFim");

    async function buscarEntregasPorPeriodo(inicioUTC, fimUTC) {
        try {
            const user = auth.currentUser;
            if (!user) return [];

            let role = 'motorista';
            const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
            if (userDoc.exists()) {
                role = userDoc.data().role || 'motorista';
            }

            const entregasRef = collection(db, "entregas");
            let queryConditions = [
                where("timestamp", ">=", Timestamp.fromDate(inicioUTC)),
                where("timestamp", "<=", Timestamp.fromDate(fimUTC))
            ];

            if (role === 'motorista') {
                queryConditions.push(where("motoristaId", "==", user.uid));
            }

            const q = query(entregasRef, ...queryConditions);
            const snapshot = await getDocs(q);

            if (snapshot.empty) return [];
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error(error);
            alert("Erro ao buscar entregas.");
            return [];
        }
    }

    function mostrarEntregasAgrupadas(entregas) {
        if (!relatorioDias) return;
        relatorioDias.innerHTML = "";

        if (entregas.length === 0) {
            relatorioDias.innerHTML = `
                <div class="p-12 text-center text-slate-400">
                    <span class="material-symbols-outlined text-4xl mb-2 opacity-20">search_off</span>
                    <p>Nenhum registro encontrado para este período.</p>
                </div>
            `;
            if (totalRelatorio) totalRelatorio.textContent = "0,00";
            return;
        }

        const diasMap = {};
        let totalGeral = 0;

        entregas.forEach((e) => {
            const dia = formatarData(e.timestamp);
            if (!diasMap[dia]) diasMap[dia] = [];
            diasMap[dia].push(e);
            totalGeral += e.valorFrete;
        });

        Object.keys(diasMap).sort((a, b) => {
            const [d1, m1, y1] = a.split("/").map(Number);
            const [d2, m2, y2] = b.split("/").map(Number);
            return new Date(y1, m1 - 1, d1) - new Date(y2, m2 - 1, d2);
        }).forEach((dia) => {
            const nomeDia = nomeDiaSemana(dia);
            let totalDia = 0;

            const card = document.createElement("div");
            card.className = "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-6";

            let rowsHtml = "";
            diasMap[dia].forEach((e) => {
                totalDia += e.valorFrete;
                rowsHtml += `
                    <tr class="border-b border-slate-50 dark:border-slate-800/50">
                        <td class="px-6 py-4 text-sm">
                            <div class="font-bold text-slate-900 dark:text-white">${e.nomeEmpresa}</div>
                            <div class="text-[10px] text-slate-500 uppercase font-black">${e.tipoEntrega}</div>
                        </td>
                        <td class="px-6 py-4 text-sm text-right font-black text-primary">
                            R$ ${e.valorFrete.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                    </tr>
                `;
            });

            card.innerHTML = `
                <div class="bg-slate-50/50 dark:bg-slate-800/50 px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <span class="text-xs font-black uppercase text-slate-500 tracking-widest">${nomeDia}, ${dia}</span>
                    <span class="text-sm font-black text-primary">Total: R$ ${totalDia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <table class="w-full text-left border-collapse">
                    <tbody>${rowsHtml}</tbody>
                </table>
            `;
            relatorioDias.appendChild(card);
        });

        if (totalRelatorio) totalRelatorio.textContent = totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    }

    if (btnFiltrar) {
        btnFiltrar.onclick = async () => {
            const dataInicio = dataInicioInput.value;
            const dataFim = dataFimInput.value;

            if (!dataInicio || !dataFim) {
                alert("Informe as duas datas para filtrar.");
                return;
            }

            const inicioLocal = criarInicioDoDiaLocal(dataInicio);
            const fimLocal = criarFimDoDiaLocal(dataFim);

            const entregas = await buscarEntregasPorPeriodo(inicioLocal, fimLocal);
            mostrarEntregasAgrupadas(entregas);
        };
    }
}
