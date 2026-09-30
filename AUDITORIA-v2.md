# AUDITORIA CEGA v2 — MUSGA v0.5
**Data:** 2026-09-18 · **Alvo:** cópia isolada `auditoria/app.html` (76.951 bytes)
**Método:** três auditores independentes, proibidos de ler especificação, testes,
documentação ou qualquer histórico do projeto. Fonte única: o aplicativo.
Toda acusação grave abaixo foi **verificada por mim no código** antes de entrar aqui.

Estado do portão no momento da auditoria: **261 testes, portão ABERTO.**
Isso é o dado mais importante do documento: os 261 testes passaram e não
impediram nenhum dos defeitos abaixo.

---

## OS SEIS DEFEITOS QUE MUDAM O PROJETO

### 1. `collectDrift()` transforma o erro do aluno em latência da máquina — CRÍTICO
**Achado independentemente pelo auditor de engenharia E pelo de pedagogia.**

`musga.html:1535-1545`, chamado de dentro de `hit()` (linha 1398), durante a execução.

```js
function collectDrift(d){
  if(calibrated||d===null||Math.abs(d)>.25)return;
  drift.push(d); if(drift.length>24)drift=drift.slice(-24);
  if(drift.length<16)return;
  var est=calibOffset(drift,[0],.25);
  ...
  lat=est; calibrated=true; drift=[];
  try{localStorage.setItem('musga.lat',String(lat));}catch(e){}
}
```

`d` é o desvio do toque em relação à nota esperada — **é a métrica de viés do
músico**. Não há nada aqui que distinga "a máquina atrasa 80 ms" de "o Renato
atrasa 80 ms". A função pega os 16 primeiros desvios e grava a média como
latência de hardware, **permanentemente**, entre sessões, sem perguntar.

Dois danos, os dois provados pelos auditores:

**(a) Troca a referência de tempo no meio da execução.** Robô com firmeza real
de 7 ms e 80 ms de latência de dispositivo:
```
desvios(ms): [84,98,88,82,95,89,82,84,97,91,81,95, 0,-7,6,8,2,-5,6,-1,4,-6,8,1]
                                                 ↑ lat mudou aqui, no meio
B = +45 ms   S = 45 ms   → reprova C, reprova B
frase: "Você conhece o padrão. Agora trabalhe a firmeza."
```
A firmeza dele é 7 ms. O app reporta 45, reprova, e manda trabalhar o único
problema que ele não tem. E grava 45 no `firmezaHistorico` como sendo o dele.

**(b) Depois de gravado, subtrai o erro do aluno de tudo.** Provado:
```
B0  lat=0            robô toca SEMPRE 75 ms atrasado
B1  lat=+79ms PERSISTIDO   viés exibido: +28  → "passou · repita"
B2  MESMA execução         viés exibido: +1   → "Cravado." → abre etapa C
```
O app disse **"Cravado."** para alguém 75 ms atrasado. E `bCalib` para de
pulsar, então ele nem é mais convidado a medir de verdade.

Isto é o pior defeito do arquivo: **corrompe a medida, que é a única coisa que
este app produz.** Os outros defeitos travam ou atrapalham. Este mente no número.

---

### 2. `passou()` não olha o viés. O app diagnostica o erro e gradua mesmo assim — CRÍTICO

`musga.html:560-568` — verificado:
```js
function passou(etapa,m,falhas){
  if(!g||!m||m.n<g.eventos)return false;
  if(m.P<g.P)return false;
  if(g.L!==undefined&&m.L!==undefined&&m.L<g.L)return false;
  var lim=limiteFirmeza(etapa,falhas);
  if(lim!==null&&m.S>lim)return false;
  return true;
}
```
`m.B` **não aparece**. `S` é desvio-padrão: invariante a deslocamento. Viés
constante de qualquer tamanho passa.

Percurso completo provado por robô a **+110 ms fixos** (a 70 bpm a semicolcheia
é 214 ms — isso é mais de meia semicolcheia):
```
RUN1 C  70bpm  +107ms S=14 → "passou · repita (1 de 2)"
RUN2 C  70bpm  +111ms S=11 → "etapa C conquistada"
RUN3 C* 70bpm  +111ms S=10 → transposição cumprida
RUN4 C  90bpm  +108ms S=11 → "GRADUADO · a revisão vem em 2 dias"
```
No mesmo cartão, a dois centímetros um do outro:
> *"Firme — mas você está atrasando 108 ms em tudo."*
> **"GRADUADO"**

O app **sabe** e aprova. `leituraGroove()` faz a leitura musical certa
(groove = desvio consistente, erro = desvio inconsistente) e **essa leitura
não decide nada.**

**Correção de uma linha:** trocar o portão de `S` por
`RMS = √(B² + S²) ≤ limite`. Fecha o buraco inteiro sem inventar conceito novo.

---

### 3. A trapaça que funciona: ignorar a tela e reagir ao clique

Provado pelo auditor de pedagogia. Estratégia: na etapa C não há nada na tela
mesmo — ouvir só o clique da máquina e bater sempre com o mesmo atraso.
**Graduou o exercício em 4 execuções**, incluindo transposição e mudança de
andamento, com 110 ms de atraso sistemático. Não exige nenhum conhecimento de
ritmo: exige tempo de reação estável, que é exatamente o que `S` premia.

A variante perigosa não é escolhida pelo aluno: não calibrar + atrasar
consistentemente → o app converte o atraso em "latência" → passa a dizer
"Cravado." para o mesmo desempenho. **O aluno não trapaceia — ele apenas é
iniciante — e o app o parabeniza pelo erro.**

O que **não** funcionou, e é mérito: martelar teclas. Robô a ~11 toques/s fez
5/24 com 14 excedentes e foi reprovado. A métrica `L` fecha esse buraco de verdade.

---

### 4. O andaime auditivo nunca é retirado. Etapa C é exercício de eco — GRAVE

`mostraNotas()` apaga a pista na etapa C. Mas `pump()` linha 1339:
```js
if(st%4===0&&base>=AC.currentTime-.02){ V.click(base, st===0?.75:.4); }
```
**Sem nenhuma condicional de etapa.** O clique toca em toda etapa, todo compasso,
sempre. E o `ACOMP` continua rodando.

Cruzando `EXERCICIOS` com `ACOMP` + clique — em **todos os três exercícios a
máquina soa audivelmente TODOS os passos que o aluno tem de tocar**:

| exercício | passos do aluno | passos que a máquina soa |
|---|---|---|
| h1 quatro no chão | 0,4,8,12 | clique em 0,4,8,12 — cobre todos |
| h2 chimbal colcheias | 0,2,4,6,8,10,12,14 | clique(0,4,8,12)+hato(2,6,10,14) — **idêntico** |
| h3 bumbo e palma | 0,4,8,12 | clique em 0,4,8,12 |

`passosSemCue = []` nos três. **Não existe um único momento, em nenhuma etapa,
em que o aluno precise manter o tempo sozinho.** A tese central do projeto —
retirar o andaime progressivamente ensina ritmo — não está implementada. Só o
andaime visual sai. O auditivo nunca.

---

### 5. `soltarEscolha()` é código morto — e o guarda não viu — GRAVE

`musga.html:1004`. Verificado: **1 ocorrência no arquivo inteiro, a própria
definição.** Nenhum botão, nenhum caminho de código a chama.

Consequência: um toque numa linha do mapa prende `escolha` pelo resto da sessão.
Provado:
```
antes:  {"tipo":"reteste","id":"h1-pulso"}   ← reteste vencido há 15 dias
        → usuário toca na linha do h2 →
depois: {"tipo":"escolhido","id":"h2-colcheia"}
        retesteAindaDevido: "h1-pulso"       ← pulado em silêncio
```
E pior, porque o ramo `'escolhido'` força `{transposto:false, bpm:ex.bpm}`:
```
10 execuções perfeitas de etapa C com escolha presa:
  graduado: null   falta: ["transposição","outro andamento"]
```
**Dez execuções perfeitas e o aluno não gradua**, sem um único aviso. Única
saída: recarregar a página.

**O que isso diz sobre o nosso guarda.** `test-vivo.js` só vigia os blocos
`PURE` e `NUCLEO`. `soltarEscolha` está na linha 1004, na camada de app, onde
**ninguém vigia**. É exatamente a mesma classe de erro que a auditoria anterior
encontrou (`nearestDelta`), reaparecendo três metros ao lado do guarda que eu
construí para impedi-la. Varredura que fiz agora na camada de app: 56 funções,
1 morta. O guarda precisa cobrir o arquivo inteiro, não só os blocos puros.

---

### 6. A janela é assimétrica: atrasar é punido em dobro, adiantar não — GRAVE

`casar()` linha 441 usa `win = JANELA.quase + 0.05 = 0.180`.
`venceu()` linha 455 usa `win = JANELA.quase = 0.130`.

Toque 150 ms **adiantado** ainda encontra a nota e a consome: custa a nota.
Toque 150 ms **atrasado** não encontra nada (a nota já venceu aos 130 ms):
custa a nota **e** vira excedente contra a limpeza `L`.

Provado, mesma execução, sinal oposto:
```
ATRASADO  +145ms → casados  0, excedentes 24, P=0,    L=0
ADIANTADO -145ms → casados  6, excedentes  0, P=0.25, L=1
```
Caso realista: 20 notas boas + 4 muito atrasadas → `L=0.83` → **reprova** a
etapa C no portão de limpeza. As mesmas 4 notas adiantadas → `L=1.00` → **passa**.
Mesmo erro, veredito oposto. E a tela diz "a mais: 24" para quem tocou o padrão
certo, só tarde.

---

## DEFEITOS DE ROBUSTEZ (provados, menores)

| # | defeito | efeito |
|---|---|---|
| R1 | `fimAgendado` (1347-1352): o `setTimeout` não é guardado e `parar()` não o cancela | Parar e Começar rápido → a execução **nova** é finalizada com `0/24`, grava falha e linha falsa no diário |
| R2 | `musga.hist` (1547): único valor lido do armazenamento **sem validar a forma** (`musga.lat` e `musga.mapa` são validados) | `musga.hist="5"` → `cal.hist.push is not a function` dentro de `endCal()` → Começar e Livre desabilitados **para sempre**, botão preso em "medindo" |
| R3 | `normalizarEstado` (632-635) valida o tipo da data, não o formato | `proximoReteste:"banana"` → `dia()`→NaN → reteste nunca dispara, e o mapa exibe literalmente **"graduado · revisão banana"** |
| R4 | `lerDiario()` valida o array, não os elementos | `[null]` → exceção → painel abre **vazio**, usuário conclui que perdeu o histórico |
| R5 | `meuPad()` (1019) assume `transposto=false` | Cartão promete "em outros pads", painel acende **bumbo**, execução cobra **tom grave** |
| R6 | A regra de variante está escrita **três vezes** (930-932, 1241-1243, 1019) e a terceira já divergiu | É a duplicação real do arquivo — e governa a graduação |
| R7 | `LOOK=.1` com intervalo de 25 ms (o padrão de Chris Wilson é o inverso: 25 ms de janela… não, 100 ms de intervalo com 250 ms de lookahead) | Travada de thread de 2,5 s → 7 de 70 eventos silenciados, sem compensar e sem avisar. Não há `visibilitychange` no arquivo |
| R8 | `seguidas` nunca zera após conquistar | `"passou · repita para confirmar (3 de 2)"` |
| R9 | `HOJE` congelado no carregamento (855) | Aba aberta atravessando a meia-noite grava datas de ontem. Público típico: quem treina de madrugada |
| R10 | `run.perdidas` incrementado (1321), **nunca lido** | O número de notas perdidas nunca é mostrado nem gravado |
| R11 | `AC.currentTime` avança em degraus de **8,7 ms** (medido) e `AC.outputLatency` (0.032 aqui) não é usado | Ruído de ~2,5 ms entra direto em `S`, medido contra limiar de 20 ms. O navegador já entrega a latência de graça |

---

## DEFEITOS DE INTERFACE (primeiro uso, observados)

1. **Barra de espaço aborta a execução.** O foco fica no botão; espaço reaciona
   PARAR. A execução morre sem aviso. E o app **ensina** esse gesto: na
   calibração, a barra de espaço é aceita como batida. *(Correção de menor
   esforço do relatório inteiro: `blur()` no botão depois do clique.)*
2. **"TOQUE NUMA LINHA PARA ESCOLHER" é falso para 2 das 3 linhas.** Elas têm
   `aria-disabled="true"` e `title=""` — um tooltip **vazio**: alguém pretendeu
   explicar e o texto ficou em branco. Sem cadeado, sem motivo.
3. **15 dos 16 pads são inertes e parecem MAIS ativos que o único que funciona.**
   Os mortos são os claros; nesta UI claro = habilitado. Cada um exibe sua tecla
   de atalho, prometendo 16 sons. `tabIndex: 0`, `aria-disabled: null`.
4. **O cartão de RESULTADO nasce embaixo da dobra** (top 682, viewport 800):
   60% invisível, e o app não rola até ele. Em 360px a pista some da tela.
5. **"APAGAR DIÁRIO" não pede confirmação** e fica encostado no COPIAR, mesmo
   estilo, mesmo tamanho. Um clique errado apaga semanas.
6. **Feedback ao erro não é acionável.** `diagnostico()` devolve uma frase, e o
   primeiro ramo engole os outros. Dois desempenhos opostos, mesma frase:
   `5/24 com 14 excedentes` → *"Ouça mais uma volta antes de tocar."*
   `0/24 — não tocou nada` → *"Ouça mais uma volta antes de tocar."*
   E a evidência é destruída: `run.marcas` filtrada a 450 ms, pista limpa no
   `parar()`. Não há "no tempo 3 você antecipa". Há quatro números e "de novo".
7. **Não existe controle de andamento.** `setBpm()` só é chamado por `planejar()`
   e `comecar()`. O recurso mais importante da prática de iniciante — **tocar
   mais devagar** — é inacessível.
8. Bug de texto visível: `ESCUTE E ACOMPANHEbata palma` (falta o espaço).
9. Console: um único erro, em toda carga — `fonts.googleapis.com`
   `ERR_TUNNEL_CONNECTION_FAILED`. O rodapé anuncia "nenhum arquivo externo" e
   o app busca tipografia numa CDN. Offline, zero fontes.
10. **Nenhum `PAGEERROR` de JavaScript** em ~20 cenários de estresse
    (cliques rápidos, teclas aleatórias, redimensionamentos). O JS é sólido.

---

## O QUE OS TRÊS AUDITORES ELOGIARAM (sem saber de quem era o código)

- **Um relógio só.** Nenhum `Date.now()`/`performance.now()` em cálculo de tempo;
  tudo em `AC.currentTime`, em segundos. *"É o erro nº 1 desse tipo de app e ele
  não está aqui."*
- **Nenhum vazamento.** 5 execuções instrumentadas: 0 intervals pendentes,
  0 rAF órfãos, 2521 nós de áudio criados e todos coletados, heap plano,
  listeners estáveis. O defeito do rAF eterno **foi de fato corrigido**.
- **`desvioPadrao` amostral (n−1)**, com justificativa escrita, e inalcançável
  com n<2 porque `passou()` exige P≥0.70 de 24 eventos.
- **`calibOffset` com mediana + MAD** e `calibrar()` exigindo batidas **casadas**,
  não brutas. *"Honestidade instrumental acima da média."*
- **`latValida()`** rejeitando `parseFloat('lixo')||0`, com teto de 500 ms.
- **Datas como inteiros de dia em UTC.** Procuraram bug de fuso e não há.
- **`normalizarMapa()` reconstrói a partir de lista branca** → imune a poluição
  de protótipo.
- **`registrar`/`aplicarReteste`/`marcarSentiu` devolvem mapa novo, nunca mutam.**
- **`julgar()` é contíguo** (40/80/130): sem buraco nem sobreposição.
- **As três métricas P/L/S separadas.** *"Analiticamente correto e raro neste
  tipo de brinquedo. `L` fecha o exploit de martelar — verifiquei."*
- **`leituraGroove()`:** *"Isso é musicalmente letrado."*
- **Aquecimento não é avaliado**, com a linha "COMEÇA A VALER" sinalizando.
- **Reprovar o reteste revoga a graduação.** *"Poucos apps têm coragem de tirar
  uma medalha já dada."*
- **Diário em texto puro, exportável, sem conta, sem servidor.** *"É o gesto
  menos bancário do arquivo: o app admite que não é o juiz final."*
- **Modo livre: 16 pads, zero julgamento**, dentro de um app inteiramente avaliativo.
- `prefers-reduced-motion`, `:focus-visible`, e a decisão documentada sobre não
  baixar opacidade de pad escuro em painel claro.

---

## LIMIARES CONTESTADOS

O auditor de pedagogia marcou explicitamente que são julgamento profissional
dele, não citação de estudo — e se recusou a inventar referência.

| onde | atual | proposta dele | argumento |
|---|---|---|---|
| `passou()` | viés **ausente** | gatear por `RMS=√(B²+S²)≤0,035` | robô a +110 ms graduou |
| `JANELA.quase` | 130 ms | ~60 ms, **e escalonado com o bpm** | a 70 bpm a semicolcheia é 214 ms; 130 ms é 61% do caminho até a próxima subdivisão — musicalmente é *outra* nota |
| `PORTAO.C.P` | 0,70 | 0,92 (≤2 faltas em 24) | 17/24 + 3 excedentes + 96 ms de atraso **passa** a etapa C hoje |
| `PORTAO.C.S` | 0,035 s **fixo** | `≤4% do IOI da semínima` | a mesma barra é 43% mais dura a 100 bpm que a 70, sem ninguém dizer |
| `REPETICOES` | 2 seguidas | 2 em **dias diferentes** | 40 segundos de intervalo mede estado quente. O comentário do próprio código diz querer separar desempenho de habilidade — e mede desempenho duas vezes |
| `AFROUXA` | S de B afrouxa 45→63 ms | **manter S, baixar o bpm** (−10/falha, piso 50) | "diante do aluno travado, o app baixa a nota de corte em vez de mudar a tarefa" |
| `collectDrift` | aceita ±250 ms | remover, ou exigir \|média\|≤25 ms **e** confirmação | ver defeito 1 |
| `PORTAO.A.L` | 0,55 | 0,65 | 0,55 permite literalmente dobrar a peça em lixo |

**Limiares que ele considerou bem calibrados:** `LIMIAR.viesMax=0,035`
(*"35 ms é um número musicalmente honesto"*), a calibração explícita
(20 batidas a 120 bpm, mínimo 12 casadas, dispersão ≤10 ms entre 3 medições —
*"essa parte é séria"*), e `TRAVADO=3`.

---

## AS TRÊS AUSÊNCIAS MAIS CARAS (pedagogia)

1. **Nenhum momento em que o aluno segure o tempo sozinho.** Falta a manobra
   mais elementar do professor de ritmo: *"eu toco dois compassos, você toca
   dois compassos sem mim."* É a correção de maior retorno e menor custo do
   arquivo inteiro.
2. **Corpo, voz, contagem e subdivisão reduzidos a 14 segundos, uma vez na vida.**
   `sentiu` é um booleano que nunca volta a ser falso. E a pista marca **só
   semínimas** e some na etapa C — o h2 pede oito colcheias por compasso sem
   nenhum apoio de subdivisão, nem visual, nem verbal, nem corporal. Não há
   "1 e 2 e", não há palma, não há passo.
3. **Nenhum acesso ao próprio desempenho depois do fato, e nenhuma alavanca de
   prática.** Sem playback, sem mapa de erro por tempo do compasso, sem controle
   de bpm. Impossível fazer o movimento central: *"escuta — esse é o tempo,
   esse é você."*

---

## VEREDITOS, LITERAIS

> **Primeiro uso:** *"O motor de ritmo funciona bem e é preciso, mas a interface
> mente sobre o que é clicável."*

> **Pedagogia:** *"Isto não ensina ritmo nem testa ritmo: testa sincronização
> motora a um clique que nunca é desligado — e, quando o aluno erra de forma
> consistente, o app reescreve a própria definição de 'no tempo' para chamar o
> erro dele de acerto."*

> **Engenharia:** *"O núcleo aritmético é honesto e bem testado, mas a camada
> que liga esse núcleo ao tempo real tem um defeito que envenena a própria
> medida que o app existe para fazer."*

Os três convergem no mesmo lugar sem terem se falado: **o núcleo puro está
certo e a camada que o liga ao mundo está errada.** É exatamente a fronteira
onde os 261 testes param.
