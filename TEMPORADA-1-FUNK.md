# TEMPORADA 1 — "Do pulso ao tamborzão"
16 exercícios · do primeiro pulso ao funk 150 · projetada 2026-09-18

> **Leia primeiro:** os passos abaixo estão **1-indexados** (1 a 16). O código do MUSGA usa
> **0-indexado** (0 a 15). Subtraia 1 de cada passo ao implementar.

---

## 0. A GRADE — AGORA CONFERIDA NA PARTITURA DO PALOMBINI

**Esta seção foi reescrita em 2026-09-18 depois de ler o artigo original.** A reconstrução
anterior (deduzida da onomatopeia) estava errada. O que segue vem do texto de Palombini, que
descreve as posições **em palavras**, com precisão, nas páginas 195-196 — e foi conferido contra a
Figura 5 ("De baixo para cima, o bumbo, os tom-tons e as congas do 'Tamborzão puro'").

### O que Palombini escreve, literalmente (p.196)

Descrevendo a *Ursatz* rítmica do tamborzão segundo **DJ Luciano Oliveira** — "tum pa-pá pum pá":

> *"na linha inferior, **'tum'**, a primeira batida do bumbo, reforçada pela primeira dos tom-tons,
> **na cabeça do primeiro tempo**; na linha superior, **'pa-pá'**, as duas batidas slap da conga
> aguda, a primeira, sozinha **no quarto oitavo do primeiro tempo**, a segunda, reforçada pela
> segunda batida do bumbo, **no sétimo oitavo do primeiro tempo**; na linha intermediária,
> **'pum'**, a terceira batida dos tom-tons, sozinha **na cabeça do segundo tempo**; na linha
> superior, **'pá'**, a primeira batida da conga grave, apoiada pelo surdo de chão da bateria,
> **na metade do segundo tempo**."*

O compasso é **binário** (dois tempos), e "oitavo" é 1/8 do tempo. Dois tempos × oito = **as
dezesseis divisões** que ele cita em outro ponto. É exatamente a nossa grade.

### A tradução para 16 passos

```
            passo:  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16
bumbo               X           .        X        .        .
tom-tons            X                             X
conga aguda (slap)           X           X
conga grave                                                X
                    tum      pa          pá       pum      pá
```

**Ursatz = 1, 4, 7, 9, 13.** Intervalos **3-3-2-4-4**.

E aqui está o achado que muda a progressão inteira: **o primeiro tempo do tamborzão é o tresillo
(3+3+2), e o segundo tempo são duas semínimas.** O exercício 05 desta temporada não é só um degrau
qualquer antes do tamborzão — ele é *literalmente a primeira metade dele*.

**A variante do DJ Sany Pitbull** ("pum pa-pá pum-pum pá", que Palombini prefere escrever
"tum pa-pá pu-tum pá") acrescenta um ataque: *"na linha inferior, 'pum', a terceira batida do
bumbo, sozinha **no segundo quarto do segundo tempo**"* → **passo 11**.

### As vozes, separadas

| voz | passos | fonte |
|---|---|---|
| **bumbo** | 1, 7 (Luciano) · 1, 7, 11 (Sany Pitbull) | texto, p.196 |
| **tom-tons** (grave, "tum"/"pum") | 1, 9 na *Ursatz*; **1, 5, 9, 13** no "tamborzão puro" | texto + Figura 5 |
| **conga aguda** (slap, "pa"/"pá") | 4, 7 | texto, p.196 |
| **conga grave** ("pá") | 13 | texto, p.196 |

A Figura 5 mostra o tom-tom em quatro ataques regulares (1, 5, 9, 13) — a *Ursatz* menciona só a
primeira e a terceira porque é a redução, não a levada completa.

### O que ficou pendente

**As posições do bumbo do volt-mix.** O texto (p.184) diz apenas *"uma linha de bumbo, sincopando
três das dezesseis divisões do compasso"* — sem dizer quais. A Figura 1 existe, mas a notação não
é espacialmente proporcional e não dá para ler as posições com segurança. O exercício 11 fica com
uma reconstrução declarada até alguém transcrever de ouvido a faixa de 1988.

O resto do volt-mix **está no texto** e é firme: chimbal *"dividindo em quatro a unidade do tempo
binário"* (8 por compasso); caixa *"marcando as segundas metades de ambos os tempos"* (passos 5 e
13); *"quatro cliques na primeira metade do tempo forte"* (passos 1 a 4).

---


## A PROGRESSÃO

Um exercício, **uma habilidade nova**. Esse é o critério que manda em tudo.

| # | id | nome | vozes e passos | bpm | habilidade nova | requer |
|---|---|---|---|---|---|---|
| 01 | `fk01` | Pulso | kick 1,5,9,13 | 80→100 | um golpe por tempo, mão dominante | — |
| 02 | `fk02` | Dois e Quatro | kick 1,9 · clap 5,13 | 80→105 | **a segunda mão**; alternância, backbeat. Zero ataques novos | fk01 |
| 03 | `fk03` | Oito no Agudo | hatc 1,3,5,7,9,11,13,15 · kick 1,9 · clap 5,13 | 75→100 | **subdivisão em colcheias com apoio** (o chimbal ancora nos tempos) | fk02 |
| 04 | `fk04` | Só no Contratempo | kick 1,5,9,13 · hatc 3,7,11,15 | 75→100 | **independência real** — nenhum ataque em uníssono | fk03 |
| 05 | `fk05` | Tresillo | timbg 1,4,7 | 85→110 | **a grade de 16**; primeira semicolcheia contramétrica, 3+3+2. **É literalmente o primeiro tempo do tamborzão** | fk04 |
| 06 | `fk06` | Tresillo sobre o Pulso | timbg 1,4,7 · kick 1,5,9,13 | 80→105 | sustentar o contramétrico **contra** a métrica; passos adjacentes 4→5 | fk05 |
| 07 | `fk07` | Pa-Pá | kick 1,9 · clap 5,13 · timba 3,4 | 85→105 | **duas semicolcheias seguidas com a mesma mão** | fk06 |
| 08 | `fk08` | Quatro Cliques | rim 1,2,3,4 · kick 5,9,13 | 90→115 | **corrida de quatro semicolcheias**, alternância obrigatória | fk07 |
| 09 | `fk09` | Bumbo do Volt-Mix | kick 1,4,7,11 · clap 5,13 | 95→120 | **espaçamento irregular** na mesma voz (3-3-4-6); a voz grave vira a sincopada | fk06, fk08 |
| 10 | `fk10` | Tresillo Duplo | timbg 1,4,7,9,12,15 · clap 5,13 | 85→110 | **resistência** — 6 ataques atravessando o compasso | fk09 |
| 11 | `fk11` | Volt-Mix | kick 1,4,7,11 · clap 5,13 · hatc 1,3,5,7,9,11,13,15 | 100→**125** | **três resoluções simultâneas** — 16 no grave, 4 no médio, 8 no agudo | fk09, fk03 |
| 12 | `fk12` | Tum Pa-Pá Pum Pá | timbg 1,9,13 · timba 4,7 | 95→120 | **a _Ursatz_ inteira**: tresillo no 1º tempo, duas semínimas no 2º, grave↔agudo alternando | fk05, fk07 |
| 13 | `fk13` | Timbau sobre o Pulso | timbg 1,9,13 · timba 4,7 · kick 1,5,9,13 | 85→115 | ancorar o ciclo na métrica; a fricção em 4→5 | fk12, fk06 |
| 14 | `fk14` | Bumbo do Tamborzão | kick 1,7,11 · clap 5,13 · rim 1,2,3,4 | 110→130 | **inibição** — o `rim` toca o passo 4 para você ter de *não* tocar o bumbo ali. O 1,7 é do texto; o 11 é a variante do Sany Pitbull | fk09, fk08 |
| 15 | `fk15` | **TAMBORZÃO** | timbg 1,9,13 · timba 4,7 · kick 1,7,11 | 115→**135** | a montagem: a _Ursatz_ sobre o bumbo do tamborzão, não sobre o pulso | fk13, fk14 |
| 16 | `fk16` | Tamborzão 150 | as mesmas do fk15 | 140→**150** | **velocidade, e nada mais** | fk15 |

`fk16` leva `transposicao: {hatc: shk}` para a variante mandelão com chocalho.

> **Correção de 2026-09-18.** Os exercícios 12, 13 e 15 tinham outras posições, deduzidas da
> onomatopeia antes de eu ler o artigo. A partitura e o texto de Palombini corrigiram para
> **1, 4, 7, 9, 13**. A correção melhorou a progressão em vez de estragá-la: o tresillo do
> exercício 05 passou a ser, literalmente, a primeira metade do tamborzão — o jogador aprende
> metade do objetivo final no quinto exercício, e só descobre isso no décimo segundo.

---

## A CURVA

Índice de dificuldade que soma: custo por ataque (com desconto para voz isócrona), custo por
ataque contramétrico, penalidade para voz sem âncora em nenhuma outra, custo por voz extra, custo
por passos adjacentes entre vozes diferentes, pressão de velocidade abaixo de 200 ms e pressão de
andamento acima de 100 bpm.

| # | vozes | ataques | contramétricos | menor intervalo (ms) | **ID** | Δ |
|---|---|---|---|---|---|---|
| 01 | 1 | 4 | 0 | 750 | 1,0 | — |
| 02 | 2 | 4 | 0 | 750 | 3,0 | +2,0 |
| 03 | 3 | 12 | 4 | 400 | 8,5 | +5,5 |
| 04 | 2 | 8 | 4 | 400 | 9,0 | +0,5 |
| 05 | 1 | 3 | 2 | 529 | 4,8 | **−4,2** |
| 06 | 2 | 7 | 2 | 188 | 12,1 | +7,3 |
| 07 | 3 | 6 | 2 | 176 | 18,1 | +6,0 |
| 08 | 2 | 7 | 3 | 167 | 20,5 | +2,4 |
| 09 | 2 | 6 | 3 | 158 | 20,1 | −0,4 |
| 10 | 2 | 8 | 4 | 176 | 24,0 | +3,9 |
| 11 | 3 | 14 | 7 | 150 | 25,9 | +1,9 |
| 12 | 2 | 5 | 4 | 474 | 18,0 | **−7,9** |
| 13 | 3 | 9 | 4 | 176 | 25,9 | +7,9 |
| 14 | 3 | 9 | 5 | 136 | 29,8 | +3,9 |
| 15 | 4 | 10 | 6 | 130 | 35,1 | +5,3 |
| 16 | 4 | 10 | 6 | 107 | 40,4 | +5,3 |

**Os dois recuos são de propósito.**

- **`fk05` (−4,2).** Trocar de resolução de grade — de colcheia para semicolcheia — é a operação
  mais cara da temporada. Ela é comprada sozinha, com uma voz e três golpes. Introduzir a
  semicolcheia dentro de uma textura de três vozes ensinaria a errar.
- **`fk12` (−7,9), o mais importante.** Depois do volt-mix completo (14 ataques, 3 grades), o
  jogador precisa **ouvir** o ciclo 3+2 sozinho antes de montá-lo. É o exercício com o intervalo
  mais confortável de toda a segunda metade.

Os BPMs não sobem monotonicamente (85 no 13 depois de 100 no 11) porque **a escada de andamento é
por habilidade, não global**: toda habilidade nova recomeça devagar. E `fk08`/`fk09` empatam de
propósito — um é velocidade de mão, o outro é decisão métrica; um platô de dois eixos diferentes é
melhor que uma escada monotônica.

---

## O QUE O APLICATIVO PRECISA GANHAR

Só três coisas são obrigatórias. **A temporada inteira cabe em 16 passos, um compasso e dois
andamentos** — nada de swing, nada de multi-compasso, nada de tercina.

### 1. `acentos` — intensidade por golpe (OBRIGATÓRIO)

O tamborzão **é** dinâmica: "pa-**pá**" é um crescendo dentro do grupo de 3, e é isso que faz o
3+2 soar como 3+2 e não como cinco golpes iguais.

```js
{ pad:'timba', passos:[4,7,14], acentos:[0.60, 1.00, 0.75] }   // ausente = todos 1.0
```

Array paralelo opcional: não quebra nenhum exercício existente.

**Escopo restrito de propósito:** o acento vale para a **reprodução e a dica visual, não para a
pontuação**. Pad de toque não lê força de forma confiável. O jogador ouve e vê o acento; continua
sendo medido por precisão, limpeza e estabilidade. Isso mantém a mudança dentro do áudio e do
desenho — nada no portão.

Acentos sugeridos para o ciclo (exercícios 12 a 16):
`timbg [1,11] → [1.00, 0.85]` · `timba [4,7,14] → [0.60, 1.00, 0.75]`

### 2. Dois timbres novos: `timbg` e `timba` (OBRIGATÓRIO)

`tomlo`/`tomhi` sintetizados dão um tom eletrônico, tipo Simmons. O tamborzão é timbau: pele fina
de nylon, queda de afinação rápida, tapa com parciais de membrana. **Sem isso o jogador aprende o
ritmo certo com o som errado.**

Nada de arquivo de áudio. O desenho:

- **`timbg` (toque grave, "tum"/"pum")** — seno com queda de afinação de ~(150+70·v) Hz para 58 Hz
  em 55 ms; parcial triangular em 2,4× caindo para 130 Hz; transiente de ruído em passa-banda
  ~(900+500·v) Hz por 22 ms; saturação `tanh` de 1,6+2,4·v.
- **`timba` (tapa, "pa"/"pá")** — corpo de ruído em passa-banda caindo de (1800+1400·v) Hz para
  1100 Hz em 50 ms; clique de unha em passa-alta 4,8 kHz por 8 ms; **dois parciais de membrana em
  430 e 665 Hz** — é isto que faz soar timbau e não caixa; saturação 2,2+3,0·v.

Em ambos, a intensidade `v` controla quatro coisas ao mesmo tempo — ganho, frequência inicial,
balanço ruído/tom e saturação. É isso que faz o "pa-pá" **crescer de verdade** em vez de só ficar
mais alto.

*(O código completo das duas funções está no relatório do projetista, verificado com `node --check`.)*

**Só isso falta em timbre.** Agogô não entra na temporada; surdo está coberto por `kick`; chocalho
(`shk`), aro (`rim`) e chimbal já existem.

### 3. Acompanhamento por exercício (OBRIGATÓRIO — ver auditoria)

`ACOMP` é uma levada de **house** fixa em código, global, e `acompanhamento()` só sabe *subtrair*
as vozes do aluno. Um bumbo de house em 1-2-3-4 por baixo de um padrão de funk **ensina o pulso
errado**. Precisa virar dado do exercício.

### 4. `guia: true` por voz (OPCIONAL, mas barato)

Uma voz marcada como guia **toca e não é cobrada**. Serve para dar referência métrica nos
exercícios de contratempo (04, 12) e depois **removê-la** no andamento de consolidação — que é
exatamente como se mede estabilidade de tempo.

```js
{ pad:'shk', passos:[1,5,9,13], guia:true }
```

---

## AS TRÊS CAMADAS, SEPARADAS

**Musicologia estabelecida** (das fontes): o tamborzão em 16 divisões, grave em 16 / médio em 4 /
agudo em 8 (Palombini 2014); o bumbo do volt-mix sincopando três das dezesseis (idem); o tamborzão
duplicando o bumbo do volt-mix exceto a segunda contramétrica (Palombini 2016); a *Ursatz* de cinco
ataques 3+2 em loop de um compasso; o volt-mix a 125 bpm com chimbal em 8, caixa em 2 e 4 e quatro
cliques no tempo 1; ancestralidade congo/maculelê em 16 pulsações (Moutinho 2020); andamentos
125-135 (140 no baile), funk 150, mandelão 120-140.

**Transcrição conferida na fonte** (não é mais dedução): a _Ursatz_ em **1, 4, 7, 9, 13**, com
bumbo em 1 e 7, tom-tons em 1 e 9, conga aguda em 4 e 7, conga grave em 13 — tudo descrito em
palavras por Palombini (p.196) e conferido contra a Figura 5. A variante do Sany Pitbull
acrescenta o bumbo no passo 11.

**Ainda deduzido:** as posições do bumbo do volt-mix (o texto diz só "três das dezesseis
divisões"), e os passos 5 e 15 do tom-tom na levada completa, lidos da Figura 5.

**Decisão pedagógica** (minha, sem relação com musicologia): os 16 exercícios, nomes, ordem e
pré-requisitos; todos os BPMs de aprendizado (os de consolidação — 125, 135, 150 — vêm das fontes);
a fórmula do índice de dificuldade inteira, com pesos calibrados até a curva ficar sem degrau; os
dois recuos (05 e 12); o `rim 1,2,3,4` dentro do `fk14`, que é armadilha de inibição inventada e
**não** é afirmação sobre o gênero; o `fk10`, que é ginástica de tresillo e não é tamborzão; a
decisão de não pontuar acento; e comprimir o volt-mix de 4 compassos em 1.
