# AUDITORIA CEGA v3 — MUSGA, com a temporada de funk em vista
**Data:** 2026-09-18 · **Alvo:** cópia isolada (85.853 bytes) · **Portão no momento:** 293 testes + 40 provas, ABERTO
**Método:** três auditores independentes — um jogador, um arquiteto, um avaliador de objetivos —
proibidos de ler especificação, testes, documentação ou histórico. Fonte única: o aplicativo.
Toda acusação abaixo foi **reproduzida e verificada por mim** antes de entrar aqui.

---

## AS TRÊS PERGUNTAS DO RENATO

### "Objetivos claros?" — **Não.**

O auditor cego, depois de usar o app, escreveu o objetivo que conseguiu deduzir:

> *"Um medidor de precisão rítmica que retira progressivamente o apoio visual e cobra que você
> repita a mesma levada sem ele, duas vezes seguidas, para liberar a próxima."*

Um **medidor**. Não "um app que ensina ritmo". E ele registrou de onde tirou a frase: **60% do
código, 30% do painel de ajuda escondido atrás de um botão, 10% da tela.** A tela nua diz uma
coisa só sobre propósito — `treinador de ritmo`, em 9 px, ao lado da marca. Não há frase de
abertura, não há "o que você vai saber fazer depois".

E há **dois objetivos brigando dentro do mesmo app**: uma escola (etapas, graduação, revisão
espaçada, mapa de competência) e um instrumento (16 pads, modo livre, "bateria sintetizada").
O app gasta metade da tela num teclado de bateria que ele mesmo desliga quando o treino começa —
**15 dos 16 pads ficam inertes.**

### "Estamos conseguindo?" — **Não, e por três motivos que eu reproduzi.**

### "A arquitetura atende?" — **Para a temporada de funk, sim, com quatro correções.** Ver a última seção.

---

## OS SEIS DEFEITOS QUE INVALIDAM A MEDIÇÃO

### 1. Omitir uma nota é MELHOR do que tocá-la mal — CRÍTICO

O furo central. `metricas()` calcula viés e firmeza **só sobre as notas que a pessoa escolheu
tocar**. Reproduzido, mesmo músico, mesma oscilação real:

```
honesto    24/24   B=-8 ms   S=45 ms  → REPROVADO  "trabalhe a firmeza"
hesitante  20/24   B=-11 ms  S=35 ms  → PASSOU     "Cravado."
```

O hesitante é o mesmo jogador **omitindo as quatro notas em que hesitou**. Perder uma nota custa
1/24 de precisão, e o portão permite perder 7 de 24. Tocá-la mal custa uma amostra ruim no
desvio-padrão, que é o portão apertado. **Errar sai mais caro do que não tocar.**

Em "quatro no chão", largar 4 dos 24 bumbos é musicalmente catastrófico. O app chama isso de
*"Cravado."*

### 2. O único momento em que você segura o tempo sozinho não é medido — e some no funk

Foi a melhor ideia do Passo 2 e ela está pela metade. Os desvios dos compassos mudos entram no
mesmo balde dos compassos com máquina. O auditor simulou um "eco" — preciso com a máquina,
derivando 130 ms por compasso no silêncio:

```
24/24 · viés +21 ms · firmeza 30 ms · PASSOU
```

Derivou um oitavo de tempo cada vez que ficou sozinho, e o app não viu.

**E é pior para a temporada.** `compassosDoPortao = ceil(24 / eventos por compasso)`:

```
 4 eventos/compasso → 6 compassos, 2 mudos
 8 eventos/compasso → 3 compassos, 1 mudo
12 eventos/compasso → 2 compassos, 0 mudos   <<< a tese evapora
16 eventos/compasso → 2 compassos, 0 mudos   <<< a tese evapora
```

**Todo exercício com 12 ou mais eventos por compasso nunca cala a máquina.** O volt-mix da
temporada tem 14. Metade do funk perde a mecânica pedagógica central sem ninguém perceber.

A mesma raiz produz outro absurdo: `PORTAO.eventos = 24` fixo significa que o **exercício mais
difícil da temporada seria avaliado em 5 segundos** e o mais fácil em 14. Está de cabeça para
baixo.

### 3. A revogação da graduação é cosmética — reproduzido

`aplicarReteste()` zera `graduado` e põe `etapa='A'`, mas **não toca em `seguidas`, `transposto`
nem `andamentos`**:

```
antes:     graduado=2026-09-01  seguidas={A:2,B:2,C:4}  transposto=true  andamentos=[70,90]
reteste REPROVOU → etapa=A  graduado=null  seguidas={A:2,B:2,C:4}  transposto=true  andamentos=[70,90]
UMA execução C boa depois → eventos=["conquistou","graduou","passou"]   graduado=2026-09-20
```

**Uma execução para recuperar uma graduação que custou oito.** A transposição e o segundo
andamento — as duas coisas que *definem* graduar — nunca são reconferidas. O reteste frio, que a
ajuda chama de "a única evidência de que algo ficou", é teatro.

### 4. A regra de repetibilidade não mede repetibilidade

Duas coisas somadas, as duas reproduzidas:

- **Abandonar uma execução não custa nada.** Comecei uma etapa B, não toquei, apertei Parar:
  `falhas` intactas, `seguidas` intactas, diário sem linha nova. Tentativa de graça.
- **Duas boas seguidas acontecem em 50 segundos.** Monte Carlo com as funções do próprio app:
  quem oscila 35 ms (a própria barra) passa 54% das vezes; quem oscila 40 ms passa 22%. Com 24
  amostras o desvio-padrão medido tem ±8 ms de ruído.

Resultado: **"duas seguidas" mede teimosia, não habilidade** — que é exatamente o contrário do
que o comentário no código diz que a regra existe para fazer.

*(Nota: deixar a execução TERMINAR sem tocar conta falha e afrouxa a tolerância de B — os dois
auditores descreveram casos diferentes e os dois estavam certos.)*

### 5. O app elogia e reprova na mesma tela, sem dizer por quê — reproduzido

```
18/24 notas cravadíssimas → frase "Cravado."   ·   portão A: REPROVADO
LIMIAR.precisao = 0.70   mas   PORTAO.A.P = 0.80
```

Entre 0,70 e 0,80 o diagnóstico elogia e o portão reprova. **E o app nunca diz qual critério
reprovou.** É a falha de comunicação mais cara do arquivo.

### 6. A frase corrige e absolve na mesma linha — reproduzido

Para **todo** viés entre 15 e 35 ms:

```
"Firme — mas você está atrasando 25 ms em tudo. Firme e deslocado: isso é feel, não erro."
```

`diagnostico()` dispara viés acima de 15 ms; `leituraGroove()` chama de feel até 35 ms. As duas
faixas se sobrepõem, e é justamente a faixa que interessa.

---

## O QUE EU MESMO INTRODUZI NO PASSO 1, E QUE PRECISA SER OLHADO

A semente de latência do navegador (`AC.outputLatency`). No Chromium daqui ela vale **32 ms**.
`LIMIAR.vies` é 15 ms. Ou seja: **a semente vale 2,1× o limiar que dispara "você está
antecipando"**. Um robô tocando dentro de ±6 ms das notas recebeu:

> viés −30 ms · *"Firme — mas você está antecipando 30 ms em tudo."*

Para um humano isso está certo (ele ouve o som 32 ms depois). Mas o número nunca foi verificado
naquele aparelho, e o Renato, quando calibrou de verdade, mediu **7 ms** — não 32. Se a semente
errar por 25 ms, o app acusa de viés um músico que não tem viés. O comentário que eu escrevi para
remover o `collectDrift` dizia que ele "trocava a referência de tempo"; a semente faz o mesmo pelo
outro lado, com mais educação.

**Não é motivo para remover a semente** — sem ela as notas legítimas caem fora da janela. É motivo
para o diagnóstico de viés **dizer que está apoiado num número não medido** enquanto ninguém
calibrou, e para o portão de viés não reprovar nesse estado.

---

## O QUE O APP MEDE E JOGA FORA

| dado | escrito em | lido em |
|---|---|---|
| `firmezaHistorico` | `registrar`, `aplicarReteste` | só o desenho do mapa. **Nenhuma decisão.** |
| `retestes[]` (data, passou, firmeza) | `aplicarReteste` | **lugar nenhum. Nem exibido.** |
| `run.perdidas` | `varrerPerdidas` | **lugar nenhum.** |
| `leituraGroove()` | 6 classificações | só `'feel'`. `'deslocado'`, `'oscilando'`, `'vies-instavel'` descartados. |
| dispersão das 3 calibrações | exibida | **não bloqueia nada.** "instável · 40 ms" pontua igual a "confiável · 3 ms". |
| desvios dos compassos mudos | nem separados | o dado mais diagnóstico do app não existe como variável. |

E decide sem medir: o intervalo de revisão dobra igual para quem passou com 11 ms e para quem
passou raspando com 34; o afrouxamento não olha se a firmeza está melhorando ou piorando; o
diagnóstico é sem memória e repete a mesma frase dez vezes.

> *"O app sabe muito sobre o aluno e não faz nada com o que sabe."*

---

## O RELATÓRIO DO JOGADOR — por que ele não voltaria amanhã

> **"O app literalmente me diz para não voltar amanhã: acabei todo o conteúdo em 8 minutos e
> 19 segundos, e a tela final desabilita o botão e manda eu voltar dali a 2 dias."**

Medido: **27 execuções, 499 segundos.** No dia da revisão: **56 segundos**, e a porta fecha por
4 dias. O intervalo dobra: 2, 4, 8, 16, 32.

Os cinco motivos de abandono, na ordem dele:

1. **O jogo acaba em 8 minutos e me expulsa.** O botão fica desabilitado. (Existe uma saída —
   clicar numa linha do mapa — e o painel que diz "nada a fazer hoje" **não menciona**.)
2. **Não existe recompensa de nenhum tipo.** Sem pontos, combo, streak, desbloqueio. E o pior:
   `hit()` toca `V[id](t,1)` **antes** de julgar, com volume fixo. **Acertar e errar soam
   exatamente igual.** Num app 100% áudio, é o pecado capital.
3. **Três compassos de material musical**, e um deles é tocar um metrônomo com o dedo (oito
   colcheias iguais). `V.bass` e `V.stab` existem no código e **nenhum exercício os toca** — há um
   acorde de Lá menor dentro do app que ninguém ouve.
4. **O erro vira burocracia idêntica**, e a pista com o registro do que você fez é apagada no
   instante em que a execução acaba. O app mediu onde você derrapou e joga fora.
5. **Metade da interface está morta.**

Notas dele: clareza **8**, diversão **2**, sensação de progresso **4**, vontade de voltar **1**.

Os dois momentos em que ele sentiu que estava aprendendo, e que valem preservar:

- **"VOCÊ SEGURA O TEMPO"** — *"é a única coisa aqui que eu não consigo obter de um metrônomo"*.
- **O viés em tempo real no canto** — *"ver que eu estava consistentemente atrasado, e não
  aleatoriamente errado, é uma informação que eu nunca tive tocando sozinho"*.

---

## DEFEITOS MENORES, TODOS REPRODUZIDOS

| # | defeito | efeito |
|---|---|---|
| m1 | O teclado global não checa o foco | **Ctrl+C no diário toca a bateria em vez de copiar.** A ajuda manda copiar e colar; o atalho está quebrado |
| m2 | `.veu` é `display:flex` sem `flex-direction:column` | a primeira instrução do jogo aparece como `ESCUTE E ACOMPANHEbata palma` |
| m3 | `seguidas` nunca zera após conquistar | `"passou · repita para confirmar (3 de 2)"` |
| m4 | `vozesDe()` faz `ex.transposicao[v.pad]` sem guarda | exercício sem `transposicao` **lança exceção no meio de `planejar()`**, deixando a UI inconsistente e sem saída. Com 16 exercícios a escrever à mão, isso vai acontecer |
| m5 | `transposicao` incompleta | voz fantasma: faixa rotulada **"UNDEFINED"**, nenhum pad acende, e a máquina passa a tocar a parte do aluno |
| m6 | padrão com passo ≥ 16 | `gerar()` usa `%16` e os passos somem; `eventosPorCompasso` conta todos. Precisão máxima 0,43 contra portão de 0,70 — **exercício impossível, em silêncio** |
| m7 | `normalizarMapa()` descarta id desconhecido | **renomear um exercício apaga o progresso e persiste a perda.** Uma temporada nova renomeia por definição |
| m8 | `MAX_DIARIO=80` | uma temporada de 16 exercícios são 120+ execuções perfeitas, 300-500 reais. O diário corta o começo, que é o que mostra evolução |
| m9 | `HOJE` congelado no carregamento | aba aberta atravessando a meia-noite grava o dia errado |
| m10 | `LANE` com 3 cores; `notaW` mínimo 60 px | a 4ª voz repete cor; a partir de 5 vozes a pista transborda em 360 px |
| m11 | fontes do Google num app que se anuncia offline | sem rede, nenhuma fonte carrega |

---

## O QUE OS TRÊS ELOGIARAM, SEM SABER DE QUEM ERA

- **Os marcadores `PURE`/`NUCLEO` são fronteira de verdade.** O arquiteto extraiu os dois blocos
  por texto e rodou em node **sem um único stub**. Funcionou de primeira. *"Não afrouxe."*
- **`casar()` e `venceu()` com a mesma janela** — a classe inteira de erro eliminada.
- **`registrar`/`aplicarReteste` imutáveis e recebendo `hoje` como argumento** — *"viajei no tempo
  nos testes sem nenhum mock; foi isso que permitiu simular a temporada inteira"*.
- **A separação P / L / B / S** com portões separados, e só a oscilação afrouxando.
  *"O raciocínio sobre viés ser invariante a deslocamento está certo e é sutil."*
- **`calibrar()` exigindo batidas que casaram**, não brutas. **`latValida()`**.
- **O reteste frio** — *"o único lugar do app onde a pergunta é 'ficou?' e não 'consegue agora?'"*.
- **O martelador é corretamente barrado** (10/24, 125 excedentes, limpeza no chão).
- **Os comentários explicativos** — *"a melhor documentação do arquivo"* — com a ressalva de que
  precisam sair de dentro do código antes dos 200 KB.

---

## A ARQUITETURA AGUENTA A TEMPORADA DE FUNK?

Os dois auditores divergiram, e a divergência se resolve.

O **arquiteto** disse que não: a grade de 16 passos não é dado, é constante replicada em cinco
funções da camada não testável, e sem reescrever a representação temporal não há swing, tercina
nem multi-compasso.

O **projetista da temporada** desenhou os 16 exercícios e mostrou, com fonte, que **o tamborzão é
um loop de UM compasso, em 16 semicolcheias, tocado reto** — sem swing, sem tercina. A temporada
inteira **cabe no formato atual**.

**Os dois estão certos sobre coisas diferentes, e para esta temporada o projetista vence.** A
reescrita temporal é o teto da temporada 2, não da 1. O que a temporada 1 exige é bem menor:

| # | mudança | tamanho | por quê |
|---|---|---|---|
| **T1** | **Portão em COMPASSOS, não em eventos** | pequena | resolve de uma vez o silêncio que evapora (defeito 2) e o exercício difícil avaliado em 5 segundos |
| **T2** | **Validador de conteúdo no boot** | ~30 linhas | mata m4, m5, m6 e m11 de uma vez, e transforma "o exercício 9 é impossível e ninguém sabe por quê" em "o exercício 9 não carrega, linha tal". **Sem isso, 16 exercícios escritos à mão é roleta** |
| **T3** | **`acentos` — intensidade por golpe** | ~25 linhas | o tamborzão **é** dinâmica: "pa-**pá**" é um crescendo, e sem ele o exercício soa como cinco golpes iguais. Só reprodução e dica visual — **não entra na pontuação**, porque pad de toque não lê força |
| **T4** | **Acompanhamento por exercício** | ~40 linhas | `ACOMP` é uma levada de **house** fixa em código, e `acompanhamento()` só sabe *subtrair*. Um bumbo de house em 1-2-3-4 por baixo de um padrão de funk **ensina o pulso errado** |
| **T5** | **Dois timbres novos: `timbg` e `timba`** | ~60 linhas | `tomlo`/`tomhi` dão um tom eletrônico. O tamborzão é timbau. Síntese completa já escrita, sem arquivo de áudio |
| **T6** | **Versão e migração do estado** | ~60 linhas | `normalizarMapa()` descarta id desconhecido e persiste a perda. Publicar a temporada **apaga o progresso de quem já jogou** |

Nada disso é reescrita. É extensão, e a soma dá menos de 250 linhas.

**O que NÃO é necessário** (verificado pelo projetista contra as fontes): mais de um compasso, swing
ou microtiming, mais de dois andamentos, janela de tolerância por exercício. Bom saber — era o que
mais assustava.
