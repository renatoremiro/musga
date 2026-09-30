/* portao.js — o "definition of done" do projeto, num comando só.
 *
 *   node portao.js
 *
 * Roda os três portões e só abre se os três passarem:
 *   test-timing.js  — a matemática de tempo: relógio, calibração, julgamento
 *   test-nucleo.js  — métricas, diagnóstico, progressão, saneamento de dados
 *   test-vivo.js    — alcançabilidade: nenhuma função pura morta, nenhuma
 *                     segunda implementação, nenhuma função viva sem teste
 *
 * Nada é dado por pronto com o portão fechado.
 */

const { execFileSync } = require('child_process');
const path = require('path');

const PORTOES = ['test-timing.js', 'test-nucleo.js', 'test-vivo.js'];

/* As provas de navegador rodam o app de verdade, com um robô tocando, e por
   isso levam minutos em vez de segundos. Ficam fora do portão rápido, mas
   NÃO são descartáveis: entram com `node portao.js --navegador`, e é assim
   que se fecha antes de dar qualquer coisa por pronta.
   Elas existem porque os testes unitários já mentiram aqui: passavam sobre
   uma função que o aplicativo não chamava. */
const NAVEGADOR = ['prova-passo1.js', 'prova-passo2.js', 'prova-passo3.js', 'prova-calib.js', 'prova-relogio.js', 'prova-celular.js'];

const comNavegador = process.argv.includes('--navegador');
const lista = comNavegador ? PORTOES.concat(NAVEGADOR) : PORTOES;
const falhas = [];

lista.forEach(f => {
  console.log('\n══════ ' + f + ' ══════');
  try {
    execFileSync(process.execPath, [path.join(__dirname, f)], {
      stdio: 'inherit',
      env: Object.assign({ PLAYWRIGHT_BROWSERS_PATH: '/opt/pw-browsers' }, process.env)
    });
  } catch (e) {
    falhas.push(f);
  }
});

console.log('\n' + '═'.repeat(48));
if (falhas.length) {
  console.log('PORTÃO FECHADO — reprovou em: ' + falhas.join(', '));
  console.log('═'.repeat(48) + '\n');
  process.exit(1);
}
console.log('PORTÃO ABERTO — ' + lista.length + ' suítes passaram' +
            (comNavegador ? ' (com prova de navegador)' : ' · falta: node portao.js --navegador'));
console.log('═'.repeat(48) + '\n');
