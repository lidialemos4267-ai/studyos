# Contexto do projeto StudyOS (para continuar em outra conversa)

Cole este texto no início de uma conversa nova com o Claude.

---

Sou concurseira. Tenho um site de estudos chamado **StudyOS**, feito em HTML, CSS e JavaScript puro, sem build e sem servidor. Os dados ficam no `localStorage` do navegador.

- **Repositório:** `github.com/lidialemos4267-ai/studyos`, branch `main`. A versão anterior à mudança para o cargo de Técnico está no branch `backup-antes-tecnico-unico`.
- **Uso:** pelo GitHub Pages (`https://lidialemos4267-ai.github.io/studyos/`) ou abrindo o `index.html` da pasta extraída.

## Concursos (banca Instituto Selecon)

1. **Técnico Legislativo — Câmara Municipal de Cuiabá-MT.** É o foco principal.
   - Edital nº 001/2026-CMC; 11 vagas (8 AC, 1 PcD, 2 NI).
   - Prova objetiva + discursiva em **20/12/2026, à tarde, 4h30** (adiada de 13/12/2026, informação minha).
   - Inscrição até 30/11/2026, 23h59; boleto até 01/12/2026.
   - Locais de prova, gabarito, recursos e resultados: **a confirmar** (aguardando retificação do edital).
   - Formato: 70 questões, 100 pontos.
     - Básicos: 15 questões × 1 ponto (Português, RLM, Informática, Legislação).
     - Gerais: 15 questões × 1 ponto (História e Geografia de MT, Ética e Filosofia, Relações Interpessoais).
     - Específicos: 40 questões × 1,75 ponto.
   - Discursiva: 20 a 30 linhas, 80 pontos de conteúdo + 20 de correção formal, mínimo de 40.
2. **Ouvidor — Prefeitura de Chapada dos Guimarães-MT** (edital consolidado com as retificações 01 e 02).
   - Prova em **22/11/2026, de manhã, 4h**; 40 questões, 50 pontos. O específico vale 60% (LAI, Lei 13.460, LGPD, ouvidoria).
   - O Cartão de Convocação sai em 17/11 e pode ser corrigido até 18/11.
3. **Analista Legislativo:** desisti. Foi removido do site.

**Todas as datas** ficam em `js/config-concurso.js`. As de Chapada estão na seção `outros`.

## Regras do plano (já implementadas)

- **Ritmo:** 4h15 por dia, de segunda a sábado.
  - No máximo 3 disciplinas por dia, e Português e Informática nunca no mesmo dia.
  - Sem horário fixo: só a duração de cada atividade.
- **Pesos:** até 22/11, 60% Chapada e 40% Câmara (conteúdo comum conta para os dois). Depois, 100% Técnico.
- **Um cartão por assunto por dia**, com leitura, questões e acertos, revisão, tempo e observações juntos.
- **Semana:**
  - domingo: simulado, revisão e ajuste da semana;
  - sábado: discursiva;
  - lei seca diária, em bloco curto, uma norma por dia. Antes de 22/11 o rodízio inclui LAI, Lei 13.460 e LGPD. Na véspera de simulado, o bloco vira revisão.
- **Reta final** (últimos 10 dias antes de 20/12): simulados também às quartas e sábados, e mais revisão. Vésperas (21/11 e 19/12) com estudo leve.
- **Aprovação:** nada muda no plano sem a minha aprovação. Gerar, recalcular e reorganizar sempre mostram prévia.
- **Percentual de acertos:** abaixo de 70% fica vermelho; de 70% a 80%, amarelo; acima de 80%, verde.

## Lei seca priorizada (estimativa)

- **Normas:** Lei Orgânica de Cuiabá, Regimento Interno da Câmara (Resolução nº 08/2016), LC 93/2003 (Estatuto) e LC 235/2011 com a LC 609/2026.
- **Classificação:** 3 níveis. O Nível 1 deve caber em cerca de 1 semana de leitura.
- **Critérios, em ordem:**
  - (a) o que a Selecon já cobrou em 2021. Técnico: renúncia de vereador dirigida à Mesa, escolha dos líderes, tributos que o Município pode instituir. Analista: horário do Colégio de Líderes, desconto por falta, leitura de 5 minutos até formar quórum, incapacidade civil do vereador, alienação de bens;
  - (b) prazos, quóruns, competências, vedações e exceções;
  - (c) ligação com o cargo de Técnico;
  - (d) alterações da LC 609/2026.
- **Números de artigo:** só aparecem os citados no edital. O portal `legislativo.camaracuiaba.mt.gov.br` estava bloqueado na rede do ambiente. Quando eu colo o texto da lei no site, ele numera e classifica os artigos sozinho.
- A lista está em `docs/legislacao-prioridades.md` e a lógica em `js/lei-prioridades.js`.

## Extensão do Chrome (pasta `extensao-tec/`, versão 1.2)

- Lê só o que aparece na tela do TEC Concursos e guarda em `chrome.storage.local`. Não clica, não responde e não baixa em lote.
- **Erro**, ou marcação de **Chutei** ou **Em dúvida**: guarda a questão completa (enunciado, alternativas, gabarito, resposta e comentário). **Acerto normal:** guarda só o contador.
- Manda os dados automaticamente ao StudyOS pelo arquivo `bridge.js`. Também guarda uma **cópia automática dos dados do StudyOS**: se o site abrir vazio, ele oferece restaurar.
- Os seletores do TEC foram testados só numa página que imita o site. Se algo falhar, uso o **Diagnóstico** do popup e mando o relatório.

## Flashcards

- São gerados só das questões erradas ou marcadas como chute ou dúvida. Ficam na fila **Para aprovar**, onde aprovo, edito ou descarto.
- A revisão espaçada aumenta o intervalo quando acerto e volta ao início quando erro. A fila do dia é por assunto.
- **IA ainda não está ativa**, e eu preciso escolher uma opção:
  - (a) uma função serverless gratuita, com a chave em variável de ambiente;
  - (b) seguir só com a geração por regras;
  - (c) gerar os cartões na conversa com o Claude.

  Em *Configurações* já existe o campo "Rota de IA", com o formato definido no `README.md`.

## Visual e motivação

- **Visual:** paleta rosa-antigo, lilás, nude e verde-sálvia, com toque de dourado e contraste acessível. Títulos em Fraunces, texto em Nunito. Tem modo escuro e funciona bem no celular.
- **Tela inicial:**
  - contagem grande para 20/12, contagem para Chapada e para o fim das inscrições;
  - lembrete do motivo;
  - meta diária, sequência de dias estudados, "Conquistei hoje" e progresso do plano;
  - frases carinhosas que mudam conforme o momento.

## Arquivos principais

- `index.html`, `css/styles.css`
- `js/config-concurso.js` (datas)
- `js/migracao.js` (migrações v3 e v4)
- `js/seed.js`, `js/core.js`, `js/engine.js` (plano, prioridade, revisão espaçada), `js/ui.js`, `js/app.js`
- `js/modules/*.js` (um arquivo por tela)
- `tests/studyos.test.js` e `tests/extensao.test.js` (Playwright): 53 de 53 e 9 de 9 passando

## Pendências

1. Escolher a solução de IA para os flashcards.
2. Colar o texto oficial das 4 leis no site, ou liberar o domínio `legislativo.camaracuiaba.mt.gov.br` na rede do ambiente.
3. Testar a extensão no TEC real e mandar o Diagnóstico se der problema.
4. Ativar o GitHub Pages e usar só esse link.
5. Atualizar `js/config-concurso.js` quando sair a retificação do edital da Câmara.

## Preferências

- Respostas em português, diretas.
- Não inventar dados de edital nem números de artigo; marcar o que é estimativa.
- Fazer backup ou commit antes de mudanças grandes.
- Pedir aprovação antes de mudar o cronograma.
- O site deve ser simples, objetivo e motivador. Tenho pouco tempo.
