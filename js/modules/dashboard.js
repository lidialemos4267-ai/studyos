/* Dashboard e Estatísticas (inclui Mapa de Dificuldades). */
(function () {
  var SOS = window.SOS, U = SOS.U, ui = SOS.ui, E = SOS.E;

  function examGroups() {
    var g = {};
    SOS.S.concursos.forEach(function (c) {
      var k = c.grupo || c.id;
      if (!g[k]) g[k] = { data: c.dataProva, confirmada: c.dataConfirmada, itens: [], orgao: c.orgao };
      g[k].itens.push(c);
      if (c.dataProva < g[k].data) g[k].data = c.dataProva;
      g[k].confirmada = g[k].confirmada && c.dataConfirmada;
    });
    return Object.keys(g).map(function (k) { return g[k]; }).sort(function (a, b) { return a.data < b.data ? -1 : 1; });
  }
  SOS.examGroups = examGroups;

  /* ---------- motivação ---------- */
  var M = SOS.motiv = {};
  M.FRASES = {
    comeco: ['Bom dia! Um assunto de cada vez — hoje já é um passo.', 'Começar é a parte mais difícil. Abra o primeiro cartão e o resto vem.', 'Seu eu de 20/12 agradece cada minuto de hoje.', 'Café, caneta e um assunto: é só isso por agora.', 'Pequeno e constante vence grande e esporádico.', 'Hoje você não precisa estudar tudo. Precisa estudar o de hoje.', 'Respira. Escolhe o primeiro cartão. Vai.'],
    semCulpa: ['Sem culpa: recomeça hoje. Um cartão já conta.', 'Ontem ficou para trás. Hoje é um dia novo e inteiro.', 'Parar um dia não apaga o que você construiu. Volta com calma.', 'Recomeçar também é disciplina. Escolha um assunto curtinho.', 'Ninguém estuda perfeito todo dia. O que importa é voltar.'],
    meta: ['Meta batida! Orgulho de você. ♡', 'Você fez o que se propôs hoje. Descanse com a consciência leve.', 'Dia cumprido! Isso é constância de verdade.', 'Mais um dia somado. É assim que se passa.', 'Meta do dia: feito. Agora é cuidar de você.'],
    retaFinal: ['Reta final: revisão e simulado valem ouro agora.', 'Faltam poucos dias. Confie no que já estudou e revise os erros.', 'Agora é lapidar: lei seca do Nível 1, flashcards e simulado.', 'Menos conteúdo novo, mais revisão. Você está pronta para lapidar.', 'Cada erro revisado hoje é um ponto a mais no dia 20.'],
    vespera: ['Amanhã tem prova. Revise leve, separe tudo e durma cedo. Você se preparou. ♡', 'Amanhã é o dia. Revise leve, separe tudo e durma cedo. Você se preparou. ♡', 'Véspera: nada de maratona. Só os destaques e descanso.'],
    prova: ['Hoje é o seu dia. Respira fundo, lê com calma e confia em você. Boa prova! ♡'],
    depois: ['Prova feita! Seja gentil com você — você foi até o fim. ♡']
  };
  M.diaDoAno = function (d) { var x = U.parse(d), y = new Date(x.getFullYear(), 0, 0); return Math.floor((x - y) / 86400000); };
  M.estudouEm = function (d) {
    var S = SOS.S;
    if (S.sessoes.some(function (s) { return s.data === d && ((+s.realizadoMin || 0) > 0 || (+s.total || 0) > 0); })) return true;
    if (S.atividades.some(function (a) { return a.data === d && a.status === 'feito'; })) return true;
    if (S.flashcards.some(function (c) { return (c.log || []).some(function (l) { return l.d === d; }); })) return true;
    return (S.leis || []).some(function (l) { return (l.arts || []).some(function (a) { return a.lidoEm === d; }); });
  };
  M.streak = function () {
    var d = U.today(), n = 0;
    if (!M.estudouEm(d)) d = U.addDays(d, -1);
    while (M.estudouEm(d) && n < 400) { n++; d = U.addDays(d, -1); }
    return n;
  };
  M.hoje = function () {
    var t = U.today(), S = SOS.S, o = { min: 0, q: 0, ac: 0, cards: 0, arts: 0, cartoes: 0 };
    S.sessoes.forEach(function (s) { if (s.data === t) { o.min += +s.realizadoMin || 0; o.q += +s.total || 0; o.ac += +s.acertos || 0; } });
    S.atividades.forEach(function (a) { if (a.data === t && a.status === 'feito') { o.cartoes++; if (!a.topicId) o.min += +a.realizadoMin || 0; } });
    S.flashcards.forEach(function (c) { (c.log || []).forEach(function (l) { if (l.d === t) o.cards++; }); });
    (S.leis || []).forEach(function (l) { (l.arts || []).forEach(function (a) { if (a.lidoEm === t) o.arts++; }); });
    o.meta = S.settings.metaDiariaMin || 240; o.bateu = o.min >= o.meta;
    return o;
  };
  M.frase = function () {
    var t = U.today(), ex = E.examDate(), left = ex ? U.diffDays(t, ex) : 99, h = new Date().getHours(), F = M.FRASES, hj = M.hoje(), k;
    var ch = E.chapada(), lc = ch ? U.diffDays(t, ch.dataProva) : 99;
    if (left < 0) k = 'depois'; else if (left === 0 || lc === 0) k = 'prova'; else if (left === 1 || lc === 1) k = 'vespera';
    else if (hj.bateu) k = 'meta';
    else if (!M.estudouEm(t) && !M.estudouEm(U.addDays(t, -1)) && SOS.S.sessoes.length) k = 'semCulpa';
    else if (left <= E.retaFinalDias()) k = 'retaFinal';
    else k = 'comeco';
    var arr = F[k]; return { tipo: k, txt: arr[(M.diaDoAno(t) + (h >= 14 ? 1 : 0)) % arr.length] };
  };
  M.progresso = function () {
    var S = SOS.S, ts = S.topicos, est = ts.filter(function (t) { return t.status !== 'nao'; }).length;
    var q = E.sum(S.sessoes).total, metaQ = S.settings.metaQuestoesTotal || 700;
    var arts = 0, lidos = 0; (S.leis || []).filter(function (l) { return E.NORMAS.indexOf(l.topicId) > -1; }).forEach(function (l) { arts += l.arts.length; lidos += l.arts.filter(function (a) { return a.lido; }).length; });
    var leiBlocos = S.atividades.filter(function (a) { return a.metodo === 'Lei seca'; }), leiFeitos = leiBlocos.filter(function (a) { return a.status === 'feito'; }).length;
    var cards = S.flashcards.length, rev = S.flashcards.filter(function (c) { return (c.log || []).length; }).length;
    return [
      { l: 'Assuntos estudados', v: est, max: ts.length, txt: est + ' de ' + ts.length },
      { l: 'Questões feitas', v: q, max: metaQ, txt: q + ' de ' + metaQ + ' (meta)' },
      arts ? { l: 'Lei seca lida', v: lidos, max: arts, txt: lidos + ' de ' + arts + ' artigos' } : { l: 'Lei seca (blocos)', v: leiFeitos, max: leiBlocos.length || 1, txt: leiFeitos + ' de ' + leiBlocos.length + ' blocos' },
      { l: 'Flashcards revisados', v: rev, max: cards || 1, txt: rev + ' de ' + cards + ' cartões' }
    ];
  };

  SOS.views.dashboard = {
    render: function (el) {
      var t = U.today(), S = SOS.S, C = SOS.CONFIG, ex = E.examDate(), left = ex ? U.diffDays(t, ex) : null;
      var fr = M.frase(), hj = M.hoje(), st = M.streak(), prog = M.progresso();
      var rq = E.revisionQueue(t), cardsDue = S.flashcards.filter(E.cardDue).length, errDue = S.erros.filter(E.erroDue).length, drafts = (S.cardDrafts || []).length;
      var today = S.atividades.filter(function (a) { return a.data === t; });
      var insc = (C.datas || []).find(function (d) { return d.id === 'inscricao'; }), inscFim = insc && insc.data ? new Date(insc.data + 'T' + (insc.hora || '23:59') + ':00') : null, agora = new Date();
      var h = '<section class="hero card"><div class="hero-main"><div class="hero-num">' + (left > 0 ? left : left === 0 ? 'Hoje' : '✓') + '</div><div class="hero-lbl">' + (left > 1 ? 'dias para a prova' : left === 1 ? 'dia para a prova — é amanhã!' : left === 0 ? 'é o dia da prova' : 'prova realizada') + '</div></div>' +
        '<div class="hero-side"><p class="hero-why">' + U.esc(C.concurso.cargo) + ' · Câmara de Cuiabá · ' + C.concurso.vagas + ' vagas · prova em ' + U.fmtShort(ex) + ' (' + U.esc(C.prova.turno.toLowerCase()) + ', ' + U.esc(C.prova.duracao) + ')</p>' +
        '<p class="hero-quote">“' + U.esc(fr.txt) + '”</p>' +
        (inscFim && agora < inscFim ? (function () { var ms = inscFim - agora, d = Math.floor(ms / 86400000), hh = Math.floor(ms % 86400000 / 3600000); return '<div class="hero-insc"><b>' + d + ' d ' + hh + ' h</b> para o fim das inscrições (' + U.fmtShort(insc.data) + ', ' + insc.hora + ') · boleto até 01/12</div>'; })() : '') +
        (function () { var ch = E.chapada(); if (!ch || ch.dataProva < t) return ''; var dd = U.diffDays(t, ch.dataProva); return '<div class="hero-insc" style="margin-left:6px">' + (dd === 0 ? '<b>Hoje</b> é a prova de Chapada · Ouvidor (manhã). Boa prova! ♡' : '<b>' + dd + ' ' + (dd === 1 ? 'dia' : 'dias') + '</b> para Chapada · Ouvidor (' + U.fmtShort(ch.dataProva) + ', manhã)') + '</div>'; })() +
        '</div></section>';
      // hoje: meta, sequência e "conquistei hoje"
      var pm = Math.min(100, hj.min / hj.meta * 100);
      h += '<div class="grid g3 section"><div class="card"><div class="l-soft">Meta de hoje</div><div class="big">' + U.fmtMin(hj.min) + ' <small>de ' + U.fmtMin(hj.meta) + '</small></div><div class="prog" style="margin-top:8px"><i style="width:' + pm + '%"></i></div><small class="muted">' + (hj.bateu ? 'Meta batida! ♡' : 'Faltam ' + U.fmtMin(hj.meta - hj.min) + ' — um cartão de cada vez.') + '</small></div>' +
        '<div class="card"><div class="l-soft">Sequência</div><div class="big">' + st + ' <small>' + (st === 1 ? 'dia seguido' : 'dias seguidos') + '</small></div><div class="dots">' + (function () { var o = ''; for (var i = 6; i >= 0; i--) { var d = U.addDays(t, -i); o += '<span class="sd ' + (M.estudouEm(d) ? 'on' : '') + '" title="' + U.fmtShort(d) + '">' + U.DIAS_C[U.dow(d)].charAt(0) + '</span>'; } return o; })() + '</div></div>' +
        '<div class="card conquista"><div class="l-soft">Conquistei hoje</div><ul class="conq">' + [hj.min ? U.fmtMin(hj.min) + ' de estudo' : '', hj.q ? hj.q + ' questões (' + U.fmtPct(U.pct(hj.ac, hj.q)) + ')' : '', hj.cards ? hj.cards + ' flashcards revisados' : '', hj.arts ? hj.arts + ' artigos de lei seca' : '', hj.cartoes ? hj.cartoes + ' cartões do plano concluídos' : ''].filter(Boolean).map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>' +
        (S.diario[t] && S.diario[t].fechado ? '<p class="carinho">' + U.esc(S.diario[t].msg) + '</p>' : (hj.min || hj.q || hj.cards) ? '<button class="btn sm" data-act="fechar">Fechar o dia ♡</button>' : '<small class="muted">Quando estudar, suas conquistas aparecem aqui.</small>') + '</div></div>';
      // progresso do plano
      h += '<div class="card section"><h3>Progresso do plano</h3>' + prog.map(function (p) { var pc = Math.min(100, p.v / p.max * 100); return '<div class="pbar"><div class="row between"><span>' + p.l + '</span><small class="muted">' + p.txt + '</small></div><div class="prog"><i style="width:' + pc + '%"></i></div></div>'; }).join('') + '</div>';
      // cartões do dia + atalhos
      h += '<div class="grid g2 section"><div class="card"><div class="card-h"><h3>Hoje — ' + U.DIAS[U.dow(t)] + ', ' + U.fmtShort(t) + '</h3><div class="right"><button class="btn sm ghost" data-go="plano">Planejamento</button></div></div>' +
        (today.length ? today.map(function (a) { return '<div class="list-item row"><span class="tag ' + (a.status === 'feito' ? 'good' : '') + '">' + (a.status === 'feito' ? '✓ feito' : 'a fazer') + '</span>' + (a.disc ? ui.discTag(a.disc) : '') + '<span style="flex:1;min-width:0">' + U.esc(a.topicId ? SOS.topicLabel(a.topicId) : a.titulo) + (a.topicId && a.titulo ? '<br><small class="muted">' + U.esc(a.titulo) + '</small>' : '') + '</span><small>' + U.esc(a.metodo) + ' · ' + U.fmtMin(a.planMin) + '</small></div>'; }).join('') : '<div class="empty">Nada planejado para hoje.<br><button class="btn sm" style="margin-top:8px" data-go="plano?replan=1">Montar o plano até a prova</button></div>') + '</div>' +
        '<div class="card"><h3>Para hoje</h3><div class="stack">' +
        '<button class="btn" style="width:100%;justify-content:space-between" data-go="erros?hoje=1">Revisar meus erros de hoje <span class="badge soft">' + errDue + '</span></button>' +
        '<button class="btn" style="width:100%;justify-content:space-between" data-go="flashcards?revisar=1">Revisar flashcards de hoje <span class="badge soft">' + cardsDue + '</span></button>' +
        (drafts ? '<button class="btn ghost" style="width:100%;justify-content:space-between" data-go="flashcards?aprovar=1">Cartões para aprovar <span class="badge soft">' + drafts + '</span></button>' : '') +
        '<button class="btn ghost" style="width:100%;justify-content:space-between" data-go="revisoes">Fila de revisões <span class="badge soft">' + rq.length + '</span></button></div></div></div>';
      // gráficos essenciais
      var wkly = E.weekly('all', 8), labels = wkly.map(function (w) { return w.label; });
      h += '<div class="grid g2 section"><div class="card"><h3>Evolução dos acertos</h3>' + ui.lineChart([{ name: '% acertos', color: 'var(--primary)', data: wkly.map(function (w) { return w.pct; }) }], { labels: labels, max: 100, refLine: 80, fmt: function (v) { return Math.round(v) + '%'; } }) + '</div>' +
        '<div class="card"><h3>Horas por semana</h3>' + ui.barChart(labels, wkly.map(function (w) { return Math.round(w.min / 6) / 10; }), { fmt: function (v) { return v + 'h'; } }) + '</div>' +
        '<div class="card"><h3>Desempenho por disciplina</h3>' + ui.hbars(E.byDisc('all').filter(function (d) { return d.total > 0; }).sort(function (a, b) { return b.total - a.total; }).map(function (d) { return { label: SOS.disc(d.disc).nome, value: d.pct, color: ui.pctColor(d.pct), text: U.fmtPct(d.pct) }; })) + '</div>' +
        '<div class="card"><h3>Discursivas</h3>' + ui.lineChart([{ name: 'Nota', color: 'var(--accent)', data: wkly.map(function (w) { return w.discNota; }) }], { labels: labels, max: 100, refLine: 40 }) + '</div></div>';
      el.innerHTML = h;
      el.onclick = function (e) {
        var g = e.target.closest('[data-go]'); if (g) { var p = g.dataset.go.split('?'); return SOS.app.go(p[0], p[1]); }
        if (e.target.closest('[data-act=fechar]')) {
          var msgs = ['Você apareceu para você hoje. Isso é enorme. Descanse. ♡', 'Mais um dia de dedicação guardado. Que orgulho!', 'Dia fechado com carinho. Amanhã a gente continua.', 'Você está construindo a sua vaga, dia após dia. ♡', 'Hoje valeu. Agora é água, comida boa e sono.'];
          S.diario[t] = { fechado: true, msg: msgs[M.diaDoAno(t) % msgs.length], resumo: hj };
          SOS.log('Dia fechado', U.fmtMin(hj.min) + ' · ' + hj.q + ' questões'); SOS.save(); SOS.app.render();
        }
      };
    }
  };
  function kpi(l, v, s, extra) { return '<div class="card kpi"><div class="l">' + l + '</div><div class="v">' + v + '</div><div class="s">' + (s || '') + '</div>' + (extra || '') + '</div>'; }
  function discRows(arr) {
    if (!arr.length) return '<div class="empty">Ainda sem dados suficientes.</div>';
    return arr.map(function (d) { return '<div class="list-item row">' + ui.discTag(d.disc) + '<span class="spacer"></span>' + ui.trendIcon(d.trend) + ' <small>' + d.total + ' q.</small> ' + ui.pctBadge(d.pct) + '</div>'; }).join('');
  }
  function advice(conc, rq, errDue, cardsDue) {
    var out = [];
    var groups = examGroups().filter(function (g) { return g.data >= U.today(); });
    if (groups.length) { var d = U.diffDays(U.today(), groups[0].data); if (d <= 21) out.push('Faltam <b>' + d + ' dias</b> para ' + U.esc(groups[0].orgao) + ': priorize questões, revisões e simulados no formato da prova.'); }
    if (rq.length) out.push('<b>' + rq.length + '</b> revisões na fila de hoje — comece por elas.');
    if (errDue) out.push('<b>' + errDue + '</b> erros do Caderno com revisão para hoje.');
    if (cardsDue) out.push('<b>' + cardsDue + '</b> flashcards aguardando revisão.');
    var pend = E.pendingActivities().length;
    if (pend) out.push('<b>' + pend + '</b> atividades atrasadas ou não realizadas — use <a href="#plano?reorg=1">Reorganizar</a>.');
    E.globalAdvice().forEach(function (a) { out.push('Erros por <b>' + U.esc(a.cat.toLowerCase()) + '</b> (' + a.n + '): ' + U.esc(a.txt)); });
    var w = E.phaseWeights(U.today()), top = SOS.S.topicos.filter(function (t) { return E.topicIn(t, conc); }).map(function (t) { return { t: t, p: E.priority(t, U.today(), w) }; }).sort(function (a, b) { return b.p - a.p; }).slice(0, 3);
    if (top.length) out.push('Maior prioridade agora: ' + top.map(function (x) { return '<a href="#edital?t=' + x.t.id + '">' + U.esc(x.t.titulo.split(':')[0]) + '</a>'; }).join(' · '));
    return out.length ? '<ul style="margin:0;padding-left:18px">' + out.map(function (x) { return '<li style="margin-bottom:6px">' + x + '</li>'; }).join('') + '</ul>' : '<div class="empty">Tudo em dia.</div>';
  }

  /* ---------------- Estatísticas ---------------- */
  var statTab = 'geral', mapDisc = '';
  SOS.views.estatisticas = {
    render: function (el) {
      var conc = SOS.app.conc;
      var h = '<div class="tabs">' + [['geral', 'Por disciplina'], ['assunto', 'Por assunto'], ['mapa', 'Mapa de dificuldades'], ['hist', 'Histórico de atividades']].map(function (x) { return '<button class="tab ' + (statTab === x[0] ? 'active' : '') + '" data-tab="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>';
      if (statTab === 'geral') {
        var rows = E.byDisc(conc).sort(function (a, b) { return b.min - a.min; });
        h += '<div class="card"><div class="tbl-wrap"><table><thead><tr><th>Disciplina</th><th class="num">Tempo</th><th class="num">Questões</th><th class="num">Acertos</th><th class="num">Erros</th><th class="num">%</th><th>Tendência</th></tr></thead><tbody>' +
          (rows.length ? rows.map(function (d) { return '<tr><td>' + ui.discTag(d.disc) + '</td><td class="num">' + U.fmtMin(d.min) + '</td><td class="num">' + d.total + '</td><td class="num">' + d.acertos + '</td><td class="num">' + d.erros + '</td><td class="num">' + ui.pctBadge(d.pct) + '</td><td>' + (ui.trendIcon(d.trend) || '<small class="muted">poucos dados</small>') + '</td></tr>'; }).join('') : '<tr><td colspan="7" class="empty">Nenhum estudo registrado.</td></tr>') +
          '</tbody></table></div></div>';
        var wk = E.weekly(conc, 12), lab = wk.map(function (w) { return w.label; });
        h += '<div class="grid g2 section"><div class="card"><h3>Acertos × flashcards (12 semanas)</h3>' + ui.lineChart([{ name: 'Questões', color: 'var(--primary)', data: wk.map(function (w) { return w.pct; }) }, { name: 'Flashcards', color: '#16a34a', data: wk.map(function (w) { return w.cardPct; }) }], { labels: lab, max: 100, fmt: function (v) { return Math.round(v) + '%'; } }) + '</div>' +
          '<div class="card"><h3>Questões por semana</h3>' + ui.barChart(lab, wk.map(function (w) { return w.total; })) + '</div></div>';
      } else if (statTab === 'assunto') {
        var ts = E.topicsOf(conc).filter(function (t) { return !mapDisc || t.disc === mapDisc; }).map(function (t) { return { t: t, s: E.topicStats(t.id) }; }).filter(function (x) { return x.s.sessoes.length; });
        ts.sort(function (a, b) { return (a.s.pct == null ? 999 : a.s.pct) - (b.s.pct == null ? 999 : b.s.pct); });
        h += '<div class="row" style="margin-bottom:10px"><select data-f="disc">' + ui.discOptions(mapDisc, true) + '</select><small class="muted">Ordenado do pior para o melhor aproveitamento. ▼ = piorando nas últimas sessões.</small></div>';
        h += '<div class="card"><div class="tbl-wrap"><table><thead><tr><th>Assunto</th><th class="num">Tempo</th><th class="num">Questões</th><th class="num">%</th><th>Tendência</th><th>Domínio</th></tr></thead><tbody>' +
          (ts.length ? ts.map(function (x) { return '<tr class="click" data-topic="' + x.t.id + '"><td>' + ui.discTag(x.t.disc) + ' ' + U.esc(x.t.titulo) + '</td><td class="num">' + U.fmtMin(x.s.min) + '</td><td class="num">' + x.s.total + '</td><td class="num">' + ui.pctBadge(x.s.pct) + '</td><td>' + (ui.trendIcon(x.s.trend) || '—') + '</td><td>' + ui.domTag(E.dominio(x.t, x.s)) + '</td></tr>'; }).join('') : '<tr><td colspan="6" class="empty">Nenhum assunto estudado ainda.</td></tr>') +
          '</tbody></table></div></div>';
      } else if (statTab === 'mapa') {
        h += mapa(conc);
      } else {
        h += '<div class="card"><div class="tbl-wrap"><table><thead><tr><th>Quando</th><th>Ação</th><th>Detalhe</th></tr></thead><tbody>' +
          (SOS.S.historico.length ? SOS.S.historico.slice(0, 200).map(function (l) { var d = new Date(l.t); return '<tr><td>' + U.fmtDate(U.iso(d)) + ' ' + U.pad(d.getHours()) + ':' + U.pad(d.getMinutes()) + '</td><td>' + U.esc(l.acao) + '</td><td>' + U.esc(l.detalhe) + '</td></tr>'; }).join('') : '<tr><td colspan="3" class="empty">Sem registros.</td></tr>') +
          '</tbody></table></div></div>';
      }
      el.innerHTML = h;
      el.onclick = function (e) {
        var tb = e.target.closest('[data-tab]'); if (tb) { statTab = tb.dataset.tab; SOS.app.render(); return; }
        var tr = e.target.closest('[data-topic]'); if (tr) SOS.views.edital.openTopic(tr.dataset.topic);
      };
      el.onchange = function (e) { if (e.target.dataset.f === 'disc') { mapDisc = e.target.value; SOS.app.render(); } };
    }
  };
  function mapa(conc) {
    var ts = E.topicsOf(conc).filter(function (t) { return !mapDisc || t.disc === mapDisc; });
    var w = E.phaseWeights(U.today());
    var cnt = { alto: 0, medio: 0, baixo: 0, nao: 0 };
    var h = '<div class="row" style="margin-bottom:10px"><select data-f="disc">' + ui.discOptions(mapDisc, true) + '</select><div class="legend"><span><i class="dot" style="background:var(--good)"></i>Domínio alto (≥ 80%)</span><span><i class="dot" style="background:var(--mid)"></i>Intermediário (65–80%)</span><span><i class="dot" style="background:var(--bad)"></i>Baixo (&lt; 65%)</span><span><i class="dot" style="background:var(--faint)"></i>Ainda não estudado</span></div></div>';
    h += '<p class="muted" style="margin-top:0">Classificação calculada a partir de desempenho em questões (mín. 5), erros recorrentes (penalidade) e status. Dentro de cada disciplina, os tópicos aparecem do mais prioritário (onde investir tempo) para o menos.</p>';
    var byD = {};
    ts.forEach(function (t) { (byD[t.disc] = byD[t.disc] || []).push(t); });
    var body = '';
    SOS.S.disciplinas.forEach(function (d) {
      var arr = byD[d.id]; if (!arr) return;
      arr = arr.map(function (t) { var st = E.topicStats(t.id); var dm = E.dominio(t, st); cnt[dm]++; return { t: t, st: st, dm: dm, p: E.priority(t, U.today(), w) }; }).sort(function (a, b) { return b.p - a.p; });
      body += '<div class="card section"><div class="card-h">' + ui.discTag(d.id) + '<div class="right"><small class="muted">' + arr.length + ' tópicos</small></div></div><div class="heat">' +
        arr.map(function (x) { return '<div class="hcell ' + x.dm + '" data-topic="' + x.t.id + '" title="' + U.esc(x.t.titulo) + '"><b>' + E.DOM[x.dm] + (x.st.total ? ' · ' + U.fmtPct(x.st.pct) : '') + (x.st.errosCaderno ? ' · ' + x.st.errosCaderno + ' erros' : '') + '</b>' + U.esc(x.t.titulo.length > 70 ? x.t.titulo.slice(0, 67) + '…' : x.t.titulo) + '</div>'; }).join('') + '</div></div>';
    });
    h += '<div class="grid g4">' + ['alto', 'medio', 'baixo', 'nao'].map(function (k) { return '<div class="card kpi"><div class="l">' + E.DOM[k] + '</div><div class="v">' + cnt[k] + '</div></div>'; }).join('') + '</div>' + body;
    return h;
  }
})();
