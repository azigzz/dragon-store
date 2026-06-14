# Patch V4 — Caixa Surpresa de Packs

Essa versão adiciona caixa surpresa com sorteio real de **brindes digitais**, sem Pix/dinheiro real.

## Como usar no Discord

1. Use `/configds` ou `!configds`.
2. Clique em **Adicionar caixa surpresa**.
3. Preencha:
   - Nome da caixa
   - Valor
   - Descrição
   - Estoque
   - Brindes no formato:

```txt
Mini Pack | 70 | 10 cortes aleatórios
Pack Lifestyle | 20 | 20 vídeos lifestyle
Pack Premium | 8 | brinde premium de edição
Pack Raro | 2 | brinde raro de conteúdo digital
```

## Como funcionam as porcentagens

O número do meio é o **peso**. No exemplo acima:

- 70 + 20 + 8 + 2 = 100
- Mini Pack = 70%
- Pack Lifestyle = 20%
- Pack Premium = 8%
- Pack Raro = 2%

Você pode usar qualquer soma. Exemplo: se botar `1`, `1`, `1`, todos ficam com a mesma chance.

## Quando o sorteio acontece

O sorteio acontece quando o ADM clica em **Finalizar compra**.

Isso evita abrir caixa antes do pagamento. Quando finalizar, o bot manda:

- mensagem no carrinho com o resultado;
- DM para o cliente com o resultado;
- resumo final da compra.

## Importante

A caixa é para **brinde digital/produto/cupom**, não para saldo Pix ou dinheiro real.
