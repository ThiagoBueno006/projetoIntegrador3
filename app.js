const formPesquisa = document.getElementById('formPesquisa');
const inputPesquisa = document.getElementById('produtoPesquisa');
const resultadoDescricao = document.querySelector('.consulta_resultado_descricao');
const quantidadeInput = document.getElementById('movimentoQuantidade');
const entradaBtn = document.getElementById('buttonEntrada');
const saidaBtn = document.getElementById('buttonSaida');
const mensagemMovimentacao = document.getElementById('mensagemMovimentacao');
let produtoAtual = null;

function criarDescricao(produto) {
  const status = produto.estoque_atual <= produto.estoque_minimo ? 'estoque baixo' : 'estoque normal';
  return `
    <p>Tipo: ${produto.tipo_lampada}</p>
    <p>Potência: ${produto.potencia}w</p>
    <p>Temperatura: ${produto.temperatura_cor}</p>
    <p>Fornecedor: ${produto.fornecedor}</p>
    <p>Estoque Atual: ${produto.estoque_atual} unidades</p>
    <p>Estoque Mínimo: ${produto.estoque_minimo} unidades</p>
    <p>Status: ${status}</p>
  `;
}

function exibirMensagem(texto, erro = false) {
  mensagemMovimentacao.textContent = texto;
  mensagemMovimentacao.style.color = erro ? '#c0392b' : '#27ae60';
}

async function buscarProduto(pesquisa) {
  const query = pesquisa ? `?search=${encodeURIComponent(pesquisa)}` : '';
  const response = await fetch(`/api/lampadas${query}`);
  const dados = await response.json();

  if (!response.ok) {
    exibirMensagem(dados.message || 'Erro ao buscar produto.', true);
    return;
  }

  if (!dados.length) {
    resultadoDescricao.innerHTML = '<p>Nenhum produto encontrado. Tente outro termo.</p>';
    produtoAtual = null;
    return;
  }

  produtoAtual = dados[0];
  resultadoDescricao.innerHTML = criarDescricao(produtoAtual);
  exibirMensagem('Produto carregado. Agora você pode registrar entrada ou saída.');
}

async function registrarMovimentacao(tipo) {
  if (!produtoAtual) {
    exibirMensagem('Pesquise um produto antes de registrar movimentação.', true);
    return;
  }

  const quantidade = Number(quantidadeInput.value);
  if (!Number.isInteger(quantidade) || quantidade <= 0) {
    exibirMensagem('Informe uma quantidade válida.', true);
    return;
  }

  const response = await fetch(`/api/lampadas/${produtoAtual.id_lampada}/movimentacao`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tipo, quantidade }),
  });

  const dados = await response.json();
  if (!response.ok) {
    exibirMensagem(dados.message || 'Erro ao registrar movimentação.', true);
    return;
  }

  produtoAtual = dados.produto;
  resultadoDescricao.innerHTML = criarDescricao(produtoAtual);
  exibirMensagem(dados.mensagem || 'Movimentação registrada com sucesso.');
}

formPesquisa.addEventListener('submit', (event) => {
  event.preventDefault();
  buscarProduto(inputPesquisa.value.trim());
});

entradaBtn.addEventListener('click', () => registrarMovimentacao('entrada'));
saidaBtn.addEventListener('click', () => registrarMovimentacao('saida'));

window.addEventListener('load', () => {
  resultadoDescricao.innerHTML = '<p>Pesquise um produto para ver os detalhes.</p>';
  quantidadeInput.value = 1;
});
