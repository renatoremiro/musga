# AUDITORIA v5 — o app não faz o Renato voltar
29/09/2026 · cinco lentes cegas (jogador iniciante, complexidade, código, medição, estado da arte),
cada acusação verificada antes de entrar aqui. Escrita como **especificação**: uma IA implementa
sem perguntar; o Renato lê e sabe o que vai mudar na tela.

---

## Veredito em três linhas

1. **Dez dias sem abrir o app é o achado número um.** O app nunca lhe deu uma sessão que mostrasse
   melhora — e "ver que estou melhorando" é o único motivo declarado para voltar.
2. **A linha de progresso é estruturalmente muda.** Três auditorias independentes chegaram ao mesmo
   número: o primeiro "melhorou" só aparece entre a 29ª e a 40ª execução, e só para quem empacou.
   Quem melhora sobe de etapa a cada 2 execuções boas, e subir de etapa zera a série comparável.
   **Eu construí isso** ao filtrar por exercício+etapa+andamento para ter validade estatística —
   e matei a promessa do produto na mesma linha.
3. **A saída é uma tarefa fixa, diária, de 30 segundos**, que alimenta a linha sozinha. Tudo o
   mais nesta auditoria é secundário a isso.

---

## A raiz, com evidência

| quem viu | o que mediu |
|---|---|
| jogador iniciante | 7 execuções, oscilação real caindo 54→26 ms: o cartão mostrou "FIRMEZA 55→28" (que um leigo lê como **piora**), a mesma frase 4 vezes, e "a linha aparece depois de 4 execuções" (o código exige 6) |
| complexidade | robô que melhora de verdade (σ 50→22, 8 sementes): primeiro "melhorou" entre a 29ª e a 39ª execução; **13 cliques e 4min45s** até graduar o 1º exercício, sendo 60 batidas de medição fora do fluxo |
| medição | com 10 execuções por sessão, o primeiro veredito sai na **sessão 4–5**; um adulto iniciante não chega lá |

E a fricção antes de tocar: o botão **medir você** pulsa desde o segundo zero e compete com o botão
laranja; a ajuda diz "dá para ignorar"; a etapa C recusa com "falta o seu ponto" depois de 24/24.
Quem só segue o botão laranja **não gradua** e é marcado TRAVADO.

---

## O que a pesquisa sustenta (fontes ao fim)

- **Bater 50–75 ms antes do clique é normal.** É a *negative mean asynchrony*: −20 a −100 ms em
  não-músicos, ~−50 ms a 800 ms de intervalo; bateristas ~−20 [1,2]. O seu ponto de −56 a −75 ms é
  textbook. **Não é erro; é característica a informar.** E muda 10–30 ms com andamento e com o som
  do próprio toque [2,3] — o que enfraquece comparar clique-a-120-bpm com exercício-a-70.
- **Oscilação (DP) é a métrica de progresso certa.** É o que distingue especialistas, e cai 15–40%
  na primeira hora de prática, pouco depois [2,13]. Platô depois disso é esperado — o app deve dizer.
- **Feedback em toda tentativa não atrapalha** (meta-análise, 61 estudos [6]); o que ajuda é feedback
  **prescritivo** ("o 3 sai atrasado") somado ao resultado, não número solto [29].
- **Desempenho na sessão não é aprendizagem** [23]. A melhora tem de ser medida **fria**, no começo,
  antes de aquecer — a mesma tarefa sempre.
- **Registrar progresso** aumenta o alcance de metas (d=0,40) [24]; **planejar quando e onde** a
  próxima sessão, d=0,65 [27]; **sequência quebrada** desmotiva [25], perder um dia não impede o
  hábito [26]. Sessões de 10–15 min com fim definido [22].

---

## BLOCO A — fazer voltar (antes de qualquer conteúdo)

### A1. A prova fria diária — a única fonte da linha de progresso
**O que:** a primeira ação de toda sessão é a mesma: 4 compassos de *quatro no chão* a 70 bpm, sem
pista, com a máquina calando em 2 dos 4 (a etapa C do h1). 30 segundos. Não conta como exercício,
não sobe etapa, não reprova ninguém. Grava no diário `{tm:1, d, s, c, n, regua}`.
**Onde:** `oQueAgora()` devolve `{tipo:'prova'}` quando não há linha `tm:1` de hoje; `comecar()`
com `modo:'prova'` (lead 1, comps 4, sem `registrar`); `finalizar()` só anota.
**A linha:** `progresso(diario, regua, {tm:1})` — só as provas frias. Mesma tarefa todo dia, então
comparável **desde o 2º dia**. Manter a regra de 2 erros-padrão; abaixo dela a tela diz
*"ainda cedo para afirmar · N dias medidos"*, nunca em branco. Mostrar **um ponto por dia**, com o
1º dia e hoje rotulados.
**Tela:** título *"SUA PROVA DO DIA"*, sub *"os mesmos 4 compassos de sempre · é assim que o app
compara você com você"*. Ao fim: *"oscilação hoje: 31 ms · dia 1: 54 ms"* — e a frase só quando
supera o ruído.
**Prova:** `prova-diaria.js` — 8 dias simulados com melhora real → "MENOS" aparece até o dia 6;
8 dias constantes → nunca; a prova não altera `mapa`.

### A2. "Firmeza" vira "oscilação", e toda métrica diz a direção
**O que:** `firmeza` → **oscilação** em todo texto de tela e legenda, sempre com *"quanto menor,
melhor"* na primeira aparição. O cartão de resultado ganha uma linha de evolução do mesmo exercício
(qualquer etapa): *"oscilação 41 ms · anterior 47 · seu melhor 39"*; se subiu ao mudar de etapa,
*"subiu um pouco: etapa mais difícil, é normal"*.
**Onde:** legendas em `#boxRes` (l.≈290–295), HUD, `drawRetro`, diário (cabeçalho `osc`).

### A3. A medição vira "aquecer", dentro do botão laranja
**O que:** some o botão `medir você` do topo e o rótulo `aparelho · seu ponto ±`. Quando a etapa C
precisa da referência (`!temReferencia()`), o botão laranja vira **AQUECER** e encadeia as rodadas
sozinho até `consolidarRef().ok`, com o véu *"BATA JUNTO COM O CLIQUE · rodada 2 de 3"*. Termina em
*"pronto: o app já conhece o seu jeito de bater"* — **sem número**. A frase "o app aprende como você
bate para não contar isso como erro" é a explicação inteira. Sem referência, a etapa C não é
oferecida (o plano não chega lá), em vez de ser recusada depois.
**Onde:** `planejar()`, `calibrate()`/`endCal()` (auto-encadear com 1,5 s de pausa), `comoJogar()`,
`paintLat()` (só no diário). Ajuda: "Calib. … dá para ignorar" sai.

### A4. Resultado em palavras; número só onde ensina
**O que:** o cartão deixa de mostrar o viés bruto `m.B` (o código o chama de "não atribuível" e a
tela o exibia ao lado de "Cravado"). No lugar, uma palavra a partir de `viesCobravel(m)`: **no
tempo** (|br| < `LIMIAR.vies`), **adiantado 25 ms**, **atrasado 25 ms**; sem referência, **—**.
HUD `notas/erros/ms` sai durante a execução (tira o olho da pista). "Onde você derrapou" só fala de
um tempo do compasso quando ele se afasta da média do próprio jogador por mais de 2 erros-padrão:
*"o 3 sai atrasado"*. `PERFEITO/BOM/QUASE/FORA` vira **NO TEMPO / CEDO / TARDE / perdida**.
**Onde:** `finalizar()` (l.≈2090), `showJudge`, `drawRetro`.

### A5. Celular e charset — o Renato pediu para testar no celular
**O que:** a página **não tem** `<meta charset>` nem `<meta name="viewport">`. No celular abre a
~40% do tamanho; o charset falha esporadicamente ("vocÃª"). Acrescentar na linha 1:
`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">`.
Layout: os pads do exercício ocupam a largura toda em ≤480 px; `touch-action:none` nos pads;
`pointerdown` já cobre toque. Fontes do Google: manter o `<link>` mas garantir *fallback* local
(`font-family` com `system-ui`), porque a D-01 promete abrir offline.
**Prova:** `prova-celular.js` com Playwright em `devices['Pixel 7']` e `devices['iPhone 13']`:
screenshot da primeira tela, tocar um pad por `tap`, uma execução inteira, medir. Zero rolagem
horizontal, botão laranja visível sem rolar, texto ≥ 14 px.
**Pergunta ao Renato:** qual celular e navegador? Fone de fio ou Bluetooth? (Bluetooth soma 100–200 ms
de latência que o navegador **não** informa — a referência precisa ser refeita a cada aparelho, ver C3.)

### A6. Três defeitos visíveis
- `"passou · repita para confirmar (3 de 2)"` — em `finalizar()`, o ramo só vale com
  `seguidas < REPETICOES`; acima, *"passou · falta outro andamento"*.
- `"a linha de progresso aparece depois de 4 execuções"` (l.1925) → usa `MIN_SERIE` — e some com A1.
- Mapa diz "não começou" depois de passar uma vez → *"1 de 2 na etapa A"*.

### A7. Fim de sessão e próxima sessão
**O que:** a sessão tem fim: depois da prova fria + 6 execuções (≈12 min), a tela diz *"por hoje
chega · amanhã a prova do dia te espera"* e mostra os **últimos 14 dias** como pontos (sem
sequência a quebrar). Pergunta *"quando amanhã?"* com três horários; gera lembrete `.ics` por Blob.
**Fonte:** [22,24,25,26,27].

---

## BLOCO B — preparar o funk (bloqueante antes de `fk01`)

### B1. Validador de conteúdo + boot que nunca apaga
**Provado:** exercício novo sem `transposicao` já na C → `"progresso salvo estava ilegível ·
recomeçando"`, `musga.mapa: null`, três graduações perdidas. `requer:'h3'` (texto) → véu preso em
CARREGANDO, mapa apagado. `reftoques` em formato antigo → idem.
**O que:** `validarConteudo(EXERCICIOS, PADS, V)` pura no NUCLEO devolvendo `["id: campo:
problema"]`; regras: id `/^[a-z0-9-]+$/` único; `60≤bpm<bpm2≤180`; `requer` só ids anteriores;
`voz` não vazia; `pad` ∈ PADS com `typeof V[pad]==='function'`, único entre vozes; `passos`
inteiros em `[0, 16·compassos−1]` sem repetição; `transposicao` com destino para cada pad, com
timbre, distinto e fora das vozes; `acento` só como array paralelo, `(0, 1.5]`. Boot: validar
**antes** de `carregarMapa()`; com erro → `SOMENTE_LEITURA=true`, botão laranja desabilitado, véu
*"CONTEÚDO COM ERRO · N problemas · seu progresso não foi tocado"* + os 3 primeiros. O `catch` do
boot **nunca** chama `removeItem`: guarda o bruto em `musga.mapa.ilegivel` e segue com `mapaNovo()`.
Carregar `refhist`/`reftoques` só se `Array.isArray`.
**Prova:** `prova-conteudo.js` — 13 variantes defeituosas; para cada: gravar progresso, abrir,
exigir `musga.mapa` byte a byte igual, véu de erro, zero `pageerror`.

### B2. Janela por nota — o defeito que morde o funk
**Provado:** semicolcheias a 100 bpm (150 ms), atraso constante de **+80 ms → B = −70** ("adiantado");
colcheias a 90 bpm, **+170 → −163**. `casar()` pega a nota mais próxima em ±180 ms; com notas do
mesmo pad a menos de 360 ms, um atraso maior que meia distância casa com a **seguinte**.
**O que:** `janelaDaNota(passosDoPad, passo, passosPorCiclo, sp)` pura = `min(JANELA.limite,
metade da distância às notas vizinhas do mesmo pad − 5 ms)`; `gerar()` grava `n.win`; `casar` e
`venceu` usam `min(n.win, win)` **por nota**.
**Prova (test-timing):** semicolcheias a 100 bpm, robô +80 → nenhum desvio negativo; toque ±170 nas
colcheias a 90 custa o mesmo dos dois lados; nota isolada inalterada.

### B3. Estado com versão, ids que sobrevivem
**Provado:** `normalizarMapa` descarta chave desconhecida e a execução seguinte grava a perda.
**O que:** preservar chaves desconhecidas; `RENOMEADOS={velho:novo}`; `VERSAO_ESTADO` em
`musga.versao` com `MIGRACOES[v]` puras; arquivo mais antigo que o estado → `SOMENTE_LEITURA` +
véu. `retesteDevido`/`proximaRevisao` ignoram id sem `exercicio(id)`.

### B4. Padrão de 2 compassos
**Provado:** passos 0..31 hoje → gera só o 1º compasso, P máximo 0,48.
**O que:** `passosPorCiclo(e)=16·(e.compassos||1)`; `eventosPorCiclo`; `compassosDoPortao` em
múltiplo do ciclo; `gerar`/`pump` em `% passosPorCiclo`; `rotuloPasso` e `drawRetro` para 32
posições. E `TETO_NOTAS` deixa de ser mentira: `compassosDoPortao` = `max(ciclo, min(6,
ceil(32/ev)))` com o teste `≤ 40` valendo de verdade. Decisão do dono: 2 compassos × 16 eventos
com silêncio = 64 notas — aceitar ou cortar o ciclo de silêncio para 2 compassos (1 com som, 1 sem).

### B5. Diário com id de funk
`^h(\d)` → coluna de 6 chars por `id.slice(0,6)`; cabeçalho ganha `osc` e `tm`.

---

## BLOCO C — o portão honesto, de vez

### C1. Ligar o erro ao portão (bug meu, anunciado como pronto em 19/09)
`motivoReprova` l.783: `limiteVies(etapa)` → `limiteVies(etapa, incertezaVies(m))`, com
`incertezaVies(m)=√(erroRef² + (S/√medidos)² + vagueio²)`. `prova-calib` 6b passa a testar
**através de `motivoReprova`**, não a função isolada.

### C2. O vagueio entre sessões entra na conta
A pessoa não é estacionária: as 6 rodadas do Renato têm DP de 27 ms entre si contra 8 explicáveis
por ruído (χ²=60,5, gl=5). `consolidarRef` devolve `vagueio=√max(0, dp(rodadas)² −
dp(toques)²·k/n)`; `endCal` grava `musga.refvag`. Na simulação a acusação falsa cai de 25% para 2%.
Custo honesto, dito na tela: um deslocamento real de 60 ms só é pego em ~20% das execuções.
**E `PORTAO.B.vies=null`**: a B cobrar viés só de quem mediu **pune quem mede** (30% vs 84% de
reprovação). A B libera o exercício seguinte; o viés é cobrado na C.

### C3. Referência com data e aparelho
`endCal` grava `musga.refmeta={lat, fonte:latSemente, data}`. `refVigente()` exige mesma fonte,
|Δlat| ≤ 5 ms, ≤ 30 dias; fora disso o app diz *"o aparelho mudou — vamos aquecer de novo"* e zera
`cal.hist`/`cal.toques`. Sem isso, fone Bluetooth novo → "vies" em 99,6% das execuções.

### C4. Centrar a janela no ponto da pessoa
Hoje só o viés é relativo; P, L, S e o julgamento na tela são absolutos. Pessoa com +100 ms de
atraso não informado e referência medida passa a C em **7%** enquanto a tela diz "isto não conta
contra você". `run.centro = refVigente() ? viesRef : 0`; `casar(tDedo, …, lat+run.centro)`;
`varrerPerdidas` idem; `metricas` conta acerto como `|v−centro| ≤ limiteAcerto`. Na simulação: 7% → 100%.
`TETO_FIRMEZA` 90 → **60** (a partir de ~80 ms de oscilação real o exibido já fica 9–28% abaixo).

### C5. Linha de progresso por inclinação, com avaliação esparsa
Avaliar depois de **toda** execução multiplica o falso alarme: 4–6% por avaliação vira 23% até a
20ª. Avaliar só em n ∈ {6, 8, 10, 15, 20, 30}, por inclinação de mínimos quadrados com t de
Student a 99%. Falso "melhorou" até a 20ª: 22,7% → 3,6%. Com A1 (série diária), isto é o que sobra
da estatística — e basta.

---

## Decisões do Renato em 29/09 — e o que mudam nesta auditoria

1. **Celular: iPhone 13 Pro Max, Chrome (que no iOS é Safari por baixo), fone ainda não comprado.**
   → A5 ganha: publicação em endereço (GitHub Pages — o iPhone não abre `file://`), "adicionar à
   tela de início" (evita o Safari apagar `localStorage` após 7 dias sem uso), exportar/importar
   diário como seguro, e a recomendação **alto-falante ou fone com fio, nunca Bluetooth** (100–250 ms
   não informados e variáveis). D-01 amendada em `DECISOES.md`.
2. **"O app tem que levar adiante quando melhorar; a percepção da melhora é consequência."**
   → **A1 deixa de ser a manchete e vira o freio**: a prova fria diária confirma que o que subiu
   ficou (Soderstrom & Bjork 2015), mas a evidência que a tela destaca é o **avanço** — porque
   competência percebida é o que mantém a prática (Evans et al. 2013) e a oscilação estaciona depois
   da primeira hora (Madison et al. 2013), o que faria um gráfico do mesmo exercício parecer estagnação.
   → Entra **A0 — a jornada visível**: mapa no topo, "você abriu a etapa B" / "conquistou h1" como
   eventos na hora, e um "o que ficou pronto hoje" no fim da sessão.
3. **Duração da sessão:** decisão dele pendente; a evidência favorece 10–15 min com fim definido
   (Baddeley & Longman 1978). A7 fica como proposto, opcional.

### A0. A jornada visível (novo, acima de A1)
**O que:** o mapa de exercícios/etapas passa a ser a primeira coisa da tela, como uma trilha:
cada exercício com A·B·C como três marcas, preenchidas conforme conquistadas, e o próximo passo
aceso. Toda transição vira evento na pista, na hora: *"VOCÊ ABRIU A ETAPA B · agora sem a pista"*,
*"H1 CONQUISTADO · próximo: chimbal em colcheias"*. No fim da sessão, *"hoje: etapa B do h1 ·
1 de 2 na C"*. Nada disso é número.
**Onde:** `pintarMapa()`, `finalizar()` (eventos `conquistou`/`graduou`), `comoJogar()`.
**Prova:** `prova-jornada.js` — robô sobe A→B→C; cada transição aparece na pista antes da próxima
execução; o mapa reflete o estado a cada passo.

### Ordem de execução, atualizada
**A5 → A6 → A0 → A2 → A4 → A3 → A1 → A7** → C1…C5 → B1…B5 → funk → ele jogar uma semana.

---

## O que NÃO mexer (as cinco lentes concordam)
`casar`/`venceu` com janela única por nota · a ponte de relógio · `calibrar()` com filtro MAD e o
acúmulo de toques · `metricas()` separando acerto de medida · a recusa da deriva · a escuta antes do
dedo · duas boas seguidas · revisão fria com intervalo crescente e revogação · a etapa A sem portão de
tempo · a regra de 2 erros-padrão · **arquivo único, sem samples, sem Tone.js** (DECISOES.md).

---

## O que era meu

1. O filtro ex+etapa+bpm que emudeceu a linha de progresso — válido e inútil ao mesmo tempo.
2. `limiteVies(etapa)` sem o erro, anunciado como "o teto carrega a incerteza". A prova testava a
   função isolada. **Nova regra em CLAUDE.md: prova de portão passa pelo portão, nunca pela função.**
3. "Firmeza": nome que inverte o sentido para um leigo. Três sessões de "firmeza 35→30" que ele
   pode ter lido como piora.
4. O botão de medir competindo com o botão laranja, e "3 de 3" sem nada gravado.
5. `TETO_FIRMEZA=90` escolhido a dedo; o honesto é 60.

---

## Ordem de execução
**A5 → A6 → A2 → A4 → A1 → A3 → A7** (fazer voltar: uma sessão) → **C1 → C2 → C3 → C4 → C5**
(portão honesto) → **B1 → B2 → B3 → B4 → B5** (funk destravado) → `fk01`–`fk06`.
Cada item: portão verde (`node portao.js --navegador`) + a prova nomeada acima.

## Perguntas ao Renato
1. Celular: qual aparelho, qual navegador, fone de fio ou Bluetooth?
2. "Ver que estou melhorando" é **o mesmo exercício ficar melhor** (a prova diária) ou **o app te
   levar adiante** (subir de etapa)? Hoje as duas coisas se anulam. A auditoria assume a primeira.
3. A sessão pode ter fim definido (≈12 min)? Ou você prefere tocar até cansar?

## Fontes
[1] Aschersleben 2002, Brain Cogn · [2] Repp & Su 2013, Psychon Bull Rev · [3] Castro-Meneses et al.
2018, PeerJ · [6] McKay et al. 2022, Psychol Sport Exerc · [13] Madison et al. 2013, Acta Psychol ·
[22] Baddeley & Longman 1978 · [23] Soderstrom & Bjork 2015, Perspect Psychol Sci · [24] Harkin et al.
2016, Psychol Bull · [25] Silverman & Barasch 2023, J Consum Res · [26] Lally et al. 2010 · [27]
Gollwitzer & Sheeran 2006 · [29] Oppici, Dix & Narciss 2024. Jogos: osu! (offset perceptivo, UR),
Rock Band (sensores), Rhythm Quest devlog 10 ("teste de toque nunca isola um tipo de latência").
