/* StudyOS — dados iniciais extraídos dos editais.
 * Fontes:
 *  - Edital nº 001/2026-CMC, Câmara Municipal de Cuiabá (Gazeta Municipal nº 1478, 26/10/2026)
 *  - Edital nº 001/2026, Prefeitura de Chapada dos Guimarães (consolidado c/ Retificações 01 e 02/2026)
 * Nada aqui é inventado: o que o edital não informa está marcado como "não informado".
 */
window.SOS = window.SOS || {};

SOS.SEED_VERSION = 1;

SOS.seedConcursos = function () {
  return [
    {
      id: 'ANA', grupo: 'CMC', sigla: 'Câmara · Analista', cor: '#2563eb', prioridade: 1,
      orgao: 'Câmara Municipal de Cuiabá-MT', cargo: 'Analista Legislativo (CNS 03) — sem especialidade',
      banca: 'Instituto Selecon', edital: 'Edital nº 001/2026-CMC, de 26/10/2026',
      escolaridade: 'Nível superior (qualquer área, diploma registrado no MEC)',
      remuneracao: 'R$ 7.070,51 + auxílio-alimentação R$ 1.500,00 + auxílio-saúde R$ 1.000,00',
      jornada: '30 h semanais — estatutário (LC 93/2003)', vagas: '1 (ampla concorrência) + cadastro de reserva',
      dataProva: '2026-12-13', turno: 'Manhã', duracao: '4h30 (objetiva + discursiva)', dataConfirmada: true,
      etapas: ['1ª Prova objetiva (eliminatória e classificatória)', '2ª Prova discursiva (eliminatória e classificatória) — mesmo dia', '3ª Avaliação de títulos (classificatória, máx. 9,0)'],
      totalQuestoes: 70, totalPontos: 100,
      areas: {
        B: { nome: 'Conhecimentos Básicos', q: 15, v: 1 },
        G: { nome: 'Conhecimentos Gerais', q: 15, v: 1 },
        E: { nome: 'Conhecimentos Específicos', q: 40, v: 1.75 }
      },
      secoes: [
        { k: 'LP', nome: 'Língua Portuguesa', area: 'B', imp: 3 },
        { k: 'RLM', nome: 'Raciocínio Lógico e Matemático', area: 'B', imp: 3 },
        { k: 'INF', nome: 'Noções de Informática', area: 'B', imp: 2 },
        { k: 'HGMT', nome: 'História e Geografia de Mato Grosso', area: 'G', imp: 2 },
        { k: 'ETI', nome: 'Noções de Ética e Filosofia', area: 'G', imp: 2 },
        { k: 'RI', nome: 'Relações Interpessoais', area: 'G', imp: 2 },
        { k: 'NAP', nome: 'Noções de Administração Pública', area: 'G', imp: 3 },
        { k: 'LEG', nome: 'Legislação', area: 'E', imp: 4, share: 0.5 },
        { k: 'DA', nome: 'Analista Legislativo — Noções de Direito Administrativo', area: 'E', imp: 4, share: 0.28 },
        { k: 'DC', nome: 'Analista Legislativo — Noções de Direito Constitucional', area: 'E', imp: 4, share: 0.04 },
        { k: 'AP', nome: 'Analista Legislativo — Noções de Administração Pública', area: 'E', imp: 4, share: 0.18 }
      ],
      questoesPorDisciplina: 'Não informado no edital (apenas por área). Para o planejamento, o StudyOS estima: áreas Básicas e Gerais divididas igualmente entre as disciplinas; Específicos 50% Legislação e 50% conteúdo do cargo (dividido pela extensão: Dir. Administrativo 28%, Adm. Pública 18%, Dir. Constitucional 4%). Estimativa ajustável.',
      aprovacao: [
        'Objetiva: mínimo de 40 pontos (40%) e não zerar nenhuma das 3 áreas (item 9.1.5).',
        'Discursiva só é corrigida para os classificados até 20× o nº de vagas (1 vaga → top 20), mais empatados e cotistas habilitados (item 9.2.2).',
        'Discursiva: mínimo de 40 pontos (item 9.2.9).'
      ],
      discursiva: {
        existe: true, pontos: 100, linhas: '20 a 30', tema: 'Conhecimento específico do cargo (Anexo V)',
        criterios: [{ nome: 'Conteúdo', max: 80, desc: 'Ideias fundamentais, fidelidade ao tema, consistência, relevância da fundamentação e progressão temática.' },
                    { nome: 'Correção formal', max: 20, desc: 'Ortografia, acentuação, propriedade vocabular, morfossintaxe, pontuação e coesão.' }],
        zero: 'Em branco; fuga ao tema/tipologia; ilegível; caneta que não seja azul/preta; cópia; menos de 20 linhas.'
      },
      titulos: 'Doutorado 4,0 · Mestrado 3,0 · Especialização 2,0 (1 por item; máx. 9,0)',
      desempate: ['Idoso (maior idade)', 'Maior nota em títulos', 'Maior nota na discursiva', 'Maior nota em Conhecimentos Específicos', 'Maior nota em Conhecimentos Gerais', 'Maior nota em Conhecimentos Básicos', 'Maior idade', 'Exercício da função de jurado'],
      minimos: { total: 40, porArea: 0.0001 }
    },
    {
      id: 'TEC', grupo: 'CMC', sigla: 'Câmara · Técnico', cor: '#0891b2', prioridade: 2,
      orgao: 'Câmara Municipal de Cuiabá-MT', cargo: 'Técnico Legislativo (CNM 01)',
      banca: 'Instituto Selecon', edital: 'Edital nº 001/2026-CMC, de 26/10/2026',
      escolaridade: 'Ensino médio completo',
      remuneracao: 'R$ 5.518,91 + auxílio-alimentação R$ 1.500,00 + auxílio-saúde R$ 1.000,00',
      jornada: '30 h semanais — estatutário (LC 93/2003)', vagas: '11 (8 AC · 1 PcD · 2 NI) + cadastro de reserva',
      dataProva: '2026-12-13', turno: 'Tarde', duracao: '4h30 (objetiva + discursiva)', dataConfirmada: true,
      etapas: ['1ª Prova objetiva (eliminatória e classificatória)', '2ª Prova discursiva (eliminatória e classificatória) — mesmo dia'],
      totalQuestoes: 70, totalPontos: 100,
      areas: {
        B: { nome: 'Conhecimentos Básicos', q: 15, v: 1 },
        G: { nome: 'Conhecimentos Gerais', q: 15, v: 1 },
        E: { nome: 'Conhecimentos Específicos', q: 40, v: 1.75 }
      },
      secoes: [
        { k: 'LP', nome: 'Língua Portuguesa', area: 'B', imp: 3 },
        { k: 'RLM', nome: 'Raciocínio Lógico e Matemático', area: 'B', imp: 2 },
        { k: 'INF', nome: 'Noções de Informática', area: 'B', imp: 2 },
        { k: 'LEG', nome: 'Legislação', area: 'B', imp: 3 },
        { k: 'HGMT', nome: 'História e Geografia de Mato Grosso', area: 'G', imp: 2 },
        { k: 'ETI', nome: 'Noções de Ética e Filosofia', area: 'G', imp: 2 },
        { k: 'RI', nome: 'Relações Interpessoais', area: 'G', imp: 2 },
        { k: 'TEC', nome: 'Técnico Legislativo (disciplina específica)', area: 'E', imp: 4 }
      ],
      questoesPorDisciplina: 'Não informado no edital (apenas por área)',
      aprovacao: [
        'Objetiva: mínimo de 40 pontos (40%) e não zerar nenhuma das 3 áreas (item 9.1.5).',
        'Discursiva corrigida para os classificados até 20× o nº de vagas imediatas (11 vagas → até a 220ª posição), mais empatados e cotistas (item 9.2.2).',
        'Discursiva: mínimo de 40 pontos.'
      ],
      discursiva: {
        existe: true, pontos: 100, linhas: '20 a 30', tema: 'Conhecimento específico do cargo (Anexo V)',
        criterios: [{ nome: 'Conteúdo', max: 80, desc: 'Ideias fundamentais, fidelidade ao tema, consistência, relevância da fundamentação e progressão temática.' },
                    { nome: 'Correção formal', max: 20, desc: 'Ortografia, acentuação, propriedade vocabular, morfossintaxe, pontuação e coesão.' }],
        zero: 'Em branco; fuga ao tema/tipologia; ilegível; caneta que não seja azul/preta; cópia; menos de 20 linhas.'
      },
      titulos: 'Não há (somente nível superior)',
      desempate: ['Idoso (maior idade)', 'Maior nota na discursiva', 'Maior nota em Conhecimentos Específicos', 'Maior nota em Conhecimentos Gerais', 'Maior nota em Conhecimentos Básicos', 'Maior idade', 'Exercício da função de jurado'],
      minimos: { total: 40, porArea: 0.0001 }
    },
    {
      id: 'OUV', grupo: 'CHAP', sigla: 'Chapada · Ouvidor', cor: '#9333ea', prioridade: 3,
      orgao: 'Prefeitura Municipal de Chapada dos Guimarães-MT', cargo: 'Ouvidor',
      banca: 'Instituto Selecon', edital: 'Edital nº 001/2026 (consolidado c/ Retificações 01 e 02/2026)',
      escolaridade: 'Nível superior em qualquer área',
      remuneracao: 'R$ 4.987,20', jornada: '40 h semanais — estatutário (RPPS)', vagas: '1 (ampla concorrência) + cadastro de reserva',
      dataProva: '2026-11-22', turno: 'Manhã', duracao: '4h', dataConfirmada: true,
      etapas: ['1ª Prova objetiva (eliminatória e classificatória)', '2ª Avaliação de títulos (classificatória, máx. 10,0 — até a 50ª posição)'],
      totalQuestoes: 40, totalPontos: 50,
      areas: {
        LP: { nome: 'Língua Portuguesa', q: 5, v: 1 },
        RLM: { nome: 'Raciocínio Lógico e Matemático', q: 5, v: 1 },
        CGL: { nome: 'Conhecimentos Gerais e Legislação Municipal', q: 5, v: 1 },
        INF: { nome: 'Noções de Informática', q: 5, v: 1 },
        ESP: { nome: 'Conhecimentos Específicos', q: 20, v: 1.5 }
      },
      secoes: [
        { k: 'LP', nome: 'Língua Portuguesa', area: 'LP', imp: 3 },
        { k: 'RLM', nome: 'Raciocínio Lógico e Matemático', area: 'RLM', imp: 3 },
        { k: 'CGL', nome: 'Conhecimentos Gerais e Legislação Municipal', area: 'CGL', imp: 2 },
        { k: 'INF', nome: 'Noções de Informática', area: 'INF', imp: 2 },
        { k: 'ESP', nome: 'Conhecimentos Específicos — Ouvidor', area: 'ESP', imp: 4 }
      ],
      questoesPorDisciplina: 'LP 5 · RLM 5 · CG e Legislação 5 · Informática 5 · Específicos 20',
      aprovacao: ['Objetiva: mínimo de 50% do total (25 de 50 pontos) (item 9.1.5).', 'Não há mínimo por disciplina.', 'Não há prova discursiva.'],
      discursiva: { existe: false },
      titulos: 'Doutorado 4,0 · Mestrado 3,0 · Especialização 1,5 (até 2) — máx. 10,0',
      desempate: ['Idoso (maior idade)', 'Maior nota na disciplina específica', 'Maior nota em títulos', 'Maior nota em Língua Portuguesa', 'Maior idade'],
      minimos: { total: 25, porArea: 0 }
    }
  ];
};

SOS.seedDisciplinas = function () {
  return [
    ['LP', 'Língua Portuguesa', '#e11d48'],
    ['RLM', 'Raciocínio Lógico e Matemático', '#f59e0b'],
    ['INF', 'Informática', '#0ea5e9'],
    ['HGMT', 'História e Geografia de MT', '#a16207'],
    ['ETI', 'Ética e Filosofia', '#7c3aed'],
    ['RI', 'Relações Interpessoais e Atendimento', '#db2777'],
    ['DA', 'Direito Administrativo', '#2563eb'],
    ['DC', 'Direito Constitucional', '#1d4ed8'],
    ['AP', 'Administração Pública e Gestão', '#0d9488'],
    ['LEGC', 'Legislação de Cuiabá', '#15803d'],
    ['LEGF', 'Legislação Federal (LAI, LGPD, 13.460)', '#4f46e5'],
    ['OUVD', 'Ouvidoria e Gestão de Demandas', '#9333ea'],
    ['RDA', 'Redação Oficial e Arquivologia', '#ea580c'],
    ['PLM', 'Poder e Processo Legislativo', '#059669'],
    ['TCX', 'Tópicos do Técnico (Contab., SST, Foto)', '#64748b'],
    ['CGB', 'Conhecimentos Gerais do Brasil', '#b45309'],
    ['LEGCH', 'Legislação de Chapada', '#7e22ce']
  ].map(function (d) { return { id: d[0], nome: d[1], cor: d[2] }; });
};

/* Formato: id | disciplina | título | refs (CONC.SECAO.ordem[:rótulo] separados por ;) | flag p=parcial | nota | importância forçada */
SOS.SEED_TOPICOS = [
  // ---------------- LÍNGUA PORTUGUESA ----------------
  'lp01|LP|Leitura e interpretação/compreensão de textos de variados gêneros|ANA.LP.1;TEC.LP.1;OUV.LP.1',
  'lp02|LP|Condições de produção do texto, marcas composicionais e gêneros do discurso|ANA.LP.2;TEC.LP.2;OUV.LP.3|p|Câmara: condições de produção e marcas composicionais; Chapada: definição e reconhecimento dos gêneros',
  'lp03|LP|Modos de organização do discurso: descritivo, narrativo, argumentativo, injuntivo, expositivo e dissertativo|OUV.LP.2',
  'lp04|LP|Variedades linguísticas e seus determinantes sociais, regionais, históricos e individuais|ANA.LP.3.1;TEC.LP.3.1',
  'lp05|LP|Registros formal e informal da linguagem|ANA.LP.3.2;TEC.LP.3.2',
  'lp06|LP|Fonética: prosódia e ortografia|ANA.LP.4.1;TEC.LP.4.1;OUV.LP.13|p|Ortografia é comum; prosódia só na Câmara',
  'lp07|LP|Acentuação gráfica|OUV.LP.13.1:13 e 20',
  'lp08|LP|Estrutura, classificação e formação de palavras|ANA.LP.4.2;TEC.LP.4.2;OUV.LP.10',
  'lp09|LP|Funções e classes de palavras|ANA.LP.4.21:4.2;TEC.LP.4.21:4.2;OUV.LP.11|p|Câmara cobra "classificação" dentro de Morfologia',
  'lp10|LP|Flexão nominal e verbal|ANA.LP.4.22:4.2;TEC.LP.4.22:4.2;OUV.LP.12',
  'lp11|LP|Verbos: pessoa, número, modos e tempos verbais|ANA.LP.4.3;TEC.LP.4.3;OUV.LP.7',
  'lp12|LP|Vozes verbais|OUV.LP.8',
  'lp13|LP|Concordância verbal e nominal|ANA.LP.4.31:4.3;TEC.LP.4.31:4.3',
  'lp14|LP|Regência verbal e nominal|ANA.LP.4.32:4.3;TEC.LP.4.32:4.3;OUV.LP.14',
  'lp15|LP|Transitividade verbal e nominal|OUV.LP.9',
  'lp16|LP|Pronomes: emprego, formas de tratamento e colocação pronominal|ANA.LP.4.33:4.3;TEC.LP.4.33:4.3;OUV.LP.15',
  'lp17|LP|Emprego de nomes e advérbios|ANA.LP.4.34:4.3;TEC.LP.4.34:4.3',
  'lp18|LP|Conjunções e conectivos: classificação, uso e efeitos de sentido|ANA.LP.4.35:4.3;TEC.LP.4.35:4.3;OUV.LP.6',
  'lp19|LP|Semântica: polissemia, sinonímia, antonímia, paronímia e homonímia|ANA.LP.4.4;TEC.LP.4.4;OUV.LP.19|p|Polissemia só na Câmara; sinônimos/antônimos só em Chapada',
  'lp20|LP|Denotação e conotação|ANA.LP.4.41:4.4;TEC.LP.4.41:4.4',
  'lp21|LP|Figuras de linguagem|OUV.LP.16',
  'lp22|LP|Funções da linguagem|OUV.LP.17',
  'lp23|LP|Gradação e ênfase|OUV.LP.18',
  'lp24|LP|Coesão e coerência (mecanismos e efeitos de sentido)|ANA.LP.5;TEC.LP.5;OUV.LP.4',
  'lp25|LP|Relação entre as partes do texto: causa, consequência, comparação, conclusão, exemplificação, generalização, particularização|OUV.LP.5',
  'lp26|LP|Intertextualidade|ANA.LP.5.1:5;TEC.LP.5.1:5',
  'lp27|LP|Argumentação|ANA.LP.5.2:5;TEC.LP.5.2:5',
  'lp28|LP|Pontuação: regras e efeitos de sentido|ANA.LP.6;TEC.LP.6;OUV.LP.21:13 e 21',
  'lp29|LP|Recursos gráficos: regras e efeitos de sentido|OUV.LP.22',
  'lp30|LP|Sintaxe do período simples|OUV.LP.23',
  'lp31|LP|Coordenação e subordinação|OUV.LP.24',
  'lp32|LP|Crase|OUV.LP.25',
  'lp33|LP|Tipos de discurso: direto e indireto|ANA.LP.7;TEC.LP.7',
  // ---------------- RACIOCÍNIO LÓGICO ----------------
  'rl01|RLM|Operações com conjuntos|ANA.RLM.1;TEC.RLM.1;OUV.RLM.2',
  'rl02|RLM|Raciocínio lógico numérico: problemas com números reais|ANA.RLM.2;TEC.RLM.2;OUV.RLM.1',
  'rl03|RLM|Raciocínio sequencial: sequências e padrões (números, figuras, palavras)|ANA.RLM.2.1:2;TEC.RLM.2.1:2;OUV.RLM.4',
  'rl04|RLM|Porcentagem|OUV.RLM.3',
  'rl05|RLM|Proposições: valores lógicos, conectivos e negação|ANA.RLM.3;TEC.RLM.3;OUV.RLM.5',
  'rl06|RLM|Tabela-verdade, tautologias e condição necessária e suficiente|ANA.RLM.3.1:3',
  'rl07|RLM|Argumentação lógica e diagramas lógicos|ANA.RLM.4;TEC.RLM.4;OUV.RLM.6',
  'rl08|RLM|Estruturas lógicas|ANA.RLM.4.1:4;OUV.RLM.7',
  'rl09|RLM|Equivalências e implicações lógicas|ANA.RLM.5;TEC.RLM.5;OUV.RLM.5.1:5',
  'rl10|RLM|Quantificadores universal e existencial|ANA.RLM.6;TEC.RLM.6',
  'rl11|RLM|Problemas de contagem: princípio aditivo e multiplicativo|ANA.RLM.7;TEC.RLM.7;OUV.RLM.8',
  'rl12|RLM|Arranjos e combinações|ANA.RLM.7.1:7;OUV.RLM.9',
  'rl13|RLM|Permutações|ANA.RLM.7.2:7;OUV.RLM.10',
  'rl14|RLM|Probabilidade: noções e união de dois eventos|ANA.RLM.8;OUV.RLM.11|p|Câmara: "noções de probabilidade"',
  'rl15|RLM|Probabilidade condicional|OUV.RLM.12',
  'rl16|RLM|Probabilidade de eventos independentes|OUV.RLM.13',
  // ---------------- INFORMÁTICA ----------------
  'in01|INF|Hardware, software e dispositivos de entrada, saída e armazenamento|ANA.INF.1;TEC.INF.1;OUV.INF.1',
  'in02|INF|Windows 10 e 11: conceitos, recursos e uso|ANA.INF.2;TEC.INF.2',
  'in03|INF|Distribuições Linux: conceitos e uso|ANA.INF.2.1:2;TEC.INF.2.1:2',
  'in04|INF|Windows 7: pastas, arquivos, atalhos, área de trabalho e de transferência|OUV.INF.2;OUV.ESP.9',
  'in05|INF|Editor de textos: Word (2010/365) e LibreOffice Writer|ANA.INF.3;TEC.INF.3;OUV.INF.3;OUV.ESP.9.1:9|p|Chapada: Word 2010; Câmara: Microsoft 365 e Writer',
  'in06|INF|Planilhas: Excel (2010/365) e LibreOffice Calc|ANA.INF.3.1:3;TEC.INF.3.1:3;OUV.INF.4;OUV.ESP.9.2:9|p|Chapada: Excel 2010 (inclui macros); Câmara: 365 e Calc',
  'in07|INF|Apresentações: PowerPoint (2010/365) e LibreOffice Impress|ANA.INF.3.2:3;TEC.INF.3.2:3;OUV.INF.5|p|Versões diferentes',
  'in08|INF|Correio eletrônico|ANA.INF.4;TEC.INF.4;OUV.INF.6;OUV.ESP.9.3:9',
  'in09|INF|Internet e navegadores (Edge, Firefox, Chrome): URL, links, busca|ANA.INF.4.1:4;TEC.INF.4.1:4;OUV.INF.7;OUV.ESP.9.4:9',
  'in10|INF|Redes de computadores: conceitos, protocolos, TCP/IP e ferramentas de colaboração|ANA.INF.4.2:4;TEC.INF.4.2:4',
  'in11|INF|Computação em nuvem, serviços online, redes sociais e comunicação digital|ANA.INF.5;TEC.INF.5',
  'in12|INF|Segurança da informação: vírus, malware, phishing, engenharia social, backup, firewall, antivírus, 2FA|ANA.INF.6;TEC.INF.6',
  // ---------------- HISTÓRIA E GEOGRAFIA DE MT ----------------
  'hg01|HGMT|Colonial: os bandeirantes — escravidão indígena e exploração do ouro|ANA.HGMT.1:C1;TEC.HGMT.1:C1',
  'hg02|HGMT|Colonial: fundação de Cuiabá — tensões entre fundadores e administração colonial|ANA.HGMT.2:C2;TEC.HGMT.2:C2',
  'hg03|HGMT|Colonial: fundação de Vila Bela da Santíssima Trindade e criação da Capitania de MT|ANA.HGMT.3:C3;TEC.HGMT.3:C3',
  'hg04|HGMT|Colonial: a escravidão negra em Mato Grosso|ANA.HGMT.4:C4;TEC.HGMT.4:C4',
  'hg05|HGMT|Imperial: crise da mineração e alternativas econômicas da Província|ANA.HGMT.5:I1;TEC.HGMT.5:I1',
  'hg06|HGMT|Imperial: a Rusga|ANA.HGMT.6:I2;TEC.HGMT.6:I2',
  'hg07|HGMT|Imperial: os quilombos em Mato Grosso|ANA.HGMT.7:I3;TEC.HGMT.7:I3',
  'hg08|HGMT|Imperial: os Presidentes de Província e suas realizações|ANA.HGMT.8:I4;TEC.HGMT.8:I4',
  'hg09|HGMT|Imperial: Guerra da Tríplice Aliança contra o Paraguai e participação de MT|ANA.HGMT.9:I5;TEC.HGMT.9:I5',
  'hg10|HGMT|Imperial: economia de MT após a Guerra da Tríplice Aliança|ANA.HGMT.10:I6;TEC.HGMT.10:I6',
  'hg11|HGMT|Imperial: o fim do Império em Mato Grosso|ANA.HGMT.11:I7;TEC.HGMT.11:I7',
  'hg12|HGMT|República: o coronelismo em Mato Grosso|ANA.HGMT.12:R1;TEC.HGMT.12:R1',
  'hg13|HGMT|República: economia na Primeira República — usinas de açúcar e criação de gado|ANA.HGMT.13:R2;TEC.HGMT.13:R2',
  'hg14|HGMT|República: relações de trabalho em MT na Primeira República|ANA.HGMT.14:R3;TEC.HGMT.14:R3',
  'hg15|HGMT|República: Mato Grosso durante a Era Vargas — política e economia|ANA.HGMT.15:R4;TEC.HGMT.15:R4',
  'hg16|HGMT|República: política fundiária e tensões sociais no campo|ANA.HGMT.16:R5;TEC.HGMT.16:R5',
  'hg17|HGMT|República: governadores estaduais e suas realizações|ANA.HGMT.17:R6;TEC.HGMT.17:R6',
  'hg18|HGMT|Atualidades: política, economia, sociedade, educação, tecnologia, energia, relações internacionais, sustentabilidade, segurança, ecologia|ANA.HGMT.18:R7;TEC.HGMT.18:R7;OUV.CGL.9|p|Câmara: com vinculações históricas de MT; Chapada: atualidades gerais',
  'hg19|HGMT|Geografia: Mato Grosso e a região Centro-Oeste|ANA.HGMT.19:G1;TEC.HGMT.19:G1',
  'hg20|HGMT|Geografia: geopolítica de Mato Grosso|ANA.HGMT.20:G2;TEC.HGMT.20:G2',
  'hg21|HGMT|Geografia: ocupação do território|ANA.HGMT.21:G3;TEC.HGMT.21:G3',
  'hg22|HGMT|Geografia: aspectos físicos e domínios naturais do espaço mato-grossense|ANA.HGMT.22:G4;TEC.HGMT.22:G4',
  'hg23|HGMT|Geografia: aspectos político-administrativos|ANA.HGMT.23:G5;TEC.HGMT.23:G5',
  'hg24|HGMT|Geografia: aspectos socioeconômicos de MT|ANA.HGMT.24:G6;TEC.HGMT.24:G6',
  'hg25|HGMT|Geografia: formação étnica|ANA.HGMT.25:G7;TEC.HGMT.25:G7',
  'hg26|HGMT|Geografia: programas governamentais e fronteira agrícola|ANA.HGMT.26:G8;TEC.HGMT.26:G8',
  'hg27|HGMT|Geografia: a economia do Estado no contexto nacional|ANA.HGMT.27:G9;TEC.HGMT.27:G9',
  'hg28|HGMT|Geografia: a urbanização do Estado|ANA.HGMT.28:G10;TEC.HGMT.28:G10',
  // ---------------- ÉTICA E FILOSOFIA ----------------
  'et01|ETI|Fundamentos da Filosofia|ANA.ETI.1;TEC.ETI.1',
  'et02|ETI|Filosofia moral: Ética ou filosofia moral|ANA.ETI.2;TEC.ETI.2',
  'et03|ETI|Consciência crítica e filosofia|ANA.ETI.3;TEC.ETI.3',
  'et04|ETI|A relação entre os valores éticos ou morais e a cultura|ANA.ETI.4;TEC.ETI.4',
  'et05|ETI|Juízos de fato (de realidade) e juízos de valor|ANA.ETI.5;TEC.ETI.5',
  'et06|ETI|Ética e cidadania|ANA.ETI.6;TEC.ETI.6',
  'et07|ETI|Racionalismo ético|ANA.ETI.7;TEC.ETI.7',
  'et08|ETI|Ética e liberdade|ANA.ETI.8;TEC.ETI.8',
  // ---------------- RELAÇÕES INTERPESSOAIS / ATENDIMENTO ----------------
  'ri01|RI|Relações humanas / interpessoais|ANA.RI.1;TEC.RI.1;TEC.TEC.10',
  'ri02|RI|Comunicação interpessoal|ANA.RI.2;TEC.RI.2;OUV.ESP.3',
  'ri03|RI|Características de um bom atendimento|ANA.RI.3;TEC.RI.3;TEC.TEC.10.1:10;OUV.ESP.3.1:3',
  'ri04|RI|Postura profissional|ANA.RI.4;TEC.RI.4;OUV.ESP.3.2:3',
  'ri05|RI|Integração|ANA.RI.5;TEC.RI.5',
  'ri06|RI|Empatia|ANA.RI.6;TEC.RI.6',
  'ri07|RI|Capacidade de ouvir|ANA.RI.7;TEC.RI.7',
  'ri08|RI|Argumentação flexível|ANA.RI.8;TEC.RI.8',
  'ri09|RI|Técnicas de atendimento presencial, telefônico e eletrônico; recepção|OUV.ESP.3.3:3;TEC.TEC.10.2:10|p|Chapada detalha os canais; Técnico cita recepção',
  // ---------------- DIREITO ADMINISTRATIVO / NOÇÕES DE ADM PÚBLICA ----------------
  'da01|DA|Princípios da Administração Pública (expressos e implícitos — LIMPE)|ANA.NAP.1.1:1;ANA.DA.1;ANA.AP.2;TEC.TEC.1.1:1;TEC.TEC.3;OUV.ESP.1',
  'da02|DA|Estado, governo e administração pública: conceitos, elementos, poderes, organização, natureza e fins|ANA.NAP.1;TEC.TEC.1',
  'da03|DA|Organização administrativa do Estado: Administração direta e indireta; órgãos públicos|ANA.NAP.2:2 e 3;ANA.DA.2;TEC.TEC.2',
  'da04|DA|Agentes públicos: espécies, classificação, poderes, deveres e prerrogativas; cargo, emprego e função|ANA.NAP.4;ANA.DA.8;TEC.TEC.2.1:2',
  'da05|DA|Poderes administrativos|ANA.NAP.5;ANA.DA.4;TEC.TEC.3.1:3',
  'da06|DA|Atos administrativos: conceito, requisitos, atributos, classificação, espécies e invalidação|ANA.NAP.6;ANA.DA.3;TEC.TEC.3.2:3',
  'da07|DA|Controle da Administração Pública: administrativo, legislativo e judicial|ANA.NAP.7;ANA.DA.10;TEC.TEC.4',
  'da08|DA|Responsabilidade civil da Administração Pública|ANA.NAP.7.1:7;TEC.TEC.4.1:4',
  'da09|DA|Contratos administrativos|ANA.DA.5',
  'da10|DA|Licitação — Lei nº 14.133/2021|ANA.DA.6',
  'da11|DA|Processo administrativo|ANA.DA.7',
  'da12|DA|Serviços públicos|ANA.DA.9',
  'da13|DA|Improbidade administrativa|ANA.DA.11',
  'da14|DA|Bens públicos|ANA.DA.12',
  // ---------------- DIREITO CONSTITUCIONAL ----------------
  'dc01|DC|CF/88: princípios fundamentais (arts. 1º a 4º)|OUV.CGL.13:13',
  'dc02|DC|CF/88: direitos e garantias fundamentais — direitos e deveres individuais e coletivos (art. 5º)|ANA.DC.1;TEC.TEC.5;OUV.CGL.13.1:13|p|Chapada: arts. 1º a 14',
  'dc03|DC|CF/88: direitos sociais (arts. 6º a 11)|ANA.DC.1.1:1;TEC.TEC.5.1:5;OUV.CGL.13.2:13',
  'dc04|DC|CF/88: nacionalidade, direitos políticos e cidadania (arts. 12 a 14)|ANA.DC.1.2:1;TEC.TEC.5.2:5;OUV.CGL.13.3:13|p|Técnico: "cidadania"',
  'dc05|DC|CF/88: Organização do Estado — dos Municípios|ANA.DC.2',
  'dc06|DC|CF/88: Administração Pública (arts. 37 a 41)|TEC.TEC.5.3:5;OUV.CGL.13.4:13;OUV.ESP.10:10 (art. 37)|p|Técnico: arts. 37 a 41; Chapada: arts. 37 a 43',
  'dc07|DC|CF/88: arts. 42 e 43 (militares dos Estados; regiões)|OUV.CGL.13.5:13',
  'dc08|DC|CF/88: Saúde (arts. 196 a 200)|OUV.CGL.13.6:13',
  // ---------------- ADMINISTRAÇÃO PÚBLICA E GESTÃO (Analista) ----------------
  'ap01|AP|Organização governamental brasileira|ANA.AP.1',
  'ap02|AP|Paradigmas e reformas: administração burocrática; Estado de bem-estar social; nova gestão pública/New Public Management|ANA.AP.3',
  'ap03|AP|Governança pública: fundamentos, princípios, governabilidade e accountability|ANA.AP.4;ANA.AP.9',
  'ap04|AP|Políticas públicas: formulação e avaliação; Estado e políticas públicas; processo; arranjos institucionais|ANA.AP.5',
  'ap05|AP|Planejamento público: planos, programas de governo, processo orçamentário, PPA, LDO e LOA|ANA.AP.6',
  'ap06|AP|Flexibilização da ação estatal: PPP, consórcios, terceirização, redes e parcerias com OSC|ANA.AP.7',
  'ap07|AP|Mudanças institucionais: conselhos, OS, OSCIP, agência reguladora, agência executiva, centralização × descentralização|ANA.AP.8',
  'ap08|AP|Estratégia em organizações públicas: planejamento, cinco tipos de estratégia, processo estratégico, estrategistas e gerentes, mudança estratégica|ANA.AP.10',
  'ap09|AP|Gestão por resultados: metodologias, avaliação de programas e projetos, indicadores de desempenho|ANA.AP.11',
  // ---------------- LEGISLAÇÃO DE CUIABÁ ----------------
  'lc01|LEGC|Lei Orgânica do Município de Cuiabá-MT|ANA.LEG.1;TEC.LEG.1',
  'lc02|LEGC|Regimento Interno da Câmara Municipal de Cuiabá (Resolução nº 08/2016)|ANA.LEG.2;TEC.LEG.2',
  'lc03|LEGC|LC nº 93/2003 — Estatuto dos Servidores|ANA.LEG.3;TEC.LEG.3',
  'lc04|LEGC|LC nº 235/2011 — PCCV da Câmara, com alterações da LC nº 609/2026|ANA.LEG.4;TEC.LEG.4',
  // ---------------- LEGISLAÇÃO FEDERAL APLICADA ----------------
  'lf01|LEGF|Lei nº 13.709/2018 — LGPD|ANA.INF.7;TEC.INF.7;OUV.ESP.10.2:10|p|Câmara: noções (em Informática); Chapada: legislação específica do Ouvidor',
  'lf02|LEGF|Lei nº 12.527/2011 — Lei de Acesso à Informação (LAI)|OUV.ESP.10.1:10',
  'lf03|LEGF|Lei nº 13.460/2017 — Direitos do Usuário do Serviço Público|OUV.ESP.10.15:10',
  // ---------------- OUVIDORIA ----------------
  'ov01|OUVD|Ouvidoria Pública: conceitos, objetivos, importância e funcionamento|OUV.ESP.2',
  'ov02|OUVD|Manifestações: reclamações, denúncias, solicitações, sugestões e elogios|OUV.ESP.2.1:2',
  'ov03|OUVD|Gestão de demandas: recebimento, análise, registro, encaminhamento, acompanhamento e controle de prazos|OUV.ESP.5',
  'ov04|OUVD|Sigilo e ética profissional: informações confidenciais e responsabilidade no atendimento ao cidadão|OUV.ESP.6',
  'ov05|OUVD|Elaboração de relatórios: organização de dados, produção e apresentação de informações|OUV.ESP.8',
  // ---------------- REDAÇÃO OFICIAL E ARQUIVOLOGIA ----------------
  'ra01|RDA|Redação oficial: comunicações oficiais, ofícios, memorandos, requerimentos, atas, sinopses, relatórios, respostas formais e correspondências|TEC.TEC.8:8 e 14;OUV.ESP.4|p|Técnico inclui atas, sinopses e requerimentos; Ouvidor: ofícios, memorandos, relatórios e respostas formais',
  'ra02|RDA|Arquivologia: protocolo, classificação, organização, guarda, conservação e arquivamento|TEC.TEC.9;OUV.ESP.7|p|Técnico inclui protocolo e conservação',
  // ---------------- PODER E PROCESSO LEGISLATIVO (Técnico) ----------------
  'pl01|PLM|Organização e funcionamento do Poder Legislativo Municipal: Câmara, Mesa Diretora, Plenário, Comissões Permanentes e Temporárias|TEC.TEC.6',
  'pl02|PLM|Processo legislativo e técnica legislativa|TEC.TEC.7',
  // ---------------- TÓPICOS COMPLEMENTARES DO TÉCNICO ----------------
  'tc01|TCX|Noções de contabilidade aplicada ao setor público: receita, despesa e orçamento público|TEC.TEC.11',
  'tc02|TCX|Noções de higiene e segurança do trabalho|TEC.TEC.12',
  'tc03|TCX|Noções de fotografia aplicada às atividades institucionais|TEC.TEC.13',
  // ---------------- CONHECIMENTOS GERAIS DO BRASIL (Chapada) ----------------
  'cg01|CGB|Fundamentos históricos e geográficos do Brasil|OUV.CGL.1||||1',
  'cg02|CGB|República Velha (1889 a 1930)|OUV.CGL.2||||1',
  'cg03|CGB|A Revolução de 1930 e a Era Vargas|OUV.CGL.3||||1',
  'cg04|CGB|O Estado Novo (1937 a 1945)|OUV.CGL.4||||1',
  'cg05|CGB|República Liberal-Conservadora (1946 a 1964)|OUV.CGL.5||||1',
  'cg06|CGB|Governos militares|OUV.CGL.6||||1',
  'cg07|CGB|A Nova República|OUV.CGL.7||||1',
  'cg08|CGB|Brasil contemporâneo|OUV.CGL.8||||1',
  'cg09|CGB|Interação entre clima, vegetação, relevo, hidrografia e solo no espaço natural brasileiro|OUV.CGL.10||||1',
  'cg10|CGB|Recursos minerais e energéticos brasileiros: produção, consumo, conservação e esgotamento|OUV.CGL.11||||1',
  'cg11|CGB|Aspectos históricos e geográficos do Município de Chapada dos Guimarães|OUV.CGL.12',
  // ---------------- LEGISLAÇÃO DE CHAPADA ----------------
  'lh01|LEGCH|Lei Orgânica do Município de Chapada dos Guimarães|OUV.CGL.14',
  'lh02|LEGCH|Estatuto do Servidor Municipal de Chapada dos Guimarães|OUV.CGL.14.1:14',
  'lh03|LEGCH|Lei nº 1447/2011 e suas alterações (ementa a confirmar — não descrita no edital)|OUV.CGL.15',
  'lh04|LEGCH|Lei Complementar nº 62/2014 (ementa a confirmar — não descrita no edital)|OUV.CGL.16',
  'lh05|LEGCH|Lei nº 1570/2014 (ementa a confirmar — não descrita no edital)|OUV.CGL.17',
  'lh06|LEGCH|Lei Complementar nº 97/2023 (ementa a confirmar — não descrita no edital)|OUV.CGL.18'
];

SOS.parseSeedTopicos = function (concursos) {
  var secImp = {};
  concursos.forEach(function (c) { c.secoes.forEach(function (s) { secImp[c.id + '.' + s.k] = s.imp; }); });
  return SOS.SEED_TOPICOS.map(function (line, idx) {
    var p = line.split('|');
    var refs = p[3].split(';').map(function (r) {
      var lab = null, colon = r.indexOf(':');
      if (colon > -1) { lab = r.slice(colon + 1); r = r.slice(0, colon); }
      var parts = r.split('.');
      var conc = parts[0], sec = parts[1], ord = parseFloat(parts.slice(2).join('.'));
      return { c: conc, s: sec, o: ord, l: lab || String(parts.slice(2).join('.')) };
    });
    var concs = [];
    refs.forEach(function (r) { if (concs.indexOf(r.c) < 0) concs.push(r.c); });
    var imp = 0;
    refs.forEach(function (r) { imp = Math.max(imp, secImp[r.c + '.' + r.s] || 2); });
    if (p[6]) imp = parseInt(p[6], 10);
    return {
      id: p[0], disc: p[1], titulo: p[2], refs: refs, concursos: concs,
      parcial: p[4] === 'p', nota: p[5] || '', imp: imp, impManual: p[6] ? imp : null,
      inc: 'sd', incJust: 'Sem dados suficientes: provas anteriores da Selecon ainda não analisadas.',
      status: 'nao', dominioManual: null, primeiroEstudo: null, ultimaRevisao: null,
      rev: null, bonusErro: 0, obs: '', seedOrder: idx, custom: false
    };
  });
};
