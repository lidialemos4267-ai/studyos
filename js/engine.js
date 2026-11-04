/* StudyOS — motores: estatísticas, prioridade, repetição espaçada, revisões, planejamento, reorganização, recomendações. */
(function () {
  var SOS = window.SOS, U = SOS.U;
  var E = SOS.E = {};

  E.IMP = { 4: 'Muito alta', 3: 'Alta', 2: 'Média', 1: 'Baixa' };
  E.INC = { alta: 'Alta', media: 'Média', baixa: 'Baixa', sd: 'Sem dados' };
  E.INC_VAL = { alta: 1.3, media: 1.0, baixa: 0.8, sd: 1.0 };
  E.STATUS = { nao: 'Não iniciado', estudando: 'Estudando', revisar: 'Revisar', finalizado: 'Finalizado' };
  E.METODOS = ['Questões', 'Aula', 'Leitura', 'Lei seca', 'Revisão', 'Simulado', 'Discursiva', 'Flashcards'];
  E.CAT_ERRO = ['Falta de conhecimento teórico', 'Esquecimento', 'Interpretação incorreta', 'Desatenção', 'Confusão entre conceitos', 'Desconhecimento da legislação', 'Falta de prática', 'Erro de cálculo ou raciocínio', 'Pressa', 'Pegadinha da banca'];
  E.STATUS_ERRO = ['Novo', 'Precisa estudar novamente', 'Em revisão', 'Corrigido', 'Superado'];
  E.CAT_DISC = ['Conhecimento do conteúdo', 'Estrutura textual', 'Introdução', 'Desenvolvimento', 'Conclusão', 'Coesão e coerência', 'Argumentação', 'Clareza e objetividade', 'Gramática e ortografia', 'Atendimento ao comando da questão'];

  /* ---------- filtros por concurso ---------- */
  E.topicIn = function (t, conc) { return !conc || conc === 'all' || t.concursos.indexOf(conc) > -1; };
  E.topicsOf = function (conc) { return SOS.S.topicos.filter(function (t) { return E.topicIn(t, conc); }); };
  E.sessionIn = function (s, conc) { if (!conc || conc === 'all') return true; var t = SOS.topic(s.topicId); return t ? E.topicIn(t, conc) : false; };

  /* ---------- estatísticas por tópico ---------- */
  /* junta todos os registros (manuais, TEC e treinos) do mesmo assunto no mesmo dia: um item por assunto por dia */
  E.dailyEntries = function (sessoes) {
    var map = {}, out = [];
    sessoes.forEach(function (s) {
      var k = s.topicId + '|' + s.data, m = map[k];
      if (!m) { m = map[k] = { id: 'd:' + k, topicId: s.topicId, data: s.data, metodo: s.metodo, total: 0, acertos: 0, realizadoMin: 0, planejadoMin: 0, leituraMin: 0, revisao: false, obs: [], partes: [] }; out.push(m); }
      m.total += +s.total || 0; m.acertos += +s.acertos || 0; m.realizadoMin += +s.realizadoMin || 0; m.planejadoMin += +s.planejadoMin || 0; m.leituraMin += +s.leituraMin || 0;
      if (s.revisao || /Revis/.test(s.metodo || '')) m.revisao = true;
      if (s.obs) m.obs.push(s.obs);
      if (m.partes.length && m.metodo.split(' + ').indexOf(s.metodo) < 0) m.metodo += ' + ' + s.metodo;
      m.partes.push(s);
    });
    out.forEach(function (m) { m.obs = m.obs.join(' | '); });
    return out;
  };
  E.topicStats = function (tid) {
    var ss = E.dailyEntries(SOS.S.sessoes.filter(function (s) { return s.topicId === tid; })).sort(function (a, b) { return a.data < b.data ? -1 : 1; });
    var tot = 0, ac = 0, min = 0;
    ss.forEach(function (s) { tot += +s.total || 0; ac += +s.acertos || 0; min += +s.realizadoMin || 0; });
    var erros = SOS.S.erros.filter(function (e) { return e.topicId === tid; });
    var recorr = erros.filter(function (e) { return (e.ocorrencias || 1) > 1; }).length;
    return { sessoes: ss, total: tot, acertos: ac, erros: tot - ac, pct: U.pct(ac, tot), min: min, trend: E.trend(ss), errosCaderno: erros.length, recorrentes: recorr };
  };
  /* tendência: últimas 3 sessões com questões × 3 anteriores */
  E.trend = function (ss) {
    var q = ss.filter(function (s) { return +s.total > 0; });
    if (q.length < 4) return null;
    var last = q.slice(-3), prev = q.slice(-6, -3);
    function p(a) { var t = 0, c = 0; a.forEach(function (s) { t += +s.total; c += +s.acertos; }); return t ? c / t * 100 : 0; }
    var d = p(last) - p(prev);
    return d > 5 ? 'up' : d < -5 ? 'down' : 'flat';
  };
  /* domínio: alto / intermediário / baixo / não estudado */
  E.dominio = function (t, st) {
    st = st || E.topicStats(t.id);
    if (t.dominioManual) return t.dominioManual;
    if (t.status === 'nao' && !st.sessoes.length) return 'nao';
    if (st.total >= 5) {
      var p = st.pct;
      var penal = st.recorrentes > 0 ? 5 : 0;
      if (p - penal >= 80) return 'alto';
      if (p - penal >= 65) return 'medio';
      return 'baixo';
    }
    if (t.status === 'finalizado') return 'medio';
    return st.sessoes.length ? 'baixo' : 'nao';
  };
  E.DOM = { alto: 'Domínio alto', medio: 'Domínio intermediário', baixo: 'Domínio baixo', nao: 'Ainda não estudado' };
  E.DOM_VAL = { alto: 0.85, medio: 0.55, baixo: 0.25, nao: 0 };

  /* ---------- prioridade ---------- */
  E.phaseWeights = function (date) {
    date = date || U.today();
    var ouv = SOS.conc('OUV');
    var f = SOS.S.settings.fase;
    var w = (ouv && date <= ouv.dataProva) ? f.antes : f.depois;
    var out = {};
    SOS.S.concursos.forEach(function (c) {
      var v = w[c.id] != null ? w[c.id] : (c.dataProva >= date ? 20 : 0);
      if (c.dataProva < date) v = 0;
      out[c.id] = v / 100;
    });
    return out;
  };
  E.topicImpFor = function (t, cid) {
    var c = SOS.conc(cid); var m = 0;
    t.refs.forEach(function (r) {
      if (r.c !== cid) return;
      var s = c && c.secoes.find(function (x) { return x.k === r.s; });
      m = Math.max(m, s ? s.imp : 2);
    });
    return t.impManual || m || t.imp;
  };
  /* pontos da prova em jogo por seção do edital (estimativa quando o edital só informa o total da área) */
  E.sectionPoints = function (c, k) {
    var s = c.secoes.find(function (x) { return x.k === k; }); if (!s) return 0;
    var a = c.areas[s.area]; if (!a) return 0;
    var same = c.secoes.filter(function (x) { return x.area === s.area; });
    var share = s.share != null ? s.share : 1 / same.length;
    return a.q * a.v * share;
  };
  /* cada item do edital vale (pontos da seção ÷ nº de itens); um item dividido em vários tópicos reparte esse valor */
  var _idx = null, _idxKey = '';
  function itemIndex() {
    var key = SOS.S.topicos.length + ':' + SOS.S.concursos.length + ':' + SOS.S.topicos.reduce(function (n, t) { return n + t.refs.length; }, 0);
    if (_idx && _idxKey === key) return _idx;
    _idx = { items: {}, topics: {} }; _idxKey = key;
    SOS.S.topicos.forEach(function (t) {
      t.refs.forEach(function (r) {
        var sk = r.c + '.' + r.s, ik = sk + '#' + r.l;
        (_idx.items[sk] = _idx.items[sk] || {})[r.l] = 1;
        (_idx.topics[ik] = _idx.topics[ik] || {})[t.id] = 1;
      });
    });
    return _idx;
  }
  E.topicValue = function (t, cid) {
    var c = SOS.conc(cid); if (!c || !c.totalPontos) return 0;
    var ix = itemIndex(), v = 0;
    t.refs.forEach(function (r) {
      if (r.c !== cid) return;
      var sk = r.c + '.' + r.s;
      var nItems = Object.keys(ix.items[sk] || {}).length || 1;
      var nTopics = Object.keys(ix.topics[sk + '#' + r.l] || {}).length || 1;
      v += E.sectionPoints(c, r.s) / nItems / nTopics;
    });
    return v / c.totalPontos * 100;
  };
  var IMP_F = { 4: 1.25, 3: 1.1, 2: 1, 1: 0.7 };
  E.priority = function (t, date, w) {
    w = w || E.phaseWeights(date);
    var st = E.topicStats(t.id);
    var base = 0;
    t.concursos.forEach(function (cid) {
      var c = SOS.conc(cid); if (!c) return;
      var days = Math.max(1, U.diffDays(date || U.today(), c.dataProva));
      var prox = days <= 14 ? 1.3 : days <= 30 ? 1.1 : 1;
      base += (w[cid] || 0) * E.topicValue(t, cid) * prox;
    });
    base *= IMP_F[t.imp] || 1;
    var dom = E.dominio(t, st);
    var statusF = { nao: 1, estudando: 0.85, revisar: 0.7, finalizado: 0.2 }[t.status] || 1;
    var p = base * (1 - E.DOM_VAL[dom] * 0.8) * statusF * (E.INC_VAL[t.inc] || 1);
    p *= 1 + Math.min(1, (t.bonusErro || 0) * 0.15);
    if (st.pct != null && st.pct < 70 && st.total >= 5) p *= 1.25;
    return p;
  };

  /* ---------- progresso do edital ---------- */
  E.progresso = function (conc) {
    var ts = E.topicsOf(conc);
    var fin = ts.filter(function (t) { return t.status === 'finalizado'; }).length;
    var est = ts.filter(function (t) { return t.status !== 'nao'; }).length;
    return { total: ts.length, finalizados: fin, iniciados: est, pct: ts.length ? fin / ts.length * 100 : 0, pctIni: ts.length ? est / ts.length * 100 : 0 };
  };

  /* ---------- agregados ---------- */
  E.sum = function (ss) {
    var o = { min: 0, total: 0, acertos: 0 };
    ss.forEach(function (s) { o.min += +s.realizadoMin || 0; o.total += +s.total || 0; o.acertos += +s.acertos || 0; });
    o.erros = o.total - o.acertos; o.pct = U.pct(o.acertos, o.total); return o;
  };
  E.sessions = function (conc, from, to) {
    return SOS.S.sessoes.filter(function (s) { return E.sessionIn(s, conc) && (!from || s.data >= from) && (!to || s.data <= to); });
  };
  E.byDisc = function (conc, from, to) {
    var map = {};
    E.sessions(conc, from, to).forEach(function (s) {
      var t = SOS.topic(s.topicId); var d = t ? t.disc : (s.disc || '—');
      if (!map[d]) map[d] = [];
      map[d].push(s);
    });
    return Object.keys(map).map(function (d) {
      var o = E.sum(map[d]); o.disc = d; o.sess = E.dailyEntries(map[d]); o.trend = E.trend(o.sess.slice().sort(function (a, b) { return a.data < b.data ? -1 : 1; })); return o;
    });
  };
  /* séries semanais (últimas n semanas) */
  E.weekly = function (conc, n) {
    var out = [], mon = U.monday(U.today());
    for (var i = n - 1; i >= 0; i--) {
      var a = U.addDays(mon, -7 * i), b = U.addDays(a, 6);
      var o = E.sum(E.sessions(conc, a, b));
      o.label = U.fmtShort(a);
      o.errosCad = SOS.S.erros.filter(function (e) { return e.data >= a && e.data <= b && (conc === 'all' || !conc || (e.concursos || []).indexOf(conc) > -1); }).length;
      var ds = SOS.S.discursivas.filter(function (d) { return d.data >= a && d.data <= b && d.nota != null && d.nota !== ''; });
      o.discNota = ds.length ? ds.reduce(function (x, d) { return x + (+d.nota); }, 0) / ds.length : null;
      o.discQtd = SOS.S.discursivas.filter(function (d) { return d.data >= a && d.data <= b; }).length;
      var cards = SOS.S.flashcards.reduce(function (acc, c) { (c.log || []).forEach(function (l) { if (l.d >= a && l.d <= b) { acc.t++; if (l.r !== 'errei') acc.ok++; } }); return acc; }, { t: 0, ok: 0 });
      o.cardPct = U.pct(cards.ok, cards.t); o.cardRev = cards.t;
      out.push(o);
    }
    return out;
  };

  /* ---------- revisão de tópicos ---------- */
  E.applySessionToTopic = function (s) {
    var t = SOS.topic(s.topicId); if (!t) return;
    var steps = SOS.S.settings.intervalosTopico;
    if (!t.primeiroEstudo || s.data < t.primeiroEstudo) t.primeiroEstudo = s.data;
    var isReview = !!t.rev;
    if (t.status === 'nao') t.status = 'estudando';
    var p = U.pct(+s.acertos, +s.total);
    if (!t.rev) t.rev = { step: 0, next: U.addDays(s.data, steps[0]) };
    else {
      t.ultimaRevisao = s.data;
      if (p == null) t.rev.step = Math.min(t.rev.step + 1, steps.length - 1);
      else if (p > 80) t.rev.step = Math.min(t.rev.step + 1, steps.length - 1);
      else if (p < 70) t.rev.step = 0;
      t.rev.next = U.addDays(s.data, steps[t.rev.step]);
    }
    if (isReview && p != null && p < 70 && t.status === 'finalizado') t.status = 'revisar';
  };

  /* ---------- SRS: flashcards (inspirado no Anki/SM-2) ---------- */
  E.cardNew = function () { return { due: U.today(), int: 0, ease: 2.5, reps: 0, lapses: 0, streak: 0 }; };
  E.cardPreview = function (srs, r) { var c = JSON.parse(JSON.stringify(srs)); E.cardApply(c, r, U.today()); return c.int; };
  E.cardApply = function (c, r, today) {
    var steps = SOS.S.settings.intervalosCard;
    if (r === 'errei') { c.lapses++; c.reps = 0; c.streak = 0; c.int = steps[0]; c.ease = Math.max(1.3, c.ease - 0.2); }
    else if (r === 'dificil') { c.int = c.reps === 0 ? steps[0] : Math.max(steps[0], Math.round(c.int * 1.2)); c.ease = Math.max(1.3, c.ease - 0.15); c.reps++; c.streak++; }
    else if (r === 'bom') { c.int = c.reps < steps.length ? Math.max(steps[c.reps], c.int + 1) : Math.round(c.int * c.ease); c.reps++; c.streak++; }
    else if (r === 'facil') { var i = c.reps + 1; c.int = i < steps.length ? Math.max(steps[i], c.int + 2) : Math.round(c.int * c.ease * 1.3); c.ease += 0.15; c.reps += 2; c.streak++; }
    c.due = U.addDays(today, c.int);
    return c;
  };
  E.cardState = function (card) {
    var s = card.srs, t = U.today();
    if (s.reps === 0 && s.lapses === 0 && !(card.log || []).length) return 'novo';
    if (s.streak >= 3 && s.int >= 15) return 'aprendido';
    if (s.lapses >= 2 || s.ease < 2.0) return 'dificil';
    return s.due < t ? 'atrasado' : 'revisao';
  };
  E.cardDue = function (card) { return card.srs.due <= U.today(); };

  /* ---------- SRS: caderno de erros ---------- */
  E.erroNew = function (data) { return { step: 0, next: U.addDays(data || U.today(), SOS.S.settings.intervalosErro[0]) }; };
  E.erroReview = function (e, ok) {
    var steps = SOS.S.settings.intervalosErro, t = U.today();
    e.revisoes = e.revisoes || [];
    e.revisoes.push({ d: t, ok: ok });
    if (ok) {
      e.rev.step = Math.max(0, e.rev.step) + 1;
      if (e.rev.step >= steps.length) { e.rev.step = steps.length; e.status = 'Superado'; e.rev.next = null; }
      else {
        e.rev.next = U.addDays(t, steps[e.rev.step]);
        e.status = e.rev.step >= 2 ? 'Corrigido' : 'Em revisão';
      }
    } else {
      E.erroRepeat(e, true);
      e.rev.step = 0; e.rev.next = U.addDays(t, steps[0]);
      e.status = 'Precisa estudar novamente';
    }
  };
  /* o mesmo erro aconteceu de novo: aumenta prioridade do assunto */
  E.erroRepeat = function (e, fromReview) {
    e.ocorrencias = (e.ocorrencias || 1) + 1;
    e.historicoOcorrencias = e.historicoOcorrencias || [];
    e.historicoOcorrencias.push(U.today());
    var t = SOS.topic(e.topicId); if (t) { t.bonusErro = (t.bonusErro || 0) + 1; if (t.status === 'finalizado') t.status = 'revisar'; }
    if (!fromReview) { e.rev = e.rev || {}; e.rev.step = 0; e.rev.next = U.addDays(U.today(), SOS.S.settings.intervalosErro[0]); e.status = 'Precisa estudar novamente'; }
  };
  E.erroDue = function (e) { return e.rev && e.rev.next && e.rev.next <= U.today() && e.status !== 'Superado'; };

  /* ---------- fila de revisões ---------- */
  E.revisionQueue = function (date) {
    date = date || U.today();
    var items = [], seen = {};
    SOS.S.topicos.forEach(function (t) {
      if (!t.rev || !t.rev.next) return;
      if (t.rev.next < date) { items.push({ t: t, tipo: 'atrasada', label: 'Revisão atrasada', due: t.rev.next }); seen[t.id] = 1; }
      else if (t.rev.next === date) { items.push({ t: t, tipo: 'programada', label: 'Revisão programada', due: t.rev.next }); seen[t.id] = 1; }
    });
    SOS.S.topicos.forEach(function (t) {
      if (seen[t.id]) return;
      var st = E.topicStats(t.id);
      var last = st.sessoes.length ? st.sessoes[st.sessoes.length - 1].data : null;
      if (st.total >= 5 && st.pct < 70 && last && U.diffDays(last, date) >= 3) { items.push({ t: t, tipo: 'desempenho', label: 'Baixo desempenho (' + U.fmtPct(st.pct) + ')', due: date }); seen[t.id] = 1; return; }
      if (st.recorrentes > 0 && SOS.S.erros.some(function (e) { return e.topicId === t.id && (e.ocorrencias || 1) > 1 && e.status !== 'Superado' && e.status !== 'Corrigido'; })) {
        items.push({ t: t, tipo: 'recorrente', label: 'Erro recorrente', due: date }); seen[t.id] = 1;
      }
    });
    var w = E.phaseWeights(date);
    items.forEach(function (i) { i.prio = E.priority(i.t, date, w) * (i.tipo === 'atrasada' ? 1.4 : i.tipo === 'recorrente' ? 1.3 : i.tipo === 'desempenho' ? 1.2 : 1); });
    items.sort(function (a, b) { return b.prio - a.prio; });
    return items;
  };
  /* distribui o excesso da fila nos dias seguintes sem sobrecarregar nenhum dia */
  E.balanceRevisions = function (date) {
    date = date || U.today();
    var s = SOS.S.settings, cap = Math.max(1, Math.floor(s.minRevisaoDia / s.minPorRevisao));
    var q = E.revisionQueue(date).filter(function (i) { return i.tipo === 'atrasada' || i.tipo === 'programada'; });
    if (q.length <= cap) return [];
    var load = {}, moves = [];
    SOS.S.topicos.forEach(function (t) { if (t.rev && t.rev.next > date) load[t.rev.next] = (load[t.rev.next] || 0) + 1; });
    q.slice(cap).forEach(function (i) {
      var d = U.addDays(date, 1);
      for (var k = 0; k < 30; k++) { if (U.dow(d) !== 0 && (load[d] || 0) < cap) break; d = U.addDays(d, 1); }
      load[d] = (load[d] || 0) + 1;
      moves.push({ t: i.t, from: i.t.rev.next, to: d });
    });
    return moves;
  };

  /* ---------- planejamento semanal ---------- */
  /* ---------- planejamento (um cartão por assunto por dia) ---------- */
  E.examDate = function () { var c = SOS.S.concursos[0]; return c ? c.dataProva : null; };
  E.chapada = function () { return SOS.conc('OUV'); };
  /* lei seca: antes da prova de Chapada entram LAI, Lei 13.460, LGPD e Lei Orgânica de Chapada no rodízio */
  E.normasDoDia = function (d) {
    var ch = E.chapada();
    if (ch && d < ch.dataProva) return ['lf02', 'lc01', 'lf03', 'lc02', 'lf01', 'lc03', 'lh01', 'lc04'].filter(function (x) { return SOS.topic(x); });
    return E.NORMAS;
  };
  E.retaFinalDias = function () { return (SOS.CONFIG && SOS.CONFIG.retaFinalDias) || 10; };
  E.isRetaFinal = function (d) { var ex = E.examDate(); return !!ex && d < ex && U.diffDays(d, ex) <= E.retaFinalDias(); };
  function pickMethod(t) {
    var lei = /^LEG/.test(t.disc) || t.disc === 'DC';
    if (t.status === 'nao') return lei ? 'Lei seca + questões' : 'Leitura + questões';
    return 'Questões + revisão';
  }
  E.discScores = function (date) {
    var w = E.phaseWeights(date), sc = {};
    SOS.S.topicos.forEach(function (t) {
      if (t.status === 'finalizado' && !(t.rev && t.rev.next <= date)) return;
      var p = E.priority(t, date, w);
      if (p > 0) sc[t.disc] = (sc[t.disc] || 0) + p;
    });
    return sc;
  };
  E.CONFLITOS = [['LP', 'INF']];
  E.conflicts = function (a, b) { return E.CONFLITOS.some(function (p) { return (p[0] === a && p[1] === b) || (p[0] === b && p[1] === a); }); };
  E.NORMAS = ['lc01', 'lc02', 'lc03', 'lc04']; // Lei Orgânica, Regimento Interno, LC 93/2003, LC 235/2011 (+609/2026)
  function isSimDay(d) { var w = U.dow(d); return w === 0 || (E.isRetaFinal(d) && (w === 3 || w === 6)); }

  /* gera o plano de um período (de 'from' até 'to', no máximo até a prova) */
  E.generateRange = function (from, to) {
    var S = SOS.S, st = S.settings, plan = [], taken = {}, exam = E.examDate();
    if (exam && to > exam) to = exam;
    S.atividades.forEach(function (a) { if (a.topicId && a.data >= from && a.data <= to && !(a.gerado && a.status === 'nao')) taken[a.topicId] = (taken[a.topicId] || 0) + 1; });
    var w, sc, discs, tot, got, slots, fase = null;
    function prepararFase(day) { // os pesos mudam no dia seguinte à prova de Chapada
      var ch0 = E.chapada(), f = ch0 && day <= ch0.dataProva ? 'antes' : 'depois';
      if (f === fase) return; fase = f;
      w = E.phaseWeights(day); sc = E.discScores(day);
      discs = Object.keys(sc).filter(function (d) { return sc[d] > 0 && d !== 'LEGC'; }); // LEGC tem o bloco diário de lei seca
      tot = discs.reduce(function (x, d) { return x + sc[d]; }, 0) || 1; got = {}; slots = 0;
      discs.forEach(function (d) { got[d] = 0; });
    }
    prepararFase(from);
    var leiIdx = 0, leiCnt = {};
    function nextTopic(disc, day, dayTopics) {
      var cand = S.topicos.filter(function (t) { return t.disc === disc && !dayTopics[t.id] && (taken[t.id] || 0) < 3 && E.priority(t, day, w) > 0 && (t.status !== 'finalizado' || (t.rev && t.rev.next <= day)); });
      if (!cand.length) return null;
      cand.sort(function (a, b) {
        var pa = E.priority(a, day, w) / (1 + (taken[a.id] || 0) * 2), pb = E.priority(b, day, w) / (1 + (taken[b.id] || 0) * 2);
        if (Math.abs(pa - pb) > 0.15 * Math.max(pa, pb)) return pb - pa;
        return a.seedOrder - b.seedOrder;
      });
      return cand[0];
    }
    for (var d = from; d <= to; d = U.addDays(d, 1)) {
      if (d < U.today()) continue;
      prepararFase(d);
      var dw = U.dow(d), left = exam ? U.diffDays(d, exam) : 99, final = E.isRetaFinal(d);
      if (d === exam) { plan.push(mk(d, null, 'Simulado', 0, 'Dia da prova — ' + (S.concursos[0] ? S.concursos[0].sigla : '') + '. Você se preparou: boa prova! ♡', 'prova')); continue; }
      var ch = E.chapada();
      if (ch && d === ch.dataProva) { plan.push(mk(d, null, 'Simulado', 0, 'Dia da prova de Chapada (Ouvidor), manhã — boa prova! ♡ À tarde, só descanso.', 'prova')); continue; }
      if (ch && U.diffDays(d, ch.dataProva) === 1) {
        plan.push(mk(d, null, 'Flashcards', 30, 'Véspera de Chapada: flashcards dos seus erros', 'flashcards'));
        plan.push(mk(d, null, 'Lei seca', 40, 'Véspera de Chapada: LAI, Lei 13.460 e LGPD — só os destaques', 'leirev'));
        plan.push(mk(d, null, 'Revisão', 20, 'Véspera: documento com foto, caneta transparente, Cartão de Convocação (sai em 17/11). Durma cedo.', 'ajuste'));
        continue;
      }
      if (left === 1) {
        plan.push(mk(d, null, 'Flashcards', 30, 'Véspera: flashcards dos seus erros (só os principais)', 'flashcards'));
        plan.push(mk(d, null, 'Lei seca', 30, 'Véspera: leitura leve dos destaques do Nível 1', 'leirev'));
        plan.push(mk(d, null, 'Revisão', 20, 'Véspera: separe documento com foto, caneta transparente preta/azul e o Cartão de Confirmação. Durma cedo.', 'ajuste'));
        continue;
      }
      if (isSimDay(d)) {
        var antesCh = ch && d < ch.dataProva;
        plan.push(antesCh ? mk(d, null, 'Simulado', 240, 'Simulado no formato de Chapada: 40 questões em 4h (específico do Ouvidor vale 60%)', 'simulado') : mk(d, null, 'Simulado', 270, 'Simulado no formato da Câmara: 70 questões + discursiva em 4h30', 'simulado'));
        plan.push(mk(d, null, 'Revisão', 40, 'Correção do simulado: erros vão para o Caderno de Erros', 'erros'));
        if (dw === 0) plan.push(mk(d, null, 'Revisão', 15, 'Ajuste da semana seguinte', 'ajuste'));
        continue;
      }
      var rev = final ? 60 : 30, fc = final ? 25 : 15, used = rev + fc;
      plan.push(mk(d, null, 'Revisão', rev, final ? 'Reta final: fila de revisões + Caderno de Erros' : 'Fila de revisões do dia', 'revisoes'));
      plan.push(mk(d, null, 'Flashcards', fc, 'Flashcards do dia', 'flashcards'));
      var dayTopics = {}, dayDiscs = [];
      // lei seca: uma norma por dia, bloco curto; na véspera de simulado vira revisão dos destaques
      var rod = E.normasDoDia(d), norma = rod[leiIdx++ % rod.length], nt = SOS.topic(norma);
      if (nt) {
        var revLei = isSimDay(U.addDays(d, 1)), n = leiCnt[norma] = (leiCnt[norma] || 0) + 1;
        var tit = SOS.leiPrior ? SOS.leiPrior.blocoTitulo(norma, n, revLei) : (revLei ? 'Revisão de lei seca — Nível 1' : 'Lei seca — Nível 1');
        plan.push(mk(d, nt, 'Lei seca', 35, tit, revLei ? 'leirev' : 'leiseca'));
        used += 35; dayTopics[nt.id] = 1; dayDiscs.push(nt.disc);
      }
      if (dw === 6) { plan.push(mk(d, null, 'Discursiva', 60, 'Discursiva (20–30 linhas, tema do conteúdo específico)', 'discursiva')); used += 60; }
      var nb = Math.max(0, st.maxDisciplinasDia - dayDiscs.length), rest = Math.max(0, st.minDia - used);
      var blocks = []; for (var k = 0; k < nb; k++) blocks.push(Math.round(rest / nb / 5) * 5);
      for (var b = 0; b < blocks.length; b++) {
        slots++;
        var order = discs.slice().sort(function (x, y) { return (sc[y] / tot * slots - got[y]) - (sc[x] / tot * slots - got[x]); });
        var chosen = null, topic = null;
        for (var j = 0; j < order.length; j++) {
          var dd = order[j];
          if (dayDiscs.indexOf(dd) > -1 || dayDiscs.some(function (x) { return E.conflicts(x, dd); })) continue;
          topic = nextTopic(dd, d, dayTopics); if (topic) { chosen = dd; break; }
        }
        if (!chosen) continue;
        dayDiscs.push(chosen); got[chosen]++; dayTopics[topic.id] = 1; taken[topic.id] = (taken[topic.id] || 0) + 1;
        var m = pickMethod(topic), dur = blocks[b], a = mk(d, topic, m, dur, '', 'estudo');
        a.partes = m === 'Questões + revisão' ? [{ metodo: 'Questões', min: Math.max(15, dur - 15) }, { metodo: 'Revisão', min: 15 }] : [{ metodo: m.split(' + ')[0], min: Math.max(15, dur - 30) }, { metodo: 'Questões', min: 30 }];
        plan.push(a);
      }
    }
    return plan;
    function mk(data, t, metodo, min, titulo, tipo) {
      return { id: U.uid('a'), data: data, topicId: t ? t.id : null, disc: t ? t.disc : null, metodo: metodo, planMin: min, titulo: titulo || '', tipo: tipo, status: 'nao', obs: '', gerado: true };
    }
  };
  E.generateWeek = function (monday) { return E.generateRange(monday, U.addDays(monday, 6)); };
  /* acrescenta atividades garantindo UM cartão por assunto por dia (une com o que já existe) */
  E.addActivities = function (list) {
    var S = SOS.S, merged = 0;
    list.forEach(function (a) {
      var ex = a.topicId && S.atividades.find(function (x) { return x.topicId === a.topicId && x.data === a.data && x.status !== 'feito'; });
      if (!ex) { S.atividades.push(a); return; }
      var c = SOS.combineActivities([ex, a]); c.id = ex.id; c.gerado = ex.gerado && a.gerado;
      S.atividades[S.atividades.indexOf(ex)] = c; merged++;
    });
    return merged;
  };
  /* recalcula o plano de hoje até a prova (substitui só o que foi gerado e não começou) */
  E.replanAll = function () {
    var S = SOS.S, t = U.today(), exam = E.examDate();
    if (!exam || exam < t) return { removidas: 0, novas: 0 };
    var antes = S.atividades.length;
    S.atividades = S.atividades.filter(function (a) { return !(a.gerado && a.status === 'nao' && a.data >= t); });
    var removidas = antes - S.atividades.length;
    var plan = E.generateRange(t, exam);
    E.addActivities(plan);
    return { removidas: removidas, novas: plan.length };
  };

  /* ---------- reorganização automática (sempre com aprovação) ---------- */
  E.dayLoad = function (d, ignoreIds) {
    var acts = SOS.S.atividades.filter(function (a) { return a.data === d && a.status !== 'cancelada' && (!ignoreIds || !ignoreIds[a.id]); });
    var min = acts.reduce(function (x, a) { return x + (+a.planMin || 0); }, 0);
    var discs = []; acts.forEach(function (a) { if (a.disc && discs.indexOf(a.disc) < 0) discs.push(a.disc); });
    return { min: min, discs: discs };
  };
  E.examLimit = function (a) {
    var t = a.topicId && SOS.topic(a.topicId);
    var concs = t ? t.concursos : SOS.S.concursos.map(function (c) { return c.id; });
    var dates = concs.map(function (c) { var x = SOS.conc(c); return x ? x.dataProva : null; }).filter(function (d) { return d && d > U.today(); }).sort();
    return dates.length ? U.addDays(dates[dates.length - 1], -1) : U.addDays(U.today(), 30);
  };
  E.pendingActivities = function () {
    var t = U.today();
    return SOS.S.atividades.filter(function (a) { return a.status === 'naofeito' || (a.data < t && (a.status === 'nao' || a.status === 'andamento')); });
  };
  E.proposeReschedule = function (acts) {
    var t = U.today(), st = SOS.S.settings, cap = st.minDia + 30;
    var w = E.phaseWeights(t);
    acts = acts.slice().sort(function (a, b) {
      var ta = a.topicId && SOS.topic(a.topicId), tb = b.topicId && SOS.topic(b.topicId);
      return (tb ? E.priority(tb, t, w) : 0.5) - (ta ? E.priority(ta, t, w) : 0.5);
    });
    var moving = {}; acts.forEach(function (a) { moving[a.id] = 1; });
    var extra = {};
    return acts.map(function (a) {
      var limit = E.examLimit(a), best = null, bestLoad = 1e9;
      var startOffset = 1;
      for (var i = startOffset; i <= 21; i++) {
        var d = U.addDays(t, i);
        if (d > limit) break;
        if (U.dow(d) === 0 && a.metodo !== 'Simulado') continue;
        var L = E.dayLoad(d, moving), add = extra[d] || { min: 0, discs: [] };
        var discs = L.discs.concat(add.discs);
        var load = L.min + add.min;
        if (a.disc) {
          var has = discs.indexOf(a.disc) > -1;
          if (!has && discs.length >= st.maxDisciplinasDia) continue;
          if (discs.some(function (x) { return E.conflicts(x, a.disc); })) continue;
        }
        if (load + (+a.planMin || 0) > cap) continue;
        // penaliza levemente dias muito próximos para não empilhar tudo no dia seguinte
        var score = load + i * 8;
        if (score < bestLoad) { bestLoad = score; best = d; }
      }
      var warn = '';
      if (!best) { best = limit > t ? limit : U.addDays(t, 1); warn = 'Sem espaço antes da prova: considere substituir uma atividade de menor prioridade.'; }
      extra[best] = extra[best] || { min: 0, discs: [] };
      extra[best].min += +a.planMin || 0;
      if (a.disc && extra[best].discs.indexOf(a.disc) < 0) extra[best].discs.push(a.disc);
      return { a: a, from: a.data, to: best, warn: warn };
    });
  };

  /* ---------- recomendações a partir do Caderno de Erros ---------- */
  E.adviceForTopic = function (tid) {
    var es = SOS.S.erros.filter(function (e) { return e.topicId === tid; });
    var t = SOS.topic(tid), out = [];
    if (!es.length || !t) return out;
    var cnt = {}; es.forEach(function (e) { (e.categorias || []).forEach(function (c) { cnt[c] = (cnt[c] || 0) + 1; }); });
    var n = es.length;
    function share(c) { return (cnt[c] || 0) / n; }
    if (t.status === 'nao') out.push({ tipo: 'primeiro', txt: 'Assunto ainda não estudado: faça o primeiro estudo da teoria antes de revisar.' });
    if (share('Falta de conhecimento teórico') >= 0.4) out.push({ tipo: 'teoria', txt: 'Muitos erros por falta de teoria: agende Leitura/Aula do tópico.' });
    if (share('Interpretação incorreta') >= 0.4) out.push({ tipo: 'interp', txt: 'Muitos erros de interpretação: treine leitura atenta do enunciado e do comando.' });
    if (share('Desconhecimento da legislação') >= 0.3) out.push({ tipo: 'lei', txt: 'Muitos erros de legislação: agende Lei seca.' });
    if (share('Confusão entre conceitos') >= 0.3) out.push({ tipo: 'card', txt: 'Confusão entre conceitos: crie flashcards de diferença entre institutos.' });
    if (share('Desatenção') + share('Pressa') >= 0.4) out.push({ tipo: 'atencao', txt: 'Erros de desatenção/pressa: resolva questões com tempo controlado e releia as alternativas.' });
    if (share('Erro de cálculo ou raciocínio') + share('Falta de prática') >= 0.4) out.push({ tipo: 'pratica', txt: 'Falta de prática/cálculo: aumente o volume de questões do tópico.' });
    if (es.some(function (e) { return (e.ocorrencias || 1) > 1; })) out.push({ tipo: 'rec', txt: 'Erros repetidos: revisão mais frequente — prioridade do assunto aumentada.' });
    if (n >= 3) out.push({ tipo: 'prio', txt: n + ' erros neste assunto: prioridade elevada no planejamento.' });
    return out;
  };
  E.globalAdvice = function () {
    var cnt = {}; SOS.S.erros.forEach(function (e) { (e.categorias || []).forEach(function (c) { cnt[c] = (cnt[c] || 0) + 1; }); });
    var tops = Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a]; });
    var map = {
      'Falta de conhecimento teórico': 'Reforce o estudo da teoria antes de partir para questões.',
      'Interpretação incorreta': 'Faça treino específico de interpretação de enunciados.',
      'Desconhecimento da legislação': 'Inclua mais blocos de Lei seca no plano.',
      'Esquecimento': 'Use mais flashcards e respeite as revisões espaçadas.',
      'Confusão entre conceitos': 'Crie flashcards comparativos (diferença entre institutos).',
      'Desatenção': 'Releia comando e alternativas; marque palavras-chave (exceto, incorreto, não).',
      'Pressa': 'Treine com tempo controlado, sem acelerar além do necessário.',
      'Falta de prática': 'Aumente o volume de questões.',
      'Erro de cálculo ou raciocínio': 'Refaça as questões de cálculo com a resolução escrita.',
      'Pegadinha da banca': 'Registre as pegadinhas como flashcards de “ponto de atenção”.'
    };
    return tops.slice(0, 3).map(function (c) { return { cat: c, n: cnt[c], txt: map[c] }; });
  };

  /* ---------- rascunho de flashcard a partir de um erro ---------- */
  E.draftFromError = function (e) {
    var t = SOS.topic(e.topicId);
    var learn = (e.aprender || '').trim();
    var cats = e.categorias || [];
    var tipo = cats.indexOf('Confusão entre conceitos') > -1 ? 'Diferença entre dois institutos'
      : cats.indexOf('Desconhecimento da legislação') > -1 ? 'Dispositivo legal'
      : cats.indexOf('Interpretação incorreta') > -1 || cats.indexOf('Pegadinha da banca') > -1 ? 'Situação-problema' : 'Pergunta objetiva';
    var frente;
    var pair = /\s(e|x|×|vs\.?|versus|ou)\s/i.test(learn);
    if (tipo === 'Diferença entre dois institutos' && !pair) tipo = 'Pergunta objetiva';
    if (learn) frente = /\?$/.test(learn) ? learn : (tipo === 'Diferença entre dois institutos' ? 'Qual a diferença entre ' + learn.replace(/[.\s]+$/, '') + '?' : learn.replace(/[.\s]+$/, '') + '?');
    else frente = (t ? t.titulo.split(':')[0] : 'Conceito') + ': qual é a regra correta cobrada nesta questão?';
    var verso = (e.correta ? e.correta.trim() : '');
    var just = (e.justificativa || '').trim();
    if (just.length > 280) just = just.slice(0, 277).replace(/\s\S*$/, '') + '…';
    var drafts = [{ tipo: tipo, frente: frente, verso: verso || just, explicacao: verso ? just : '', fundamento: '', pegadinha: (e.porque || '').trim() }];
    // se o "o que preciso aprender" tiver vários itens (linhas ou ;), sugere um cartão por conceito
    var parts = learn.split(/\n|;/).map(function (x) { return x.trim(); }).filter(function (x) { return x.length > 3; });
    if (parts.length > 1) drafts = parts.map(function (p) { return { tipo: tipo, frente: /\?$/.test(p) ? p : p.replace(/[.\s]+$/, '') + '?', verso: '', explicacao: just, fundamento: '', pegadinha: (e.porque || '').trim() }; });
    return drafts;
  };
  E.findDuplicateCard = function (frente, ignoreId) {
    var best = null, bs = 0;
    SOS.S.flashcards.forEach(function (c) { if (c.id === ignoreId) return; var s = U.similar(c.frente, frente); if (s > bs) { bs = s; best = c; } });
    return bs >= 0.75 ? { card: best, score: bs } : null;
  };
  E.suggestCardsFromErrors = function () {
    return SOS.S.erros.filter(function (e) {
      if ((e.flashcardIds || []).length || e.ignorarSugestao) return false;
      var c = e.categorias || [];
      if ((e.ocorrencias || 1) > 1) return true;
      if (c.indexOf('Confusão entre conceitos') > -1 || c.indexOf('Esquecimento') > -1 || c.indexOf('Desconhecimento da legislação') > -1) return true;
      var st = E.topicStats(e.topicId);
      return st.pct != null && st.total >= 5 && st.pct < 70;
    });
  };

  /* ---------- simulados ---------- */
  E.scoreSimulado = function (sim) {
    var c = SOS.conc(sim.concursoId); if (!c) return null;
    var pts = 0, areas = {}, ok = true, msgs = [];
    (sim.areas || []).forEach(function (a) {
      var def = c.areas[a.k]; if (!def) return;
      var p = (+a.acertos || 0) * def.v; pts += p; areas[a.k] = p;
      if (c.minimos.porArea && (+a.acertos || 0) === 0) { ok = false; msgs.push('Zerou ' + def.nome); }
    });
    if (pts < c.minimos.total) { ok = false; msgs.push('Abaixo do mínimo (' + c.minimos.total + ' pts)'); }
    var tq = (sim.areas || []).reduce(function (x, a) { return x + (+a.total || 0); }, 0), ac = (sim.areas || []).reduce(function (x, a) { return x + (+a.acertos || 0); }, 0);
    return { pontos: Math.round(pts * 100) / 100, max: c.totalPontos, areas: areas, aprovado: ok, msgs: msgs, pct: U.pct(ac, tq) };
  };
})();
