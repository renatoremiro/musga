# Como desenvolvedores profissionais trabalham — referência de consulta

Levantamento feito para este projeto: um app web em HTML/CSS/JS puro, arquivo único, sem build,
construído por uma pessoa só com ajuda de IA. **Filtrado para esse tamanho** — o que é cerimônia de
time grande está marcado como tal.

---

## 1 · Disciplina de projeto

| Prática | O que é | Vale sozinho? |
|---|---|---|
| **ADR** (Architecture Decision Records) | Um `.md` curto por decisão importante, registrando o **porquê**, não o quê | **Sim.** Em três meses você esquece a razão da escolha, e reler é mais rápido que reconstruir. Template pronto: [MADR](https://github.com/adr/madr) |
| **Definition of Done** | Checklist curta antes de dar algo por pronto | **Sim.** Evita "terminar" pela metade |
| **Issues** | Bugs e ideias fora da cabeça — pode ser um `TODO.md` | **Sim** |
| **Conventional Commits** | `feat:`, `fix:`, `refactor:` no começo do commit | **Sim.** Gera changelog automático depois |
| **Changelog** | `CHANGELOG.md` manual por versão | **Sim.** Barato |
| **Semver** | `MAIOR.MENOR.CORREÇÃO` | Só se você publica como biblioteca. Marcar *tags* no git já basta |
| **Feature flags, trunk-based** | — | **Não.** Cerimônia de time grande |

## 2 · Qualidade de código

Para JS puro sem build, nesta ordem:

1. **Biome** — lint + formatação num binário só, sem configuração. (Alternativa: ESLint + Prettier,
   mais plugins e mais configuração. **oxlint** é mais rápido ainda mas com menos regras.)
2. **JSDoc + `tsc --checkJs --noEmit`** — checagem de tipo escrevendo só comentários, sem adotar
   TypeScript nem mudar extensão de arquivo.
3. **knip** — acha arquivo, export e dependência que ninguém usa. Sucessor de `depcheck` e `ts-prune`.

[Biome](https://biomejs.dev/) · [knip](https://knip.dev/)

## 3 · Testes — o bloco que mais importa aqui

> O erro que este projeto cometeu é clássico: a suíte cobria uma função pura que o app **nunca
> chamava**, enquanto a lógica de verdade estava reimplementada à mão e sem teste. Os testes
> passavam e não provavam nada.

**Cobertura de código** — `node --test --experimental-test-coverage` (nativo) ou `c8`. **Cobertura
alta não garante nada:** mostra que a linha *rodou*, não que o resultado foi *verificado*. No nosso
caso a função morta tinha cobertura e a função real tinha zero — e nenhuma ferramenta de cobertura
apontaria isso sozinha.

**Mutation testing — [Stryker](https://stryker-mutator.io/)** — altera pequenos trechos do código
(troca `+` por `-`, `<` por `<=`, remove uma linha) e roda a suíte. Se os testes continuam passando,
o mutante "sobreviveu": teste fraco ou inútil. **É a ferramenta que teria pego nosso bug.** Roda
antes de release, não a cada commit — é lento.

**Property-based — [fast-check](https://fast-check.dev/)** — em vez de `soma(2,3)===5`, declara-se
uma propriedade e a ferramenta gera centenas de entradas tentando quebrá-la. Vale onde há invariante
matemático: cálculo de tempo, bpm, quantização de batida. É onde jogo rítmico mais ganha, porque
erro de arredondamento aparece em caso-limite que ninguém escreveria à mão.

**Golden/snapshot** — grava a saída correta uma vez e compara depois.
**Characterization tests** — capturam o comportamento *atual* antes de refatorar, como rede.

**Testar pela interface pública** — testar a função que o app chama, não uma cópia interna extraída
"para ficar mais testável". **É isto que teria evitado o nosso problema:** se o teste chamasse a
mesma função que o app chama, a duplicação seria impossível.

**`node:test` ou Vitest?** Para arquivo único sem build, `node:test` + `c8` resolve. Não trocar agora.

## 4 · Depuração e otimização — Chrome DevTools

- **Performance** — onde o tempo de CPU foi, quadro a quadro. Procurar *long tasks* acima de 50 ms.
- **Memory** — dois *heap snapshots* separados no tempo, comparados. Suspeitos num app de áudio e
  canvas: `setInterval` nunca limpo, `requestAnimationFrame` sem `cancelAnimationFrame`, listener
  adicionado repetidamente, nós de áudio criados por nota sem desconectar.
- **Coverage** — código carregado e nunca executado. Acha função morta no código de produção.
- **Lighthouse** — performance, acessibilidade, boas práticas, nota 0–100. Rodar antes de release.

Num app com canvas e áudio, medir primeiro: **estabilidade do quadro** e **latência de áudio**
(diferença entre o tempo agendado no `AudioContext` e o disparo real). Peso de arquivo é irrelevante
aqui.

## 5 · Acessibilidade — o mínimo defensável

Contraste ≥ 4,5:1 em texto normal e ≥ 3:1 em texto grande (WCAG AA) · foco sempre visível, nunca
`outline:none` sem substituto · `prefers-reduced-motion` respeitado, importante num jogo rítmico com
piscadas · **axe DevTools** (extensão gratuita) uma vez por release.

## 6 · Onde consultar

| Fonte | Para quê |
|---|---|
| [MDN](https://developer.mozilla.org) | Referência de API. Primeiro lugar, sempre |
| [web.dev](https://web.dev) | Performance, Core Web Vitals, e áudio |
| [caniuse](https://caniuse.com) | Compatibilidade entre navegadores |
| [patterns.dev](https://patterns.dev) | Padrões de arquitetura front-end |
| [refactoring.guru](https://refactoring.guru) | Padrões de projeto e *code smells* |
| [javascript.info](https://javascript.info) | JS a fundo, bem estruturado |
| [You Don't Know JS](https://github.com/getify/You-Dont-Know-JS) | Mecanismos internos do JS |
| [Game Programming Patterns](https://gameprogrammingpatterns.com) | Livro grátis. "Game Loop" e "Update Method" se aplicam direto aqui |
| [A Tale of Two Clocks](https://web.dev/articles/audio-scheduling) | O artigo canônico de sincronismo em áudio web |
| [Web Audio para jogos](https://web.dev/articles/webaudio-games) | Áudio em jogo, no navegador |
| [Nielsen Norman Group](https://nngroup.com) · [Laws of UX](https://lawsofux.com) | Heurísticas de usabilidade |

## 7 · De onde baixar código e material

**GitHub** — buscar por *topics* (`github.com/topics/rhythm-game`, `topics/web-audio`). Antes de
usar: estrelas, **data do último commit** (abandonado é risco), issues abertas sem resposta, e o
arquivo `LICENSE`. **npm** — ler o `package.json` do pacote antes de instalar, ver o que ele arrasta
junto, rodar `npm audit`. **Awesome lists** — curadoria por tema. **CodePen / Observable** — para
estudar técnica isolada, não para copiar sem entender.

### Licenças, em uma frase

| Licença | O que exige |
|---|---|
| **MIT** | Usar, modificar e vender livremente. Só manter o aviso de copyright |
| **Apache-2.0** | Como MIT, mais declarar mudanças. Dá proteção explícita de patente |
| **GPL** | Se distribuir, o código combinado também vira aberto. **Cuidado em projeto fechado** |
| **CC0** | Domínio público. Nem crédito exige |
| **CC-BY** | Livre, mas com crédito ao autor |

**Áudio:** [Freesound](https://freesound.org) (filtrar por CC0) · [Incompetech](https://incompetech.com) (CC-BY).
**Tipografia:** [Google Fonts](https://fonts.google.com) (Apache/OFL) · [Font Squirrel](https://www.fontsquirrel.com).

## 8 · IA no fluxo de trabalho

O consenso: **código gerado por IA exige revisão humana** — não porque erra sempre, mas porque o
padrão de erro é diferente do humano. Código que *parece* correto, roda, e tem defeito sutil de
lógica. Exatamente o nosso caso: teste plausível, cobrindo a função errada.

Há estudos de 2025–2026 apontando taxa de defeito maior em código gerado por IA sem revisão — alguns
relatos citam 1,7× a 2×, com variação grande de metodologia (**tratar como indício, não como
número**).

Duas práticas assentadas:
- **Testes como contrato** — a IA satisfaz um teste que **você** entende e validou. Nunca aceitar
  teste e implementação escritos juntos sem checar se o teste testa a coisa certa. *(É exatamente
  onde este projeto falhou.)*
- **Contexto em arquivo** — `CLAUDE.md` / `AGENTS.md` na raiz, com as convenções do projeto, lido
  automaticamente a cada sessão.

## 9 · O mínimo defensável, em ordem

1. Testes chamando a função que o app chama — **nunca uma cópia paralela**
2. `node --test --experimental-test-coverage` antes de cada commit
3. **Biome**
4. **knip** de vez em quando
5. **Stryker** antes de release
6. **fast-check** só nas funções de tempo e bpm
7. DevTools quando notar travamento, não por rotina
8. `ADR.md` e `CHANGELOG.md` — cinco minutos por decisão

**Dispensável no nosso tamanho:** feature flags, trunk-based formal, semver rígido, CI corporativo,
TypeScript completo, Vitest, suíte de acessibilidade em CI, e qualquer processo de time.
