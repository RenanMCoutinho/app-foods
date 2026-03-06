import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { db } from "../services/firebase.js";
import { formatarData, criarInicioDoDiaLocal, criarFimDoDiaLocal, nomeDiaSemana } from "../utils/date.js";

export function initRelatorio(page, app) {
    const relatorioDias = page.$el.find("#relatorioDias")[0];
    const totalRelatorio = page.$el.find("#totalRelatorio")[0];
    const btnFiltrar = page.$el.find("#btnFiltrar")[0];
    const btnGerarPdf = page.$el.find("#btnGerarPdf")[0];
    const dataInicioInput = page.$el.find("#dataInicio")[0];
    const dataFimInput = page.$el.find("#dataFim")[0];

    const tiposEntrega = {
        almoco: "Almoço",
        janta: "Jantar",
        ceia: "Ceia/Granel",
        desjejum: "Desjejum",
        recolha: "Recolha",
        ceiaMtx: "Ceia/MTX",
        bo: "B.O"
    };

    async function buscarEntregasPorPeriodo(inicioUTC, fimUTC) {
        try {
            app.dialog.preloader('Buscando...');
            const entregasRef = collection(db, "entregas");
            const q = query(
                entregasRef,
                where("timestamp", ">=", Timestamp.fromDate(inicioUTC)),
                where("timestamp", "<=", Timestamp.fromDate(fimUTC))
            );

            const snapshot = await getDocs(q);
            app.dialog.close();

            if (snapshot.empty) return [];
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error(error);
            app.dialog.close();
            app.dialog.alert("Erro ao buscar entregas.");
            return [];
        }
    }

    function mostrarEntregasAgrupadas(entregas) {
        relatorioDias.innerHTML = "";

        if (entregas.length === 0) {
            relatorioDias.innerHTML = '<div class="block text-align-center text-color-gray">Nenhuma entrega encontrada.</div>';
            totalRelatorio.textContent = "0.00";
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

            const blockTitle = document.createElement("div");
            blockTitle.className = "block-title text-color-primary";
            blockTitle.textContent = `${nomeDia} - ${dia}`;
            relatorioDias.appendChild(blockTitle);

            const list = document.createElement("div");
            list.className = "list inset";
            const ul = document.createElement("ul");
            list.appendChild(ul);

            let totalDia = 0;

            diasMap[dia].forEach((e) => {
                totalDia += e.valorFrete;
                const li = document.createElement("li");
                const tipoNome = tiposEntrega[e.tipoEntrega] || e.tipoEntrega;

                li.innerHTML = `
                    <div class="item-content" style="padding-top: 4px; padding-bottom: 4px;">
                        <div class="item-inner">
                            <div class="item-title" style="font-weight: 500; font-size: 15px; color: #1a1d20;">${e.nomeEmpresa} <span class="text-color-gray size-13" style="font-weight: 400;">(${tipoNome})</span></div>
                            <div class="item-after" style="font-weight: 600; color: #1a1d20;">R$ ${e.valorFrete.toFixed(2)}</div>
                        </div>
                    </div>
                `;
                ul.appendChild(li);
            });

            // Total do dia
            const liTotal = document.createElement("li");
            liTotal.className = "bg-color-yellow-light";
            liTotal.innerHTML = `
                 <div class="item-content" style="padding-top: 8px; padding-bottom: 8px; background-color: rgba(11, 158, 74, 0.05); border-radius: 8px;">
                    <div class="item-inner">
                        <div class="item-title" style="color: var(--f7-theme-color);"><strong>Total do dia</strong></div>
                        <div class="item-after" style="color: var(--f7-theme-color); font-size: 16px;"><strong>R$ ${totalDia.toFixed(2)}</strong></div>
                    </div>
                 </div>
             `;
            ul.appendChild(liTotal);

            relatorioDias.appendChild(list);
        });

        totalRelatorio.textContent = totalGeral.toFixed(2);
    }

    btnFiltrar.addEventListener("click", async () => {
        const dataInicio = dataInicioInput.value;
        const dataFim = dataFimInput.value;

        if (!dataInicio || !dataFim) {
            app.dialog.alert("Informe as duas datas para filtrar.");
            return;
        }
        if (dataFim < dataInicio) {
            app.dialog.alert("Data fim deve ser maior ou igual à data início.");
            return;
        }

        const inicioLocal = criarInicioDoDiaLocal(dataInicio);
        const fimLocal = criarFimDoDiaLocal(dataFim);

        const entregas = await buscarEntregasPorPeriodo(inicioLocal, fimLocal);
        mostrarEntregasAgrupadas(entregas);
    });

    btnGerarPdf.addEventListener("click", () => {
        if (!window.jspdf) return app.dialog.alert("Biblioteca PDF não carregada.");

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: "landscape" });

        const marginLeft = 8;
        const topMargin = 15;
        const colSpacing = 55;
        const rowSpacing = 45;
        const rowHeight = 5;

        doc.setFontSize(14);
        doc.text("Relatório de Entregas", 148, 10, { align: "center" });

        const elementos = Array.from(relatorioDias.children);
        const blocos = [];

        for (let i = 0; i < elementos.length; i++) {
            if (elementos[i].classList.contains('block-title')) {
                const tituloEl = elementos[i];
                const listaEl = elementos[i + 1];
                if (listaEl && listaEl.classList.contains('list')) {
                    const lis = Array.from(listaEl.querySelectorAll('li'));
                    blocos.push({
                        titulo: tituloEl.textContent,
                        itens: lis
                    });
                }
            }
        }

        if (blocos.length === 0) {
            app.dialog.alert("Nenhum dado para gerar relatório.");
            return;
        }

        let col = 0;
        let row = 0;
        const maxCols = 5;
        const maxRows = 3;

        blocos.forEach((bloco) => {
            const x = marginLeft + col * colSpacing;
            let y = topMargin + row * rowSpacing;

            if (row >= maxRows) {
                doc.addPage();
                row = 0;
                col = 0;
                y = topMargin;
            }

            doc.setFontSize(11);
            doc.text(bloco.titulo, x + colSpacing / 2, y, { align: "center" });
            y += rowHeight;

            doc.setFontSize(9);
            doc.text("Empresa", x, y);
            doc.text("Tipo", x + 18, y);
            doc.text("Valor", x + 35, y);
            y += rowHeight;

            bloco.itens.forEach((li) => {
                const titleEl = li.querySelector('.item-title');
                const afterEl = li.querySelector('.item-after');
                const textTitle = titleEl ? titleEl.innerText : "";
                const textAfter = afterEl ? afterEl.innerText : "";

                const isTotal = textTitle.includes("Total do dia");

                if (isTotal) {
                    doc.setFillColor(255, 255, 153);
                    doc.rect(x - 1, y - rowHeight + 1, 51, rowHeight + 1, "F");
                    doc.setFontSize(9);
                    doc.text("Total:", x, y);
                    doc.text(textAfter.replace("R$ ", ""), x + 35, y);
                    y += rowHeight;
                } else {
                    let empresa = textTitle;
                    let tipo = "";

                    const match = textTitle.match(/(.+)\s+\(([^)]+)\)/);
                    if (match) {
                        empresa = match[1];
                        tipo = match[2];
                    }

                    const valor = textAfter.replace("R$ ", "");

                    const empresaLines = doc.splitTextToSize(empresa, 20);

                    empresaLines.forEach((line, k) => {
                        doc.setFontSize(8);
                        doc.text(line, x, y);
                        if (k === 0) {
                            doc.text(tipo.slice(0, 15), x + 18, y);
                            doc.text(valor, x + 35, y);
                        }
                        y += rowHeight;
                    });
                }
            });

            col++;
            if (col >= maxCols) {
                col = 0;
                row++;
            }
        });

        const totalMesTexto = `Total: R$ ${totalRelatorio.textContent}`;
        const textWidth = doc.getTextWidth(totalMesTexto);
        const pageWidth = doc.internal.pageSize.getWidth();
        const xTotal = pageWidth - textWidth - 20;
        const yTotal = 200;

        doc.setFillColor(255, 255, 153);
        doc.rect(xTotal - 1, yTotal - 5, textWidth + 15, 8, "F");
        doc.setFontSize(12);
        doc.text(totalMesTexto, xTotal, yTotal);

        doc.save("relatorio_entregas.pdf");
    });
}
