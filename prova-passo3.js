/* prova-passo3.js — prova NO NAVEGADOR o Bloco 1: a medição parar de mentir.
 *
 *   (a) a DERIVA é medida de verdade — o que acontece quando a máquina cala
 *       era o melhor momento pedagógico do app e o único não medido;
 *   (b) o app diz QUAL critério reprovou;
 *   (c) o exercício denso dura o mesmo que o fácil, e continua tendo silêncio;
 *   (d) omitir notas deixou de ser vantagem;
 *   (e) o diário carrega a régua com que cada linha foi medida.
 *
 *   node prova-passo3.js
 */
const { chromium } = require('playwright');

const URL = 'file:///home/claude/musga.html';
let pass = 0, fail = 0;
const t = (n, c, x) => { c ? (pass++, console.log('  ok   ' + n))
                           : (fail++, console.log('  FALHA ' + n + (x !== undefined ? '  → ' + x : ''))); };

async function prepara(page, etapa, id) {
  await page.evaluate(({ et, ex }) => {
    const otimo = window.metricas(new Array(24).fill(0).map((_, i) => (i % 2 ? .004 : -.004)), 24, 0);
    let mp = window.mapaNovo();
    ({ A: [], B: ['A', 'A'], C: ['A', 'A', 'B', 'B'] }[et]).forEach(e2 => {
      mp = window.registrar(mp, ex, e2, otimo, { hoje: '2026-09-18', bpm: 70 }).mapa;
    });
    window.mapa = window.marcarSentiu(mp, ex); window.salvarMapa();
    window.escolha = { id: ex, etapa: et }; window.planejar();
  }, { et: etapa, ex: id });
}

/* Robô com DOIS comportamentos: um atraso para as notas que caem enquanto a
   máquina toca, outro para as que caem no silêncio. É assim que se fabrica
   uma deriva conhecida e se vê se o app a enxerga. */
async function rodar(page, msComSom, msSozinho) {
  await page.evaluate(() => document.getElementById('bAct').click());
  await page.waitForFunction(() => !!window.run, { timeout: 8000 });
  const fim = page.waitForFunction(() => !window.run, { timeout: 120000 });
  await page.evaluate(async ({ a, b }) => {
    const w = ms => new Promise(r => setTimeout(r, ms));
    const feitas = new Set();
    while (window.run) {
      const r = window.run; if (!r || !r.notas) break;
      const now = window.AC.currentTime;
      r.notas.forEach(n => {
        if (!n || feitas.has(n) || n.st !== 'espera') return;
        const alvo = n.t + (n.sozinha ? b : a) / 1000;
        if (now >= alvo && now < alvo + 0.04) { feitas.add(n); window.hit(n.pad); }
      });
      await w(3);
    }
  }, { a: msComSom, b: msSozinho });
  await fim;
  return page.evaluate(() => ({
    saida: document.getElementById('rSaida').textContent,
    frase: document.getElementById('rFrase').textContent,
    diario: window.lerDiario().slice(-1)[0] || null
  }));
}

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
    args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'] });
  const page = await browser.newPage();
  const erros = [];
  page.on('pageerror', e => erros.push(String(e)));
  await page.goto(URL);
  await page.evaluate(() => window.ac());
  await page.waitForTimeout(300);

  console.log('\n--- 1. as notas sabem se caíram no silêncio ---');
  await prepara(page, 'C', 'h1-pulso');
  await page.evaluate(() => document.getElementById('bAct').click());
  await page.waitForFunction(() => !!window.run, { timeout: 8000 });
  /* gerar() descarta nota velha, então nenhuma foto instantânea vê o compasso
     inteiro: é preciso acompanhar a execução e acumular */
  const marcacao = await page.evaluate(async () => {
    const w = ms => new Promise(r => setTimeout(r, ms));
    const vistas = new Set(); let comSom = 0, sozinhas = 0;
    while (window.run) {
      (window.run.notas || []).forEach(n => {
        if (!n || !n.medida || vistas.has(n)) return;
        vistas.add(n); n.sozinha ? sozinhas++ : comSom++;
        if (n.st === 'espera') window.hit(n.pad);
      });
      await w(5);
    }
    return { total: vistas.size, sozinhas, comSom };
  });
  await page.waitForTimeout(400);
  console.log('       notas medidas: ' + marcacao.total +
              ' · com a máquina: ' + marcacao.comSom + ' · no silêncio: ' + marcacao.sozinhas);
  t('há notas dos dois tipos — sem isso não há deriva a medir',
    marcacao.sozinhas > 0 && marcacao.comSom > 0, JSON.stringify(marcacao));
  t('e são 24 no total: 6 compassos de quatro no chão',
    marcacao.total === 24, marcacao.total);

  console.log('\n--- 2. A DERIVA: o robô que só escorrega quando fica sozinho ---');
  await prepara(page, 'C', 'h1-pulso');
  const r1 = await rodar(page, 4, 84);   /* certo com a máquina, 80 ms atrás no silêncio */
  console.log('       frase: ' + r1.frase);
  console.log('       diário: viés=' + r1.diario.b + ' firmeza=' + r1.diario.s +
              ' deriva=' + r1.diario.dv + ' régua=' + r1.diario.regua);
  t('a deriva foi medida e é próxima dos 80 ms fabricados',
    r1.diario.dv !== null && Math.abs(r1.diario.dv - 80) <= 25, r1.diario.dv);
  t('e ela atravessou o próprio ruído — não é um número qualquer',
    r1.diario.dv !== null, 'a função devolve null quando não tem resolução');
  t('e o app CONTA isso na tela, em português',
    /Quando a máquina calou, você atrasou \d+ ms/.test(r1.frase), r1.frase);
  t('o viés global sozinho esconderia isso',
    Math.abs(r1.diario.b) < Math.abs(r1.diario.dv),
    'viés=' + r1.diario.b + ' deriva=' + r1.diario.dv);

  console.log('\n--- 3. quem NÃO deriva recebe deriva ~zero ---');
  await prepara(page, 'C', 'h1-pulso');
  const r2 = await rodar(page, 4, 4);
  console.log('       deriva=' + r2.diario.dv + ' · ' + r2.saida);
  /* Sem escorregar, o certo é a deriva ficar EM BRANCO: o robô é preciso
     demais para haver diferença, e qualquer número seria ruído. O primeiro
     diário real do Renato deu +14 −22 +36 −53 −37 −47 −1 +36 justamente
     porque a função ainda reportava o que não conseguia afirmar. */
  t('sem escorregar, a deriva fica em branco ou perto de zero',
    r2.diario.dv === null || Math.abs(r2.diario.dv) <= 20, r2.diario.dv);
  t('e a execução passa', /passou|conquistad|confirmad/i.test(r2.saida), r2.saida);
  t('a frase NÃO inventa deriva quando não há',
    !/calou, você atrasou (5[0-9]|[6-9][0-9]|\d{3})/.test(r2.frase), r2.frase);

  console.log('\n--- 4. omitir notas deixou de ser vantagem ---');
  await prepara(page, 'C', 'h1-pulso');
  /* toca só 20 das 24, e essas 20 muito bem */
  await page.evaluate(() => document.getElementById('bAct').click());
  await page.waitForFunction(() => !!window.run, { timeout: 8000 });
  const fim4 = page.waitForFunction(() => !window.run, { timeout: 120000 });
  await page.evaluate(async () => {
    const w = ms => new Promise(r => setTimeout(r, ms));
    const feitas = new Set(); let i = 0;
    while (window.run) {
      const r = window.run; if (!r || !r.notas) break;
      const now = window.AC.currentTime;
      r.notas.forEach(n => {
        if (!n || feitas.has(n) || n.st !== 'espera' || !n.medida) return;
        if (now >= n.t + 0.004 && now < n.t + 0.044) {
          feitas.add(n);
          if (++i % 6 !== 0) window.hit(n.pad);   /* pula 1 em cada 6 */
        }
      });
      await w(3);
    }
  });
  await fim4;
  const r4 = await page.evaluate(() => ({
    saida: document.getElementById('rSaida').textContent,
    notas: document.getElementById('rP').textContent }));
  console.log('       ' + r4.notas + ' tocadas, cravadas  →  ' + r4.saida);
  t('tocar 5 de 6 notas, perfeitamente, NÃO passa mais na etapa C',
    /não passou/.test(r4.saida), r4.saida);
  t('e o app diz que faltaram notas, em vez de só "não passou"',
    /faltaram notas/.test(r4.saida), r4.saida);

  console.log('\n--- 5. o exercício denso dura o mesmo, e continua com silêncio ---');
  const dur = await page.evaluate(() => window.EXERCICIOS.map(ex => {
    const comps = window.compassosDoPortao(ex, 'C');
    let mudos = 0;
    for (let c = 0; c < comps; c++) if (!window.pulsoAudivel('C', c)) mudos++;
    return { id: ex.id, eventosPorComp: window.eventosPorCompasso(ex),
             compassos: comps, mudos: mudos,
             esperados: window.eventosPorCompasso(ex) * comps };
  }));
  dur.forEach(d => console.log('       ' + d.id.padEnd(14) + d.eventosPorComp + ' ev/comp · ' +
    d.compassos + ' compassos · ' + d.mudos + ' mudos · ' + d.esperados + ' notas'));
  t('nenhum exercício vira maratona: a execução não cresce com a densidade',
    dur.every(d => d.esperados <= 40), JSON.stringify(dur.map(d => d.id + '=' + d.esperados)));
  t('e TODO exercício tem compasso em silêncio, por mais denso que seja',
    dur.every(d => d.mudos >= 2), JSON.stringify(dur.map(d => d.mudos)));

  console.log('\n--- 6. a régua fica gravada no diário ---');
  const dj = await page.evaluate(() => ({ texto: window.textoDiario(), regua: window.REGUA }));
  t('o cabeçalho anuncia a régua', dj.texto.indexOf('régua ' + dj.regua) >= 0,
    dj.texto.split('\n')[1]);
  {
    const linhas = dj.texto.split('\n').filter(l => /^\d{4}-\d\d-\d\d/.test(l));
    const ruins = linhas.filter(l => {
      const c = l.trim().split(/\s+/);
      return c[c.length - 2] !== String(dj.regua);   /* penúltimo campo = régua */
    });
    t('e toda linha carrega a régua com que foi medida',
      linhas.length > 0 && ruins.length === 0,
      ruins.length ? ruins.length + ' de ' + linhas.length + ' sem régua: ' + ruins[0]
                   : linhas.length + ' linhas');
  }
  t('a coluna de deriva está lá', /deriv/.test(dj.texto));

  console.log('\n--- 7. a retrospectiva fica na tela depois da execução ---');
  const retro = await page.evaluate(() => ({
    temUltimo: !!window.ultimo,
    perfil: window.ultimo && window.ultimo.perfil.map(p => ({ st: p.st, n: p.n })),
    veuEscondido: document.getElementById('veu').hidden,
    rotulos: [0, 1, 4, 8, 12].map(window.rotuloPasso)
  }));
  console.log('       perfil: ' + JSON.stringify(retro.perfil) +
              ' · véu escondido: ' + retro.veuEscondido);
  t('o último resultado fica guardado em vez de ser apagado', retro.temUltimo);
  t('e o perfil tem uma entrada por posição tocada',
    retro.perfil && retro.perfil.length > 0 && retro.perfil.every(p => p.n > 0),
    JSON.stringify(retro.perfil));
  t('o véu "a pista aparece quando você começar" sai da frente',
    retro.veuEscondido === true);
  t('as posições têm nome legível para quem nunca leu partitura',
    retro.rotulos.join(' ') === '1 1e 2 3 4', retro.rotulos.join(' '));
  /* e some ao recomeçar */
  await prepara(page, 'C', 'h1-pulso');
  await page.evaluate(() => document.getElementById('bAct').click());
  await page.waitForFunction(() => !!window.run, { timeout: 8000 });
  const durante = await page.evaluate(() => window.ultimo);
  await page.evaluate(() => document.getElementById('bAct').click());
  await page.waitForTimeout(300);
  t('a retrospectiva sai da tela quando a execução nova começa', durante === null);

  console.log('\n--- 8. a tela diz o que fazer, e dá para recomeçar do zero ---');
  await page.evaluate(() => { localStorage.clear(); });
  await page.reload();
  await page.waitForTimeout(400);
  const estreia = await page.evaluate(() => ({
    veu: document.getElementById('veu').innerText,
    escondido: document.getElementById('veu').hidden,
    botao: document.getElementById('bAct').textContent
  }));
  console.log('       ' + estreia.veu.replace(/\n/g, ' | '));
  t('a primeira tela explica o que fazer em vez de "a pista aparece quando você começar"',
    !estreia.escondido && !/a pista aparece/.test(estreia.veu) && estreia.veu.length > 30,
    estreia.veu);
  t('e aponta para o botão que conduz tudo',
    /bot.o laranja/.test(estreia.veu) && /escutar/i.test(estreia.botao),
    estreia.veu + ' · botão=' + estreia.botao);
  t('as três linhas ficam separadas (o flex engolia o <br> e as frases grudavam)',
    estreia.veu.split('\n').filter(l => l.trim()).length === 3,
    JSON.stringify(estreia.veu.split('\n')));

  for (const et of ['A', 'B', 'C']) {
    await prepara(page, et, 'h1-pulso');
    const v = await page.evaluate(() => document.getElementById('veu').innerText);
    t('a etapa ' + et + ' se explica na própria pista',
      v.length > 30 && !/a pista aparece/.test(v), v.replace(/\n/g, ' | '));
  }

  /* o botão de recomeçar: dois cliques, e só o segundo apaga */
  await page.evaluate(() => document.getElementById('bDiario').click());
  await page.waitForTimeout(150);
  await page.evaluate(() => { localStorage.setItem('musga.mapa', '{"x":1}'); });
  await page.evaluate(() => document.getElementById('bZerar').click());
  await page.waitForTimeout(150);
  const armado = await page.evaluate(() => ({
    texto: document.getElementById('bZerar').textContent,
    mapaAindaLa: localStorage.getItem('musga.mapa') !== null }));
  t('um clique só ARMA e pergunta, não apaga', /mesmo\?/.test(armado.texto) && armado.mapaAindaLa,
    armado.texto + ' · mapa ainda lá: ' + armado.mapaAindaLa);
  await page.evaluate(() => document.getElementById('bZerar').click());
  await page.waitForTimeout(700);
  const zerado = await page.evaluate(() =>
    ['musga.diario','musga.mapa','musga.lat','musga.hist'].every(k => localStorage.getItem(k) === null));
  t('o segundo clique apaga tudo e recarrega', zerado);

  console.log('\n--- console ---');
  t('nenhum erro de JavaScript', erros.length === 0, erros.join(' | '));

  await browser.close();
  console.log('\n' + (fail ? 'REPROVADO' : 'APROVADO') + ' — ' + pass + ' passaram, ' + fail + ' falharam\n');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERRO NA PROVA: ' + e.message); process.exit(1); });
