/* test-timing.js — portão de aceite da F4
   Extrai o bloco PURE de musga.html e testa a matemática de tempo.
   Roda com: node test-timing.js */

const fs = require('fs');
const src = fs.readFileSync(__dirname + '/musga.html', 'utf8');
const m = src.match(/\/\*===\s*PURE:START\s*===\*\/([\s\S]*?)\/\*===\s*PURE:END\s*===\*\//);
if (!m) { console.error('FALHA: bloco PURE não encontrado em musga.html'); process.exit(1); }

const sandbox = {};
new Function('exports', m[1] + '\nObject.assign(exports,{mdn,spread,calibOffset,calibrar,refValida,JANELA,julgar,casar,venceu,consolidarRef,calibLimpos,erroPadrao,REF_MIN_TOQUES,REF_MIN_RODADAS,tempoDoEvento});')(sandbox);
const { mdn, spread, calibOffset, calibrar, refValida, JANELA, julgar, casar, venceu,
        consolidarRef, calibLimpos, erroPadrao, REF_MIN_TOQUES, REF_MIN_RODADAS,
        tempoDoEvento } = sandbox;

let pass = 0, fail = 0;
const near = (a, b, tol) => a !== null && Math.abs(a - b) <= tol;
function t(name, cond, extra) {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FALHA ' + name + (extra !== undefined ? '  → ' + extra : '')); }
}

console.log('\n--- mediana e dispersão ---');
t('mediana ímpar', mdn([3, 1, 2]) === 2);
t('mediana par', mdn([1, 2, 3, 4]) === 2.5);
t('mediana vazia devolve null', mdn([]) === null);
t('mediana ignora ordem', mdn([10, -5, 0]) === 0);
t('dispersão de 3 valores', spread([-34, -30, -38]) === 8);
t('dispersão de 1 valor é 0', spread([5]) === 0);

console.log('\n--- calibOffset: mede o atraso do usuário ---');
const N_BATIDAS = 20;                                   // igual ao CAL_N de musga.html
const beats = Array.from({ length: N_BATIDAS }, (_, i) => i * 0.5);

let r = calibOffset(beats.map(b => b + 0.1), beats);
t('atraso constante de +100 ms é medido como +100 ms', near(r, 0.1, 1e-9), r);

r = calibOffset(beats.map(b => b - 0.045), beats);
t('adiantamento de -45 ms é medido como -45 ms', near(r, -0.045, 1e-9), r);

const jitter = [8, -11, 4, -6, 13, -2, 9, -7, 5, -12, 10, -3, 1, -9, 6, -4, 12, -8, 2, -5].map(v => v / 1000);
r = calibOffset(beats.map((b, i) => b + 0.1 + jitter[i]), beats);
t('com tremor humano de ±13 ms ainda cai perto de +100 ms', near(r, 0.1, 0.006), r);

const comOutlier = beats.map(b => b + 0.1);
comOutlier[3] = beats[3] + 0.1 + 2.0;           // uma batida perdida no meio
r = calibOffset(comOutlier, beats);
t('uma batida perdida (fora da janela) não contamina a mediana', near(r, 0.1, 1e-9), r);

const comEngano = beats.map(b => b + 0.1);
comEngano[5] = beats[5] + 0.35;                  // batida ruim, DENTRO da janela
r = calibOffset(comEngano, beats);
t('uma batida ruim dentro da janela é descartada antes da média', near(r, 0.1, 1e-9), r);

const doisEnganos = beats.map((b, i) => b + 0.1 + jitter[i]);
doisEnganos[2] = beats[2] + 0.30;
doisEnganos[11] = beats[11] - 0.18;
r = calibOffset(doisEnganos, beats);
t('duas batidas ruins não deslocam o resultado', near(r, 0.1, 0.008), r);

t('sem batidas devolve null', calibOffset([], beats) === null);
/* atenção: somar um múltiplo do intervalo cairia em cima do clique seguinte.
   Para sair da janela de verdade é preciso sair do alcance inteiro dos cliques. */
t('todas fora da janela devolve null', calibOffset(beats.map(b => b + 100), beats) === null);
t('meio intervalo (250 ms) ainda é medido, não descartado',
  near(calibOffset(beats.map(b => b + 0.25), beats), 0.25, 1e-9));

console.log('\n--- casar: a ÚNICA implementação do casamento toque × nota ---');
/* A auditoria cega encontrou o pior defeito do projeto: existia uma função
   pura testada para isto, e o aplicativo tinha outra, escrita à mão, sem
   teste. Agora há uma só, e test-vivo.js reprova se alguém escrever outra. */
const notas = () => ([
  { pad: 'kick', t: 1.00, st: 'espera' },
  { pad: 'kick', t: 1.50, st: 'espera' },
  { pad: 'clap', t: 1.02, st: 'espera' },
  { pad: 'kick', t: 2.00, st: 'julgada' }
]);
let c = casar(1.03, notas(), 'kick', 0);
t('casa com a nota do mesmo pad mais próxima', c && c.indice === 0 && near(c.delta, 0.03, 1e-9), JSON.stringify(c));
t('NÃO casa com outro pad, mesmo estando mais perto',
  casar(1.02, notas(), 'kick', 0).indice === 0);
t('ignora nota já julgada', casar(2.0, notas(), 'kick', 0) === null);
t('escolhe a mais próxima, não a primeira',
  casar(1.48, notas(), 'kick', 0).indice === 1);
t('toque longe de tudo não casa', casar(5.0, notas(), 'kick', 0) === null);
t('desconta a latência antes de casar',
  near(casar(1.13, notas(), 'kick', 0.10).delta, 0.03, 1e-9),
  JSON.stringify(casar(1.13, notas(), 'kick', 0.10)));
t('lista vazia não quebra', casar(1, [], 'kick', 0) === null);
t('lista com buraco não quebra', casar(1, [null, undefined], 'kick', 0) === null);
t('na fronteira da janela ainda casa', casar(1 + JANELA.quase, notas(), 'kick', 0) !== null);
t('logo além da janela de tolerância, não casa',
  casar(1 + JANELA.quase + 0.06, notas(), 'kick', 0) === null);
/* 1.25 está a 250 ms das duas notas de kick — fora da janela padrão.
   Com janela alargada, o empate tem que resolver sem quebrar. */
t('empate exato de distância resolve para uma nota só',
  casar(1.25, notas(), 'kick', 0, 0.3) !== null &&
  [0, 1].includes(casar(1.25, notas(), 'kick', 0, 0.3).indice),
  JSON.stringify(casar(1.25, notas(), 'kick', 0, 0.3)));

console.log('\n--- SIMETRIA: atrasar tem de custar o mesmo que adiantar ---');
/* A auditoria cega provou o defeito: casar() usava janela de 180 ms e
   venceu() de 130 ms. Um toque 150 ms ADIANTADO achava a nota e custava só
   a nota; o mesmo toque 150 ms ATRASADO não achava nada (a nota já vencera)
   e custava a nota MAIS um excedente contra a limpeza. Mesmo erro em módulo,
   veredito oposto: 4 notas atrasadas reprovavam a etapa C, as mesmas 4
   adiantadas passavam. As duas janelas TÊM de ser o mesmo número. */
t('casar e venceu usam exatamente a mesma janela',
  casar(1 + JANELA.limite - 0.001, notas(), 'kick', 0) !== null &&
  !venceu({ pad: 'kick', t: 1.0, st: 'espera' }, 1 + JANELA.limite - 0.001),
  'limite=' + JANELA.limite);
[0.100, 0.150, 0.175].forEach(function (d) {
  const atrasado = casar(1.0 + d, notas(), 'kick', 0);
  const adiantado = casar(1.0 - d, notas(), 'kick', 0);
  t('desvio de ' + Math.round(d * 1000) + ' ms casa dos dois lados',
    !!atrasado && !!adiantado,
    'atrasado=' + JSON.stringify(atrasado) + ' adiantado=' + JSON.stringify(adiantado));
  t('  e a nota ainda não venceu em nenhum dos dois',
    !venceu({ pad: 'kick', t: 1.0, st: 'espera' }, 1.0 + d));
});
t('além do limite, não casa nem de um lado nem do outro',
  casar(1 + JANELA.limite + 0.01, notas(), 'kick', 0) === null &&
  casar(1 - JANELA.limite - 0.01, notas(), 'kick', 0) === null);
t('além do limite a nota venceu — e é aí, não antes',
  venceu({ pad: 'kick', t: 1.0, st: 'espera' }, 1 + JANELA.limite + 0.01));
/* a faixa 130–180 existe para o toque ser julgado FORA, e não virar
   "não havia nota": ele achou a nota certa, só chegou tarde demais */
t('entre a tolerância e o limite, o toque casa mas é julgado fora',
  casar(1.155, notas(), 'kick', 0) !== null && julgar(0.155) === null);

console.log('\n--- venceu: quando a nota passa em branco ---');
const nota = { pad: 'kick', t: 1.0, st: 'espera' };
t('ainda não venceu dentro da janela de casamento', !venceu(nota, 1.0 + JANELA.limite - 0.001));
t('venceu logo depois da janela de casamento', venceu(nota, 1.0 + JANELA.limite + 0.001));
t('nota já julgada nunca vence', !venceu({ pad: 'kick', t: 1.0, st: 'perdeu' }, 99));
t('nota ausente não quebra', !venceu(null, 99));
t('nota futura não vence', !venceu(nota, 0.5));

console.log('\n--- calibrar: exige batidas que CASARAM, não batidas dadas ---');
/* O bug: endCal exigia 12 toques brutos. Com 2 bons e 10 perdidos, gravava
   um valor absurdo e o descontava de tudo pelo resto da sessão. */
const cliques = Array.from({ length: 20 }, (_, i) => i * 0.5);
let r2 = calibrar(cliques.map(b => b + 0.08), cliques, 0.4, 12);
t('20 batidas boas: calibra', r2.ok && near(r2.valor, 0.08, 1e-9), JSON.stringify(r2));
const quaseTodasPerdidas = cliques.map((b, i) => i < 2 ? b + 0.02 : b + 30);
r2 = calibrar(quaseTodasPerdidas, cliques, 0.4, 12);
t('2 boas e 18 perdidas: RECUSA em vez de gravar lixo',
  !r2.ok && r2.motivo === 'poucas' && r2.casadas === 2, JSON.stringify(r2));
t('a contagem é de batidas casadas, não de toques dados',
  calibrar(cliques.map(b => b + 0.08).concat([500, 501, 502]), cliques, 0.4, 12).casadas === 20);
t('sem batida nenhuma recusa', !calibrar([], cliques, 0.4, 12).ok);
t('sem clique nenhum recusa', !calibrar([1, 2, 3], [], 0.4, 12).ok);

console.log('\n--- refValida: lixo não pode virar "medido, 0 ms" ---');
t('número válido passa', near(refValida('0.034'), 0.034, 1e-9));
/* ESTA REGRA INVERTEU, e a inversão é o ponto do bloco inteiro.
   Enquanto o número era LATÊNCIA, negativo era impossível: som nenhum chega
   antes de ser emitido. Como REFERÊNCIA, negativo é você batendo antes do
   clique — informação legítima sobre a pessoa, e recusá-la trancava fora da
   etapa C quem antecipa (199 de 200 medições rejeitadas, em
   verificar-auditoria.js). */
t('negativo agora é LEGÍTIMO: é quem antecipa',
  near(refValida('-0.030'), -0.030, 1e-9) && near(refValida(-0.101), -0.101, 1e-9));
t('mas o absurdo continua recusado dos dois lados',
  refValida(-0.9) === null && refValida(0.9) === null);
t('texto vira null, não 0', refValida('lixo') === null);
t('vazio vira null', refValida('') === null && refValida(null) === null);
t('infinito vira null', refValida(Infinity) === null);
t('meio segundo de latência é absurdo e é recusado', refValida(0.9) === null);
t('zero legítimo continua sendo zero', refValida('0') === 0);

console.log('\n--- O TESTE QUE IMPORTA: calibrar remove o viés, não o erro ---');
/* Um tocador cujo sistema atrasa 100 ms de forma constante.
   Antes de calibrar, o app o acusa de atrasar — injustamente.
   Depois de calibrar, o mesmo toque é lido como zero.
   E o erro REAL dele continua aparecendo: calibrar conserta a máquina,
   não perdoa o músico. Agora medido pela mesma função que o app usa. */
const ATRASO = 0.1;
const semCal = casar(1.0 + ATRASO, notas(), 'kick', 0);
t('antes de calibrar, o app acusa +100 ms', near(semCal.delta, 0.1, 1e-9), semCal.delta);

const medido = calibOffset(beats.map(b => b + ATRASO), beats);
t('a calibração mede exatamente o atraso da máquina', near(medido, 0.1, 1e-9), medido);

const comCal = casar(1.0 + ATRASO, notas(), 'kick', medido);
t('depois de calibrar, o mesmo toque é lido como 0', near(comCal.delta, 0, 1e-9), comCal.delta);

const comErro = casar(1.0 + ATRASO + 0.045, notas(), 'kick', medido);
t('calibrar NÃO esconde o atraso real de 45 ms do músico',
  near(comErro.delta, 0.045, 1e-9), comErro.delta);

const adiantado = casar(1.0 + ATRASO - 0.03, notas(), 'kick', medido);
t('calibrar NÃO esconde um adiantamento real de 30 ms',
  near(adiantado.delta, -0.03, 1e-9), adiantado.delta);

t('e o julgamento sai coerente com o desvio corrigido',
  julgar(comCal.delta) === 'perfeito' && julgar(comErro.delta) === 'bom',
  julgar(comCal.delta) + '/' + julgar(comErro.delta));

console.log('\n--- CRITÉRIO DE ACEITE: 3 medições dentro de ±10 ms ---');
/* Não basta passar uma vez por sorte: simula 2000 sessões de três
   medições e exige que quase todas fiquem dentro do critério. */
function simulaCalibracao(atrasoReal, tremor) {
  const taps = beats.map(b => b + atrasoReal + (Math.random() * 2 - 1) * tremor);
  return Math.round(calibOffset(taps, beats) * 1000);
}
function taxaDeReprovacao(tremor, tentativas) {
  let ruins = 0, disp = [];
  for (let i = 0; i < tentativas; i++) {
    const tres = [0, 0, 0].map(() => simulaCalibracao(0.1, tremor));
    const s = spread(tres); disp.push(s);
    if (s > 10) ruins++;
  }
  disp.sort((a, b) => a - b);
  return { taxa: ruins / tentativas, p95: disp[Math.floor(tentativas * 0.95)] };
}
const norm = taxaDeReprovacao(0.020, 2000);
t('tremor ±20 ms: reprova em menos de 5% das sessões',
  norm.taxa < 0.05, (norm.taxa * 100).toFixed(1) + '% · dispersão p95 = ' + norm.p95 + ' ms');

const ruim = taxaDeReprovacao(0.035, 2000);
console.log('  nota  tremor ±35 ms (iniciante muito instável): reprova em ' +
  (ruim.taxa * 100).toFixed(1) + '% · p95 = ' + ruim.p95 + ' ms — nesse caso o app manda repetir, e está certo');

console.log('\n--- julgamento da pista ---');
t('janelas em ordem crescente',
  JANELA.perfeito < JANELA.bom && JANELA.bom < JANELA.quase, JSON.stringify(JANELA));
t('perfeito só até 40 ms', julgar(0.039) === 'perfeito' && julgar(0.041) !== 'perfeito');
t('bom entre 40 e 80 ms', julgar(0.06) === 'bom' && julgar(-0.06) === 'bom');
t('quase entre 80 e 130 ms', julgar(0.12) === 'quase' && julgar(-0.12) === 'quase');
t('além de 130 ms não casa', julgar(0.2) === null && julgar(-0.2) === null);
t('julga igual para cedo e tarde', julgar(0.05) === julgar(-0.05));
t('exatamente no tempo é perfeito', julgar(0) === 'perfeito');

/* `valor` e `taxaAcerto` eram da pontuação da v0.4 e foram removidas por
   serem código morto — quem apontou foi test-vivo.js. O portão de subir de
   etapa hoje usa precisão e firmeza, testadas em test-nucleo.js. */

console.log('\n--- A REFERÊNCIA ACUMULA TOQUES, E CARREGA O PRÓPRIO ERRO ---');
/* O LIMIAR QUE EU INVENTEI E ESTAVA ERRADO. A versão anterior exigia três
   medições cujas MEDIANAS concordassem em 10 ms. O Renato mediu seis vezes:
   −96 −54 −58 −70 −51 −119. Nunca fechou, e não ia fechar: com 30 a 35 ms de
   oscilação por toque, o erro de uma rodada de 20 toques já é de uns 10 ms e o
   espalhamento esperado de três medianas é de uns 25. Era exigir o impossível
   — limiar escolhido a dedo, sem dado, que é a lição que este projeto já tinha
   aprendido duas vezes antes.
   O certo é acumular amostra e CALCULAR o erro, não gatear na concordância.
   Amostras DETERMINÍSTICAS: com valores sorteados o teste mediria o sorteio. */
const rodada = (centro, n) => Array.from({ length: n }, (_, i) =>
  centro + (i % 4 === 0 ? 30 : i % 4 === 1 ? -30 : i % 4 === 2 ? 12 : -12));

t('com menos de três rodadas não há referência',
  consolidarRef(rodada(-70, 40), [-70, -51]).ok === false &&
  consolidarRef(rodada(-70, 40), [-70, -51]).motivo === 'faltam');
t('e o app sabe dizer quantas medições faltam',
  consolidarRef(rodada(-70, 20), [-70]).faltamRodadas === 2 &&
  consolidarRef(rodada(-70, 40), [-70, -51]).faltamRodadas === 1);
t('com três rodadas e toques suficientes, fecha',
  consolidarRef(rodada(-70, 60), [-70, -51, -58]).ok === true);
t('com poucos toques também não, e ele diz quantos faltam',
  consolidarRef(rodada(-70, 20), [-70, -51, -58]).ok === false &&
  consolidarRef(rodada(-70, 20), [-70, -51, -58]).faltamToques === REF_MIN_TOQUES - 20);

{
  /* O CASO REAL DO RENATO: as seis medições dele, com toques em torno delas */
  const medianas = [-96, -54, -58, -70, -51, -119];
  const toques = medianas.reduce((a, m) => a.concat(rodada(m, 20)), []);
  const c = consolidarRef(toques, medianas);
  t('as seis medições do Renato AGORA fecham uma referência',
    c.ok === true, JSON.stringify({ ok: c.ok, motivo: c.motivo }));
  t('e o valor é a média dos toques, não a mediana das medianas',
    Math.abs(c.valor * 1000 - (-74.67)) < 0.5, (c.valor * 1000).toFixed(2) + ' ms');
  t('o erro sai do MAIOR entre os dois espalhamentos — e aqui manda o das rodadas',
    c.erro * 1000 > 8 && c.erro * 1000 < 15, (c.erro * 1000).toFixed(1) + ' ms');
  t('o número de toques é reportado, para a tela poder dizer', c.n === 120, c.n);
}
{
  /* ignorar o espalhamento ENTRE rodadas seria fingir precisão: quem muda de
     lugar a cada medição tem uma referência menos certa, e o app tem de saber */
  const estavel = consolidarRef(rodada(-70, 80), [-70, -70, -70, -70]);
  const inquieto = consolidarRef(
    [-96, -54, -58, -70].reduce((a, m) => a.concat(rodada(m, 20)), []),
    [-96, -54, -58, -70]);
  t('mesma quantidade de toques, mas quem oscila entre rodadas tem erro MAIOR',
    inquieto.erro > estavel.erro * 2,
    'estável ±' + (estavel.erro * 1000).toFixed(1) +
    ' ms · inquieto ±' + (inquieto.erro * 1000).toFixed(1) + ' ms');
  t('e quem bate consistente ganha margem pequena',
    estavel.ok === true && estavel.erro * 1000 < 3, (estavel.erro * 1000).toFixed(2) + ' ms');
}
t('lista vazia ou suja não quebra',
  consolidarRef([], []).ok === false && consolidarRef(null, null).ok === false &&
  consolidarRef(rodada(-70, 60).concat([NaN]), [-70, -51, -58, NaN]).ok === true);
t('as constantes estão declaradas e são legíveis',
  REF_MIN_TOQUES === 36 && REF_MIN_RODADAS === 3);

console.log('\n--- erroPadrao e calibLimpos ---');
t('erro-padrão de uma amostra conhecida',
  Math.abs(erroPadrao([2, 4, 4, 4, 5, 5, 7, 9]) - (2.13809 / Math.sqrt(8))) < 1e-3,
  erroPadrao([2, 4, 4, 4, 5, 5, 7, 9]));
t('menos de dois pontos não tem erro-padrão',
  erroPadrao([5]) === null && erroPadrao([]) === null && erroPadrao(null) === null);
t('o erro cai com a RAIZ do tamanho — é por isso que acumular resolve',
  Math.abs(erroPadrao(rodada(0, 80)) - erroPadrao(rodada(0, 20)) / 2) < 0.6,
  erroPadrao(rodada(0, 20)).toFixed(2) + ' → ' + erroPadrao(rodada(0, 80)).toFixed(2));
{
  const beats = [1, 2, 3, 4, 5], taps = [1.02, 2.02, 3.02, 4.02, 5.02];
  const limpos = calibLimpos(taps, beats, 0.4);
  t('calibLimpos devolve um desvio por batida que casou',
    limpos.length === 5 && limpos.every(d => Math.abs(d - 0.02) < 1e-9), JSON.stringify(limpos));
  t('e é a MESMA lista de que calibOffset tira a média — uma implementação só',
    Math.abs(calibOffset(taps, beats, 0.4) -
      limpos.reduce((a, b) => a + b, 0) / limpos.length) < 1e-9);
  t('batida fora da janela não entra', calibLimpos([1.02, 1.9], [1], 0.4).length === 1);
  t('batida muito longe da mediana é descartada como engano',
    calibLimpos([1.0, 2.0, 3.0, 4.0, 5.35], [1, 2, 3, 4, 5], 0.4).length === 4);
}

console.log('\n--- A PONTE ENTRE OS DOIS RELÓGIOS ---');
/* O app lia AC.currentTime no momento em que o JavaScript conseguia rodar, e
   o atraso da fila de eventos entrava na medida como se fosse do músico.
   Agora o horário vem do evento — mas o evento fala outra língua de relógio,
   e a tradução é esta função. Ela tem de recusar tudo que não dá para crer. */
t('evento de agora vira o instante de agora',
  tempoDoEvento(1000, 1000, 50) === 50);
t('evento de 30 ms atrás vira 30 ms atrás, na régua do áudio',
  near(tempoDoEvento(970, 1000, 50), 49.97, 1e-9),
  tempoDoEvento(970, 1000, 50));
t('o atraso do JavaScript SAI da medida — é esta a correção inteira',
  near(tempoDoEvento(1000, 1012, 50.012), 50, 1e-9),
  'evento às 1000 ms, JS só rodou 12 ms depois → ' + tempoDoEvento(1000, 1012, 50.012));
t('a conversão não depende da escala absoluta dos dois relógios',
  near(tempoDoEvento(9_000_000, 9_000_020, 3.020), 3, 1e-9),
  tempoDoEvento(9_000_000, 9_000_020, 3.020));

t('timeStamp ausente é recusado',
  tempoDoEvento(undefined, 1000, 50) === null &&
  tempoDoEvento(null, 1000, 50) === null &&
  tempoDoEvento(NaN, 1000, 50) === null);
t('timeStamp zero é recusado — é o que alguns eventos sintéticos trazem',
  tempoDoEvento(0, 1000, 50) === null);
t('relógio de referência quebrado é recusado',
  tempoDoEvento(1000, NaN, 50) === null && tempoDoEvento(1000, 1000, NaN) === null);
t('evento no FUTURO é recusado — régua errada, não toque adiantado',
  tempoDoEvento(1100, 1000, 50) === null);
t('uma folga de 5 ms no futuro é tolerada (arredondamento entre os relógios)',
  tempoDoEvento(1004, 1000, 50) !== null && tempoDoEvento(1006, 1000, 50) === null);
t('timeStamp do relógio do CALENDÁRIO (Safari antigo) é recusado',
  tempoDoEvento(1.758e12, 1000, 50) === null,
  tempoDoEvento(1.758e12, 1000, 50));
t('evento velho demais para ser este toque é recusado',
  tempoDoEvento(700, 1000, 50) === null && tempoDoEvento(800, 1000, 50) !== null,
  'tolerância padrão 250 ms');
t('a tolerância é configurável e respeitada',
  tempoDoEvento(500, 1000, 50, 0.6) !== null && tempoDoEvento(500, 1000, 50, 0.4) === null);
t('recusar devolve null, nunca um número plausível — quem chama cai no relógio do áudio',
  [undefined, 0, NaN, 1100, 1.758e12, 700].every(v => tempoDoEvento(v, 1000, 50) === null));

/* A razão de existir: o desvio medido tem de ser o do DEDO, não o do JavaScript. */
{
  const notaEm = 10.000, dedoEm = 10.030;        /* o músico atrasou 30 ms */
  const jsRodouEm = 10.047;                      /* e o JS só rodou 17 ms depois */
  const perfDedo = 5000, perfAgora = 5017;
  const semPonte = casar(jsRodouEm, [{ pad: 'kick', t: notaEm, st: 'espera' }], 'kick', 0).delta;
  const comPonte = casar(tempoDoEvento(perfDedo, perfAgora, jsRodouEm),
    [{ pad: 'kick', t: notaEm, st: 'espera' }], 'kick', 0).delta;
  t('sem a ponte o app cobra do músico o atraso do próprio JavaScript',
    Math.round(semPonte * 1000) === 47, Math.round(semPonte * 1000) + ' ms');
  t('com a ponte ele mede os 30 ms que o dedo errou, e só eles',
    Math.round(comPonte * 1000) === 30, Math.round(comPonte * 1000) + ' ms');
  t('e isso muda o julgamento: 47 ms é "bom", 30 ms é "perfeito"',
    julgar(semPonte) === 'bom' && julgar(comPonte) === 'perfeito');
}

console.log('\n' + (fail ? 'REPROVADO' : 'APROVADO') + ' — ' + pass + ' passaram, ' + fail + ' falharam\n');
process.exit(fail ? 1 : 0);
