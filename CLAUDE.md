# MUSGA — índice operacional

Jogo web de treino rítmico para **um iniciante absoluto** que volta por um motivo só:
**ver que está melhorando**. Arquivo único, sem build, som sintetizado, abre com duplo clique.

**Isto é um índice, não uma enciclopédia.** Leia daqui o que a tarefa precisa e vá ao código.
O estado e as lições estão em `PLANO.md`; a auditoria vigente é `AUDITORIA-v5.md`. As decisões fechadas estão em `DECISOES.md` — leia
antes de propor trocar arquitetura, biblioteca ou formato.

## Regras invioláveis

1. **Um relógio só.** Toda matemática de tempo usa `AC.currentTime`. Horário de evento do DOM
   entra apenas pela ponte `tempoDoEvento()`, que é pura e testada. Nunca `Date.now()`.
2. **Sem arquivo externo.** Nada de `fetch`, CDN, sample ou fonte de fora: o app tem de abrir
   por `file://` com duplo clique — e é publicado como está em
   **https://renatoremiro.github.io/musga/** (ver `PUBLICAR.md`; D-01 emendada em 29/09).
3. **Nada é dado por pronto com o portão fechado.** `node portao.js --navegador`.
4. **Métrica sem resolução fica em branco.** Melhor calar do que inventar uma história sobre
   o músico. Já custou caro duas vezes.
5. **Teste unitário verde não prova nada.** Toda mudança de comportamento visível ganha prova
   de navegador. Os testes unitários já passaram aqui sobre função que o app não chamava.
6. **Toda mudança de mecânica aparece na tela, em uma frase, onde ela acontece.**
7. **Prova de portão passa pelo portão, nunca pela função isolada.** `limiteVies(etapa, erro)` foi
   testada sozinha enquanto `motivoReprova` a chamava sem o erro — e o app anunciou como pronto
   uma regra que não existia. Testar o que o app chama, não o que a função faz.
8. **Validade estatística que emudece o produto é defeito.** O filtro por exercício+etapa+andamento
   era correto e deixou a linha de progresso sem falar por 30 execuções. Antes de filtrar, perguntar
   quantas execuções a pessoa real vai ter na célula.

## Onde está cada coisa em `musga.html`

| bloco | o que tem |
|---|---|
| `/*=== PURE ===*/` | matemática de tempo: `casar`, `venceu`, `julgar`, `tempoDoEvento`, calibração |
| `/*=== NUCLEO ===*/` | métricas, portões, progressão, datas, exercícios, textos de diagnóstico |
| fora dos blocos | DOM, síntese de áudio, agendador, pista, diário |

Os testes **extraem os blocos por regex** e rodam em node sem stub. Função do PURE se testa em
`test-timing.js`; do NUCLEO, em `test-nucleo.js`. Exportar do bloco errado quebra o portão com
`ReferenceError`.

## Como rodar

```
node portao.js              # rápido (~5 s): lógica pura
node portao.js --navegador  # completo (~15 min): + o app de verdade com robô
node verificar-auditoria.js # reproduz os achados das auditorias, semente fixa
```

| arquivo | o que é |
|---|---|
| `test-timing.js` | bloco PURE |
| `test-nucleo.js` | bloco NUCLEO |
| `test-vivo.js` | alcançabilidade: função morta ou segunda implementação **reprova** |
| `prova-passo1/2/3.js`, `prova-calib.js` | o app de verdade, com Playwright |

## Antes de mexer

1. Identifique o bloco (PURE, NUCLEO ou fora).
2. Leia **só** a região e os testes dela.
3. Faça a menor mudança que resolve.
4. Rode o portão rápido; rode o completo antes de dar por pronto.
5. Ao entregar no computador do Renato: **confira md5 dos dois lados** — o commit já reportou
   "escrito" sem escrever, sempre com os arquivos maiores do lote.

## O que NÃO fazer

Não adicionar combo, pontuação, XP ou som de acerto — ele não pediu e disse que não quer.
Não mexer em limiar sem dado que justifique. Não "simplificar" o portão. Não escrever teste
depois de `process.exit` (já aconteceu: 32 testes mortos e um passo dado por provado).
