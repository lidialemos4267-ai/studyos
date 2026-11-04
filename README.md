# StudyOS — Técnico Legislativo (Câmara de Cuiabá) + Ouvidor (Chapada dos Guimarães)

Plano de estudos simples e motivador. **Foco principal: Técnico Legislativo.** Chapada dos Guimarães entra até a prova de 22/11:

| Cargo | Banca | Vagas | Prova |
|---|---|---|---|
| Técnico Legislativo (CNM 01) — Edital nº 001/2026-CMC | Instituto Selecon | 11 (8 AC · 1 PcD · 2 NI) + CR | **20/12/2026, tarde, 4h30** — objetiva (70 questões, 100 pts) + discursiva (100 pts). Adiada de 13/12/2026. |
| Ouvidor — Prefeitura de Chapada dos Guimarães (Edital 001/2026, consolidado) | Instituto Selecon | 1 + CR | **22/11/2026, manhã, 4h** — 40 questões / 50 pts (específico = 60%). |

**Pesos do plano:** até 22/11, 60% Chapada e 40% Câmara (os conteúdos comuns contam para os dois). Depois, 100% Técnico. Ajuste em *Configurações*.

Inscrições até **30/11/2026 (23h59)** · boleto até **01/12/2026**. Locais de prova, gabarito, recursos e resultados: **a confirmar** (aguardando retificação do edital).

## Onde editar as datas

**Só em um arquivo:** [`js/config-concurso.js`](js/config-concurso.js). As datas de Chapada ficam na seção `outros` do mesmo arquivo. Quando sair a retificação, troque a data (formato `AAAA-MM-DD`) e o status do item. Ao recarregar o site, a contagem regressiva, o calendário e o plano passam a usar a data nova. Para redistribuir o plano depois de mudar a data da prova, use **Planejamento › Recalcular até a prova**.

## Como abrir

- **Recomendado:** pelo link do GitHub Pages (`https://lidialemos4267-ai.github.io/studyos/`), que se atualiza sozinho.
- **Ou** baixe o ZIP, **extraia** e abra o `index.html`. Use sempre o mesmo endereço: os dados ficam no navegador, separados por endereço.

## O que tem

| Tela | O que faz |
|---|---|
| **Início** | Contagem grande para a prova, contagem para o fim das inscrições, lembrete do motivo, frase do dia (começo do dia, recomeço sem culpa, meta batida, reta final, véspera), meta diária, sequência de dias, **Conquistei hoje** e barra de progresso do plano. |
| **Planejamento** | Plano até 20/12 com **um cartão por assunto por dia**. Lei seca diária (uma norma por dia), sábado com discursiva, domingo com simulado. Nos **últimos 10 dias**: simulados também às quartas e sábados e o dobro de revisão. Véspera leve. Visões semana, Kanban e calendário. **Recalcular até a prova**, reorganizar pendências (com aprovação), arrastar, duplicar e excluir (com confirmação). |
| **Lei seca** | **Prioridades** em 3 níveis por norma (Lei Orgânica, Regimento Interno, LC 93/2003, LC 235/2011 + LC 609/2026); veja [`docs/legislacao-prioridades.md`](docs/legislacao-prioridades.md). **Leitor estilo Vade Mecum:** títulos e capítulos destacados; caput, parágrafos, incisos e alíneas com recuo; busca por número ou palavra; filtros (não lidos, destacados, com anotação, com marcações); tamanho da letra; modo leitura; "continuar de onde parei"; **marcações por trecho** (Conceito, Atenção, Pegadinha, Memorizar, Minha anotação). O texto legal **nunca é alterado**: a formatação é só visual. **Flashcards da lei**, por regras ou por IA, de um artigo, dos selecionados, dos destacados ou de um capítulo, em 3 níveis (essencial, intermediário, reta final), sempre pela fila de aprovação. **Assistente de IA:** explicar, pontos importantes, exceções, pegadinhas, comparar. **Questões A–E no estilo Selecon** (geradas por IA, não oficiais): erro vai ao Caderno com o artigo vinculado. Também tem cronograma e jurisprudência. |
| **Flashcards** | Cartões gerados **só das questões que você errou** (ou marcou "chutei"/"em dúvida"). Ficam na fila **Para aprovar** (aprovar, editar ou descartar). Revisão espaçada com fila do dia por assunto. |
| **Caderno de Erros** | Erros (manuais e do TEC), categorias, revisão em 1–3–7–15–30 dias e "Revisar meus erros de hoje". |
| **Questões e desempenho** | Registro do dia por assunto: leitura, questões e acertos, revisão, tempo e observações juntos. O histórico mostra uma linha por assunto por dia. |
| **Banco de questões (TEC)** | Recebe da extensão do Chrome as questões erradas (completas) e os acertos (só o contador). Inclui cadernos próprios e treino ou simulado. |
| Revisões, Discursivas, Simulados, Edital verticalizado, Concurso, Estatísticas, Configurações | Como antes, agora só com o Técnico. |

## IA (opcional)

O site é estático e **não guarda chave de API**. Há dois jeitos de usar IA, e nos dois a resposta é conferida antes de ser usada:

1. **Copiar e colar com o Claude.** Não precisa configurar nada. O site monta o pedido, você cola numa conversa com o Claude e cola a resposta de volta.
2. **Rota de servidor sua.** Por exemplo, um Cloudflare Worker gratuito, com a chave em segredo. Cadastre a URL em **Configurações › Rota de IA**.

Passo a passo, contrato completo e código pronto em [`docs/ia-rota.md`](docs/ia-rota.md). O pedido antigo dos flashcards (`{ questoes }` → `{ cards }`) continua funcionando.

## Backup

Salvamento automático no navegador, snapshots diários, **cópia automática na extensão** (restaura com um clique se o site abrir vazio) e exportação/importação em JSON em **Configurações**. O estado do código antes desta versão está no branch `backup-antes-tecnico-unico`.

## Testes

Veja [`tests/README.md`](tests/README.md).

```bash
node tests/studyos.test.js
```

```bash
node tests/extensao.test.js
```

```bash
node tests/lei-seca.test.js
```

## Estrutura

```
index.html · css/styles.css (paleta rosa-antigo/lilás/nude/sálvia, modo escuro)
js/config-concurso.js   ← DATAS DO CONCURSO (edite aqui)
js/migracao.js          migração v3: cargo único + um item por assunto por dia
js/lei-prioridades.js   priorização da lei seca (estimativa)
js/lei-parser.js        estrutura do texto legal (só visual), marcações, flashcards por regras
js/ia.js                assistente de IA: rota de servidor ou copiar e colar, validação das respostas
js/seed.js · js/core.js · js/engine.js · js/ui.js · js/app.js · js/modules/*.js
extensao-tec/           extensão do Chrome (TEC Concursos)
tests/                  testes automáticos (Playwright)
docs/                   lista de prioridades da legislação
```
