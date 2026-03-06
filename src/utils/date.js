// formatarData formata um Date para 'Dia da semana, DD/MM/AAAA'
export function formatarData(data) {
    const dt = data.toDate ? data.toDate() : new Date(data);
    const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const diaSemana = diasSemana[dt.getDay()];
    const dia = String(dt.getDate()).padStart(2, '0');
    const mes = String(dt.getMonth() + 1).padStart(2, '0');
    const ano = dt.getFullYear();
    return `${diaSemana}, ${dia}/${mes}/${ano}`;
}

// dataFormatadaParaConsulta formata um Date para 'DD/MM/AAAA'
export function dataFormatadaParaConsulta(data) {
    const dt = data.toDate ? data.toDate() : new Date(data);
    const dia = String(dt.getDate()).padStart(2, '0');
    const mes = String(dt.getMonth() + 1).padStart(2, '0');
    const ano = dt.getFullYear();
    return `${dia}/${mes}/${ano}`;
}

export function nomeDiaSemana(dateStr) {
    const [d, m, y] = dateStr.split("/").map(Number);
    const date = new Date(y, m - 1, d);
    const dias = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    return dias[date.getDay()];
}

export function criarInicioDoDiaLocal(dateStr) {
    const [ano, mes, dia] = dateStr.split("-");
    return new Date(+ano, +mes - 1, +dia, 0, 0, 0, 0);
}

export function criarFimDoDiaLocal(dateStr) {
    const [ano, mes, dia] = dateStr.split("-");
    return new Date(+ano, +mes - 1, +dia, 23, 59, 59, 999);
}
