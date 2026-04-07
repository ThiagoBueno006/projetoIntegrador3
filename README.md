# projetoIntegrador3
Projeto desenvolvido por alunos da UNIVESP.

## Backend e Integração com Banco de Dados
Este projeto agora conta com um backend Node.js que integra o frontend `index.html` com o banco PostgreSQL (Neon) usando a estrutura de dados do arquivo `database/schema_controle_estoque_postgresql_neon.sql`.


### Funcionalidades implementadas
- Pesquisa de lâmpadas por nome, fornecedor ou temperatura.
- Exibição de informações do produto direto da tabela `lampadas`.
- Registro de movimentação de entrada e saída com atualização do estoque.
- Criação automática de `nota_compra` ou `nota_venda` e dos itens associados.

### Configuração do banco NEON
1. Copie o arquivo `.env.example` para `.env`.
2. Preencha `DATABASE_URL` com a string de conexão do Neon.
3. Execute `npm install` e depois `npm start`.
4. Abra `http://localhost:3000/health` e confirme se o campo `database` aparece como `connected`.

> Observação: o projeto agora usa SSL por padrão para compatibilidade com o Neon. Só defina `DATABASE_SSL=false` se estiver usando um banco local sem SSL.

### Endereço da aplicação Controle de Estoque da empresa Vital Lampadas
https://controle-de-estoque-kxxj.onrender.com/

# Acessibilidade na Página
Este projeto foi desenvolvido com foco em acessibilidade, garantindo que diferentes usuários possam navegar e interagir com o conteúdo de forma inclusiva. 
## Recursos de Acessibilidade Implementados
- **Aumento de fontes**: O usuário pode ajustar o tamanho da fonte de acordo com sua necessidade, facilitando a leitura para pessoas com baixa visão ou preferências pessoais.
- **Mudança de contraste**: Foi adicionada a opção de alternar entre diferentes esquemas de contraste, melhorando a visibilidade do conteúdo para usuários com dificuldades visuais ou em ambientes com iluminação desfavorável.
## Importância
Essas funcionalidades tornam a página mais acessível e inclusiva, seguindo boas práticas de desenvolvimento web e contribuindo para uma melhor experiência de navegação para todos os usuários.
