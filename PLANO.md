# MUSGA — plano
Escrito em 18/09/2026; passos reordenados em 29/09/2026 pela AUDITORIA-v5 (cinco lentes cegas).

---

## O que este app é (e o que ele não é)

Um jogo web de treino rítmico para **uma pessoa que nunca tocou nenhum instrumento**, cujo
único motivo declarado para voltar é **ver que está melhorando**.

Arquivo único HTML, sem build, som 100% sintetizado, abre com duplo clique e funciona offline.
Não é sampler, não é MPC, não é plataforma. As razões de cada uma dessas escolhas estão em
`DECISOES.md` — quando alguém propuser mudá-las, a resposta está lá.

**A promessa:** a evidência de melhora tem de ser confiável. Se o app disser "você melhorou"
quando não melhorou, ele falhou no seu único objetivo — e é pior do que não existir, porque
ensina errado.

---

## O que as auditorias derrubaram

Duas auditorias cegas (sem acesso à documentação do projeto, para não repetirem as conclusões
de quem construiu) devolveram, com números:

1. **A calibração absorve o viés do músico.** O que ela mede é `atraso do aparelho + atraso da
   entrada + o seu viés`, e o app subtrai tudo isso. Apaga justamente o que deveria medir.
   Simulado: quem antecipa 60 ms é diagnosticado "Cravado" em 200 de 200 execuções.
2. **A linha de progresso é, em maioria, ruído.** Com habilidade constante: "melhorou" 30%,
   "piorou" 31%, "estável" 38%. E ela não filtra por exercício nem por etapa — quem melhora de
   verdade mas sobe de etapa é informado de que piorou em 65% das sessões.
3. **A firmeza encolhe com o deslocamento**, por causa do corte da janela de ±130 ms:
   consertar o próprio atraso é lido como piora.
4. **Inversão de portão.** O afrouxamento por reprovação nunca zera: quem oscila 60 ms com 4
   falhas passa a etapa B em 89%; quem oscila 48 ms sem falha passa em 42%.
5. **Conteúdo malformado apaga progresso salvo.** Um erro de digitação num exercício derruba
   `planejar()`, o `catch` de inicialização interpreta como "dado do usuário corrompido" e
   limpa o `localStorage`. Com 16 exercícios novos entrando, isto é questão de tempo.

**Nada disso são acusações verificadas ainda.** O Passo 0 existe para isso.

---

## A distinção que reorganiza tudo

As métricas do app não são igualmente confiáveis, e tratá-las como se fossem é a raiz do
problema:

| medida | o que é | depende de latência? |
|---|---|---|
| **precisão** (P) | você tocou as notas certas? | **não** |
| **limpeza** (L) | você tocou notas que não existem? | **não** |
| **firmeza** (S) | quanto você oscila em torno do seu próprio tempo? | **não** (imune a deslocamento constante) |
| **viés absoluto** (B) | você está atrasado ou adiantado *de verdade*? | **sim, e não é medível aqui** |
| **variação do viés** | você está mais perto do tempo do que estava? | **não**, se for o mesmo aparelho |

Sem microfone nem hardware, um computador comum não consegue separar o atraso do aparelho do
erro do músico. **Viés absoluto não é medível com a precisão que o app anuncia hoje.**

Mas a **diferença** de viés entre sessões, no mesmo aparelho, é válida mesmo com o valor
absoluto errado — o erro do aparelho é constante e se cancela na subtração.

Então o app pode dizer, com honestidade:

> "comparado com as suas últimas sessões, você está 12 ms mais perto do tempo"

e **não pode** dizer:

> "você está atrasando 12 ms"

Isso preserva a promessa do produto inteira. É a variação que ensina, não o número absoluto.

E como P, L e S não dependem de latência, **as etapas A e B são confiáveis hoje.** A temporada
de funk não precisa esperar a medição ficar perfeita — precisa que o app pare de afirmar o que
não sabe.

---

## Os passos — REORDENADOS em 29/09/2026 pela AUDITORIA-v5

**Leia `AUDITORIA-v5.md` primeiro.** Ela substitui a ordem abaixo com uma descoberta que muda
tudo: a linha de progresso era estruturalmente muda (o primeiro "melhorou" entre a 29ª e a 40ª
execução), e o Renato ficou dez dias sem abrir o app. A saída é uma prova fria diária, de 30 s, a
mesma tarefa sempre — e ela vem **antes** do funk.

| ordem | bloco | o que | prova |
|---|---|---|---|
| 1 | **A** fazer voltar | celular + charset (A5) · 3 defeitos (A6) · "oscilação" (A2) · resultado em palavras (A4) · **prova fria diária (A1)** · aquecer no botão laranja (A3) · fim de sessão (A7) | `prova-celular.js`, `prova-diaria.js` |
| 2 | **C** portão honesto | erro ligado ao portão (C1) · vagueio (C2) · referência com data/aparelho (C3) · janela centrada (C4) · progresso por inclinação (C5) | `prova-calib.js` **através de `motivoReprova`** |
| 3 | **B** funk destravado | validador + boot que nunca apaga (B1) · **janela por nota (B2)** · versão do estado (B3) · 2 compassos (B4) · diário (B5) | `prova-conteudo.js` |
| 4 | **funk** | `fk01`–`fk06` com acentos, timbau, acompanhamento | — |
| 5 | **ele jogar** | uma semana de provas diárias e o diário de volta | o único teste que importa |

Fechados antes: Passo 0 (auditorias v4 verificadas), Passo 1 (`CLAUDE.md`, `DECISOES.md`,
`tempoDoEvento`), Passo 2 (referência relativa, janela de medida até 180 ms, deriva com guarda,
afrouxamento que zera, progresso com filtro e ruído — **este último é o que a v5 desmonta**).

Regra nova, aprendida com a v5 e registrada em `CLAUDE.md`: **prova de portão passa pelo portão,
nunca pela função isolada.**

---

## Fora de escopo até ele pedir
Combo, pontuação, XP, som de acerto diferente do de erro, música crescendo em camadas, samples,
Tone.js, MIDI, pads físicos, geração automática de exercícios a partir de áudio.

Nada disso é ruim. Nada disso está no caminho entre "nunca toquei nada" e "vejo que estou
melhorando", que é o caminho inteiro deste app.
