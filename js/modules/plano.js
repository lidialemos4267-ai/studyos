/* Planejamento: semana, Kanban, calendário mensal, gerador do ciclo e reorganização automática (com aprovação). */
(function () {
  var SOS = window.SOS, U = SOS.U, ui = SOS.ui, E = SOS.E;
  var view = 'semana', weekStart = null, monthRef = null;
  var ST = { nao: 'Não iniciado', andamento: 'Em andamento', revisar: 'Revisar', feito: 'Finalizado', naofeito: 'Não realizada' };
  var COLS = ['nao', 'andamento', 'revisar', 'feito'];

  function actsIn(from, to) {
    var conc = SOS.app.conc;
    return SOS.S.atividades.filter(function (a) {
      if (a.data < from || a.data > to) return false;
      if (conc === 'all' || !a.topicId) return true;
      var t = SOS.topic(a.topicId); return t && t.concursos.indexOf(conc) > -1;
    });
  }
  function actTitle(a) { return a.topicId ? SOS.topicLabel(a.topicId) : (a.titulo || a.metodo); }
  function actPct(a) { var s = SOS.S.sessoes.find(function (x) { return x.atividadeId === a.id; }); return s && s.total ? U.pct(s.acertos, s.total) : null; }
  function card(a) {
    var t = a.topicId && SOS.topic(a.topicId), p = actPct(a), late = a.data < U.today() && (a.status === 'nao' || a.status === 'andamento');
    return '<div class="kcard ' + (t ? 'imp' + t.imp : '') + (a.status === 'feito' ? ' done' : '') + (late || a.status === 'naofeito' ? ' late' : '') + '" draggable="true" data-id="' + a.id + '">' +
      '<div class="k-m">' + (a.disc ? ui.discTag(a.disc) : '<span class="tag">' + U.esc(a.metodo) + '</span>') + (t ? ui.concTags(t.concursos) : '') + '</div>' +
      '<div class="k-t">' + U.esc(actTitle(a)) + '</div>' +
      '<div class="k-m"><span>' + U.esc(a.metodo) + '</span>·<span>' + U.fmtMin(a.planMin) + '</span>' + (t ? '·<span>' + E.IMP[t.imp] + '</span>' : '') + (view === 'kanban' ? '·<span>' + U.fmtShort(a.data) + '</span>' : '') + (p != null ? ' ' + ui.pctBadge(p) : '') + (a.status === 'naofeito' ? ' <span class="tag bad">não realizada</span>' : late ? ' <span class="tag bad">atrasada</span>' : '') + (a.obs ? ' <span title="' + U.esc(a.obs) + '">📝</span>' : '') + '</div>' +
      '<div class="k-a">' +
      (a.status !== 'feito' ? '<button class="btn xs good" data-done="' + a.id + '">Concluir</button>' : '') +
      (a.status !== 'feito' && a.status !== 'naofeito' ? '<button class="btn xs ghost" data-miss="' + a.id + '">Não realizei</button>' : '') +
      '<button class="btn xs ghost" data-edit="' + a.id + '">Editar</button><button class="btn xs ghost" data-dup="' + a.id + '" title="Duplicar">⧉</button><button class="btn xs ghost" data-del="' + a.id + '" title="Excluir">✕</button></div></div>';
  }

  SOS.views.plano = {
    render: function (el, q) {
      var t = U.today();
      if (!weekStart) weekStart = U.monday(t);
      if (!monthRef) monthRef = t.slice(0, 7);
      var pend = E.pendingActivities();
      var h = '<div class="row" style="margin-bottom:14px"><div class="seg">' + [['semana', 'Dias da semana'], ['kanban', 'Kanban'], ['mes', 'Calendário']].map(function (x) { return '<button data-view="' + x[0] + '" class="' + (view === x[0] ? 'active' : '') + '">' + x[1] + '</button>'; }).join('') + '</div>';
      if (view !== 'mes') h += '<button class="icon-btn" data-wk="-1" aria-label="Semana anterior">◀</button><b style="font-family:var(--f-head)">' + U.fmtDate(weekStart) + ' – ' + U.fmtDate(U.addDays(weekStart, 6)) + '</b><button class="icon-btn" data-wk="1" aria-label="Próxima semana">▶</button><button class="btn xs ghost" data-wk="0">Hoje</button>';
      else h += '<button class="icon-btn" data-mo="-1">◀</button><b style="font-family:var(--f-head)">' + U.MESES[+monthRef.slice(5) - 1] + ' de ' + monthRef.slice(0, 4) + '</b><button class="icon-btn" data-mo="1">▶</button>';
      h += '<span class="spacer"></span><button class="btn ghost sm" data-act="new">+ Atividade</button><button class="btn sm" data-act="gen">Gerar plano da semana</button></div>';
      if (pend.length) h += '<div class="alert bad"><span><b>' + pend.length + '</b> atividade(s) atrasada(s) ou não realizada(s).</span><button class="btn sm" data-act="reorg">Reorganizar cronograma</button></div>';
      var wEnd = U.addDays(weekStart, 6);
      if (view === 'semana') {
        h += '<div class="week">';
        for (var i = 0; i < 7; i++) {
          var d = U.addDays(weekStart, i), acts = actsIn(d, d), min = acts.reduce(function (x, a) { return x + (+a.planMin || 0); }, 0);
          var discs = []; acts.forEach(function (a) { if (a.disc && discs.indexOf(a.disc) < 0) discs.push(a.disc); });
          var warn = discs.length > SOS.S.settings.maxDisciplinasDia ? ' ⚠ ' + discs.length + ' disciplinas' : (discs.indexOf('LP') > -1 && discs.indexOf('INF') > -1 ? ' ⚠ LP + Informática' : '');
          var exam = SOS.S.concursos.filter(function (c) { return c.dataProva === d; });
          h += '<div class="day ' + (d === t ? 'today' : '') + '" data-day="' + d + '"><h4><span>' + U.DIAS_C[U.dow(d)] + ' ' + U.fmtShort(d) + '</span><span class="load" title="Tempo planejado">' + U.fmtMin(min) + '</span></h4>' +
            (exam.length ? '<div class="tag bad" style="margin-bottom:6px">PROVA: ' + exam.map(function (c) { return U.esc(c.sigla); }).join(' + ') + '</div>' : '') +
            (warn ? '<div class="tag mid" style="margin-bottom:6px">' + warn + '</div>' : '') +
            acts.map(card).join('') + '<button class="btn xs ghost" data-addday="' + d + '">+ adicionar</button></div>';
        }
        h += '</div>';
      } else if (view === 'kanban') {
        var acts = actsIn(weekStart, wEnd);
        h += '<div class="kanban">' + COLS.map(function (c) {
          var list = acts.filter(function (a) { return a.status === c || (c === 'nao' && a.status === 'naofeito'); });
          return '<div class="col" data-col="' + c + '"><h4><span>' + ST[c] + '</span><span>' + list.length + '</span></h4>' + list.map(card).join('') + '</div>';
        }).join('') + '</div>';
      } else h += month();
      h += '<p class="muted section" style="font-size:13px">Arraste cartões entre colunas (Kanban) ou entre dias (semana). Ao concluir uma atividade, registre o tempo realizado e as questões — as estatísticas são atualizadas automaticamente.</p>';
      el.innerHTML = h;
      el.onclick = onClick; bindDrag(el);
      if (q && q.get('gerar')) { history.replaceState(null, '', '#plano'); setTimeout(genPreview, 30); }
      if (q && q.get('reorg')) { history.replaceState(null, '', '#plano'); setTimeout(function () { reorg(E.pendingActivities()); }, 30); }
    }
  };

  function month() {
    var first = U.parse(monthRef + '-01'), start = U.monday(monthRef + '-01'), t = U.today();
    var h = '<div class="legend" style="margin-bottom:8px"><span><i class="dot" style="background:var(--bad)"></i>Prova</span><span>Clique num dia para abrir a semana</span></div><div class="month">' + ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(function (d) { return '<div class="mhead">' + d + '</div>'; }).join('');
    for (var i = 0; i < 42; i++) {
      var d = U.addDays(start, i);
      if (i >= 35 && d.slice(0, 7) !== monthRef) break;
      var acts = actsIn(d, d);
      var ev = SOS.S.concursos.filter(function (c) { return c.dataProva === d; }).map(function (c) { return '<span class="ev exam">PROVA ' + U.esc(c.sigla) + '</span>'; });
      var sims = SOS.S.simulados.filter(function (s) { return s.data === d; }).length, discs = SOS.S.discursivas.filter(function (x) { return x.data === d; }).length;
      var revs = SOS.S.topicos.filter(function (x) { return x.rev && x.rev.next === d; }).length;
      var fins = SOS.S.topicos.filter(function (x) { return x.status === 'finalizado' && x.finalizadoEm === d; }).length;
      if (acts.length) ev.push('<span class="ev">' + acts.length + ' atividade(s) · ' + U.fmtMin(acts.reduce(function (x, a) { return x + (+a.planMin || 0); }, 0)) + '</span>');
      acts.filter(function (a) { return a.metodo === 'Simulado' || a.metodo === 'Discursiva'; }).forEach(function (a) { ev.push('<span class="ev">' + a.metodo + '</span>'); });
      if (sims) ev.push('<span class="ev">✓ simulado</span>'); if (discs) ev.push('<span class="ev">✓ discursiva</span>');
      if (revs) ev.push('<span class="ev">' + revs + ' revisão(ões)</span>'); if (fins) ev.push('<span class="ev">' + fins + ' tópico(s) concluído(s)</span>');
      h += '<div class="mcell ' + (d.slice(0, 7) !== monthRef ? 'out ' : '') + (d === t ? 'today' : '') + '" data-goday="' + d + '"><div class="d">' + +d.slice(8) + '</div>' + ev.join('') + '</div>';
    }
    return h + '</div>';
  }

  function onClick(e) {
    var x;
    if ((x = e.target.closest('[data-view]'))) { view = x.dataset.view; return SOS.app.render(); }
    if ((x = e.target.closest('[data-wk]'))) { var n = +x.dataset.wk; weekStart = n === 0 ? U.monday(U.today()) : U.addDays(weekStart, 7 * n); return SOS.app.render(); }
    if ((x = e.target.closest('[data-mo]'))) { var d = U.parse(monthRef + '-01'); d.setMonth(d.getMonth() + +x.dataset.mo); monthRef = U.iso(d).slice(0, 7); return SOS.app.render(); }
    if ((x = e.target.closest('[data-goday]'))) { weekStart = U.monday(x.dataset.goday); view = 'semana'; return SOS.app.render(); }
    if ((x = e.target.closest('[data-done]'))) return finish(x.dataset.done);
    if ((x = e.target.closest('[data-miss]'))) return miss(x.dataset.miss);
    if ((x = e.target.closest('[data-edit]'))) return actForm(find(x.dataset.edit));
    if ((x = e.target.closest('[data-dup]'))) { var a = find(x.dataset.dup), c = JSON.parse(JSON.stringify(a)); c.id = U.uid('a'); c.status = 'nao'; c.gerado = false; SOS.S.atividades.push(c); SOS.log('Atividade duplicada', actTitle(a)); SOS.save(); ui.toast('Atividade duplicada.', 'good'); return SOS.app.render(); }
    if ((x = e.target.closest('[data-del]'))) { var ad = find(x.dataset.del); return ui.confirm('Excluir a atividade <b>' + U.esc(actTitle(ad)) + '</b> de ' + U.fmtDate(ad.data) + '? O registro de estudo vinculado (se houver) é mantido.', function () { SOS.S.atividades = SOS.S.atividades.filter(function (y) { return y.id !== ad.id; }); SOS.log('Atividade excluída', actTitle(ad)); SOS.save(); SOS.app.render(); }); }
    if ((x = e.target.closest('[data-addday]'))) return actForm(null, x.dataset.addday);
    if (e.target.closest('[data-act=new]')) return actForm(null);
    if (e.target.closest('[data-act=gen]')) return genPreview();
    if (e.target.closest('[data-act=reorg]')) return reorg(E.pendingActivities());
  }
  function find(id) { return SOS.S.atividades.find(function (a) { return a.id === id; }); }

  function setStatus(a, st) {
    var old = a.status; a.status = st;
    SOS.log('Status da atividade', actTitle(a) + ': ' + (ST[old] || old) + ' → ' + ST[st]);
    SOS.save(); SOS.app.render();
  }
  function finish(id) {
    var a = find(id);
    var routes = { erros: 'erros?hoje=1', flashcards: 'flashcards?revisar=1', revisoes: 'revisoes', discursiva: 'discursivas?nova=1', simulado: 'simulados?novo=1' };
    if (!a.topicId) {
      ui.modal({ title: 'Concluir atividade', body: '<p>' + U.esc(actTitle(a)) + '</p><label class="f"><span>Tempo realizado (00:00h)</span><input name="real" value="' + U.fmtMin(a.planMin).replace('h', '') + '"></label>' + (routes[a.tipo] ? '<p class="muted">Dica: use o módulo correspondente para registrar os detalhes.</p>' : ''), buttons: [{ label: 'Cancelar', cls: 'ghost' }, routes[a.tipo] ? { label: 'Abrir módulo', cls: 'ghost', onClick: function () { var r = routes[a.tipo].split('?'); SOS.app.go(r[0], r[1]); } } : null, { label: 'Concluir', cls: 'good', onClick: function (c, root) { a.realizadoMin = U.parseMin(ui.val(root, 'real')); setStatus(a, 'feito'); } }].filter(Boolean) });
      return;
    }
    ui.sessionModal({ topicId: a.topicId, metodo: a.metodo, planMin: a.planMin, data: a.data <= U.today() ? a.data : U.today(), atividadeId: a.id, onDone: function (s) { a.status = 'feito'; a.sessionId = s.id; var t = SOS.topic(a.topicId); if (t && t.status === 'finalizado' && !t.finalizadoEm) t.finalizadoEm = s.data; SOS.save(); } });
  }
  function miss(id) {
    var a = find(id); a.status = 'naofeito'; SOS.save();
    reorg([a], true);
  }

  function actForm(a, date) {
    var isNew = !a;
    a = a || { id: U.uid('a'), data: date || U.today(), topicId: null, disc: null, metodo: 'Questões', planMin: 60, titulo: '', tipo: 'estudo', status: 'nao', obs: '' };
    var body = '<div class="form">' +
      '<label class="f full"><span>Assunto do edital (opcional para revisões, simulados etc.)</span><select name="topicId">' + ui.topicOptions(a.topicId, SOS.app.conc, true) + '</select></label>' +
      '<label class="f full"><span>Título (quando não houver assunto)</span><input name="titulo" value="' + U.esc(a.titulo || '') + '"></label>' +
      '<label class="f"><span>Data</span><input type="date" name="data" value="' + a.data + '"></label>' +
      '<label class="f"><span>Método de estudo</span><select name="metodo">' + ui.metodoOptions(a.metodo) + '</select></label>' +
      '<label class="f"><span>Duração prevista (00:00h)</span><input name="dur" value="' + U.fmtMin(a.planMin).replace('h', '') + '"></label>' +
      '<label class="f"><span>Status</span><select name="status">' + ui.opts(Object.keys(ST).map(function (k) { return [k, ST[k]]; }), a.status) + '</select></label>' +
      '<label class="f full"><span>Observações</span><textarea name="obs" rows="2">' + U.esc(a.obs || '') + '</textarea></label></div>';
    ui.modal({
      title: isNew ? 'Nova atividade' : 'Editar atividade', body: body,
      buttons: [{ label: 'Cancelar', cls: 'ghost' }, { label: 'Salvar', onClick: function (c, root) {
        var tid = ui.val(root, 'topicId'), tit = ui.val(root, 'titulo').trim();
        if (!tid && !tit) { ui.toast('Escolha um assunto ou informe um título.', 'bad'); return false; }
        var newDate = ui.val(root, 'data');
        if (!isNew && newDate !== a.data) a.reprogramadaDe = a.data;
        a.topicId = tid || null; a.disc = tid ? SOS.topic(tid).disc : null; a.titulo = tit; a.data = newDate; a.metodo = ui.val(root, 'metodo');
        a.planMin = U.parseMin(ui.val(root, 'dur')); a.obs = ui.val(root, 'obs');
        var st = ui.val(root, 'status');
        if (isNew) { a.status = st; SOS.S.atividades.push(a); SOS.log('Atividade criada', actTitle(a)); SOS.save(); SOS.app.render(); }
        else if (st === 'feito' && a.status !== 'feito') { SOS.save(); setTimeout(function () { finish(a.id); }, 10); }
        else { a.status = st; SOS.log('Atividade editada', actTitle(a)); SOS.save(); SOS.app.render(); }
        checkDay(a.data);
      } }]
    });
  }
  function checkDay(d) {
    var L = E.dayLoad(d);
    if (L.discs.length > SOS.S.settings.maxDisciplinasDia) ui.toast('Atenção: ' + U.fmtShort(d) + ' ficou com ' + L.discs.length + ' disciplinas (máximo recomendado: ' + SOS.S.settings.maxDisciplinasDia + ').', 'mid', 5000);
    if (L.discs.indexOf('LP') > -1 && L.discs.indexOf('INF') > -1) ui.toast('Atenção: Português e Informática no mesmo dia (' + U.fmtShort(d) + ').', 'mid', 5000);
  }

  /* drag & drop */
  function bindDrag(el) {
    var dragId = null;
    el.querySelectorAll('.kcard').forEach(function (c) {
      c.addEventListener('dragstart', function (e) { dragId = c.dataset.id; c.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', dragId); } catch (x) { /* ok */ } });
      c.addEventListener('dragend', function () { c.classList.remove('dragging'); });
    });
    el.querySelectorAll('[data-col],[data-day]').forEach(function (z) {
      z.addEventListener('dragover', function (e) { e.preventDefault(); z.classList.add('over'); });
      z.addEventListener('dragleave', function () { z.classList.remove('over'); });
      z.addEventListener('drop', function (e) {
        e.preventDefault(); z.classList.remove('over');
        var a = find(dragId); if (!a) return;
        if (z.dataset.col) {
          if (z.dataset.col === a.status) return;
          if (z.dataset.col === 'feito') return finish(a.id);
          setStatus(a, z.dataset.col);
        } else if (z.dataset.day && z.dataset.day !== a.data) {
          a.reprogramadaDe = a.data; a.data = z.dataset.day; if (a.status === 'naofeito') a.status = 'nao';
          SOS.log('Atividade reprogramada', actTitle(a) + ' → ' + U.fmtDate(a.data)); SOS.save(); SOS.app.render(); checkDay(a.data);
        }
      });
    });
  }

  /* gerador semanal — mostra a proposta e só grava após aprovação */
  function genPreview() {
    var mon = weekStart || U.monday(U.today());
    var plan = E.generateWeek(mon);
    var w = E.phaseWeights(mon);
    var existing = SOS.S.atividades.filter(function (a) { return a.data >= mon && a.data <= U.addDays(mon, 6) && a.gerado && a.status === 'nao'; });
    var byDay = {};
    plan.forEach(function (a) { (byDay[a.data] = byDay[a.data] || []).push(a); });
    var body = '<p class="muted" style="margin-top:0">Pesos por concurso nesta semana: ' + Object.keys(w).filter(function (k) { return w[k] > 0; }).map(function (k) { return SOS.conc(k).sigla + ' ' + Math.round(w[k] * 100) + '%'; }).join(' · ') + '. Regras: até ' + SOS.S.settings.maxDisciplinasDia + ' disciplinas/dia, Português e Informática nunca no mesmo dia, sábado com discursiva, domingo com simulado e revisão. Tópicos compartilhados recebem prioridade extra porque valem para mais de um concurso.</p>';
    if (existing.length) body += '<div class="alert mid">' + existing.length + ' atividade(s) gerada(s) automaticamente e ainda não iniciada(s) nesta semana serão substituídas. Atividades manuais, iniciadas ou concluídas são mantidas.</div>';
    body += Object.keys(byDay).sort().map(function (d) {
      var arr = byDay[d], tot = arr.reduce(function (x, a) { return x + a.planMin; }, 0);
      return '<h3 style="margin:14px 0 6px">' + U.DIAS[U.dow(d)] + ', ' + U.fmtShort(d) + ' <small class="muted">· ' + U.fmtMin(tot) + '</small></h3>' + arr.map(function (a) { return '<div class="list-item row" style="padding:5px 0">' + (a.disc ? ui.discTag(a.disc) : '<span class="tag">' + a.metodo + '</span>') + '<span>' + U.esc(a.topicId ? SOS.topicLabel(a.topicId) : a.titulo) + '</span><span class="spacer"></span><small>' + a.metodo + ' · ' + U.fmtMin(a.planMin) + '</small></div>'; }).join('');
    }).join('') || '<div class="empty">Nada a planejar nesta semana (datas passadas ou provas já realizadas).</div>';
    ui.modal({
      title: 'Proposta de plano — semana de ' + U.fmtDate(mon), wide: true, body: body,
      buttons: [{ label: 'Cancelar', cls: 'ghost' }, { label: 'Aprovar e aplicar', cls: 'good', onClick: function () {
        var ids = {}; existing.forEach(function (a) { ids[a.id] = 1; });
        SOS.S.atividades = SOS.S.atividades.filter(function (a) { return !ids[a.id]; }).concat(plan);
        SOS.log('Plano semanal gerado', U.fmtDate(mon) + ' — ' + plan.length + ' atividades'); SOS.save(); SOS.app.render(); ui.toast('Plano aplicado.', 'good');
      } }]
    });
  }

  /* reorganização: propõe novas datas, o usuário aprova item a item */
  function reorg(acts, single) {
    if (!acts.length) { ui.toast('Nenhuma pendência para reorganizar.'); return; }
    var props = E.proposeReschedule(acts);
    var body = '<p class="muted" style="margin-top:0">Novas datas sugeridas considerando: proximidade da prova, importância e peso, incidência, seu desempenho, carga diária (' + U.fmtMin(SOS.S.settings.minDia) + '), limite de ' + SOS.S.settings.maxDisciplinasDia + ' disciplinas/dia e a regra Português × Informática. As tarefas são espalhadas, não acumuladas no dia seguinte. Nada muda sem sua aprovação.</p>' +
      '<div class="tbl-wrap"><table><thead><tr><th></th><th>Atividade</th><th>De</th><th>Para</th></tr></thead><tbody>' +
      props.map(function (p, i) { return '<tr><td><input type="checkbox" name="ok" value="' + i + '" checked></td><td>' + (p.a.disc ? ui.discTag(p.a.disc) + ' ' : '') + U.esc(actTitle(p.a)) + '<br><small class="muted">' + p.a.metodo + ' · ' + U.fmtMin(p.a.planMin) + '</small>' + (p.warn ? '<br><small class="tag mid">' + U.esc(p.warn) + '</small>' : '') + '</td><td class="diff-old">' + U.fmtShort(p.from) + '</td><td><input type="date" name="to' + i + '" value="' + p.to + '"></td></tr>'; }).join('') +
      '</tbody></table></div>';
    ui.modal({
      title: single ? 'Atividade não realizada — sugerir nova data' : 'Reorganizar cronograma', wide: true, body: body,
      buttons: [{ label: 'Cancelar', cls: 'ghost' }, { label: 'Aprovar selecionadas', cls: 'good', onClick: function (c, root) {
        var ok = ui.checked(root, 'ok'); var n = 0;
        ok.forEach(function (i) { var p = props[+i]; var to = ui.val(root, 'to' + i); if (!to) return; p.a.reprogramadaDe = p.a.data; p.a.data = to; p.a.status = 'nao'; n++; });
        SOS.log('Cronograma reorganizado', n + ' atividade(s)'); SOS.save(); SOS.app.render(); ui.toast(n + ' atividade(s) reprogramada(s).', 'good');
      } }]
    });
  }
  SOS.plano = { reorg: reorg, actForm: actForm };
})();
