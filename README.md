# StudyOS — Sistema inteligente de estudos para concursos

Configurado para três provas da banca **Instituto Selecon**:

| Concurso | Cargo | Prova | Formato |
|---|---|---|---|
| Prefeitura de Chapada dos Guimarães-MT (Edital 001/2026, consolidado c/ Ret. 01 e 02) | Ouvidor | **22/11/2026 (dom), manhã** | 40 questões / 50 pts; mínimo 25; sem discursiva; títulos |
| Câmara Municipal de Cuiabá-MT (Edital 001/2026-CMC) | Analista Legislativo (CNS 03) | **13/12/2026 (dom), manhã** | 70 questões / 100 pts + discursiva 100 pts + títulos 9 |
| Câmara Municipal de Cuiabá-MT (Edital 001/2026-CMC) | Técnico Legislativo (CNM 01) | **13/12/2026 (dom), tarde** | 70 questões / 100 pts + discursiva 100 pts |

Todos os dados dos editais (estrutura da prova, pesos, critérios, conteúdo programático) foram extraídos dos PDFs oficiais. O que o edital não informa aparece como "não informado" ou "estimativa".

## Como abrir

1. Baixe/descompacte a pasta `StudyOS`.
2. Dê dois cliques em **`index.html`** (Chrome, Edge ou Firefox).
3. Pronto: não precisa de internet, instalação nem servidor. (Com internet, as fontes Outfit e DM Sans são carregadas; sem internet, usa a fonte do sistema.)

> Use sempre o **mesmo navegador** e o **mesmo arquivo/pasta**: os dados ficam no armazenamento local daquele navegador. Não use janela anônima (o navegador apaga tudo ao fechar).

## Módulos

| Módulo | O que faz |
|---|---|
| **Dashboard** | Contagem regressiva, % do edital, horas na semana/mês, questões, % de acertos, erros, melhores/piores disciplinas, pendências, revisões atrasadas, flashcards, erros recorrentes, discursivas e gráficos de evolução. Filtro por concurso no topo (ou consolidado). |
| **Concursos** | Ficha completa de cada edital: cargo, remuneração, data, etapas, quadro de questões e pontos, aprovação, discursiva, títulos e desempate. Permite editar datas e **adicionar novos concursos**. |
| **Edital verticalizado** | Tópicos na ordem original de cada edital, com status (não iniciado, estudando, revisar, finalizado), importância, incidência, desempenho, tempo e datas de revisão. Aba **Mapa de Conteúdos Compartilhados**: 🟢 comum, 🟡 comum com diferenças, 🔵 só Câmara, 🟣 só Chapada. Cada tópico existe **uma única vez**, mesmo quando pertence a vários concursos. |
| **Planejamento** | Visões **Dias da semana**, **Kanban** (arrastar entre colunas) e **Calendário**. Botão **Gerar plano da semana** (mostra a proposta e só aplica após aprovação). Concluir, "não realizei", editar, duplicar, reprogramar (arrastar para outro dia) e excluir (com confirmação). |
| **Questões e desempenho** | Registro de tempo planejado/realizado (00:00h), questões, acertos e erros com % automático (vermelho < 70%, amarelo 70–80%, verde > 80%). Assuntos melhorando/piorando. |
| **Caderno de Erros** | Cadastro completo do erro, classificação em 10 categorias (múltipla escolha), status, revisão em 1–3–7–15–30 dias, "Errei de novo" (aumenta a prioridade do assunto), painel, filtros, lista e Kanban, recomendações e o botão **Revisar meus erros de hoje**. |
| **Flashcards** | Revisão espaçada estilo Anki (Errei / Difícil / Bom / Fácil). Criação a partir de um erro (com rascunho editável e aprovação) ou independente. Sugestões automáticas, detecção de duplicados, decks por disciplina, vínculo com o erro de origem, **exportação CSV para o Anki** e importação. Atalhos na revisão: espaço = mostrar; 1–4 = avaliar. |
| **Revisões** | Fila do dia: programadas, atrasadas, por baixo desempenho e por erro recorrente, mais flashcards e erros. Registrar, adiar, reprogramar e **distribuir o excesso** sem sobrecarregar um único dia. |
| **Banco de questões (TEC)** | Recebe automaticamente as questões resolvidas no TEC pela extensão (pasta `extensao-tec`, veja o LEIA-ME de lá). Mostra filtros, enunciado, sua resposta, gabarito, comentário e estatística. Associa o assunto do TEC a um tópico do edital (pergunta uma vez e lembra). Os erros vão para o Caderno de Erros e os acertos e erros entram nas estatísticas. Tem **meus cadernos** (crie, anote, reordene; inclui questões próprias), **treino e simulado** com cronômetro, "tema de discursiva", "flashcard", e os totais dos cadernos do TEC sem dupla contagem. |
| **Lei seca e jurisprudência** | Normas do edital já cadastradas (cole o texto oficial; a separação por artigos é automática). Permite marcar lido, destacar, anotar e criar flashcard por artigo. **Cronograma de lei seca** até a véspera da prova (com aprovação, vai para o Planejamento). Lista de jurisprudência com distribuição opcional no plano. |
| **Discursivas** | Banco de temas, editor com cronômetro e contagem estimada de linhas (alerta fora de 20–30), notas de Conteúdo (80) e Correção formal (20), avaliação nas 10 categorias, dificuldades, erros recorrentes que viram pontos de revisão, e evolução das notas. |
| **Simulados** | Registro por área no formato de cada prova, com pontuação pelos pesos do edital e verificação de eliminação (mínimo e "zerar área"). |
| **Estatísticas** | Por disciplina, por assunto (com tendência), **Mapa de Dificuldades** (domínio alto, intermediário, baixo, não estudado) e histórico de ações. |
| **Configurações** | Horas por dia, máximo de disciplinas por dia, capacidade de revisões, peso de cada concurso antes/depois de 22/11, intervalos de revisão, tema claro/escuro, backup, restauração e snapshots. |

## Como o plano é montado

- **4h15 por dia de segunda a sábado** (ajustável): 30 min de revisões + 15 min de flashcards + 3 blocos de estudo, com no máximo 3 disciplinas por dia, sem horário fixo (só a duração).
- **Português e Informática nunca no mesmo dia.**
- **Sábado** com uma discursiva (enquanto houver prova com discursiva). **Domingo**: simulado, revisão da semana, Caderno de Erros, flashcards e ajuste do plano.
- **Pesos por concurso**: até 22/11, Chapada 60%, Câmara 40% (Analista 25% + Técnico 15%); depois de 22/11, Analista 60% e Técnico 40%. Ajustável em Configurações.
- **Prioridade de cada tópico** = parcela da nota da prova que ele representa (pontos da seção ÷ itens do edital), somada em todos os concursos em que aparece (por isso os conteúdos compartilhados rendem mais) × proximidade da prova × importância × incidência × (1 − domínio) × status, com reforço para baixo desempenho e erros recorrentes.
- O edital da Câmara só informa questões **por área**. Para distribuir o tempo, o StudyOS **estima**: disciplinas da mesma área com peso igual; nos Específicos do Analista, 50% Legislação e 50% conteúdo do cargo (Dir. Administrativo 28%, Adm. Pública 18%, Dir. Constitucional 4%). É uma estimativa, não uma informação do edital.
- **Incidência na banca**: a maioria dos assuntos começa como "Sem dados suficientes". Lei Orgânica, Estatutos, atualidades e português tradicional estão marcados como incidência **alta estimada**, com base no perfil da Selecon publicado pela Sendera (texto editorial, não um levantamento de provas). Ao analisar provas anteriores da Selecon, atualize em *Edital › Detalhes* do tópico (com a justificativa).

## Backup e restauração

- **Salvamento automático** a cada alteração. O indicador "salvo às hh:mm" aparece no rodapé do menu.
- **Snapshots automáticos**: uma cópia por dia, guardando as 10 últimas, em *Configurações › Versões automáticas*. Também é feita uma cópia antes de cada importação e de cada redefinição.
- **Exportar backup**: *Configurações › Exportar backup (.json)*. Guarde o arquivo no Google Drive ou no e-mail. O sistema lembra você a cada 7 dias.
- **Restaurar**: *Configurações › Importar backup*. **Substituir** troca tudo pelo backup; **Mesclar** só adiciona registros novos. Arquivos inválidos são rejeitados sem alterar nada.
- **Usar em outro computador ou celular**: exporte o backup em um aparelho e importe no outro.
- Se os dados principais estiverem corrompidos, o sistema recupera automaticamente o snapshot mais recente.

## Como adicionar um novo concurso

1. *Concursos › + Adicionar concurso*: informe nome, órgão, cargo, banca, data (marque se está confirmada) e as áreas da prova (`Nome;questões;pontos por questão`, uma por linha).
2. *Edital verticalizado*: selecione o novo concurso no filtro e use **+ Adicionar em lote** (cole o conteúdo programático; linhas começando com número viram o item do edital) ou **+ Novo tópico**.
3. Se um conteúdo já existe (por exemplo, Princípios da Administração Pública), **não crie outro tópico**: abra o tópico existente › *Vínculos com editais* e marque o novo concurso. Assim ele passa a ser compartilhado.
4. Ajuste os pesos em *Configurações › Peso de cada concurso*.

## Como atualizar o sistema no futuro

- Os dados ficam no navegador, separados do código. Para atualizar, **exporte um backup**, substitua os arquivos da pasta pela versão nova (mantendo o mesmo local) e abra o `index.html`. O sistema migra os dados automaticamente (campo `schema`).
- Se uma retificação mudar uma data de prova, edite em *Concursos › Editar*.

## Estrutura técnica

```
index.html            shell + menu
css/styles.css        identidade visual (Outfit + DM Sans), tema claro/escuro, responsivo
js/seed.js            concursos e editais verticalizados (fonte: PDFs oficiais)
js/core.js            utilitários, armazenamento, autosave, snapshots, backup
js/engine.js          estatísticas, domínio, prioridade, SRS, revisões, gerador do plano, reorganização, recomendações
js/ui.js              componentes (modais, gráficos SVG, registro de estudo)
js/app.js             roteamento e inicialização
js/modules/*.js       um arquivo por módulo
```

HTML, CSS e JavaScript puro, sem dependências, build ou servidor. Os gráficos são SVG próprios. Os dados ficam em `localStorage` (chave `studyos.data`).
