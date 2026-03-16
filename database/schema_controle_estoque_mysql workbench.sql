-- =====================================================
-- Banco de Dados: Controle de Estoque
-- Projeto: Sistema de controle de estoque de lâmpadas
-- =====================================================

-- Criação do banco de dados
CREATE DATABASE IF NOT EXISTS controle_estoque;

-- Seleciona o banco para uso
USE controle_estoque;


-- =====================================================
-- TABELA: lampadas
-- Armazena os tipos de lâmpadas disponíveis no estoque
-- =====================================================

CREATE TABLE lampadas (
    id_lampada INT AUTO_INCREMENT PRIMARY KEY,
    tipo_lampada VARCHAR(100) NOT NULL,
    potencia INT NOT NULL,
    temperatura_cor VARCHAR(100) NOT NULL,
    fornecedor VARCHAR(100) NOT NULL,
    estoque_atual INT NOT NULL DEFAULT 0,
    estoque_minimo INT NOT NULL DEFAULT 0,

    CONSTRAINT chk_estoque_atual
        CHECK (estoque_atual >= 0),

    CONSTRAINT chk_estoque_minimo
        CHECK (estoque_minimo >= 0)
);


-- =====================================================
-- TABELA: nota_compra
-- Registra as notas fiscais de compra de mercadorias
-- =====================================================

CREATE TABLE nota_compra (
    id_nota_compra INT AUTO_INCREMENT PRIMARY KEY,
    numero_nota VARCHAR(50) NOT NULL,
    data_emissao DATE NOT NULL
);


-- =====================================================
-- TABELA: nota_venda
-- Registra as notas fiscais de venda
-- =====================================================

CREATE TABLE nota_venda (
    id_nota_venda INT AUTO_INCREMENT PRIMARY KEY,
    numero_nota VARCHAR(50) NOT NULL,
    data_emissao DATE NOT NULL
);


-- =====================================================
-- TABELA: item_nota_compra
-- Registra os itens comprados em cada nota de compra
-- =====================================================

CREATE TABLE item_nota_compra (
    id_item_compra INT AUTO_INCREMENT PRIMARY KEY,
    id_nota_compra INT NOT NULL,
    id_lampada INT NOT NULL,
    quantidade INT NOT NULL,

    CONSTRAINT fk_item_compra_nota
        FOREIGN KEY (id_nota_compra)
        REFERENCES nota_compra(id_nota_compra),

    CONSTRAINT fk_item_compra_lampada
        FOREIGN KEY (id_lampada)
        REFERENCES lampadas(id_lampada),

    CONSTRAINT chk_quantidade_compra
        CHECK (quantidade > 0)
);


-- =====================================================
-- TABELA: item_nota_venda
-- Registra os itens vendidos em cada nota de venda
-- =====================================================

CREATE TABLE item_nota_venda (
    id_item_venda INT AUTO_INCREMENT PRIMARY KEY,
    id_nota_venda INT NOT NULL,
    id_lampada INT NOT NULL,
    quantidade INT NOT NULL,

    CONSTRAINT fk_item_venda_nota
        FOREIGN KEY (id_nota_venda)
        REFERENCES nota_venda(id_nota_venda),

    CONSTRAINT fk_item_venda_lampada
        FOREIGN KEY (id_lampada)
        REFERENCES lampadas(id_lampada),

    CONSTRAINT chk_quantidade_venda
        CHECK (quantidade > 0)
);
