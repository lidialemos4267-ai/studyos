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

  SOS.views.dashboard = {
    render: function (el) {
      var conc = SOS.app.conc, t = U.today(), S = SOS.S;
      var mon = U.monday(t), monthStart = t.slice(0, 8) + '01';
      var wk = E.sum(E.sessions(conc, mon, U.addDays(mon, 6)));
      var mo = E.sum(E.sessions(conc, monthStart, t));
      var all = E.sum(E.sessions(conc));
      var prog = E.progresso(conc);
      var rq = E.revisionQueue(t);
      var atrasadas = rq.filter(function (i) { return i.tipo === 'atrasada' && E.topicIn(i.t, conc); }).length;
      var cardsDue = S.flashcards.filter(function (c) { return E.cardDue(c) && (conc === 'all' || (c.concursos || []).indexOf(conc) > -1); }).length;
      var errDue = S.erros.filter(function (e) { return E.erroDue(e) && (conc === 'all' || (e.concursos || []).indexOf(conc) > -1); }).length;
      var recorr = S.erros.filter(function (e) { return (e.ocorrencias || 1) > 1 && e.status !== 'Superado' && (conc === 'all' || (e.concursos || []).indexOf(conc) > -1); }).length;
      var pend = E.topicsOf(conc).filter(function (x) { return x.status === 'nao'; }).length;
      var discRealiz = S.discursivas.filter(function (d) { return d.texto && d.texto.trim(); }).length;
      var bd = E.byDisc(conc).filter(function (d) { return d.total >= 10; }).sort(function (a, b) { return b.pct - a.pct; });
      var wkly = E.weekly(conc, 8);
      var today = S.atividades.filter(function (a) { return a.data === t; });
      var h = '';

      // contagem regressiva
      h += '<div class="grid g3">';
      examGroups().forEach(function (g) {
        var d = U.diffDays(t, g.data);
        h += '<div class="card"><div class="count"><div class="days">' + (d >= 0 ? d : '✓') + '<small>' + (d === 1 ? 'DIA' : 'DIAS') + '</small></div><div><b style="font-family:var(--f-head)">' + U.esc(g.orgao) + '</b><br>' +
          g.itens.map(function (c) { return '<span class="dot" style="background:' + c.cor + '"></span> ' + U.esc(c.cargo.split(' (')[0].split(' —')[0]) + ' · ' + c.turno; }).join('<br>') +
          '<br><small>' + U.DIAS[U.dow(g.data)] + ', ' + U.fmtDate(g.data) + ' ' + (g.confirmada ? '<span class="tag good">confirmada no edital</span>' : '<span class="tag mid">pendente de confirmação</span>') + '</small></div></div></div>';
      });
      h += '<div class="card"><h3>Acesso rápido</h3><div class="stack">' +
        '<button class="btn" style="width:100%;justify-content:space-between" data-go="erros?hoje=1">Revisar meus erros de hoje <span class="badge soft">' + errDue + '</span></button>' +
        '<button class="btn" style="width:100%;justify-content:space-between" data-go="flashcards?revisar=1">Revisar flashcards de hoje <span class="badge soft">' + cardsDue + '</span></button>' +
        '<button class="btn ghost" style="width:100%;justify-content:space-between" data-go="revisoes">Fila de revisões <span class="badge soft">' + rq.length + '</span></button>' +
        '</div></div></div>';

      // KPIs
      h += '<div class="grid g4 section">' +
        kpi('Edital concluído', U.fmtPct(prog.pct), prog.finalizados + ' de ' + prog.total + ' tópicos · ' + U.fmtPct(prog.pctIni) + ' iniciados', '<div class="prog" style="margin-top:6px"><i style="width:' + prog.pct + '%"></i></div>') +
        kpi('Horas na semana', U.fmtMin(wk.min), 'Mês: ' + U.fmtMin(mo.min)) +
        kpi('Questões resolvidas', all.total, all.erros + ' erros no total') +
        kpi('Aproveitamento geral', ui.pctBadge(all.pct), 'Semana: ' + U.fmtPct(wk.pct)) +
        '</div><div class="grid g4 section">' +
        kpi('Conteúdos pendentes', pend, 'tópicos não iniciados') +
        kpi('Revisões atrasadas', atrasadas, rq.length + ' na fila de hoje') +
        kpi('Flashcards para revisar', cardsDue, S.flashcards.length + ' cartões no total') +
        kpi('Erros recorrentes', recorr, 'Discursivas realizadas: ' + discRealiz) +
        '</div>';

      // hoje + recomendações
      h += '<div class="grid g2 section"><div class="card"><div class="card-h"><h3>Hoje — ' + U.DIAS[U.dow(t)] + ', ' + U.fmtDate(t) + '</h3><div class="right"><button class="btn sm ghost" data-go="plano">Abrir planejamento</button></div></div>';
      if (!today.length) h += '<div class="empty">Nenhuma atividade planejada para hoje.<br><button class="btn sm" style="margin-top:8px" data-go="plano?gerar=1">Gerar plano da semana</button></div>';
      else h += today.map(function (a) { return '<div class="list-item row"><span class="tag ' + (a.status === 'feito' ? 'good' : '') + '">' + ({ nao: 'A fazer', andamento: 'Em andamento', revisar: 'Revisar', feito: 'Finalizado', naofeito: 'Não realizada' }[a.status] || a.status) + '</span> ' + (a.disc ? ui.discTag(a.disc) : '') + ' <span>' + U.esc(a.topicId ? SOS.topicLabel(a.topicId) : a.titulo) + '</span><span class="spacer"></span><small>' + a.metodo + ' · ' + U.fmtMin(a.planMin) + '</small></div>'; }).join('');
      h += '</div><div class="card"><h3>O que fazer agora</h3>' + advice(conc, rq, errDue, cardsDue) + '</div></div>';

      // melhor / pior
      h += '<div class="grid g2 section"><div class="card"><h3>Melhor desempenho</h3>' + discRows(bd.slice(0, 4)) + '</div><div class="card"><h3>Pior desempenho</h3>' + discRows(bd.slice().reverse().slice(0, 4)) + '<small class="muted">Mínimo de 10 questões por disciplina para entrar no ranking.</small></div></div>';

      // gráficos
      var labels = wkly.map(function (w) { return w.label; });
      h += '<div class="grid g2 section">' +
        '<div class="card"><h3>Evolução dos acertos (por semana)</h3>' + ui.lineChart([{ name: '% acertos', color: 'var(--primary)', data: wkly.map(function (w) { return w.pct; }) }], { labels: labels, max: 100, refLine: 80, fmt: function (v) { return Math.round(v) + '%'; } }) + '</div>' +
        '<div class="card"><h3>Horas estudadas (por semana)</h3>' + ui.barChart(labels, wkly.map(function (w) { return Math.round(w.min / 6) / 10; }), { fmt: function (v) { return v + 'h'; } }) + '</div>' +
        '<div class="card"><h3>Desempenho por disciplina</h3>' + ui.hbars(E.byDisc(conc).filter(function (d) { return d.total > 0; }).sort(function (a, b) { return b.total - a.total; }).map(function (d) { return { label: SOS.disc(d.disc).nome, value: d.pct, color: ui.pctColor(d.pct), text: U.fmtPct(d.pct) }; })) + '</div>' +
        '<div class="card"><h3>Avanço no edital</h3>' + ui.hbars(S.concursos.map(function (c) { var p = E.progresso(c.id); return { label: c.sigla, value: p.pct, color: c.cor, text: Math.round(p.pct) + '%' }; })) + '<small class="muted">Percentual de tópicos finalizados. Tópicos compartilhados contam para todos os concursos a que pertencem.</small></div>' +
        '<div class="card"><h3>Erros registrados (por semana)</h3>' + ui.barChart(labels, wkly.map(function (w) { return w.errosCad; }), { color: 'var(--bad)' }) + '</div>' +
        '<div class="card"><h3>Evolução das discursivas (nota média)</h3>' + ui.lineChart([{ name: 'Nota', color: '#0891b2', data: wkly.map(function (w) { return w.discNota; }) }], { labels: labels, max: 100, refLine: 40 }) + '</div>' +
        '</div>';
      el.innerHTML = h;
      el.onclick = function (e) { var g = e.target.closest('[data-go]'); if (g) { var p = g.dataset.go.split('?'); SOS.app.go(p[0], p[1]); } };
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
