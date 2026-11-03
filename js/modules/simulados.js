/* Simulados: registro por área no formato real de cada prova, pontuação com os pesos do edital e evolução. */
(function () {
  var SOS = window.SOS, U = SOS.U, ui = SOS.ui, E = SOS.E;

  SOS.views.simulados = {
    render: function (el, q) {
      if (q && q.get('novo')) { history.replaceState(null, '', '#simulados'); setTimeout(function () { form(null); }, 30); }
      var conc = SOS.app.conc;
      var ss = SOS.S.simulados.filter(function (s) { return conc === 'all' || s.concursoId === conc; }).sort(function (a, b) { return a.data < b.data ? 1 : -1; });
      var h = '<div class="row" style="margin-bottom:14px"><button class="btn" data-act="new">+ Registrar simulado</button><span class="spacer"></span><small class="muted">A pontuação usa os pesos e os critérios de eliminação de cada edital.</small></div>';
      h += '<div class="grid g3">';
      SOS.S.concursos.forEach(function (c) {
        if (conc !== 'all' && conc !== c.id) return;
        var mine = SOS.S.simulados.filter(function (s) { return s.concursoId === c.id; }).sort(function (a, b) { return a.data < b.data ? -1 : 1; });
        var sc = mine.map(function (s) { return E.scoreSimulado(s); });
        h += '<div class="card"><div class="card-h"><span class="dot" style="background:' + c.cor + '"></span><h3>' + U.esc(c.sigla) + '</h3><div class="right"><small class="muted">' + mine.length + ' simulado(s)</small></div></div>' +
          ui.lineChart([{ name: 'Pontos', color: c.cor, data: sc.map(function (x) { return x ? x.pontos : null; }) }], { labels: mine.map(function (s) { return U.fmtShort(s.data); }), max: c.totalPontos, refLine: c.minimos.total, h: 150 }) +
          '<small class="muted">Linha tracejada: mínimo para habilitação (' + c.minimos.total + ' de ' + c.totalPontos + ').</small></div>';
      });
      h += '</div>';
      h += '<div class="card section"><div class="tbl-wrap"><table><thead><tr><th>Data</th><th>Concurso</th><th>Por área</th><th class="num">Tempo</th><th class="num">Pontos</th><th>Situação</th><th></th></tr></thead><tbody>' +
        (ss.length ? ss.map(function (s) {
          var c = SOS.conc(s.concursoId), r = E.scoreSimulado(s);
          return '<tr><td>' + U.fmtDate(s.data) + '</td><td>' + ui.concTags([s.concursoId]) + '</td><td><small>' + (s.areas || []).map(function (a) { return U.esc(c && c.areas[a.k] ? c.areas[a.k].nome : a.k) + ': ' + a.acertos + '/' + a.total; }).join(' · ') + (s.discNota !== '' && s.discNota != null ? ' · Discursiva: ' + s.discNota : '') + '</small>' + (s.analise ? '<br><small class="muted">' + U.esc(s.analise) + '</small>' : '') + '</td><td class="num">' + U.fmtMin(s.tempoMin) + '</td><td class="num"><b>' + (r ? String(r.pontos).replace('.', ',') : '—') + '</b> / ' + (c ? c.totalPontos : '') + '</td><td>' + (r ? (r.aprovado ? '<span class="tag good">Habilitado</span>' : '<span class="tag bad">' + U.esc(r.msgs.join('; ')) + '</span>') : '') + '</td><td class="num"><button class="btn xs ghost" data-edit="' + s.id + '">Editar</button> <button class="btn xs ghost" data-del="' + s.id + '">✕</button></td></tr>';
        }).join('') : '<tr><td colspan="7" class="empty">Nenhum simulado registrado. Os domingos do plano já reservam tempo para eles.</td></tr>') + '</tbody></table></div></div>';
      el.innerHTML = h;
      el.onclick = function (e) {
        var x;
        if (e.target.closest('[data-act=new]')) return form(null);
        if ((x = e.target.closest('[data-edit]'))) return form(SOS.S.simulados.find(function (s) { return s.id === x.dataset.edit; }));
        if ((x = e.target.closest('[data-del]'))) { var s = SOS.S.simulados.find(function (y) { return y.id === x.dataset.del; }); return ui.confirm('Excluir o simulado de ' + U.fmtDate(s.data) + '?', function () { SOS.S.simulados = SOS.S.simulados.filter(function (y) { return y.id !== s.id; }); SOS.log('Simulado excluído', U.fmtDate(s.data)); SOS.save(); SOS.app.render(); }); }
      };
    }
  };

  function form(s) {
    var isNew = !s;
    var next = SOS.S.concursos.filter(function (c) { return c.dataProva >= U.today(); }).sort(function (a, b) { return a.dataProva < b.dataProva ? -1 : 1; })[0] || SOS.S.concursos[0];
    s = s || { id: U.uid('sim'), data: U.today(), concursoId: SOS.app.conc !== 'all' ? SOS.app.conc : next.id, areas: [], tempoMin: 0, discNota: '', analise: '', origem: '' };
    function areaRows(cid) {
      var c = SOS.conc(cid);
      return '<table><thead><tr><th>Área</th><th class="num">Questões</th><th class="num">Acertos</th><th class="num">Pts/q.</th></tr></thead><tbody>' + Object.keys(c.areas).map(function (k) {
        var a = c.areas[k], cur = (s.concursoId === cid && (s.areas || []).find(function (x) { return x.k === k; })) || {};
        return '<tr><td>' + U.esc(a.nome) + '</td><td class="num"><input type="number" min="0" name="t_' + k + '" value="' + (cur.total != null ? cur.total : a.q) + '" style="width:80px"></td><td class="num"><input type="number" min="0" name="a_' + k + '" value="' + (cur.acertos != null ? cur.acertos : '') + '" style="width:80px"></td><td class="num">' + String(a.v).replace('.', ',') + '</td></tr>';
      }).join('') + '</tbody></table>' + (c.discursiva && c.discursiva.existe ? '<label class="f" style="margin-top:8px;max-width:220px"><span>Nota da discursiva (0–100)</span><input type="number" min="0" max="100" name="disc" value="' + (s.discNota != null ? s.discNota : '') + '"></label>' : '');
    }
    ui.modal({
      title: isNew ? 'Registrar simulado' : 'Editar simulado', wide: true,
      body: '<div class="form"><label class="f"><span>Concurso (formato da prova)</span><select name="c">' + ui.concOptions(s.concursoId) + '</select></label><label class="f"><span>Data</span><input type="date" name="data" value="' + s.data + '"></label><label class="f"><span>Tempo de prova (00:00h)</span><input name="tempo" value="' + U.fmtMin(s.tempoMin).replace('h', '') + '"></label><label class="f"><span>Origem (banca/prova)</span><input name="origem" value="' + U.esc(s.origem || '') + '" placeholder="Ex.: Selecon — Câmara de X 2023"></label><div class="full" id="areas">' + areaRows(s.concursoId) + '</div><div class="full" id="score"></div><label class="f full"><span>Análise de desempenho</span><textarea name="analise" rows="3">' + U.esc(s.analise || '') + '</textarea></label></div>',
      onOpen: function (root) {
        function upd() {
          var cid = ui.val(root, 'c'), c = SOS.conc(cid);
          var tmp = { concursoId: cid, areas: Object.keys(c.areas).map(function (k) { return { k: k, total: +ui.val(root, 't_' + k) || 0, acertos: +ui.val(root, 'a_' + k) || 0 }; }) };
          var r = E.scoreSimulado(tmp);
          root.querySelector('#score').innerHTML = 'Pontuação: <b>' + String(r.pontos).replace('.', ',') + '</b> / ' + r.max + ' · ' + ui.pctBadge(r.pct) + ' ' + (r.aprovado ? '<span class="tag good">Habilitado</span>' : '<span class="tag bad">' + U.esc(r.msgs.join('; ')) + '</span>');
        }
        root.querySelector('[name=c]').addEventListener('change', function (ev) { root.querySelector('#areas').innerHTML = areaRows(ev.target.value); upd(); });
        root.addEventListener('input', upd); upd();
      },
      buttons: [{ label: 'Cancelar', cls: 'ghost' }, { label: 'Salvar', onClick: function (cl, root) {
        var cid = ui.val(root, 'c'), c = SOS.conc(cid), bad = false;
        var areas = Object.keys(c.areas).map(function (k) { var t = +ui.val(root, 't_' + k) || 0, a = +ui.val(root, 'a_' + k) || 0; if (a > t) bad = true; return { k: k, total: t, acertos: a }; });
        if (bad) { ui.toast('Acertos maiores que o total em alguma área.', 'bad'); return false; }
        s.concursoId = cid; s.data = ui.val(root, 'data'); s.tempoMin = U.parseMin(ui.val(root, 'tempo')); s.areas = areas; s.analise = ui.val(root, 'analise'); s.origem = ui.val(root, 'origem');
        var dn = root.querySelector('[name=disc]'); s.discNota = dn && dn.value !== '' ? +dn.value : '';
        if (isNew) SOS.S.simulados.push(s);
        SOS.log(isNew ? 'Simulado registrado' : 'Simulado editado', c.sigla + ' ' + U.fmtDate(s.data)); SOS.save(); SOS.app.render(); ui.toast('Simulado salvo.', 'good');
      } }]
    });
  }
})();
