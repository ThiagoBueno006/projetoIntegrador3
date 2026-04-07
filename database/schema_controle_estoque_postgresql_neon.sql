-- =====================================================
-- Banco de Dados: Controle de Estoque
-- Projeto: Sistema de controle de estoque de lâmpadas
-- Compatível com PostgreSQL / Neon DB
-- =====================================================

DROP TABLE IF EXISTS item_nota_venda;
DROP TABLE IF EXISTS item_nota_compra;
DROP TABLE IF EXISTS nota_venda;
DROP TABLE IF EXISTS nota_compra;
DROP TABLE IF EXISTS lampadas;

-- ===============================
-- TABELA: lampadas
-- ===============================

CREATE TABLE lampadas (
    id_lampada SERIAL PRIMARY KEY,
    tipo_lampada VARCHAR(100) NOT NULL,
    potencia INT NOT NULL,
    temperatura_cor VARCHAR(100) NOT NULL,
    fornecedor VARCHAR(100) NOT NULL,
    estoque_atual INT NOT NULL DEFAULT 0,
    estoque_minimo INT NOT NULL DEFAULT 0,
    CHECK (estoque_atual >= 0),
    CHECK (estoque_minimo >= 0)
);

-- ===============================
-- TABELA: nota_compra
-- ===============================

CREATE TABLE nota_compra (
    id_nota_compra SERIAL PRIMARY KEY,
    numero_nota VARCHAR(50) NOT NULL,
    data_emissao DATE NOT NULL
);

-- ===============================
-- TABELA: nota_venda
-- ===============================

CREATE TABLE nota_venda (
    id_nota_venda SERIAL PRIMARY KEY,
    numero_nota VARCHAR(50) NOT NULL,
    data_emissao DATE NOT NULL
);

-- ===============================
-- ITEM COMPRA
-- ===============================

CREATE TABLE item_nota_compra (
    id_item_compra SERIAL PRIMARY KEY,
    id_nota_compra INT REFERENCES nota_compra(id_nota_compra),
    id_lampada INT REFERENCES lampadas(id_lampada),
    quantidade INT NOT NULL CHECK (quantidade > 0)
);

-- ===============================
-- ITEM VENDA
-- ===============================

CREATE TABLE item_nota_venda (
    id_item_venda SERIAL PRIMARY KEY,
    id_nota_venda INT REFERENCES nota_venda(id_nota_venda),
    id_lampada INT REFERENCES lampadas(id_lampada),
    quantidade INT NOT NULL CHECK (quantidade > 0)
);