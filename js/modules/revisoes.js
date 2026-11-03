/* Revisões inteligentes: fila diária por tipo, reprogramação e distribuição equilibrada. */
(function () {
  var SOS = window.SOS, U = SOS.U, ui = SOS.ui, E = SOS.E;
  var TIPO_CLS = { atrasada: 'bad', programada: '', desempenho: 'mid', recorrente: 'bad' };

  SOS.views.revisoes = {
    render: function (el) {
      var t = U.today(), conc = SOS.app.conc, s = SOS.S.settings;
      var q = E.revisionQueue(t).filter(function (i) { return E.topicIn(i.t, conc); });
      var cap = Math.max(1, Math.floor(s.minRevisaoDia / s.minPorRevisao));
      var cards = SOS.S.flashcards.filter(function (c) { return E.cardDue(c) && (conc === 'all' || (c.concursos || []).indexOf(conc) > -1); }).length;
      var errs = SOS.S.erros.filter(function (e) { return E.erroDue(e) && (conc === 'all' || (e.concursos || []).indexOf(conc) > -1); }).length;
      var cnt = { atrasada: 0, programada: 0, desempenho: 0, recorrente: 0 };
      q.forEach(function (i) { cnt[i.tipo]++; });
      var h = '<div class="grid g4">' + k('Programadas', cnt.programada) + k('Atrasadas', cnt.atrasada) + k('Baixo desempenho', cnt.desempenho) + k('Erro recorrente', cnt.recorrente) + '</div>';
      h += '<div class="grid g2 section"><div class="card"><div class="card-h"><h3>Flashcards</h3><div class="right"><button class="btn sm" data-go="flashcards?revisar=1">Revisar (' + cards + ')</button></div></div><small class="muted">Revisão de flashcards com repetição espaçada.</small></div><div class="card"><div class="card-h"><h3>Caderno de Erros</h3><div class="right"><button class="btn sm" data-go="erros?hoje=1">Revisar erros (' + errs + ')</button></div></div><small class="muted">Erros com revisão agendada para hoje (intervalos ' + s.intervalosErro.join(', ') + ' dias).</small></div></div>';
      h += '<div class="card section"><div class="card-h"><h3>Fila de hoje — ' + U.fmtDate(t) + '</h3><div class="right"><small class="muted">Capacidade: ' + cap + ' revisões (' + U.fmtMin(s.minRevisaoDia) + ' ÷ ' + s.minPorRevisao + ' min)</small>' + (q.filter(function (i) { return i.tipo === 'atrasada' || i.tipo === 'programada'; }).length > cap ? '<button class="btn sm mid" data-act="balance">Distribuir excesso</button>' : '') + '</div></div>';
      if (!q.length) h += '<div class="empty">Nenhuma revisão pendente para hoje.</div>';
      else h += q.map(function (i, idx) {
        var st = E.topicStats(i.t.id);
        return '<div class="list-item"><div class="row">' + (idx >= cap ? '<span class="tag">excedente</span>' : '') + '<span class="tag ' + TIPO_CLS[i.tipo] + '">' + U.esc(i.label) + '</span>' + ui.discTag(i.t.disc) + '<b>' + U.esc(i.t.titulo) + '</b><span class="spacer"></span>' + ui.concTags(i.t.concursos) + '</div>' +
          '<div class="row" style="margin-top:4px"><small class="muted">1º estudo: ' + U.fmtDate(i.t.primeiroEstudo) + ' · última revisão: ' + U.fmtDate(i.t.ultimaRevisao) + ' · próxima: ' + U.fmtDate(i.t.rev && i.t.rev.next) + ' · ' + ui.pctBadge(st.pct) + ' (' + st.total + ' q.) · ' + st.errosCaderno + ' erros · ' + E.IMP[i.t.imp] + ' · Inc. ' + E.INC[i.t.inc] + '</small><span class="spacer"></span><button class="btn xs good" data-rev="' + i.t.id + '">Registrar revisão</button><button class="btn xs ghost" data-adiar="' + i.t.id + '">Adiar 1 dia</button><input type="date" data-move="' + i.t.id + '" style="width:auto;padding:2px 6px" title="Reprogramar"></div></div>';
      }).join('');
      h += '</div>';
      // carga dos próximos 14 dias
      var labels = [], data = [];
      for (var d = 1; d <= 14; d++) { var day = U.addDays(t, d); labels.push(U.fmtShort(day)); data.push(SOS.S.topicos.filter(function (x) { return x.rev && x.rev.next === day; }).length); }
      h += '<div class="card section"><h3>Revisões programadas — próximos 14 dias</h3>' + ui.barChart(labels, data, { color: '#0d9488' }) + '<small class="muted">Linha de referência de capacidade diária: ' + cap + ' revisões. Use “Distribuir excesso” quando um dia passar da capacidade.</small></div>';
      el.innerHTML = h;
      el.onclick = function (e) {
        var x;
        if ((x = e.target.closest('[data-go]'))) { var p = x.dataset.go.split('?'); return SOS.app.go(p[0], p[1]); }
        if ((x = e.target.closest('[data-rev]'))) return ui.sessionModal({ topicId: x.dataset.rev, metodo: 'Revisão', planMin: s.minPorRevisao });
        if ((x = e.target.closest('[data-adiar]'))) { var tp = SOS.topic(x.dataset.adiar); tp.rev.next = U.addDays(t, 1); SOS.log('Revisão adiada', tp.titulo); SOS.save(); return SOS.app.render(); }
        if (e.target.closest('[data-act=balance]')) return balance();
      };
      el.onchange = function (e) {
        var id = e.target.dataset.move; if (!id || !e.target.value) return;
        var tp = SOS.topic(id); tp.rev = tp.rev || { step: 0 }; tp.rev.next = e.target.value;
        SOS.log('Revisão reprogramada', tp.titulo + ' → ' + U.fmtDate(e.target.value)); SOS.save(); SOS.app.render(); ui.toast('Revisão reprogramada.', 'good');
      };
    }
  };
  function k(l, v) { return '<div class="card kpi"><div class="l">' + l + '</div><div class="v">' + v + '</div></div>'; }
  function balance() {
    var moves = E.balanceRevisions(U.today());
    if (!moves.length) { ui.toast('A fila de hoje cabe na capacidade diária.'); return; }
    ui.modal({
      title: 'Distribuir revisões excedentes', wide: true,
      body: '<p class="muted" style="margin-top:0">As revisões de maior prioridade ficam hoje. As demais são espalhadas pelos próximos dias, respeitando a capacidade diária e evitando domingos.</p><table><thead><tr><th>Tópico</th><th>De</th><th>Para</th></tr></thead><tbody>' + moves.map(function (m) { return '<tr><td>' + ui.discTag(m.t.disc) + ' ' + U.esc(m.t.titulo) + '</td><td class="diff-old">' + U.fmtShort(m.from) + '</td><td class="diff-new">' + U.fmtShort(m.to) + '</td></tr>'; }).join('') + '</tbody></table>',
      buttons: [{ label: 'Cancelar', cls: 'ghost' }, { label: 'Aprovar', cls: 'good', onClick: function () { moves.forEach(function (m) { m.t.rev.next = m.to; }); SOS.log('Revisões distribuídas', moves.length + ' tópicos'); SOS.save(); SOS.app.render(); } }]
    });
  }
})();
