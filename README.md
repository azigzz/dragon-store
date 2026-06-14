# Discord Sales Bot — Configurador pelo Discord

Essa versão permite configurar o painel de venda dentro do próprio Discord usando `!configds` ou `/configds`.

## O que configura pelo Discord

- título;
- descrição;
- imagem/banner;
- cor;
- canal de publicação;
- produtos/opções;
- valor;
- descrição curta;
- estoque;
- preview;
- publicar painel.

O painel fica no estilo da print: embed com imagem e um select menu `Selecione um produto`.

## Instalar

```bash
npm install
```

## Variáveis de ambiente

No Render, coloque:

```env
DISCORD_TOKEN=token_do_bot
CLIENT_ID=id_da_aplicacao
GUILD_ID=id_do_servidor
```

## Render

Build Command:

```bash
npm install && npm run deploy
```

Start Command:

```bash
npm start
```

## Comandos

```txt
!configds
/configds
/setup-ticket
/status-loja
```

## Importante para `!configds`

Para `!configds` funcionar, ative no Discord Developer Portal:

Application -> Bot -> Privileged Gateway Intents -> Message Content Intent

Se não quiser ativar isso, use `/configds`.

## IDs fixos

No `config.json` ficam só os IDs de estrutura do server:

```json
"adminRoleId": "1515799363149103142",
"categories": {
  "cartOpen": "1515799366760141033",
  "closed": "1515813300862980268",
  "ticketOpen": "1515799366760141033"
},
"ticketPanel": {
  "channelId": "1515799364574904531"
}
```

## Observação

Essa versão salva configurações e carrinhos em arquivos dentro da pasta `data`.
Em hospedagem grátis, esses arquivos podem sumir em redeploy/restart dependendo da plataforma. Para loja real, o ideal depois é usar Neon/PostgreSQL.
