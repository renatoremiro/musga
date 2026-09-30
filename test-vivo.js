/* test-vivo.js — o portão que impede o erro que a auditoria cega encontrou.
 *
 * A auditoria achou uma função pura testada que o aplicativo NUNCA chamava:
 * a lógica de verdade estava reimplementada à mão em outro lugar, sem teste.
 * Os testes passavam e não provavam nada.
 *
 * Este arquivo faz análise de alcançabilidade: monta o grafo de chamadas dos
 * blocos puros e verifica que toda função definida ali é alcançável a partir
 * do código do aplicativo. Função pura que ninguém chama é REPROVAÇÃO — ou é
 * código morto, ou é uma segunda implementação paralela da coisa certa.
 *
 * Roda com: node test-vivo.js
 */

const fs = require('fs');
const src = fs.readFileSync(__dirname + '/musga.html', 'utf8');
const script = src.match(/<script>([\s\S]*)<\/script>/)[1];

/* remove comentários e strings, para não contar menção em texto como uso */
function limpar(s) {
  return s
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ')
    .replace(/'(\\.|[^'\\])*'/g, "''")
    .replace(/"(\\.|[^"\\])*"/g, '""')
    .replace(/`(\\.|[^`\\])*`/g, '``');
}
function bloco(nome) {
  const m = script.match(new RegExp('/\\*===\\s*' + nome + ':START\\s*===\\*/([\\s\\S]*?)/\\*===\\s*' + nome + ':END\\s*===\\*/'));
  if (!m) { console.error('FALHA: bloco ' + nome + ' não encontrado'); process.exit(1); }
  return m[0];
}

const BLOCOS = ['PURE', 'NUCLEO'];
const textoPuro = BLOCOS.map(bloco).join('\n');
let app = script;
BLOCOS.forEach(n => { app = app.replace(bloco(n), ' '); });
const puroLimpo = limpar(textoPuro), appLimpo = limpar(app);

/* nomes definidos nos blocos puros */
const funcoes = [...textoPuro.matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\(/g)].map(m => m[1]);
const constantes = [...textoPuro.matchAll(/\bvar\s+([A-Z][A-Z0-9_]{2,})\s*=/g)].map(m => m[1]);

let pass = 0, fail = 0;
function t(nome, cond, extra) {
  if (cond) { pass++; console.log('  ok   ' + nome); }
  else { fail++; console.log('  FALHA ' + nome + (extra !== undefined ? '  → ' + extra : '')); }
}
const usos = (nome, texto) => {
  const re = new RegExp('\\b' + nome.replace(/\$/g, '\\$') + '\\b', 'g');
  return (texto.match(re) || []).length;
};
/* corpo de uma função dentro do texto puro, por contagem de chaves */
function corpo(nome) {
  const i = puroLimpo.search(new RegExp('function\\s+' + nome + '\\s*\\('));
  if (i < 0) return '';
  let j = puroLimpo.indexOf('{', i), n = 0;
  for (let k = j; k < puroLimpo.length; k++) {
    if (puroLimpo[k] === '{') n++;
    else if (puroLimpo[k] === '}') { n--; if (!n) return puroLimpo.slice(j, k + 1); }
  }
  return puroLimpo.slice(j);
}

console.log('\n--- inventário ---');
t('os blocos puros existem e têm funções', funcoes.length > 0, funcoes.length + ' funções');
t('nenhuma função definida duas vezes',
  new Set(funcoes).size === funcoes.length,
  funcoes.filter((f, i) => funcoes.indexOf(f) !== i).join(','));

console.log('\n--- alcançabilidade: toda função pura é chamada pelo aplicativo? ---');
/* raízes: funções puras mencionadas no código do app (fora dos blocos puros) */
const raizes = funcoes.filter(f => usos(f, appLimpo) > 0);
t('o aplicativo chama pelo menos uma função pura', raizes.length > 0);

/* propagação: quem é chamado por quem já é alcançável, também é */
const vivo = new Set(raizes);
const corpos = {};
funcoes.forEach(f => { corpos[f] = corpo(f); });
let mudou = true;
while (mudou) {
  mudou = false;
  [...vivo].forEach(f => {
    funcoes.forEach(g => {
      if (vivo.has(g)) return;
      if (usos(g, corpos[f]) > 0) { vivo.add(g); mudou = true; }
    });
  });
}
const mortas = funcoes.filter(f => !vivo.has(f));
t('NENHUMA função pura é código morto', mortas.length === 0,
  mortas.length ? 'mortas: ' + mortas.join(', ') : '');

console.log('\n--- constantes ---');
const constMortas = constantes.filter(c =>
  usos(c, appLimpo) === 0 && !funcoes.some(f => vivo.has(f) && usos(c, corpos[f]) > 0));
t('nenhuma constante pura é código morto', constMortas.length === 0, constMortas.join(', '));

console.log('\n--- segunda implementação: o erro original ---');
/* A lógica de casamento toque↔nota tem que existir em UM lugar só, e ser pura.
   Se o app percorre notas comparando tempo por conta própria, é reimplementação. */
const suspeita = /run\.notas\.forEach[\s\S]{0,400}?(st\s*!==\s*''|Math\.abs\s*\()/.test(appLimpo);
t('o app NÃO percorre as notas casando tempo por conta própria',
  !suspeita, suspeita ? 'há laço sobre run.notas comparando tempo fora do bloco puro' : '');

console.log('\n--- camada de aplicação: nenhuma função morta ali também ---');
/* O BURACO QUE ESTE GUARDA TINHA.
   Ele vigiava só os blocos PURE e NUCLEO. A auditoria cega seguinte achou
   soltarEscolha() — definida e nunca chamada — na camada de aplicação, três
   metros ao lado, onde ninguém olhava. Era a MESMA classe de erro que este
   arquivo nasceu para impedir, num lugar que ele não cobria. O estrago:
   um toque numa linha do mapa prendia a pessoa àquele exercício pela sessão
   inteira e desligava a graduação em silêncio.
   Agora o arquivo inteiro é varrido. Funções que só o HTML chama (onclick) e
   as que são penduradas em window ficam de fora por nome declarado. */
const EXTERNAS = [];   /* nada hoje: todos os ouvintes são addEventListener */
const fnApp = [...app.matchAll(/^\s*function\s+([A-Za-z_$][\w$]*)\s*\(/gm)].map(m => m[1]);
const mortasApp = fnApp.filter(f =>
  EXTERNAS.indexOf(f) < 0 &&
  usos(f, appLimpo) <= 1 &&            /* 1 = só a própria definição */
  !new RegExp('\\b' + f + '\\b').test(src.replace(script, ' ')));
t('NENHUMA função da camada de aplicação é código morto',
  mortasApp.length === 0,
  mortasApp.length ? 'mortas: ' + mortasApp.join(', ') : fnApp.length + ' funções varridas');

console.log('\n--- toda função pura exercitada por algum teste? ---');
const testes = ['test-timing.js', 'test-nucleo.js']
  .filter(f => fs.existsSync(__dirname + '/' + f))
  .map(f => limpar(fs.readFileSync(__dirname + '/' + f, 'utf8'))).join('\n');
const semTeste = funcoes.filter(f => usos(f, testes) === 0);
t('toda função pura viva aparece em algum teste', semTeste.length === 0,
  semTeste.length ? 'sem teste: ' + semTeste.join(', ') : '');

console.log('\n--- nenhum teste órfão depois do process.exit ---');
/* Escrevi 32 testes DEPOIS da linha de `process.exit` de test-nucleo.js e
   nunca rodaram — o portão dizia 237 quando eram 269. É a mesma classe de
   erro que este arquivo existe para impedir, só que na suíte em vez de no
   app: código que parece vigiar e não vigia nada. */
['test-timing.js', 'test-nucleo.js'].forEach(f => {
  const txt = fs.readFileSync(__dirname + '/' + f, 'utf8');
  const i = txt.lastIndexOf('process.exit(');
  const depois = i < 0 ? '' : txt.slice(i);
  const orfaos = (depois.match(/^\s*t\(/gm) || []).length;
  t('nenhum teste de ' + f + ' fica depois do process.exit',
    i >= 0 && orfaos === 0,
    orfaos ? orfaos + ' teste(s) órfão(s) — o resumo tem de ser a última coisa do arquivo' : '');
});

console.log('\n' + (fail ? 'REPROVADO' : 'APROVADO') + ' — ' + pass + ' passaram, ' + fail + ' falharam\n');
process.exit(fail ? 1 : 0);
