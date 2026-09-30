# FUNK, ESTADO DA ARTE E PRÁTICAS — pesquisa 2026-09

## PARTE 1 — VOU CONSEGUIR APRENDER BATIDA DE FUNK?

**Hoje: não.** O app tem três exercícios de house em 4/4 reta, sem síncope
nenhuma, e depois deles `oQueAgora()` devolve `{tipo:'nada'}` e o botão
desabilita. Funk não está lá.

**A arquitetura aguenta? Sim, e sem mudança estrutural.** A pesquisa resolveu
a dúvida que travava isso.

### A grade de 16 é fiel ao tamborzão — confirmado

A dúvida era se o tamborzão anda em 16 semicolcheias ou em 12 (tercinas). Se
fosse 12, a nossa grade de 16 passos não serviria e seria preciso reescrever o
agendador.

**É 16.** A fonte que decide é **Carlos Palombini, "A Era Lula/Tamborzão"**
(Revista do Instituto de Estudos Brasileiros, USP, 2014, p. 184) — ele é
praticamente o único musicólogo que analisou o gênero a sério:

> "uma linha de bumbo, **sincopando três das dezesseis divisões do compasso**"
> "As divisões **em dezesseis, no grave, em quatro, no médio, e em oito, no agudo**"

A tese de doutorado de **Renan Moutinho** (UNIRIO, 2020, orientação Palombini)
deriva o tamborzão do ciclo rítmico congo/bakongo e do maculelê, e escreve
todos eles "**em 16 pulsações**".

A única fonte que diz "tercinas" é uma página comercial (beatkey.app) sem autor,
sem data e sem uma única referência. Nenhuma fonte acadêmica, nenhum trabalho
brasileiro e nenhum outro produtor a corrobora. É outlier.

**Ressalva honesta:** *"Do volt-mix ao tamborzão"* (SIMPOM, 2016), que eu tinha
citado antes, é morfológico/schaefferiano — analisa massa, calibre e timbre, não
métrica. Não responde a pergunta. Quem responde é o de 2014.

### O que NÃO consegui

**As posições exatas dos golpes do tamborzão, com fonte.** As transcrições
acadêmicas existem (Palombini 2014 figs. 5-7; Moutinho 2020 figs. 110-121) mas
são **imagens de partitura** dentro dos PDFs. Nenhuma fonte, acadêmica ou não,
dá os números em texto verificável.

O que é sólido é a **onomatopeia dos próprios criadores**, que converge em
quatro fontes independentes:

- **DJ Luciano Oliveira** (o criador, 1997): **"tum pa-pá … pum pa"**
- **DJ Sany Pitbull:** "pum pa-pá pum-pum pa"
- **Vice Brasil:** "tum-pá-pá-pum-pá"
- **Wikipedia EN:** "Bum-Cha-Cha, Bum Cha-Cha"

**Cinco ataques por compasso, agrupados 3+2, com um par rápido no primeiro
grupo.** Loop de **1 compasso** (contra 4 do volt-mix) — cabe inteiro num ciclo
de 16 passos, o que é ideal para nós.

E a relação com o ancestral, de Palombini 2016: *"O tamborzão duplica as batidas
de bumbo do volt-mix, com exceção da segunda, contramétrica, que é omitida."*

**Se a gente for ensinar tamborzão, o caminho honesto é transcrever 3-4 faixas
canônicas e citar as faixas.** Não dá para citar uma grade que ninguém publicou
em texto. Isso é trabalho para uma sessão dedicada, com áudio.

### O que se perde numa grade de 16, e importa

Não é a grade. É que **a identidade do tamborzão está tanto no timbre e na
dinâmica quanto na posição.** Palombini mostra que ele funciona por morfologia
sonora: *"os tom-tons aumentam de intensidade na terceira batida e de novo na
quarta"*, *"a linha dos tom-tons, aparentemente a mais singela, assume função
tripla"*. Um grid liga/desliga achata exatamente isso.

**Consequência de projeto:** se a gente quiser funk de verdade, os pads precisam
de **intensidade por passo (velocity)**, não só ligado/desligado. Hoje não têm.

E **não encontrei nenhum estudo empírico de microtiming medido em funk carioca**
— nem em português nem em inglês. Se alguém disser "está provado que o tamborzão
tem X% de swing", peça a fonte.

### O degrau que vem ANTES do tamborzão: baião

Não é gosto, é contagem:

| | baião (tresillo) | tamborzão |
|---|---|---|
| ataques por compasso | **3** | **5-6** |
| vozes independentes | **1** | **3** |
| grade | 16 semicolcheias | 16 — **a mesma** |
| dinâmica como estrutura | pouco | muito |

O tresillo é **3+3+2** — em 16 passos: ataques em **1, 4, 7** (e 9, 12, 15).
Três golpes, uma voz, mesma grade do tamborzão.
Fonte acadêmica: Marcos Branda Lacerda (USP), *"Observações sobre o tresillo no
contexto rítmico africano e afro-americano"* (TeMA vol. IV, 2021) — e ele
argumenta que o tresillo é **divisivo sobre grade regular**, não aditivo, o que
é justamente o que justifica pôr isso na nossa grade.

**Progressão defensável:**
1. pulso + tresillo 3+3+2 (baião) — 1 voz, 3 golpes
2. tresillo com resposta grave/aguda (zabumba) — introduz timbre sem mudar a grade
3. tamborzão — 3 vozes, 5-6 golpes, dinâmica crescente

Partido-alto **não** é degrau: tem mais ataques contramétricos que o baião.
Samba e maracatu exigem subdivisão contínua de semicolcheias desde o início.

### Andamentos, com fonte

| | bpm | fonte |
|---|---|---|
| volt-mix (1988) | 125-128 | Tunebat / Orphiq |
| tamborzão clássico (anos 2000) | **~125-135** | Orphiq, Melodigging |
| no baile | **140** | **Palombini 2016 (acadêmico)** |
| "Atoladinha", Bonde do Tigrão | 128 | Tunebat |
| **funk 150** (Kevin o Chris, 2018) | **150, quase literal** | Wikipedia; Correio Braziliense |
| mandelão / ritmo dos fluxos (DJ GBR, 2016) | 120-140 | Melodigging, Murb |
| brega funk | **fontes se contradizem** (160-180 vs 95-110) | provável contagem em tempo dobrado. **Não confiar** |

### Resposta em uma frase

Vai dar para aprender funk, a grade que a gente escolheu é a certa e há um
degrau acadêmico bem justificado (baião/tresillo) para pôr antes — mas isso é
trabalho de conteúdo que só faz sentido **depois** de consertar a medição, porque
hoje o app graduaria você tocando funk 110 ms atrasado e diria "Cravado."

---

## PARTE 2 — ESTADO DA ARTE: O QUE PODE AGREGAR

**O que vale considerar:**

1. **Velocity nos pads.** Não é firula: é o que separa "grade de funk" de "funk".
   Vem direto da conclusão de Palombini acima.
2. **`AC.outputLatency`.** O navegador **já entrega a latência de graça** —
   medi 0.032 s no Chromium daqui. Nossas 20 batidas de calibração tentam
   descobrir um número que o navegador informa. Deveria ser a semente.
3. **Detecção de palma por microfone** (aubiojs / Meyda / essentia.js) como
   **modo experimental**, com calibração por dispositivo. Resolveria a ausência
   nº 2 da auditoria (corpo e voz). Risco: AGC/cancelamento de eco do navegador
   estragam o onset — precisa desligar explicitamente.
4. **Tuning de AudioWorklet:** `latencyHint:0`, desligar AGC/echo/noise. Firefox
   ~14 ms; Chrome 19-41 ms e inconsistente.

**O que NÃO vale:**

- **Web Speech API** — fragmentada entre navegadores, não confiável para tempo.
- **VR, IA generativa de acompanhamento** — prematuro para onde estamos.

---

## PARTE 3 — PRÁTICAS DE PROGRAMAÇÃO: O QUE PODE MELHORAR NOSSO TRABALHO

### 1. O projeto não tem git. Risco de perda total.
Recomendação: git local + GitHub Desktop + repositório **privado**. Custa 20
minutos e elimina a categoria inteira de "perdi o trabalho". GitHub Pages dá
backup e distribuição no mesmo movimento — e habilita PWA, que exige HTTPS.

### 2. Extrair os blocos puros para um `.js` separado, em UMD leve.
**Cuidado importante que a pesquisa trouxe:** `<script type="module">` **quebra
o duplo clique via `file://`** por CORS, e import maps não resolvem. A saída é
UMD leve carregado por `<script>` clássico — mantém o duplo clique funcionando
**e mata a gambiarra do regex** que os testes usam hoje para extrair os blocos.
Apontado como a mudança de maior custo-benefício do relatório.

### 3. `AGENTS.md` / `CLAUDE.md` virou convenção de fato.
Um arquivo no repositório com as regras do projeto (o que não fazer, o que sempre
verificar) que qualquer IA lê antes de mexer. Evita que eu reintroduza um defeito
que já corrigimos — que já aconteceu duas vezes aqui.

### 4. Instrumentação que a gente não tem:
- histograma de `requestAnimationFrame` (achar travadas)
- Long Animation Frames API
- `AudioContext.baseLatency` vs `outputLatency`
- heap snapshot contando `AudioNode` (há issue W3C #904 sobre nós que não liberam)

### 5. Pasta fixa de scripts Playwright, rodada pelo `portao.js`.
Hoje os testes de navegador são descartáveis. Regressão visual pixel-a-pixel só
para UI estática — **não** para o canvas ao vivo (dá falso positivo eterno).

---

## FONTES PRINCIPAIS

**Acadêmicas**
- Palombini, *"A Era Lula/Tamborzão"*, RIEB/USP 2014 — https://www.revistas.usp.br/rieb/article/view/82394
- Palombini, *"Do volt-mix ao tamborzão"*, SIMPOM 2016 — https://seer.unirio.br/simpom/article/download/5598/5055/28068
- Moutinho, tese UNIRIO 2020 — https://www.academia.edu/45287446/
- Lacerda, *"Observações sobre o tresillo"*, TeMA 2021 — https://ppgm.musica.ufrj.br/wp-content/uploads/2021/11/observacoes-sobre-o-tresillo.pdf

**Jornalismo**
- Vice Brasil, história do tamborzão — https://www.vice.com/pt/article/a-historia-do-tamborzao-a-levada-que-deu-cara-ao-ritmo-do-funk-carioca/
- Correio Braziliense, 150 BPM — https://www.correiobraziliense.com.br/app/noticia/diversao-e-arte/2019/02/18/interna_diversao_arte,738095/djs-explicam-como-funciona-o-movimento-150-bpm.shtml

**Referência**
- https://en.wikipedia.org/wiki/Funk_carioca
- https://www.soundbrenner.com/pt/blogs/articles/baiao

**Fonte divergente, desqualificada:** https://beatkey.app/how-to-make-baile-funk-music
(sem autor, sem data, sem referências — única a defender grade ternária)
