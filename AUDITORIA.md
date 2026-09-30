# MUSGA — Auditoria independente

**2026-09-18.** Três auditores cegos, em paralelo. Cada um recebeu **apenas** uma cópia isolada do
`musga.html` e a instrução de não ler a especificação, os testes, nem nada do histórico do projeto.
Nenhum deles sabia quem fez, por quê, ou o que já tinha sido decidido e descartado.

Lentes: **primeiro uso**, **pedagogia**, **engenharia**.

Ao fim de cada relatório há uma seção **VERIFICAÇÃO** — o que foi conferido de novo, de forma
independente, antes de aceitar a acusação. Um auditor errou feio numa delas.

---

## 1 · Auditoria de primeiro uso

> **Veredito.** O app se apresenta como um treinador de ritmo funcional, mas a única informação de
> progresso na tela sobe mesmo quando você erra tudo, o botão de ajuda não produz nada visível, e
> (alegado) os pads nunca reagem ao toque. As três coisas que um iniciante mais precisa — saber o
> que fazer, confirmar que fez, saber como está indo — falham ao mesmo tempo.

### Os três mais graves, segundo o auditor

**1. A barra de progresso mente.** Abriu o exercício e não tocou em nada por 20 segundos. O contador
de erros foi de 0 a 19 sem nenhum acerto — e a barra logo abaixo do texto *"precisa de 2 boas
seguidas"* foi enchendo sozinha: 2% com 2 erros, 40% com 11 erros, 80% com 19 erros. Acertou uma
nota de propósito e a barra mal se moveu. *"A barra não mede acerto, mede outra coisa que nunca é
nomeada, mas está posicionada exatamente sob o texto que promete medir acerto. Isso é o oposto de
feedback: é desinformação ativa sobre o próprio desempenho."*

**2. A única ajuda do app não aparece.** Clicar em COMO FUNCIONA troca o rótulo do botão para FECHAR
e **não muda nada visível**. O texto é inserido no rodapé, abaixo da lista do mapa, fora da área
visível, sem rolagem automática e sem pista de que há algo para rolar. *"Um usuário que clique em
busca de ajuda — o comportamento mais natural depois de travar — vai concluir que o botão está
quebrado."* Agravado por três abas mortas no topo (OUT, SYNC, MIDI) com a mesma aparência clicável
da que funciona.

**3. Os pads não respondem a nada.** *"Cliquei, segurei e spammei teclas no pad BUMBO: nenhum brilho,
nenhuma mudança de cor, nunca. A grade de 16 pads, que dá nome ao app, é visualmente inerte."*

### Defeitos menores

- O número do compasso, no alto da pista, **se sobrepõe** ao texto `0/24 NOTAS` — ilegível.
- `VALE DAQUI` aparece cortado e sobreposto ao rótulo `MS`, no canto superior direito.
- Termos nunca definidos em lugar nenhum: **SOBROU**, **VALE DAQUI**, **VIÉS**, **FIRMEZA**.
- Depois de falhar um exercício inteiro, o mapa continua dizendo *"não começou"*.
- Os botões de etapa A/B/C parecem clicáveis durante a execução, mas o clique é ignorado sem aviso.
- O modo CALIB troca o cartão do exercício por um "medindo a máquina" desconexo, e ao começar não
  aparece nada na tela — só um texto minúsculo.
- Nomes de pad genéricos demais: NAIPE, GRAVE, CONDUÇ (cortado), PERC 1/2.

### O que funciona

Em 380 px o layout reflui em coluna única sem estourar nada e os pads continuam do tamanho de um
dedo. Acerto (anel) e erro por omissão (X sobre a nota) são visualmente distintos. Recarregar no
meio volta a um estado limpo. Duplo clique no botão principal não trava. Trocar de etapa durante a
execução é corretamente bloqueado.

### O que ele não conseguiu responder

*"Sem ouvir áudio, não dá para saber se a única coisa que este app deveria fazer de verdade —
produzir som de bateria sincronizado — está soando."*

### VERIFICAÇÃO

| Acusação | Resultado |
|---|---|
| A barra mente | **CONFIRMADO.** Sete segundos sem tocar nada: barra em **16,7%**, 4 erros, `0/24` notas. Ela mede o avanço da execução, não o acerto — e está colada no texto que fala de acerto. |
| A ajuda não aparece | **CONFIRMADO.** O elemento deixa de estar oculto, mas nasce em `top: 1261 px` numa janela de 1000 px. Funcionalmente, o botão não faz nada. |
| Os pads não reagem | **FALSO.** Logo depois da tecla o pad tem a classe `pad mine on`; 200 ms depois, `pad mine`. O pad acende por ~100 ms — rápido demais para o robô capturar entre um comando e um print. Um humano vê. **Fica registrado que este item do relatório está errado.** |

---

## 2 · Auditoria pedagógica

> **Veredito.** É um jogo de reflexo bem-instrumentado — com telemetria de tempo séria e um
> mecanismo de retenção genuíno — colado a um currículo de ritmo tão raso que ninguém sai dele
> sabendo ritmo, apenas sabendo bater três padrões específicos.

### O currículo real, lido dos dados

1. **quatro no chão** — bumbo nas 4 semínimas, 70→90 bpm
2. **chimbal em colcheias** — colcheias retas, 70→90 bpm
3. **bumbo e palma** — bumbo nos 4 tempos + palma no 2 e 4, 80→100 bpm

*"Nada além disso. Sem síncope, sem semicolcheia — **o motor já é de 16 passos por compasso e a
semicolcheia nunca é usada** — sem tercinas, sem compasso composto, sem silêncio como conteúdo, sem
repertório. É o conteúdo de uma primeira semana de um método qualquer, empacotado como o método
inteiro."*

### As três falhas mais graves

**1. Pula a etapa fundadora: corpo e voz antes do dedo.** Dalcroze, Gordon, Kodály e Konnakol
tratam corpo e voz como o primeiro lugar onde o pulso se instala, e o instrumento como etapa final.
*"O app começa e termina no dedo sobre uma tecla. As três etapas A/B/C só variam quanto a tela
mostra; a ação motora é idêntica do início ao fim."*

**2. O erro mostrado não é o erro que impede progresso.** O portão olha precisão e firmeza,
calculadas sobre as notas certas. A contagem de erros aparece no visor e **não entra em portão
nenhum**. *"Um aprendiz pode martelar teclas extras fora do padrão e ainda assim graduar, desde que
acerte as notas certas dentro da janela."*

**3. Entre um exercício e outro não há salto conceitual, só mais um instrumento.** Não se introduz
síncope, silêncio, troca de agrupamento. *"Ensina coordenação motora de bateria eletrônica, não
generalização rítmica."*

### O que ele reconheceu como correto

A retirada progressiva do andaime A→B→C, *"coerente com o princípio de fading da literatura de
aprendizagem motora"*. A graduação exigindo outro pad e outro andamento, *"um teste de transferência
real, raro em apps desse tipo"*. O reteste frio com revogação, *"literalmente o efeito de
espaçamento e o efeito de teste aplicados corretamente"*. A tolerância adaptativa na etapa B com
dureza fixa na C, *"uma solução honesta sem baratear o padrão de domínio"*.

### A correção que ele fez a nós

Sobre o andamento: 70–80 bpm está dentro da faixa de sincronização estável, *"mas a justificativa no
código — que 100 bpm é rápido demais — exagera: a faixa de 100–120 bpm é, na verdade, a mais
espontânea e fácil de sincronizar em adultos"* (Repp, 2005).

### O que falta para virar método

1. Etapa de corpo/voz antes de qualquer pad, em todo exercício novo.
2. Silêncio como alvo, síncope, semicolcheia — a grade de 16 passos já existe e está ociosa.
3. Erros e toques falsos afetando o portão, não só a tela.
4. Verbalização do padrão (sílabas) antes da execução motora.
5. Conteúdo que não se esgote em três ou quatro sessões.

---

## 3 · Auditoria técnica

> **Veredito.** O núcleo matemático é sólido, mas a camada que o liga ao mundo real — persistência,
> calibração e sincronismo áudio/visual — quebra sob entradas adversariais comuns, a ponto de travar
> o carregamento da página ou envenenar silenciosamente a métrica.

### Bugs confirmados por ele, com reprodução

**1. A página trava ao carregar com progresso salvo em formato antigo.** `faltaParaGraduar()` acessa
`e.andamentos.length` sem checar existência; `carregarMapa()` só reconstrói o campo `falhas`. Com um
estado salvo sem `andamentos`: `Cannot read properties of undefined`. Como o erro é lançado dentro
do `planejar()` no topo do script, **`paintLat()` e `drawHW()` nunca executam** — o canvas não é
desenhado até o primeiro clique.

**2. A calibração aceita uma única batida boa e envenena a latência da sessão inteira.** `endCal()`
exige 12 batidas **brutas**, não 12 casadas. Com 12 toques dos quais só 2 caem na janela, o
estimador devolve **−103 ms**, e isso é gravado e subtraído de todo toque futuro.

**3. Latência corrompida vira "calibrado, 0 ms".** `parseFloat('lixo')||0` → a tela mostra
`LATÊNCIA 0 MS` como se fosse medição válida. O oposto de "não medida".

**4. Nota perdida some sem contar erro quando a aba está oculta.** A marcação de erro vive no
`requestAnimationFrame`, que pausa; a limpeza das notas vive no `setInterval`, que não pausa. Nota
vencida é descartada antes de ser vista. *"A precisão cai silenciosamente e o contador de erros
mentirosamente mostra 0."*

**5. O laço de desenho nunca é cancelado.** `cancelAnimationFrame` não existe no arquivo. Depois do
primeiro "Começar", o laço roda a 60 fps para sempre.

**6. Corrida entre Livre e Calib.** Clicar em Livre durante a calibração deixa `livre` e `cal.on`
ambos verdadeiros; no fim, `planejar()` reabilita o botão por cima. Os pads que deveriam estar
mudos ficam ativos e contam erro contra a pontuação.

### Alegações de comentário que não se sustentam

*"O comentário alega que `calibOffset` descarta robustamente batida perdida e batida errada — falso
para amostras menores que 4, que é justamente o caso que `endCal()` permite passar."*

E a mais grave: **`nearestDelta()` não é chamada em lugar nenhum.** *"É código morto; a lógica de
casamento efetivamente usada é reimplementada à mão dentro de `hit()`, divergente e não coberta pela
mesma alegação de teste."*

### O que ele achou sólido

Média, desvio-padrão e métricas calculam corretamente, inclusive com amostra vazia. As funções de
data atravessam virada de ano e ano bissexto. O agendamento usa o relógio de áudio, não `Date.now`.
300 disparos em sequência não saturam o contexto. 380 px não gera rolagem horizontal. O afrouxamento
da etapa B satura no limite prometido.

### VERIFICAÇÃO

| Acusação | Resultado |
|---|---|
| `nearestDelta` é código morto | **CONFIRMADO.** Uma única ocorrência no arquivo: a própria definição. |
| `cancelAnimationFrame` ausente | **CONFIRMADO.** Zero ocorrências. |
| Erros não entram em portão | **CONFIRMADO.** `run.erros` só toca no visor. |

---

## O achado que dói mais

`nearestDelta` ser código morto significa que **a suíte de testes vinha testando uma função que o
app não usa.** A regra fundadora do projeto — *"tudo que é decisão vive em função pura, testada fora
do navegador, sem cópia que possa divergir"* — foi violada sem ninguém perceber: a lógica de
casamento real foi reescrita à mão dentro de `hit()` e nunca foi testada.

Os 175 testes verdes eram verdadeiros e insuficientes ao mesmo tempo. É exatamente o tipo de coisa
que uma auditoria cega existe para encontrar, e nenhum teste interno encontraria — porque o teste
foi escrito pela mesma cabeça que escreveu o erro.
