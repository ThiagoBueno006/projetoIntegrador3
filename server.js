require('dotenv').config();

const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
const databaseConfigured = Boolean(process.env.DATABASE_URL);
const databaseSslDisabled = ['false', '0', 'off', 'disable', 'disabled'].includes(
  String(process.env.DATABASE_SSL || '').toLowerCase()
);
let databaseStatus = databaseConfigured ? 'connecting' : 'not-configured';
let databaseMessage = databaseConfigured
  ? 'Tentando conectar ao PostgreSQL/Neon.'
  : 'Defina DATABASE_URL para habilitar a integração com o banco.';

const pool = databaseConfigured
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: databaseSslDisabled ? false : { rejectUnauthorized: false },
    })
  : null;

function respostaDashboardVazia() {
  return {
    totalProdutos: 0,
    totalEstoque: 0,
    estoqueBaixo: 0,
    produtos: [],
  };
}

function respostaAnalisesVazia() {
  return {
    totalEntradas30d: 0,
    totalSaidas30d: 0,
    alertasReposicao: 0,
    produtoMaisMovimentado: null,
    estoquePorTipo: [],
    tendenciaMensal: [],
    historicoRecente: [],
  };
}

function respostaBancoIndisponivel(res) {
  return res.status(503).json({
    message: 'Banco de dados não configurado. Defina DATABASE_URL para habilitar os dados.',
  });
}

if (pool) {
  pool.connect()
    .then(async client => {
      databaseStatus = 'connected';
      databaseMessage = 'Conectado ao PostgreSQL/Neon com sucesso.';
      console.log('✅ Conectado ao banco de dados PostgreSQL');

      try {
        await client.query('ALTER TABLE nota_compra ADD COLUMN IF NOT EXISTS observacoes TEXT');
        await client.query('ALTER TABLE nota_venda ADD COLUMN IF NOT EXISTS observacoes TEXT');
      } catch (schemaError) {
        console.error('⚠️ Não foi possível garantir as colunas opcionais:', schemaError.message);
      }

      client.release();
    })
    .catch(err => {
      databaseStatus = 'error';
      databaseMessage = `Falha ao conectar ao banco: ${err.message}`;
      console.error('❌ Erro ao conectar ao banco de dados:', err.message);
      console.log('ℹ️ Servidor continuará rodando sem banco de dados');
    });
} else {
  console.warn('⚠️ DATABASE_URL não configurada. A aplicação será exibida com dados vazios no ambiente local.');
}

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
  console.log('📄 Rota / chamada, servindo index.html');
  const filePath = path.join(__dirname, 'index.html');
  console.log('📂 Caminho do arquivo:', filePath);
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('❌ Erro ao servir index.html:', err);
      res.status(500).send('Erro interno do servidor');
    }
  });
});

app.get('/health', (req, res) => {
  console.log('🏥 Health check chamado');
  res.json({
    status: 'OK',
    message: 'Servidor funcionando',
    database: databaseStatus,
    databaseConfigured,
    databaseMessage,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/dashboard', async (req, res) => {
  if (!pool) {
    return res.json(respostaDashboardVazia());
  }

  try {
    const totalProdutos = await pool.query('SELECT COUNT(*) FROM lampadas');
    const totalEstoque = await pool.query('SELECT SUM(estoque_atual) FROM lampadas');
    const estoqueBaixo = await pool.query('SELECT COUNT(*) FROM lampadas WHERE estoque_atual <= estoque_minimo');
    const produtos = await pool.query('SELECT tipo_lampada, estoque_atual FROM lampadas LIMIT 10');

    res.json({
      totalProdutos: Number(totalProdutos.rows[0].count),
      totalEstoque: Number(totalEstoque.rows[0].sum || 0),
      estoqueBaixo: Number(estoqueBaixo.rows[0].count),
      produtos: produtos.rows
    });
  } catch (error) {
    console.error('Erro no dashboard:', error);
    res.status(500).json({ message: 'Erro no dashboard' });
  }
});

app.get('/api/analises', async (req, res) => {
  if (!pool) {
    return res.json(respostaAnalisesVazia());
  }

  try {
    const [
      entradas30d,
      saidas30d,
      alertasReposicao,
      produtoMaisMovimentado,
      estoquePorTipo,
      tendenciaMensal,
      historicoRecente,
    ] = await Promise.all([
      pool.query(`
        SELECT COALESCE(SUM(ic.quantidade), 0) AS total
        FROM item_nota_compra ic
        JOIN nota_compra nc ON nc.id_nota_compra = ic.id_nota_compra
        WHERE nc.data_emissao >= CURRENT_DATE - INTERVAL '30 days'
      `),
      pool.query(`
        SELECT COALESCE(SUM(iv.quantidade), 0) AS total
        FROM item_nota_venda iv
        JOIN nota_venda nv ON nv.id_nota_venda = iv.id_nota_venda
        WHERE nv.data_emissao >= CURRENT_DATE - INTERVAL '30 days'
      `),
      pool.query(`
        SELECT COUNT(*) AS total
        FROM lampadas
        WHERE estoque_atual <= estoque_minimo
      `),
      pool.query(`
        WITH movimentacoes AS (
          SELECT id_lampada, quantidade FROM item_nota_compra
          UNION ALL
          SELECT id_lampada, quantidade FROM item_nota_venda
        )
        SELECT l.tipo_lampada, COALESCE(SUM(m.quantidade), 0) AS total_quantidade
        FROM movimentacoes m
        JOIN lampadas l ON l.id_lampada = m.id_lampada
        GROUP BY l.tipo_lampada
        ORDER BY total_quantidade DESC, l.tipo_lampada ASC
        LIMIT 1
      `),
      pool.query(`
        SELECT tipo_lampada, estoque_atual
        FROM lampadas
        ORDER BY estoque_atual DESC, tipo_lampada ASC
        LIMIT 8
      `),
      pool.query(`
        WITH meses AS (
          SELECT generate_series(
            (date_trunc('month', CURRENT_DATE) - INTERVAL '5 months')::date,
            date_trunc('month', CURRENT_DATE)::date,
            INTERVAL '1 month'
          )::date AS mes
        ),
        entradas AS (
          SELECT date_trunc('month', nc.data_emissao)::date AS mes, SUM(ic.quantidade) AS total
          FROM item_nota_compra ic
          JOIN nota_compra nc ON nc.id_nota_compra = ic.id_nota_compra
          GROUP BY 1
        ),
        saidas AS (
          SELECT date_trunc('month', nv.data_emissao)::date AS mes, SUM(iv.quantidade) AS total
          FROM item_nota_venda iv
          JOIN nota_venda nv ON nv.id_nota_venda = iv.id_nota_venda
          GROUP BY 1
        )
        SELECT
          TO_CHAR(meses.mes, 'MM/YYYY') AS mes,
          COALESCE(entradas.total, 0) AS entradas,
          COALESCE(saidas.total, 0) AS saidas
        FROM meses
        LEFT JOIN entradas ON entradas.mes = meses.mes
        LEFT JOIN saidas ON saidas.mes = meses.mes
        ORDER BY meses.mes
      `),
      pool.query(`
        SELECT l.id_lampada, l.tipo_lampada, 'entrada' AS tipo, ic.quantidade, nc.data_emissao, nc.numero_nota
        FROM item_nota_compra ic
        JOIN nota_compra nc ON nc.id_nota_compra = ic.id_nota_compra
        JOIN lampadas l ON l.id_lampada = ic.id_lampada

        UNION ALL

        SELECT l.id_lampada, l.tipo_lampada, 'saida' AS tipo, iv.quantidade, nv.data_emissao, nv.numero_nota
        FROM item_nota_venda iv
        JOIN nota_venda nv ON nv.id_nota_venda = iv.id_nota_venda
        JOIN lampadas l ON l.id_lampada = iv.id_lampada

        ORDER BY data_emissao DESC, numero_nota DESC
        LIMIT 8
      `),
    ]);

    res.json({
      totalEntradas30d: Number(entradas30d.rows[0].total || 0),
      totalSaidas30d: Number(saidas30d.rows[0].total || 0),
      alertasReposicao: Number(alertasReposicao.rows[0].total || 0),
      produtoMaisMovimentado: produtoMaisMovimentado.rows[0]
        ? {
            ...produtoMaisMovimentado.rows[0],
            total_quantidade: Number(produtoMaisMovimentado.rows[0].total_quantidade || 0),
          }
        : null,
      estoquePorTipo: estoquePorTipo.rows.map(item => ({
        ...item,
        estoque_atual: Number(item.estoque_atual || 0),
      })),
      tendenciaMensal: tendenciaMensal.rows.map(item => ({
        ...item,
        entradas: Number(item.entradas || 0),
        saidas: Number(item.saidas || 0),
      })),
      historicoRecente: historicoRecente.rows,
    });
  } catch (error) {
    console.error('Erro ao carregar análises:', error);
    res.status(500).json({ message: 'Erro ao carregar análises.' });
  }
});

app.get('/api/movimentacoes', async (req, res) => {
  if (!pool) {
    return res.json([]);
  }

  try {
    const result = await pool.query(`
      SELECT l.id_lampada, l.tipo_lampada, 'entrada' AS tipo, ic.quantidade, nc.data_emissao, nc.numero_nota, COALESCE(nc.observacoes, '') AS observacoes
      FROM item_nota_compra ic
      JOIN nota_compra nc ON nc.id_nota_compra = ic.id_nota_compra
      JOIN lampadas l ON l.id_lampada = ic.id_lampada

      UNION ALL

      SELECT l.id_lampada, l.tipo_lampada, 'saida' AS tipo, iv.quantidade, nv.data_emissao, nv.numero_nota, COALESCE(nv.observacoes, '') AS observacoes
      FROM item_nota_venda iv
      JOIN nota_venda nv ON nv.id_nota_venda = iv.id_nota_venda
      JOIN lampadas l ON l.id_lampada = iv.id_lampada

      ORDER BY data_emissao DESC, numero_nota DESC
      LIMIT 100
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao carregar movimentações:', error);
    res.status(500).json({ message: 'Erro ao carregar movimentações.' });
  }
});

app.get('/api/lampadas', async (req, res) => {
  if (!pool) {
    return res.json([]);
  }

  const search = (req.query.search || '').trim();
  try {
    const sql = search
      ? `SELECT * FROM lampadas WHERE tipo_lampada ILIKE $1 OR fornecedor ILIKE $1 OR temperatura_cor ILIKE $1 LIMIT 20`
      : `SELECT * FROM lampadas LIMIT 20`;
    const params = search ? [`%${search}%`] : [];
    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar lâmpadas:', error);
    res.status(500).json({ message: 'Erro ao buscar produtos.' });
  }
});

app.get('/api/lampadas/:id', async (req, res) => {
  if (!pool) {
    return respostaBancoIndisponivel(res);
  }

  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM lampadas WHERE id_lampada = $1', [id]);
    if (!result.rows.length) {
      return res.status(404).json({ message: 'Produto não encontrado.' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    res.status(500).json({ message: 'Erro ao buscar o produto.' });
  }
});

app.post('/api/lampadas', async (req, res) => {
  if (!pool) {
    return respostaBancoIndisponivel(res);
  }

  const { tipo_lampada, potencia, temperatura_cor, fornecedor, estoque_atual = 0, estoque_minimo = 0 } = req.body;

  if (!tipo_lampada || !potencia || !temperatura_cor || !fornecedor) {
    return res.status(400).json({ message: 'Preencha todos os campos obrigatórios do produto.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO lampadas (tipo_lampada, potencia, temperatura_cor, fornecedor, estoque_atual, estoque_minimo)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [tipo_lampada, Number(potencia), temperatura_cor, fornecedor, Number(estoque_atual), Number(estoque_minimo)]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({ message: 'Erro ao criar produto.' });
  }
});

app.put('/api/lampadas/:id', async (req, res) => {
  if (!pool) {
    return respostaBancoIndisponivel(res);
  }

  const { id } = req.params;
  const { tipo_lampada, potencia, temperatura_cor, fornecedor, estoque_atual = 0, estoque_minimo = 0 } = req.body;

  if (!tipo_lampada || !potencia || !temperatura_cor || !fornecedor) {
    return res.status(400).json({ message: 'Preencha todos os campos obrigatórios do produto.' });
  }

  try {
    const result = await pool.query(
      `UPDATE lampadas
       SET tipo_lampada = $1,
           potencia = $2,
           temperatura_cor = $3,
           fornecedor = $4,
           estoque_atual = $5,
           estoque_minimo = $6
       WHERE id_lampada = $7
       RETURNING *`,
      [tipo_lampada, Number(potencia), temperatura_cor, fornecedor, Number(estoque_atual), Number(estoque_minimo), id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: 'Produto não encontrado.' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ message: 'Erro ao atualizar produto.' });
  }
});

app.delete('/api/lampadas/:id', async (req, res) => {
  if (!pool) {
    return respostaBancoIndisponivel(res);
  }

  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM lampadas WHERE id_lampada = $1 RETURNING *', [id]);

    if (!result.rows.length) {
      return res.status(404).json({ message: 'Produto não encontrado.' });
    }

    res.json({ message: 'Produto removido com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir produto:', error);

    if (error.code === '23503') {
      return res.status(400).json({ message: 'Este produto possui movimentações vinculadas e não pode ser excluído.' });
    }

    res.status(500).json({ message: 'Erro ao excluir produto.' });
  }
});

app.post('/api/lampadas/:id/movimentacao', async (req, res) => {
  if (!pool) {
    return respostaBancoIndisponivel(res);
  }

  const { id } = req.params;
  const { tipo, quantidade, numeroNota, dataEmissao, observacao } = req.body;

  if (!['entrada', 'saida'].includes(tipo)) {
    return res.status(400).json({ message: 'Tipo de movimentação inválido.' });
  }

  const quantidadeNumero = Number(quantidade);
  if (!Number.isInteger(quantidadeNumero) || quantidadeNumero <= 0) {
    return res.status(400).json({ message: 'Quantidade deve ser um número inteiro positivo.' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const lampadasResult = await client.query('SELECT * FROM lampadas WHERE id_lampada = $1 FOR UPDATE', [id]);
    if (!lampadasResult.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Produto não encontrado.' });
    }

    const produto = lampadasResult.rows[0];
    const estoqueAtual = produto.estoque_atual;
    const estoqueMinimo = produto.estoque_minimo;
    const novoEstoque = tipo === 'entrada' ? estoqueAtual + quantidadeNumero : estoqueAtual - quantidadeNumero;

    if (novoEstoque < 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Saldo insuficiente para essa saída.' });
    }

    const dataNota = dataEmissao || new Date().toISOString().slice(0, 10);
    const notaGerada = (numeroNota || `AUTO-${Date.now()}`).trim();

    if (tipo === 'entrada') {
      const notaResult = await client.query(
        'INSERT INTO nota_compra (numero_nota, data_emissao, observacoes) VALUES ($1, $2, $3) RETURNING id_nota_compra',
        [notaGerada, dataNota, observacao || null]
      );
      await client.query(
        'INSERT INTO item_nota_compra (id_nota_compra, id_lampada, quantidade) VALUES ($1, $2, $3)',
        [notaResult.rows[0].id_nota_compra, id, quantidadeNumero]
      );
    } else {
      const notaResult = await client.query(
        'INSERT INTO nota_venda (numero_nota, data_emissao, observacoes) VALUES ($1, $2, $3) RETURNING id_nota_venda',
        [notaGerada, dataNota, observacao || null]
      );
      await client.query(
        'INSERT INTO item_nota_venda (id_nota_venda, id_lampada, quantidade) VALUES ($1, $2, $3)',
        [notaResult.rows[0].id_nota_venda, id, quantidadeNumero]
      );
    }

    await client.query('UPDATE lampadas SET estoque_atual = $1 WHERE id_lampada = $2', [novoEstoque, id]);

    const updatedResult = await client.query('SELECT * FROM lampadas WHERE id_lampada = $1', [id]);
    await client.query('COMMIT');

    res.json({ produto: updatedResult.rows[0], mensagem: `Movimentação de ${tipo} registrada com sucesso.` });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao registrar movimentação:', error);
    res.status(500).json({ message: 'Erro ao registrar movimentação.' });
  } finally {
    client.release();
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`🚀 Servidor iniciado na porta ${port}`);
  console.log(`🌐 URL: http://localhost:${port}`);
});

// Tratamento de erros não capturados
process.on('uncaughtException', (err) => {
  console.error('❌ Erro não capturado:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promessa rejeitada não tratada:', reason);
});
