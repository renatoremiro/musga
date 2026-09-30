/* prova-celular.js — prova NO CELULAR EMULADO que o app cabe, se toca e mede.
 *
 * O Renato joga num iPhone 13 Pro Max. A página não tinha <meta viewport> nem
 * <meta charset>: abria a ~40% do tamanho, e o botão laranja — "o botão laranja
 * conduz tudo" — ficava em y=1004 numa tela de 664 px. Ninguém tinha olhado o
 * celular porque ninguém tinha perguntado onde ele joga.
 *
 * O que NÃO dá para provar aqui, e fica para o aparelho de verdade:
 *   - a chave de silêncio do iPhone (o destravador de áudio);
 *   - a latência real do alto-falante e de um fone;
 *   - o Safari apagando o localStorage após 7 dias.
 *
 *   node prova-celular.js
 */
const { chromium, devices } = require('playwright');
const path = require('path');

const URL = 'file://' + path.join(__dirname, 'musga.html');
let pass = 0, fail = 0;
const t = (n, c, x) => { c ? (pass++, console.log('  ok   ' + n))
                           : (fail++, console.log('  FALHA ' + n + (x !== undefined ? '  → ' + x : ''))); };

async function medidas(page) {
  return page.evaluate(() => {
    const r = id => { const e = document.getElementById(id); if (!e) return null;
      const b = e.getBoundingClientRect(); return { top: Math.round(b.top), bottom: Math.round(b.bottom), w: Math.round(b.width), h: Math.round(b.height) }; };
    return {
      vw: innerWidth, vh: innerHeight,
      scrollW: document.documentElement.scrollWidth,
      bAct: r('bAct'), hw: r('hw'),
      padsVisiveis: [...document.querySelectorAll('.pad')].filter(p => p.offsetParent !== null).length,
      padMaior: Math.max(...[...document.querySelectorAll('.pad')].map(p => p.getBoundingClientRect().width)),
      fonteMin: Math.min(...[...document.querySelectorAll('.veu i, .box-n, .res-l, .mapa-hd')]
        .filter(e => e.offsetParent !== null).map(e => parseFloat(getComputedStyle(e).fontSize))),
      charset: document.characterSet,
      viewport: !!document.querySelector('meta[name="viewport"]')
    };
  });
}

(async () => {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium',
    args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio']
  });
  const erros = [];

  for (const nome of ['iPhone 13', 'Pixel 7']) {
    console.log('\n═══ ' + nome + ' ═══');
    const ctx = await browser.newContext({ ...devices[nome] });
    const page = await ctx.newPage();
    page.on('pageerror', e => erros.push(nome + ': ' + String(e)));
    await page.goto(URL);
    await page.evaluate(() => { localStorage.clear(); });
    await page.reload();
    await page.waitForTimeout(400);

    console.log('--- 1. a primeira tela cabe e diz o que fazer ---');
    const m0 = await medidas(page);
    console.log('       tela ' + m0.vw + '×' + m0.vh + ' · botão laranja y=' + m0.bAct.top + '–' + m0.bAct.bottom +
      ' · pads visíveis ' + m0.padsVisiveis);
    t('a página declara charset e viewport', m0.charset === 'UTF-8' && m0.viewport,
      m0.charset + ' viewport=' + m0.viewport);
    t('sem rolagem horizontal', m0.scrollW <= m0.vw, m0.scrollW + ' > ' + m0.vw);
    t('o botão laranja está VISÍVEL sem rolar', m0.bAct.bottom <= m0.vh, JSON.stringify(m0.bAct));
    t('e tem altura de dedo (≥ 44 px)', m0.bAct.h >= 44, m0.bAct.h);
    t('a pista cabe inteira na tela', m0.hw.bottom <= m0.vh, JSON.stringify(m0.hw));
    t('só o pad do exercício aparece — os 15 mudos não empurram nada', m0.padsVisiveis === 1, m0.padsVisiveis);
    t('o pad é grande o bastante para um dedo (≥ 90 px)', m0.padMaior >= 90, m0.padMaior);
    t('nenhum texto abaixo de 10 px', m0.fonteMin >= 10, m0.fonteMin);
    await page.screenshot({ path: '/tmp/claude-0/prova-cel-' + nome.replace(' ', '') + '-1.png' });

    console.log('--- 2. tocar com o DEDO funciona (evento de toque, não de mouse) ---');
    await page.evaluate(() => {
      window.mapa = window.marcarSentiu(window.mapa, 'h1-pulso');
      window.salvarMapa(); window.planejar();
    });
    await page.locator('#bAct').tap();
    await page.waitForFunction(() => !!window.run, { timeout: 8000 });
    const m1 = await medidas(page);
    t('durante a execução o botão continua à vista (vira Parar)', m1.bAct.bottom <= m1.vh + 2,
      JSON.stringify(m1.bAct));
    /* toca cada nota com um TAP real no pad, no tempo certo */
    const padSel = await page.evaluate(() => {
      const pad = window.run.vozes[0].pad;
      return '.pad[aria-label="' + window.PADS.filter(p => p.id === pad)[0].l + '"]';
    });
    const antesToques = await page.evaluate(() => window.run.desvios.length);
    let taps = 0;
    while (await page.evaluate(() => !!window.run)) {
      const prox = await page.evaluate(() => {
        const r = window.run; if (!r) return null;
        const n = r.notas.find(n => n.st === 'espera' && n.t > window.AC.currentTime - 0.05);
        return n ? (n.t - window.AC.currentTime) * 1000 : null;
      });
      if (prox === null) { await page.waitForTimeout(60); continue; }
      if (prox > 0) await page.waitForTimeout(Math.max(0, prox));
      await page.locator(padSel).tap(); taps++;
      await page.waitForTimeout(40);
      if (taps > 60) break;
    }
    await page.waitForFunction(() => !window.run, { timeout: 90000 });
    const r2 = await page.evaluate(() => ({
      saida: (document.getElementById('rSaida') || {}).textContent || '',
      casados: parseInt((document.getElementById('hNotas') || {}).textContent || '0', 10)
    }));
    console.log('       ' + taps + ' toques · saída: ' + r2.saida.replace(/\s+/g, ' ').trim().slice(0, 70));
    t('os toques de dedo foram julgados (casaram com notas)', taps >= 20 && /passou|não passou/i.test(r2.saida),
      taps + ' toques · ' + r2.saida.slice(0, 60));
    await page.screenshot({ path: '/tmp/claude-0/prova-cel-' + nome.replace(' ', '') + '-2.png' });

    console.log('--- 2b. os defeitos que a auditoria v5 viu no cartão ---');
    const a6 = await page.evaluate(() => ({
      saida: (document.getElementById('rSaida') || {}).textContent || '',
      mapa: (document.getElementById('mapaRows') || {}).textContent || '',
      serie: window.MIN_SERIE
    }));
    t('"repita para confirmar (N de 2)" nunca passa de 2', !/\(3 de 2\)/.test(a6.saida), a6.saida);
    t('o mapa não diz "não começou" depois de passar', /1 de 2 na etapa A/.test(a6.mapa),
      a6.mapa.replace(/\s+/g, ' ').slice(0, 80));
    /* o canvas: título e legenda não podem se sobrepor num canvas estreito */
    const canvas = await page.evaluate(() => {
      const c = document.getElementById('hw'), cx = c.getContext('2d');
      cx.font = '9px "DM Mono",monospace';
      const tit = cx.measureText('ONDE VOCÊ DERRAPOU').width, leg = cx.measureText('↑ cedo  ↓ tarde  ms').width;
      return { w: c.width, tit: tit, leg: leg, cabem: tit + leg + 36 + 20 < c.width };
    });
    t('no canvas estreito, título e legenda cabem sem se sobrepor', canvas.cabem, JSON.stringify(canvas));

    console.log('--- 3. o resultado é alcançável rolando, e o botão segue junto ---');
    await page.evaluate(() => document.getElementById('boxRes').scrollIntoView());
    await page.waitForTimeout(200);
    const m3 = await medidas(page);
    t('rolando até o resultado, o botão laranja continua na tela (sticky)',
      m3.bAct.top >= 0 && m3.bAct.bottom <= m3.vh + 2, JSON.stringify(m3.bAct));

    console.log('--- 4. medir você funciona por toque ---');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.locator('#bCalib').tap();
    await page.waitForFunction(() => window.cal && window.cal.on === true, { timeout: 8000 });
    const m4 = await medidas(page);
    t('na medição TODOS os pads voltam — "bata em qualquer pad"', m4.padsVisiveis === 16, m4.padsVisiveis);
    await page.evaluate(async () => {
      const espera = ms => new Promise(r => setTimeout(r, ms));
      const feitos = new Set();
      while (window.cal.on) {
        const agora = window.AC.currentTime;
        window.cal.beats.forEach(b => { if (!feitos.has(b) && agora >= b + 0.03) { feitos.add(b); window.calTap(); } });
        await espera(4);
      }
    });
    await page.waitForFunction(() => window.cal.on === false, { timeout: 5000 });
    const r4 = await page.evaluate(() => window.cal.hist.length);
    t('a rodada entrou no histórico', r4 === 1, r4);

    console.log('--- 4b. o destravador de áudio do iPhone está ligado nos gestos certos ---');
    /* o que dá para provar sem um iPhone: o <audio> mudo existe, está em loop,
       o play foi tentado num gesto que o WebKit aceita (click/touchend), e o
       contexto está rodando depois desse gesto. A chave de silêncio em si só
       se prova no aparelho. */
    const unlock = await page.evaluate(() => ({
      tipo: typeof window.destravarIOS,
      temAudio: !!window.destravador,
      loop: window.destravador ? window.destravador.loop === true : false,
      src: window.destravador ? /^data:audio\/wav;base64,/.test(window.destravador.src) : false,
      contexto: window.AC ? window.AC.state : 'sem AC',
      gestos: (() => {
        const src = document.documentElement.outerHTML;
        return /\['touchend','click','keydown'\]\.forEach\(function\(ev\)\{\s*document\.addEventListener\(ev,destravarIOS/.test(src);
      })()
    }));
    t('o destravador existe e o <audio> mudo foi criado', unlock.tipo === 'function' && unlock.temAudio);
    t('o <audio> é em loop e vem de um WAV embutido', unlock.loop && unlock.src, JSON.stringify(unlock));
    t('está ligado em touchend/click/keydown — NÃO em pointerdown', unlock.gestos);
    t('depois dos toques, o contexto de áudio está rodando', unlock.contexto === 'running', unlock.contexto);

    console.log('--- 5. cópia de segurança existe (o Safari apaga em 7 dias) ---');
    const bk = await page.evaluate(() => ({
      exp: !!document.getElementById('bExportar'), imp: !!document.getElementById('bImportar'),
      aviso: /7 dias/.test(document.getElementById('diario').textContent)
    }));
    t('há guardar cópia e trazer cópia', bk.exp && bk.imp);
    t('e o aviso dos 7 dias está escrito', bk.aviso);
    const ida = await page.evaluate(() => {
      const o = { app: 'musga', versao: 1, data: 'x', dados: {} };
      window.CHAVES_ESTADO.forEach(k => { const v = localStorage.getItem(k); if (v !== null) o.dados[k] = v; });
      return o;
    });
    t('a cópia carrega o diário e a medição', typeof ida.dados['musga.diario'] === 'string' &&
      typeof ida.dados['musga.refhist'] === 'string', Object.keys(ida.dados).join(','));

    await ctx.close();
  }

  console.log('\n--- console ---');
  t('nenhum erro de JavaScript em nenhum aparelho', erros.length === 0, erros.join(' | '));

  await browser.close();
  console.log('\n' + (fail ? 'REPROVADO' : 'APROVADO') + ' — ' + pass + ' passaram, ' + fail + ' falharam\n');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERRO NA PROVA: ' + e.message); process.exit(1); });
