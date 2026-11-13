# Aplicação web — painel INFINIX PRO

## Configuração
A aplicação web usa `VITE_API_URL` para definir o endereço HTTP da API. Sem essa variável, usa `http://localhost:3000/api`.

Para executar localmente:
1. Configure a API e o PostgreSQL conforme `docs/DEVELOPMENT.md`.
2. Instale dependências na raiz: `npm install`.
3. Inicie a API: `npm run dev:api`.
4. Em outro terminal, inicie o painel: `npm run dev:web`.
5. Abra o endereço local informado pelo Vite.

Para ambiente hospedado, defina `VITE_API_URL=https://SEU-DOMINIO-DA-API/api` antes do build do frontend. O endereço é incorporado ao bundle web; não coloque segredos nessa variável.

## Recursos disponíveis na interface
- Cadastro inicial de empresa e login.
- Visão geral com acesso aos módulos.
- Listagem e cadastro de clientes, produtos, lançamentos financeiros, eventos e publicações.
- Listagem de propostas, comandas, notificações e conversas.
- Leitura e envio de mensagens em conversas existentes.
- Marcação individual de notificações como lidas.
- Fechamento de comandas abertas usando PIX como opção inicial na interface.

## Limitações conhecidas
- O token de acesso atual expira em 15 minutos e ainda não existe refresh token; ao expirar, o usuário precisará entrar novamente.
- A tela de chat lista conversas existentes, mas a criação de conversas e a seleção de participantes ainda não foram expostas no painel.
- Propostas e comandas são listadas, mas os formulários completos de criação/edição dessas áreas ainda serão adicionados.
- O painel não substitui validação de permissões na API. Todas as regras de autorização precisam permanecer no backend.
- A API deve estar acessível pelo navegador e permitir CORS para o domínio do frontend.
- Não declarar o build como aprovado até a execução bem-sucedida do GitHub Actions.
