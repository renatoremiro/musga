# MUSGA — Especificação

Jogo de treinamento rítmico com sampler 4×4.
**v5 — 2026-09-18.** Entrou a **escuta** (corpo e voz antes do dedo), a
navegação livre entre exercícios e etapas, a contagem de entrada visível e o
diário. 249 testes.
**v4 — 2026-09-18.** Blocos A, B e C do `CORRECOES.md` feitos: 237 testes em três portões
(`node portao.js`). Entrou a métrica de **limpeza** e o portão `test-vivo.js`, que reprova código
puro morto e segunda implementação.
**v3 — 2026-09-18.** Passo 1 construído: núcleo puro com 111 testes.
**v2 — 2026-09-18.** Esta versão **corta**: a v1 do documento especificava dezesseis etapas e sete
métricas; esta especifica três exercícios e três métricas, e manda o resto para o apêndice.

> Lido por agente. Toda sessão de IA sobre este projeto lê este arquivo antes de escrever código.
> Não reexplicar o que está aqui — referenciar por seção.
> O corpo do documento é **o que se constrói agora**. O Apêndice A é o mapa completo e **não se
> constrói agora**. `PLANO.md` continua valendo para stack, síntese e calibração.

---

## 1. A tese

Uma frase, e é ela que a v0.5 existe para testar:

> **Retirar o andaime progressivamente ensina ritmo.**

Mostrar a resposta na tela e pontuar a obediência é Guitar Hero: treina reflexo visual, e dá para
zerar surdo. Esconder a resposta desde o começo é impossível: exige já saber a levada de cor. A
resposta é a terceira: a pista existe, e **some** conforme se avança.

Isso não é invenção nossa — é a sequência de Gordon (ouvir e imitar → vocalizar → ler) e a
aprendizagem informal do músico popular descrita por Lucy Green. O que é nosso é implementá-la como
mecânica de jogo, com medição de tempo confiável.

### Três coisas que o brief pedia e que esta especificação corrige

**"Impedir que o jogador memorize sem aprender" pede o impossível.** Memorizar é o objetivo —
memória muscular está na lista de competências. O que não se quer é decorar a **posição visual na
tela** em vez do **tempo**. Distinção com solução mecânica: §5.

**Avaliar "groove" e "coerência" como nota.** Não são mensuráveis; são julgamento estético. O que é
mensurável tem definição operacional (§8). O resto volta como espelho, não como nota.

**Dezesseis etapas de uma vez.** Escopo de anos. §3 corta em três exercícios.

---

## 2. Desempenho não é aprendizagem

O ponto que faltava na v1 deste documento, e o que responde à pergunta *"o sistema sabe se a pessoa
realmente aprendeu?"*:

> Um app que mede só a execução de agora sabe que você **acertou**. Não sabe que você **aprendeu**.

Desempenho é o que você faz hoje; aprendizagem é o que sobra na semana que vem. As duas se
descolam — e a literatura de *desirable difficulties* mostra que às vezes andam em direções
opostas: prática que piora o desempenho de hoje melhora a retenção de amanhã.

Só existe uma evidência de aprendizagem, e é barata de implementar:

> **Reteste frio.** Dias depois, sem aquecimento e sem aviso, na etapa mais difícil.

Por isso o reteste frio (§6) e o mapa de competência (§7) entram na v0.5, apesar de ela ser mínima
em todo o resto. Sem eles o app não pode afirmar que alguém aprendeu nada — e essa afirmação é o
produto.

---

## 3. A v0.5 — o núcleo

**O motor é o produto. O resto é conteúdo, e conteúdo é barato.**

### 3.1 Conteúdo: três exercícios, uma levada

House, porque grade reta é onde o pulso se aprende. A máquina toca o que ainda não é seu; você toca
a sua parte (já construído, `musga.html` v0.4).

| id | nome | sua parte | passos | vozes | o que forma |
|---|---|---|---|---|---|
| `h1-pulso` | quatro no chão | bumbo | 0 · 4 · 8 · 12 | 1 | sentir e manter o pulso |
| `h2-colcheia` | chimbal em colcheias | chimbal | 0 · 2 · 4 · 6 · 8 · 10 · 12 · 14 | 1 | o espaço entre os tempos tem estrutura |
| `h3-duas-vozes` | bumbo e palma | bumbo + palma | 0·4·8·12 e 4·12 | 2 | duas funções sem perder o pulso |

Três exercícios. 100 bpm. Nada mais.

### 3.2 A escuta, e depois o ciclo A → B → C

**Escuta — antes do primeiro contato com o pad.** A máquina toca a levada
inteira por quatro compassos. Os pads ficam apagados e mudos. Você bate palma
ou conta em voz alta junto. **Nada é medido** — medir aqui seria voltar ao dedo.

Era a única crítica da auditoria cega que continuava de pé: *"o app começa e
termina no dedo sobre uma tecla; as três etapas só variam quanto a tela mostra,
e a ação motora é idêntica do início ao fim"*. Dalcroze, Gordon, Kodály e
Konnakol põem corpo e voz como o primeiro lugar onde o pulso se instala, e o
instrumento como etapa final. Acontece uma vez por exercício, antes da etapa A.
O reteste frio nunca passa por ela: ele mede o que ficou.

### 3.2b O ciclo A → B → C

Cada exercício é percorrido três vezes, com menos andaime a cada vez. **A unidade de prática é a
etapa**, e cada uma dura entre 20 e 60 segundos.

| Etapa | O que a tela mostra | Passa com |
|---|---|---|
| **A · Imitação** | a pista completa: cada nota chegando até a linha | `P` ≥ 80% em 16 eventos |
| **B · Memorização** | duas voltas com pista; depois a pista **apaga** e fica só o clique no tempo | `P` ≥ 70% **e** `S` ≤ 45 ms, com a pista apagada |
| **C · Performance** | nada. Só `100 bpm · 4/4 · 4 compassos · bumbo` | `P` ≥ 70% **e** `S` ≤ 35 ms, em 4 compassos contínuos |

As três não se negociam: são a espinha. **Etapa A sozinha não é o produto** — é o Guitar Hero que
dissemos que não íamos fazer.

### 3.3 Três métricas

Para uma execução com `N` eventos esperados e desvios `d₁…dₖ` em ms, já descontada a latência:

| Métrica | Fórmula | O que revela |
|---|---|---|
| **Precisão** `P` | eventos casados / `N` | você tocou **o que** foi pedido |
| **Limpeza** `L` | eventos casados / toques dados | você tocou **só** isso |
| **Viés** `B` | média(`dᵢ`), **com sinal** | você antecipa ou atrasa, sistematicamente |
| **Firmeza** `S` | desvio-padrão(`dᵢ`) | quão estável é sua mão |

**Por que `L` existe.** A auditoria cega apontou: nota perdida já custava — ela não entra na lista
de desvios e derruba `P`. O **toque sobrando** não custava nada, e era por ali que se martelava e
graduava. `P` pergunta *"você tocou o que foi pedido?"*; `L` pergunta *"você tocou só isso?"*.
Exigência por etapa: 0,55 em A (com a pista na tela, tatear faz parte), 0,70 em B, **0,85 em C** —
performance é tocar o padrão, não em volta dele.

`B` e `S` juntas dão a definição de groove (§8) sem custo nenhum. A quarta métrica — repetibilidade,
o desvio entre repetições do mesmo compasso — é a primeira a entrar depois, e é a que mede tocar.
As outras três do mapa completo ficam no Apêndice A.

### 3.4 Graduação: transposição e andamento

Vencer a Etapa C **não** gradua. Gradua vencer a Etapa C em condições que o exercício nunca treinou:

1. **Transposto** — o mesmo ritmo, nos mesmos papéis, em **outros pads**
   (`bumbo → tom grave`, `palma → aro`, `chimbal → ganzá`).
2. **Em outro andamento** — ±20 bpm.

Quem aprendeu o ritmo passa nas duas. Quem decorou onde a luz acende, não passa em nenhuma. É o
mecanismo anti-memorização inteiro da v0.5, e é o mais forte que existe.

Até passar, o exercício fica marcado **em treino** — mesmo com 100% de acerto.

### 3.4b Três portas diferentes — achado da simulação do Passo 1

Percursos simulados de jogadores sintéticos derrubaram duas regras que estavam neste documento.
Ambas viravam **muro**, e muro foi o que já fez o protótipo v0.3 ficar intransponível.

**O que estava errado.** Desbloquear o exercício seguinte exigia concluir a Etapa C. Um iniciante
que estabiliza a firmeza em ~50 ms nunca passa de C, nunca destrava nada, e fica preso para sempre.
Pior: com "treino antes de novo" em ordem fixa, ele nem chegava a *ver* o segundo exercício.

**A correção — três coisas diferentes, três portas:**

| Porta | O que prova | Afrouxa? |
|---|---|---|
| **Etapa B** | prontidão — libera o exercício seguinte | **sim** |
| **Etapa C** | domínio — a barra de verdade | **não, nunca** |
| **Graduação** | retenção — C + transposição + outro andamento, confirmada em reteste frio | não |

**Tolerância adaptativa, só na Etapa B.** A cada tentativa falha em B, o limite de firmeza afrouxa
10%, até +40% (45 → 63 ms). A Etapa C não afrouxa nunca, e o reteste frio (§6) usa sempre a barra
cheia. Assim a barra continua alta sem trancar ninguém, e o afrouxamento fica registrado no mapa —
não é segredo.

**Intercalação, antecipada do Apêndice A.** Entre os exercícios em treino, o app vai para o **menos
travado**. Se todos acumularam 3 falhas na etapa atual e há conteúdo novo, ele abre o novo. Variar é
mais produtivo que insistir, e intercalar melhora a retenção — era um mecanismo do mapa completo que
a simulação mostrou ser necessário já na v0.5.

### 3.5 Fora da v0.5

Techno, soul, jazz · contratempo, síncope, ghost notes · três e quatro vozes · independência ·
polirritmia · dinâmica e velocity · MIDI · criação e sua avaliação · samples do usuário · deriva,
subdivisão e independência como métricas · combo, medalha, score, streak, ranking · entrada
aleatória e intercalação · revisão espaçada como agenda · qualquer backend, conta ou nuvem.

Esta lista é contrato. Nada dela entra sem o critério de §9 ter sido atingido primeiro.

---

## 4. Detecção de tempo

Construído e aferido. `musga.html`, bloco `PURE`; 94 testes em `test-timing.js`.

`AudioContext.currentTime` é a única fonte de tempo; agendamento por lookahead de 25 ms com janela
de 100 ms. Todo desvio é calculado **descontando** o atraso medido da máquina — sem isso o app acusa
de erro quem tocou certo. Um toque casa com o evento esperado mais próximo, do mesmo pad, ainda não
julgado, dentro de ±180 ms; o que não casa é **evento excedente**, contado à parte e nunca como erro
de tempo.

| Julgamento | Janela | Vale |
|---|---|---|
| perfeito | ±40 ms | 1,0 |
| bom | ±80 ms | 1,0 |
| quase | ±130 ms | 0,5 |
| fora | além | 0,0 |

Cedo e tarde são julgados igual. A direção é informação pedagógica, nunca penalidade diferente.

---

## 5. O que o reteste substitui

O mapa completo (Apêndice A) tem quatro mecanismos anti-memorização. A v0.5 usa dois —
transposição e andamento (§3.4) — e acrescenta o reteste frio, que é de outra natureza: os dois
primeiros provam que você entendeu o ritmo **agora**; o reteste prova que ficou.

---

## 6. Reteste frio

A peça que permite o app dizer "você aprendeu".

**Quando.** Ao abrir o app, antes de qualquer aquecimento, se existir algum exercício graduado há
**2 dias ou mais** e ainda não retestado nesse intervalo.

**Como.** O exercício mais antigo entre esses, direto na **Etapa C**: nenhuma pista, nenhum aviso de
que é um teste, nenhuma volta de aquecimento. Uma tentativa.

**Resultado.**

| | Consequência |
|---|---|
| **Passou** (`P` ≥ 70%, `S` ≤ 35 ms) | Confirmado. Registra data e firmeza. Próximo reteste em 2× o intervalo anterior. |
| **Não passou** | Volta para a Etapa B. A graduação é revogada e a data zera. Sem drama na tela: "vamos revisar esse." |

**O intervalo dobra** a cada confirmação: 2 dias → 4 → 8 → 16. É repetição espaçada na forma mais
simples possível, e entra como **conteúdo da sessão**, nunca como cobrança ou streak.

**Por que uma tentativa só.** Duas tentativas medem quanto você reaprende em trinta segundos, o que
é outra coisa. A primeira, fria, é a única que mede o que ficou.

---

## 7. Mapa de competência

O app não guarda "em que fase você está" — uma posição numa fila diz pouco. Guarda **o que você
tem**, por exercício, com data. É o modelo do keybr: não um nível, um mapa de onde você está forte e
onde está vencido.

```json
{
  "h1-pulso": {
    "etapa": "C",
    "graduado": "2026-09-20",
    "transposto": true,
    "andamentos": [100, 120],
    "retestes": [{ "data": "2026-09-22", "passou": true, "firmeza": 28 }],
    "proximoReteste": "2026-09-26",
    "firmezaHistorico": [52, 41, 33, 28]
  },
  "h2-colcheia": { "etapa": "B", "graduado": null },
  "h3-duas-vozes": { "etapa": null }
}
```

`firmezaHistorico` é o único progresso que o app mostra: **você contra você**, ao longo do tempo.
Nunca contra outra pessoa.

O que vem a seguir numa sessão sai daí, nesta ordem: **reteste devido → exercício em treino →
exercício novo.**

Sessão de 8 a 12 minutos: um reteste (se houver), duas a três etapas novas. Acaba quando acaba.

---

## 8. Groove: a definição operacional

A melhor consequência de medir `B` e `S` separadas:

> **Groove é desvio consistente. Erro é desvio inconsistente.**

O mesmo atraso de 25 ms na caixa é *feel* quando a firmeza é alta e é desleixo quando é baixa. Mesmo
número, significados opostos.

| `B` viés | `S` firmeza | Leitura |
|---|---|---|
| ≈ 0 | boa | cravado |
| ≠ 0 | **boa** | **feel deliberado** — "você atrasa 22 ms, sempre" |
| ≠ 0 | ruim | atrasando, e de maneira irregular |
| ≈ 0 | ruim | na média certo, oscilando |

Limiares: `S ≤ 20 ms` consistente · `S ≥ 35 ms` instável · `|B| ≥ 15 ms` viés real.

É por isso que soul e jazz existem no mapa completo: eles **exigem** viés com firmeza. Mas o motor
que os mede já está de pé na v0.5 — o que falta lá é só conteúdo.

---

## 9. O critério que prova a tese

Não é uma métrica de tela. É um teste de campo, e ele tem um sujeito: o Renato.

> Três sessões, em três dias diferentes.
> No quarto dia o app abre e pede `h1-pulso` **frio**, na Etapa C, sem aquecimento.
> Ele toca quatro compassos sem nenhuma pista na tela, e a firmeza fica **abaixo de 35 ms**.

Se acontecer: a tese está provada, o motor está certo, e daí em diante é adicionar conteúdo — que é
barato. Se não acontecer: nenhuma das dezesseis etapas do Apêndice A conserta, e é muito melhor
descobrir isso com três exercícios do que com sessenta.

**Critério secundário**, igualmente importante e mais difícil de fingir: na terceira sessão você
abre o app **porque quer**, não porque eu pedi.

---

## 10. Arquitetura

Stack travada do `PLANO.md` §5: puro, sem build, Web Audio, síntese, sem backend.

| Módulo | Responsabilidade | Puro? |
|---|---|---|
| `tempo` | relógio, lookahead, swing, posição de passo | **sim** — existe (bloco `PURE`) |
| `julgamento` | casamento, janelas, veredito | **sim** — existe |
| `metricas` | `P`, `B`, `S` | **sim** — a construir |
| `diagnostico` | métricas → uma frase (§11) | **sim** — a construir |
| `progressao` | etapas, graduação, transposição, reteste devido, o que vem agora | **sim** — a construir |
| `exercicios` | os três exercícios como dados | dados |
| `sintese` | os 16 instrumentos | não |
| `pista` | canvas, notas descendo, andaime por etapa | não |
| `entrada` | teclado e toque, atrás de uma interface onde MIDI encaixa depois | não |
| `armazem` | `localStorage`: latência, mapa de competência | não |

**A regra que fez este projeto funcionar e que continua:** tudo que é decisão — tempo, julgamento,
métrica, diagnóstico, progressão — vive em **função pura**, dentro de um bloco delimitado, **testado
fora do navegador** por `test-timing.js`, que extrai o bloco do próprio `musga.html`. Não existe
cópia que possa divergir do código que roda.

Arquivo único enquanto couber; quebra passando de ~1500 linhas, e `metricas` sai primeiro.

### O exercício como dado

```json
{
  "id": "h3-duas-vozes",
  "nome": "bumbo e palma",
  "bpm": 100,
  "voz": [
    { "pad": "kick", "passos": [0, 4, 8, 12] },
    { "pad": "clap", "passos": [4, 12] }
  ],
  "transposicao": { "kick": "tomlo", "clap": "rim" },
  "requer": ["h2-colcheia"]
}
```

---

## 11. Feedback: quatro frases

Uma frase por execução, escolhida por regra. Nunca um placar.

| Condição | Frase |
|---|---|
| `P` alta, `S` ruim | "Você conhece o padrão. Agora trabalhe a firmeza." |
| `P` alta, `S` boa, `|B|` alto | "Firme — mas você está {antecipando\|atrasando} {B} ms em tudo." |
| `P` alta, `S` boa, `|B|` baixo | "Cravado." |
| `P` baixa | "Ouça mais uma volta antes de tocar." |
| `L` baixa | "Você está tocando notas que não existem no padrão. Toque menos." |

**Nunca aparece:** "errado", "perdeu", "game over". Execução ruim custa não subir de etapa, nada
mais. As outras sete frases do mapa completo ficam no Apêndice A.

---

## 12. Portões de aceite da v0.5

`node test-timing.js` verde é pré-requisito de qualquer entrega.

| # | Portão | Como se verifica |
|---|---|---|
| 1 | Matemática de tempo correta | os 94 testes atuais continuam verdes |
| 2 | Latência descontada sem esconder o erro do músico | já testado: +100 ms de máquina some, +45 ms de músico permanece |
| 3 | Métricas corretas | dados sintéticos com `P`, `B` e `S` conhecidos → as funções devolvem os números injetados |
| 4 | Diagnóstico não se contradiz | toda combinação possível de `P`, `B`, `S` cai em exatamente uma frase |
| 5 | Graduação exige transposição | jogador simulado que acerta só nos pads originais **não** gradua |
| 6 | Reteste revoga | mapa simulado: exercício graduado + reteste reprovado → volta para a Etapa B, data zerada |
| 7 | Intervalo dobra | 2 → 4 → 8 → 16 dias a cada confirmação |
| 8 | Progressão não tranca nem pula | percursos simulados de um jogador mediano e de um bom: ambos avançam, nenhum salta etapa |
| 9 | Etapa C é vencível por humano | §9. O único portão que um teste não fecha. |

---

## Apêndice A — O mapa completo (não construir agora)

Registro do desenho ambicioso, para quando o critério de §9 for atingido. **Nada daqui entra na
v0.5.**

### Os sete eixos de dificuldade

Um nível não é um degrau: é um ponto num espaço de sete eixos. A regra que governa tudo é
**um eixo sobe por vez** — violar isso foi o que fez o protótipo v0.3 ficar intransponível.

| Eixo | Nome | Do mais fácil ao mais difícil |
|---|---|---|
| D1 | densidade temporal | semínima → colcheia → semicolcheia → swing → mistas |
| D2 | número de vozes | 1 → 2 → 3 → 4 |
| D3 | posição métrica | no pulso → contratempo → síncope → deslocamento → ghost notes |
| D4 | andaime visual | pista completa → só o próximo compasso → só o pulso → nada |
| D5 | duração contínua | 1 compasso → 2 → 4 → 8 → indefinida |
| D6 | tolerância | ±130 → ±80 → ±40 ms |
| D7 | andamento | 60 → 80 → 100 → 120 → 140 bpm |

**D7 é o eixo mais fraco.** Aumentar o bpm é a forma mais barata e menos pedagógica de aumentar
dificuldade. Soul a 90 bpm com a caixa atrasada 22 ms é mais difícil que house a 130. D7 sobe para
consolidar o que já foi aprendido em outro eixo, nunca como progresso em si.

A v0.5 usa três eixos: D1, D2 e D4.

### A trilha em dezesseis etapas

Os treze níveis do brief, traduzidos em coordenadas. Virou dezesseis porque três dos níveis
originais embutiam dois saltos de eixo, e a regra não permite. `—` = não muda.

| # | Etapa | D1 | D2 | D3 | D4 | D5 | D6 | D7 | Competência |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Pulso | semínima | 1 | pulso | completa | 1 | ±130 | 80 | sentir o pulso |
| 2 | Pulso firme | — | — | — | — | 4 | ±80 | — | manter sem derivar |
| 3 | Andamento | — | — | — | — | — | — | 60→120 | a mesma estrutura em outras velocidades |
| 4 | Duas funções | — | 2 | — | — | — | — | 100 | função sonora no compasso |
| 5 | Colcheia | colcheia | — | — | — | — | — | — | o vão tem estrutura |
| 6 | Contratempo | — | — | contratempo | — | — | — | — | sentir o vão, antecipar |
| 7 | Coordenação | — | 3 | — | — | — | — | — | alternar sem perder o pulso |
| 8 | Semicolcheia | semicolch. | — | — | — | — | — | 90 | subdivisão fina |
| 9 | Síncope | — | — | síncope | — | — | ±40 | — | acento deslocado |
| 10 | Memória | — | — | — | só o pulso | — | — | — | executar sem indicação |
| 11 | Autonomia | — | — | — | **nada** | 8 | — | — | memória muscular |
| 12 | Independência | — | 4 | — | — | — | — | — | camadas simultâneas |
| 13 | Polirritmia | mistas | — | — | — | — | — | — | manter uma, executar outra |
| 14 | Groove | — | — | ghost notes | — | indefinida | — | — | pocket, variação, não acelerar |
| 15 | Performance | — | — | — | — | — | — | livre | tocar a partir de bpm + estrutura |
| 16 | Criação | — | — | — | — | — | — | — | criar a própria batida |

As etapas 1 a 5 são o que a v0.5 cobre, comprimidas em três exercícios.

### As outras quatro métricas

| Métrica | Fórmula | O que revela |
|---|---|---|
| **Repetibilidade** `R` | desvio-padrão, por posição métrica, de `d` **entre** repetições do compasso | você repete do mesmo jeito — isto é tocar. **É a próxima a entrar.** |
| **Deriva** `D` | coeficiente angular de `dᵢ` no tempo, em ms/compasso | você acelera ou arrasta progressivamente |
| **Subdivisão** | moda do histograma de `dᵢ`; pico em ±½ ou ±1 passo | entendeu a divisão errada, não errou a mão |
| **Independência** `I` | `S(voz A \| com B) − S(voz A \| sozinha)` | a voz A desmonta quando a B entra |

**Memória** não é métrica nova: é `P(Etapa C) / P(Etapa A)`.
**Dinâmica** não é computável sem MIDI, e não será simulada.

### As outras sete frases de diagnóstico

| Condição | Frase |
|---|---|
| `P` baixa, `S` boa | "Você toca um padrão consistente — mas não é este." |
| pico em ±½ passo | "Você está tocando colcheias onde são semicolcheias." |
| `D` > 8 ms/compasso | "Você acelera. Volte ao clique." |
| `D` < −8 ms/compasso | "Você arrasta. O pulso não está te sustentando." |
| `I` alto | "Sua {voz A} desmonta quando entra a {voz B}. Treine A sozinha mais rápido." |
| erro concentrado numa posição | "Todo erro está no {contratempo do 3}. É só esse ponto." |
| excedentes altos | "Você está tocando notas que não existem no padrão." |

### Os outros dois mecanismos anti-memorização

**Entrada aleatória** — o loop começa no compasso 3, não no 1. Quebra a sequência decorada sem mexer
no ritmo. **Intercalação** — dois exercícios já vistos, alternados sem aviso; piora o desempenho na
hora e melhora a retenção.

### Gamificação: o que pode entrar, e o que nunca entra

**Pode:** combo que zera na hora e não acumula entre sessões · desbloqueio por competência.
**Nunca:** streak diário (transforma prática em dívida; quem quebra abandona) · ranking entre
pessoas · vidas e game over · score global acumulado · desbloqueio por moeda ou permanência.

**Teste de sanidade:** se a pessoa jogar seis meses, ganhar tudo, e **não conseguir** tocar uma
batida sem o app, o design falhou — mesmo com engajamento perfeito.

---

## Apêndice B — Ambiguidades do brief, e as decisões

| # | Ambiguidade | Decisão |
|---|---|---|
| 1 | "pads físicos ou virtuais" | v0.5: teclado e toque. A entrada é adaptador; MIDI USB encaixa sem reescrever. Bluetooth MIDI fora para sempre: 60–120 ms. |
| 2 | dinâmica / intensidade do toque | Fora. Teclado não tem sensibilidade a toque, mouse não tem. Só com MIDI. Não simular. |
| 3 | independência entre mãos | Parcial quando chegar: QWERTY treina coordenação real, não mecânica de baterista. |
| 4 | polirritmia | Depois. Definição: duas vozes com ciclos de comprimento diferente (3 contra 4). É conteúdo; o motor já suporta. |
| 5 | "sampler" — o brief fala de samples, o app sintetiza | v0.5 sintetizada: zero arquivos, zero licença, aprovada de ouvido. Depois, **samples do próprio usuário** — cumpre a promessa de sampler e é o movimento pedagógico certo: seus sons, seu universo. |
| 6 | "não penalizar excessivamente" | Traduzido em números: janelas de §4, portões de §3.2, e **nenhuma vida, nenhum game over, nenhuma reprovação**. Só não subir de etapa. |
| 7 | o que é uma sessão | 8 a 12 minutos: um reteste devido, duas a três etapas. §7. |
| 8 | repertório | House na v0.5. Techno, soul e jazz depois — e a **diferença de microtempo entre eles** é o currículo avançado (§8), não um detalhe de sabor. |
| 9 | latência (ausente do brief) | Resolvida e aferida. `PLANO.md` §6. |

---

## Apêndice C — Riscos

| Risco | Gravidade | Mitigação |
|---|---|---|
| **Virar Guitar Hero por inércia.** A Etapa A é divertida e barata; B e C são difíceis | **alta** | A v0.5 não é aceita sem B **e** C funcionando |
| **Escopo.** O Apêndice A é sedutor | **alta** | A lista de §3.5 é contrato. Nada entra antes de §9 |
| **Decorar a tela** | alta | §3.4: graduação exige transposição |
| **Confundir acertar com aprender** | alta | §6: reteste frio. É o que responde a pergunta |
| **Nota arbitrária em "groove"** | média | §8 mede o mensurável; o resto é espelho |
| **Frustração na primeira etapa.** Já aconteceu na v0.3 | média | Três exercícios, um eixo por vez, 100 bpm |
| **Freire virar verniz** | média | Teste: o app funcionaria igual sem a Etapa C e sem o espelho? Se sim, é verniz |
| **Excesso de especificação.** Aconteceu na v1 deste documento | média | Este corte. E o hábito de mandar para o apêndice em vez de construir |

---

## Fontes

[Gordon Music Learning Theory](https://en.wikipedia.org/wiki/Gordon_music_learning_theory) ·
[Kodály, Orff e Dalcroze](https://nafme.org/blog/kodaly-orff-and-dalcroze-a-whos-who-and-whats-what/) ·
[Lucy Green / Musical Futures](https://www.musicalfutures.org/our-approach/) ·
[Desirable Difficulties — Bjork](https://yukaichou.com/gamification-analysis/desirable-difficulties-bjork-learning-vs-performance/) ·
[Critical Perspective on Gamification](https://link.springer.com/chapter/10.1007/978-3-319-10208-5_21) ·
[keybr — adaptação por elemento](https://www.keybr.com/help) ·
[osu! — janelas de julgamento](https://osu.ppy.sh/wiki/en/Beatmap/Overall_difficulty) ·
[Clone Hero — calibração](https://wiki.clonehero.net/books/guides-and-tutorials/page/calibrating-audio-and-video) ·
[A Tale of Two Clocks](https://web.dev/articles/audio-scheduling)
