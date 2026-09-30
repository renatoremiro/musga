/* prova-calib.js — prova NO NAVEGADOR que a medição mede o que diz medir.
 *
 * A HISTÓRIA DESTE ARQUIVO, em três atos:
 *   1) o app aceitava latência negativa e o diário do Renato trouxe −101 ms;
 *   2) corrigido o sinal, recusar o negativo TRANCOU fora da etapa C quem
 *      antecipa — 199 de 200 medições rejeitadas;
 *   3) a auditoria cega mostrou a raiz: a batida junto com o clique mede
 *      aparelho + entrada + músico somados, e o app subtraía a soma inteira.
 *      Quem atrasava 120 ms recebia "Cravado" e graduava.
 *
 * Agora: o atraso do APARELHO vem do navegador e é o que se subtrai; a batida
 * mede O SEU PONTO DE REFERÊNCIA; e o portão cobra a diferença entre os dois.
 *
 *   node prova-calib.js
 */
const { chromium } = require('playwright');
const path = require('path');

const URL = 'file://' + path.join(__dirname, 'musga.html');
let pass = 0, fail = 0;
const t = (n, c, x) => { c ? (pass++, console.log('  ok   ' + n))
                           : (fail++, console.log('  FALHA ' + n + (x !== undefined ? '  → ' + x : ''))); };

/* Uma medição inteira com o robô batendo a `desvioMs` de cada clique.
   Negativo = batendo ANTES do clique, que é o que o Renato fez. */
async function mede(page, desvioMs) {
  await page.evaluate(() => { document.getElementById('bCalib').click(); });
  await page.waitForFunction(() => window.cal && window.cal.on === true, { timeout: 8000 });
  await page.evaluate(async (off) => {
    const espera = ms => new Promise(r => setTimeout(r, ms));
    const feitos = new Set();
    while (window.cal.on) {
      const agora = window.AC.currentTime;
      window.cal.beats.forEach(b => {
        if (!feitos.has(b) && agora >= b + off) { feitos.add(b); window.calTap(); }
      });
      await espera(4);
    }
  }, desvioMs / 1000);
  await page.waitForFunction(() => window.cal.on === false, { timeout: 5000 });
  await page.waitForTimeout(150);
  return page.evaluate(() => ({
    lat: window.lat, latFonte: window.latFonte,
    ref: window.viesRef, refFonte: window.refFonte, temRef: window.temReferencia(),
    hist: window.cal.hist.slice(), toques: window.cal.toques.length,
    erro: window.erroRef,
    msg: (document.getElementById('scrMsg') || {}).textContent || '',
    rotulo: (document.getElementById('scrLat') || {}).textContent || '',
    salvoRef: localStorage.getItem('musga.ref'),
    salvoLat: localStorage.getItem('musga.lat'),
    pulsa: document.getElementById('bCalib').classList.contains('pulse')
  }));
}

(async () => {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium',
    args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio']
  });
  const page = await browser.newPage();
  const erros = [];
  page.on('pageerror', e => erros.push(String(e)));
  await page.goto(URL);
  await page.evaluate(() => { localStorage.clear(); });
  await page.reload();
  await page.evaluate(() => window.ac());
  await page.waitForTimeout(400);
  await page.evaluate(() => window.ac());

  console.log('\n--- 1. dois números de naturezas diferentes ---');
  const p0 = await page.evaluate(() => ({
    lat: window.lat, latFonte: window.latFonte,
    out: window.AC.outputLatency, base: window.AC.baseLatency,
    ref: window.viesRef, temRef: window.temReferencia(),
    rotulo: document.getElementById('scrLat').textContent
  }));
  console.log('       aparelho=' + Math.round(p0.lat * 1000) + ' ms (' + p0.latFonte +
    ')  ·  seu ponto=' + p0.ref);
  t('o atraso do aparelho vem do NAVEGADOR, sem ninguém bater nada',
    p0.latFonte === 'navegador' && p0.lat > 0 &&
    p0.lat === (p0.out > 0 ? p0.out : p0.base), JSON.stringify(p0));
  t('e o seu ponto começa inexistente — ninguém mediu ainda',
    p0.ref === null && p0.temRef === false, String(p0.ref));
  t('o rótulo separa os dois e diz quem afirmou o primeiro',
    /aparelho/.test(p0.rotulo) && /navegador/.test(p0.rotulo) &&
    /seu ponto/.test(p0.rotulo) && /não medido/.test(p0.rotulo), p0.rotulo.trim());
  t('e o botão pulsa, porque o número do navegador nunca basta', await page.evaluate(
    () => document.getElementById('bCalib').classList.contains('pulse')));

  console.log('\n--- 2. a tela diz O QUE a medição é (ele não entendia "calib") ---');
  const botao = await page.evaluate(() => document.getElementById('bCalib').textContent);
  t('o botão não se chama mais "calib"', botao === 'medir você', botao);
  await page.evaluate(() => { document.getElementById('bCalib').click(); });
  await page.waitForFunction(() => window.cal.on === true, { timeout: 8000 });
  const tela = await page.evaluate(() => ({
    veu: document.getElementById('veu').textContent,
    nome: document.getElementById('plNome').textContent
  }));
  console.log('       pista: ' + tela.veu.trim().slice(0, 110));
  t('a pista explica o que fazer', /BATA JUNTO COM O CLIQUE/.test(tela.veu), tela.veu);
  t('diz que é sobre VOCÊ, não sobre a máquina',
    /seu ponto de referência/.test(tela.veu) && /medindo você|seu ponto/.test(tela.nome),
    tela.veu + ' | ' + tela.nome);
  t('e avisa que são três medições no mínimo, antes de começar',
    /3 medições no mínimo/.test(tela.veu), tela.veu);
  t('e que cada uma junta amostra, em vez de ter que concordar com as outras',
    /junta amostra/.test(tela.veu), tela.veu);
  t('e que não dá para errar — é a tarefa mais simples que existe',
    /não pode errar/.test(tela.veu), tela.veu);
  await page.waitForFunction(() => window.cal.on === false, { timeout: 20000 });
  await page.waitForTimeout(200);
  await page.evaluate(() => { window.cal.hist = []; window.cal.toques = []; window.paintLat(); });

  console.log('\n--- 3. O CASO DO RENATO: bater ANTES do clique é legítimo agora ---');
  const neg = await mede(page, -60);
  console.log('       msg: ' + neg.msg.trim().slice(0, 95));
  t('a medição negativa ENTRA no histórico — antecipar é informação, não erro',
    neg.hist.length === 1 && neg.hist[0] < 0, JSON.stringify(neg.hist));
  t('e o app descreve em português o que ela quer dizer',
    /antes do clique/.test(neg.msg), neg.msg.trim());
  t('a latência do aparelho NÃO foi tocada pela batida',
    neg.latFonte === 'navegador' && neg.lat === p0.lat,
    'antes=' + p0.lat + ' depois=' + neg.lat);
  t('e uma medição só ainda não vale', neg.temRef === false && /faltam 2 medições/.test(neg.msg),
    neg.msg.trim());
  t('mas os toques dela ficam guardados — nenhuma medição é desperdiçada',
    neg.toques >= 12 && /nenhuma é desperdiçada/.test(neg.msg), neg.toques + ' toques');
  await page.evaluate(() => { window.cal.hist = []; window.cal.toques = []; window.paintLat(); });

  console.log('\n--- 4. três que concordam viram o seu ponto ---');
  const m1 = await mede(page, 100);
  t('a primeira entra e o app conta quantas faltam',
    m1.hist.length === 1 && /faltam 2 medições/.test(m1.msg), m1.msg.trim());
  t('o progresso aparece no rótulo antes de valer, dizendo QUANTAS FALTAM',
    /faltam 2 medições/.test(m1.rotulo), m1.rotulo.trim());
  const m2 = await mede(page, 100);
  t('a segunda também não basta', m2.temRef === false && /faltam 1 medição/.test(m2.msg),
    m2.msg.trim());
  const m3 = await mede(page, 100);
  console.log('       hist=' + JSON.stringify(m3.hist) + '  ' + m3.rotulo.replace(/\s+/g, ' ').trim());
  t('agora sim: o seu ponto está medido', m3.temRef === true && m3.refFonte === 'medida');
  /* o robô bate 100 ms depois do clique; o navegador informou `lat` de saída,
     que é do APARELHO e sai da conta. Sobra o ponto da pessoa. */
  const esperado = 100 - Math.round(m3.lat * 1000);
  t('e o número é a batida MENOS o que o navegador atribui ao aparelho',
    Math.abs(m3.ref * 1000 - esperado) <= 12,
    'medido=' + Math.round(m3.ref * 1000) + ' esperado≈' + esperado);
  t('foi salvo na chave nova', m3.salvoRef !== null, m3.salvoRef);
  t('o botão parou de pulsar', m3.pulsa === false);
  t('e a referência vem com a própria margem de erro, declarada',
    isFinite(m3.erro) && m3.erro > 0 && /±/.test(m3.rotulo),
    '±' + Math.round(m3.erro * 1000) + ' ms · ' + m3.rotulo.trim());
  t('e com o número de toques que a sustenta', /toques/.test(m3.rotulo), m3.rotulo.trim());

  console.log('\n--- 5. O PORTÃO COBRA A DIFERENÇA, NUNCA O DESLOCAMENTO ABSOLUTO ---');
  const portao = await page.evaluate(() => {
    const base = { n: 24, casados: 24, excedentes: 0, P: 1, L: 1, S: 0.012 };
    const m = (B, ref) => Object.assign({}, base, { B: B, ref: ref });
    return {
      igual: window.motivoReprova('C', m(0.090, 0.090), 0),
      pior: window.motivoReprova('C', m(0.090, 0.010), 0),
      semRef: window.motivoReprova('C', m(0.090, null), 0),
      fraseIgual: window.diagnostico(m(0.090, 0.090)).frase,
      frasePior: window.diagnostico(m(0.090, 0.010)).frase
    };
  });
  console.log('       deslocado 90 ms, ponto 90 ms → ' + (portao.igual || 'PASSA') +
    '  ·  deslocado 90, ponto 10 → ' + portao.pior);
  t('deslocamento uniforme (igual ao seu ponto) NÃO reprova — não é atribuível',
    portao.igual === null, String(portao.igual));
  t('e o app diz Cravado nesse caso, porque é o que ele sabe',
    /Cravado/.test(portao.fraseIgual), portao.fraseIgual);
  t('mas estar PIOR no exercício do que no clique simples reprova',
    portao.pior === 'vies', String(portao.pior));
  t('e a frase compara com o clique, sem afirmar deslocamento absoluto',
    /clique sozinho/.test(portao.frasePior) &&
    !/está atrasando|está antecipando/.test(portao.frasePior), portao.frasePior);
  t('sem o ponto medido, a etapa C não vale',
    portao.semRef === 'calibrar', String(portao.semRef));

  console.log('\n--- 6. um ponto grande recebe a verdade inteira ---');
  const grande = await page.evaluate(() => {
    window.viesRef = 0.120; window.refFonte = 'medida';
    window.cal.hist = [120, 118, 122]; window.paintLat();
    return document.getElementById('scrLat').textContent;
  });
  console.log('       ' + grande.replace(/\s+/g, ' ').trim().slice(0, 130));
  t('o app admite que não sabe se é a pessoa ou o computador',
    /pode ser você ou pode ser o computador/.test(grande), grande.trim());
  t('e diz que isso não conta contra ela', /não conta contra você/.test(grande));

  console.log('\n--- 6b. O CASO DE 19/09: seis medições que nunca concordaram ---');
  /* −96 −54 −58 −70 −51 −119. A regra antiga exigia três medianas dentro de
     10 ms e ele nunca fechou — porque era impossível com a oscilação dele.
     A regra nova acumula toques e declara a margem. */
  const renato = await page.evaluate(() => {
    const medianas = [-96, -54, -58, -70, -51, -119];
    const rodada = (c, n) => Array.from({ length: n }, (_, i) =>
      c + (i % 4 === 0 ? 30 : i % 4 === 1 ? -30 : i % 4 === 2 ? 12 : -12));
    const toques = medianas.reduce((a, m) => a.concat(rodada(m, 20)), []);
    const c = window.consolidarRef(toques, medianas);
    window.cal.hist = medianas; window.cal.toques = toques;
    window.viesRef = c.valor; window.erroRef = c.erro; window.refFonte = 'medida';
    window.paintLat();
    return { ok: c.ok, valor: Math.round(c.valor * 1000), erro: Math.round(c.erro * 1000),
             n: c.n, rotulo: document.getElementById('scrLat').textContent,
             tetoC: Math.round(window.limiteVies('C', c.erro) * 1000),
             tetoPreciso: Math.round(window.limiteVies('C', 0.002) * 1000) };
  });
  console.log('       ' + renato.rotulo.replace(/\s+/g, ' ').trim().slice(0, 150));
  t('as seis medições do Renato AGORA fecham uma referência', renato.ok === true);
  t('e a tela mostra o valor COM a margem e com quantos toques a sustentam',
    /±/.test(renato.rotulo) && /toques/.test(renato.rotulo), renato.rotulo.trim());
  t('a margem é honesta: ele oscila entre rodadas e isso aparece',
    renato.erro >= 8 && renato.erro <= 15, '±' + renato.erro + ' ms');
  t('e o app diz que medir mais aperta a margem',
    /medir mais aperta/.test(renato.rotulo), renato.rotulo.trim());
  console.log('       teto de viés da etapa C: ' + renato.tetoC +
    ' ms com esta margem · ' + renato.tetoPreciso + ' ms para quem mede preciso');
  t('o teto CARREGA a incerteza em vez de fingir precisão',
    renato.tetoC > renato.tetoPreciso,
    'quem tem referência imprecisa não é acusado com segurança que não existe');

  console.log('\n--- 7. a medição antiga, misturada, é descartada ---');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('musga.lat', '0.040');    /* o número do modelo velho */
  });
  await page.reload();
  await page.evaluate(() => window.ac());
  await page.waitForTimeout(300);
  const velho = await page.evaluate(() => ({
    ref: window.viesRef, temRef: window.temReferencia(),
    restou: localStorage.getItem('musga.lat')
  }));
  t('a chave antiga não vira ponto de referência — ela media outra coisa',
    velho.ref === null && velho.temRef === false, JSON.stringify(velho));
  t('e é apagada, para não confundir de novo', velho.restou === null, velho.restou);

  console.log('\n--- 8. um ponto válido sobrevive ao recarregar ---');
  await page.evaluate(() => { localStorage.setItem('musga.ref', '-0.028'); });
  await page.reload();
  await page.evaluate(() => window.ac());
  await page.waitForTimeout(300);
  const volta = await page.evaluate(() => ({ ref: window.viesRef, tem: window.temReferencia() }));
  t('inclusive um ponto NEGATIVO, de quem antecipa',
    volta.tem === true && Math.abs(volta.ref + 0.028) < 1e-9, JSON.stringify(volta));

  console.log('\n--- console ---');
  t('nenhum erro de JavaScript na página', erros.length === 0, erros.join(' | '));

  await browser.close();
  console.log('\n' + (fail ? 'REPROVADO' : 'APROVADO') + ' — ' + pass + ' passaram, ' + fail + ' falharam\n');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERRO NA PROVA: ' + e.message); process.exit(1); });
