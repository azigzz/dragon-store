# Patch V3 - Pix por ADM + Painel ON/OFF

Arquivos alterados:

- `src/index.js`
- `deploy-commands.js`
- `README.md`

Depois de substituir os arquivos:

```bash
npm run deploy
npm start
```

No Render, faça redeploy com:

```bash
Build Command: npm install && npm run deploy
Start Command: npm start
```

No Discord:

```txt
/setup-atendimento
/configpix
```

Ou use:

```txt
!atendimento
```

O painel permite cada ADM ficar ON/OFF e configurar Pix/QR Code. Quando abre carrinho, se só um ADM estiver ON o Pix vai automático para ele. Se tiver mais de um, quem clicar primeiro em **Assumir compra** pega a venda.
