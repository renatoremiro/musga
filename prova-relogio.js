/* prova-relogio.js — prova NO NAVEGADOR que o toque é medido pelo horário do
 * EVENTO, e não pelo momento em que o JavaScript conseguiu rodar.
 *
 * A função pura já está testada em test-timing.js. Isso não basta: neste
 * projeto os testes unitários já passaram sobre função que o app não chamava.
 * Aqui o pad é clicado de verdade, com evento de verdade.
 *
 *   node prova-relogio.js
 */
const { chromium } = require('playwright');
const path = require('path');

const URL = 'file://' + path.join(__dirname, 'musga.html');
let pass = 0, fail = 0;
const t = (n, c, x) => { c ? (pass++, console.log('  ok   ' + n))
                           : (fail++, console.log('  FALHA ' + n + (x !== undefined ? '  → ' + x : ''))); };

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
  await page.waitForTimeout(300);

  console.log('\n--- 1. a ponte existe no app e concorda com o relógio do áudio ---');
  const p1 = await page.evaluate(() => ({
    tipo: typeof window.tempoDoEvento,
    tipoHelper: typeof window.instanteDoToque,
    agora: (() => {
      const perf = performance.now(), aud = window.AC.currentTime;
      return window.tempoDoEvento(perf, perf, aud) - aud;
    })(),
    semEvento: (() => {
      const a = window.instanteDoToque(null), b = window.AC.currentTime;
      return Math.abs(a - b);
    })()
  }));
  t('tempoDoEvento vive no app, não só no teste', p1.tipo === 'function', p1.tipo);
  t('e instanteDoToque é o único lugar que o jogo e a calibração usam',
    p1.tipoHelper === 'function', p1.tipoHelper);
  t('um evento de agora vira o agora do áudio', Math.abs(p1.agora) < 1e-9, p1.agora);
  t('sem evento, cai no relógio do áudio como antes', p1.semEvento < 0.02, p1.semEvento);

  console.log('\n--- 2. O CAMINHO DE VERDADE: clicar um pad passa o evento adiante ---');
  /* espiona a ponte: se hit() não estiver repassando o evento, ela não é
     chamada com timeStamp nenhum e a acusação se prova sozinha */
  await page.evaluate(() => {
    window.__espiao = [];
    const real = window.tempoDoEvento;
    window.tempoDoEvento = function (ts, perf, aud, tol) {
      window.__espiao.push({ ts: ts, perf: perf, aud: aud });
      return real(ts, perf, aud, tol);
    };
  });
  /* hit() só chega na ponte quando o pad É do exercício da vez: antes disso
     ele retorna cedo, e o modo livre retorna antes de tudo. O caminho provado
     aqui é o caminho real de quem está jogando. */
  const alvo = await page.evaluate(() => {
    window.livre = false;
    window.mapa = window.marcarSentiu(window.mapa, 'h1-pulso');
    window.salvarMapa(); window.planejar();
    const pad = window.vozesDe(window.exercicio(window.plano.id),
                  window.varianteDoPlano(window.mapa, window.plano).transposto)[0].pad;
    return { pad: pad, indice: window.PADS.map(p => p.id).indexOf(pad),
             tecla: window.PADS.filter(p => p.id === pad)[0].k };
  });
  console.log('       pad do exercício da vez: ' + alvo.pad + ' (tecla ' + alvo.tecla + ')');
  await page.locator('.pad').nth(alvo.indice).click();
  await page.waitForTimeout(80);
  const espiao = await page.evaluate(() => window.__espiao.slice());
  t('clicar o pad do exercício chama a ponte — o evento chega até hit()',
    espiao.length >= 1, JSON.stringify(espiao));
  t('e chega com um timeStamp real, não zero nem indefinido',
    espiao.length >= 1 && isFinite(espiao[0].ts) && espiao[0].ts > 0,
    JSON.stringify(espiao[0]));
  t('o horário do evento é ANTERIOR ao momento em que o JS rodou',
    espiao.length >= 1 && espiao[0].ts <= espiao[0].perf,
    espiao.length ? (espiao[0].perf - espiao[0].ts).toFixed(2) + ' ms de fila' : 'sem dados');

  console.log('\n--- 3. o teclado também passa o evento ---');
  await page.evaluate(() => { window.__espiao = []; });
  await page.keyboard.press(alvo.tecla.toLowerCase());
  await page.waitForTimeout(80);
  const esp3 = await page.evaluate(() => window.__espiao.slice());
  t('a tecla do pad chama a ponte', esp3.length >= 1, JSON.stringify(esp3));
  t('e o evento de teclado também traz timeStamp utilizável',
    esp3.length >= 1 && isFinite(esp3[0].ts) && esp3[0].ts > 0, JSON.stringify(esp3[0]));

  console.log('\n--- 4. a calibração usa A MESMA régua do jogo ---');
  const p4 = await page.evaluate(() => ({
    calTapUsaHelper: /instanteDoToque/.test(window.calTap.toString()),
    hitUsaHelper: /instanteDoToque/.test(window.hit.toString()),
    hitSeparaSom: /tSom/.test(window.hit.toString()) && /tDedo/.test(window.hit.toString()),
    calTapAceitaEvento: window.calTap.length === 1
  }));
  t('calTap mede pela mesma função que o jogo', p4.calTapUsaHelper);
  t('hit também', p4.hitUsaHelper);
  t('e hit separa QUANDO O SOM SAI de QUANDO O DEDO BATEU — eram o mesmo número',
    p4.hitSeparaSom);
  t('calTap recebe o evento', p4.calTapAceitaEvento, 'aridade ' + p4.calTapAceitaEvento);

  console.log('\n--- 5. o 1 ms de desencontro entre as duas réguas acabou ---');
  const p5 = await page.evaluate(() => {
    const src = window.hit.toString() + window.calTap.toString();
    return {
      somaNoJulgamento: /casar\(\s*AC\.currentTime\s*\+/.test(src),
      calTapCru: /cal\.taps\.push\(AC\.currentTime\)/.test(src)
    };
  });
  t('o julgamento não soma mais 1 ms ao toque', p5.somaNoJulgamento === false);
  t('e a calibração não lê mais o relógio cru', p5.calTapCru === false);

  console.log('\n--- 6. controle: o jogo continua funcionando ---');
  await page.evaluate(() => { window.livre = false; localStorage.clear(); });
  await page.reload();
  await page.evaluate(() => window.ac());
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    window.mapa = window.marcarSentiu(window.mapa, 'h1-pulso');
    window.salvarMapa(); window.planejar();
  });
  await page.evaluate(() => { document.getElementById('bAct').click(); });
  await page.waitForFunction(() => !!window.run, { timeout: 8000 });
  await page.evaluate(async () => {
    const espera = ms => new Promise(r => setTimeout(r, ms));
    const feitas = new Set();
    while (window.run) {
      const r = window.run; if (!r || !r.notas) break;
      const agora = window.AC.currentTime;
      r.notas.forEach(n => {
        if (!n || feitas.has(n) || n.st !== 'espera') return;
        if (agora >= n.t && agora < n.t + 0.05) { feitas.add(n); window.hit(n.pad); }
      });
      await espera(4);
    }
  });
  await page.waitForFunction(() => !window.run, { timeout: 90000 });
  const r6 = await page.evaluate(() => ({
    saida: (document.getElementById('rSaida') || {}).textContent || '',
    firmeza: (document.getElementById('rS') || {}).textContent || ''
  }));
  console.log('       saída: ' + r6.saida.replace(/\s+/g, ' ').trim().slice(0, 80));
  t('uma execução inteira ainda passa tocando cravado',
    /passou|conquistad|confirmad/i.test(r6.saida), r6.saida.slice(0, 120));

  console.log('\n--- console ---');
  t('nenhum erro de JavaScript na página', erros.length === 0, erros.join(' | '));

  await browser.close();
  console.log('\n' + (fail ? 'REPROVADO' : 'APROVADO') + ' — ' + pass + ' passaram, ' + fail + ' falharam\n');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERRO NA PROVA: ' + e.message); process.exit(1); });
