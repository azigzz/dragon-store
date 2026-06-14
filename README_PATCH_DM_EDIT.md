# Patch Dragon Store — DM + editar painel existente

Arquivos alterados:

- `src/index.js`

O que mudou:

1. O bot manda DM quando o cliente cria um carrinho.
2. O bot manda DM quando a compra é finalizada.
3. O carrinho continua permitindo adicionar mais produtos depois.
4. O `!configds` agora reutiliza/edita a mensagem de configuração que já está no mesmo canal, em vez de criar outra toda vez.
5. O configurador ganhou botão **Atualizar publicado**, que edita o painel de vendas já publicado no chat, sem duplicar mensagem.

Como usar:

1. Substitua seu `src/index.js` por este novo.
2. Faça commit e push:

```cmd
git add src/index.js README_PATCH_DM_EDIT.md
git commit -m "add dm e atualizar painel publicado"
git push
```

3. No Render, faça redeploy.

No Discord:

- Use `!configds` ou `/configds`.
- Clique em **Publicar painel** na primeira vez.
- Depois de editar título, descrição, imagem ou produtos, clique em **Atualizar publicado** para alterar o painel que já está no chat.

Observação:

DM pode falhar se o cliente tiver mensagens diretas bloqueadas. O bot só ignora esse erro e continua funcionando.
