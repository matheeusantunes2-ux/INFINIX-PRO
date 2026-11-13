# Comunicação interna — Feed, chat e notificações

## Feed
- `GET /api/feed?page=1&limit=20`
- `POST /api/feed` body: `{ "content": "...", "mediaUrl": "https://...", "announcement": false }`
- `POST /api/feed/:id/comments` body: `{ "body": "..." }`
- `POST /api/feed/:id/reactions` alterna a reação do usuário autenticado.
- `DELETE /api/feed/:id` autor ou OWNER/ADMIN.

Publicações e comentários são isolados por empresa. Comunicados oficiais (`announcement: true`) só podem ser publicados por OWNER, ADMIN ou MANAGER e geram notificações para os demais membros ativos. O campo mediaUrl aceita apenas URLs HTTP/HTTPS; upload de arquivos ainda não está integrado.

## Chat
- `GET /api/chat/conversations`
- `POST /api/chat/conversations` body: `{ "title": "Equipe", "memberIds": ["<membership-uuid>"] }`
- `GET /api/chat/conversations/:id/messages?page=1&limit=50`
- `POST /api/chat/conversations/:id/messages` body: `{ "body": "..." }`
- `POST /api/chat/conversations/:id/read`

A lista `memberIds` recebe IDs de Membership (vínculos de funcionários), não IDs de User. O criador é incluído automaticamente. Apenas membros ativos da mesma empresa podem ser adicionados. Todas as operações de leitura e envio verificam participação na conversa.

## Notificações
- `GET /api/notifications?page=1&limit=30`
- `PATCH /api/notifications/:id/read`
- `PATCH /api/notifications/read-all`

As notificações são persistidas e consultadas somente pelo vínculo empresarial destinatário.

## Limitações desta etapa
- Ainda não há WebSocket/Socket.IO; mensagens e notificações são persistidas e consultadas via HTTP.
- Não há upload binário, armazenamento de mídia, antivírus ou processamento de anexos. Somente URL externa HTTPS/HTTP validada no DTO.
- Feed atual é corporativo para toda a empresa; segmentação por unidade/equipe será adicionada após existir vínculo formal entre membros e unidades.
- Não há notificações push de navegador/celular nem entrega por e-mail.
- Implementar rate limit, testes automatizados e política de retenção antes de produção.
