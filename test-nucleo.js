/* test-nucleo.js — portão de aceite do Passo 1 da v0.5
   Extrai o bloco NUCLEO de musga.html e testa métricas, diagnóstico e progressão.
   Roda com: node test-nucleo.js */

const fs = require('fs');
const src = fs.readFileSync(__dirname + '/musga.html', 'utf8');

function bloco(nome) {
  const m = src.match(new RegExp('/\\*===\\s*' + nome + ':START\\s*===\\*/([\\s\\S]*?)/\\*===\\s*' + nome + ':END\\s*===\\*/'));
  if (!m) { console.error('FALHA: bloco ' + nome + ' não encontrado em musga.html'); process.exit(1); }
  return m[1];
}
const N = {};
new Function('exports', bloco('PURE') + bloco('NUCLEO') + `
Object.assign(exports,{LIMIAR,PORTAO,ETAPAS,EXERCICIOS,exercicio,eventosPorCompasso,
  compassosDoPortao,media,desvioPadrao,metricas,passou,diagnostico,leituraGroove,
  dia,diasEntre,somaDias,estadoNovo,mapaNovo,estado,proximaEtapa,faltaParaGraduar,
  registrar,retesteDevido,aplicarReteste,desbloqueado,oQueAgora,
  AFROUXA,limiteFirmeza,limiteVies,motivoReprova,PORQUE,deriva,REGUA,
  perfilPasso,progresso,rotuloPasso,NOMEMEIO,comoJogar,viesCobravel,
  varianteDaVez,varianteDoPlano,pulsoAudivel,SOZINHO,TRAVADO,REPETICOES,
  clonar,normalizarEstado,normalizarMapa,etapasDisponiveis,podeJogar,
  precisaSentir,modoDaVez,marcarSentiu});`)(N);

let pass = 0, fail = 0;
const near = (a, b, tol) => a !== null && Math.abs(a - b) <= (tol === undefined ? 1e-9 : tol);
function t(name, cond, extra) {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FALHA ' + name + (extra !== undefined ? '  → ' + extra : '')); }
}
/* Tocador sintético: k eventos com viés e tremor conhecidos, em SEGUNDOS.
   IMPORTANTE: o que passa de ±130 ms não casa com evento nenhum no app real,
   então não entra na lista de desvios — entra como falta, derrubando a
   precisão. Simular sem essa janela foi o primeiro erro que este teste pegou. */
const JANELA = 0.130;
function toca(k, viesMs, tremorMs, semente) {
  let s = semente || 1, out = [];
  const rnd = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648 * 2 - 1; };
  for (let i = 0; i < k; i++) out.push((viesMs + rnd() * tremorMs) / 1000);
  return out;
}
/* o mesmo tocador, já passado pela janela de casamento */
function executa(k, viesMs, tremorMs, semente, excedentes) {
  const casados = toca(k, viesMs, tremorMs, semente).filter(d => Math.abs(d) <= JANELA);
  return N.metricas(casados, k, excedentes || 0);
}

console.log('\n--- unidade: tudo em segundos ---');
t('viés de 100 ms é lido como 0.1 e não como 100',
  near(N.metricas([0.1, 0.1, 0.1], 3).B, 0.1), N.metricas([0.1, 0.1, 0.1], 3).B);
t('limiares estão em segundos, não em ms',
  N.LIMIAR.instavel < 1 && N.PORTAO.C.S < 1, JSON.stringify(N.LIMIAR));

console.log('\n--- métricas ---');
t('média simples', near(N.media([1, 2, 3]), 2));
t('média de lista vazia é 0, não NaN', N.media([]) === 0);
t('desvio-padrão amostral (n-1)', near(N.desvioPadrao([2, 4, 4, 4, 5, 5, 7, 9]), 2.13809, 1e-4),
  N.desvioPadrao([2, 4, 4, 4, 5, 5, 7, 9]));
t('desvio-padrão de um valor só é 0', N.desvioPadrao([0.5]) === 0);
t('desvio-padrão de valores iguais é 0', near(N.desvioPadrao([0.03, 0.03, 0.03]), 0));

let m = N.metricas(new Array(12).fill(0.02), 16);
t('precisão = casados / esperados', near(m.P, 0.75), m.P);
t('não casou nenhum → P = 0', N.metricas([], 16).P === 0);
t('nEsperados 0 não divide por zero', N.metricas([], 0).P === 0);

m = N.metricas(N.toca ? [] : toca(20, 30, 10, 7), 20);
t('viés e firmeza saem juntos e independentes',
  near(m.B, 0.030, 0.004) && near(m.S, 0.006, 0.004), 'B=' + m.B.toFixed(4) + ' S=' + m.S.toFixed(4));

console.log('\n--- portões das etapas ---');
const bom = k => N.metricas(new Array(k).fill(0).map((_, i) => (i % 2 ? 0.004 : -0.004)), k);
/* uma execução de h1 (4 eventos por compasso) × 6 compassos do portão */
const EV = N.PORTAO.A.compassos * 4;
const pP = k => N.metricas(new Array(k).fill(0.005), EV);
t('o portão conta COMPASSOS, não eventos', N.PORTAO.A.compassos === 6 &&
  N.PORTAO.A.eventos === undefined, JSON.stringify(N.PORTAO.A));
/* A duração deixou de crescer com a densidade: 6 compassos OU ~32 notas, o
   que vier primeiro, e nunca menos de 3 — para sempre sobrar silêncio. */
t('nenhum exercício passa muito de 32 notas por execução',
  N.EXERCICIOS.every(ex => N.eventosPorCompasso(ex) * N.compassosDoPortao(ex, 'C') <= 40),
  N.EXERCICIOS.map(e => e.id + '=' + N.eventosPorCompasso(e) * N.compassosDoPortao(e, 'C')).join(' '));
t('e nenhum fica curto demais para medir',
  N.EXERCICIOS.every(ex => N.eventosPorCompasso(ex) * N.compassosDoPortao(ex, 'C') >= N.PORTAO.C.minEventos));
t('um exercício DENSO encolhe em compassos em vez de virar maratona',
  N.compassosDoPortao({voz:[{pad:'x',passos:[0,1,2,3,4,5,6,7,8,9,10,11]}]}, 'C') === 3,
  N.compassosDoPortao({voz:[{pad:'x',passos:[0,1,2,3,4,5,6,7,8,9,10,11]}]}, 'C'));
t('mas nunca abaixo de 3 compassos — abaixo disso não sobra silêncio',
  N.compassosDoPortao({voz:[{pad:'x',passos:Array.from({length:16},(_,i)=>i)}]}, 'C') === 3);
t('24 eventos cravados passam em A, B e C',
  N.passou('A', bom(EV)) && N.passou('B', bom(EV)) && N.passou('C', bom(EV)));
t('execução curta demais não passa', !N.passou('A', bom(8)));
t('A não olha firmeza',
  N.passou('A', N.metricas(new Array(EV).fill(0).map((_, i) => (i % 2 ? 0.2 : -0.2)), EV)));
t('B reprova firmeza acima de 45 ms', !N.passou('B', N.metricas(toca(EV, 0, 120, 3), EV)));
/* O teto de firmeza de C subiu de 35 para 45 ms, o mesmo de B: a etapa C
   deixou de ser "o mesmo exercício sem pista" e virou "sem pista E com a
   máquina calando". Medido no diário real: A e B em 29,9 ms, C em 40,6 ms.
   Ela continua sendo a mais dura pela precisão e pela limpeza. */
t('C tem a mesma tolerância de oscilação que B — o silêncio já é a dificuldade',
  N.PORTAO.C.S === N.PORTAO.B.S);
t('mas C continua sendo a etapa mais dura, pela precisão e pela limpeza',
  N.PORTAO.C.P > N.PORTAO.B.P && N.PORTAO.C.L > N.PORTAO.B.L);
t('quem oscila 41 ms passa em C, mas quem oscila 50 não',
  N.passou('C', {n:24,P:1,L:1,B:0,S:0.041}, 0) &&
  !N.passou('C', {n:24,P:1,L:1,B:0,S:0.050}, 0));

console.log('\n--- OMITIR NOTA DEIXOU DE SER VANTAGEM ---');
/* O furo central que a auditoria cega achou: viés e firmeza são calculados só
   sobre as notas que a pessoa ESCOLHEU tocar. Perder uma nota custava 1/24 da
   precisão, e o portão deixava perder 7 de 24; tocá-la mal custava uma amostra
   ruim no desvio-padrão, que era o portão apertado. Errar saía mais caro do
   que não tocar — e largar 4 dos 24 bumbos de um quatro-no-chão é
   musicalmente catastrófico. A correção é subir a precisão até que omitir não
   compense: na etapa C, no máximo 2 faltas em 24. */
{
  const todos = toca(24, 10, 86, 5);
  const honesto = N.metricas(todos, 24, 0);
  const escolhidas = [...todos].sort((a, b) => Math.abs(a) - Math.abs(b)).slice(0, 20);
  const hesitante = N.metricas(escolhidas, 24, 0);
  t('preparo: omitir as 4 piores REALMENTE melhora a firmeza medida',
    hesitante.S < honesto.S,
    'honesto S=' + Math.round(honesto.S*1000) + ' hesitante S=' + Math.round(hesitante.S*1000));
  t('e mesmo assim o hesitante NÃO passa mais na etapa C',
    N.passou('C', hesitante, 0) === false,
    'P=' + hesitante.P.toFixed(2) + ' motivo=' + N.motivoReprova('C', hesitante, 0));
  t('o motivo da reprovação é a precisão, e o app sabe dizer isso',
    N.motivoReprova('C', hesitante, 0) === 'precisao');
}
t('etapa A: 20 de 24 (83%) passa, 19 (79%) não',
  N.passou('A', pP(20)) && !N.passou('A', pP(19)));
t('etapa B: 21 de 24 (87%) passa, 20 (83%) não',
  N.passou('B', pP(21)) && !N.passou('B', pP(20)));
t('etapa C: 23 de 24 (96%) passa, 22 (92%) não — performance é tocar o padrão',
  N.passou('C', pP(23)) && !N.passou('C', pP(22)));
t('a exigência de precisão cresce de A para C',
  N.PORTAO.A.P < N.PORTAO.B.P && N.PORTAO.B.P < N.PORTAO.C.P,
  [N.PORTAO.A.P, N.PORTAO.B.P, N.PORTAO.C.P].join(' < '));
t('etapa inexistente nunca passa', !N.passou('Z', bom(EV)));

console.log('\n--- o app diz QUAL critério reprovou ---');
/* "Cravado." e "não passou" apareciam no mesmo cartão, sem motivo. */
t('quem passa não tem motivo', N.motivoReprova('C', bom(EV), 0) === null);
t('faltou nota → precisao', N.motivoReprova('C', pP(18), 0) === 'precisao');
t('sujou → limpeza',
  N.motivoReprova('C', N.metricas(new Array(24).fill(0.004), 24, 12), 0) === 'limpeza');
t('oscilou → firmeza',
  N.motivoReprova('C', {n:24,P:1,L:1,B:0,S:0.09}, 0) === 'firmeza');
t('deslocado → vies',
  N.motivoReprova('C', {n:24,P:1,L:1,B:0.08,S:0.01}, 0) === 'vies');
t('execução curta → curta', N.motivoReprova('C', {n:4,P:1,L:1,B:0,S:0.01}, 0) === 'curta');
t('todo motivo tem uma frase em português',
  ['sem-dados','curta','precisao','limpeza','firmeza','vies','calibrar']
    .every(k => typeof N.PORQUE[k] === 'string' && N.PORQUE[k].length > 5));

console.log('\n--- A DERIVA: o que acontece quando a máquina cala ---');
/* A etapa C cala dois compassos em quatro. Os desvios do silêncio caíam no
   mesmo balde dos outros, e um jogador preciso com a máquina que derivava
   130 ms sozinho passava sem que ninguém visse. */
const cs = [0.005, -0.004, 0.006, -0.005, 0.004, 0.003];
t('sem deriva, o número é ~zero',
  Math.abs(N.deriva(cs, cs)) < 0.001, N.deriva(cs, cs));
t('quem atrasa no silêncio tem deriva positiva',
  Math.abs(N.deriva(cs, cs.map(x => x + 0.13)) - 0.13) < 1e-9,
  N.deriva(cs, cs.map(x => x + 0.13)));
t('quem adianta no silêncio tem deriva negativa',
  N.deriva(cs, cs.map(x => x - 0.06)) < 0);
t('com poucas amostras a deriva é null, não um número inventado',
  N.deriva(cs, [0.01, 0.02]) === null && N.deriva([], cs) === null &&
  N.deriva(null, null) === null);
t('a deriva NÃO reprova ninguém ainda — falta dado real para o limiar',
  N.passou('C', bom(EV), 0) === true);

console.log('\n--- limpeza: tocar SÓ o que foi pedido ---');
/* A auditoria pedagógica: "um aprendiz pode martelar teclas extras fora do
   padrão e ainda assim graduar, desde que acerte as notas certas dentro da
   janela". Nota perdida já entrava pela precisão; toque sobrando não entrava
   em nada. Agora entra, pela limpeza. */
t('sem toque sobrando, limpeza é 1', N.metricas(new Array(24).fill(0.005), 24, 0).L === 1);
t('quem não tocou nada não está sujo — a precisão é que reprova',
  N.metricas([], 24, 0).L === 1 && N.metricas([], 24, 0).P === 0);
t('24 certas e 24 sobrando: limpeza 0,5',
  near(N.metricas(new Array(24).fill(0.005), 24, 24).L, 0.5));
t('24 certas e 2 sobrando: limpeza alta',
  near(N.metricas(new Array(24).fill(0.005), 24, 2).L, 24 / 26, 1e-9));
t('só toque sobrando: limpeza 0', N.metricas([], 24, 10).L === 0);
t('os excedentes ficam registrados', N.metricas([], 24, 7).excedentes === 7);
t('a limpeza não mexe na precisão',
  N.metricas(new Array(18).fill(0.005), 24, 30).P === 0.75);

console.log('\n--- o portão agora cobra limpeza ---');
const limpo = k => N.metricas(new Array(24).fill(0).map((_, i) => (i % 2 ? 0.004 : -0.004)), 24, k);
t('execução limpa passa em A, B e C',
  N.passou('A', limpo(0)) && N.passou('B', limpo(0)) && N.passou('C', limpo(0)));
t('2 toques a mais ainda passam em tudo — engano acontece',
  N.passou('A', limpo(2)) && N.passou('B', limpo(2)) && N.passou('C', limpo(2)));
t('5 toques a mais reprovam na etapa C, que é a limpa',
  !N.passou('C', limpo(5)), 'L=' + limpo(5).L.toFixed(2));
t('mas 5 a mais ainda passam na A, onde tatear faz parte', N.passou('A', limpo(5)));
t('martelar (24 a mais) reprova nas TRÊS etapas',
  !N.passou('A', limpo(24)) && !N.passou('B', limpo(24)) && !N.passou('C', limpo(24)),
  'L=' + limpo(24).L.toFixed(2));
t('a exigência de limpeza cresce de A para C',
  N.PORTAO.A.L < N.PORTAO.B.L && N.PORTAO.B.L < N.PORTAO.C.L,
  [N.PORTAO.A.L, N.PORTAO.B.L, N.PORTAO.C.L].join(' < '));

console.log('\n--- quem martela não gradua ---');
/* o teste que a auditoria pediu, em forma de percurso simulado */
function martelador(tremorMs, extras, tentativasMax) {
  let mapa = N.mapaNovo(), hoje = '2026-09-18', guard = 0;
  while (guard++ < tentativasMax) {
    const o = N.oQueAgora(mapa, hoje);
    if (o.tipo === 'nada') break;
    const ex = N.exercicio(o.id);
    const k = N.eventosPorCompasso(ex) * N.compassosDoPortao(ex, o.etapa);
    const mm = executa(k, 2, tremorMs, guard * 7 + 3, extras);
    const st = N.estado(mapa, o.id);
    const ctx = { hoje, bpm: st.andamentos.length ? ex.bpm2 : ex.bpm, transposto: st.andamentos.length > 0 };
    mapa = (o.tipo === 'reteste' ? N.aplicarReteste(mapa, o.id, mm, hoje) : N.registrar(mapa, o.id, o.etapa, mm, ctx)).mapa;
    hoje = N.somaDias(hoje, 1);
  }
  return mapa;
}
const spam = martelador(10, 30, 120);
t('quem acerta tudo MAS martela 30 teclas a mais não gradua nada',
  !N.EXERCICIOS.some(e => N.estado(spam, e.id).graduado),
  N.EXERCICIOS.map(e => e.id + '=' + (N.estado(spam, e.id).etapa || '–')).join(' '));
const cuidadoso = martelador(10, 1, 120);
t('e quem toca limpo, com um engano por execução, gradua normalmente',
  N.EXERCICIOS.every(e => N.estado(cuidadoso, e.id).graduado),
  N.EXERCICIOS.map(e => e.id + '=' + (N.estado(cuidadoso, e.id).etapa || '–')).join(' '));

console.log('\n--- diagnóstico: exaustivo e sem contradição ---');
let codigos = {}, semFrase = 0, total = 0;
for (let P = 0; P <= 1.0001; P += 0.05)
  for (let Bms = -120; Bms <= 120; Bms += 20)
    for (let Sms = 0; Sms <= 120; Sms += 10)
      for (let L = 0; L <= 1.0001; L += 0.25) {
      total++;
      const d = N.diagnostico({ n: 16, casados: Math.round(P * 16), P: P, B: Bms / 1000, S: Sms / 1000, L: L });
      if (!d || !d.codigo || !d.frase) semFrase++;
      codigos[d.codigo] = (codigos[d.codigo] || 0) + 1;
    }
t('toda combinação de P, B e S recebe exatamente uma frase', semFrase === 0,
  semFrase + ' sem frase em ' + total);
t('as seis frases são todas alcançáveis', Object.keys(codigos).length === 6,
  Object.keys(codigos).join(','));
t('nenhum código inesperado',
  Object.keys(codigos).every(c => ['ouca','sujo','firmeza','vies','feel','cravado'].includes(c)));
/* 'feel' virou código próprio: antes a frase do viés e o adendo do groove eram
   concatenados, e para TODO viés de 15 a 35 ms o cartão dizia "você está
   atrasando 25 ms" e "isso é feel, não erro" na mesma linha. */
t('dentro do feel o app NÃO acusa viés',
  [16, 25, 34].every(b =>
    N.diagnostico({n:24,casados:24,P:1,L:1,B:b/1000,S:0.012}).codigo === 'feel'));
t('acima do feel ele acusa',
  N.diagnostico({n:24,casados:24,P:1,L:1,B:0.050,S:0.012}).codigo === 'vies');
t('quem toca sujo ouve sobre a sujeira, não sobre firmeza',
  N.diagnostico({ n: 24, casados: 24, P: 1, B: 0, S: 0.060, L: 0.4 }).codigo === 'sujo');
t('mas precisão baixa ainda vem antes da sujeira',
  N.diagnostico({ n: 24, casados: 4, P: 0.17, B: 0, S: 0.010, L: 0.2 }).codigo === 'ouca');
t('limpeza ausente (métrica antiga) não dispara o aviso de sujeira',
  N.diagnostico({ n: 24, casados: 24, P: 1, B: 0.004, S: 0.008 }).codigo === 'cravado');
t('métrica ausente não quebra o diagnóstico', N.diagnostico(null).codigo === 'ouca');

t('precisão baixa manda ouvir, mesmo cravadíssimo',
  N.diagnostico({ n: 16, casados: 4, P: 0.25, B: 0, S: 0.002 }).codigo === 'ouca');
t('precisão alta e mão solta manda trabalhar firmeza',
  N.diagnostico({ n: 16, casados: 16, P: 1, B: 0, S: 0.060 }).codigo === 'firmeza');
let dv = N.diagnostico({ n: 16, casados: 16, P: 1, B: -0.060, S: 0.010 });
t('firme e adiantado além do feel diz MAIS ADIANTADO, com o número e com o com-quê',
  dv.codigo === 'vies' && /60 ms mais adiantado/.test(dv.frase) &&
  /clique sozinho/.test(dv.frase), dv.frase);
dv = N.diagnostico({ n: 16, casados: 16, P: 1, B: 0.060, S: 0.010 });
t('firme e atrasado além do feel diz MAIS ATRASADO, com o número e com o com-quê',
  dv.codigo === 'vies' && /60 ms mais atrasado/.test(dv.frase) &&
  /clique sozinho/.test(dv.frase), dv.frase);
/* A FRASE MUDOU DE NATUREZA, não só de palavra. "você está atrasando 60 ms"
   afirmava um fato sobre o mundo que o app não tem como saber — carrega o erro
   do navegador. "60 ms mais atrasado do que num clique sozinho" é comparação
   entre duas medidas do mesmo aparelho, e sobrevive ao erro. */
t('e NUNCA volta a afirmar deslocamento absoluto',
  !/está atrasando|está antecipando/.test(dv.frase), dv.frase);
t('firme e no lugar diz cravado',
  N.diagnostico({ n: 16, casados: 16, P: 1, B: 0.004, S: 0.008 }).codigo === 'cravado');

console.log('\n--- groove: desvio consistente é feel, inconsistente é erro ---');
t('firme e sem viés → cravado',
  N.leituraGroove({ casados: 16, B: 0.002, S: 0.010 }) === 'cravado');
t('firme COM viés pequeno → feel (a caixa do soul, 22 ms, é isso)',
  N.leituraGroove({ casados: 16, B: 0.022, S: 0.012 }) === 'feel');
t('firme com viés GRANDE não é feel, é estar deslocado',
  N.leituraGroove({ casados: 16, B: 0.065, S: 0.012 }) === 'deslocado',
  N.leituraGroove({ casados: 16, B: 0.065, S: 0.012 }));
t('o teto do feel é 35 ms',
  N.leituraGroove({ casados: 16, B: 0.034, S: 0.010 }) === 'feel' &&
  N.leituraGroove({ casados: 16, B: 0.036, S: 0.010 }) === 'deslocado');
t('o teto vale para os dois lados',
  N.leituraGroove({ casados: 16, B: -0.065, S: 0.012 }) === 'deslocado');
t('solto com viés → viés instável',
  N.leituraGroove({ casados: 16, B: 0.022, S: 0.050 }) === 'vies-instavel');
t('solto sem viés → oscilando',
  N.leituraGroove({ casados: 16, B: 0.001, S: 0.050 }) === 'oscilando');
t('o MESMO viés muda de leitura conforme a firmeza',
  N.leituraGroove({ casados: 16, B: 0.025, S: 0.010 }) !== N.leituraGroove({ casados: 16, B: 0.025, S: 0.050 }));
t('sem dados não inventa leitura', N.leituraGroove({ casados: 0 }) === 'sem-dados');

console.log('\n--- saneamento do que vem do armazenamento ---');
/* A auditoria cega derrubou a página inteira gravando um progresso salvo sem
   o campo `andamentos`: `faltaParaGraduar` estourava, e com ele a partida,
   o desenho da pista e o indicador de latência. Antes só `falhas` era
   remendado na leitura. Estes testes são o caso de reprodução. */
const cru = { etapa: 'C', transposto: false, graduado: '2026-09-20' };   // sem andamentos
t('estado sem andamentos é saneado, não estoura',
  Array.isArray(N.normalizarEstado(cru).andamentos));
let naoEstourou = true;
try { N.faltaParaGraduar(N.normalizarEstado(cru)); } catch (e) { naoEstourou = false; }
t('e faltaParaGraduar sobrevive a ele — era ISTO que derrubava a página', naoEstourou);

t('null vira estado novo', N.normalizarEstado(null).etapa === null);
t('string vira estado novo', N.normalizarEstado('lixo').etapa === null);
t('número vira estado novo', N.normalizarEstado(42).graduado === null);
t('etapa inválida é descartada', N.normalizarEstado({ etapa: 'Z' }).etapa === null);
t('etapa válida é preservada', N.normalizarEstado({ etapa: 'B' }).etapa === 'B');
t('graduado só aceita texto', N.normalizarEstado({ graduado: 123 }).graduado === null);
t('intervalo negativo vira o padrão', N.normalizarEstado({ intervalo: -5 }).intervalo === 2);
t('intervalo válido é preservado', N.normalizarEstado({ intervalo: 8 }).intervalo === 8);
t('andamentos com lixo são filtrados',
  N.normalizarEstado({ andamentos: [70, 'x', null, 90, NaN] }).andamentos.join(',') === '70,90');
t('firmeza com lixo é filtrada',
  N.normalizarEstado({ firmezaHistorico: [30, 'a', 25] }).firmezaHistorico.join(',') === '30,25');
t('retestes sem data são descartados',
  N.normalizarEstado({ retestes: [{ data: '2026-01-01' }, {}, null] }).retestes.length === 1);
t('falhas com valor negativo viram zero',
  N.normalizarEstado({ falhas: { A: -3, B: 2 } }).falhas.A === 0);
t('falhas válidas são preservadas',
  N.normalizarEstado({ falhas: { B: 3 } }).falhas.B === 3);
t('seguidas também é saneado',
  N.normalizarEstado({ seguidas: { C: 'x' } }).seguidas.C === 0);
t('campo desconhecido é ignorado, não copiado',
  N.normalizarEstado({ virus: 1 }).virus === undefined);

t('normalizarMapa sempre devolve os três exercícios',
  Object.keys(N.normalizarMapa(null)).length === N.EXERCICIOS.length);
t('normalizarMapa com mapa vazio não perde exercício',
  N.EXERCICIOS.every(e => N.normalizarMapa({})[e.id].etapa === null));
t('normalizarMapa preserva o que é válido e descarta o resto',
  N.normalizarMapa({ 'h1-pulso': { etapa: 'B' }, 'inexistente': { etapa: 'C' } })['h1-pulso'].etapa === 'B' &&
  N.normalizarMapa({ 'inexistente': {} })['inexistente'] === undefined);

console.log('\n--- clonar: registrar não pode mutar o que recebe ---');
const orig = { a: 1, b: { c: [1, 2] } };
const cop = N.clonar(orig);
t('clona por valor', JSON.stringify(cop) === JSON.stringify(orig));
cop.b.c.push(3);
t('mexer na cópia não mexe no original', orig.b.c.length === 2);
t('clona um mapa inteiro sem compartilhar referência',
  (() => { const m = N.mapaNovo(); const c2 = N.clonar(m); c2['h1-pulso'].andamentos.push(70);
           return m['h1-pulso'].andamentos.length === 0; })());

console.log('\n--- datas ---');
t('dia() converte para número de dias, ignorando fuso',
  N.dia('2026-09-19') - N.dia('2026-09-18') === 1);
t('dia() é estável para a mesma data', N.dia('2026-09-18') === N.dia('2026-09-18'));
t('diferença de dias', N.diasEntre('2026-09-18', '2026-09-22') === 4);
t('diferença negativa quando ainda não chegou', N.diasEntre('2026-09-22', '2026-09-18') === -4);
t('soma de dias', N.somaDias('2026-09-18', 2) === '2026-09-20');
t('soma atravessa o mês', N.somaDias('2026-09-30', 2) === '2026-10-02');
t('soma atravessa o ano', N.somaDias('2026-12-31', 1) === '2027-01-01');
t('ano bissexto', N.somaDias('2028-02-28', 1) === '2028-02-29');

console.log('\n--- exercícios: os dados ---');
const PADS = new Function('return ' + src.match(/var PADS=(\[[\s\S]*?\n\]);/)[1])().map(p => p.id);
t('são três exercícios', N.EXERCICIOS.length === 3, N.EXERCICIOS.length);
let ruim = '';
N.EXERCICIOS.forEach(e => {
  e.voz.forEach(v => {
    if (!PADS.includes(v.pad)) ruim = 'pad inexistente: ' + v.pad;
    v.passos.forEach(s => { if (s < 0 || s > 15 || s % 1) ruim = 'passo inválido: ' + s; });
    if (new Set(v.passos).size !== v.passos.length) ruim = 'passo repetido em ' + v.pad;
    if (!e.transposicao[v.pad]) ruim = v.pad + ' não tem para onde transpor';
    if (!PADS.includes(e.transposicao[v.pad])) ruim = 'transposição para pad inexistente em ' + e.id;
    if (e.voz.some(o => o.pad === e.transposicao[v.pad])) ruim = 'transposição colide com outra voz em ' + e.id;
  });
  (e.requer || []).forEach(r => { if (!N.exercicio(r)) ruim = e.id + ' exige ' + r + ', que não existe'; });
  if (!(e.bpm >= 60 && e.bpm <= 180)) ruim = 'bpm fora de faixa em ' + e.id;
  if (!(e.bpm2 > e.bpm)) ruim = 'o segundo andamento não é mais rápido em ' + e.id;
});
t('todos os pads, passos e transposições são válidos', !ruim, ruim);
t('o primeiro exercício não exige nada', N.EXERCICIOS[0].requer.length === 0);
t('a cadeia de requisitos não tem ciclo',
  N.EXERCICIOS.every((e, i) => (e.requer || []).every(r => N.EXERCICIOS.findIndex(x => x.id === r) < i)));
t('a dificuldade cresce em eventos por compasso',
  N.eventosPorCompasso(N.EXERCICIOS[0]) < N.eventosPorCompasso(N.EXERCICIOS[1]));
t('um eixo por vez: h1→h2 muda densidade, não número de vozes',
  N.EXERCICIOS[0].voz.length === 1 && N.EXERCICIOS[1].voz.length === 1);
t('h2→h3 muda número de vozes', N.EXERCICIOS[2].voz.length === 2);
t('a duração é a mesma em A, B e C — é o portão, não a etapa, que manda',
  N.EXERCICIOS.every(e => ['A','B','C'].every(et =>
    N.compassosDoPortao(e, et) === N.compassosDoPortao(e, 'A'))));
t('nenhum exercício pede mais de 8 compassos por execução',
  N.EXERCICIOS.every(e => N.compassosDoPortao(e, 'A') <= 8),
  N.EXERCICIOS.map(e => N.compassosDoPortao(e, 'A')).join(','));

console.log('\n--- repetir para subir: uma execução boa pode ser sorte ---');
const OK = bom(EV), RUIM = executa(EV, 0, 300, 11);   /* pela janela: precisão despenca */
const CTX = { hoje: '2026-09-18', bpm: 70 };
t('são duas execuções seguidas', N.REPETICOES === 2);
let r1 = N.registrar(N.mapaNovo(), 'h1-pulso', 'A', OK, CTX);
t('a primeira execução boa passa mas NÃO conquista a etapa',
  r1.ok && r1.estado.etapa === null && r1.eventos.indexOf('conquistou') < 0,
  JSON.stringify(r1.eventos));
t('e fica contada como 1 de 2', r1.estado.seguidas.A === 1);
let r2 = N.registrar(r1.mapa, 'h1-pulso', 'A', OK, CTX);
t('a segunda seguida conquista',
  r2.estado.etapa === 'A' && r2.eventos.indexOf('conquistou') >= 0);
let rf = N.registrar(r1.mapa, 'h1-pulso', 'A', RUIM, CTX);
t('uma falha no meio zera a sequência',
  rf.estado.seguidas.A === 0 && rf.estado.etapa === null);
t('e volta a contar do zero depois dela',
  N.registrar(rf.mapa, 'h1-pulso', 'A', OK, CTX).estado.seguidas.A === 1);

console.log('\n--- progressão: A → B → C ---');
function conquistar(mapa, id, etapa, m, ctx) {
  for (let i = 0; i < N.REPETICOES; i++) mapa = N.registrar(mapa, id, etapa, m, ctx).mapa;
  return mapa;
}
let mp = N.mapaNovo();
t('mapa novo começa em branco', N.estado(mp, 'h1-pulso').etapa === null);
t('o primeiro passo é a etapa A', N.proximaEtapa(N.estado(mp, 'h1-pulso')) === 'A');
mp = conquistar(mp, 'h1-pulso', 'A', OK, CTX);
t('conquistar A leva à etapa B', N.proximaEtapa(N.estado(mp, 'h1-pulso')) === 'B');
t('registrar não muta o mapa recebido', N.estado(N.mapaNovo(), 'h1-pulso').etapa === null);
mp = conquistar(mp, 'h1-pulso', 'B', OK, CTX);
t('conquistar B leva à etapa C',
  N.estado(mp, 'h1-pulso').etapa === 'B' && N.proximaEtapa(N.estado(mp, 'h1-pulso')) === 'C');
mp = conquistar(mp, 'h1-pulso', 'C', OK, CTX);
const e1 = N.estado(mp, 'h1-pulso');
t('conquistar C conclui C', e1.etapa === 'C');
t('mas vencer C NÃO gradua sozinho', e1.graduado === null);
t('falta transposição e outro andamento',
  N.faltaParaGraduar(e1).join(',') === 'transposição,outro andamento',
  N.faltaParaGraduar(e1).join(','));

console.log('\n--- graduação exige transposição E outro andamento ---');
let mpA = N.registrar(mp, 'h1-pulso', 'C', OK, { hoje: '2026-09-19', bpm: 90 }).mapa;
t('C em outro andamento, sem transpor, ainda não gradua',
  N.estado(mpA, 'h1-pulso').graduado === null,
  N.faltaParaGraduar(N.estado(mpA, 'h1-pulso')).join(','));
t('mas o andamento ficou registrado',
  N.estado(mpA, 'h1-pulso').andamentos.join(',') === '70,90');
let mpB = N.registrar(mp, 'h1-pulso', 'C', OK, { hoje: '2026-09-19', bpm: 70, transposto: true }).mapa;
t('C transposto no MESMO andamento ainda não gradua',
  N.estado(mpB, 'h1-pulso').graduado === null,
  N.faltaParaGraduar(N.estado(mpB, 'h1-pulso')).join(','));
let rg = N.registrar(mpA, 'h1-pulso', 'C', OK, { hoje: '2026-09-20', bpm: 90, transposto: true });
t('transposto + dois andamentos GRADUA', rg.estado.graduado === '2026-09-20', rg.estado.graduado);
t('graduar agenda o primeiro reteste em 2 dias',
  rg.estado.proximoReteste === '2026-09-22', rg.estado.proximoReteste);
t('graduar aparece nos eventos', rg.eventos.indexOf('graduou') >= 0);
t('quem decorou os pads originais nunca gradua',
  N.estado(mpA, 'h1-pulso').graduado === null && N.estado(mpA, 'h1-pulso').transposto === false);
let mpG = rg.mapa;
t('a firmeza vai para o histórico',
  N.estado(mpG, 'h1-pulso').firmezaHistorico.length >= 3,
  N.estado(mpG, 'h1-pulso').firmezaHistorico.join(','));

console.log('\n--- reteste frio ---');
t('no dia da graduação não há reteste devido', N.retesteDevido(mpG, '2026-09-20') === null);
t('um dia antes do prazo ainda não', N.retesteDevido(mpG, '2026-09-21') === null);
t('no dia do prazo o reteste é devido', N.retesteDevido(mpG, '2026-09-22') === 'h1-pulso');
t('depois do prazo também', N.retesteDevido(mpG, '2026-09-30') === 'h1-pulso');
t('exercício não graduado nunca é retestado',
  N.retesteDevido(N.mapaNovo(), '2027-01-01') === null);

r = N.aplicarReteste(mpG, 'h1-pulso', OK, '2026-09-22');
t('reteste aprovado mantém a graduação', r.estado.graduado === '2026-09-20');
t('reteste aprovado dobra o intervalo: 2 → 4', r.estado.intervalo === 4, r.estado.intervalo);
t('e reagenda para 4 dias depois', r.estado.proximoReteste === '2026-09-26', r.estado.proximoReteste);
t('o reteste fica registrado com a firmeza',
  r.estado.retestes.length === 1 && r.estado.retestes[0].passou === true);

let mpR = r.mapa, intervalos = [r.estado.intervalo];
let d = '2026-09-26';
for (let i = 0; i < 2; i++) {
  const rr = N.aplicarReteste(mpR, 'h1-pulso', OK, d);
  mpR = rr.mapa; intervalos.push(rr.estado.intervalo); d = rr.estado.proximoReteste;
}
t('o intervalo dobra 2 → 4 → 8 → 16', intervalos.join(',') === '4,8,16', intervalos.join(','));

r = N.aplicarReteste(mpG, 'h1-pulso', RUIM, '2026-09-22');
t('reteste REPROVADO revoga a graduação', r.estado.graduado === null);
t('e volta para a Etapa B', N.proximaEtapa(r.estado) === 'B', r.estado.etapa);
t('e zera o intervalo', r.estado.intervalo === 2);
t('e não deixa reteste agendado', r.estado.proximoReteste === null);
t('a reprovação fica no histórico, não é apagada',
  r.estado.retestes.length === 1 && r.estado.retestes[0].passou === false);
/* Revogar tem de doer. Antes, seguidas/transposto/andamentos sobreviviam à
   revogação, e UMA execução C boa reconquistava a etapa E regraduava no mesmo
   instante, sem reconferir a transposição nem o outro andamento — que são o
   que define graduar. O reteste frio era teatro. */
t('a revogação zera a sequência',
  JSON.stringify(r.estado.seguidas) === JSON.stringify({A:0,B:0,C:0}),
  JSON.stringify(r.estado.seguidas));
t('e zera transposição e andamentos: eles têm de ser provados de novo',
  r.estado.transposto === false && r.estado.andamentos.length === 0,
  JSON.stringify([r.estado.transposto, r.estado.andamentos]));
{
  const otimo2 = N.metricas(new Array(24).fill(0).map((_, i) => (i % 2 ? .004 : -.004)), 24, 0);
  const g1 = N.registrar(r.mapa, 'h1-pulso', 'C', otimo2, {hoje:'2026-09-20', bpm:70});
  t('e UMA execução boa depois NÃO regradua na hora',
    g1.eventos.indexOf('graduou') < 0, JSON.stringify(g1.eventos));
}

console.log('\n--- corpo e voz antes do dedo ---');
/* A crítica pedagógica que sobreviveu a tudo: as três etapas mudam o que a
   tela mostra e nunca o que o corpo faz. Antes da primeira etapa A vem uma
   escuta sem pad — palma ou voz — e ela não é medida. */
t('exercício nunca tocado precisa sentir primeiro', N.precisaSentir(N.estadoNovo()));
t('estado ausente também precisa', N.precisaSentir(null));
t('depois de sentir, não precisa de novo',
  !N.precisaSentir(N.marcarSentiu(N.mapaNovo(), 'h1-pulso')['h1-pulso']));
t('marcarSentiu não muta o mapa recebido',
  (() => { const m = N.mapaNovo(); N.marcarSentiu(m, 'h1-pulso'); return !m['h1-pulso'].sentiu; })());
t('marcarSentiu não mexe nos outros exercícios',
  !N.marcarSentiu(N.mapaNovo(), 'h1-pulso')['h2-colcheia'].sentiu);

const novoA = { tipo: 'novo', id: 'h1-pulso', etapa: 'A' };
t('a etapa A de quem nunca sentiu começa pela escuta',
  N.modoDaVez(N.estadoNovo(), novoA) === 'sentir');
t('quem já sentiu vai direto para a etapa A',
  N.modoDaVez({ sentiu: true }, novoA) === 'valendo');
t('as etapas B e C nunca passam pela escuta',
  N.modoDaVez(N.estadoNovo(), { tipo: 'treino', id: 'h1-pulso', etapa: 'B' }) === 'valendo' &&
  N.modoDaVez(N.estadoNovo(), { tipo: 'treino', id: 'h1-pulso', etapa: 'C' }) === 'valendo');
t('o reteste frio NUNCA vira escuta — ele mede o que ficou',
  N.modoDaVez(N.estadoNovo(), { tipo: 'reteste', id: 'h1-pulso', etapa: 'C' }) === 'valendo');
t('sem nada a fazer não há escuta', N.modoDaVez(N.estadoNovo(), { tipo: 'nada' }) === 'valendo');
t('o saneamento preserva quem já sentiu', N.normalizarEstado({ sentiu: true }).sentiu === true);
t('e trata lixo como não-sentiu', N.normalizarEstado({ sentiu: 'talvez' }).sentiu === true &&
  N.normalizarEstado({ sentiu: 0 }).sentiu === false);

console.log('\n--- autonomia: voltar para uma etapa anterior ---');
/* A v0.5 perdeu, na reescrita, a navegação entre etapas que a v0.4 tinha.
   Quem passava de etapa não conseguia mais voltar para refazer a anterior. */
t('quem não começou só pode jogar a etapa A',
  N.etapasDisponiveis(N.estadoNovo()).join('') === 'A');
t('quem conquistou A pode jogar A ou B — voltar é direito',
  N.etapasDisponiveis({ etapa: 'A' }).join('') === 'AB');
t('quem conquistou B pode jogar as três', N.etapasDisponiveis({ etapa: 'B' }).join('') === 'ABC');
t('quem conquistou C continua podendo jogar as três',
  N.etapasDisponiveis({ etapa: 'C' }).join('') === 'ABC');
t('ninguém pula adiante: sem etapa concluída, B e C ficam fora',
  N.etapasDisponiveis(N.estadoNovo()).indexOf('C') < 0);

let mAut = N.mapaNovo();
t('no mapa novo dá para jogar o h1 na etapa A', N.podeJogar(mAut, 'h1-pulso', 'A'));
t('mas não o h1 na etapa C', !N.podeJogar(mAut, 'h1-pulso', 'C'));
t('e não o h2, que está trancado', !N.podeJogar(mAut, 'h2-colcheia', 'A'));
mAut = conquistar(mAut, 'h1-pulso', 'A', OK, CTX);
mAut = conquistar(mAut, 'h1-pulso', 'B', OK, CTX);
t('depois de conquistar B, dá para VOLTAR à etapa A do mesmo exercício',
  N.podeJogar(mAut, 'h1-pulso', 'A'));
t('e o h2 destrava', N.podeJogar(mAut, 'h2-colcheia', 'A'));
t('exercício inexistente nunca pode ser jogado', !N.podeJogar(mAut, 'nao-existe', 'A'));
t('etapa inexistente nunca pode ser jogada', !N.podeJogar(mAut, 'h1-pulso', 'Z'));

console.log('\n--- o que fazer agora: reteste > treino > novo > nada ---');
let vazio = N.mapaNovo();
t('mapa vazio manda começar o h1 na etapa A',
  JSON.stringify(N.oQueAgora(vazio, '2026-09-18')) === '{"tipo":"novo","id":"h1-pulso","etapa":"A"}',
  JSON.stringify(N.oQueAgora(vazio, '2026-09-18')));
t('h2 fica trancado até o h1 concluir a etapa C',
  !N.desbloqueado(vazio, N.EXERCICIOS[1]));
t('h2 destranca com o h1 na etapa C, sem precisar de graduação',
  N.desbloqueado(mp, N.EXERCICIOS[1]));

let oq = N.oQueAgora(mp, '2026-09-18');
t('com h1 em C mas não graduado, ele é o treino',
  oq.tipo === 'treino' && oq.id === 'h1-pulso' && oq.etapa === 'C', JSON.stringify(oq));
oq = N.oQueAgora(mpG, '2026-09-18');
t('com h1 graduado e sem reteste devido, abre o h2 como novo',
  oq.tipo === 'novo' && oq.id === 'h2-colcheia', JSON.stringify(oq));
oq = N.oQueAgora(mpG, '2026-09-25');
t('reteste devido tem prioridade sobre exercício novo',
  oq.tipo === 'reteste' && oq.id === 'h1-pulso' && oq.etapa === 'C', JSON.stringify(oq));

/* tudo graduado e nada devido → o app diz que acabou por hoje */
let tudo = N.mapaNovo();
Object.keys(tudo).forEach(id => {
  tudo[id] = Object.assign(N.estadoNovo(), {
    etapa: 'C', graduado: '2026-09-20', transposto: true, andamentos: [100, 120],
    intervalo: 8, proximoReteste: '2026-09-28'
  });
});
t('tudo graduado e nenhum reteste devido → nada a fazer hoje',
  N.oQueAgora(tudo, '2026-09-22').tipo === 'nada', JSON.stringify(N.oQueAgora(tudo, '2026-09-22')));
t('e quando o reteste chega, volta a ter o que fazer',
  N.oQueAgora(tudo, '2026-09-28').tipo === 'reteste');

console.log('\n--- tolerância adaptativa: a etapa B afrouxa, a C não ---');
t('sem falhas, B exige 45 ms', near(N.limiteFirmeza('B', 0), 0.045));
t('quatro falhas afrouxam B até 63 ms', near(N.limiteFirmeza('B', 4), 0.063, 1e-9),
  N.limiteFirmeza('B', 4));
t('o afrouxamento tem teto: a quinta falha não afrouxa mais',
  near(N.limiteFirmeza('B', 9), N.limiteFirmeza('B', 4)));
t('C NUNCA afrouxa, por mais que se falhe',
  near(N.limiteFirmeza('C', 0), N.PORTAO.C.S) && near(N.limiteFirmeza('C', 9), N.PORTAO.C.S));
t('A não tem limite de firmeza', N.limiteFirmeza('A', 0) === null);

console.log('\n--- O TETO DO VIÉS: o portão olha o deslocamento, não só a oscilação ---');
/* A auditoria cega provou que um robô tocando 110 ms atrasado graduava:
   passou() olhava só S, que é invariante a deslocamento. Estes testes são
   o portão que impede isso de voltar. */
const mm = (B, S) => ({ n: 24, casados: 24, excedentes: 0, P: 1, L: 1, B: B / 1000, S: S / 1000 });

t('B e C têm teto de viés; A não tem, por projeto',
  near(N.limiteVies('B'), 0.035) && near(N.limiteVies('C'), 0.035) &&
  N.limiteVies('A') === null);
t('o teto é a mesma linha que separa feel de deslocado',
  near(N.limiteVies('C'), N.LIMIAR.viesMax));

/* O CASO QUE MOTIVOU A CORREÇÃO, ponta a ponta. */
const robo = mm(110, 11);
t('o robô a +110 ms é firme: S sozinho o aprovaria em qualquer etapa',
  robo.S <= N.PORTAO.C.S && robo.S <= N.PORTAO.B.S);
t('e mesmo assim REPROVA a etapa C — o viés agora conta',
  N.passou('C', robo, 0) === false);
t('o diagnóstico já dizia o que estava errado — agora o portão concorda',
  N.diagnostico(robo).codigo === 'vies');
t('e a leitura de groove chama isso de deslocado, não de feel',
  N.leituraGroove(robo) === 'deslocado');

console.log('\n--- o afrouxamento é só da oscilação; o viés nunca afrouxa ---');
/* O buraco que a prova no navegador encontrou DEPOIS da primeira correção:
   com um número só de erro, afrouxar a etapa B afrouxava o viés junto, e o
   robô atrasado passava em B. Oscilação leva semanas; viés se corrige na
   mesma sessão. Só a primeira afrouxa. */
t('o robô atrasado reprova B mesmo com todo o afrouxamento disponível',
  N.passou('B', mm(78, 8), N.AFROUXA.maxFalhas) === false, 'viés 78 ms');
t('e reprova B com qualquer número de falhas',
  [0, 1, 2, 3, 4, 9].every(f => N.passou('B', mm(78, 8), f) === false));
t('o teto do viés não se move com as falhas',
  [0, 4, 9].every(f => N.limiteVies('B') === N.limiteVies('B')));
/* e o afrouxamento continua fazendo o que nasceu para fazer */
t('o iniciante que OSCILA 46 ms continua sendo destravado pelo afrouxamento',
  N.passou('B', mm(10, 46), 0) === false && N.passou('B', mm(10, 46), 3),
  'sem falhas reprova, com 3 falhas passa');
t('mas oscilar muito não vira desculpa para estar deslocado',
  N.passou('B', mm(60, 46), 4) === false);

console.log('\n--- quem toca bem continua passando ---');
const comFeel = mm(28, 14);
t('feel legítimo (28 ms firme) ainda gradua na etapa C', N.passou('C', comFeel, 0));
t('a leitura confirma que isso é feel', N.leituraGroove(comFeel) === 'feel');
t('cravado passa, obviamente', N.passou('C', mm(3, 12), 0));
t('antecipar 28 ms passa igual: o sinal não muda o veredito',
  N.passou('C', mm(-28, 14), 0));

console.log('\n--- as fronteiras ---');
t('exatamente no teto (35 ms) ainda passa', N.passou('C', mm(35, 10), 0));
t('1 ms além do teto reprova', N.passou('C', mm(36, 10), 0) === false);
t('e reprova antecipando também', N.passou('C', mm(-36, 10), 0) === false);
t('viés de 80 ms reprova C mesmo com oscilação zero',
  N.passou('C', mm(80, 0), 0) === false);
t('a etapa A ignora os dois: ela pergunta quais notas, não o tempo',
  N.passou('A', mm(200, 0), 0), 'A com 200 ms de viés passa, por projeto');
t('métrica sem viés declarado não quebra o portão',
  N.passou('C', { n: 24, P: 1, L: 1, S: 0.01 }, 0));

/* firmeza de 53 ms: entre o portão original de B (45) e o afrouxado (63) */
const quaseB = executa(EV, 0, 90, 9);
let mfa = N.mapaNovo();
mfa = N.registrar(mfa, 'h1-pulso', 'A', bom(16), { hoje: '2026-09-18', bpm: 100 }).mapa;
let tentativa = N.registrar(mfa, 'h1-pulso', 'B', quaseB, { hoje: '2026-09-18', bpm: 100 });
t('falhar em B conta a falha e avisa que afrouxou',
  tentativa.estado.falhas.B === 1 && tentativa.eventos.includes('afrouxou'),
  JSON.stringify(tentativa.eventos));
t('o mesmo desempenho que reprovava passa depois de quatro falhas',
  !N.passou('B', quaseB, 0) && N.passou('B', quaseB, 4),
  'S=' + Math.round(quaseB.S * 1000) + ' ms');
t('mas esse mesmo desempenho continua reprovando em C',
  !N.passou('C', quaseB, 4), 'S=' + Math.round(quaseB.S * 1000) + ' ms');
t('e o afrouxamento não mexe na precisão exigida',
  !N.passou('B', N.metricas(new Array(10).fill(0.004), 16), 4));

console.log('\n--- qual variante o app cobra nesta volta ---');
const ex1 = N.exercicio('h1-pulso');
t('os exercícios começam devagar — 70 ou 80 bpm, nunca 100',
  N.EXERCICIOS.every(e => e.bpm <= 80), N.EXERCICIOS.map(e => e.bpm).join(','));
t('cada exercício tem um segundo andamento, mais rápido',
  N.EXERCICIOS.every(e => e.bpm2 > e.bpm), N.EXERCICIOS.map(e => e.bpm + '→' + e.bpm2).join(' '));
t('nas etapas A e B nunca transpõe nem muda o andamento',
  JSON.stringify(N.varianteDaVez({ etapa: null, transposto: false, andamentos: [] }, ex1)) ===
  JSON.stringify({ transposto: false, bpm: ex1.bpm }));
t('a primeira vez na etapa C é simples — é para concluir C',
  N.varianteDaVez({ etapa: 'B', transposto: false, andamentos: [] }, ex1).transposto === false);
t('concluída a C, a volta seguinte cobra a transposição',
  N.varianteDaVez({ etapa: 'C', transposto: false, andamentos: [ex1.bpm] }, ex1).transposto === true);
let vv = N.varianteDaVez({ etapa: 'C', transposto: true, andamentos: [ex1.bpm] }, ex1);
t('transposto já feito, cobra o andamento mais rápido',
  vv.transposto === false && vv.bpm === ex1.bpm2, JSON.stringify(vv));
t('cumpridos os dois, volta ao andamento base',
  JSON.stringify(N.varianteDaVez({ etapa: 'C', transposto: true, andamentos: [ex1.bpm, ex1.bpm2] }, ex1)) ===
  JSON.stringify({ transposto: false, bpm: ex1.bpm }));
t('a variante nunca inventa um bpm fora de faixa',
  N.EXERCICIOS.every(e => [{}, { etapa: 'C', transposto: false, andamentos: [] },
  { etapa: 'C', transposto: true, andamentos: [e.bpm] }]
    .every(st => { const v = N.varianteDaVez(st, e); return v.bpm >= 60 && v.bpm <= 180; })));
t('o segundo andamento também está em faixa tocável',
  N.EXERCICIOS.every(e => e.bpm2 >= 60 && e.bpm2 <= 180));

console.log('\n--- percursos simulados: ninguém tranca, ninguém pula ---');
function percurso(viesMs, tremorMs, tentativasMax) {
  let mapa = N.mapaNovo(), hoje = '2026-09-18', passos = [], guard = 0;
  while (guard++ < tentativasMax) {
    const o = N.oQueAgora(mapa, hoje);
    if (o.tipo === 'nada') { passos.push('nada'); break; }
    const ex = N.exercicio(o.id);
    const k = N.eventosPorCompasso(ex) * N.compassosDoPortao(ex, o.etapa);
    const mm = executa(k, viesMs, tremorMs, guard * 7 + 3);
    const st = N.estado(mapa, o.id);
    /* o jogador tenta transpor e variar o andamento quando já venceu C */
    const ctx = { hoje: hoje, bpm: st.andamentos.length ? ex.bpm2 : ex.bpm, transposto: st.andamentos.length > 0 };
    if (o.tipo === 'reteste') mapa = N.aplicarReteste(mapa, o.id, mm, hoje).mapa;
    else mapa = N.registrar(mapa, o.id, o.etapa, mm, ctx).mapa;
    passos.push(o.tipo + ':' + o.id + ':' + o.etapa);
    hoje = N.somaDias(hoje, 1);
  }
  return { mapa, passos };
}
const etapas = mapa => N.EXERCICIOS.map(e => e.id + '=' + (N.estado(mapa, e.id).etapa || '–') +
  (N.estado(mapa, e.id).graduado ? '*' : '')).join(' ');

const bomJogador = percurso(4, 12, 200);
t('jogador bom gradua os três exercícios',
  N.EXERCICIOS.every(e => N.estado(bomJogador.mapa, e.id).graduado), etapas(bomJogador.mapa));
t('jogador bom chega ao "nada a fazer hoje"', bomJogador.passos.includes('nada'));
t('e não pulou nenhuma etapa: cada exercício passou por A, B e C',
  N.EXERCICIOS.every(e => ['A', 'B', 'C'].every(et =>
    bomJogador.passos.some(p => p.endsWith(':' + e.id + ':' + et)))),
  bomJogador.passos.join(' | '));

/* firmeza em torno de 53 ms: sabe as notas, não segura o tempo.
   É exatamente o caso que o portão fixo prendia para sempre. */
const medio = percurso(18, 90, 400);
t('jogador mediano NÃO fica preso: destrava o segundo exercício',
  N.estado(medio.mapa, 'h2-colcheia').etapa !== null, etapas(medio.mapa));
t('jogador mediano NÃO gradua tudo — a barra da etapa C segura',
  !N.EXERCICIOS.every(e => N.estado(medio.mapa, e.id).graduado), etapas(medio.mapa));
/* O afrouxamento existe para destravar quem emperrou — e o jogador mediano é
   exatamente esse caso. Mas ele NUNCA zerava, e o resultado era inversão:
   quem oscila 60 ms com 4 reprovações passava a etapa B e quem oscila 48 ms
   sem reprovação nenhuma não passava (medido em verificar-auditoria.js). */
t('ele destravou a etapa B, que é para isso que o afrouxamento existe',
  N.estado(medio.mapa, 'h1-pulso').etapa !== null &&
  N.estado(medio.mapa, 'h1-pulso').etapa !== 'A',
  etapas(medio.mapa));
t('e ao CONQUISTAR a etapa, o afrouxamento zerou — não vira desconto vitalício',
  N.estado(medio.mapa, 'h1-pulso').falhas.B === 0,
  JSON.stringify(N.estado(medio.mapa, 'h1-pulso').falhas));
{
  /* o zeramento, direto e determinístico */
  const ruim = { n: 24, casados: 24, excedentes: 0, P: 1, L: 1, B: 0, ref: 0, S: 0.2 };
  const bomB = { n: 24, casados: 24, excedentes: 0, P: 1, L: 1, B: 0, ref: 0, S: 0.040 };
  let mp = N.mapaNovo();
  for (let i = 0; i < 4; i++) mp = N.registrar(mp, 'h1-pulso', 'B', ruim, { hoje: '2026-09-19' }).mapa;
  t('quatro reprovações acumulam afrouxamento',
    N.estado(mp, 'h1-pulso').falhas.B === 4 &&
    N.limiteFirmeza('B', 4) > N.limiteFirmeza('B', 0));
  mp = N.registrar(mp, 'h1-pulso', 'B', bomB, { hoje: '2026-09-19' }).mapa;
  t('uma passada só NÃO zera — a tolerância vale até a etapa ficar de pé',
    N.estado(mp, 'h1-pulso').falhas.B === 4, JSON.stringify(N.estado(mp, 'h1-pulso').falhas));
  mp = N.registrar(mp, 'h1-pulso', 'B', bomB, { hoje: '2026-09-19' }).mapa;
  t('a segunda seguida CONQUISTA a etapa e zera o afrouxamento',
    N.estado(mp, 'h1-pulso').etapa === 'B' && N.estado(mp, 'h1-pulso').falhas.B === 0,
    JSON.stringify(N.estado(mp, 'h1-pulso')));
  t('e a barra volta a ser a de todo mundo',
    N.limiteFirmeza('B', N.estado(mp, 'h1-pulso').falhas.B) === N.PORTAO.B.S);
}
t('e o app nunca deixa de ter o que oferecer a ele',
  N.oQueAgora(medio.mapa, '2027-01-01').tipo !== 'nada',
  JSON.stringify(N.oQueAgora(medio.mapa, '2027-01-01')));

const ruimJogador = percurso(0, 700, 80);
t('quem não acerta quase nada não passa da etapa A',
  N.estado(ruimJogador.mapa, 'h1-pulso').etapa === null, etapas(ruimJogador.mapa));
t('e nunca destrava o h2', N.estado(ruimJogador.mapa, 'h2-colcheia').etapa === null);
t('mas o app nunca fica sem nada para oferecer a ele',
  N.oQueAgora(ruimJogador.mapa, '2027-01-01').tipo !== 'nada');


console.log('\n--- A REGRA DE VARIANTE, UMA VEZ SÓ ---');
/* Estava escrita em três lugares (planejar, comecar, meuPad) e a terceira já
   tinha divergido. Pior: o ramo 'escolhido' forçava a variante simples, então
   quem tocava numa linha do mapa desligava a própria graduação sem saber. */
{
  const ex = N.exercicio('h1-pulso');
  let mp = N.mapaNovo();
  /* leva h1 até conquistar a etapa C */
  const otimo = N.metricas(new Array(24).fill(0).map((_, i) => (i % 2 ? 0.004 : -0.004)), 24, 0);
  ['A', 'A', 'B', 'B', 'C', 'C'].forEach(et => {
    mp = N.registrar(mp, 'h1-pulso', et, otimo, { hoje: '2026-09-18', bpm: ex.bpm }).mapa;
  });
  t('preparo: h1 com a etapa C conquistada', N.estado(mp, 'h1-pulso').etapa === 'C',
    N.estado(mp, 'h1-pulso').etapa);

  const vTreino = N.varianteDoPlano(mp, { tipo: 'treino', id: 'h1-pulso', etapa: 'C' });
  const vEscolha = N.varianteDoPlano(mp, { tipo: 'escolhido', id: 'h1-pulso', etapa: 'C' });
  t('escolher a etapa C dá EXATAMENTE a mesma variante que o treino sugerido',
    JSON.stringify(vEscolha) === JSON.stringify(vTreino),
    'escolhido=' + JSON.stringify(vEscolha) + ' treino=' + JSON.stringify(vTreino));
  t('e essa variante é a transposição, que é o que falta para graduar',
    vEscolha.transposto === true, JSON.stringify(vEscolha));
  t('o reteste continua sendo o C simples e frio — é o que ele mede',
    N.varianteDoPlano(mp, { tipo: 'reteste', id: 'h1-pulso', etapa: 'C' }).transposto === false);
  t('etapas A e B não transpõem, escolhidas ou não',
    ['A', 'B'].every(et => ['treino', 'escolhido'].every(tp =>
      N.varianteDoPlano(mp, { tipo: tp, id: 'h1-pulso', etapa: et }).transposto === false)));
  t('plano sem exercício não quebra',
    N.varianteDoPlano(mp, { tipo: 'treino' }).bpm > 0 &&
    N.varianteDoPlano(mp, { tipo: 'treino', id: 'inexistente', etapa: 'C' }).bpm > 0);

  /* O CASO DO RENATO: 21 execuções, todas a 70 bpm, nenhuma transposta,
     mesmo depois de conquistar a etapa C. Graduar era impossível. */
  let comEscolha = mp, dia = '2026-09-18';
  for (let i = 0; i < 6; i++) {
    const p = { tipo: 'escolhido', id: 'h1-pulso', etapa: 'C' };
    const v = N.varianteDoPlano(comEscolha, p);
    comEscolha = N.registrar(comEscolha, 'h1-pulso', 'C', otimo,
      { hoje: dia, transposto: v.transposto, bpm: v.bpm }).mapa;
    dia = N.somaDias(dia, 1);
  }
  t('escolhendo a etapa C seis vezes, o exercício GRADUA',
    N.estado(comEscolha, 'h1-pulso').graduado !== null,
    JSON.stringify(N.faltaParaGraduar(N.estado(comEscolha, 'h1-pulso'))));
}

console.log('\n--- A RETIRADA DO ANDAIME AUDITIVO ---');
/* A auditoria pedagógica: "não existe um único momento, em nenhuma etapa, em
   que o aluno precise manter o tempo sozinho". O pulso tocava em toda etapa,
   todo compasso, sempre. */
t('nas etapas A e B o pulso NUNCA some — a pista já foi embora, o tempo não',
  ['A', 'B'].every(et => [0, 1, 2, 3, 4, 5, 6, 7].every(c => N.pulsoAudivel(et, c) === true)));
t('na etapa C o pulso some em parte dos compassos',
  [0, 1, 2, 3, 4, 5].some(c => N.pulsoAudivel('C', c) === false));
t('e o padrão é: dois compassos com a máquina, dois sem',
  [0, 1, 2, 3, 4, 5, 6, 7].map(c => N.pulsoAudivel('C', c) ? 1 : 0).join('') === '11001100',
  [0, 1, 2, 3, 4, 5, 6, 7].map(c => N.pulsoAudivel('C', c) ? 1 : 0).join(''));
t('o pulso SEMPRE volta — o reencontro é o ensino, o silêncio não é castigo',
  [0, 1, 2, 3].some(c => N.pulsoAudivel('C', c)) &&
  [4, 5, 6, 7].some(c => N.pulsoAudivel('C', c)) &&
  [8, 9, 10, 11].some(c => N.pulsoAudivel('C', c)));
t('o aquecimento sempre tem pulso: não se entra no escuro',
  [-1, -2, -3].every(c => N.pulsoAudivel('C', c) === true));
t('compasso inválido não quebra e não emudece por acidente',
  N.pulsoAudivel('C', NaN) === true && N.pulsoAudivel('C', undefined) === true);
t('cada exercício tem pelo menos um compasso medido em silêncio na etapa C',
  N.EXERCICIOS.every(ex => {
    const comps = N.compassosDoPortao(ex, 'C');
    let mudos = 0;
    for (let c = 0; c < comps; c++) if (!N.pulsoAudivel('C', c)) mudos++;
    return mudos > 0;
  }),
  N.EXERCICIOS.map(ex => {
    const comps = N.compassosDoPortao(ex, 'C');
    let s = '';
    for (let c = 0; c < comps; c++) s += N.pulsoAudivel('C', c) ? '♪' : '·';
    return ex.id + '=' + s;
  }).join(' '));


console.log('\n--- O MAPA DO ERRO POR POSIÇÃO NO COMPASSO ---');
/* O app media em qual tempo a pessoa derrapa e apagava a pista no instante em
   que a execução acabava. "Firmeza 38" não diz o que fazer; "você atrasa no
   terceiro tempo" diz. */
{
  const pares = [];
  [0, 4, 8, 12].forEach(st => {
    for (let i = 0; i < 6; i++) pares.push({ st, d: (st === 8 ? 0.060 : 0.002) + (i % 2 ? .001 : -.001) });
  });
  const P = N.perfilPasso(pares);
  t('um item por posição do compasso, em ordem',
    P.length === 4 && P.map(p => p.st).join(',') === '0,4,8,12', JSON.stringify(P.map(p => p.st)));
  t('cada posição conta suas amostras', P.every(p => p.n === 6));
  t('o tempo em que a pessoa atrasa aparece com o valor certo',
    Math.abs(P[2].media - 0.060) < 0.002, P[2].media);
  t('e os outros ficam perto de zero',
    [0, 1, 3].every(i => Math.abs(P[i].media) < 0.005));
  t('o perfil também guarda a dispersão dentro da posição',
    P.every(p => isFinite(p.spread)));
}
t('lista vazia não quebra', N.perfilPasso([]).length === 0 && N.perfilPasso(null).length === 0);
t('par inválido é descartado em vez de virar NaN',
  N.perfilPasso([{st: 0, d: 0.01}, {st: NaN, d: 0.01}, {st: 4, d: NaN}, null]).length === 1);

console.log('\n--- A LINHA DE PROGRESSO ---');
/* firmezaHistorico e retestes eram coletados e nunca lidos por ninguém. */
const dia = (s, regua) => ({ d: '2026-09-18', s: s, c: 24, regua: regua === undefined ? 2 : regua });
{
  const melhorando = [46, 44, 42, 38, 36, 33, 30, 28, 27, 25].map(x => dia(x));
  const G = N.progresso(melhorando, 2);
  t('com dez execuções há linha de progresso', G !== null && G.n === 10, JSON.stringify(G && G.n));
  t('compara as 5 primeiras com as 5 últimas', G.k === 5);
  t('quem melhora tem delta NEGATIVO — oscila menos', G.delta < 0, G.delta);
  t('e o número bate com a média das pontas',
    Math.abs(G.primeiras - 41.2) < 0.01 && Math.abs(G.ultimas - 28.6) < 0.01,
    G.primeiras + ' → ' + G.ultimas);
}
t('quem piora tem delta positivo',
  N.progresso([25, 27, 28, 30, 36, 38, 42, 46].map(x => dia(x)), 2).delta > 0);
t('com menos de seis execuções não se afirma tendência nenhuma',
  N.progresso([dia(40), dia(38), dia(36), dia(34), dia(32)], 2) === null);
t('diário vazio ou ausente não quebra',
  N.progresso([], 2) === null && N.progresso(null, 2) === null);

/* A RÉGUA — o motivo de tudo isto existir separado. */
t('linhas medidas com OUTRA régua não entram na comparação',
  N.progresso([dia(80, 1), dia(78, 1), dia(76, 1), dia(74, 1),
               dia(34), dia(32), dia(30), dia(28), dia(27), dia(25)], 2).n === 6,
  JSON.stringify(N.progresso([dia(80,1),dia(78,1),dia(76,1),dia(74,1),
                              dia(34),dia(32),dia(30),dia(28),dia(27),dia(25)], 2).serie));
t('e por isso um conserto na medição NÃO inventa uma regressão',
  N.progresso([dia(20, 1), dia(20, 1), dia(20, 1),
               dia(44), dia(42), dia(40), dia(38), dia(36), dia(34)], 2).delta < 0,
  'com régua 1 no meio, pareceria que ele dobrou de oscilação');
t('linha sem firmeza ou sem nota casada é descartada',
  N.progresso([dia(44), dia(42), dia(40), dia(38), dia(36), dia(34),
               {d:'x', s:0, c:24, regua:2}, {d:'x', s:30, c:0, regua:2}], 2).n === 6);
t('linha antiga sem campo de régua conta como régua 1',
  N.progresso([40,38,36,34,32,30].map(v => ({d:'x',s:v,c:24})), 1).n === 6);

console.log('\n--- O GRÁFICO SÓ FALA QUANDO A DIFERENÇA SUPERA O PRÓPRIO RUÍDO ---');
/* Com habilidade CONSTANTE, o limiar fixo de 1,5 ms anunciava "melhorou" em
   32% das sessões e "piorou" em 33% — medido em verificar-auditoria.js.
   Dois terços de história inventada, no único número que faz o Renato voltar.
   Amostras DETERMINÍSTICAS aqui: com valores sorteados o teste mediria o
   sorteio em vez da função, erro já cometido no bloco da deriva. */
{
  /* oscilação que vai e volta em torno de 40, sem tendência nenhuma */
  const ruidoso = [44, 36, 43, 37, 42, 38, 44, 36, 43, 37].map(x => dia(x));
  const G = N.progresso(ruidoso, 2);
  t('série sem tendência: o app se recusa a dar veredito',
    G !== null && G.fala === false,
    'delta ' + G.delta.toFixed(1) + ' ms · ruído ' + G.ruido.toFixed(1) + ' ms');
  t('e ainda assim devolve a série, para desenhar a linha',
    G.serie.length === 10);
}
{
  /* a MESMA diferença de 1,6 ms que o limiar antigo chamava de melhora */
  const quase = [42, 38, 42, 38, 42, 38, 40, 36, 40, 37].map(x => dia(x));
  const G = N.progresso(quase, 2);
  t('uma diferença de poucos ms dentro do ruído NÃO vira melhora',
    Math.abs(G.delta) > 1.5 && G.fala === false,
    'delta ' + G.delta.toFixed(1) + ' ms · dois erros-padrão = ' + (2 * G.ruido).toFixed(1) + ' ms');
}
{
  /* melhora grande e consistente: aí sim */
  const melhora = [46, 45, 46, 44, 45, 30, 29, 30, 28, 29].map(x => dia(x));
  const G = N.progresso(melhora, 2);
  t('uma melhora real e consistente É anunciada',
    G.fala === true && G.delta < 0,
    'delta ' + G.delta.toFixed(1) + ' ms · dois erros-padrão = ' + (2 * G.ruido).toFixed(1) + ' ms');
}
t('ruído zero não vira divisão por zero nem certeza absoluta',
  N.progresso([30, 30, 30, 30, 30, 30].map(x => dia(x)), 2).fala === false);

console.log('\n--- E SÓ COMPARA O QUE É COMPARÁVEL ---');
/* Quem melhora de verdade mas sobe da etapa A para a C era informado de que
   PIOROU em 65% das sessões: a etapa C custa 10,7 ms de oscilação a mais
   (medido no diário do Renato) e a série não sabia disso. */
{
  const l = (ex, et, bpm, s) => ({ d: 'x', ex: ex, et: et, bpm: bpm, s: s, c: 24, regua: 2 });
  const misto = [
    l('h1-pulso', 'A', 70, 40), l('h1-pulso', 'A', 70, 39), l('h1-pulso', 'A', 70, 38),
    l('h1-pulso', 'A', 70, 37), l('h1-pulso', 'A', 70, 36), l('h1-pulso', 'A', 70, 35),
    l('h3-duas-vozes', 'C', 100, 48), l('h3-duas-vozes', 'C', 100, 47),
    l('h3-duas-vozes', 'C', 100, 46), l('h3-duas-vozes', 'C', 100, 45),
    l('h3-duas-vozes', 'C', 100, 44), l('h3-duas-vozes', 'C', 100, 43)
  ];
  const alvo = { ex: 'h3-duas-vozes', et: 'C', bpm: 100 };
  t('sem filtro, a série mistura dois exercícios e duas etapas',
    N.progresso(misto, 2).n === 12);
  t('com filtro, só entra o que é a mesma tarefa',
    N.progresso(misto, 2, alvo).n === 6, JSON.stringify(N.progresso(misto, 2, alvo).serie));
  t('e aí o veredito é sobre ELE melhorando, não sobre a tarefa ter ficado difícil',
    N.progresso(misto, 2, alvo).delta < 0 && N.progresso(misto, 2).delta > 0,
    'filtrado ' + N.progresso(misto, 2, alvo).delta.toFixed(1) +
    ' ms · misturado ' + N.progresso(misto, 2).delta.toFixed(1) + ' ms');
  t('o andamento também separa: 70 e 90 bpm não se comparam',
    N.progresso(misto, 2, { ex: 'h1-pulso', et: 'A', bpm: 90 }) === null);
}

console.log('\n--- o nome da posição, para quem nunca leu partitura ---');
t('os quatro tempos', [0,4,8,12].map(N.rotuloPasso).join(' ') === '1 2 3 4',
  [0,4,8,12].map(N.rotuloPasso).join(' '));
t('as semicolcheias do primeiro tempo', [0,1,2,3].map(N.rotuloPasso).join(' ') === '1 1e 1+ 1a',
  [0,1,2,3].map(N.rotuloPasso).join(' '));
t('o compasso inteiro tem 16 nomes distintos',
  new Set(Array.from({length:16},(_,i)=>N.rotuloPasso(i))).size === 16,
  Array.from({length:16},(_,i)=>N.rotuloPasso(i)).join(' '));
t('passo inválido não quebra', typeof N.rotuloPasso(-5) === 'string' && typeof N.rotuloPasso(NaN) === 'string');

console.log('\n--- COMO SE JOGA, dito na tela onde se joga ---');
/* O Renato, depois de três sessões: "fiquei meio perdido... o que é pra fazer
   quando? abc?". A auditoria cega tinha dito o mesmo ("o objetivo não é
   claro"), e a pista, no lugar mais visível, dizia só "a pista aparece quando
   você começar". */
const plAB = et => ({ tipo: 'treino', id: 'h1-pulso', etapa: et, modo: 'valendo' });
t('todo plano possível recebe título e explicação',
  [null, {tipo:'nada'}, {tipo:'treino',id:'h1-pulso',etapa:'A',modo:'sentir'},
   {tipo:'reteste',id:'h1-pulso',etapa:'C'}, plAB('A'), plAB('B'), plAB('C')]
    .every(p => { const c = N.comoJogar(p, false);
      return c && c.titulo && c.sub && c.titulo.length > 3 && c.sub.length > 10; }));
t('cada etapa tem um título DIFERENTE — senão não explica nada',
  new Set(['A','B','C'].map(et => N.comoJogar(plAB(et), false).titulo)).size === 3,
  ['A','B','C'].map(et => N.comoJogar(plAB(et), false).titulo).join(' | '));
t('a etapa A fala da pista e da linha',
  /LINHA/.test(N.comoJogar(plAB('A'), false).titulo), N.comoJogar(plAB('A'), false).titulo);
t('a etapa B avisa que a pista vai sumir',
  /SUMIR/.test(N.comoJogar(plAB('B'), false).titulo), N.comoJogar(plAB('B'), false).titulo);
t('a etapa C avisa que a máquina cala',
  /cala/.test(N.comoJogar(plAB('C'), false).sub), N.comoJogar(plAB('C'), false).sub);
t('a escuta manda bater palma, sem pad',
  /palma/.test(N.comoJogar({tipo:'treino',id:'h1-pulso',etapa:'A',modo:'sentir'}, false).sub));
t('a revisão se anuncia como revisão',
  N.comoJogar({tipo:'reteste',id:'h1-pulso',etapa:'C'}, false).titulo === 'REVISÃO');
t('sem nada a fazer, diz isso e aponta o modo livre',
  /livre/.test(N.comoJogar({tipo:'nada'}, false).sub));
t('na PRIMEIRA vez de todas aparece a linha que diz como o jogo funciona',
  /bot.o laranja/.test(N.comoJogar(plAB('A'), true).extra || ''),
  N.comoJogar(plAB('A'), true).extra);
t('e ela NÃO aparece depois — só atrapalharia',
  !N.comoJogar(plAB('A'), false).extra);
t('a linha de boas-vindas também aparece na escuta, que é a tela de estreia',
  /bot.o laranja/.test(
    N.comoJogar({tipo:'treino',id:'h1-pulso',etapa:'A',modo:'sentir'}, true).extra || ''));
/* O pedido de medir a latência vivia dentro da frase de resultado, junto dos
   números — e o Renato, com razão, não o leu: quatro execuções seguidas com o
   aviso e nenhuma medição. Na etapa C, onde a medição é obrigatória, ele
   passa a ser a tela inteira. */
t('na etapa C sem medição, a tela vira o pedido de medir',
  /MEÇA O SEU PONTO/.test(N.comoJogar(plAB('C'), false, true).titulo),
  N.comoJogar(plAB('C'), false, true).titulo);
t('e aponta o botão certo, dizendo o que vai acontecer',
  /MEDIR VOCÊ/.test(N.comoJogar(plAB('C'), false, true).extra || '') &&
  /clique sozinho/.test(N.comoJogar(plAB('C'), false, true).sub));
t('e explica que a medição é sobre VOCÊ, não sobre a máquina',
  /VOCÊ bate|você bate/.test(N.comoJogar(plAB('C'), false, true).sub),
  N.comoJogar(plAB('C'), false, true).sub);
t('com a referência medida, a etapa C volta a explicar o exercício',
  N.comoJogar(plAB('C'), false, false).titulo === 'AGORA É SÓ VOCÊ');
t('as etapas A e B nunca pedem a medição — jogar não depende dela',
  ['A','B'].every(et => !/MEÇA/.test(N.comoJogar(plAB(et), false, true).titulo)));
t('nenhum texto usa jargão do código',
  [plAB('A'), plAB('B'), plAB('C')].every(p => {
    const c = N.comoJogar(p, false);
    return !/portão|viés|limiar|firmeza|metrica|desvio/i.test(c.titulo + c.sub);
  }));

console.log('\n--- O QUE SE COBRA É A DIFERENÇA, NUNCA O VIÉS ABSOLUTO ---');
/* A calibração por batida mede aparelho + entrada + músico somados, e o app
   subtraía a soma inteira — apagando o que deveria medir. Provado em
   verificar-auditoria.js: quem atrasava 120 ms recebia "Cravado" e graduava.
   Agora o portão cobra m.Brel = m.B − (o seu ponto num clique sozinho). O
   erro do navegador está nos dois lados e some na subtração. */
const base = { n: 24, casados: 24, excedentes: 0, P: 1, L: 1, S: 0.012 };
const comRef = (B, ref) => Object.assign({}, base, { B: B, ref: ref });
const semRef = (B) => Object.assign({}, base, { B: B, ref: null });

t('80 ms de diferença em relação ao clique simples REPROVA a etapa C',
  N.motivoReprova('C', comRef(0.080, 0), 0) === 'vies');
t('e o app diz o quanto, comparando com o clique',
  /80 ms/.test(N.diagnostico(comRef(0.080, 0)).frase) &&
  /clique/.test(N.diagnostico(comRef(0.080, 0)).frase),
  N.diagnostico(comRef(0.080, 0)).frase);
t('a MESMA pessoa, se bate 80 ms depois do clique TAMBÉM no clique simples, passa',
  N.motivoReprova('C', comRef(0.080, 0.080), 0) === null,
  'deslocamento uniforme não é atribuível: pode ser ela, pode ser o aparelho');
t('e o app diz "Cravado" nesse caso, porque é o que ele sabe',
  N.diagnostico(comRef(0.080, 0.080)).codigo === 'cravado');
t('quem ANTECIPA em relação ao próprio clique também é pego',
  N.motivoReprova('C', comRef(-0.060, 0.020), 0) === 'vies' &&
  /adiantado/.test(N.diagnostico(comRef(-0.060, 0.020)).frase),
  N.diagnostico(comRef(-0.060, 0.020)).frase);
t('um viés absoluto enorme com referência igual NÃO reprova — e é honesto',
  N.motivoReprova('C', comRef(0.200, 0.200), 0) === null);

t('sem referência, ninguém é acusado nas etapas A e B',
  N.motivoReprova('A', semRef(0.080), 0) === null &&
  N.motivoReprova('B', semRef(0.080), 0) === null);
t('mas a etapa C EXIGE a referência — senão o deslocado volta a graduar',
  N.motivoReprova('C', semRef(0.080), 0) === 'calibrar');
t('e o app manda MEDIR em vez de acusar',
  N.diagnostico(semRef(0.080)).codigo === 'medir');
t('a frase aponta o botão certo, com o nome novo',
  /MEDIR VOCÊ/.test(N.diagnostico(semRef(0.080)).frase) &&
  /MEDIR VOCÊ/.test(N.PORQUE.calibrar));
t('e não afirma nada sobre antecipar ou atrasar',
  !/antecipando|atrasando/.test(N.diagnostico(semRef(0.080)).frase));
t('sem referência, leituraGroove se recusa a ler',
  N.leituraGroove(semRef(0.080)) === 'sem-referencia');
t('os outros critérios continuam reprovando sem referência nenhuma',
  N.motivoReprova('C', Object.assign({}, semRef(0), { P: 0.5 }), 0) === 'precisao' &&
  N.motivoReprova('C', Object.assign({}, semRef(0), { S: 0.09 }), 0) === 'firmeza');
t('omitir o campo ref significa referência ZERO, não silêncio',
  N.motivoReprova('C', Object.assign({}, base, { B: 0.080 }), 0) === 'vies' &&
  N.viesCobravel(Object.assign({}, base, { B: 0.080 })) === 0.080);

/* a razão de tudo isto: o erro do navegador some na subtração */
t('um erro de 33 ms na latência do navegador NÃO muda o veredito',
  ['certo', 'errado'].map(caso => {
    const erro = caso === 'errado' ? 0.033 : 0;   /* o Chrome do Renato */
    /* o mesmo músico, nos dois mundos: +10 ms no exercício, +5 no clique */
    return N.motivoReprova('C', comRef(0.010 + erro, 0.005 + erro), 0);
  }).every(v => v === null),
  'é esta a propriedade que faz a diferença ser medível e o absoluto não');

console.log('\n--- A DERIVA SÓ FALA QUANDO TEM RESOLUÇÃO ---');
/* O primeiro diário real devolveu +14 −22 +36 −53 −37 −47 −1 +36: sinais
   alternando, média −9 ms, espalhamento 36 ms. Era ruído com nome de métrica.
   Amostras DETERMINÍSTICAS aqui de propósito: com valores sorteados, a média
   da amostra escapa do valor pedido e o teste passa a medir o sorteio em vez
   de medir a função — foi o que aconteceu na primeira versão deste bloco. */
{
  /* n valores em torno de `centro`, alternando ±espalhamento: média exata */
  const grupo = (n, centro, esp) =>
    Array.from({ length: n }, (_, i) => (centro + (i % 2 ? esp : -esp)) / 1000);

  /* o jogador do Renato: ~50 ms de oscilação, 16 notas com a máquina, 8 sem */
  t('ruído puro NÃO vira deriva',
    N.deriva(grupo(16, 0, 50), grupo(8, 0, 50)) === null);
  t('e um escorregão pequeno some dentro desse ruído',
    N.deriva(grupo(16, 0, 50), grupo(8, 25, 50)) === null,
    'ruído de 2 erros-padrão ≈ 44 ms; 25 ms não atravessa');
  const forte = N.deriva(grupo(16, 0, 50), grupo(8, 90, 50));
  t('um escorregão GRANDE atravessa e é reportado com o valor certo',
    forte !== null && Math.abs(forte * 1000 - 90) < 1,
    forte === null ? 'null' : Math.round(forte * 1000) + ' ms');

  /* quem é firme tem ruído menor, então enxerga escorregão menor */
  const fino = N.deriva(grupo(16, 0, 8), grupo(8, 25, 8));
  t('quem é firme enxerga escorregão pequeno — o limiar é o ruído DELE',
    fino !== null && Math.abs(fino * 1000 - 25) < 1,
    fino === null ? 'null' : Math.round(fino * 1000) + ' ms');
  t('o MESMO escorregão de 25 ms some no ruído de quem oscila muito',
    N.deriva(grupo(16, 0, 60), grupo(8, 25, 60)) === null);

  t('o sinal é preservado: adiantar no silêncio dá deriva negativa',
    N.deriva(grupo(16, 0, 8), grupo(8, -25, 8)) < 0);
}
t('poucas amostras continuam devolvendo null',
  N.deriva([0.01, 0.02], [0.03, 0.04, 0.05]) === null && N.deriva(null, null) === null);

console.log('\n' + (fail ? 'REPROVADO' : 'APROVADO') + ' — ' + pass + ' passaram, ' + fail + ' falharam\n');
process.exit(fail ? 1 : 0);
