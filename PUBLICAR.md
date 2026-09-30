# Como publicar o MUSGA

O app vive em **https://renatoremiro.github.io/musga/** (GitHub Pages, repositório
`renatoremiro/musga`, branch `main`, raiz). `index.html` é cópia exata de `musga.html`.

## Numa sessão do Claude (o caminho normal)
1. O Claude pede um **código de uso único** e você autoriza em https://github.com/login/device.
   A autorização vale só durante a sessão; nenhum token é guardado na pasta.
2. O Claude copia a pasta para um repositório temporário, faz `cp musga.html index.html`,
   commit e push. O Pages republica em ~1 minuto.
3. Conferência obrigatória: o *blob sha* do `index.html` no GitHub tem de ser igual a
   `git hash-object musga.html` na pasta. Sem isso, não está publicado.

## À mão, sem o Claude (5 minutos)
github.com/renatoremiro/musga → *Add file → Upload files* → arraste `musga.html` **e** uma
cópia renomeada `index.html` → *Commit changes*. Pronto.

## No iPhone
Safari (não Chrome) → compartilhar → **Adicionar à Tela de Início**. Alto-falante ou fone com
fio. Depois de cada versão nova: abrir, fechar e abrir de novo (o ícone guarda a página em cache).

## O que o portão exige antes de publicar
`node portao.js --navegador` verde. Nunca publicar com o portão fechado.
