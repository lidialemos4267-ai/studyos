# Testes automáticos

Não há etapa de build: o site é HTML, CSS e JavaScript puro. Os testes abrem o site num Chromium sem janela (Playwright) e usam o site de verdade.

## Pré-requisito

Node.js 18 ou mais recente, e o Playwright com o Chromium:

```bash
npm i -D playwright
```

```bash
npx playwright install chromium
```

## Rodar

```bash
node tests/studyos.test.js
```

```bash
node tests/extensao.test.js
```

- `studyos.test.js` confere:
  - cargo único e datas;
  - plano até a prova (um assunto por dia, até 3 disciplinas, Português e Informática em dias diferentes, uma norma por dia, reta final com mais simulados e revisões);
  - registro único por assunto e dia;
  - migração de dados antigos (`fixtures/estado-v2.json`, gerado com a versão anterior);
  - tela inicial motivacional;
  - lei seca priorizada;
  - flashcards só de erros, com aprovação;
  - layout no celular e modo escuro.
- `extensao.test.js` carrega a extensão e roda numa página que **imita** o TEC (`fixtures/mock-tec.html`, questão inventada). Confere:
  - acerto guarda só o contador;
  - erro e "chutei" guardam a questão completa;
  - limpeza dos acertos antigos;
  - popup e diagnóstico.

Os seletores do TEC real só são confirmados com o **Diagnóstico** da extensão no site de verdade.
