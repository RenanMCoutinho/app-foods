const fEmpresas = [];
const fEntregas = JSON.parse(localStorage.getItem('entregas') || '[]');

function saveEmpresas() {
  localStorage.setItem('empresas', JSON.stringify(fEmpresas));
}
function loadEmpresas() {
  const arr = JSON.parse(localStorage.getItem('empresas') || '[]');
  fEmpresas.splice(0, fEmpresas.length, ...arr);
}
function refreshEmpresas() {
  const lista = document.getElementById('listaEmpresas');
  const select = document.getElementById('empresaSelect');
  lista.innerHTML = '';
  select.innerHTML = '<option value="">Selecione...</option>';
  fEmpresas.forEach(emp => {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center';
    li.innerText = `${emp.nome} (${emp.valorFrete.toFixed(2)})`;
    const btnEdit = document.createElement('button');
    btnEdit.textContent = '✏️';
    btnEdit.className = 'btn btn-sm btn-outline-secondary';
    btnEdit.onclick = () => editEmpresa(emp.id);
    li.appendChild(btnEdit);
    lista.appendChild(li);
    const opt = document.createElement('option');
    opt.value = emp.id;
    opt.textContent = emp.nome;
    select.appendChild(opt);
  });
}
function editEmpresa(id) {
  const emp = fEmpresas.find(e => e.id === id);
  document.getElementById('empresaId').value = emp.id;
  document.getElementById('nome').value = emp.nome;
  document.getElementById('endereco').value = emp.endereco;
  document.getElementById('valorFrete').value = emp.valorFrete;
  document.getElementById('tituloForm').innerText = 'Editar Empresa';

}
document.getElementById('empresaForm').onsubmit = e => {
  e.preventDefault();
  const idInput = document.getElementById('empresaId');
  const nome = document.getElementById('nome').value.trim();
  const endereco = document.getElementById('endereco').value.trim();
  const valorFrete = parseFloat(document.getElementById('valorFrete').value);
  if (idInput.value) {
    const emp = fEmpresas.find(e => e.id === idInput.value);
    emp.nome = nome; emp.endereco = endereco; emp.valorFrete = valorFrete;
  } else {
    fEmpresas.push({ id: Date.now().toString(), nome, endereco, valorFrete });
  }
  saveEmpresas();
  refreshEmpresas();
  e.target.reset();
  idInput.value = '';
  document.getElementById('tituloForm').innerText = 'Cadastrar Empresa';
};

document.getElementById('btnRegistrar').onclick = () => {
  const sel = document.getElementById('empresaSelect');
  const empId = sel.value;
  if (!empId) return alert('Selecione uma empresa!');
  const emp = fEmpresas.find(e => e.id === empId);
  fEntregas.push({ data: new Date().toLocaleDateString(), nome: emp.nome, valor: emp.valorFrete });
  localStorage.setItem('entregas', JSON.stringify(fEntregas));
  atualizarRelatorio();
};

function atualizarRelatorio() {
  const hoje = new Date().toLocaleDateString();
  document.getElementById('dataHoje').innerText = hoje;
  const relList = document.getElementById('relatorioList');
  relList.innerHTML = '';
  const hojeArr = fEntregas.filter(e => e.data === hoje);
  let soma = 0;
  hojeArr.forEach(e => {
    soma += e.valor;
    const li = document.createElement('li');
    li.className = 'list-group-item';
    li.innerText = `${e.nome}: R$ ${e.valor.toFixed(2)}`;
    relList.appendChild(li);
  });
  document.getElementById('totalHoje').innerText = soma.toFixed(2);
}

// Inicialização
loadEmpresas();
refreshEmpresas();
atualizarRelatorio();
