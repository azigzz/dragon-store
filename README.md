# Dragon Store - Bot de vendas para Discord

Bot em Node.js com `discord.js v14` para loja digital com painel configuravel pelo Discord, carrinho privado, atendimento manual por ADM, Pix individual por atendente, tickets e caixa surpresa de brindes digitais.

## Recursos

- Painel de loja com embed, banner, thumbnail, cor e menu de produtos.
- Configurador por `/configds` ou `!configds`.
- Produto com nome, preco, descricao, estoque e foto individual.
- Edicao de produto existente sem precisar remover e recriar.
- Carrinho privado por cliente com ID aleatorio de 7 digitos.
- Snapshot do produto dentro do pedido, preservando nome/preco mesmo se o produto for editado depois.
- Resumo de carrinho com quantidade, subtotal e total estimado.
- Atendimento ON/OFF por ADM.
- Pix, QR Code e mensagem extra por atendente.
- Assumir compra, reenviar Pix e finalizar compra.
- DM segura para cliente na abertura do carrinho e na finalizacao.
- Caixa surpresa de brindes digitais com pesos/chances, sorteada somente ao finalizar a compra.
- Ticket de suporte privado.
- `/status-loja` com produtos, carrinhos abertos, vendas fechadas, faturamento estimado e ADMs online.

## Instalar

```bash
npm install
```

## Variaveis de ambiente

Crie as variaveis no Render ou no `.env` local:

```env
DISCORD_TOKEN=token_do_bot
CLIENT_ID=id_da_aplicacao
GUILD_ID=id_do_servidor
```

Nunca coloque token real no codigo.

## Comandos

```txt
npm run deploy
npm start
```

No Discord:

```txt
/configds
!configds
/setup-atendimento
!atendimento
/configpix
!configpix
/setup-ticket
/status-loja
!status-loja
```

Para `!configds`, `!atendimento` e `!status-loja`, ative no Discord Developer Portal:

```txt
Application -> Bot -> Privileged Gateway Intents -> Message Content Intent
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

Depois de mudar slash commands em `deploy-commands.js`, rode `npm run deploy` ou redeploy no Render. As melhorias atuais usam comandos ja existentes, mas ainda e recomendado redeployar para subir o codigo novo.

Se `/configpix` nao aparecer ou disser que falta permissao, rode `npm run deploy` de novo. Os comandos slash ficam visiveis no Discord, mas o bot so deixa usar quem tem Administrator ou o cargo ADM configurado em `config.json`.

## Fluxo do dono da loja

1. Use `/configds` ou `!configds`.
2. Configure titulo, descricao, banner, thumbnail, cor e canal.
3. Clique em **Adicionar produto** para cadastrar nome, preco, descricao, estoque e foto.
4. Clique em **Editar produto** para trocar nome, preco, estoque, foto ou brindes.
5. Clique em **Adicionar caixa surpresa** para cadastrar uma caixa de brindes digitais.
6. Use **Preview** para conferir.
7. Use **Publicar painel** para publicar ou reutilizar a mensagem salva quando possivel.
8. Use **Atualizar publicado** para editar manualmente o painel que ja esta no chat.

## Fluxo de atendimento

1. Um ADM usa `/setup-atendimento` no canal da equipe.
2. Cada ADM usa `/configpix` ou o botao **Configurar meu Pix**.
3. O ADM salva nome de exibicao, chave Pix, QR Code opcional e mensagem extra.
4. O ADM clica em **Ficar ON** quando puder receber vendas.
5. Se houver um unico ADM ON, o bot assume a compra automaticamente para ele.
6. Se houver dois ou mais ADMs ON, o primeiro que clicar em **Assumir compra** fica responsavel.
7. Depois de assumida, o bot libera **Reenviar Pix**.

## Caixa surpresa

A caixa surpresa e apenas para brinde digital, produto, pack ou cupom. Nao use Pix, saldo real, dinheiro real ou premio financeiro.

Formato dos brindes:

```txt
Nome do brinde | peso | descricao
Mini Pack | 70 | 10 cortes aleatorios
Pack Lifestyle | 20 | 20 videos lifestyle
Pack Premium | 8 | brinde premium de edicao
Pack Raro | 2 | brinde raro de conteudo digital
```

O sorteio acontece quando o ADM clica em **Finalizar compra**. O resultado fica salvo no pedido e aparece no carrinho e na DM do cliente.

## IDs configuraveis

Os IDs ficam em `config.json`:

```json
{
  "adminRoleId": "1515799363149103142",
  "categories": {
    "cartOpen": "1515799366760141033",
    "closed": "1515813300862980268",
    "ticketOpen": "1515799366760141033"
  },
  "ticketPanel": {
    "channelId": "1515799364574904531"
  }
}
```

## Persistencia

Os dados ficam em JSON dentro da pasta `data`:

- `data/panels.json`
- `data/orders.json`
- `data/staff.json`

Em hospedagem gratis, esses arquivos podem sumir em redeploy/restart dependendo da plataforma. Para loja em producao, o proximo passo recomendado e migrar esses dados para Neon/PostgreSQL.

## Como testar no Discord

1. Rode `npm run deploy`.
2. Rode `npm start`.
3. Use `/configds`, adicione/edite um produto com foto e publique o painel.
4. Em uma conta de cliente, selecione um produto e confirme que o carrinho privado abre.
5. Use `/setup-atendimento`, configure Pix com `/configpix` e fique ON.
6. Abra outro carrinho e confirme se o Pix vai automaticamente quando houver um unico ADM ON.
7. Adicione uma caixa surpresa, compre e finalize como ADM para verificar o sorteio.
8. Use `/status-loja` para conferir o resumo de gestao.
