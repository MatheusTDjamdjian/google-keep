# Google Keep (clone)

Uma recriação simplificada da interface do [Google Keep](https://keep.google.com), feita com **HTML, CSS e JavaScript puros**, sem frameworks e sem etapa de build.

As notas são carregadas de um arquivo JSON e exibidas num grid em estilo *masonry*. Elas podem ser filtradas por etiqueta, pesquisadas, abertas, arquivadas e enviadas para a lixeira.

## Funcionalidades

- **Grid masonry:** cada nota ocupa a altura de que precisa e o grid se reorganiza ao redimensionar a janela.
- **Pastas:** *Notas*, *Arquivo* e *Lixeira*.
  - Arquivar ou mandar para a lixeira tira a nota da pasta atual.
  - "Desarquivar" e "Restaurar" fazem a nota voltar.
  - Uma nota restaurada que estava arquivada volta para o *Arquivo*.
- **Etiquetas:** o menu lateral é montado automaticamente a partir das etiquetas presentes nas notas (`pessoal`, `escola`, `trabalho`).
- **Pesquisa:** busca em tempo real no título, no texto e nas etiquetas, dentro da pasta ou etiqueta selecionada.
- **Nota expandida:** um clique abre a nota em destaque. Fecha pelo botão *Fechar*, clicando fora dela ou com a tecla `Esc`.
- **Animações ao mover notas:**
  - A nota encolhe e "voa" até o ícone da pasta de destino, que pisca.
  - As outras notas deslizam para ocupar o espaço.
  - Aparece um aviso com o botão **Desfazer**.
  - As animações são desativadas quando o sistema pede "reduzir movimento".
- **Status salvo:** o que foi arquivado ou enviado para a lixeira fica salvo no navegador (`localStorage`) e continua lá depois de recarregar a página.
- **Modo escuro:** alternado pelo ícone de sol no canto superior direito.
- **Responsivo:** em telas estreitas a pesquisa some e o menu lateral mostra só os ícones.

## Como rodar

O projeto usa `fetch` para ler `json/dados.json`, então precisa ser servido por um servidor HTTP. Abrir o `index.html` direto pelo arquivo (`file://`) não funciona.

**Com o Live Server (VS Code):** abra a pasta e clique em *Go Live*. O projeto já vem configurado para a porta `5501` em `.vscode/settings.json`.

**Com Python:**

```bash
python -m http.server 5501
```

Depois acesse <http://localhost:5501>.

**Com Node:**

```bash
npx serve -l 5501
```

## Estrutura

```
google-keep/
├── index.html        # Estrutura da página: cabeçalho, menu lateral e container das notas
├── css/
│   └── style.css     # Estilos, temas claro/escuro, grid e animações
├── js/
│   ├── notes.js      # Carrega o JSON, renderiza as notas, abre/fecha, arquiva/lixeira, animações e aviso
│   └── index.js      # Grid masonry, modo escuro, menu, etiquetas, filtros e pesquisa
├── json/
│   └── dados.json    # As notas (150 de exemplo)
└── imagens/          # Logo e ícones
```

`notes.js` é carregado antes de `index.js`. As notas só são renderizadas depois que os dois scripts terminam de carregar.

## Formato das notas

Cada nota em `json/dados.json` tem este formato:

```json
{
  "id": "n1",
  "title": "Nota",
  "text": "Conteúdo da nota...",
  "controls": ["Fechar"],
  "labels": ["pessoal", "escola"]
}
```

| Campo      | Descrição                                                                 |
|------------|---------------------------------------------------------------------------|
| `id`       | Identificador único (usado para salvar o status no navegador)             |
| `title`    | Título exibido no topo da nota                                            |
| `text`     | Texto da nota                                                             |
| `controls` | Botões extras da nota (hoje, apenas `"Fechar"`)                           |
| `labels`   | Etiquetas da nota. Novas etiquetas aparecem sozinhas no menu lateral      |
| `archived` | *(opcional)* `true` para a nota já começar arquivada                      |
| `trashed`  | *(opcional)* `true` para a nota já começar na lixeira                     |

As cores das notas são sorteadas a cada carregamento entre quatro opções, que mudam entre o tema claro e o escuro.

## Onde o status fica salvo

O JSON é só leitura: um site estático não consegue gravar nele. Por isso, as mudanças de pasta ficam no `localStorage` do navegador, na chave `keep-notes-status`, e se sobrepõem aos valores do JSON.

Para voltar ao estado original, rode no console do navegador:

```js
localStorage.removeItem('keep-notes-status');
```

## Tecnologias

- HTML5
- CSS3 (CSS Grid, variáveis CSS, transições)
- JavaScript (ES2015+, Fetch API, Web Animations API)
- [Material Symbols](https://fonts.google.com/icons), carregando apenas os ícones usados

## Licença

Distribuído sob a licença [MIT](LICENSE).

> Projeto de estudo, sem relação com o Google. "Google Keep" é marca registrada da Google LLC.
