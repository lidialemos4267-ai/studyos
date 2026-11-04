/* Questões e desempenho: registros de estudo, histórico e evolução por disciplina/assunto. */
(function () {
  var SOS = window.SOS, U = SOS.U, ui = SOS.ui, E = SOS.E;
  var f = { disc: '', metodo: '', de: '', ate: '' };

  SOS.views.desempenho = {
    render: function (el) {
      var conc = SOS.app.conc;
      var ss = E.sessions(conc, f.de || null, f.ate || null).filter(function (s) {
        var t = SOS.topic(s.topicId);
        return (!f.disc || (t && t.disc === f.disc)) && (!f.metodo || s.metodo === f.metodo);
      }).sort(function (a, b) { return a.data < b.data ? 1 : -1; });
      var sum = E.sum(ss);
      var dias = E.dailyEntries(ss).sort(function (a, b) { return a.data < b.data ? 1 : -1; });
      var topics = E.topicsOf(conc).map(function (t) { return { t: t, s: E.topicStats(t.id) }; });
      var down = topics.filter(function (x) { return x.s.trend === 'down'; }), up = topics.filter(function (x) { return x.s.trend === 'up'; });
      var h = '<div class="row" style="margin-bottom:14px"><select data-f="disc">' + ui.discOptions(f.disc, true) + '</select><select data-f="metodo"><option value="">Todos os métodos</option>' + ui.opts(E.METODOS, f.metodo) + '</select><label class="row" style="gap:4px"><small>de</small><input type="date" data-f="de" value="' + f.de + '" style="width:auto"></label><label class="row" style="gap:4px"><small>até</small><input type="date" data-f="ate" value="' + f.ate + '" style="width:auto"></label><span class="spacer"></span><button class="btn" data-act="new">+ Registrar estudo / questões</button></div>';
      h += '<div class="grid g4">' +
        k('Tempo estudado', U.fmtMin(sum.min)) + k('Questões', sum.total) + k('Acertos / erros', sum.acertos + ' / ' + sum.erros) + k('Aproveitamento', ui.pctBadge(sum.pct)) + '</div>';
      h += '<div class="alert info section" style="display:block"><b>Sinalização:</b> <span class="pct bad">abaixo de 70%</span> <span class="pct mid">70% a 80%</span> <span class="pct good">81% a 100%</span> · Percentual = acertos ÷ total de questões × 100.</div>';
      h += '<div class="grid g2"><div class="card"><h3>▼ Assuntos piorando</h3>' + trendList(down) + '</div><div class="card"><h3>▲ Assuntos melhorando</h3>' + trendList(up) + '</div></div>';
      h += '<div class="card section"><div class="card-h"><h3>Histórico — um item por assunto por dia (' + dias.length + ')</h3></div><div class="tbl-wrap"><table><thead><tr><th>Data</th><th>Assunto</th><th>Feito</th><th class="num">Leitura</th><th class="num">Tempo</th><th class="num">Q.</th><th class="num">Acertos</th><th class="num">%</th><th></th></tr></thead><tbody>' +
        (dias.length ? dias.slice(0, 300).map(function (dd) {
          var t = SOS.topic(dd.topicId), man = dd.partes.find(function (p) { return p.origem !== 'TEC' && p.origem !== 'TEC-cad'; }), auto = dd.partes.some(function (p) { return p.origem === 'TEC'; });
          return '<tr><td>' + U.fmtDate(dd.data) + '</td><td>' + (t ? ui.discTag(t.disc) + ' ' + U.esc(t.titulo) : '<i>tópico removido</i>') + (dd.obs ? '<br><small class="muted">' + U.esc(dd.obs) + '</small>' : '') + '</td><td><small>' + U.esc(dd.metodo) + (dd.revisao ? ' · revisão' : '') + (auto ? ' · <span class="tag">TEC</span>' : '') + '</small></td><td class="num">' + (dd.leituraMin ? U.fmtMin(dd.leituraMin) : '—') + '</td><td class="num">' + U.fmtMin(dd.realizadoMin) + '</td><td class="num">' + dd.total + '</td><td class="num">' + dd.acertos + '</td><td class="num">' + (dd.total ? ui.pctBadge(U.pct(dd.acertos, dd.total)) : '—') + '</td><td class="num">' + (man ? '<button class="btn xs ghost" data-edit="' + man.id + '">Editar</button> <button class="btn xs ghost" data-err="' + man.id + '" title="Registrar erro">+ erro</button> <button class="btn xs ghost" data-del="' + man.id + '">✕</button>' : '<small class="muted">automático</small>') + '</td></tr>';
        }).join('') : '<tr><td colspan="9" class="empty">Nenhum registro com esses filtros.</td></tr>') + '</tbody></table></div></div>';
      el.innerHTML = h;
      el.onchange = function (e) { var k2 = e.target.dataset.f; if (k2) { f[k2] = e.target.value; SOS.app.render(); } };
      el.onclick = function (e) {
        var x;
        if (e.target.closest('[data-act=new]')) return ui.sessionModal();
        if ((x = e.target.closest('[data-edit]'))) return ui.sessionModal({ session: SOS.S.sessoes.find(function (s) { return s.id === x.dataset.edit; }) });
        if ((x = e.target.closest('[data-err]'))) { var s0 = SOS.S.sessoes.find(function (s) { return s.id === x.dataset.err; }); return SOS.views.erros.openForm({ topicId: s0.topicId, sessaoId: s0.id }); }
        if ((x = e.target.closest('[data-del]'))) {
          var s = SOS.S.sessoes.find(function (y) { return y.id === x.dataset.del; });
          return ui.confirm('Excluir o registro de ' + U.fmtDate(s.data) + ' (' + U.esc(SOS.topicLabel(s.topicId)) + ')? As estatísticas serão recalculadas.', function () {
            SOS.S.sessoes = SOS.S.sessoes.filter(function (y) { return y.id !== s.id; });
            SOS.S.atividades.forEach(function (a) { if (a.sessionId === s.id) a.sessionId = null; });
            SOS.log('Registro excluído', SOS.topicLabel(s.topicId)); SOS.save(); SOS.app.render();
          });
        }
        if ((x = e.target.closest('[data-topic]'))) SOS.views.edital.openTopic(x.dataset.topic);
      };
    }
  };
  function k(l, v) { return '<div class="card kpi"><div class="l">' + l + '</div><div class="v">' + v + '</div></div>'; }
  function trendList(arr) {
    if (!arr.length) return '<div class="empty">Sem tendência identificada (são necessárias pelo menos 4 sessões com questões no assunto).</div>';
    return arr.slice(0, 8).map(function (x) { return '<div class="list-item row click" data-topic="' + x.t.id + '" style="cursor:pointer">' + ui.discTag(x.t.disc) + '<span>' + U.esc(x.t.titulo) + '</span><span class="spacer"></span>' + ui.pctBadge(x.s.pct) + '</div>'; }).join('');
  }
})();
