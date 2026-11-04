/* Priorização da lei seca do Técnico Legislativo (Câmara de Cuiabá · Selecon).
   ESTIMATIVA — não é garantia de cobrança. Critérios, nesta ordem:
   (a) o que a Selecon já cobrou (provas de 2021 informadas por você);
   (b) números, prazos, quóruns, competências, vedações e exceções;
   (c) ligação com o cargo de Técnico (estrutura da Câmara, Mesa, comissões, sessões,
       processo legislativo; direitos, deveres, posse, estágio, acúmulo e disciplina);
   (d) alterações recentes (LC 609/2026).
   Números de artigo só aparecem quando vêm do edital (verificados) ou do texto que você colar. */
(function () {
  var SOS = window.SOS;
  var P = SOS.leiPrior = {};
  var PORTAL = 'https://legislativo.camaracuiaba.mt.gov.br';
  var GAZETA = 'https://gazetamunicipal.cuiaba.mt.gov.br';

  // marcadores do critério (b)
  var RX_DADO = /\b(prazo|dias?|horas?|minutos?|meses|anos?|qu[oó]rum|maioria (absoluta|simples|qualificada)|dois ter[cç]os|2\/3|um ter[cç]o|1\/3|percentual|%|por cento|compete|compet[eê]ncia|privativ|vedad|[eé] vedado|proibid|n[aã]o poder[aá]|salvo|exceto|ressalvad|somente|exclusivamente)\b/gi;

  P.NORMAS = {
    lc01: {
      nome: 'Lei Orgânica do Município de Cuiabá',
      fontes: [['Portal Legislativo da Câmara Municipal de Cuiabá', PORTAL]],
      temas: [
        { n: 1, tema: 'Renúncia de vereador (dirigida à Mesa Diretora)', a: 1, kw: /ren[uú]ncia/i, porque: 'Cobrado pela Selecon (Técnico 2021): a banca pediu a quem a renúncia é dirigida.', q: 'A renúncia do vereador é dirigida a quem e quando produz efeitos?' },
        { n: 1, tema: 'Tributos que o Município pode instituir', a: 1, kw: /tribut|impostos?\b|taxas?\b|contribui[cç][aã]o de melhoria/i, porque: 'Cobrado pela Selecon (Técnico 2021).', q: 'Quais tributos o Município pode instituir segundo a Lei Orgânica?' },
        { n: 1, tema: 'Alienação de bens municipais', a: 1, kw: /aliena[cç][aã]o|alienar|bens (municipais|im[oó]veis|m[oó]veis)|doa[cç][aã]o|permuta/i, porque: 'Cobrado pela Selecon (Analista 2021) — exige autorização, avaliação, licitação: dado exato.', q: 'Quais requisitos a Lei Orgânica exige para alienar bens imóveis do Município?' },
        { n: 1, tema: 'Vereadores: posse, licença, vedações, perda e extinção do mandato', kw: /vereador|mandato|incompatib|perda do mandato|extin[cç][aã]o|licen[cç]a/i, porque: 'Tema da mesma família do que caiu (renúncia) e cheio de prazos e vedações.', q: 'Em quais casos o vereador perde o mandato e quem declara a perda?' },
        { n: 1, tema: 'Mesa da Câmara e competência privativa da Câmara', kw: /\bMesa\b|compete privativamente|compet[eê]ncia privativa/i, porque: 'Estrutura da Câmara (ligada ao cargo) com competências e mandatos.', q: 'Quanto dura o mandato da Mesa e o que compete privativamente à Câmara?' },
        { n: 1, tema: 'Processo legislativo: iniciativa, emendas à Lei Orgânica, quórum, sanção e veto', kw: /iniciativa|emenda|san[cç][aã]o|veto|promulga|qu[oó]rum|maioria absoluta|dois ter[cç]os/i, porque: 'Quóruns e prazos são o tipo de dado exato que a banca pede.', q: 'Qual o quórum e o número de turnos para aprovar emenda à Lei Orgânica?' },
        { n: 2, tema: 'Sessões legislativas, convocação extraordinária e funcionamento da Câmara', kw: /sess[aã]o legislativa|sess[oõ]es|extraordin[aá]ri|recesso|funcionamento/i, porque: 'Funcionamento da Câmara, com datas e períodos.', q: 'Em que períodos a Câmara se reúne e quem pode convocá-la extraordinariamente?' },
        { n: 2, tema: 'Prefeito: posse, licença, substituição e perda do mandato', kw: /prefeito|vice-prefeito/i, porque: 'Prazos e competências do Executivo — menos ligado ao cargo de Técnico.', q: 'Por quanto tempo o Prefeito pode se ausentar sem licença da Câmara?' },
        { n: 2, tema: 'Fiscalização, controle externo e Tribunal de Contas', kw: /fiscaliza|controle externo|tribunal de contas|presta[cç][aã]o de contas/i, porque: 'Competência da Câmara com prazos de parecer.', q: 'Com que quórum a Câmara pode deixar de seguir o parecer do Tribunal de Contas?' },
        { n: 3, tema: 'Ordem econômica e social, saúde, educação, cultura, meio ambiente e disposições transitórias', kw: /sa[uú]de|educa[cç][aã]o|cultura|meio ambiente|transit[oó]ri|ordem econ[oô]mica|assist[eê]ncia social/i, porque: 'Programático e extenso; pouco dado exato e pouca ligação com o cargo.', q: 'Leitura rápida: identifique só prazos ou percentuais citados.' }
      ]
    },
    lc02: {
      nome: 'Regimento Interno da Câmara Municipal de Cuiabá (Resolução nº 08/2016)',
      fontes: [['Portal Legislativo da Câmara Municipal de Cuiabá', PORTAL]],
      temas: [
        { n: 1, tema: 'Líderes partidários e Colégio de Líderes (escolha e horário)', a: 1, kw: /l[ií]der|col[eé]gio de l[ií]deres|lideran[cç]a/i, porque: 'Cobrado pela Selecon: escolha dos líderes (Técnico 2021) e horário do Colégio de Líderes (Analista 2021).', q: 'Como são escolhidos os líderes e quando se reúne o Colégio de Líderes?' },
        { n: 1, tema: 'Abertura da sessão e quórum (leitura por 5 minutos até formar quórum)', a: 1, kw: /qu[oó]rum|cinco minutos|5 ?\(cinco\) minutos|abertura d[ao]s? sess|n[uú]mero regimental|presen[cç]a/i, porque: 'Cobrado pela Selecon (Analista 2021): o tempo exato de espera/leitura.', q: 'O que acontece se não houver quórum na abertura e por quanto tempo se aguarda?' },
        { n: 1, tema: 'Desconto por falta e frequência dos vereadores', a: 1, kw: /desconto|faltas?\b|aus[eê]ncia|frequ[eê]ncia|subs[ií]dio/i, porque: 'Cobrado pela Selecon (Analista 2021): percentual/regra do desconto.', q: 'Como é calculado o desconto por falta do vereador à sessão?' },
        { n: 1, tema: 'Renúncia e incapacidade civil do vereador; vacância e suplência', a: 1, kw: /ren[uú]ncia|incapacidade|interdi[cç]|vac[aâ]ncia|suplente|extin[cç][aã]o/i, porque: 'Cobrado pela Selecon (Técnico e Analista 2021).', q: 'A quem se dirige a renúncia e o que ocorre em caso de incapacidade civil absoluta?' },
        { n: 1, tema: 'Mesa Diretora: composição, eleição, mandato e competências', kw: /\bMesa\b|Presidente da C[aâ]mara|Secret[aá]rio|elei[cç][aã]o da Mesa/i, porque: 'Estrutura da Câmara (ligada ao cargo); há projeto em 2026 sobre a data da eleição da Mesa.', q: 'Quem compõe a Mesa, quando é eleita e quanto dura o mandato?' },
        { n: 1, tema: 'Comissões permanentes e temporárias (CPI): composição e prazos', kw: /comiss[aã]o|comiss[oõ]es|parecer|relator/i, porque: 'O Técnico dá suporte às Comissões (atribuição do cargo) e há muitos prazos.', q: 'Qual o prazo da comissão para emitir parecer e quantos membros a compõem?' },
        { n: 1, tema: 'Sessões: ordinárias, extraordinárias, solenes e especiais', kw: /sess[aã]o (ordin|extraord|solene|especial)|sess[oõ]es|ordem do dia|expediente|grande expediente/i, porque: 'Rotina da Câmara ligada ao cargo, com horários e durações.', q: 'Em que dias e horários ocorrem as sessões ordinárias e como se divide a sessão?' },
        { n: 2, tema: 'Proposições, tramitação, urgência e votação', kw: /proposi[cç]|tramita|urg[eê]ncia|vota[cç][aã]o|turno|destaque|requerimento|indica[cç][aã]o|mo[cç][aã]o/i, porque: 'Processo legislativo (ligado ao cargo), mas extenso: ler após o Nível 1.', q: 'Quais são os tipos de votação e quando se exige votação nominal?' },
        { n: 2, tema: 'Direitos, deveres, licenças e decoro dos vereadores', kw: /decoro|licen[cç]a|deveres|direitos do vereador|[eé]tica parlamentar/i, porque: 'Prazos de licença e penalidades.', q: 'Por quanto tempo o vereador pode se licenciar e quando o suplente é convocado?' },
        { n: 3, tema: 'Polícia interna, símbolos, disposições gerais e transitórias', kw: /pol[ií]cia|s[ií]mbolo|transit[oó]ri|disposi[cç][oõ]es (gerais|finais)/i, porque: 'Baixa ligação com o que a banca cobrou.', q: 'Leitura rápida.' }
      ]
    },
    lc03: {
      nome: 'LC nº 93/2003 — Estatuto dos Servidores Públicos de Cuiabá',
      fontes: [['Portal Legislativo da Câmara Municipal de Cuiabá', PORTAL], ['Gazeta Municipal de Cuiabá', GAZETA]],
      edital: [ // artigos citados no Edital 001/2026-CMC (verificados no edital)
        ['13', 'Requisitos para investidura/posse em cargo público', 'O edital lista estes requisitos (item 3.1).', 'Quais são os requisitos para tomar posse em cargo público municipal?'],
        ['13, III', 'Quitação com o fisco municipal (certidão negativa de débitos)', 'Citado no edital (item 16.10, “i”).', 'Que certidão municipal o candidato precisa apresentar na posse?'],
        ['16, § 3º', 'Comprovação dos requisitos na data da posse, com documento original', 'Citado no edital (item 3.2).', 'Em que momento os requisitos do cargo são comprovados?'],
        ['16, § 8º', 'Condição para abertura de concurso', 'Citado no edital (item 2.4).', 'O que o § 8º do art. 16 exige para a abertura do concurso?'],
        ['16, § 9º', 'Reserva de vagas para pessoas com deficiência', 'Citado no edital (item 6.1).', 'Qual a reserva de vagas para PcD prevista no Estatuto?'],
        ['24, § 2º', 'Prazo para a posse: 30 dias da publicação, prorrogável uma vez por igual período', 'Prazo exato citado no edital (item 16.5).', 'Qual o prazo para a posse e pode ser prorrogado?'],
        ['24, § 5º', 'Declaração de bens e valores e de outro cargo/função na posse', 'Citado no edital (itens 3.1 “k” e 16.10 “k”).', 'Que declarações o servidor apresenta no ato da posse?'],
        ['25', 'Posse depende de inspeção médica oficial', 'Citado no edital (itens 3.1 “f” e 16.6).', 'A posse depende de qual inspeção?'],
        ['26, §§ 1º e 2º', 'Exercício em 5 dias da posse, prorrogável por igual período, sob pena de exoneração', 'Prazo exato citado no edital (item 16.7).', 'Qual o prazo para entrar em exercício após a posse?'],
        ['28', 'Estágio probatório de 3 anos', 'Citado no edital (item 16.8).', 'Quanto dura o estágio probatório?'],
        ['145 e 146', 'Incompatibilidade para nova investidura após demissão', 'Citado no edital (item 3.1 “i”).', 'Quem fica incompatibilizado para nova investidura?'],
        ['186', 'Nomeação por ato do Presidente da Câmara (servidores do Legislativo)', 'Citado no edital (item 16.4).', 'Quem nomeia os servidores da Câmara?']
      ],
      temas: [
        { n: 1, tema: 'Provimento: nomeação, posse, exercício e estágio probatório', kw: /posse|exerc[ií]cio|nomea[cç][aã]o|est[aá]gio probat[oó]rio|provimento|investidura/i, porque: 'Ligado ao cargo e cheio de prazos (vários citados no próprio edital).', q: 'Quais os prazos de posse e de exercício e o que acontece se forem perdidos?' },
        { n: 1, tema: 'Acumulação de cargos', kw: /acumula/i, porque: 'Vedação com exceções — formato típico de questão.', q: 'Em que hipóteses a acumulação de cargos é permitida?' },
        { n: 1, tema: 'Regime disciplinar: deveres, proibições, penalidades e prescrição', kw: /dever|proibi|penalidad|advert[eê]ncia|suspens[aã]o|demiss|cassa[cç]|prescri/i, porque: 'Ligado ao cargo; penalidades com prazos e quem aplica.', q: 'Qual o prazo máximo da suspensão e em quanto tempo prescreve a advertência?' },
        { n: 1, tema: 'Processo administrativo disciplinar e sindicância', kw: /processo administrativo disciplinar|sindic[aâ]ncia|comiss[aã]o processante|afastamento preventivo/i, porque: 'Prazos e composição de comissão.', q: 'Qual o prazo para concluir o PAD e quantos membros tem a comissão?' },
        { n: 2, tema: 'Vacância, remoção, redistribuição e substituição', kw: /vac[aâ]ncia|exonera|remo[cç][aã]o|redistribui|substitui/i, porque: 'Formas de vacância/movimentação, com hipóteses.', q: 'Quais são as formas de vacância do cargo público?' },
        { n: 2, tema: 'Direitos e vantagens: vencimento, adicionais, gratificações, férias e licenças', kw: /vencimento|adicional|gratifica|f[eé]rias|licen[cç]a|afastamento|aux[ií]lio/i, porque: 'Muitos números (dias de férias e de licença).', q: 'Quantos dias de férias o servidor tem e quando pode parcelar?' },
        { n: 3, tema: 'Seguridade, aposentadoria e disposições finais', kw: /seguridade|aposentadoria|pens[aã]o|transit[oó]ri/i, porque: 'Pouca ligação com o cargo nesta prova.', q: 'Leitura rápida.' }
      ]
    },
    lc04: {
      nome: 'LC nº 235/2011 — Plano de Cargos, Carreiras e Vencimentos da Câmara (com a LC nº 609/2026)',
      fontes: [['Portal Legislativo da Câmara Municipal de Cuiabá', PORTAL]],
      edital: [
        ['4º, § 2º', 'Atribuições do Técnico Legislativo', 'É o SEU cargo — citado no edital (Anexo IV).', 'Quais são as atribuições do Técnico Legislativo previstas na LC 235/2011?'],
        ['4º, §§ 13 e 14', 'Técnico Legislativo — Sonorização e Cerimonial (incluídos pela LC 609/2026)', 'Alteração recente (LC 609/2026) citada no edital.', 'Que especialidades de Técnico a LC 609/2026 criou?'],
        ['4º, §§ 8º a 12', 'Novas especialidades de Analista (TI, Segurança do Trabalho, Psicólogo, Assistente Social, Jornalismo) — LC 609/2026', 'Alteração recente citada no edital.', 'Quais cargos a LC 609/2026 criou na Câmara?'],
        ['36', 'Jornada de 30 horas semanais', 'Dado exato citado no edital (item 2.2).', 'Qual a jornada semanal dos servidores da Câmara?']
      ],
      temas: [
        { n: 1, tema: 'Cargos, atribuições e requisitos (com as mudanças da LC 609/2026)', kw: /atribui[cç]|requisit|cargo|Lei Complementar n?º? ?609|609\/2026|acrescid|inclu[ií]d/i, porque: 'Seu cargo + alteração recente (critérios c e d).', q: 'O que muda com a LC 609/2026 no quadro da Câmara?' },
        { n: 1, tema: 'Estrutura da carreira: classes, níveis, progressão e promoção', kw: /progress|promo[cç][aã]o|classe|n[ií]vel|padr[aã]o|refer[eê]ncia|interst[ií]cio/i, porque: 'Números (interstícios, percentuais) — dado exato.', q: 'Qual o interstício para a progressão e qual o percentual entre níveis?' },
        { n: 2, tema: 'Jornada, vencimentos, tabelas e gratificações', kw: /jornada|vencimento|tabela|gratifica|adicional/i, porque: 'Valores e percentuais; tabelas são cansativas — ler o essencial.', q: 'Qual a jornada e como se compõe a remuneração?' },
        { n: 2, tema: 'Avaliação de desempenho e capacitação', kw: /avalia[cç][aã]o|desempenho|capacita/i, porque: 'Ligada à progressão.', q: 'Como a avaliação de desempenho afeta a progressão?' },
        { n: 3, tema: 'Enquadramento e disposições transitórias/finais', kw: /enquadramento|transit[oó]ri|disposi[cç][oõ]es finais/i, porque: 'Regras de transição: baixa chance de cobrança.', q: 'Leitura rápida.' }
      ]
    }
  };

  /* título dos blocos curtos de lei seca no cronograma: percorre os temas do Nível 1 e depois do 2 */
  P.blocoTitulo = function (tid, n, revisao) {
    var N = P.NORMAS[tid]; if (!N) return 'Lei seca';
    var curto = N.nome.split(' — ')[0].replace(' do Município de Cuiabá', '').replace(' da Câmara Municipal de Cuiabá', '');
    if (revisao) return 'Revisão de lei seca — ' + curto + ': destaques do Nível 1 (antes do simulado)';
    var lista = N.temas.filter(function (t) { return t.n === 1; }).concat(N.temas.filter(function (t) { return t.n === 2; }));
    var t = lista[(n - 1) % lista.length];
    return 'Lei seca — ' + curto + ' · Nível ' + t.n + ': ' + t.tema;
  };

  /* classifica os artigos do texto colado em 3 níveis */
  P.classificar = function (lei) {
    var N = P.NORMAS[lei.topicId]; if (!N || !lei.arts || !lei.arts.length) return null;
    var out = lei.arts.map(function (a, i) {
      var txt = a.t, reasons = [], score = 0, nivel = 3, tema = null;
      N.temas.forEach(function (t) { if (t.kw.test(txt) && (!tema || t.n < tema.n || (t.n === tema.n && t.a && !tema.a))) tema = t; });
      if (tema) { nivel = tema.n; score += (4 - tema.n) * 3 + (tema.a ? 5 : 0); reasons.push(tema.porque); }
      var dados = (txt.match(RX_DADO) || []).length;
      if (dados) { score += Math.min(4, dados); reasons.push('Tem dado exato (prazo/quórum/competência/vedação/exceção).'); }
      if (/609\/2026|Lei Complementar n?º? ?609/i.test(txt)) { score += 3; nivel = 1; reasons.push('Alteração recente (LC 609/2026).'); }
      if (nivel === 2 && dados >= 2) nivel = 1;
      if (nivel === 3 && dados >= 2) nivel = 2;
      if (a.nivelManual) { nivel = a.nivelManual; reasons.unshift('Nível ajustado por você.'); }
      var assunto = txt.replace(/^(Art\.?\s*\d+[ºo°]?(-[A-Z])?\.?\s*[-–]?\s*)/i, '').replace(/\s+/g, ' ').slice(0, 110);
      var q = tema && tema.n === 1 ? tema.q : perguntaDe(a, txt);
      return { i: i, n: a.n, nivel: nivel, score: score, assunto: assunto, porque: reasons.length ? reasons : ['Sem marcadores de cobrança: leitura rápida.'], pergunta: q, chars: txt.length };
    });
    // o Nível 1 deve caber em ~1 semana de leitura (6 blocos de 35 min); excedente desce para o Nível 2
    var orcamento = 6 * 35 * 450, n1 = out.filter(function (x) { return x.nivel === 1 && !lei.arts[x.i].nivelManual; }).sort(function (a, b) { return b.score - a.score; }), soma = 0;
    n1.forEach(function (x) { soma += x.chars; if (soma > orcamento) x.nivel = 2; });
    return out;
  };
  function perguntaDe(a, txt) {
    var ref = /^\d/.test(a.n) ? 'art. ' + a.n : a.n;
    if (/qu[oó]rum|maioria|ter[cç]os/i.test(txt)) return 'Qual o quórum exigido no ' + ref + '?';
    if (/prazo|dias?|horas?|minutos?|meses|anos?/i.test(txt)) return 'Qual o prazo (e a contagem) previsto no ' + ref + '?';
    if (/compete|compet[eê]ncia|privativ/i.test(txt)) return 'De quem é a competência no ' + ref + '?';
    if (/vedad|proibid|n[aã]o poder[aá]/i.test(txt)) return 'O que é vedado pelo ' + ref + ' e há exceção?';
    if (/salvo|exceto|ressalvad/i.test(txt)) return 'Qual a exceção prevista no ' + ref + '?';
    return 'Em uma frase: o que o ' + ref + ' estabelece?';
  }
})();
