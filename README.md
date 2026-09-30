# MUSGA

Treinador de ritmo para quem nunca tocou nada. Um arquivo HTML, bateria 100% sintetizada
(Web Audio), zero build, zero servidor.

**Jogar:** https://renatoremiro.github.io/musga/ — no celular, abra no Safari e use
*Adicionar à Tela de Início*. Alto-falante ou fone com fio; Bluetooth atrasa demais para medir ritmo.

`index.html` é uma cópia exata de `musga.html` (o arquivo canônico); os dois são publicados juntos.

Documentação: `CLAUDE.md` (índice), `DECISOES.md` (o que está fechado e por quê), `PLANO.md`
(ordem dos passos), `AUDITORIA-v5.md` (auditoria vigente, escrita como especificação).

Portão de qualidade: `node portao.js` (rápido) · `node portao.js --navegador` (com Playwright).
