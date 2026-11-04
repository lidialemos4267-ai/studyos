/* Caderno de Erros: cadastro, classificação, status, revisão espaçada, painel, lista/Kanban e integração com flashcards. */
(function () {
  var SOS = window.SOS, U = SOS.U, ui = SOS.ui, E = SOS.E;
  var mode = 'lista', f = { disc: '', topic: '', banca: '', cat: '', status: '', q: '' };

  function filtered() {
    var conc = SOS.app.conc;
    return SOS.S.erros.filter(function (e) {
      var t = SOS.topic(e.topicId);
      if (conc !== 'all' && (e.concursos || []).indexOf(conc) < 0) return false;
      if (f.disc && (!t || t.disc !== f.disc)) return false;
      if (f.topic && e.topicId !== f.topic) return false;
      if (f.banca && (e.banca || '') !== f.banca) return false;
      if (f.cat && (e.categorias || []).indexOf(f.cat) < 0) return false;
      if (f.status && e.status !== f.status) return false;
      if (f.q && U.norm([e.enunciado, e.aprender, e.porque, e.obs].join(' ')).indexOf(U.norm(f.q)) < 0) return false;
      return true;
    }).sort(function (a, b) { return a.data < b.data ? 1 : -1; });
  }

  SOS.views.erros = {
    render: function (el, q) {
      if (q && q.get('hoje')) { history.replaceState(null, '', '#erros'); setTimeout(reviewToday, 30); }
      var all = SOS.S.erros, list = filtered();
      var pend = all.filter(function (e) { return e.status === 'Novo' || e.status === 'Precisa estudar novamente' || e.status === 'Em revisão'; }).length;
      var due = all.filter(E.erroDue).length;
      var rec = all.filter(function (e) { return (e.ocorrencias || 1) > 1; });
      var byTopic = {}, byDisc = {}, byCat = {};
      list.forEach(function (e) { var t = SOS.topic(e.topicId); byTopic[e.topicId] = (byTopic[e.topicId] || 0) + (e.ocorrencias || 1); if (t) byDisc[t.disc] = (byDisc[t.disc] || 0) + (e.ocorrencias || 1); (e.categorias || []).forEach(function (c) { byCat[c] = (byCat[c] || 0) + 1; }); });
      var bancas = []; all.forEach(function (e) { if (e.banca && bancas.indexOf(e.banca) < 0) bancas.push(e.banca); });
      var h = '<div class="row" style="margin-bottom:14px"><button class="btn" data-act="today">Revisar meus erros de hoje <span class="badge soft">' + due + '</span></button><span class="spacer"></span><button class="btn ghost" data-act="new">+ Registrar erro</button></div>';
      h += '<div class="grid g4">' + k('Total de erros', all.length) + k('Pendentes', pend) + k('Corrigidos', all.filter(function (e) { return e.status === 'Corrigido'; }).length) + k('Superados', all.filter(function (e) { return e.status === 'Superado'; }).length) + '</div>';
      h += '<div class="grid g3 section"><div class="card"><h3>Assuntos com mais erros</h3>' + top(byTopic, function (id) { return SOS.topicLabel(id); }) + '</div><div class="card"><h3>Disciplinas com maior dificuldade</h3>' + top(byDisc, function (id) { return SOS.disc(id).nome; }) + '</div><div class="card"><h3>Tipos de erro mais frequentes</h3>' + top(byCat, function (x) { return x; }) + '</div></div>';
      var wk = E.weekly(SOS.app.conc, 8);
      h += '<div class="grid g2 section"><div class="card"><h3>Evolução dos erros registrados</h3>' + ui.barChart(wk.map(function (w) { return w.label; }), wk.map(function (w) { return w.errosCad; }), { color: 'var(--bad)' }) + '</div><div class="card"><h3>Recomendações</h3>' + recs() + '<p class="muted" style="font-size:13px;margin-bottom:0">Erros recorrentes: <b>' + rec.length + '</b>. Cada repetição aumenta a prioridade do assunto no planejamento e nas revisões.</p></div></div>';
      h += '<div class="card section"><div class="row" style="margin-bottom:10px"><input type="search" data-f="q" placeholder="Buscar…" value="' + U.esc(f.q) + '" style="max-width:200px"><select data-f="disc">' + ui.discOptions(f.disc, true) + '</select><select data-f="topic" style="max-width:260px">' + ui.topicOptions(f.topic, SOS.app.conc, true).replace('— selecione o assunto —', 'Todos os assuntos') + '</select><select data-f="banca"><option value="">Todas as bancas</option>' + ui.opts(bancas, f.banca) + '</select><select data-f="cat"><option value="">Todas as categorias</option>' + ui.opts(E.CAT_ERRO, f.cat) + '</select><select data-f="status"><option value="">Todos os status</option>' + ui.opts(E.STATUS_ERRO, f.status) + '</select><span class="spacer"></span><div class="seg"><button data-mode="lista" class="' + (mode === 'lista' ? 'active' : '') + '">Lista</button><button data-mode="kanban" class="' + (mode === 'kanban' ? 'active' : '') + '">Kanban</button></div></div>';
      if (mode === 'lista') {
        h += list.length ? list.map(item).join('') : '<div class="empty">Nenhum erro com esses filtros. Registre erros manualmente ou ao final de uma sessão de questões.</div>';
      } else {
        h += '<div class="kanban k5">' + E.STATUS_ERRO.map(function (s) { var l = list.filter(function (e) { return e.status === s; }); return '<div class="col" data-col="' + s + '"><h4><span>' + s + '</span><span>' + l.length + '</span></h4>' + l.map(kcard).join('') + '</div>'; }).join('') + '</div>';
      }
      h += '</div>';
      el.innerHTML = h;
      el.onclick = onClick; el.onchange = function (e) { var x = e.target.dataset.f; if (x && x !== 'q') { f[x] = e.target.value; SOS.app.render(); } };
      var qs = el.querySelector('[data-f=q]'); qs.addEventListener('input', function () { f.q = qs.value; clearTimeout(qs._t); qs._t = setTimeout(function () { SOS.app.render(); var n = document.querySelector('[data-f=q]'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 300); });
      bindDrag(el);
    },
    openForm: openForm
  };
  function k(l, v) { return '<div class="card kpi"><div class="l">' + l + '</div><div class="v">' + v + '</div></div>'; }
  function top(map, lab) {
    var ks = Object.keys(map).sort(function (a, b) { return map[b] - map[a]; }).slice(0, 5);
    var max = ks.length ? map[ks[0]] : 1;
    return ks.length ? ui.hbars(ks.map(function (x) { return { label: lab(x), value: map[x] / max * 100, text: String(map[x]), color: 'var(--bad)' }; })) : '<div class="empty">Sem dados.</div>';
  }
  function recs() {
    var g = E.globalAdvice();
    var sug = E.suggestCardsFromErrors().length;
    var out = g.map(function (a) { return '<li><b>' + U.esc(a.cat) + '</b> (' + a.n + '): ' + U.esc(a.txt) + '</li>'; });
    var notStudied = SOS.S.erros.filter(function (e) { var t = SOS.topic(e.topicId); return t && t.status === 'nao'; }).length;
    if (notStudied) out.push('<li>' + notStudied + ' erro(s) em assuntos <b>ainda não estudados</b>: faça primeiro o estudo da teoria, não apenas revisão.</li>');
    if (sug) out.push('<li>' + sug + ' erro(s) com sugestão de virar flashcard — veja em <a href="#flashcards?sug=1">Flashcards › Sugestões</a>.</li>');
    return out.length ? '<ul style="margin:0;padding-left:18px">' + out.join('') + '</ul>' : '<div class="empty">Registre erros para receber recomendações.</div>';
  }
  function statusTag(s) { var c = { 'Novo': 'bad', 'Precisa estudar novamente': 'bad', 'Em revisão': 'mid', 'Corrigido': 'good', 'Superado': 'good' }[s]; return '<span class="tag ' + c + '">' + s + '</span>'; }
  function item(e) {
    var t = SOS.topic(e.topicId);
    return '<div class="list-item"><div class="row">' + statusTag(e.status) + (t ? ui.discTag(t.disc) : '') + '<b>' + U.esc(t ? t.titulo : '(sem assunto)') + '</b>' + ((e.ocorrencias || 1) > 1 ? '<span class="tag bad">errei ' + e.ocorrencias + '×</span>' : '') + ((e.flashcardIds || []).length ? '<span class="tag good">' + e.flashcardIds.length + ' flashcard(s)</span>' : '') + (e.origem === 'TEC' ? '<span class="tag">TEC</span>' : '') + (e.qLeiId ? '<span class="tag mid">questão da lei (IA)</span>' : '') + (e.leiRef ? '<span class="tag">' + U.esc(refLei(e.leiRef)) + '</span>' : '') + (!(e.categorias || []).length ? '<span class="tag mid">classificar</span>' : '') + '<span class="spacer"></span><small class="muted">' + U.fmtDate(e.data) + (e.banca ? ' · ' + U.esc(e.banca) : '') + (e.rev && e.rev.next ? ' · revisar ' + U.fmtShort(e.rev.next) : '') + '</small></div>' +
      (e.enunciado ? '<div style="margin:6px 0;white-space:pre-wrap">' + U.esc(e.enunciado.length > 260 ? e.enunciado.slice(0, 257) + '…' : e.enunciado) + '</div>' : '') +
      '<div class="row" style="gap:6px">' + (e.categorias || []).map(function (c) { return '<span class="tag">' + U.esc(c) + '</span>'; }).join('') + '</div>' +
      (e.aprender ? '<small><b>O que preciso aprender:</b> ' + U.esc(e.aprender) + '</small><br>' : '') +
      '<div class="row" style="margin-top:6px;gap:6px"><button class="btn xs ghost" data-open="' + e.id + '">Abrir / editar</button><button class="btn xs ghost" data-repeat="' + e.id + '">Errei de novo</button><button class="btn xs ghost" data-card="' + e.id + '">Transformar em flashcard</button>' + (e.leiRef ? '<button class="btn xs ghost" data-lei="' + e.id + '">Abrir artigo</button>' : '') + '<button class="btn xs ghost" data-del="' + e.id + '">Excluir</button></div></div>';
  }
  function kcard(e) {
    var t = SOS.topic(e.topicId);
    return '<div class="kcard" draggable="true" data-id="' + e.id + '"><div class="k-m">' + (t ? ui.discTag(t.disc) : '') + ((e.ocorrencias || 1) > 1 ? '<span class="tag bad">' + e.ocorrencias + '×</span>' : '') + '</div><div class="k-t">' + U.esc(t ? t.titulo : '—') + '</div><div class="k-m">' + U.fmtShort(e.data) + ' · ' + U.esc((e.categorias || [])[0] || '') + '</div><div class="k-a"><button class="btn xs ghost" data-open="' + e.id + '">Abrir</button></div></div>';
  }
  function bindDrag(el) {
    var id = null;
    el.querySelectorAll('.kcard').forEach(function (c) { c.addEventListener('dragstart', function () { id = c.dataset.id; }); });
    el.querySelectorAll('[data-col]').forEach(function (z) {
      z.addEventListener('dragover', function (e) { e.preventDefault(); z.classList.add('over'); });
      z.addEventListener('dragleave', function () { z.classList.remove('over'); });
      z.addEventListener('drop', function (e) { e.preventDefault(); var er = find(id); if (er && er.status !== z.dataset.col) { er.status = z.dataset.col; if (er.status === 'Superado' && er.rev) er.rev.next = null; SOS.log('Status do erro', er.status); SOS.save(); SOS.app.render(); } });
    });
  }
  function find(id) { return SOS.S.erros.find(function (e) { return e.id === id; }); }
  function refLei(r) { var l = (SOS.S.leis || []).find(function (x) { return x.id === r.leiId; }); return (SOS.lex ? SOS.lex.nomeArt(r.n) : 'Art. ' + r.n) + (l ? ' — ' + l.nome.split(' — ')[0] : ''); }
  function onClick(e) {
    var x;
    if (e.target.closest('[data-act=new]')) return openForm({});
    if (e.target.closest('[data-act=today]')) return reviewToday();
    if ((x = e.target.closest('[data-mode]'))) { mode = x.dataset.mode; return SOS.app.render(); }
    if ((x = e.target.closest('[data-open]'))) return openForm({ erro: find(x.dataset.open) });
    if ((x = e.target.closest('[data-repeat]'))) { var r = find(x.dataset.repeat); E.erroRepeat(r); SOS.log('Erro repetido', SOS.topicLabel(r.topicId)); SOS.save(); ui.toast('Ocorrência registrada. Prioridade do assunto aumentada e revisão reprogramada para amanhã.', 'mid', 4500); return SOS.app.render(); }
    if ((x = e.target.closest('[data-card]'))) return SOS.views.flashcards.fromError(find(x.dataset.card));
    if ((x = e.target.closest('[data-lei]'))) { var el = find(x.dataset.lei); return SOS.leitor.abrirPorId(el.leiRef.leiId, el.leiRef.n); }
    if ((x = e.target.closest('[data-del]'))) { var d = find(x.dataset.del); return ui.confirm('Excluir este erro do Caderno? Os flashcards criados a partir dele são mantidos (perdem apenas o vínculo).', function () { if (d.tecId && SOS.tec) SOS.tec.st().erroIgnorado[d.tecId] = d.ocorrencias || 1; SOS.S.erros = SOS.S.erros.filter(function (y) { return y.id !== d.id; }); SOS.S.flashcards.forEach(function (c) { if (c.erroId === d.id) c.erroId = null; }); SOS.log('Erro excluído', SOS.topicLabel(d.topicId)); SOS.save(); SOS.app.render(); }); }
  }

  /* imagem: redimensiona para economizar espaço no navegador */
  function readImage(file, cb) {
    var r = new FileReader();
    r.onload = function () {
      var img = new Image();
      img.onload = function () {
        var max = 1100, s = Math.min(1, max / Math.max(img.width, img.height));
        var c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        cb(c.toDataURL('image/jpeg', 0.72));
      };
      img.onerror = function () { ui.toast('Imagem inválida.', 'bad'); };
      img.src = r.result;
    };
    r.readAsDataURL(file);
  }

  function openForm(o) {
    var e = o.erro, isNew = !e;
    e = e || { id: U.uid('e'), topicId: o.topicId || '', data: U.today(), banca: 'Selecon', prova: '', enunciado: '', marcada: '', correta: '', justificativa: '', porque: '', aprender: '', obs: '', link: '', imagem: '', categorias: [], status: 'Novo', ocorrencias: 1, flashcardIds: [], sessaoId: o.sessaoId || null };
    var cards = SOS.S.flashcards.filter(function (c) { return c.erroId === e.id; });
    var body = '<div class="form">' +
      '<label class="f full"><span>Assunto</span><select name="topicId">' + ui.topicOptions(e.topicId, null, true) + '</select></label>' +
      '<label class="f"><span>Data</span><input type="date" name="data" value="' + e.data + '"></label>' +
      '<label class="f"><span>Banca</span><input name="banca" value="' + U.esc(e.banca) + '"></label>' +
      '<label class="f full"><span>Prova de origem</span><input name="prova" value="' + U.esc(e.prova) + '" placeholder="Ex.: Selecon 2023 — Câmara de X — Analista"></label>' +
      '<label class="f full"><span>Enunciado da questão</span><textarea name="enunciado" rows="4">' + U.esc(e.enunciado) + '</textarea></label>' +
      '<label class="f"><span>Alternativa escolhida</span><textarea name="marcada" rows="2">' + U.esc(e.marcada) + '</textarea></label>' +
      '<label class="f"><span>Alternativa correta</span><textarea name="correta" rows="2">' + U.esc(e.correta) + '</textarea></label>' +
      '<label class="f full"><span>Justificativa da resposta correta</span><textarea name="justificativa" rows="3">' + U.esc(e.justificativa) + '</textarea></label>' +
      '<label class="f"><span>Por que errei?</span><textarea name="porque" rows="2">' + U.esc(e.porque) + '</textarea></label>' +
      '<label class="f"><span>O que preciso aprender? (um conceito por linha)</span><textarea name="aprender" rows="2">' + U.esc(e.aprender) + '</textarea></label>' +
      '<div class="full"><span style="font-size:13px;font-family:var(--f-head);font-weight:500;color:var(--muted)">Classificação do erro (pode marcar mais de uma)</span><div class="checks" style="margin-top:6px">' + E.CAT_ERRO.map(function (c) { return '<label class="chk"><input type="checkbox" name="cat" value="' + U.esc(c) + '"' + ((e.categorias || []).indexOf(c) > -1 ? ' checked' : '') + '> ' + U.esc(c) + '</label>'; }).join('') + '</div></div>' +
      '<label class="f"><span>Status</span><select name="status">' + ui.opts(E.STATUS_ERRO, e.status) + '</select></label>' +
      '<label class="f"><span>Link da questão</span><input name="link" value="' + U.esc(e.link) + '" placeholder="https://"></label>' +
      '<label class="f full"><span>Imagem da questão</span><input type="file" name="img" accept="image/*">' + (e.imagem ? '<img src="' + e.imagem + '" alt="Imagem da questão" style="max-width:100%;margin-top:6px;border-radius:8px" id="imgPrev"><label class="chk" style="width:max-content;margin-top:4px"><input type="checkbox" name="rmimg"> remover imagem</label>' : '') + '</label>' +
      '<label class="f full"><span>Observações</span><textarea name="obs" rows="2">' + U.esc(e.obs) + '</textarea></label>' +
      '</div>' +
      (e.leiRef ? '<div class="alert info" style="justify-content:space-between"><span>Artigo vinculado: <b>' + U.esc(refLei(e.leiRef)) + '</b></span><button type="button" class="btn xs" data-leiform>Abrir artigo</button></div>' : '') +
      (!isNew ? '<hr><div class="row"><small class="muted">Ocorrências: <b>' + (e.ocorrencias || 1) + '</b> · Próxima revisão: <b>' + (e.rev && e.rev.next ? U.fmtDate(e.rev.next) : '—') + '</b> · Revisões feitas: ' + (e.revisoes || []).length + '</small></div>' + (cards.length ? '<p><small>Flashcards vinculados: ' + cards.map(function (c) { return '“' + U.esc(c.frente.slice(0, 60)) + '” (' + E.cardState(c) + ')'; }).join('; ') + '</small></p>' : '') : '') +
      (E.adviceForTopic(e.topicId).length ? '<div class="alert mid" style="display:block"><b>Sugestões para este assunto</b><ul style="margin:4px 0 0;padding-left:18px">' + E.adviceForTopic(e.topicId).map(function (a) { return '<li>' + U.esc(a.txt) + '</li>'; }).join('') + '</ul></div>' : '');
    var newImg = null, saved = null;
    ui.modal({
      title: isNew ? 'Registrar erro' : 'Erro do Caderno', wide: true, body: body,
      onOpen: function (root) { var lb = root.querySelector('[data-leiform]'); if (lb) lb.addEventListener('click', function () { SOS.leitor.abrirPorId(e.leiRef.leiId, e.leiRef.n); }); root.querySelector('[name=img]').addEventListener('change', function (ev) { var fl = ev.target.files[0]; if (fl) readImage(fl, function (d) { newImg = d; ui.toast('Imagem anexada.', 'good'); }); }); },
      buttons: [{ label: 'Cancelar', cls: 'ghost' }, { label: 'Salvar e criar flashcard', cls: 'ghost', onClick: function (c, root) { if (save(root) === false) return false; var target = saved || e; setTimeout(function () { SOS.views.flashcards.fromError(target); }, 20); } }, { label: 'Salvar', onClick: function (c, root) { return save(root); } }]
    });
    function save(root) {
      var tid = ui.val(root, 'topicId'); if (!tid) { ui.toast('Selecione o assunto do erro.', 'bad'); return false; }
      var cats = ui.checked(root, 'cat'); if (!cats.length) { ui.toast('Classifique o erro em ao menos uma categoria.', 'bad'); return false; }
      ['data', 'banca', 'prova', 'enunciado', 'marcada', 'correta', 'justificativa', 'porque', 'aprender', 'link', 'obs', 'status'].forEach(function (k2) { e[k2] = ui.val(root, k2); });
      e.topicId = tid; e.categorias = cats; e.concursos = (SOS.topic(tid) || { concursos: [] }).concursos.slice();
      if (newImg) e.imagem = newImg; else if (ui.val(root, 'rmimg')) e.imagem = '';
      if (!e.rev) e.rev = E.erroNew(e.data);
      if (e.status === 'Superado') e.rev.next = null;
      if (isNew) {
        // mesmo assunto com erro semelhante já registrado? conta como recorrência
        var dup = SOS.S.erros.find(function (x) { return x.topicId === tid && x.status !== 'Superado' && x.aprender && e.aprender && U.similar(x.aprender, e.aprender) >= 0.6; });
        if (dup) {
          E.erroRepeat(dup);
          if (e.enunciado && e.enunciado !== dup.enunciado) dup.obs = (dup.obs ? dup.obs + '\n' : '') + '[Nova ocorrência em ' + U.fmtDate(e.data) + '] ' + e.enunciado.slice(0, 300);
          SOS.log('Erro recorrente', SOS.topicLabel(tid)); SOS.save(); SOS.app.render();
          saved = dup;
          ui.toast('Você já tinha registrado um erro semelhante neste assunto: ele foi marcado como recorrente (' + dup.ocorrencias + '×), a prioridade do assunto aumentou e a revisão voltou para amanhã. Nenhum registro duplicado foi criado.', 'mid', 8000);
          return;
        }
        SOS.S.erros.push(e);
        var t = SOS.topic(tid); if (t) t.bonusErro = (t.bonusErro || 0) + 0.5;
      }
      SOS.log(isNew ? 'Erro registrado' : 'Erro editado', SOS.topicLabel(tid));
      SOS.save(); SOS.app.render(); ui.toast('Erro salvo no Caderno.', 'good');
    }
  }

  /* "Revisar meus erros de hoje" */
  function reviewToday() {
    var q = SOS.S.erros.filter(E.erroDue).sort(function (a, b) { return (b.ocorrencias || 1) - (a.ocorrencias || 1) || (a.rev.next < b.rev.next ? -1 : 1); });
    if (!q.length) { ui.toast('Nenhum erro para revisar hoje. 🎉', 'good'); return; }
    var i = 0, ok = 0;
    var m = ui.modal({ title: 'Revisar meus erros de hoje', wide: true, body: '<div id="erv"></div>', buttons: [{ label: 'Encerrar', cls: 'ghost' }], onClose: function () { SOS.app.render(); } });
    function show(reveal) {
      var e = q[i], box = m.root.querySelector('#erv');
      if (!e) { box.innerHTML = '<div class="empty"><h2>Revisão concluída</h2>' + ok + ' de ' + q.length + ' acertados agora.</div>'; return; }
      var t = SOS.topic(e.topicId);
      box.innerHTML = '<div class="row"><small class="muted">' + (i + 1) + ' de ' + q.length + '</small>' + (t ? ui.discTag(t.disc) : '') + '<b>' + U.esc(t ? t.titulo : '') + '</b>' + ((e.ocorrencias || 1) > 1 ? '<span class="tag bad">errei ' + e.ocorrencias + '×</span>' : '') + '</div>' +
        '<div class="fc-face" style="margin-top:10px"><div style="white-space:pre-wrap">' + U.esc(e.enunciado || e.aprender || '(sem enunciado)') + '</div>' + (e.imagem ? '<img src="' + e.imagem + '" alt="" style="max-width:100%;margin-top:8px;border-radius:8px">' : '') +
        (reveal ? '<div class="a"><p><b>Você marcou:</b> ' + U.esc(e.marcada || '—') + '</p><p><b>Correta:</b> ' + U.esc(e.correta || '—') + '</p><p style="white-space:pre-wrap"><b>Justificativa:</b> ' + U.esc(e.justificativa || '—') + '</p>' + (e.porque ? '<p><b>Por que errei:</b> ' + U.esc(e.porque) + '</p>' : '') + (e.aprender ? '<p><b>O que aprender:</b> ' + U.esc(e.aprender) + '</p>' : '') + '</div>' : '') + '</div>' +
        (reveal ? '<div class="fc-btns" style="grid-template-columns:1fr 1fr"><button class="btn danger" data-r="0">Errei de novo<small>volta para 1 dia</small></button><button class="btn good" data-r="1">Acertei agora<small>avança o intervalo</small></button></div>' : '<div style="text-align:center;margin-top:14px"><button class="btn" data-show>Mostrar resposta</button></div>');
      box.onclick = function (ev) {
        if (ev.target.closest('[data-show]')) return show(true);
        var r = ev.target.closest('[data-r]'); if (!r) return;
        var good = r.dataset.r === '1'; if (good) ok++;
        E.erroReview(e, good); SOS.log('Revisão de erro', SOS.topicLabel(e.topicId) + (good ? ' — acertou' : ' — errou')); SOS.save();
        i++; show(false);
      };
    }
    show(false);
  }
  SOS.erros = { reviewToday: reviewToday };
})();
