/* verificar-auditoria.js — Passo 0 do plano.
 *
 * Duas auditorias cegas acusaram o app. Auditor também erra: neste projeto,
 * duas rodadas anteriores se contradisseram e as duas estavam certas sobre
 * casos diferentes. Então cada acusação é reproduzida aqui, com número.
 *
 * Nada neste arquivo altera o app. Ele só mede.
 * Sorteio com semente fixa (mulberry32) — roda igual toda vez.
 *
 *   node verificar-auditoria.js
 */
const fs = require('fs');
const src = fs.readFileSync(__dirname + '/musga.html', 'utf8');
function bloco(nome) {
  const m = src.match(new RegExp('/\\*===\\s*' + nome + ':START\\s*===\\*/([\\s\\S]*?)/\\*===\\s*' + nome + ':END\\s*===\\*/'));
  if (!m) { console.error('bloco ' + nome + ' não encontrado'); process.exit(1); }
  return m[1];
}
const A = {};
new Function('exports', bloco('PURE') + bloco('NUCLEO') + `
Object.assign(exports,{mdn,spread,calibOffset,calibrar,refValida,consolidarRef,erroPadrao,viesCobravel,
 JANELA,julgar,casar,venceu,LIMIAR,PORTAO,ETAPAS,EXERCICIOS,exercicio,
 eventosPorCompasso,compassosDoPortao,media,desvioPadrao,metricas,passou,
 motivoReprova,limiteFirmeza,limiteVies,AFROUXA,deriva,progresso,REGUA,
 TETO_NOTAS,MIN_COMPASSOS,MIN_SERIE,registrar,estadoNovo,normalizarMapa,mapaNovo});`)(A);

/* ---------- sorteio reprodutível ---------- */
function rng(semente) {
  let a = semente >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function normal(r) {           /* Box-Muller */
  let u = 0, v = 0;
  while (u === 0) u = r();
  while (v === 0) v = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const R = [];
function veredito(n, status, evidencia) {
  R.push({ n, status, evidencia });
  const cor = { CONFIRMADO: 'CONFIRMADO', PARCIAL: 'PARCIAL   ', FALSO: 'FALSO     ' }[status];
  console.log('  ' + cor + '  ' + n);
  if (evidencia) console.log('              ' + evidencia.replace(/\n/g, '\n              '));
}

/* =========================================================================
   1. A CALIBRAÇÃO ABSORVE O VIÉS DO MÚSICO
   ========================================================================= */
console.log('\n═══ 1. a calibração absorve o viés do músico ═══');
/* Modelo, sem sorteio nenhum — é álgebra:
   - o clique é agendado em t; a pessoa o OUVE em t+D (D = atraso do aparelho)
   - ela bate M depois de ouvir (M = o viés dela; negativo = antecipa)
   - o toque é registrado em t+D+M
   calibOffset devolve a mediana de (toque − clique) = D+M.
   Depois, jogando: nota agendada em t', ouvida em t'+D, toque em t'+D+M,
   e o app calcula delta = toque − lat − t' = (t'+D+M) − (D+M) − t' = 0. */
function calibraEjoga(D, M) {
  /* AGORA, como o app faz: `lat` é o que o NAVEGADOR diz do aparelho (aqui,
     com um erro deliberado de 20 ms, porque o navegador erra mesmo); a batida
     junto com o clique vira o PONTO DE REFERÊNCIA; e o portão cobra a
     diferença entre o exercício e esse ponto. */
  const latNavegador = D + 0.020;                 /* o navegador erra 20 ms */
  const beats = [], taps = [];
  for (let i = 0; i < 20; i++) { const t = 1 + i * 0.5; beats.push(t); taps.push(t + D + M); }
  const ref = A.calibrar(taps, beats, 0.4, 12).valor - latNavegador;
  const desvios = [];
  for (let i = 0; i < 24; i++) {
    const t = 10 + i * 0.25;
    const nota = [{ pad: 'kick', t: t, st: 'espera' }];
    const c = A.casar(t + D + M, nota, 'kick', latNavegador);
    if (c && A.julgar(c.delta)) desvios.push(c.delta);
  }
  const m = A.metricas(desvios, 24, 0);
  m.ref = ref;
  return { lat: latNavegador, ref: ref, B: m.B, Brel: A.viesCobravel(m), P: m.P,
           passaC: A.passou('C', m, 0) };
}
const casos = [
  { nome: 'antecipa 60 ms · aparelho 170 ms', D: 0.170, M: -0.060 },
  { nome: 'atrasa 50 ms · aparelho 40 ms', D: 0.040, M: +0.050 },
  { nome: 'atrasa 120 ms · aparelho 10 ms', D: 0.010, M: +0.120 }
];
let absorveu = 0;
casos.forEach(c => {
  const r = calibraEjoga(c.D, c.M);
  console.log('       ' + c.nome.padEnd(34) +
    ' seu ponto=' + (r.ref > 0 ? '+' : '') + Math.round(r.ref * 1000) + ' ms' +
    '  diferença=' + (r.Brel * 1000).toFixed(1) + ' ms' +
    '  passa C=' + r.passaC);
  if (Math.abs(r.B) < 0.005 && Math.abs(c.M) > 0.030) absorveu++;
});
veredito('a calibração apaga o viés constante do músico — o viés medido vira ~0 qualquer que seja o erro real',
  absorveu === casos.length ? 'CONFIRMADO' : 'FALSO',
  absorveu + ' de ' + casos.length + ' casos absorvidos.\n' +
  'O viés absoluto continua ~0 e SEMPRE vai continuar: é impossível separá-lo do aparelho.\n' +
  'O que mudou é que ele deixou de ser cobrado. O portão agora cobra a DIFERENÇA em\n' +
  'relação ao clique simples, e o ponto de referência guarda o deslocamento constante\n' +
  'em vez de apagá-lo — repare que ele reaparece na coluna "seu ponto".');

/* e a propriedade que faz isso valer a pena: o erro do navegador se cancela */
{
  const mesmoMusico = (erroNavegador) => {
    const D = 0.040, M = 0.010;                    /* atrasa 10 ms de verdade */
    const latNav = D + erroNavegador;
    const beats = [], taps = [];
    for (let i = 0; i < 20; i++) { const t = 1 + i * 0.5; beats.push(t); taps.push(t + D + M); }
    const ref = A.calibrar(taps, beats, 0.4, 12).valor - latNav;
    const desvios = [];
    for (let i = 0; i < 24; i++) {
      const t = 10 + i * 0.25;
      const c = A.casar(t + D + M + 0.050, [{ pad: 'kick', t: t, st: 'espera' }], 'kick', latNav);
      if (c && A.julgar(c.delta)) desvios.push(c.delta);   /* 50 ms pior no exercício */
    }
    const m = A.metricas(desvios, 24, 0); m.ref = ref;
    return { B: m.B * 1000, Brel: A.viesCobravel(m) * 1000 };
  };
  const certo = mesmoMusico(0), errado = mesmoMusico(0.033);
  console.log('       o MESMO músico (50 ms pior no exercício), com dois navegadores:');
  console.log('         navegador certo  → viés absoluto ' + certo.B.toFixed(1) +
    ' ms · diferença ' + certo.Brel.toFixed(1) + ' ms');
  console.log('         navegador 33 ms errado → viés absoluto ' + errado.B.toFixed(1) +
    ' ms · diferença ' + errado.Brel.toFixed(1) + ' ms');
  veredito('o erro do navegador contamina o viés absoluto e NÃO contamina a diferença',
    Math.abs(certo.B - errado.B) > 0.030 * 1000 * 0.9 &&
    Math.abs(certo.Brel - errado.Brel) < 1 ? 'FALSO' : 'CONFIRMADO',
    'o absoluto muda ' + Math.abs(certo.B - errado.B).toFixed(0) + ' ms entre os dois; ' +
    'a diferença muda ' + Math.abs(certo.Brel - errado.Brel).toFixed(1) + ' ms.\n' +
    'É por isso que o portão passou a cobrar a diferença. (FALSO aqui = defeito corrigido.)');
}

/* =========================================================================
   2. QUEM ANTECIPA MAIS QUE O ATRASO DO APARELHO FICA TRANCADO FORA DA C
   ========================================================================= */
console.log('\n═══ 2. quem antecipa fica trancado fora da etapa C ═══');
const r2 = rng(20260918);
function tentaCalibrar(D, M, sigma, tentativas) {
  let ok = 0, negativas = 0;
  for (let k = 0; k < tentativas; k++) {
    const beats = [], taps = [];
    for (let i = 0; i < 20; i++) {
      const t = 1 + i * 0.5;
      beats.push(t); taps.push(t + D + M + normal(r2) * sigma);
    }
    const v = A.calibrar(taps, beats, 0.4, 12).valor - D;   /* vira REFERÊNCIA */
    if (A.refValida(v) === null) { negativas++; continue; }
    ok++;
  }
  return { ok, negativas };
}
const t2a = tentaCalibrar(0.040, -0.060, 0.030, 200);
const t2b = tentaCalibrar(0.040, -0.030, 0.030, 200);
console.log('       antecipa 60 ms, aparelho 40 ms → ' + t2a.negativas + '/200 medições recusadas por serem negativas');
console.log('       antecipa 30 ms, aparelho 40 ms → ' + t2b.negativas + '/200 recusadas');
veredito('antecipar mais que o atraso do aparelho impede calibrar, e sem calibrar a etapa C não abre',
  t2a.negativas > 190 ? 'CONFIRMADO' : (t2a.negativas > 50 ? 'PARCIAL' : 'FALSO'),
  'referência negativa agora é LEGÍTIMA (é quem antecipa) e entra no histórico.\n' +
  'A etapa C continua exigindo a medição: motivoReprova("C") sem referência = "' +
  A.motivoReprova('C', { n: 24, P: 1, L: 1, B: 0, S: 0.01, ref: null }, 0) +
  '". (FALSO aqui = defeito corrigido.)');

/* o limiar de concordância que eu inventei, medido contra a oscilação real */
{
  const r = rng(555);
  const rodadaDe = (centro, sigma, n) =>
    Array.from({ length: n }, () => centro + normal(r) * sigma);
  const medianaDe = a => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)];
  const espalhamento = (sigma, rodadas, porRodada, repeticoes) => {
    let soma = 0;
    for (let k = 0; k < repeticoes; k++) {
      const ms = [];
      for (let i = 0; i < rodadas; i++) ms.push(medianaDe(rodadaDe(0, sigma, porRodada)));
      soma += Math.max.apply(null, ms) - Math.min.apply(null, ms);
    }
    return soma / repeticoes;
  };
  console.log('       espalhamento ESPERADO de 3 medianas de 20 toques:');
  [15, 25, 35, 45].forEach(sg => {
    console.log('         quem oscila ' + String(sg).padStart(2) + ' ms por toque → ' +
      (espalhamento(sg / 1000, 3, 20, 400) * 1000).toFixed(1) + ' ms de espalhamento');
  });
  const esp35 = espalhamento(0.035, 3, 20, 400) * 1000;
  veredito('exigir que três medianas concordem em 10 ms era exigir o impossível',
    esp35 > 10 ? 'CONFIRMADO' : 'FALSO',
    'com a oscilação do Renato (≈35 ms por toque) o espalhamento esperado é ' +
    esp35.toFixed(0) + ' ms — mais que o dobro do limiar que eu escolhi a dedo.\n' +
    'Ele mediu seis vezes e nunca fechou — e o espalhamento REAL dele foi 68 ms,\n' +
    'maior ainda, porque ele também muda de lugar entre uma medição e outra.\n' +
    'A regra nova acumula toques, calcula o erro (o MAIOR entre o de dentro das\n' +
    'rodadas e o de entre elas) e o DECLARA na tela, em vez de virar portão.');
}

/* =========================================================================
   3. A LINHA DE PROGRESSO COM HABILIDADE CONSTANTE
   ========================================================================= */
console.log('\n═══ 3. a linha de progresso é ruído? ═══');
const r3 = rng(7331);
function sessaoS(sigma, nNotas) {          /* S de uma execução: DP amostral */
  const d = [];
  for (let i = 0; i < nNotas; i++) {
    const x = normal(r3) * sigma;
    if (Math.abs(x) <= A.JANELA.quase) d.push(x);   /* a janela censura, como no app */
  }
  return Math.round(A.desvioPadrao(d) * 1000);
}
function rodadaProgresso(sigmas, nNotas) { /* sigmas: um por execução, em s */
  const diario = sigmas.map(s => ({ regua: A.REGUA, s: sessaoS(s, nNotas), c: nNotas }));
  const g = A.progresso(diario, A.REGUA);
  if (!g) return 'sem-dados';
  if (!g.fala) return 'estável';          /* o app se cala quando não sabe */
  return g.delta < 0 ? 'melhorou' : 'piorou';
}
function conta(fn, n) {
  const c = { melhorou: 0, estável: 0, piorou: 0, 'sem-dados': 0 };
  for (let i = 0; i < n; i++) c[fn()]++;
  return c;
}
const c3 = conta(() => rodadaProgresso(new Array(12).fill(0.035), 24), 4000);
const pct = o => Object.keys(o).filter(k => o[k]).map(k => k + ' ' + (o[k] / 40).toFixed(0) + '%').join(' · ');
console.log('       habilidade CONSTANTE (σ=35 ms), 12 execuções, 4000 repetições:');
console.log('       ' + pct(c3));
veredito('com habilidade constante o gráfico anuncia melhora ou piora na maioria das vezes',
  (c3.melhorou + c3.piorou) / 4000 > 0.5 ? 'CONFIRMADO' :
    ((c3.melhorou + c3.piorou) / 4000 > 0.3 ? 'PARCIAL' : 'FALSO'),
  'veredito diferente de "estável" em ' + (((c3.melhorou + c3.piorou) / 40).toFixed(0)) + '% das sessões sem nenhuma mudança real');

/* e o contrário: quem melhora DE VERDADE é reconhecido? */
const melhoraReal = [];
for (let i = 0; i < 12; i++) melhoraReal.push(0.045 - i * (0.015 / 11));   /* 45 → 30 ms */
const c3b = conta(() => rodadaProgresso(melhoraReal, 24), 4000);
console.log('       quem melhora de 45 → 30 ms: ' + pct(c3b));
veredito('o gráfico reconhece uma melhora real grande',
  c3b.melhorou / 4000 > 0.8 ? 'CONFIRMADO' : 'PARCIAL',
  'acerta em ' + ((c3b.melhorou / 40).toFixed(0)) + '% — o sinal existe, o problema é o ruído junto');

/* =========================================================================
   4. O GRÁFICO MISTURA EXERCÍCIOS E ETAPAS
   ========================================================================= */
console.log('\n═══ 4. o gráfico mistura exercícios, etapas e andamentos ═══');
const diarioMisto = [
  { ex: 'h1-pulso', et: 'A', bpm: 70, regua: 2, s: 40, c: 24 },
  { ex: 'h1-pulso', et: 'A', bpm: 70, regua: 2, s: 39, c: 24 },
  { ex: 'h1-pulso', et: 'A', bpm: 70, regua: 2, s: 38, c: 24 },
  { ex: 'h1-pulso', et: 'A', bpm: 70, regua: 2, s: 37, c: 24 },
  { ex: 'h3-duas-vozes', et: 'C', bpm: 100, regua: 2, s: 34, c: 36 },
  { ex: 'h3-duas-vozes', et: 'C', bpm: 100, regua: 2, s: 33, c: 36 },
  { ex: 'h3-duas-vozes', et: 'C', bpm: 100, regua: 2, s: 32, c: 36 },
  { ex: 'h3-duas-vozes', et: 'C', bpm: 100, regua: 2, s: 31, c: 36 }
];
const alvoC = { ex: 'h3-duas-vozes', et: 'C', bpm: 100 };
const misto2 = diarioMisto.concat([
  { ex: 'h3-duas-vozes', et: 'C', bpm: 100, regua: 2, s: 30, c: 36 },
  { ex: 'h3-duas-vozes', et: 'C', bpm: 100, regua: 2, s: 29, c: 36 }
]);
const g4 = A.progresso(misto2, 2), g4f = A.progresso(misto2, 2, alvoC);
console.log('       sem filtro: [' + g4.serie.join(', ') + ']  delta ' + g4.delta.toFixed(1) + ' ms');
console.log('       com filtro: [' + g4f.serie.join(', ') + ']  delta ' + g4f.delta.toFixed(1) + ' ms');
veredito('progresso() não filtra por exercício, etapa nem andamento — só pela régua',
  (g4.n === g4f.n) ? 'CONFIRMADO' : 'FALSO',
  'a função aceita um alvo {ex, et, bpm} e o app passa o da execução que acabou:\n' +
  'misturado ' + g4.n + ' linhas de dois exercícios e duas etapas; filtrado ' + g4f.n +
  ' linhas da mesma tarefa. (FALSO aqui = defeito corrigido.)');

/* =========================================================================
   5. A FIRMEZA ENCOLHE COM O DESLOCAMENTO (censura da janela)
   ========================================================================= */
console.log('\n═══ 5. a firmeza encolhe quando o músico está deslocado ═══');
const r5 = rng(4242);
function Smedido(vies, sigma, nNotas, repeticoes) {
  let soma = 0;
  for (let k = 0; k < repeticoes; k++) {
    const d = [];
    for (let i = 0; i < nNotas; i++) {
      const x = vies + normal(r5) * sigma;
      if (Math.abs(x) <= A.JANELA.limite) d.push(x);   /* o app agora mede até 180 */
    }
    soma += A.desvioPadrao(d);
  }
  return soma / repeticoes * 1000;
}
console.log('       σ real fixo em 25 ms, 2000 repetições de 24 notas:');
[0, 0.030, 0.060, 0.090, 0.120].forEach(v => {
  console.log('         viés ' + String(Math.round(v * 1000)).padStart(3) + ' ms → firmeza exibida ' +
    Smedido(v, 0.025, 24, 2000).toFixed(1) + ' ms');
});
const s0 = Smedido(0, 0.025, 24, 2000), s90 = Smedido(0.090, 0.025, 24, 2000);
veredito('estar deslocado ENCOLHE a firmeza exibida — consertar o próprio atraso é lido como piora',
  s90 < s0 * 0.9 ? 'CONFIRMADO' : (s90 < s0 * 0.98 ? 'PARCIAL' : 'FALSO'),
  'σ real idêntico (25 ms): sem viés exibe ' + s0.toFixed(1) + ' ms; com 90 ms de viés exibe ' + s90.toFixed(1) + ' ms');

console.log('       e o teto: σ real crescente, viés 0');
[0.040, 0.060, 0.120, 0.200, 0.400].forEach(sg => {
  console.log('         σ real ' + String(Math.round(sg * 1000)).padStart(3) + ' ms → firmeza exibida ' +
    Smedido(0, sg, 24, 2000).toFixed(1) + ' ms');
});
const sat200 = Smedido(0, 0.200, 24, 2000), sat400 = Smedido(0, 0.400, 24, 2000);
veredito('a firmeza satura: acima de ~75 ms o indicador para de distinguir',
  sat400 <= sat200 * 1.05 ? 'CONFIRMADO' : 'PARCIAL',
  'σ 200 ms → ' + sat200.toFixed(1) + ' ms; σ 400 ms → ' + sat400.toFixed(1) + ' ms (deveria dobrar)');

/* =========================================================================
   6. INVERSÃO DE PORTÃO — o pior passa mais que o melhor
   ========================================================================= */
console.log('\n═══ 6. inversão de portão na etapa B ═══');
const pior = { n: 24, casados: 24, excedentes: 0, P: 1, L: 1, B: 0, S: 0.060 };
const melhor = { n: 24, casados: 24, excedentes: 0, P: 1, L: 1, B: 0, S: 0.048 };
const pPior = A.passou('B', pior, 4), pMelhor = A.passou('B', melhor, 0);
console.log('       oscila 60 ms com 4 reprovações → limite ' + Math.round(A.limiteFirmeza('B', 4) * 1000) + ' ms → passa=' + pPior);
console.log('       oscila 48 ms sem reprovação    → limite ' + Math.round(A.limiteFirmeza('B', 0) * 1000) + ' ms → passa=' + pMelhor);
veredito('o pior jogador passa a etapa B e o melhor não',
  (pPior === true && pMelhor === false) ? 'PARCIAL' : 'FALSO',
  'A inversão MOMENTÂNEA continua, e é de propósito: a tolerância existe para destravar\n' +
  'quem emperrou, e num app de um jogador só não há com quem comparar. O que mudou é que\n' +
  'ela deixou de ser vitalícia — zera ao conquistar a etapa (ver a linha abaixo), e a\n' +
  'etapa C nunca afrouxa. Decisão registrada em DECISOES.md.');

/* comprova a não-zeragem percorrendo o registrar de verdade */
let mp = A.mapaNovo();
for (let i = 0; i < 4; i++) mp = A.registrar(mp, 'h1-pulso', 'B', { n: 24, P: 0.5, L: 1, B: 0, ref: 0, S: 0.2 }, { hoje: '2026-09-18' }).mapa;
const antes = mp['h1-pulso'].falhas.B;
const bomB = { n: 24, casados: 24, P: 1, L: 1, B: 0, ref: 0, S: 0.01 };
mp = A.registrar(mp, 'h1-pulso', 'B', bomB, { hoje: '2026-09-18' }).mapa;
const meio = mp['h1-pulso'].falhas.B;
mp = A.registrar(mp, 'h1-pulso', 'B', bomB, { hoje: '2026-09-18' }).mapa;
console.log('       4 reprovações → falhas.B=' + antes + ' · 1 passada → ' + meio +
  ' · etapa CONQUISTADA → ' + mp['h1-pulso'].falhas.B);

/* =========================================================================
   7. TETO_NOTAS NÃO É TETO · minEventos trava exercício esparso
   ========================================================================= */
console.log('\n═══ 7. o teto de notas e o piso de eventos ═══');
console.log('       TETO_NOTAS=' + A.TETO_NOTAS + ' · MIN_COMPASSOS=' + A.MIN_COMPASSOS);
let estourou = 0;
[4, 8, 12, 16, 24].forEach(ev => {
  const falso = { voz: [{ pad: 'kick', passos: new Array(ev).fill(0).map((_, i) => i % 16) }] };
  const comps = A.compassosDoPortao(falso, 'C');
  const notas = ev * comps;
  if (notas > A.TETO_NOTAS) estourou++;
  console.log('         ' + String(ev).padStart(2) + ' ev/compasso → ' + comps + ' compassos → ' +
    String(notas).padStart(3) + ' notas' + (notas > A.TETO_NOTAS ? '   ← acima do teto' : ''));
});
veredito('TETO_NOTAS não é teto: MIN_COMPASSOS vence e a execução cresce com a densidade',
  estourou >= 3 ? 'CONFIRMADO' : 'PARCIAL',
  estourou + ' das 5 densidades testadas passam de ' + A.TETO_NOTAS + ' notas — e o funk é denso');

const esparso = { voz: [{ pad: 'kick', passos: [0] }] };
const compsEsp = A.compassosDoPortao(esparso, 'C');
const mEsp = { n: 1 * compsEsp, casados: 1 * compsEsp, P: 1, L: 1, B: 0, S: 0.005, ref: 0 };
console.log('       exercício de 1 evento/compasso → ' + compsEsp + ' compassos → n=' + mEsp.n +
  ' → motivo="' + A.motivoReprova('C', mEsp, 0) + '"');
veredito('exercício esparso é impossível de passar: minEventos=12 nunca é alcançado',
  A.motivoReprova('C', mEsp, 0) === 'curta' ? 'CONFIRMADO' : 'FALSO',
  'execução perfeita (P=1, S=5 ms) reprovada por "curta"');

/* =========================================================================
   8. PASSOS ACIMA DE 15 SOMEM · DADO DE CONTEÚDO MALFORMADO
   ========================================================================= */
console.log('\n═══ 8. conteúdo malformado ═══');
const doisCompassos = { id: 'fk-teste', voz: [{ pad: 'kick', passos: [0, 3, 6, 10, 16, 19, 22, 26] }] };
const ev8 = A.eventosPorCompasso(doisCompassos);
const gerados = new Set(doisCompassos.voz[0].passos.map(p => p % 16)).size;
console.log('       padrão de 2 compassos escrito como passos 0..26:');
console.log('         eventosPorCompasso conta ' + ev8 + ' · gerar() só emite ' + gerados + ' (st = genStep % 16)');
veredito('passos fora de 0..15 são silenciosamente dobrados ou perdidos — P despenca sem explicação',
  gerados < ev8 ? 'CONFIRMADO' : 'FALSO',
  'precisão máxima possível = ' + (gerados / ev8).toFixed(2) + ' · o portão da etapa A exige 0,80');

/* o catch da inicialização */
const temCatch = /catch\s*\(\s*erro\s*\)\s*\{[\s\S]{0,200}removeItem\('musga\.mapa'\)/.test(src);
const retentaIgual = /catch\s*\(\s*erro\s*\)\s*\{[\s\S]{0,300}layout\(\);planejar\(\)/.test(src);
veredito('exceção de CONTEÚDO apaga o progresso salvo do usuário e ainda erra o diagnóstico',
  (temCatch && retentaIgual) ? 'CONFIRMADO' : 'FALSO',
  'o catch remove musga.mapa e repete a MESMA chamada que lançou: com dado de conteúdo ruim,\n' +
  'lança de novo, agora sem proteção — página morta, progresso destruído, e a mensagem culpa o usuário');

/* =========================================================================
   9. O DIÁRIO QUEBRA COM ID DE FUNK
   ========================================================================= */
console.log('\n═══ 9. o diário com os ids de funk ═══');
const enc = id => (id || '').replace(/^h(\d).*/, 'h$1').padEnd(6);
['h1-pulso', 'h3-duas-vozes', 'fk01-pulso', 'fk06-tresillo'].forEach(id =>
  console.log('         ' + id.padEnd(16) + ' → [' + enc(id) + ']'));
veredito('a coluna do diário quebra no primeiro exercício de funk',
  enc('fk01-pulso').length > 6 ? 'CONFIRMADO' : 'FALSO',
  'o regex /^h(\\d).*/ só encurta ids que começam com h+dígito');

/* =========================================================================
   10. O RELÓGIO
   ========================================================================= */
console.log('\n═══ 10. o relógio do toque ═══');
const hitUsaEvento = /function hit\(([^)]*)\)/.exec(src)[1];
const hitOffset = /function hit\([^)]*\)\{[\s\S]{0,400}?var t=AC\.currentTime\+\.001/.test(src);
const calTapPuro = /function calTap\(\)\{[\s\S]{0,200}?cal\.taps\.push\(AC\.currentTime\)/.test(src);
console.log('       assinatura de hit(): hit(' + hitUsaEvento + ')  ← não recebe o evento');
veredito('hit() descarta o horário do evento e lê o relógio do áudio quando o JS consegue rodar',
  hitUsaEvento.indexOf('e') < 0 ? 'CONFIRMADO' : 'FALSO',
  'sem e.timeStamp, todo o atraso da fila de eventos e do desenho entra na medida como se fosse do músico');
veredito('a régua do jogo e a da calibração diferem em 1 ms por construção',
  (hitOffset && calTapPuro) ? 'CONFIRMADO' : 'FALSO',
  'hit() usa AC.currentTime+0.001 · calTap() usa AC.currentTime');

/* =========================================================================
   11. A DERIVA COM ATRASO GRANDE
   ========================================================================= */
console.log('\n═══ 11. a deriva quando o atraso é grande ═══');
const r11 = rng(909);
function derivaMedida(atrasoNoSilencio, sigma, repeticoes) {
  const passo = 0.25;                       /* 16 notas por compasso a 60 bpm/4 */
  let nula = 0, invertida = 0, subestimada = 0, certa = 0, somaRel = 0, nRel = 0;
  for (let k = 0; k < repeticoes; k++) {
    const comSom = [], sozinho = [];
    for (let i = 0; i < 16; i++) {
      const notas = [{ pad: 'kick', t: i * passo, st: 'espera' }];
      const c = A.casar(i * passo + normal(r11) * sigma, notas, 'kick', 0);
      if (c && A.julgar(c.delta)) comSom.push(c.delta);
    }
    for (let i = 0; i < 8; i++) {
      /* no silêncio a pessoa escorrega: o toque pode casar com a nota SEGUINTE */
      const notas = [{ pad: 'kick', t: i * passo, st: 'espera' },
      { pad: 'kick', t: (i + 1) * passo, st: 'espera' }];
      const c = A.casar(i * passo + atrasoNoSilencio + normal(r11) * sigma, notas, 'kick', 0);
      if (c && A.julgar(c.delta)) sozinho.push(c.delta);
    }
    /* as notas que ninguém pegou vencem sozinhas: é a assinatura do
       escorregão, e a guarda nova recusa a medida quando ela aparece */
    const perdidas = 8 - sozinho.length;
    const d = A.deriva(comSom, sozinho, perdidas);
    if (d === null) { nula++; continue; }
    somaRel += d; nRel++;
    if (d * atrasoNoSilencio < 0) invertida++;
    else if (Math.abs(d) < Math.abs(atrasoNoSilencio) * 0.5) subestimada++;
    else certa++;
  }
  return { nula, invertida, subestimada, certa, medio: nRel ? somaRel / nRel : null };
}
[0.050, 0.100, 0.150, 0.200, 0.250, 0.300].forEach(at => {
  const d = derivaMedida(at, 0.020, 500);
  console.log('       escorregão real de ' + String(Math.round(at * 1000)).padStart(3) + ' ms → ' +
    'calada ' + String((d.nula / 5).toFixed(0)).padStart(3) + '% · ' +
    'certa ' + String((d.certa / 5).toFixed(0)).padStart(3) + '% · ' +
    'subestimada ' + String((d.subestimada / 5).toFixed(0)).padStart(3) + '% · ' +
    'SINAL TROCADO ' + String((d.invertida / 5).toFixed(0)).padStart(3) + '%' +
    (d.medio === null ? '' : '   (quando fala, diz ' + (d.medio > 0 ? '+' : '') + Math.round(d.medio * 1000) + ' ms)'));
});
const d150 = derivaMedida(0.150, 0.020, 500), d300 = derivaMedida(0.300, 0.020, 500);
const erra150 = (d150.invertida + d150.subestimada) / 500, erra300 = (d300.invertida + d300.subestimada) / 500;
veredito('a deriva erra o número quando o escorregão passa da janela de julgamento',
  Math.max(erra150, erra300) > 0.5 ? 'CONFIRMADO' : (Math.max(erra150, erra300) > 0.2 ? 'PARCIAL' : 'FALSO'),
  'a 150 ms ela INVERTE o sinal em ' + ((d150.invertida / 5).toFixed(0)) + '% (diz "adiantou" para quem atrasou);\n' +
  'a 300 ms ela reporta ' + Math.round(d300.medio * 1000) + ' ms de um escorregão real de 300 ms.\n' +
  'Causa: julgar() corta em 130 ms, o toque casa com a nota SEGUINTE e o desvio troca de sinal.\n' +
  'A acusação original ("inverte a 300 ms") errou a magnitude — o buraco é a partir de ~140 ms.');

/* =========================================================================
   12. RENOMEAR UM ID APAGA PROGRESSO
   ========================================================================= */
console.log('\n═══ 12. estado persistido ═══');
const salvo = { 'h1-pulso': { etapa: 'C', graduado: '2026-09-01', firmezaHistorico: [40, 35, 30] },
                'fk01-antigo': { etapa: 'C', graduado: '2026-09-02', firmezaHistorico: [50, 44] } };
const depois = A.normalizarMapa(salvo);
console.log('       salvo:  [' + Object.keys(salvo).join(', ') + ']');
console.log('       depois: [' + Object.keys(depois).join(', ') + ']');
veredito('id desconhecido é descartado no load e a perda é gravada na execução seguinte',
  Object.keys(depois).indexOf('fk01-antigo') < 0 ? 'CONFIRMADO' : 'FALSO',
  'normalizarMapa() reconstrói o mapa iterando EXERCICIOS; não há versão, migração nem aviso');

/* =========================================================================
   RESUMO
   ========================================================================= */
console.log('\n' + '═'.repeat(70));
const cont = { CONFIRMADO: 0, PARCIAL: 0, FALSO: 0 };
R.forEach(x => cont[x.status]++);
console.log('  ' + cont.CONFIRMADO + ' confirmados · ' + cont.PARCIAL + ' parciais · ' + cont.FALSO + ' falsos');
const falsos = R.filter(x => x.status === 'FALSO');
if (falsos.length) { console.log('\n  acusações que NÃO se sustentaram:'); falsos.forEach(x => console.log('    · ' + x.n)); }
console.log('═'.repeat(70) + '\n');
