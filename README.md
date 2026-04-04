# projetoIntegrador3
Projeto desenvolvido por alunos da UNIVESP.

## Backend e Integração com Banco de Dados
Este projeto agora conta com um backend Node.js que integra o frontend `index.html` com o banco MySQL usando a estrutura de dados do arquivo `database/schema_controle_estoque_mysql workbench.sql`.

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

### Banco de dados MySQL
1. Crie o banco de dados usando o arquivo SQL em `database/schema_controle_estoque_mysql workbench.sql`.
2. Ajuste as variáveis de ambiente se necessário:
   - `DB_HOST` (padrão `localhost`)
   - `DB_USER` (padrão `root`)
   - `DB_PASSWORD` (padrão vazio)
   - `DB_NAME` (padrão `controle_estoque`)

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
