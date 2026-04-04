const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'controle_estoque',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

const pool = mysql.createPool(dbConfig);

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get('/api/lampadas', async (req, res) => {
  const search = (req.query.search || '').trim();
  try {
    const sql = search
      ? `SELECT * FROM lampadas WHERE tipo_lampada LIKE ? OR fornecedor LIKE ? OR temperatura_cor LIKE ? LIMIT 20`
      : `SELECT * FROM lampadas LIMIT 20`;
    const params = search ? [`%${search}%`, `%${search}%`, `%${search}%`] : [];
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar lâmpadas:', error);
    res.status(500).json({ message: 'Erro ao buscar produtos.' });
  }
});

app.get('/api/lampadas/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM lampadas WHERE id_lampada = ?', [id]);
    if (!rows.length) {
      return res.status(404).json({ message: 'Produto não encontrado.' });
    }
    res.json(rows[0]);
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

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [lampadas] = await connection.query('SELECT * FROM lampadas WHERE id_lampada = ? FOR UPDATE', [id]);
    if (!lampadas.length) {
      await connection.rollback();
      return res.status(404).json({ message: 'Produto não encontrado.' });
    }

    const produto = lampadas[0];
    const estoqueAtual = produto.estoque_atual;
    const estoqueMinimo = produto.estoque_minimo;
    const novoEstoque = tipo === 'entrada' ? estoqueAtual + quantidadeNumero : estoqueAtual - quantidadeNumero;

    if (novoEstoque < 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'Saldo insuficiente para essa saída.' });
    }

    const dataEmissao = new Date().toISOString().slice(0, 10);
    const numeroNota = `AUTO-${Date.now()}`;

    if (tipo === 'entrada') {
      const [notaResult] = await connection.query(
        'INSERT INTO nota_compra (numero_nota, data_emissao) VALUES (?, ?)',
        [numeroNota, dataEmissao]
      );
      await connection.query(
        'INSERT INTO item_nota_compra (id_nota_compra, id_lampada, quantidade) VALUES (?, ?, ?)',
        [notaResult.insertId, id, quantidadeNumero]
      );
    } else {
      const [notaResult] = await connection.query(
        'INSERT INTO nota_venda (numero_nota, data_emissao) VALUES (?, ?)',
        [numeroNota, dataEmissao]
      );
      await connection.query(
        'INSERT INTO item_nota_venda (id_nota_venda, id_lampada, quantidade) VALUES (?, ?, ?)',
        [notaResult.insertId, id, quantidadeNumero]
      );
    }

    await connection.query('UPDATE lampadas SET estoque_atual = ? WHERE id_lampada = ?', [novoEstoque, id]);

    const [updatedRows] = await connection.query('SELECT * FROM lampadas WHERE id_lampada = ?', [id]);
    await connection.commit();

    res.json({ produto: updatedRows[0], mensagem: `Movimentação de ${tipo} registrada com sucesso.` });
  } catch (error) {
    await connection.rollback();
    console.error('Erro ao registrar movimentação:', error);
    res.status(500).json({ message: 'Erro ao registrar movimentação.' });
  } finally {
    connection.release();
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Servidor iniciado em http://localhost:${port}`);
});
