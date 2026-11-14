// Front-end do dashboard: busca os dados no servidor (/data), desenha o gráfico
// e atualiza os medidores. Também envia o formulário de SMS (/sendSMS).

const INTERVALO_ATUALIZACAO_MS = 30 * 1000;
let limite = 200; // atualizado a partir de /config
let grafico = null;

function atualizarMedidor(id, valor) {
    const medidor = document.getElementById(id);
    const nivel = medidor.querySelector('.meter-level');
    const indicador = medidor.querySelector('.meter-indicator');

    if (valor === null || Number.isNaN(valor)) {
        nivel.textContent = '-- cm';
        indicador.textContent = 'Sem dados';
        indicador.className = 'meter-indicator';
        return;
    }

    nivel.textContent = `${valor} cm`;
    if (valor > limite) {
        indicador.textContent = 'Nível acima do limite';
        indicador.className = 'meter-indicator alerta';
    } else {
        indicador.textContent = 'Nível normal';
        indicador.className = 'meter-indicator normal';
    }
}

function numero(valor) {
    const n = parseFloat(valor);
    return Number.isNaN(n) ? null : n;
}

function desenharGrafico(feeds) {
    const labels = feeds.map((f) => new Date(f.created_at).toLocaleTimeString('pt-BR'));
    const campo1 = feeds.map((f) => numero(f.field1));
    const campo2 = feeds.map((f) => numero(f.field2));

    const datasets = [{ label: 'Medidor 1 (cm)', data: campo1, borderColor: '#2563eb', tension: 0.2 }];
    if (campo2.some((v) => v !== null)) {
        datasets.push({ label: 'Medidor 2 (cm)', data: campo2, borderColor: '#16a34a', tension: 0.2 });
    }

    if (grafico) {
        grafico.data.labels = labels;
        grafico.data.datasets = datasets;
        grafico.update();
        return;
    }

    grafico = new Chart(document.getElementById('waterLevelChart'), {
        type: 'line',
        data: { labels, datasets },
        options: { responsive: true, animation: false, scales: { y: { title: { display: true, text: 'Nível (cm)' } } } }
    });
}

async function carregarDados() {
    const status = document.getElementById('status-conexao');
    try {
        const resposta = await fetch('/data');
        if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
        const feeds = await resposta.json();

        if (!feeds.length) {
            status.textContent = 'Nenhum dado recebido ainda.';
            return;
        }

        desenharGrafico(feeds);
        const ultimo = feeds[feeds.length - 1];
        atualizarMedidor('meter-1', numero(ultimo.field1));
        atualizarMedidor('meter-2', numero(ultimo.field2));
        status.textContent = `Última leitura: ${new Date(ultimo.created_at).toLocaleString('pt-BR')}`;
    } catch (erro) {
        console.error('Erro ao carregar dados:', erro);
        status.textContent = 'Não foi possível carregar os dados. Verifique o servidor e o arquivo .env.';
    }
}

async function carregarConfig() {
    try {
        const resposta = await fetch('/config');
        if (resposta.ok) limite = (await resposta.json()).limite;
    } catch (erro) {
        console.warn('Usando limite padrão:', limite);
    }
}

async function enviarSMS(phoneNumber, message) {
    try {
        const resposta = await fetch('/sendSMS', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneNumber, message })
        });
        if (resposta.ok) {
            alert('Mensagem SMS enviada com sucesso!');
        } else {
            const corpo = await resposta.json().catch(() => ({}));
            alert(corpo.error || 'Erro ao enviar mensagem SMS. Tente novamente.');
        }
    } catch (erro) {
        console.error('Erro ao enviar SMS:', erro);
        alert('Erro ao enviar mensagem SMS. Verifique a conexão com o servidor.');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('smsForm').addEventListener('submit', (evento) => {
        evento.preventDefault();
        enviarSMS(
            document.getElementById('phoneNumber').value,
            document.getElementById('message').value
        );
    });

    await carregarConfig();
    carregarDados();
    setInterval(carregarDados, INTERVALO_ATUALIZACAO_MS);
});
