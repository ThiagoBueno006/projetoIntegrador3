const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 5432,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

const pool = new Pool(dbConfig);

// Testa conexão com banco (opcional, não bloqueia o servidor)
pool.connect()
  .then(client => {
    console.log('Conectado ao banco de dados PostgreSQL');
    client.release();
  })
  .catch(err => {
    console.error('Erro ao conectar ao banco de dados:', err.message);
    console.log('Servidor continuará rodando sem banco de dados');
  });

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/lampadas', async (req, res) => {
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

app.post('/api/lampadas/:id/movimentacao', async (req, res) => {
  const { id } = req.params;
  const { tipo, quantidade } = req.body;

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

    const dataEmissao = new Date().toISOString().slice(0, 10);
    const numeroNota = `AUTO-${Date.now()}`;

    if (tipo === 'entrada') {
      const notaResult = await client.query(
        'INSERT INTO nota_compra (numero_nota, data_emissao) VALUES ($1, $2) RETURNING id_nota_compra',
        [numeroNota, dataEmissao]
      );
      await client.query(
        'INSERT INTO item_nota_compra (id_nota_compra, id_lampada, quantidade) VALUES ($1, $2, $3)',
        [notaResult.rows[0].id_nota_compra, id, quantidadeNumero]
      );
    } else {
      const notaResult = await client.query(
        'INSERT INTO nota_venda (numero_nota, data_emissao) VALUES ($1, $2) RETURNING id_nota_venda',
        [numeroNota, dataEmissao]
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
  console.log(`Servidor iniciado em http://localhost:${port}`);
});
