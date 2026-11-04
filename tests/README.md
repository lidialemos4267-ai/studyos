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

```bash
node tests/lei-seca.test.js
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

- `lei-seca.test.js` confere:
  - importação da lei, separação dos artigos e identificação de parágrafos, incisos, alíneas e capítulos;
  - preservação do texto original, letra por letra;
  - navegação, busca e filtros;
  - marcações e anotações que sobrevivem ao recarregar e à atualização da norma;
  - flashcards da lei (geração, aprovação, sem duplicidade);
  - exportação para o Anki (colunas antigas mantidas) e importação antiga e nova;
  - rota de IA simulada no teste (contrato, segurança contra HTML, erros 429 e formato inválido, modo copiar e colar);
  - questões A–E, Caderno de Erros com o artigo vinculado;
  - dados antigos preservados.

Os seletores do TEC real só são confirmados com o **Diagnóstico** da extensão no site de verdade.
