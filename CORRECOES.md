
---

# PASSO 1 e 2 — o que a auditoria cega v2 derrubou (2026-09-18)

## Passo 1 — a medição

**A janela era assimétrica.** `casar()` usava 180 ms e `venceu()` usava 130.
Um toque 150 ms adiantado achava a nota e custava só a nota; o mesmo toque
150 ms atrasado não achava nada (a nota já vencera) e custava a nota MAIS um
excedente contra a limpeza. Quatro notas atrasadas reprovavam a etapa C; as
mesmas quatro adiantadas passavam. ✅ `JANELA.limite = .180` nos dois.

**`collectDrift()` gravava o erro do músico como latência da máquina.** Juntava
os 16 primeiros desvios do jogador, tirava a média e salvava como latência de
hardware, para sempre. Provado: a mesma execução 75 ms atrasada ia de "passou"
para **"Cravado."**. ✅ Removido. No lugar, `semearLatencia()` lê
`AC.outputLatency` — o navegador informa de graça e é sobre o dispositivo.
Semente não persiste, o rótulo diz de onde veio e o botão de medir continua
pulsando.

**`passou()` não olhava o viés.** Só `S`, que é invariante a deslocamento. Um
robô a +110 ms com firmeza de 11 ms graduava em quatro execuções, e o cartão
exibia "você está atrasando 108 ms em tudo" ao lado de "GRADUADO".
✅ `limiteVies(etapa)`, teto de 35 ms (a mesma linha que separa feel de
deslocado em `leituraGroove`), em B e C, **que nunca afrouxa**.

**O afrouxamento estava afrouxando o viés junto com a oscilação** — buraco que
só a prova de navegador pegou, depois de os 286 testes unitários ficarem
verdes. Oscilação leva semanas; viés se corrige na mesma sessão. ✅ Portões
separados: `limiteFirmeza` afrouxa em B, `limiteVies` nunca.

## Passo 2 — o andaime e a escolha presa

**O andaime auditivo nunca era retirado.** Só a pista saía na etapa C; o pulso
tocava em toda etapa, todo compasso, sempre. Nos três exercícios a máquina
soava TODOS os passos do aluno — no h2, a parte dele inteira com outro timbre.
✅ `pulsoAudivel(etapa, compasso)`: na etapa C, dois compassos com a máquina,
dois sem, e o silêncio é de tudo (clique **e** acompanhamento — emudecer só o
clique não bastaria, a palma do h1 cai nos passos 4 e 12, que são dele).
O pulso sempre volta: o reencontro é o ensino. Aviso na pista, que ali está
vazia: **VOCÊ SEGURA O TEMPO**.

**`soltarEscolha()` era código morto.** Um toque numa linha do mapa prendia a
pessoa àquele exercício pela sessão inteira, engolia a revisão vencida e — com
o ramo 'escolhido' forçando a variante simples — desligava a graduação sem
aviso. O diário do Renato provou: 21 execuções, todas a 70 bpm, nenhuma
transposta, mesmo depois de conquistar a etapa C.
✅ A escolha vale por uma execução (solta em `finalizar`); a revisão vencida
tem precedência; e a variante virou `varianteDoPlano()`, **uma implementação
só** onde havia três (`planejar`, `comecar`, `meuPad` — e a terceira já
divergira: o cartão prometia "em outros pads" e o painel acendia o bumbo).

**O guarda tinha um buraco.** `test-vivo.js` vigiava só os blocos PURE e
NUCLEO; `soltarEscolha` estava na camada de app, onde ninguém olhava — a mesma
classe de erro que ele nasceu para impedir, três metros ao lado.
✅ Varre o arquivo inteiro agora. Verificado por teste negativo: removendo a
chamada, o guarda reprova.

## Estado
293 testes + 40 provas de navegador. `node portao.js --navegador`.

---

# BLOCO 1 — a medição parar de mentir (2026-09-18)

Origem: auditoria cega v3, três auditores independentes. Tudo verificado por mim antes de mexer.

**Omitir nota era melhor do que tocar mal.** Viés e firmeza são calculados só sobre as notas
que a pessoa escolheu tocar. Reproduzido: mesmo músico, `24/24 S=45 → REPROVADO` contra
`20/24 S=35 → "Cravado."`. Perder custava 1/24 da precisão (e o portão deixava perder 7);
tocar mal custava uma amostra ruim no desvio-padrão, que era o portão apertado.
✅ Precisão subiu: A 0,80 · **B 0,85** · **C 0,92**. Omitir 4 de 24 deixou de compensar.
Preferido a inventar desvios artificiais para as notas perdidas — uma constante resolve.

**O portão contava eventos, não compassos.** `eventos:24` fixo fazia o exercício DIFÍCIL ser
avaliado em menos tempo que o fácil (2 compassos contra 6), e com 12+ eventos por compasso a
execução cabia em 2 compassos — `pulsoAudivel()` nunca chegava a calar, e a tese do projeto
evaporava exatamente nos exercícios densos da temporada de funk.
✅ `compassos:6` para todos. Medido: h1 24 notas, h2 48, h3 36, **todos com 2 compassos mudos**.

**A DERIVA — o melhor momento pedagógico não era medido.** Os desvios dos compassos mudos
caíam no mesmo balde dos outros. Um jogador preciso com a máquina, derivando no silêncio,
passava sem que ninguém visse.
✅ Cada nota carrega `sozinha`; `deriva()` compara os dois grupos. Provado no navegador com um
robô de dois comportamentos: certo com a máquina, 80 ms atrás no silêncio → **deriva medida 79
ms**, com viés global de 4 ms. O viés sozinho teria escondido.
**Ela mede e mostra, não reprova.** Não há dado real para escolher o limiar, e inventar limiar
sem dado foi como o resto dos números deste arquivo nasceu errado.

**A revogação da graduação era teatro.** `aplicarReteste` zerava `graduado` e `etapa` e deixava
`seguidas`, `transposto` e `andamentos` de pé — uma execução C boa reconquistava a etapa E
regraduava no mesmo instante, sem reconferir a transposição nem o outro andamento.
✅ Zera os três.

**O app elogiava e reprovava no mesmo cartão sem dizer por quê.** `18/24 cravadíssimas` →
frase "Cravado.", portão A REPROVADO (LIMIAR.precisao 0,70 contra PORTAO.A.P 0,80).
✅ `motivoReprova()` devolve o critério; `PORQUE` tem a frase. Agora sai
*"não passou · faltaram notas do padrão"*.

**A frase corrigia e absolvia na mesma linha.** Para TODO viés de 15 a 35 ms: *"você está
atrasando 25 ms em tudo. Firme e deslocado: isso é feel, não erro."*
✅ `leituraGroove` decide sozinha o que é feel; `feel` virou código próprio do diagnóstico.

**A régua do diário.** Consertar a medição faz os números piorarem no papel sem que ninguém
tenha piorado. Sem marcar isso, a primeira sessão depois do conserto parece regressão — e "ver
que estou melhorando" é a única coisa que traz o Renato de volta.
✅ `REGUA=2` no cabeçalho e em cada linha; só se compara o que foi medido com a mesma.

## Estado
**312 testes + 56 provas de navegador.** `node portao.js --navegador`.

## Bloco 2 — você ver que está melhorando

**A pista era apagada no instante em que havia algo para ver.** O app media em qual tempo do
compasso a pessoa derrapa e jogava fora: `parar()` limpava tudo e sobravam quatro números.
"Firmeza 38" não diz o que fazer; "você atrasa no terceiro tempo" diz.
✅ `perfilPasso()` agrupa os desvios por posição no compasso, e a pista — que ficava escrita
"a pista aparece quando você começar" — passa a mostrar **onde você derrapou**, com o nome da
posição em linguagem de quem nunca leu partitura (1, 1e, 1+, 1a).

**firmezaHistorico e retestes eram coletados havia sessões e nunca lidos por ninguém.**
✅ `progresso()` lê o diário e compara as primeiras execuções com as últimas. A linha aparece
embaixo da retrospectiva, com os números das pontas.

Duas decisões de desenho que só o print revelou (o código parecia certo nas duas):
- As barras estavam invertidas em relação à legenda, e os rótulos dos tempos montavam por cima
  do título do gráfico. **Layout refeito de cima para baixo, com as faixas sem se encostar.**
- A linha de progresso usava escala a partir de zero, e uma melhora de 46 para 32 ms virava
  uma linha quase reta — justamente a coisa que a tela existe para mostrar. **Agora a escala
  vai do menor ao maior da própria série.**

**A régua manda na comparação.** `progresso()` só compara linhas medidas com a mesma `REGUA`.
Sem isso, o conserto do Bloco 1 inventaria uma regressão que não houve.

## O guarda que faltava: teste órfão

Escrevi 32 testes **depois** da linha de `process.exit` de `test-nucleo.js`. Nunca rodaram — o
portão dizia 237 quando eram 269, e eu dei o Passo 2 por provado com os testes dele mortos.
É a mesma classe de erro que `test-vivo.js` existe para impedir, só que na suíte em vez de no
app: código que parece vigiar e não vigia nada.
✅ `test-vivo.js` reprova se sobrar `t(` depois do `process.exit` de qualquer suíte.
Verificado nos dois sentidos: acrescentei um teste órfão de propósito e o guarda reprovou.

## Estado
**350 testes + 61 provas de navegador.** `node portao.js --navegador`.

## Bloco 3 — a tela dizer o que fazer

Motivo, nas palavras do Renato depois de três sessões de trabalho: *"fiquei meio perdido... o
que é pra fazer quando? abc?"*. Não é ele — é o aplicativo. A auditoria cega tinha dito
exatamente isso ("o objetivo não é claro; a frase que eu deduzi veio 60% do código") e eu
tratei como item secundário enquanto consertava a régua.

**A pista, no lugar mais visível da tela, dizia "a pista aparece quando você começar".**
✅ `comoJogar()` devolve título e explicação para cada situação, e a pista passa a dizer o que
fazer agora. Uma etapa se explica ONDE ela acontece, em uma frase:

| | o que a tela diz |
|---|---|
| estreia | PRIMEIRO, SÓ ESCUTE · *a máquina toca sozinha · bata palma ou conte em voz alta, sem pad* |
| A | TOQUE QUANDO A NOTA CHEGAR NA LINHA · *as notas descem · só o seu pad acende · passe duas vezes para abrir a B* |
| B | A PISTA VAI SUMIR · *duas voltas com as notas na tela, depois você segue de memória* |
| C | AGORA É SÓ VOCÊ · *sem pista · e em dois compassos a máquina cala: o tempo fica com você* |
| revisão | REVISÃO · *direto na etapa C, sem aquecimento — é para ver se ficou* |

Na primeira vez de todas entra uma terceira linha: *"o botão laranja conduz tudo: aperte e siga"*.

**O CSS do véu era `display:flex` sem `flex-direction:column`.** O `<br>` era engolido e a
primeira instrução do jogo saía como `ESCUTE E ACOMPANHEbata palma ou conte em voz alta`.
✅ Corrigido, e o véu ganhou título, subtítulo e linha de estreia como elementos próprios.

**Não havia como recomeçar do zero sem o console do navegador** — e o progresso salvo de uma
versão anterior é medido com outra régua, manda a pessoa para exercícios que ela "já passou"
por critérios que não existem mais, e confunde os números.
✅ Botão **recomeçar do zero** no painel do diário, com **confirmação em dois cliques** (o
botão vira a pergunta e volta sozinho em 4 segundos). O mesmo para **apagar diário**, que não
pedia nada e é o que a própria ajuda chama de "a única evidência de que algo ficou".
Dois cliques em vez de `confirm()`: um diálogo modal trava a página e não dá para testar.

Dois achados que só o print revelou (o código parecia certo):
- **"NADA NA TELA" como título da etapa C parecia defeito**, não instrução — a tela estava
  mesmo vazia e a frase confirmava o vazio em vez de explicá-lo. Virou "AGORA É SÓ VOCÊ".
- **A barra preta vazia de ~490 px no topo**, que a auditoria descreveu como "parece um campo
  de texto que não carregou", era um espaçador com borda de chip. Virou espaçador puro.

## Estado
**362 testes + 69 provas de navegador.** `node portao.js --navegador`.

## Bloco 4 — o que o primeiro diário real derrubou (2026-09-18)

17 execuções do Renato, na régua 2. Cada conserto abaixo saiu de um número dele.

**A semente de latência mentiu — e o app te acusou 16 vezes.**
```
latência usada: 40 ms (semente do navegador)  ·  medição real dele: 7 ms
viés medido:   -24,8 ms (negativo em 16 de 17)  →  corrigido: +8,2 ms
```
Eu medi a semente no navegador embutido do Claude, deu 10 ms, e generalizei a partir de **uma**
medição. O Chrome dele reporta 40. Com a latência certa ele está praticamente cravado; o app
dizia "você está antecipando" por causa de um número que ele mesmo inventou.
✅ Sem latência **medida**, o portão não reprova por viés e o diagnóstico manda medir em vez de
acusar. E a **etapa C passa a exigir a medição** (`motivo 'calibrar'`) — senão o jogador muito
deslocado voltaria a atravessar A e B e a graduar, que é o furo que o Bloco 1 fechou. Jogar
continua livre; o que a etapa C exige é a medida.

**A deriva que eu criei era ruído com nome de métrica.**
```
+14  -22  +36  -53  -37  -47  -1  +36
média -9,3 ms · espalhamento 35,8 ms · ruído esperado ±15,7 ms
```
Sinais alternando sem padrão. Com 8 notas no silêncio contra 16 com a máquina, a diferença de
duas médias não tem resolução.
✅ `deriva()` calcula o próprio ruído (erro-padrão da diferença, com o desvio combinado) e
devolve `null` quando o número não supera **dois** erros-padrão. Com um só, uma execução em três
mostraria deriva inexistente. Melhor calar dezenove vezes do que mentir uma.

**O teto de firmeza da etapa C não sabia que a etapa C ficou mais difícil.**
```
etapas A e B: 29,9 ms   ·   etapa C: 40,6 ms   →  o silêncio custa 10,7 ms
teto: 35 ms  →  ele passou em 3 de 8
```
O número 35 foi escolhido quando a etapa C era "o mesmo exercício sem pista". Hoje é "sem pista
**e** com a máquina calando".
✅ Teto de C sobe para 45 ms, igual ao de B. Ela continua sendo a mais dura pela precisão (0,92)
e pela limpeza (0,85), que é onde "performance é tocar o padrão" se mede.

**A execução crescia com a densidade — e cansava.**
```
etapa C do h2, 48 notas, em ordem:  48/48  44/48  43/48  38/48
                        oscilação:   33     32     43     50
```
Degrada execução a execução. Era o risco que eu tinha registrado e não fechado; na temporada de
funk seria pior (o exercício de 12 eventos por compasso daria 72 notas).
✅ Seis compassos **ou ~32 notas**, o que vier primeiro, nunca menos de três (para sempre sobrar
silêncio). Medido: h1 24 · h2 32 · h3 36, todos com 2 compassos mudos.

Um achado de método: o primeiro teste da deriva usava amostras **sorteadas**, e a média da
amostra escapava do valor pedido — o teste media o sorteio, não a função. Refeito com valores
determinísticos.

### O que o diário também mostrou de bom
A firmeza dele caiu de **35,7 para 29,9 ms** entre as duas sessões. A comparação vale: a firmeza
é imune ao erro de latência, porque um deslocamento constante não muda a oscilação.

## Estado
**381 testes + 72 provas de navegador.** `node portao.js --navegador`.

## O pedido que não era pedido

Segundo diário real: o app escreveu *"Meça a latência no botão CALIB"* em **quatro execuções
seguidas** e o Renato não mediu. Ele tinha razão de não medir — o pedido vivia dentro da frase
de resultado, ao lado dos números. Um pedido no meio de um cartão de métricas não é um pedido,
é uma nota de rodapé.
✅ Na etapa C, onde a medição passou a ser obrigatória, o pedido vira a tela inteira:
**PRIMEIRO, MEÇA A LATÊNCIA** · *o aparelho atrasa o som e o app ainda está chutando quanto ·
são 20 batidas junto com o clique, uma vez só* · *botão CALIB, ali em cima — a etapa C só vale
depois disso*. As etapas A e B nunca pedem: jogar não depende de medir.

### O que o segundo diário mostrou
- **A primeira deriva confiável**, e é grande: `+117 ms` no h3 etapa C, contra um ruído de
  ±47 ms. A 80 bpm isso é um sexto de tempo de escorregão quando a máquina cala. Nas 8
  execuções anteriores a deriva ficou em branco, como devia — era ruído.
- **O teto de 45 ms fez o que tinha de fazer**: 6 de 9 execuções C passariam, contra 3 de 9 com
  o teto antigo. E a etapa C continua custando caro — `h1 +13 · h2 +9 · h3 +33` ms de oscilação
  em relação a A e B, no mesmo exercício.
- **O "medir" apareceu e não reprovou**: as quatro execuções com o aviso passaram, porque nas
  etapas A e B o viés não conta. O portão fez exatamente o que foi escrito para fazer.
