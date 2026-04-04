# projetoIntegrador3
Projeto desenvolvido por alunos da UNIVESP.

## Backend e Integração com Banco de Dados
Este projeto agora conta com um backend Node.js que integra o frontend `index.html` com o banco PostgreSQL (Neon) usando a estrutura de dados do arquivo `database/schema_controle_estoque_postgresql_neon.sql`.

### Instalação
1. Instale o Node.js.
2. No terminal, acesse a pasta do projeto:
   ```bash
   cd "c:\Users\Paulo\Documents\PL2 - AGENDAMENTO2\projetoIntegrador3"
   ```
3. Instale dependências:
   ```bash
   npm install
   ```

### Banco de dados PostgreSQL (Neon)
1. Crie o banco de dados usando o arquivo SQL em `database/schema_controle_estoque_postgresql_neon.sql`.
2. Configure as variáveis de ambiente:
   - `DB_HOST` (host do Neon)
   - `DB_USER` (usuário do Neon)
   - `DB_PASSWORD` (senha do Neon)
   - `DB_NAME` (nome do banco)
   - `DB_PORT` (porta, geralmente 5432)

### Execução
```bash
npm start
```
Depois, abra no navegador:

```text
http://localhost:3000
```

### Funcionalidades implementadas
- Pesquisa de lâmpadas por nome, fornecedor ou temperatura.
- Exibição de informações do produto direto da tabela `lampadas`.
- Registro de movimentação de entrada e saída com atualização do estoque.
- Criação automática de `nota_compra` ou `nota_venda` e dos itens associados.
