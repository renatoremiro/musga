/* prova-passo2.js — prova NO NAVEGADOR as duas correções do Passo 2:
 *   (a) na etapa C a máquina cala em parte dos compassos e o tempo fica com
 *       a pessoa — e cala TUDO, não só o clique;
 *   (b) uma escolha no mapa vale por uma execução e não prende mais ninguém,
 *       nem desliga a graduação em silêncio.
 *
 *   node prova-passo2.js
 */
const { chromium } = require('playwright');
const fs = require('fs');

const URL = 'file:///home/claude/musga.html';
const SHOTS = '/tmp/claude-0/shots-passo2';
let pass = 0, fail = 0;
const t = (n, c, x) => { c ? (pass++, console.log('  ok   ' + n))
                           : (fail++, console.log('  FALHA ' + n + (x !== undefined ? '  → ' + x : ''))); };

/* Instrumenta o aplicativo para registrar CADA som que a máquina emite, com o
   passo absoluto em que ele caiu. É assim que se sabe se ela calou de verdade
   em vez de acreditar no código. */
async function espionar(page) {
  await page.evaluate(() => {
    window.__sons = [];
    /* separa o som DA MÁQUINA do som do próprio jogador: hit() também chama
       V[pad], e contar os dois juntos faria o silêncio parecer incompleto */
    window.__euToquei = false;
    const hitOrig = window.hit;
    window.hit = function () {
      window.__euToquei = true;
      try { return hitOrig.apply(this, arguments); }
      finally { window.__euToquei = false; }
    };
    Object.keys(window.V).forEach(k => {
      const orig = window.V[k];
      window.V[k] = function (t, v) {
        if (window.run && !window.__euToquei)
          window.__sons.push({ pad: k, absStep: window.run.absStep });
        return orig.apply(this, arguments);
      };
    });
  });
}
/* roda uma execução tocando as notas certas; devolve os sons da máquina por
   compasso medido */
async function rodar(page, atrasoMs) {
  await page.evaluate(() => { window.__sons = []; document.getElementById('bAct').click(); });
  await page.waitForFunction(() => !!window.run, { timeout: 8000 });
  const visto = { sozinho: false, shot: null };
  const fim = page.waitForFunction(() => !window.run, { timeout: 120000 });
  await page.evaluate(async (a) => {
    const w = ms => new Promise(r => setTimeout(r, ms));
    const feitas = new Set();
    while (window.run) {
      const r = window.run; if (!r || !r.notas) break;
      if (r.sozinho) window.__viuSozinho = true;
      const now = window.AC.currentTime;
      r.notas.forEach(n => {
        if (!n || feitas.has(n) || n.st !== 'espera') return;
        const alvo = n.t + a / 1000;
        if (now >= alvo && now < alvo + 0.04) { feitas.add(n); window.hit(n.pad); }
      });
      await w(3);
    }
  }, atrasoMs);
  await fim;
  return page.evaluate(() => {
    const lead = window.__lead, comps = window.__comps;
    const porComp = {};
    window.__sons.forEach(s => {
      const c = Math.floor((s.absStep - lead * 16) / 16);
      if (c < 0 || c >= comps) return;
      porComp[c] = (porComp[c] || 0) + 1;
    });
    return { porComp, comps, total: window.__sons.length,
             saida: document.getElementById('rSaida').textContent };
  });
}

(async () => {
  fs.mkdirSync(SHOTS, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
    args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'] });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });
  const erros = [];
  page.on('pageerror', e => erros.push(String(e)));
  await page.goto(URL);
  await page.evaluate(() => window.ac());
  await page.waitForTimeout(300);
  await page.evaluate(() => { window.mapa = window.marcarSentiu(window.mapa, 'h1-pulso');
                              window.salvarMapa(); window.planejar(); });
  await espionar(page);

  console.log('\n--- 1. a máquina cala na etapa C, e só na etapa C ---');
  const relatos = {};
  for (const etapa of ['A', 'B', 'C']) {
    await page.evaluate((et) => {
      /* o mapa precisa ter a etapa DISPONÍVEL, senão o app planeja outra */
      const otimo = window.metricas(new Array(24).fill(0).map((_, i) => (i % 2 ? .004 : -.004)), 24, 0);
      let mp = window.mapaNovo();
      const antes = { A: [], B: ['A', 'A'], C: ['A', 'A', 'B', 'B'] }[et];
      antes.forEach(e2 => { mp = window.registrar(mp, 'h1-pulso', e2, otimo,
                                                  { hoje: '2026-09-18', bpm: 70 }).mapa; });
      window.mapa = window.marcarSentiu(mp, 'h1-pulso'); window.salvarMapa();
      window.escolha = { id: 'h1-pulso', etapa: et };
      window.planejar();
      window.__lead = (et === 'B' ? 2 : 1);
      window.__comps = window.compassosDoPortao(window.exercicio('h1-pulso'), et);
      window.__viuSozinho = false;
    }, etapa);
    /* garante que a etapa pedida é mesmo a que vai rodar */
    const et = await page.evaluate(() => window.plano.etapa);
    if (et !== etapa) { console.log('       (pulando ' + etapa + ': o app planejou ' + et + ')'); continue; }
    const r = await rodar(page, 2);
    const mapa = [];
    for (let c = 0; c < r.comps; c++) mapa.push(r.porComp[c] ? '♪' : '·');
    relatos[etapa] = { mapa: mapa.join(''), porComp: r.porComp, comps: r.comps,
                       viuSozinho: await page.evaluate(() => window.__viuSozinho) };
    console.log('       etapa ' + etapa + ' · compassos medidos: ' + mapa.join('') +
                '   (♪ = a máquina soou, · = silêncio)');
  }
  t('na etapa A a máquina soa em TODOS os compassos medidos',
    relatos.A && relatos.A.mapa.indexOf('·') < 0, relatos.A && relatos.A.mapa);
  t('na etapa B também — a pista já foi embora, o tempo não',
    relatos.B && relatos.B.mapa.indexOf('·') < 0, relatos.B && relatos.B.mapa);
  t('na etapa C a máquina CALA em parte dos compassos',
    relatos.C && relatos.C.mapa.indexOf('·') >= 0, relatos.C && relatos.C.mapa);
  t('e o silêncio é de TUDO: ZERO sons da máquina, não só o clique',
    relatos.C && [2, 3].every(c => !relatos.C.porComp[c]),
    relatos.C && JSON.stringify(relatos.C.porComp));
  t('nos compassos com som a máquina toca a levada inteira',
    relatos.C && [0, 1, 4, 5].every(c => relatos.C.porComp[c] === 10),
    relatos.C && JSON.stringify(relatos.C.porComp));
  t('o pulso VOLTA depois de calar — o reencontro é o ensino',
    relatos.C && /·+♪/.test(relatos.C.mapa), relatos.C && relatos.C.mapa);
  t('o aviso "você segura o tempo" aparece durante a execução',
    relatos.C && relatos.C.viuSozinho === true);

  console.log('\n--- 2. o aviso na tela, visto de verdade ---');
  await page.evaluate(() => {
    const otimo = window.metricas(new Array(24).fill(0).map((_, i) => (i % 2 ? .004 : -.004)), 24, 0);
    let mp = window.mapaNovo();
    ['A', 'A', 'B', 'B'].forEach(e2 => { mp = window.registrar(mp, 'h1-pulso', e2, otimo,
                                             { hoje: '2026-09-18', bpm: 70 }).mapa; });
    window.mapa = window.marcarSentiu(mp, 'h1-pulso'); window.salvarMapa();
    window.escolha = { id: 'h1-pulso', etapa: 'C' }; window.planejar();
    document.getElementById('bAct').click();
  });
  await page.waitForFunction(() => !!window.run, { timeout: 8000 });
  await page.waitForFunction(() => window.run && window.run.sozinho === true, { timeout: 60000 })
    .then(() => true).catch(() => false);
  await page.locator('#hw').screenshot({ path: SHOTS + '/sozinho.png' });
  const temAviso = await page.evaluate(() => !!(window.run && window.run.sozinho));
  t('a pista foi capturada com o aviso na tela', temAviso);
  await page.evaluate(() => document.getElementById('bAct').click());
  await page.waitForTimeout(300);

  console.log('\n--- 3. a escolha vale por UMA execução ---');
  await page.evaluate(() => { localStorage.clear(); });
  await page.reload();
  await page.evaluate(() => window.ac());
  await page.waitForTimeout(250);
  await page.evaluate(() => { window.mapa = window.marcarSentiu(window.mapa, 'h1-pulso');
                              window.salvarMapa(); window.escolha = { id: 'h1-pulso', etapa: 'A' };
                              window.planejar(); });
  const presa = await page.evaluate(() => !!window.escolha);
  await espionar(page);
  await rodar(page, 2);
  const solta = await page.evaluate(() => window.escolha);
  t('antes da execução a escolha está de pé', presa === true);
  t('depois da execução ela foi solta — ninguém fica preso a sessão inteira',
    solta === null, JSON.stringify(solta));

  console.log('\n--- 4. escolher a etapa C não desliga mais a graduação ---');
  const grad = await page.evaluate(() => {
    /* leva h1 até conquistar a etapa C, direto pelo núcleo */
    const otimo = window.metricas(new Array(24).fill(0).map((_, i) => (i % 2 ? .004 : -.004)), 24, 0);
    let mp = window.mapaNovo();
    ['A', 'A', 'B', 'B', 'C', 'C'].forEach(et => {
      mp = window.registrar(mp, 'h1-pulso', et, otimo, { hoje: '2026-09-18', bpm: 70 }).mapa;
    });
    window.mapa = mp; window.salvarMapa();
    /* agora a pessoa ESCOLHE a etapa C no mapa, como o Renato fez */
    window.escolha = { id: 'h1-pulso', etapa: 'C' }; window.planejar();
    const v = window.varianteDoPlano(window.mapa, window.plano);
    return { tipo: window.plano.tipo, transposto: v.transposto, bpm: v.bpm,
             cartao: document.getElementById('plNota').textContent,
             padAceso: window.PADS.filter(p => window.meuPad(p.id)).map(p => p.id) };
  });
  console.log('       plano=' + grad.tipo + ' transposto=' + grad.transposto +
              ' · cartão: "' + grad.cartao + '" · pad aceso: ' + grad.padAceso.join(','));
  t('escolher a etapa C entrega a variante que GRADUA (transposta)',
    grad.transposto === true, JSON.stringify(grad));
  t('o cartão avisa que é em outros pads', /outros pads/.test(grad.cartao), grad.cartao);
  t('e o painel acende o pad CERTO, o mesmo que a execução vai cobrar',
    grad.padAceso.length === 1 && grad.padAceso[0] === 'tomlo', grad.padAceso.join(','));

  console.log('\n--- 5. a revisão vencida vem antes da escolha ---');
  const rev = await page.evaluate(() => {
    let mp = window.mapaNovo();
    const otimo = window.metricas(new Array(24).fill(0).map((_, i) => (i % 2 ? .004 : -.004)), 24, 0);
    ['A', 'A', 'B', 'B', 'C', 'C'].forEach(et => {
      mp = window.registrar(mp, 'h1-pulso', et, otimo, { hoje: '2026-09-01', bpm: 70 }).mapa;
    });
    mp = window.registrar(mp, 'h1-pulso', 'C', otimo, { hoje: '2026-09-01', transposto: true, bpm: 70 }).mapa;
    mp = window.registrar(mp, 'h1-pulso', 'C', otimo, { hoje: '2026-09-01', transposto: false, bpm: 90 }).mapa;
    window.mapa = mp;
    const devido = window.retesteDevido(window.mapa, window.HOJE);
    window.escolha = { id: 'h2-colcheia', etapa: 'A' };
    window.planejar();
    return { devido: devido, plano: window.plano.tipo, id: window.plano.id,
             escolhaSobrou: window.escolha };
  });
  console.log('       revisão devida: ' + rev.devido + ' → plano: ' + rev.plano + ' (' + rev.id + ')');
  t('com revisão vencida, um toque no mapa NÃO a engole mais',
    rev.devido === null || rev.plano === 'reteste',
    JSON.stringify(rev));

  console.log('\n--- console ---');
  t('nenhum erro de JavaScript na página', erros.length === 0, erros.join(' | '));

  await browser.close();
  console.log('\n' + (fail ? 'REPROVADO' : 'APROVADO') + ' — ' + pass + ' passaram, ' + fail + ' falharam\n');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERRO NA PROVA: ' + e.message); process.exit(1); });
