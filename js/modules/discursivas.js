/* Discursivas: banco de temas, editor com cronômetro e contagem de linhas, correção por critérios do edital, evolução e erros recorrentes. */
(function () {
  var SOS = window.SOS, U = SOS.U, ui = SOS.ui, E = SOS.E;
  var tab = 'painel';
  var timer = null;

  SOS.lineCount = function (txt) {
    var cpl = SOS.S.settings.charsPorLinha || 75;
    return String(txt || '').split('\n').reduce(function (n, p) { return n + Math.max(1, Math.ceil(p.trim().length / cpl)); }, 0) - (String(txt || '').trim() ? 0 : 1);
  };

  SOS.views.discursivas = {
    render: function (el, q) {
      if (q && q.get('nova')) { history.replaceState(null, '', '#discursivas'); setTimeout(function () { editor(null); }, 30); }
      var conc = SOS.app.conc;
      var ds = SOS.S.discursivas.filter(function (d) { return conc === 'all' || d.concursoId === conc; }).sort(function (a, b) { return a.data < b.data ? 1 : -1; });
      var notas = ds.filter(function (d) { return d.nota !== '' && d.nota != null; });
      var media = notas.length ? notas.reduce(function (x, d) { return x + +d.nota; }, 0) / notas.length : null;
      var tempo = ds.filter(function (d) { return d.tempoMin; });
      var h = '<div class="row" style="margin-bottom:14px"><button class="btn" data-act="new">+ Nova discursiva</button><button class="btn ghost" data-act="tema">+ Cadastrar tema</button><span class="spacer"></span><small class="muted">Câmara: 20 a 30 linhas · Conteúdo 80 + Correção formal 20 · mínimo 40 pontos</small></div>';
      h += '<div class="tabs">' + [['painel', 'Painel'], ['temas', 'Temas (' + SOS.S.temas.length + ')'], ['hist', 'Histórico (' + ds.length + ')']].map(function (x) { return '<button class="tab ' + (tab === x[0] ? 'active' : '') + '" data-tab="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>';
      if (tab === 'painel') {
        var dif = {}; ds.forEach(function (d) { (d.dificuldades || []).forEach(function (c) { dif[c] = (dif[c] || 0) + 1; }); });
        var difKeys = Object.keys(dif).sort(function (a, b) { return dif[b] - dif[a]; });
        var recorrentes = {}; ds.forEach(function (d) { (d.errosRec || '').split('\n').map(function (x) { return x.trim(); }).filter(Boolean).forEach(function (x) { var k2 = U.norm(x); recorrentes[k2] = recorrentes[k2] || { txt: x, n: 0 }; recorrentes[k2].n++; }); });
        var recList = Object.keys(recorrentes).map(function (k2) { return recorrentes[k2]; }).sort(function (a, b) { return b.n - a.n; });
        h += '<div class="grid g4">' + k('Discursivas realizadas', ds.filter(function (d) { return (d.texto || '').trim(); }).length) + k('Nota média', media == null ? '—' : (Math.round(media * 10) / 10).toString().replace('.', ','), notas.length + ' corrigidas') + k('Tempo médio', tempo.length ? U.fmtMin(tempo.reduce(function (x, d) { return x + d.tempoMin; }, 0) / tempo.length) : '—') + k('Temas pendentes', SOS.S.temas.filter(function (t) { return !ds.some(function (d) { return d.temaId === t.id; }); }).length) + '</div>';
        var ev = notas.slice().reverse().slice(-12);
        h += '<div class="grid g2 section"><div class="card"><h3>Evolução das notas</h3>' + ui.lineChart([{ name: 'Total', color: '#0891b2', data: ev.map(function (d) { return +d.nota; }) }, { name: 'Conteúdo (de 80)', color: '#4f46e5', data: ev.map(function (d) { return d.notaConteudo === '' || d.notaConteudo == null ? null : +d.notaConteudo; }) }], { labels: ev.map(function (d) { return U.fmtShort(d.data); }), max: 100, refLine: 40 }) + '</div>' +
          '<div class="card"><h3>Dificuldades identificadas</h3>' + (difKeys.length ? ui.hbars(difKeys.map(function (c) { return { label: c, value: dif[c] / dif[difKeys[0]] * 100, text: String(dif[c]), color: 'var(--mid)' }; })) : '<div class="empty">Marque as dificuldades ao corrigir cada texto.</div>') + '</div></div>';
        h += '<div class="card section"><h3>Erros recorrentes → pontos de revisão</h3>' + (recList.length ? recList.map(function (r, i) { return '<div class="list-item row"><span class="tag ' + (r.n > 1 ? 'bad' : '') + '">' + r.n + '×</span><span>' + U.esc(r.txt) + '</span><span class="spacer"></span><button class="btn xs ghost" data-recact="' + i + '">Agendar revisão</button><button class="btn xs ghost" data-reccard="' + i + '">Criar flashcard</button></div>'; }).join('') : '<div class="empty">Liste os erros cometidos (um por linha) no campo “Erros recorrentes” de cada discursiva. Os que se repetem aparecem aqui.</div>') + '</div>';
        SOS.views.discursivas._rec = recList;
      } else if (tab === 'temas') {
        h += SOS.S.temas.length ? '<div class="card">' + SOS.S.temas.map(function (t) {
          var feitas = SOS.S.discursivas.filter(function (d) { return d.temaId === t.id; });
          return '<div class="list-item"><div class="row">' + (t.concursoId ? ui.concTags([t.concursoId]) : '') + (t.topicId ? ui.discTag(SOS.topic(t.topicId) ? SOS.topic(t.topicId).disc : '') : '') + '<b>' + U.esc(t.titulo) + '</b><span class="spacer"></span><small class="muted">' + feitas.length + ' texto(s)</small><button class="btn xs" data-write="' + t.id + '">Escrever</button><button class="btn xs ghost" data-tedit="' + t.id + '">Editar</button><button class="btn xs ghost" data-tdel="' + t.id + '">Excluir</button></div>' + (t.proposta ? '<small class="muted" style="white-space:pre-wrap">' + U.esc(t.proposta) + '</small>' : '') + '</div>';
        }).join('') + '</div>' : '<div class="empty">Cadastre temas possíveis a partir do conteúdo específico (ex.: Lei Orgânica, Regimento Interno, princípios, licitações, controle, processo legislativo).</div>';
      } else {
        h += ds.length ? '<div class="card"><div class="tbl-wrap"><table><thead><tr><th>Data</th><th>Tema</th><th>Concurso</th><th class="num">Linhas</th><th class="num">Tempo</th><th class="num">Conteúdo</th><th class="num">Formal</th><th class="num">Nota</th><th></th></tr></thead><tbody>' + ds.map(function (d) {
          var ln = SOS.lineCount(d.texto);
          return '<tr><td>' + U.fmtDate(d.data) + '</td><td>' + U.esc(d.tema || '—') + '</td><td>' + (d.concursoId ? ui.concTags([d.concursoId]) : '') + '</td><td class="num"><span class="pct ' + (ln < 20 || ln > 30 ? 'bad' : 'good') + '">' + ln + '</span></td><td class="num">' + U.fmtMin(d.tempoMin) + '</td><td class="num">' + (d.notaConteudo !== '' && d.notaConteudo != null ? d.notaConteudo : '—') + '</td><td class="num">' + (d.notaFormal !== '' && d.notaFormal != null ? d.notaFormal : '—') + '</td><td class="num"><b>' + (d.nota !== '' && d.nota != null ? d.nota : '—') + '</b></td><td class="num"><button class="btn xs ghost" data-open="' + d.id + '">Abrir</button> <button class="btn xs ghost" data-del="' + d.id + '">✕</button></td></tr>';
        }).join('') + '</tbody></table></div></div>' : '<div class="empty">Nenhuma discursiva ainda.</div>';
      }
      el.innerHTML = h;
      el.onclick = onClick;
    }
  };
  function k(l, v, s) { return '<div class="card kpi"><div class="l">' + l + '</div><div class="v">' + v + '</div>' + (s ? '<div class="s">' + s + '</div>' : '') + '</div>'; }
  function onClick(e) {
    var x;
    if ((x = e.target.closest('[data-tab]'))) { tab = x.dataset.tab; return SOS.app.render(); }
    if (e.target.closest('[data-act=new]')) return editor(null);
    if (e.target.closest('[data-act=tema]')) return temaForm(null);
    if ((x = e.target.closest('[data-write]'))) return editor(null, x.dataset.write);
    if ((x = e.target.closest('[data-tedit]'))) return temaForm(SOS.S.temas.find(function (t) { return t.id === x.dataset.tedit; }));
    if ((x = e.target.closest('[data-tdel]'))) { var tm = SOS.S.temas.find(function (t) { return t.id === x.dataset.tdel; }); return ui.confirm('Excluir o tema “' + U.esc(tm.titulo) + '”? Os textos já escritos são mantidos.', function () { SOS.S.temas = SOS.S.temas.filter(function (t) { return t.id !== tm.id; }); SOS.save(); SOS.app.render(); }); }
    if ((x = e.target.closest('[data-open]'))) return editor(SOS.S.discursivas.find(function (d) { return d.id === x.dataset.open; }));
    if ((x = e.target.closest('[data-del]'))) { var d = SOS.S.discursivas.find(function (y) { return y.id === x.dataset.del; }); return ui.confirm('Excluir esta discursiva (' + U.fmtDate(d.data) + ')? O texto será perdido.', function () { SOS.S.discursivas = SOS.S.discursivas.filter(function (y) { return y.id !== d.id; }); SOS.log('Discursiva excluída', d.tema); SOS.save(); SOS.app.render(); }); }
    if ((x = e.target.closest('[data-recact]'))) { var r = SOS.views.discursivas._rec[+x.dataset.recact]; SOS.S.atividades.push({ id: U.uid('a'), data: U.addDays(U.today(), 1), topicId: null, disc: null, metodo: 'Discursiva', planMin: 30, titulo: 'Revisar ponto da discursiva: ' + r.txt, tipo: 'discursiva', status: 'nao', obs: '' }); SOS.save(); ui.toast('Revisão agendada para amanhã no Planejamento.', 'good'); return SOS.app.renderNav(); }
    if ((x = e.target.closest('[data-reccard]'))) { var r2 = SOS.views.discursivas._rec[+x.dataset.reccard]; SOS.S.flashcards.push({ id: U.uid('f'), tipo: 'Pergunta objetiva', frente: 'Discursiva — como evitar: ' + r2.txt + '?', verso: '(preencha a regra correta)', explicacao: '', fundamento: '', pegadinha: '', topicId: '', concursos: ['ANA', 'TEC'], banca: 'Selecon', origem: 'Conteúdo importante', erroId: null, tags: 'discursiva', srs: E.cardNew(), log: [], criadoEm: U.today() }); SOS.save(); ui.toast('Flashcard criado — edite o verso em Flashcards › Cartões.', 'good', 5000); }
  }

  function temaForm(t) {
    var isNew = !t;
    t = t || { id: U.uid('tm'), titulo: '', proposta: '', concursoId: 'ANA', topicId: '' };
    ui.modal({
      title: isNew ? 'Novo tema' : 'Editar tema',
      body: '<div class="form"><label class="f full"><span>Tema</span><input name="titulo" value="' + U.esc(t.titulo) + '"></label><label class="f"><span>Concurso</span><select name="c">' + ui.concOptions(t.concursoId) + '</select></label><label class="f"><span>Assunto do edital</span><select name="tp">' + ui.topicOptions(t.topicId, null, true) + '</select></label><label class="f full"><span>Proposta / comando da questão</span><textarea name="proposta" rows="4">' + U.esc(t.proposta) + '</textarea></label></div>',
      buttons: [{ label: 'Cancelar', cls: 'ghost' }, { label: 'Salvar', onClick: function (c, root) {
        var ti = ui.val(root, 'titulo').trim(); if (!ti) { ui.toast('Informe o tema.', 'bad'); return false; }
        t.titulo = ti; t.concursoId = ui.val(root, 'c'); t.topicId = ui.val(root, 'tp'); t.proposta = ui.val(root, 'proposta');
        if (isNew) SOS.S.temas.push(t); SOS.save(); SOS.app.render();
      } }]
    });
  }

  function editor(d, temaId) {
    var isNew = !d, tm = temaId && SOS.S.temas.find(function (t) { return t.id === temaId; });
    d = d || { id: U.uid('d'), data: U.today(), temaId: tm ? tm.id : '', tema: tm ? tm.titulo : '', proposta: tm ? tm.proposta : '', concursoId: tm ? tm.concursoId : 'ANA', topicId: tm ? tm.topicId : '', texto: '', tempoMin: 0, notaConteudo: '', notaFormal: '', nota: '', correcoes: '', dificuldades: [], errosRec: '', avaliacao: {} };
    var elapsed = (d.tempoMin || 0) * 60, running = false, last = 0;
    var body = '<div class="form">' +
      '<label class="f"><span>Tema (do banco)</span><select name="temaId"><option value="">— tema livre —</option>' + ui.opts(SOS.S.temas.map(function (t) { return [t.id, t.titulo]; }), d.temaId) + '</select></label>' +
      '<label class="f"><span>Data</span><input type="date" name="data" value="' + d.data + '"></label>' +
      '<label class="f full"><span>Tema</span><input name="tema" value="' + U.esc(d.tema) + '"></label>' +
      '<label class="f full"><span>Proposta / comando</span><textarea name="proposta" rows="2">' + U.esc(d.proposta) + '</textarea></label>' +
      '<label class="f"><span>Concurso</span><select name="concursoId">' + ui.concOptions(d.concursoId) + '</select></label>' +
      '<label class="f"><span>Assunto do edital</span><select name="topicId">' + ui.topicOptions(d.topicId, null, true) + '</select></label>' +
      '</div><div class="row section"><b style="font-family:var(--f-head)">Texto</b><span class="tag" id="lines">0 linhas</span><span class="spacer"></span><span class="tag" id="clock">00:00:00</span><button class="btn sm" type="button" id="tgl">▶ Iniciar cronômetro</button></div>' +
      '<textarea class="editor" name="texto" spellcheck="true">' + U.esc(d.texto) + '</textarea><small class="muted">Contagem estimada de linhas manuscritas (~' + SOS.S.settings.charsPorLinha + ' caracteres por linha — ajuste em Configurações). Exigido: 20 a 30 linhas; abaixo de 20 a nota é zero.</small>' +
      '<hr><h3>Correção</h3><div class="form">' +
      '<label class="f"><span>Conteúdo (0–80)</span><input type="number" min="0" max="80" step="0.5" name="notaConteudo" value="' + d.notaConteudo + '"></label>' +
      '<label class="f"><span>Correção formal (0–20)</span><input type="number" min="0" max="20" step="0.5" name="notaFormal" value="' + d.notaFormal + '"></label>' +
      '<div class="full" id="totalBox"></div>' +
      '<div class="full"><span style="font-size:13px;font-family:var(--f-head);font-weight:500;color:var(--muted)">Avaliação por categoria (1 = fraco · 5 = excelente) e dificuldades</span><div class="tbl-wrap" style="margin-top:6px"><table><tbody>' + E.CAT_DISC.map(function (c, i) {
        var v = d.avaliacao && d.avaliacao[c] || '';
        return '<tr><td>' + c + '</td><td><select name="av' + i + '">' + ui.opts([['', '—'], [1, '1'], [2, '2'], [3, '3'], [4, '4'], [5, '5']], v) + '</select></td><td><label class="chk"><input type="checkbox" name="dif" value="' + U.esc(c) + '"' + ((d.dificuldades || []).indexOf(c) > -1 ? ' checked' : '') + '> dificuldade</label></td></tr>';
      }).join('') + '</tbody></table></div></div>' +
      '<label class="f full"><span>Correções e observações</span><textarea name="correcoes" rows="3">' + U.esc(d.correcoes) + '</textarea></label>' +
      '<label class="f full"><span>Erros recorrentes (um por linha — viram pontos de revisão)</span><textarea name="errosRec" rows="3" placeholder="Ex.: uso de “onde” sem sentido de lugar&#10;Conclusão sem retomar o comando">' + U.esc(d.errosRec) + '</textarea></label></div>';
    var m = ui.modal({
      title: isNew ? 'Nova discursiva' : 'Discursiva', wide: true, body: body, dismissable: false, noFocus: true,
      onOpen: function (root) {
        var ta = root.querySelector('[name=texto]'), ln = root.querySelector('#lines'), clk = root.querySelector('#clock'), tgl = root.querySelector('#tgl');
        function upd() { var n = SOS.lineCount(ta.value); ln.textContent = n + ' linhas'; ln.className = 'tag ' + (n === 0 ? '' : n < 20 || n > 30 ? 'bad' : 'good'); }
        function tick() { var s = Math.floor(elapsed); clk.textContent = U.pad(Math.floor(s / 3600)) + ':' + U.pad(Math.floor(s / 60) % 60) + ':' + U.pad(s % 60); }
        ta.addEventListener('input', upd); upd(); tick();
        tgl.addEventListener('click', function () {
          running = !running; tgl.textContent = running ? '⏸ Pausar' : '▶ Continuar';
          if (running) { last = Date.now(); timer = setInterval(function () { var n = Date.now(); elapsed += (n - last) / 1000; last = n; tick(); }, 500); } else clearInterval(timer);
        });
        root.querySelector('[name=temaId]').addEventListener('change', function (ev) { var t = SOS.S.temas.find(function (x) { return x.id === ev.target.value; }); if (t) { root.querySelector('[name=tema]').value = t.titulo; root.querySelector('[name=proposta]').value = t.proposta || ''; root.querySelector('[name=concursoId]').value = t.concursoId; root.querySelector('[name=topicId]').value = t.topicId || ''; } });
        function tot() { var a = ui.val(root, 'notaConteudo'), b = ui.val(root, 'notaFormal'); var box = root.querySelector('#totalBox'); if (a === '' && b === '') { box.innerHTML = ''; return; } var s = (+a || 0) + (+b || 0); box.innerHTML = 'Nota total: <span class="pct ' + (s < 40 ? 'bad' : s < 70 ? 'mid' : 'good') + '">' + s + ' / 100</span> ' + (s < 40 ? '<small class="muted">abaixo do mínimo de 40</small>' : ''); }
        ['notaConteudo', 'notaFormal'].forEach(function (n) { root.querySelector('[name=' + n + ']').addEventListener('input', tot); }); tot();
      },
      onClose: function () { clearInterval(timer); },
      buttons: [{ label: 'Fechar sem salvar', cls: 'ghost', onClick: function () { if ((m.root.querySelector('[name=texto]').value || '') !== (d.texto || '')) { if (!window.confirm('Descartar o texto não salvo?')) return false; } } }, { label: 'Salvar', onClick: function (c, root) {
        var a = ui.val(root, 'notaConteudo'), b = ui.val(root, 'notaFormal');
        if (a !== '' && (+a < 0 || +a > 80)) { ui.toast('Conteúdo vai de 0 a 80.', 'bad'); return false; }
        if (b !== '' && (+b < 0 || +b > 20)) { ui.toast('Correção formal vai de 0 a 20.', 'bad'); return false; }
        ['data', 'temaId', 'tema', 'proposta', 'concursoId', 'topicId', 'texto', 'correcoes', 'errosRec'].forEach(function (k2) { d[k2] = ui.val(root, k2); });
        d.notaConteudo = a === '' ? '' : +a; d.notaFormal = b === '' ? '' : +b;
        d.nota = a === '' && b === '' ? '' : (+a || 0) + (+b || 0);
        d.tempoMin = Math.round(elapsed / 60);
        d.dificuldades = ui.checked(root, 'dif');
        d.avaliacao = {}; E.CAT_DISC.forEach(function (cname, i) { var v = ui.val(root, 'av' + i); if (v) d.avaliacao[cname] = +v; });
        d.linhas = SOS.lineCount(d.texto);
        if (isNew) SOS.S.discursivas.push(d);
        SOS.log(isNew ? 'Discursiva registrada' : 'Discursiva editada', d.tema);
        SOS.save(); SOS.app.render(); ui.toast('Discursiva salva.', 'good');
      } }]
    });
  }
})();
