
// Inicializa o Framework7
var app = new Framework7({
    el: '#app',
    name: 'DriverLog',
    theme: 'ios',
    routes: [
        {
            path: '/',
            url: './pages/home.html',
            on: {
                pageInit: function (e, page) {
                    initHome(page);
                },
            }
        },
        {
            path: '/cadastro/',
            url: './pages/cadastro.html',
            on: {
                pageInit: function (e, page) {
                    initCadastro(page);
                },
            }
        },
        {
            path: '/relatorio/',
            url: './pages/relatorio.html',
            on: {
                pageInit: function (e, page) {
                    initRelatorio(page);
                },
            }
        },
    ],
});

var mainView = app.views.create('.view-main');

// =========================================================================
// Lógica da Home Page
// =========================================================================
function initHome(page) {
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

    function formatarData(data) {
        const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
        const diaSemana = diasSemana[data.getDay()];
        const dia = String(data.getDate()).padStart(2, '0');
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const ano = data.getFullYear();
        return `${diaSemana}, ${dia}/${mes}/${ano}`;
    }

    function dataFormatadaParaConsulta(data) {
        const dia = String(data.getDate()).padStart(2, '0');
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const ano = data.getFullYear();
        return `${dia}/${mes}/${ano}`;
    }

    function carregarEmpresas() {
        // Listener Firestore
        window.db.collection("empresas").onSnapshot((snapshot) => {
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
            };

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
            await window.db.collection("entregas").add({
                empresaId: empresa.id,
                nomeEmpresa: empresa.nome,
                tipoEntrega,
                valorFrete,
                data: dataFormatadaParaConsulta(dataSelecionada),
                timestamp: firebase.firestore.Timestamp.fromDate(dataSelecionada),
            });

            app.toast.create({
                text: 'Entrega registrada com sucesso!',
                closeTimeout: 2000,
                position: 'center',
                cssClass: 'toast-success'
            }).open();

            atualizarRelatorio();
        } catch (error) {
            app.dialog.alert("Erro ao registrar entrega: " + error.message);
        }
    }

    function atualizarRelatorio() {
        const dataStr = dataFormatadaParaConsulta(dataSelecionada);
        if (dataHoje) dataHoje.textContent = formatarData(dataSelecionada);

        window.db.collection("entregas")
            .where("data", "==", dataStr)
            .get()
            .then((snapshot) => {
                if (!relatorioList) return;
                relatorioList.innerHTML = "";
                let total = 0;

                if (snapshot.empty) {
                    relatorioList.innerHTML = '<li class="item-content"><div class="item-inner"><div class="item-title text-color-gray">Nenhuma entrega hoje.</div></div></li>';
                }

                snapshot.forEach((doc) => {
                    const e = doc.data();
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
                <div class="item-content">
                    <div class="item-inner">
                        <div class="item-title-row">
                            <div class="item-title">${e.nomeEmpresa}</div>
                            <div class="item-after">R$ ${e.valorFrete.toFixed(2)}</div>
                        </div>
                        <div class="item-subtitle">${nomeTipoEntrega}</div>
                        <div class="item-text text-align-right delete-btn-container"></div>
                    </div>
                </div>
            `;

                    const delBtn = document.createElement('button');
                    delBtn.className = "button button-small button-fill color-red display-inline-block";
                    delBtn.style.marginTop = "5px";
                    delBtn.textContent = "Excluir";
                    delBtn.onclick = async () => {
                        app.dialog.confirm("Deseja excluir essa entrega?", () => {
                            window.db.collection("entregas").doc(doc.id).delete()
                                .then(() => atualizarRelatorio())
                                .catch(err => app.dialog.alert("Erro: " + err.message));
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

// =========================================================================
// Lógica do Cadastro
// =========================================================================
function initCadastro(page) {
    const formCadastro = page.$el.find("#formCadastro")[0];
    const btnSalvar = page.$el.find("#btnSalvar")[0];
    const empresaId = page.$el.find("#empresaId")[0];
    const nomeEmpresa = page.$el.find("#nomeEmpresa")[0];
    const listaEmpresas = page.$el.find("#listaEmpresas")[0];

    // Inputs e Checkboxes
    const inputsMap = {};
    page.$el.find('input[name="tiposEntrega"]').forEach(chk => {
        const tipo = chk.dataset.tipo;
        const wrapper = page.$el.find(`#wrap-${tipo}`)[0];
        // Selecionar input pelo tipo
        // Corrigindo seleção: No HTML, IDs como 'valorAlmoco', 'valorJanta'
        // 'tipo' = 'almoco'. 'valor' + Capitalize(tipo)
        const capitalized = tipo.charAt(0).toUpperCase() + tipo.slice(1);
        const inputVal = page.$el.find(`#valor${capitalized}`)[0];

        inputsMap[tipo] = { chk, wrapper, input: inputVal };

        chk.addEventListener('change', () => {
            if (chk.checked) {
                if (wrapper) wrapper.style.display = 'block';
                if (inputVal) inputVal.disabled = false;
            } else {
                if (wrapper) wrapper.style.display = 'none';
                if (inputVal) {
                    inputVal.disabled = true;
                    inputVal.value = '';
                }
            }
        });
    });

    function carregarListaEmpresas() {
        // Listener
        window.db.collection("empresas").orderBy("nome").onSnapshot((snapshot) => {
            listaEmpresas.innerHTML = "";

            if (snapshot.empty) {
                listaEmpresas.innerHTML = '<div class="block text-align-center text-color-gray">Nenhuma empresa cadastrada.</div>';
                return;
            }

            const ul = document.createElement('ul');
            snapshot.forEach((doc) => {
                const e = doc.data();
                const li = document.createElement("li");

                li.innerHTML = `
            <div class="item-content">
                <div class="item-inner">
                    <div class="item-title">${e.nome}</div>
                    <div class="item-after display-flex">
                        <button class="button button-small button-outline margin-right btn-edit">Editar</button>
                        <button class="button button-small button-outline color-red btn-del">Excluir</button>
                    </div>
                </div>
            </div>
          `;

                li.querySelector('.btn-edit').onclick = () => preencherFormulario(doc.id, e);
                li.querySelector('.btn-del').onclick = () => {
                    app.dialog.confirm('Deseja excluir esta empresa?', () => {
                        window.db.collection("empresas").doc(doc.id).delete();
                    });
                };

                ul.appendChild(li);
            });
            listaEmpresas.appendChild(ul);
        });
    }

    function preencherFormulario(id, dados) {
        empresaId.value = id;
        nomeEmpresa.value = dados.nome;

        // Resetar visualmente antes de preencher
        for (const key in inputsMap) {
            const { chk, wrapper, input } = inputsMap[key];

            if (dados.tiposEntrega && dados.tiposEntrega[key] !== undefined) {
                chk.checked = true;
                if (wrapper) wrapper.style.display = 'block';
                if (input) {
                    input.disabled = false;
                    input.value = dados.tiposEntrega[key];
                }
            } else {
                chk.checked = false;
                if (wrapper) wrapper.style.display = 'none';
                if (input) {
                    input.disabled = true;
                    input.value = '';
                }
            }
        }

        btnSalvar.innerHTML = '<i class="icon f7-icons if-not-md margin-right">floppy_disk</i><i class="icon material-icons if-md margin-right">save</i> Atualizar Empresa';
        page.$el.find('.page-content')[0].scrollTo({ top: 0, behavior: 'smooth' });
    }

    formCadastro.addEventListener("submit", async (e) => {
        e.preventDefault();
        const nome = nomeEmpresa.value.trim();
        if (!nome) return app.dialog.alert("Informe o nome da empresa.");

        const tiposEntrega = {};
        let algumSelecionado = false;

        for (const key in inputsMap) {
            const { chk, input } = inputsMap[key];
            if (chk.checked) {
                const valor = parseFloat(input.value);
                if (isNaN(valor) || valor < 0) {
                    app.dialog.alert(`Informe um valor válido para ${key}.`);
                    return;
                }
                tiposEntrega[key] = valor;
                algumSelecionado = true;
            }
        }

        if (!algumSelecionado) {
            app.dialog.alert("Selecione pelo menos um tipo de entrega.");
            return;
        }

        const empresaData = { nome, tiposEntrega };

        try {
            if (empresaId.value) {
                await window.db.collection("empresas").doc(empresaId.value).update(empresaData);
                app.toast.create({ text: 'Empresa atualizada!', closeTimeout: 2000, position: 'center' }).open();
            } else {
                await window.db.collection("empresas").add(empresaData);
                app.toast.create({ text: 'Empresa cadastrada!', closeTimeout: 2000, position: 'center' }).open();
            }

            // Reset form
            formCadastro.reset();
            empresaId.value = "";
            btnSalvar.innerHTML = '<i class="icon f7-icons if-not-md margin-right">floppy_disk</i><i class="icon material-icons if-md margin-right">save</i> Salvar Empresa';
            for (const key in inputsMap) {
                const { wrapper, input } = inputsMap[key];
                if (wrapper) wrapper.style.display = 'none';
                if (input) input.disabled = true;
            }

        } catch (err) {
            app.dialog.alert("Erro ao salvar: " + err.message);
        }
    });

    carregarListaEmpresas();
}

// =========================================================================
// Lógica do Relatório Completo
// =========================================================================
function initRelatorio(page) {
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

    function formatarData(timestampOrDate) {
        const dt = timestampOrDate.toDate ? timestampOrDate.toDate() : new Date(timestampOrDate);
        const day = String(dt.getDate()).padStart(2, "0");
        const month = String(dt.getMonth() + 1).padStart(2, "0");
        const year = dt.getFullYear();
        return `${day}/${month}/${year}`;
    }

    function criarInicioDoDiaLocal(dateStr) {
        const [ano, mes, dia] = dateStr.split("-");
        return new Date(+ano, +mes - 1, +dia, 0, 0, 0, 0);
    }

    function criarFimDoDiaLocal(dateStr) {
        const [ano, mes, dia] = dateStr.split("-");
        return new Date(+ano, +mes - 1, +dia, 23, 59, 59, 999);
    }

    async function buscarEntregasPorPeriodo(inicioUTC, fimUTC) {
        try {
            const snapshot = await window.db
                .collection("entregas")
                .where("timestamp", ">=", firebase.firestore.Timestamp.fromDate(inicioUTC))
                .where("timestamp", "<=", firebase.firestore.Timestamp.fromDate(fimUTC))
                .get();

            if (snapshot.empty) return [];
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error(error);
            app.dialog.alert("Erro ao buscar entregas.");
            return [];
        }
    }

    function nomeDiaSemana(dateStr) {
        const [d, m, y] = dateStr.split("/").map(Number);
        const date = new Date(y, m - 1, d);
        const dias = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
        return dias[date.getDay()];
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
                    <div class="item-content">
                        <div class="item-inner">
                            <div class="item-title">${e.nomeEmpresa} <span class="text-color-gray size-14">(${tipoNome})</span></div>
                            <div class="item-after">R$ ${e.valorFrete.toFixed(2)}</div>
                        </div>
                    </div>
                `;
                ul.appendChild(li);
            });

            // Total do dia
            const liTotal = document.createElement("li");
            liTotal.className = "bg-color-yellow-light";
            liTotal.innerHTML = `
                 <div class="item-content">
                    <div class="item-inner">
                        <div class="item-title"><strong>Total do dia</strong></div>
                        <div class="item-after"><strong>R$ ${totalDia.toFixed(2)}</strong></div>
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
