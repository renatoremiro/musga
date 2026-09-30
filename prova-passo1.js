/* prova-passo1.js — prova NO NAVEGADOR que o Passo 1 fez o que promete.
 *
 * Os testes unitários já mentiram antes neste projeto: passavam sobre uma
 * função que o aplicativo não chamava. Então as três correções do Passo 1
 * são verificadas aqui de novo, no app de verdade, com o robô da auditoria.
 *
 *   node prova-passo1.js
 */
const { chromium } = require('playwright');
const path = require('path');

const URL = 'file://' + path.join(__dirname, 'musga.html');
let pass = 0, fail = 0;
const t = (n, c, x) => { c ? (pass++, console.log('  ok   ' + n))
                           : (fail++, console.log('  FALHA ' + n + (x !== undefined ? '  → ' + x : ''))); };

/* Toca uma execução inteira batendo com ATRASO fixo em relação a cada nota.
   É o robô que a auditoria cega usou para graduar tocando 110 ms atrasado:
   não lê a tela, só reage. Devolve as métricas e o veredito do app. */
async function executa(page, atrasoMs) {
  await page.evaluate(async (atraso) => {
    const espera = ms => new Promise(r => setTimeout(r, ms));
    while (!window.run) await espera(20);
    const feitas = new Set();
    while (window.run) {
      const r = window.run;
      if (!r || !r.notas) break;
      const agora = window.AC.currentTime;
      r.notas.forEach((n, i) => {
        if (!n || feitas.has(n) || n.st !== 'espera') return;
        const alvo = n.t + atraso / 1000;
        if (agora >= alvo && agora < alvo + 0.05) { feitas.add(n); window.hit(n.pad); }
      });
      await espera(4);
    }
  }, atrasoMs);
}

async function umaExecucao(page, atrasoMs) {
  await page.evaluate(() => { const b = document.getElementById('bAct'); if (b) b.click(); });
  await page.waitForFunction(() => !!window.run, { timeout: 8000 });
  const p = executa(page, atrasoMs);
  await page.waitForFunction(() => !window.run, { timeout: 90000 });
  await p;
  return page.evaluate(() => ({
    saida: (document.getElementById('rSaida') || {}).textContent || '',
    frase: (document.getElementById('rFrase') || {}).textContent || '',
    vies: (document.getElementById('rB') || {}).textContent || '',
    firmeza: (document.getElementById('rS') || {}).textContent || '',
    estado: JSON.parse(JSON.stringify(window.estado(window.mapa, 'h1-pulso'))),
    lat: window.lat, latFonte: window.latFonte, ref: window.viesRef
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

  console.log('\n--- 1. collectDrift foi removido de verdade ---');
  const some = await page.evaluate(() => ({
    temCollect: typeof window.collectDrift,
    temDrift: typeof window.drift,
    temSemear: typeof window.semearLatencia,
    fonte: window.latFonte
  }));
  t('collectDrift não existe mais no app', some.temCollect === 'undefined', some.temCollect);
  t('o acumulador drift também sumiu', some.temDrift === 'undefined', some.temDrift);
  t('semearLatencia existe no lugar', some.temSemear === 'function');
  t('sem calibração, a latência começa sem fonte', some.fonte === 'nenhuma', some.fonte);

  console.log('\n--- 2. a semente vem do navegador, e semente não é calibração ---');
  await page.evaluate(() => window.ac());
  await page.waitForTimeout(400);
  await page.evaluate(() => window.ac());
  const sem = await page.evaluate(() => ({
    fonte: window.latFonte, lat: window.lat,
    outputLatency: window.AC.outputLatency, baseLatency: window.AC.baseLatency,
    calibrado: window.temReferencia(),
    pulsa: document.getElementById('bCalib').classList.contains('pulse'),
    rotulo: document.getElementById('scrLat').textContent,
    salvo: localStorage.getItem('musga.ref')
  }));
  console.log('       outputLatency=' + sem.outputLatency + '  lat=' + sem.lat + '  fonte=' + sem.fonte);
  t('a latência foi semeada pelo navegador, preferindo outputLatency',
    sem.fonte === 'navegador' && sem.lat > 0 &&
    sem.lat === (sem.outputLatency > 0 ? sem.outputLatency : sem.baseLatency),
    JSON.stringify(sem));
  t('o número do navegador NÃO conta como ponto medido', sem.calibrado === false);
  t('o botão de medir CONTINUA pulsando', sem.pulsa === true);
  t('o rótulo diz de onde o número veio', /navegador/.test(sem.rotulo), sem.rotulo);
  t('o número do navegador NÃO é persistido (o aparelho pode mudar)', sem.salvo === null, sem.salvo);

  console.log('\n--- 3. O CASO DA AUDITORIA: robô a +110 ms não gradua ---');
  /* pula a escuta obrigatória: ela não é execução avaliada e gastaria uma das
     quatro tentativas que a auditoria usou para graduar */
  await page.evaluate(() => {
    window.mapa = window.marcarSentiu(window.mapa, 'h1-pulso');
    window.salvarMapa();
    /* A latência precisa estar MEDIDA: sem isso o app se recusa, com razão,
       a acusar alguém de viés — o número seria a semente do navegador, que
       no Chrome do Renato errou por 33 ms. O caso que este bloco testa é o
       do jogador deslocado DEPOIS de medir. */
    /* o PONTO DE REFERÊNCIA medido em zero: esta pessoa bate em cima de um
       clique sozinho. Então todo deslocamento no exercício é dela. */
    window.viesRef = 0; window.refFonte = 'medida';
    window.planejar();
  });
  const latAntes = await page.evaluate(() => window.lat);
  const refAntes = await page.evaluate(() => window.viesRef);
  const r1 = await umaExecucao(page, 110);
  console.log('       etapa A → ' + r1.saida.replace(/\s+/g, ' ').trim().slice(0, 70));
  console.log('       frase: ' + r1.frase + '   viés=' + r1.vies + ' firmeza=' + r1.firmeza);
  t('nem a latência nem o ponto mudaram durante a execução — nada absorveu o erro do músico',
    r1.lat === latAntes && r1.ref === refAntes,
    'lat ' + latAntes + '→' + r1.lat + ' · ponto ' + refAntes + '→' + r1.ref);
  /* O robô bate 110 ms depois da nota; o navegador informou 32 ms de latência
     de saída, que é do DISPOSITIVO e é subtraída com razão. Sobra o erro do
     músico, ~78 ms — e é esse que o app tem de enxergar e dizer. */
  t('o app mede o deslocamento e diz qual é, comparando com o clique simples',
    /mais atrasado/i.test(r1.frase) && /clique sozinho/.test(r1.frase), r1.frase);
  t('o viés medido é o do músico, já descontada a latência do aparelho',
    Math.abs(parseInt(r1.vies, 10) - (110 - Math.round(latAntes * 1000))) <= 20,
    'medido=' + r1.vies + ' esperado≈' + (110 - Math.round(latAntes * 1000)));
  t('e a firmeza é ótima — era ELA que sozinha aprovava tudo antes',
    Math.abs(parseInt(r1.firmeza, 10)) <= 35, r1.firmeza);
  /* A etapa A não tem portão de tempo POR PROJETO: com a pista na tela, ela
     pergunta "você sabe quais notas e onde", não "você está no tempo". O muro
     do viés é em B e em C, e é lá que este robô tem de parar. */
  t('etapa A não tem portão de tempo, por projeto',
    await page.evaluate(() => window.limiteFirmeza('A', 0) === null &&
                              window.limiteVies('A') === null));

  const r2 = await umaExecucao(page, 110);
  const r3 = await umaExecucao(page, 110);
  const r4 = await umaExecucao(page, 110);
  console.log('       depois de 4: etapa=' + r4.estado.etapa +
              ' graduado=' + r4.estado.graduado +
              '  →  ' + r4.saida.replace(/\s+/g, ' ').trim().slice(0, 70));
  t('quatro execuções a +110 ms e o exercício NÃO graduou',
    r4.estado.graduado === null, JSON.stringify(r4.estado));
  t('e ele NÃO passou de B — o muro está onde tem de estar',
    r4.estado.etapa === 'A', r4.estado.etapa);
  t('a latência seguiu intocada nas quatro', r4.lat === latAntes, r4.lat);

  /* e o contrário: SEM medir, a etapa C não pode valer */
  const semMedir = await page.evaluate(() => {
    const m = { n: 24, P: 1, L: 1, B: 0.08, S: 0.008, ref: null };
    return { C: window.motivoReprova('C', m, 0), B: window.motivoReprova('B', m, 0),
             frase: window.PORQUE[window.motivoReprova('C', m, 0)] };
  });
  console.log('       sem calibrar → etapa C: ' + semMedir.C + ' · etapa B: ' + semMedir.B);
  t('sem o ponto medido a etapa C não vale, e o app diz por quê',
    semMedir.C === 'calibrar' && /MEDIR VOCÊ/.test(semMedir.frase), JSON.stringify(semMedir));
  t('mas as etapas A e B continuam livres — jogar não depende de medir',
    semMedir.B === null);

  /* prova direta: o mesmo robô, jogando a etapa C, reprova */
  const naC = await page.evaluate((atraso) => {
    const m = { n: 24, casados: 24, excedentes: 0, P: 1, L: 1,
                B: (atraso - window.lat * 1000) / 1000, ref: 0, S: 0.008 };
    return { C: window.passou('C', m, 0), B: window.passou('B', m, 4),
             vies: Math.round(Math.abs(m.B) * 1000),
             teto: Math.round(window.limiteVies('C') * 1000) };
  }, 110);
  console.log('       viés do músico=' + naC.vies + ' ms  ·  teto=' + naC.teto + ' ms');
  t('o mesmo desempenho REPROVA a etapa C', naC.C === false);
  t('e reprova a B mesmo com todo o afrouxamento — o viés nunca afrouxa',
    naC.B === false);

  console.log('\n--- 4. controle: quem toca certo continua passando ---');
  await page.evaluate(() => { localStorage.clear(); });
  await page.reload();
  await page.evaluate(() => window.ac());
  await page.waitForTimeout(300);
  /* pula a escuta obrigatória para chegar ao treino */
  await page.evaluate(() => {
    window.mapa = window.marcarSentiu(window.mapa, 'h1-pulso');
    window.salvarMapa(); window.planejar();
  });
  const ok1 = await umaExecucao(page, 4);
  console.log('       saída: ' + ok1.saida.replace(/\s+/g, ' ').trim().slice(0, 90));
  t('tocando cravado, a execução passa',
    /passou|conquistad|confirmad/i.test(ok1.saida), ok1.saida.slice(0, 120));

  console.log('\n--- 5. simetria: atrasar custa o mesmo que adiantar ---');
  const sim = await page.evaluate(() => {
    const notas = () => [{ pad: 'kick', t: 1.0, st: 'espera' }];
    const d = 0.150;
    return {
      atrasado: !!window.casar(1.0 + d, notas(), 'kick', 0),
      adiantado: !!window.casar(1.0 - d, notas(), 'kick', 0),
      venceuAtrasado: window.venceu(notas()[0], 1.0 + d),
      janela: window.JANELA
    };
  });
  t('150 ms atrasado casa com a nota', sim.atrasado);
  t('150 ms adiantado casa com a nota', sim.adiantado);
  t('e a nota não venceu antes de o toque poder casar', sim.venceuAtrasado === false);
  t('as duas janelas são o mesmo número', sim.janela.limite === 0.180, JSON.stringify(sim.janela));

  console.log('\n--- console ---');
  t('nenhum erro de JavaScript na página', erros.length === 0, erros.join(' | '));

  await browser.close();
  console.log('\n' + (fail ? 'REPROVADO' : 'APROVADO') + ' — ' + pass + ' passaram, ' + fail + ' falharam\n');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERRO NA PROVA: ' + e.message); process.exit(1); });
