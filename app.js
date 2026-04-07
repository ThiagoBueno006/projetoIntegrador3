const inputProduto = document.getElementById('produtoPesquisa');
const produtosLista = document.getElementById('produtosLista');
const novoProdutoBtn = document.getElementById('novoProdutoBtn');
const produtoModal = document.getElementById('produtoModal');
const produtoForm = document.getElementById('produtoForm');
const produtoModalTitulo = document.getElementById('produtoModalTitulo');
const fecharProdutoModalBtn = document.getElementById('fecharProdutoModal');
const cancelarProdutoModalBtn = document.getElementById('cancelarProdutoModal');
const produtoIdInput = document.getElementById('produtoId');
const produtoTipoInput = document.getElementById('produtoTipo');
const produtoFornecedorInput = document.getElementById('produtoFornecedor');
const produtoPotenciaInput = document.getElementById('produtoPotencia');
const produtoTemperaturaInput = document.getElementById('produtoTemperatura');
const produtoEstoqueAtualInput = document.getElementById('produtoEstoqueAtual');
const produtoEstoqueMinimoInput = document.getElementById('produtoEstoqueMinimo');
const resultadoDescricao = document.getElementById('produtoInfo') || document.querySelector('.consulta_resultado_descricao');
const dashboardProdutoSelect = document.getElementById('dashboardProdutoSelect');
const dashboardProdutoInfo = document.getElementById('dashboardProdutoInfo');
const dashboardMovimentoForm = document.getElementById('dashboardMovimentoForm');
const dashboardMovimentoProduto = document.getElementById('dashboardMovimentoProduto');
const dashboardQuantidadeInput = document.getElementById('dashboardQuantidade');
const dashboardMensagem = document.getElementById('dashboardMensagem');
const notaNumeroInput = document.getElementById('notaNumero');
const notaDataInput = document.getElementById('notaData');
const dashboardObservacaoInput = document.getElementById('dashboardObservacao');
const tipoEntradaBtn = document.getElementById('tipoEntradaBtn');
const tipoSaidaBtn = document.getElementById('tipoSaidaBtn');
const dashboardMovimentoSubmit = document.getElementById('dashboardMovimentoSubmit');
const filtroTipoMovimentacao = document.getElementById('filtroTipoMovimentacao');
const filtroProdutoMovimentacao = document.getElementById('filtroProdutoMovimentacao');
let produtoAtual = null;
let graficoDashboard = null;
let graficoTendenciaMensal = null;
let graficoDistribuicaoEstoque = null;
let produtosDashboard = [];
let produtosCatalogo = [];
let historicoMovimentacoes = [];
let tipoMovimentacaoAtual = 'entrada';

function criarDescricao(produto) {
  const temperatura = produto.temperatura_cor || '-';
  const estoqueMinimo = produto.estoque_minimo ?? '-';
  const status = produto.estoque_atual <= produto.estoque_minimo ? 'Estoque baixo' : 'Normal';
  const statusClasse = produto.estoque_atual <= produto.estoque_minimo ? 'produto-status--alerta' : 'produto-status--ok';
  const dataAtualizacao = new Date().toLocaleDateString('pt-BR');

  return `
    <div class="produto-detalhes__icone">💡</div>
    <div class="produto-detalhes__topo">
      <p class="produto-detalhes__titulo">${produto.tipo_lampada}</p>
      <p class="produto-detalhes__meta">${produto.fornecedor} • ${produto.potencia}W • ${temperatura}</p>
    </div>
    <div class="produto-detalhes__stats">
      <div class="produto-stat">
        <span>Estoque</span>
        <strong>${produto.estoque_atual}</strong>
      </div>
      <div class="produto-stat">
        <span>Mínimo</span>
        <strong>${estoqueMinimo}</strong>
      </div>
    </div>
    <div class="produto-detalhes__linhas">
      <div class="produto-detalhes__linha"><span>Fornecedor</span><strong>${produto.fornecedor}</strong></div>
      <div class="produto-detalhes__linha"><span>Status</span><strong class="produto-status ${statusClasse}">${status}</strong></div>
      <div class="produto-detalhes__linha"><span>Última atualização</span><strong>${dataAtualizacao}</strong></div>
    </div>
  `;
}

function exibirMensagem(texto, erro = false, elemento = null) {
  const alvo = elemento || dashboardMensagem;

  if (!alvo) {
    return;
  }

  alvo.textContent = texto;
  alvo.style.color = erro ? '#ff6b6b' : '#2ecc71';
}

function produtoEstaBaixo(produto) {
  return Number(produto.estoque_atual) <= Number(produto.estoque_minimo);
}

function formatarNumero(valor) {
  return Number(valor || 0).toLocaleString('pt-BR');
}

function formatarRotuloMes(valor) {
  const [mes, ano] = String(valor || '').split('/');
  const nomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const indice = Number(mes) - 1;

  return indice >= 0 && nomes[indice] ? `${nomes[indice]}/${String(ano || '').slice(-2)}` : valor;
}

function renderizarProdutosCatalogo(produtos) {
  if (!produtosLista) {
    return;
  }

  if (!produtos.length) {
    produtosLista.innerHTML = '<p class="produtos-vazio">Nenhum produto encontrado.</p>';
    return;
  }

  produtosLista.innerHTML = produtos.map(produto => {
    const baixo = produtoEstaBaixo(produto);
    const specs = `${produto.tipo_lampada} • ${produto.potencia}W • ${produto.temperatura_cor}`;
    const ativo = produtoAtual && String(produtoAtual.id_lampada) === String(produto.id_lampada) ? 'ativo' : '';

    return `
      <div class="produto-row ${ativo}" data-id="${produto.id_lampada}">
        <div class="produto-nome">
          <span class="produto-icone">💡</span>
          <strong>${produto.tipo_lampada}</strong>
        </div>
        <div class="produto-especificacoes">${specs}</div>
        <div class="produto-fornecedor">${produto.fornecedor}</div>
        <div class="produto-estoque">${produto.estoque_atual}</div>
        <div><span class="produto-badge ${baixo ? 'produto-badge--baixo' : 'produto-badge--normal'}">${baixo ? 'Baixo' : 'Normal'}</span></div>
        <div class="produto-acoes">
          <button type="button" class="produto-acao-btn" data-action="select" data-id="${produto.id_lampada}" title="Selecionar">👁</button>
          <button type="button" class="produto-acao-btn" data-action="edit" data-id="${produto.id_lampada}" title="Editar">✏️</button>
          <button type="button" class="produto-acao-btn" data-action="delete" data-id="${produto.id_lampada}" title="Excluir">🗑️</button>
        </div>
      </div>
    `;
  }).join('');
}

async function carregarProdutosCatalogo(termo = '') {
  if (!produtosLista) {
    return;
  }

  try {
    const query = termo ? `?search=${encodeURIComponent(termo)}` : '';
    const response = await fetch(`/api/lampadas${query}`);
    const dados = await response.json();

    if (!response.ok) {
      throw new Error(dados.message || 'Erro ao carregar produtos');
    }

    produtosCatalogo = dados;
    renderizarProdutosCatalogo(dados);
  } catch (error) {
    console.error('Erro ao carregar catálogo:', error);
    produtosLista.innerHTML = '<p class="produtos-vazio">Não foi possível carregar os produtos.</p>';
  }
}

function abrirProdutoModal(produto = null) {
  if (!produtoModal || !produtoForm) {
    return;
  }

  produtoModalTitulo.textContent = produto ? 'Editar Produto' : 'Novo Produto';
  produtoIdInput.value = produto?.id_lampada || '';
  produtoTipoInput.value = produto?.tipo_lampada || '';
  produtoFornecedorInput.value = produto?.fornecedor || '';
  produtoPotenciaInput.value = produto?.potencia || '';
  produtoTemperaturaInput.value = produto?.temperatura_cor || '';
  produtoEstoqueAtualInput.value = produto?.estoque_atual ?? 0;
  produtoEstoqueMinimoInput.value = produto?.estoque_minimo ?? 0;

  produtoModal.classList.add('aberto');
  produtoModal.setAttribute('aria-hidden', 'false');
}

function fecharProdutoModal() {
  if (!produtoModal || !produtoForm) {
    return;
  }

  produtoForm.reset();
  produtoIdInput.value = '';
  produtoModal.classList.remove('aberto');
  produtoModal.setAttribute('aria-hidden', 'true');
}

async function salvarProduto(event) {
  event.preventDefault();

  const id = produtoIdInput.value;
  const payload = {
    tipo_lampada: produtoTipoInput.value.trim(),
    fornecedor: produtoFornecedorInput.value.trim(),
    potencia: Number(produtoPotenciaInput.value),
    temperatura_cor: produtoTemperaturaInput.value.trim(),
    estoque_atual: Number(produtoEstoqueAtualInput.value),
    estoque_minimo: Number(produtoEstoqueMinimoInput.value),
  };

  const response = await fetch(id ? `/api/lampadas/${id}` : '/api/lampadas', {
    method: id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const dados = await response.json();

  if (!response.ok) {
    alert(dados.message || 'Erro ao salvar produto.');
    return;
  }

  fecharProdutoModal();
  await carregarProdutosCatalogo(inputProduto?.value.trim() || '');
  await carregarConsultaDashboard();
  await carregarDashboard();
  await carregarAnalises();
  selecionarProduto(dados);
}

async function excluirProduto(id) {
  const confirmar = window.confirm('Deseja realmente excluir este produto?');
  if (!confirmar) {
    return;
  }

  const response = await fetch(`/api/lampadas/${id}`, { method: 'DELETE' });
  const dados = await response.json();

  if (!response.ok) {
    alert(dados.message || 'Erro ao excluir produto.');
    return;
  }

  if (produtoAtual && String(produtoAtual.id_lampada) === String(id)) {
    produtoAtual = null;
    if (dashboardProdutoInfo) {
      dashboardProdutoInfo.innerHTML = '<p>Selecione um produto para visualizar os dados.</p>';
    }
  }

  await carregarProdutosCatalogo(inputProduto?.value.trim() || '');
  await carregarConsultaDashboard();
  await carregarDashboard();
  await carregarMovimentacoes();
  await carregarAnalises();
}

function selecionarProduto(produto) {
  produtoAtual = produto;

  if (inputProduto) {
    inputProduto.value = produto.tipo_lampada;
  }

  if (dashboardProdutoSelect) {
    dashboardProdutoSelect.value = String(produto.id_lampada);
  }

  if (dashboardMovimentoProduto) {
    dashboardMovimentoProduto.value = String(produto.id_lampada);
  }

  if (resultadoDescricao) {
    resultadoDescricao.innerHTML = criarDescricao(produtoAtual);
  }

  if (dashboardProdutoInfo) {
    dashboardProdutoInfo.innerHTML = criarDescricao(produtoAtual);
  }

  exibirMensagem('Produto carregado. Agora você pode registrar entrada ou saída.', false, dashboardMensagem);

  renderizarProdutosCatalogo(produtosCatalogo);
}

function definirTipoMovimentacao(tipo) {
  tipoMovimentacaoAtual = tipo;

  if (tipoEntradaBtn) {
    tipoEntradaBtn.classList.toggle('ativo', tipo === 'entrada');
  }

  if (tipoSaidaBtn) {
    tipoSaidaBtn.classList.toggle('ativo', tipo === 'saida');
  }

  if (dashboardMovimentoSubmit) {
    dashboardMovimentoSubmit.textContent = tipo === 'entrada' ? 'Registrar Entrada' : 'Registrar Saída';
    dashboardMovimentoSubmit.classList.toggle('saida', tipo === 'saida');
  }
}

async function registrarMovimentacaoDashboard(event) {
  event.preventDefault();

  const produtoId = dashboardMovimentoProduto?.value || produtoAtual?.id_lampada;
  const quantidade = Number(dashboardQuantidadeInput?.value || 0);

  if (!produtoId) {
    exibirMensagem('Selecione um produto para movimentar.', true, dashboardMensagem);
    return;
  }

  if (!Number.isInteger(quantidade) || quantidade <= 0) {
    exibirMensagem('Informe uma quantidade válida.', true, dashboardMensagem);
    return;
  }

  const payload = {
    tipo: tipoMovimentacaoAtual,
    quantidade,
    numeroNota: notaNumeroInput?.value?.trim() || undefined,
    dataEmissao: notaDataInput?.value || undefined,
    observacao: dashboardObservacaoInput?.value?.trim() || undefined,
  };

  const response = await fetch(`/api/lampadas/${produtoId}/movimentacao`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const dados = await response.json();

  if (!response.ok) {
    exibirMensagem(dados.message || 'Erro ao registrar movimentação.', true, dashboardMensagem);
    return;
  }

  if (dados.produto) {
    selecionarProduto(dados.produto);
  }

  exibirMensagem(dados.mensagem || 'Movimentação registrada com sucesso.', false, dashboardMensagem);

  if (dashboardQuantidadeInput) dashboardQuantidadeInput.value = 1;
  if (dashboardObservacaoInput) dashboardObservacaoInput.value = '';
  if (notaNumeroInput) notaNumeroInput.value = '';

  carregarDashboard();
  carregarMovimentacoes();
  carregarAnalises();
}

async function carregarDashboard() {
  const totalProdutosEl = document.getElementById('totalProdutos');
  const totalEstoqueEl = document.getElementById('totalEstoque');
  const estoqueBaixoEl = document.getElementById('estoqueBaixo');
  const graficoEl = document.getElementById('grafico');

  if (!totalProdutosEl || !totalEstoqueEl || !estoqueBaixoEl || !graficoEl) {
    return;
  }

  try {
    const res = await fetch('/api/dashboard');
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Erro ao carregar dashboard');
    }

    totalProdutosEl.innerText = data.totalProdutos;
    totalEstoqueEl.innerText = data.totalEstoque;
    estoqueBaixoEl.innerText = data.estoqueBaixo;

    const labels = data.produtos.map(p => p.tipo_lampada);
    const valores = data.produtos.map(p => p.estoque_atual);

    if (graficoDashboard) {
      graficoDashboard.destroy();
    }

    graficoDashboard = new Chart(graficoEl, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Estoque por Produto',
          data: valores,
          backgroundColor: 'rgba(245, 166, 35, 0.65)',
          borderColor: '#f5a623',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: '#30577e'
            }
          }
        },
        scales: {
          x: {
            ticks: { color: '#5b6d86' },
            grid: { color: 'rgba(48,87,126,0.08)' }
          },
          y: {
            ticks: { color: '#5b6d86' },
            grid: { color: 'rgba(48,87,126,0.08)' }
          }
        }
      }
    });
  } catch (error) {
    console.error('Erro ao carregar dashboard:', error);
  }
}

async function carregarAnalises() {
  const totalEntradasEl = document.getElementById('analiseTotalEntradas');
  const totalSaidasEl = document.getElementById('analiseTotalSaidas');
  const produtoTopEl = document.getElementById('analiseProdutoTop');
  const produtoTopMetaEl = document.getElementById('analiseProdutoTopMeta');
  const reposicaoEl = document.getElementById('analiseReposicao');
  const reposicaoMetaEl = document.getElementById('analiseReposicaoMeta');
  const historicoBody = document.getElementById('analiseHistoricoBody');
  const tendenciaCanvas = document.getElementById('graficoTendenciaMensal');
  const distribuicaoCanvas = document.getElementById('graficoDistribuicaoEstoque');

  if (!totalEntradasEl || !totalSaidasEl || !produtoTopEl || !reposicaoEl || !tendenciaCanvas || !distribuicaoCanvas) {
    return;
  }

  try {
    const res = await fetch('/api/analises');
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Erro ao carregar análises');
    }

    totalEntradasEl.innerText = formatarNumero(data.totalEntradas30d);
    totalSaidasEl.innerText = formatarNumero(data.totalSaidas30d);
    reposicaoEl.innerText = formatarNumero(data.alertasReposicao);

    if (reposicaoMetaEl) {
      reposicaoMetaEl.innerText = Number(data.alertasReposicao) === 1
        ? 'produto abaixo do mínimo'
        : 'produtos abaixo do mínimo';
    }

    if (data.produtoMaisMovimentado) {
      produtoTopEl.innerText = data.produtoMaisMovimentado.tipo_lampada;
      if (produtoTopMetaEl) {
        produtoTopMetaEl.innerText = `${formatarNumero(data.produtoMaisMovimentado.total_quantidade)} unidades movimentadas`;
      }
    } else {
      produtoTopEl.innerText = 'Sem dados';
      if (produtoTopMetaEl) {
        produtoTopMetaEl.innerText = 'Aguardando histórico suficiente';
      }
    }

    const labelsTendencia = data.tendenciaMensal.map(item => formatarRotuloMes(item.mes));

    if (graficoTendenciaMensal) {
      graficoTendenciaMensal.destroy();
    }

    graficoTendenciaMensal = new Chart(tendenciaCanvas, {
      type: 'line',
      data: {
        labels: labelsTendencia,
        datasets: [
          {
            label: 'Entradas',
            data: data.tendenciaMensal.map(item => item.entradas),
            borderColor: '#f0c34e',
            backgroundColor: 'rgba(240, 195, 78, 0.18)',
            pointBackgroundColor: '#f0c34e',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            borderWidth: 3,
            tension: 0.42,
            fill: false,
          },
          {
            label: 'Saídas',
            data: data.tendenciaMensal.map(item => item.saidas),
            borderColor: '#69aee8',
            backgroundColor: 'rgba(105, 174, 232, 0.18)',
            pointBackgroundColor: '#69aee8',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            borderWidth: 3,
            tension: 0.42,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        layout: {
          padding: { top: 8, right: 8, bottom: 0, left: 4 },
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#4f6480',
              usePointStyle: true,
              pointStyle: 'circle',
              boxWidth: 10,
              padding: 24,
              font: { family: 'Inter', size: 12, weight: '600' },
            },
          },
          tooltip: {
            backgroundColor: 'rgba(10, 23, 49, 0.94)',
            titleColor: '#eef4ff',
            bodyColor: '#eef4ff',
            padding: 10,
            usePointStyle: true,
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
              drawBorder: true,
            },
            border: { color: 'rgba(48,87,126,0.35)' },
            ticks: {
              color: '#6d7f98',
              font: { family: 'Inter', size: 11, weight: '600' },
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(48,87,126,0.08)',
              borderDash: [4, 4],
            },
            border: { display: false },
            ticks: {
              color: '#6d7f98',
              precision: 0,
              font: { family: 'Inter', size: 11 },
            },
          },
        },
      },
    });

    if (graficoDistribuicaoEstoque) {
      graficoDistribuicaoEstoque.destroy();
    }

    graficoDistribuicaoEstoque = new Chart(distribuicaoCanvas, {
      type: 'bar',
      data: {
        labels: data.estoquePorTipo.map(item => item.tipo_lampada),
        datasets: [{
          label: 'Estoque Atual',
          data: data.estoquePorTipo.map(item => item.estoque_atual),
          backgroundColor: 'rgba(72, 133, 234, 0.95)',
          hoverBackgroundColor: 'rgba(97, 155, 248, 1)',
          borderRadius: 6,
          borderSkipped: false,
          maxBarThickness: 26,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: { top: 8, right: 12, bottom: 6, left: 8 },
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: 'rgba(10, 23, 49, 0.94)',
            titleColor: '#eef4ff',
            bodyColor: '#eef4ff',
            padding: 10,
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              color: '#9fb2d1',
              precision: 0,
              stepSize: 9,
              font: { family: 'Inter', size: 11, weight: '600' },
            },
            grid: {
              color: 'rgba(72, 133, 234, 0.10)',
              borderDash: [2, 4],
            },
            border: { display: false },
          },
          y: {
            ticks: {
              color: '#dbe7ff',
              font: { family: 'Inter', size: 11, weight: '600' },
            },
            grid: { display: false },
            border: { display: false },
          },
        },
      },
    });

    if (historicoBody) {
      if (!data.historicoRecente.length) {
        historicoBody.innerHTML = '<tr><td colspan="5" class="analise-historico-vazio">Nenhuma movimentação encontrada.</td></tr>';
      } else {
        historicoBody.innerHTML = data.historicoRecente.map(item => {
          const dataObj = item.data_emissao ? new Date(item.data_emissao) : null;
          const dataFormatada = dataObj ? dataObj.toLocaleDateString('pt-BR') : '-';
          const badgeClasse = item.tipo === 'entrada' ? 'tipo-badge tipo-badge--entrada' : 'tipo-badge tipo-badge--saida';
          const quantidadeClasse = item.tipo === 'entrada' ? 'quantidade-valor quantidade-valor--entrada' : 'quantidade-valor quantidade-valor--saida';
          const quantidadeValor = `${item.tipo === 'entrada' ? '+' : '-'}${item.quantidade}`;

          return `
            <tr>
              <td>${dataFormatada}</td>
              <td><strong>${item.tipo_lampada}</strong></td>
              <td><span class="${badgeClasse}">${item.tipo === 'entrada' ? 'Entrada' : 'Saída'}</span></td>
              <td><span class="${quantidadeClasse}">${quantidadeValor}</span></td>
              <td>${item.numero_nota || '-'}</td>
            </tr>
          `;
        }).join('');
      }
    }
  } catch (error) {
    console.error('Erro ao carregar análises:', error);

    if (historicoBody) {
      historicoBody.innerHTML = '<tr><td colspan="5" class="analise-historico-vazio">Não foi possível carregar as análises.</td></tr>';
    }
  }
}

async function carregarConsultaDashboard() {
  if (!dashboardProdutoSelect && !dashboardMovimentoProduto && !filtroProdutoMovimentacao) {
    return;
  }

  try {
    const res = await fetch('/api/lampadas');
    const dados = await res.json();

    if (!res.ok) {
      throw new Error(dados.message || 'Erro ao carregar produtos do dashboard');
    }

    produtosDashboard = dados;

    const montarOptions = (selectEl, textoInicial, valorPadrao = '') => {
      if (!selectEl) return;

      selectEl.innerHTML = `<option value="${valorPadrao}">${textoInicial}</option>`;
      dados.forEach(produto => {
        const option = document.createElement('option');
        option.value = produto.id_lampada;
        option.textContent = `${produto.tipo_lampada} - ${produto.fornecedor}`;
        selectEl.appendChild(option);
      });
    };

    montarOptions(dashboardProdutoSelect, 'Escolha um produto...');
    montarOptions(dashboardMovimentoProduto, 'Selecione a lâmpada...');
    montarOptions(filtroProdutoMovimentacao, 'Todos os produtos', 'todos');

    if (!produtoAtual && dados.length) {
      selecionarProduto(dados[0]);
    }
  } catch (error) {
    console.error('Erro ao carregar consulta do dashboard:', error);
  }
}

function renderizarHistoricoMovimentacoes() {
  const tbody = document.querySelector('#tabelaMovimentacoes tbody');

  if (!tbody) {
    return;
  }

  const tipoSelecionado = filtroTipoMovimentacao?.value || 'todos';
  const produtoSelecionado = filtroProdutoMovimentacao?.value || 'todos';

  const dadosFiltrados = historicoMovimentacoes.filter(item => {
    const correspondeTipo = tipoSelecionado === 'todos' || item.tipo === tipoSelecionado;
    const correspondeProduto = produtoSelecionado === 'todos' || String(item.id_lampada) === String(produtoSelecionado);
    return correspondeTipo && correspondeProduto;
  });

  if (!dadosFiltrados.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="movimentacoes-vazio">Nenhuma movimentação encontrada.</td></tr>';
    return;
  }

  tbody.innerHTML = dadosFiltrados.map(m => {
    const dataObj = m.data_emissao ? new Date(m.data_emissao) : null;
    const dataFormatada = dataObj ? dataObj.toLocaleDateString('pt-BR') : '-';
    const horaFormatada = dataObj ? dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--';
    const badgeClasse = m.tipo === 'entrada' ? 'tipo-badge tipo-badge--entrada' : 'tipo-badge tipo-badge--saida';
    const quantidadeClasse = m.tipo === 'entrada' ? 'quantidade-valor quantidade-valor--entrada' : 'quantidade-valor quantidade-valor--saida';
    const quantidadeValor = `${m.tipo === 'entrada' ? '+' : '-'}${m.quantidade}`;
    const observacoes = m.observacoes && m.observacoes.trim() ? m.observacoes : 'Sem observações';

    return `
      <tr>
        <td><div class="mov-data"><strong>${dataFormatada}</strong><span>${horaFormatada}</span></div></td>
        <td><strong>${m.tipo_lampada}</strong></td>
        <td><span class="${badgeClasse}">${m.tipo === 'entrada' ? '↘ Entrada' : '↗ Saída'}</span></td>
        <td><span class="${quantidadeClasse}">${quantidadeValor}</span></td>
        <td>${m.numero_nota || '-'}</td>
        <td>${observacoes}</td>
      </tr>
    `;
  }).join('');
}

async function carregarMovimentacoes() {
  const tbody = document.querySelector('#tabelaMovimentacoes tbody');

  if (!tbody) {
    return;
  }

  try {
    const res = await fetch('/api/movimentacoes');
    const dados = await res.json();

    if (!res.ok) {
      throw new Error(dados.message || 'Erro ao carregar movimentações');
    }

    historicoMovimentacoes = dados;
    renderizarHistoricoMovimentacoes();
  } catch (error) {
    console.error('Erro ao carregar histórico:', error);
    tbody.innerHTML = '<tr><td colspan="6" class="movimentacoes-vazio">Não foi possível carregar o histórico.</td></tr>';
  }
}

function navegar(pagina) {
  const paginas = document.querySelectorAll('.pagina');
  const links = document.querySelectorAll('.nav_links a');
  const destino = document.getElementById(pagina);

  if (!destino) {
    return;
  }

  paginas.forEach(p => p.classList.remove('ativa'));
  links.forEach(link => link.classList.remove('ativo'));

  destino.classList.add('ativa');
  window.location.hash = pagina;

  const linkAtivo = document.querySelector(`.nav_links a[data-pagina="${pagina}"]`);
  if (linkAtivo) {
    linkAtivo.classList.add('ativo');
  }

  if (pagina === 'dashboard') {
    carregarDashboard();
    carregarConsultaDashboard();
  }

  if (pagina === 'analises') {
    carregarAnalises();
  }

  if (pagina === 'produtos') {
    carregarProdutosCatalogo(inputProduto?.value.trim() || '');
  }

  if (pagina === 'movimentacoes') {
    carregarConsultaDashboard();
    carregarMovimentacoes();
  }
}

if (inputProduto) {
  inputProduto.addEventListener('input', async () => {
    await carregarProdutosCatalogo(inputProduto.value.trim());
  });
}

if (dashboardProdutoSelect) {
  dashboardProdutoSelect.addEventListener('change', () => {
    const produto = produtosDashboard.find(p => String(p.id_lampada) === dashboardProdutoSelect.value);

    if (produto) {
      selecionarProduto(produto);
      return;
    }

    if (dashboardProdutoInfo) {
      dashboardProdutoInfo.innerHTML = '<p>Selecione um produto para visualizar os dados.</p>';
    }
  });
}

if (dashboardMovimentoProduto) {
  dashboardMovimentoProduto.addEventListener('change', () => {
    const produto = produtosDashboard.find(p => String(p.id_lampada) === dashboardMovimentoProduto.value);
    if (produto) {
      selecionarProduto(produto);
    }
  });
}

if (tipoEntradaBtn) {
  tipoEntradaBtn.addEventListener('click', () => definirTipoMovimentacao('entrada'));
}

if (tipoSaidaBtn) {
  tipoSaidaBtn.addEventListener('click', () => definirTipoMovimentacao('saida'));
}

if (dashboardMovimentoForm) {
  dashboardMovimentoForm.addEventListener('submit', registrarMovimentacaoDashboard);
}

if (produtosLista) {
  produtosLista.addEventListener('click', (event) => {
    const botao = event.target.closest('.produto-acao-btn');
    const linha = event.target.closest('.produto-row');
    const id = botao?.dataset.id || linha?.dataset.id;

    if (!id) {
      return;
    }

    const produto = produtosCatalogo.find(item => String(item.id_lampada) === String(id));
    if (!produto) {
      return;
    }

    if (botao) {
      const action = botao.dataset.action;

      if (action === 'select') {
        selecionarProduto(produto);
        navegar('dashboard');
      }

      if (action === 'edit') {
        abrirProdutoModal(produto);
      }

      if (action === 'delete') {
        excluirProduto(produto.id_lampada);
      }

      return;
    }

    selecionarProduto(produto);
  });
}

if (novoProdutoBtn) {
  novoProdutoBtn.addEventListener('click', () => abrirProdutoModal());
}

if (produtoForm) {
  produtoForm.addEventListener('submit', salvarProduto);
}

if (fecharProdutoModalBtn) {
  fecharProdutoModalBtn.addEventListener('click', fecharProdutoModal);
}

if (cancelarProdutoModalBtn) {
  cancelarProdutoModalBtn.addEventListener('click', fecharProdutoModal);
}

if (produtoModal) {
  produtoModal.addEventListener('click', (event) => {
    if (event.target === produtoModal) {
      fecharProdutoModal();
    }
  });
}

if (filtroTipoMovimentacao) {
  filtroTipoMovimentacao.addEventListener('change', renderizarHistoricoMovimentacoes);
}

if (filtroProdutoMovimentacao) {
  filtroProdutoMovimentacao.addEventListener('change', renderizarHistoricoMovimentacoes);
}

window.addEventListener('load', () => {
  if (resultadoDescricao) {
    resultadoDescricao.innerHTML = '<p>Selecione um produto...</p>';
  }

  if (dashboardQuantidadeInput) {
    dashboardQuantidadeInput.value = 1;
  }

  if (notaDataInput && !notaDataInput.value) {
    notaDataInput.value = new Date().toISOString().slice(0, 10);
  }

  definirTipoMovimentacao('entrada');

  const paginaInicial = window.location.hash.replace('#', '') || 'dashboard';

  if (document.getElementById('produtos')) {
    navegar(paginaInicial);
    carregarProdutosCatalogo(inputProduto?.value.trim() || '');
  }
});
