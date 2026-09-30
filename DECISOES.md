# MUSGA — decisões fechadas

Cada decisão aqui já foi tomada, com motivo. **Reabrir custa horas** — aconteceu em 18/09/2026,
quando duas propostas de arquitetura chegaram de fora e foram avaliadas do zero.

Reabrir é legítimo quando aparece **fato novo**. Não é legítimo porque uma ferramenta é popular.

---

## D-01 — Arquivo único HTML, sem build
**Aceita.** O app é um `musga.html` que abre com duplo clique, offline, sem instalar nada.

**Por quê:** o Renato joga no computador dele, sem terminal aberto. Qualquer passo de build é
um passo entre ele e tocar. O custo é real (sem módulos, sem TypeScript) e está pago: os blocos
`PURE` / `NUCLEO` dão a separação, e o `test-vivo.js` a **verifica por máquina** — mais forte
que um documento pedindo.

**Consequência:** nada de `fetch` de arquivo local (`file://` bloqueia), nada de CDN, nada de
`import`. Dados de conteúdo moram no arquivo, em bloco declarativo separado da lógica.

**Emenda de 29/09/2026 (aprovada pelo Renato):** o iPhone não abre `file://`, e ele joga no iPhone.
O arquivo passa a ser **publicado como está** em um endereço estático (GitHub Pages), sem build e
sem servidor com lógica. Continua sendo um `musga.html` que abre com duplo clique no computador;
no celular, abre pelo endereço e vai para a tela de início. O que a D-01 protege — um arquivo, zero
build, zero backend — fica intacto. A fonte do Google ganha *fallback* local para o app funcionar
sem rede.

**Rejeitado junto:** monorepo com `packages/`, `apps/web/`, branches `develop`/`feature/*`.
Estrutura de time de cinco pessoas para um arquivo de 105 KB e um desenvolvedor.

---

## D-02 — Som 100% sintetizado, zero samples
**Aceita.** Toda bateria é gerada por Web Audio na hora.

**Por quê:** sample é arquivo, arquivo quebra a D-01. E a síntese dá controle contínuo de
timbre e dinâmica sem megabytes.

**Consequência:** o app não é e não vai virar sampler. Timbre novo é função nova de síntese.

**Rejeitado junto:** `browser-based-mpc`, `mloop`, `web-drum-sequencer`, `smplr`. São
referências boas de **sampler** — produto diferente.

---

## D-03 — Web Audio puro, sem Tone.js
**Aceita.** O agendador (lookahead + `AudioContext.currentTime`) é próprio.

**Por quê:** o que Tone.js traria de essencial — Transport, lookahead, agendamento em tempo de
áudio — já existe aqui **e é a parte testada**: 399 testes de lógica pura e 97 provas de
navegador rodam sobre ela. Trocar motor testado por motor não testado, sem resolver nenhum
problema aberto, é risco sem contrapartida. Tone.js não conserta nada do que está quebrado.

**Reabrir se:** aparecer necessidade que o agendador próprio não atende (áudio em várias
trilhas com efeitos, por exemplo) **e** houver caminho de migração com o portão verde nos dois
lados. Nem assim vale importar a biblioteca inteira por um recurso.

---

## D-04 — Sem combo, sem pontuação, sem XP
**Aceita.** Nenhum placar, nenhuma sequência premiada, nenhum som de acerto diferente do de erro.

**Por quê:** o Renato disse o que o faz voltar, e foi uma coisa só: **ver que está melhorando**.
Pontuação é outra motivação — e compete com a primeira, porque ensina a perseguir o número.

**Reabrir se:** ele pedir. Só ele.

**Rejeitado junto:** as skills e arquiteturas de *rhythm game* (Perfect/Great/Good/Miss, combo,
scoring, note highway). Descrevem jogo de pontuação. A parte útil — janelas de julgamento e
compensação de latência — já existe.

---

## D-05 — Pedagogia antes de conteúdo gerado
**Aceita.** Os exercícios são escritos à mão, a partir de transcrição conferida na fonte.

**Por quê:** a transcrição do tamborzão foi primeiro **deduzida** da onomatopeia e estava
errada; ler Palombini (RIEB/USP 2014, p.196) corrigiu três exercícios. Geração automática de
beatmap a partir de áudio produziria padrões tecnicamente corretos e musicalmente sem sentido,
e não há ninguém para conferir cada um.

**Consequência:** conteúdo é dado escrito à mão, logo **exige validador na inicialização** —
hoje um erro de digitação apaga progresso salvo (verificado em `AUDITORIA-v4-VERIFICADA.txt`).

---

## D-06 — Um relógio só
**Aceita.** Toda matemática de tempo usa `AC.currentTime`. O horário de evento do DOM entra
apenas pela ponte `tempoDoEvento()`, pura e testada, com recusa explícita quando não dá para
confiar.

**Por quê:** misturar `Date.now()` / `performance.now()` com o relógio do áudio produz erro que
não aparece em teste e não aparece na tela — só no número final, errado.

---

## D-07 — Métrica sem resolução fica em branco
**Aceita.** Quando o número não supera o próprio ruído, o app não fala.

**Por quê:** a deriva nasceu contando história sobre o músico a partir de 8 notas contra 16.
Agora ela calcula o próprio erro-padrão e devolve `null` abaixo de dois deles.

**Consequência (18/09/2026):** a mesma regra ainda **não** foi aplicada à linha de progresso,
que com habilidade constante anuncia mudança em 65% das sessões. Está no Passo 2 do `PLANO.md`.

---

## D-08 — Hardware é do futuro, e burro
**Adiada, com direção definida.** Se um dia houver pads físicos: matriz 4×4 + Raspberry Pi Pico
como **controlador MIDI**, com o app mantendo toda a inteligência. Referência: `DMK`.

**Por quê:** hardware com lógica própria vira segundo sistema para manter e depurar.

**Não fazer agora:** o app não tem uma sessão completa jogada até o fim ainda.
