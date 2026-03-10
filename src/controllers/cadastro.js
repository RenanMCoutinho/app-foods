import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, orderBy, query } from "firebase/firestore";
import { db, auth } from "../services/firebase.js";
import { getDoc, doc as fetchDoc } from "firebase/firestore";

export function initCadastro(page, app) {
    const formCadastro = page.$el.find("#formCadastro")[0];
    const btnSalvar = page.$el.find("#btnSalvar")[0];
    const empresaId = page.$el.find("#empresaId")[0];
    const nomeEmpresa = page.$el.find("#nomeEmpresa")[0];
    const listaEmpresas = page.$el.find("#listaEmpresas")[0];

    // Inputs e Checkboxes
    const inputsMap = {};

    // Auth role check
    const user = auth.currentUser;
    if (!user) {
        app.views.main.router.navigate('/login/');
        return;
    }

    app.preloader.show();
    getDoc(fetchDoc(db, 'usuarios', user.uid)).then(userDoc => {
        app.preloader.hide();
        let role = 'motorista';
        if (userDoc.exists()) {
            role = userDoc.data().role || 'motorista';
        }

        if (role !== 'admin' && role !== 'supervisor') {
            app.dialog.alert('Acesso negado. Apenas supervisores.', 'Erro');
            app.views.main.router.navigate('/');
            return;
        }
    }).catch(err => {
        app.preloader.hide();
        app.dialog.alert('Erro de permissão.', 'Erro');
        app.views.main.router.navigate('/');
    });
    page.$el.find('input[name="tiposEntrega"]').forEach(chk => {
        const tipo = chk.dataset.tipo;
        const wrapper = page.$el.find(`#wrap-${tipo}`)[0];
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
        if (!listaEmpresas) return;
        listaEmpresas.innerHTML = '<div class="block text-align-center text-color-gray skeleton-text">Carregando empresas...</div>';

        const empresasRef = collection(db, "empresas");
        const q = query(empresasRef, orderBy("nome"));

        onSnapshot(q, (snapshot) => {
            listaEmpresas.innerHTML = "";

            if (snapshot.empty) {
                listaEmpresas.innerHTML = '<div class="block text-align-center text-color-gray">Nenhuma empresa cadastrada.</div>';
                return;
            }

            const ul = document.createElement('ul');
            snapshot.forEach((d) => {
                const e = d.data();
                const li = document.createElement("li");

                li.innerHTML = `
            <div class="item-content" style="padding-top: 6px; padding-bottom: 6px;">
                <div class="item-inner">
                    <div class="item-title" style="font-weight: 600; color: var(--text-main); font-size: 16px;">${e.nome}</div>
                    <div class="item-after display-flex">
                        <button class="button button-small button-outline margin-right btn-edit" style="color: var(--f7-theme-color); border-color: var(--f7-theme-color);">Editar</button>
                        <button class="button button-small button-outline color-red btn-del" style="color: #ff3b30; border-color: #ff3b30;">Excluir</button>
                    </div>
                </div>
            </div>
          `;

                li.querySelector('.btn-edit').onclick = () => preencherFormulario(d.id, e);
                li.querySelector('.btn-del').onclick = () => {
                    app.dialog.confirm('Deseja excluir esta empresa?', async () => {
                        try {
                            app.dialog.preloader('Excluindo...');
                            await deleteDoc(doc(db, "empresas", d.id));
                            app.dialog.close();
                            app.toast.create({ text: 'Empresa excluída!', closeTimeout: 2000, position: 'center' }).open();
                        } catch (err) {
                            app.dialog.close();
                            app.dialog.alert("Erro ao excluir: " + err.message);
                        }
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
            app.dialog.preloader('Salvando...');
            if (empresaId.value) {
                await updateDoc(doc(db, "empresas", empresaId.value), empresaData);
                app.dialog.close();
                app.toast.create({ text: 'Empresa atualizada!', closeTimeout: 2000, position: 'center' }).open();
            } else {
                await addDoc(collection(db, "empresas"), empresaData);
                app.dialog.close();
                app.toast.create({ text: 'Empresa cadastrada!', closeTimeout: 2000, position: 'center' }).open();
            }

            formCadastro.reset();
            empresaId.value = "";
            btnSalvar.innerHTML = '<i class="icon f7-icons if-not-md margin-right">floppy_disk</i><i class="icon material-icons if-md margin-right">save</i> Salvar Empresa';
            for (const key in inputsMap) {
                const { wrapper, input } = inputsMap[key];
                if (wrapper) wrapper.style.display = 'none';
                if (input) input.disabled = true;
            }

        } catch (err) {
            app.dialog.close();
            app.dialog.alert("Erro ao salvar: " + err.message);
        }
    });

    carregarListaEmpresas();
}
