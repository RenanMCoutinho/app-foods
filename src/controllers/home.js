import { collection, onSnapshot, addDoc, getDocs, deleteDoc, doc, query, where, Timestamp, orderBy } from "firebase/firestore";
import { db, auth } from "../services/firebase.js";
import { formatarData, dataFormatadaParaConsulta } from "../utils/date.js";

export function initHome(page, app) {
    const empresaSelect = page.$el.find("#empresaSelect")[0];
    const tipoEntregaSelect = page.$el.find("#tipoEntregaSelect")[0];
    const relatorioList = page.$el.find("#relatorioList")[0];
    const totalHoje = page.$el.find("#totalHoje")[0];
    const dataHoje = page.$el.find("#dataHoje")[0];
    const btnRegistrar = page.$el.find("#btnRegistrar")[0];
    const btnAnterior = page.$el.find("#btnAnterior")[0];
    const btnProximo = page.$el.find("#btnProximo")[0];

    // Variáveis locais para controlar estado
    let empresas = [];
    let dataSelecionada = new Date();

    function carregarEmpresas() {
        const empresasRef = collection(db, "empresas");

        onSnapshot(empresasRef, (snapshot) => {
            empresas = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })).sort((a, b) => a.nome.localeCompare(b.nome));

            if (empresaSelect) {
                empresaSelect.innerHTML = '<option value="">Selecione...</option>';
                empresas.forEach((emp) => {
                    const option = document.createElement("option");
                    option.value = emp.id;
                    option.textContent = emp.nome;
                    empresaSelect.appendChild(option);
                });
            }

            if (tipoEntregaSelect) {
                tipoEntregaSelect.innerHTML = '<option value="">Selecione uma empresa primeiro</option>';
                tipoEntregaSelect.disabled = true;
            }
        });
    }

    // Eventos
    if (empresaSelect) {
        empresaSelect.addEventListener("change", () => {
            const nomesTipoEntrega = {
                almoco: "Almoço",
                janta: "Jantar",
                ceia: "Ceia/Granel",
                desjejum: "Desjejum",
                recolha: "Recolha",
                ceiaMtx: "Ceia/MTX",
                bo: "B.O"
            };
            const empresaId = empresaSelect.value;
            const empresa = empresas.find(e => e.id === empresaId);
            if (!empresa) return;

            tipoEntregaSelect.innerHTML = '<option value="">Selecione o tipo de entrega</option>';
            for (const [tipo, valor] of Object.entries(empresa.tiposEntrega || {})) {
                const option = document.createElement("option");
                option.value = tipo;
                option.textContent = `${nomesTipoEntrega[tipo] || tipo} — R$ ${valor.toFixed(2)}`;
                tipoEntregaSelect.appendChild(option);
            }

            tipoEntregaSelect.disabled = false;
        });
    }

    async function registrarEntrega() {
        const empresaId = empresaSelect.value;
        const tipoEntrega = tipoEntregaSelect.value;
        if (!empresaId || !tipoEntrega) {
            app.dialog.alert("Selecione a empresa e o tipo de entrega.");
            return;
        }

        const empresa = empresas.find(e => e.id === empresaId);
        if (!empresa) {
            app.dialog.alert("Empresa inválida.");
            return;
        }

        const valorFrete = empresa.tiposEntrega[tipoEntrega];
        if (valorFrete === undefined) {
            app.dialog.alert("Valor do frete inválido.");
            return;
        }

        try {
            app.dialog.preloader('Registrando...');
            const user = auth.currentUser;
            const entregasRef = collection(db, "entregas");
            await addDoc(entregasRef, {
                motoristaId: user.uid,
                motoristaNome: user.email,
                empresaId: empresa.id,
                nomeEmpresa: empresa.nome,
                tipoEntrega,
                valorFrete,
                data: dataFormatadaParaConsulta(dataSelecionada),
                timestamp: Timestamp.fromDate(dataSelecionada),
            });
            app.dialog.close();

            app.toast.create({
                text: 'Entrega registrada com sucesso!',
                closeTimeout: 2000,
                position: 'center',
                cssClass: 'toast-success'
            }).open();

            atualizarRelatorio();
        } catch (error) {
            app.dialog.close();
            app.dialog.alert("Erro ao registrar entrega: " + error.message);
        }
    }

    function atualizarRelatorio() {
        const dataStr = dataFormatadaParaConsulta(dataSelecionada);
        if (dataHoje) dataHoje.textContent = formatarData(dataSelecionada);

        if (relatorioList) {
            relatorioList.innerHTML = '<li class="item-content"><div class="item-inner"><div class="item-title text-color-gray skeleton-text">Carregando as entregas de hoje...</div></div></li>';
        }

        const entregasRef = collection(db, "entregas");
        const user = auth.currentUser;

        // Se ainda não houver user por causa da inicialização, aguarda.
        if (!user) return;

        const q = query(
            entregasRef,
            where("data", "==", dataStr),
            where("motoristaId", "==", user.uid)
        );

        getDocs(q).then((snapshot) => {
            if (!relatorioList) return;
            relatorioList.innerHTML = "";
            let total = 0;

            if (snapshot.empty) {
                relatorioList.innerHTML = '<li class="item-content"><div class="item-inner"><div class="item-title text-color-gray">Nenhuma entrega hoje.</div></div></li>';
            }

            snapshot.forEach((d) => {
                const e = d.data();
                total += e.valorFrete;

                const li = document.createElement("li");

                const nomesTipoEntrega = {
                    almoco: "Almoço",
                    janta: "Jantar",
                    ceia: "Ceia/Granel",
                    desjejum: "Desjejum",
                    recolha: "Recolha",
                    ceiaMtx: "Ceia/MTX",
                    bo: "B.O"
                };

                const nomeTipoEntrega = nomesTipoEntrega[e.tipoEntrega] || e.tipoEntrega;

                li.innerHTML = `
            <div class="item-content" style="padding-top: 6px; padding-bottom: 6px;">
                <div class="item-inner">
                    <div class="item-title-row">
                        <div class="item-title" style="font-weight: 600; color: var(--text-main);">${e.nomeEmpresa}</div>
                        <div class="item-after" style="font-weight: 700; color: var(--f7-theme-color);">R$ ${e.valorFrete.toFixed(2)}</div>
                    </div>
                    <div class="item-subtitle" style="color: var(--text-muted); font-size: 13px; margin-top: 4px;">${nomeTipoEntrega}</div>
                    <div class="text-align-right delete-btn-container" style="margin-top: 8px;"></div>
                </div>
            </div>
        `;

                const delBtn = document.createElement('button');
                delBtn.className = "button button-small button-fill color-red display-inline-block";
                delBtn.style.marginTop = "5px";
                delBtn.textContent = "Excluir";
                delBtn.onclick = async () => {
                    app.dialog.confirm("Deseja excluir essa entrega?", async () => {
                        try {
                            app.dialog.preloader();
                            await deleteDoc(doc(db, "entregas", d.id));
                            app.dialog.close();
                            atualizarRelatorio();
                        } catch (err) {
                            app.dialog.close();
                            app.dialog.alert("Erro: " + err.message);
                        }
                    });
                };

                li.querySelector('.delete-btn-container').appendChild(delBtn);
                relatorioList.appendChild(li);
            });

            if (totalHoje) totalHoje.textContent = total.toFixed(2);
        });
    }

    if (btnRegistrar) btnRegistrar.addEventListener("click", registrarEntrega);

    if (btnAnterior) btnAnterior.addEventListener("click", () => {
        dataSelecionada.setDate(dataSelecionada.getDate() - 1);
        atualizarRelatorio();
    });

    if (btnProximo) btnProximo.addEventListener("click", () => {
        dataSelecionada.setDate(dataSelecionada.getDate() + 1);
        atualizarRelatorio();
    });

    carregarEmpresas();
    atualizarRelatorio();
}
