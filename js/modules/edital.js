/* Concursos, Edital verticalizado, Mapa de Conteúdos Compartilhados e detalhes de tópicos. */
(function () {
  var SOS = window.SOS, U = SOS.U, ui = SOS.ui, E = SOS.E;

  function secName(cid, k) { var c = SOS.conc(cid); var s = c && c.secoes.find(function (x) { return x.k === k; }); return s ? s.nome : k; }
  function refsText(t) {
    return t.refs.map(function (r) { var c = SOS.conc(r.c); return (c ? c.sigla : r.c) + ': ' + secName(r.c, r.s).replace(/^Analista Legislativo — /, '') + ' ' + r.l; }).join(' · ');
  }
  SOS.refsText = refsText;

  /* ---------------- Concursos ---------------- */
  SOS.views.concursos = {
    noFilter: true,
    render: function (el) {
      var t = U.today();
      var h = '<div class="row" style="margin-bottom:14px"><p class="muted" style="margin:0">Informações extraídas dos editais oficiais. Datas marcadas como confirmadas constam do cronograma do edital.</p><span class="spacer"></span><button class="btn" data-act="addConc">+ Adicionar concurso</button></div>';
      h += '<div class="grid g3">';
      SOS.S.concursos.forEach(function (c) {
        var p = E.progresso(c.id), d = U.diffDays(t, c.dataProva);
        h += '<div class="card" style="border-top:4px solid ' + c.cor + '"><div class="card-h"><h3>' + U.esc(c.sigla) + '</h3><div class="right"><button class="btn xs ghost" data-edit="' + c.id + '">Editar</button></div></div>' +
          '<b>' + U.esc(c.cargo) + '</b><br><small>' + U.esc(c.orgao) + ' · ' + U.esc(c.banca) + '</small>' +
          '<div class="count" style="margin:12px 0"><div class="days">' + (d >= 0 ? d : '✓') + '<small>DIAS</small></div><div><b>' + U.DIAS[U.dow(c.dataProva)] + ', ' + U.fmtDate(c.dataProva) + '</b> · ' + U.esc(c.turno || '') + '<br>' + (c.dataConfirmada ? '<span class="tag good">confirmada no edital</span>' : '<span class="tag mid">pendente de confirmação</span>') + '</div></div>' +
          '<div class="prog"><i style="width:' + p.pct + '%;background:' + c.cor + '"></i></div><small class="muted">' + p.finalizados + '/' + p.total + ' tópicos finalizados</small>' +
          '<hr><table><tbody>' +
          row('Escolaridade', c.escolaridade) + row('Remuneração', c.remuneracao) + row('Jornada', c.jornada) + row('Vagas', c.vagas) + row('Duração', c.duracao) + row('Edital', c.edital) +
          '</tbody></table><hr><h3>Etapas</h3><ul style="margin:0 0 10px;padding-left:18px">' + (c.etapas || []).map(function (e) { return '<li>' + U.esc(e) + '</li>'; }).join('') + '</ul>' +
          '<h3>Prova objetiva — ' + c.totalQuestoes + ' questões · ' + c.totalPontos + ' pontos</h3><div class="tbl-wrap"><table><thead><tr><th>Área</th><th class="num">Q.</th><th class="num">Pts/q.</th><th class="num">Total</th></tr></thead><tbody>' +
          Object.keys(c.areas).map(function (k) { var a = c.areas[k]; var discs = c.secoes.filter(function (s) { return s.area === k; }).map(function (s) { return s.nome; }); return '<tr><td><b>' + U.esc(a.nome) + '</b>' + (discs.length > 1 ? '<br><small class="muted">' + U.esc(discs.join('; ')) + '</small>' : '') + '</td><td class="num">' + a.q + '</td><td class="num">' + String(a.v).replace('.', ',') + '</td><td class="num">' + String(Math.round(a.q * a.v * 100) / 100).replace('.', ',') + '</td></tr>'; }).join('') +
          '</tbody></table></div><small class="muted">Questões por disciplina: ' + U.esc(c.questoesPorDisciplina || '—') + '</small>' +
          '<h3 style="margin-top:12px">Aprovação</h3><ul style="margin:0;padding-left:18px">' + (c.aprovacao || []).map(function (e) { return '<li>' + U.esc(e) + '</li>'; }).join('') + '</ul>' +
          (c.discursiva && c.discursiva.existe ? '<h3 style="margin-top:12px">Discursiva — ' + c.discursiva.pontos + ' pts · ' + c.discursiva.linhas + ' linhas</h3><p style="margin:0 0 6px">' + U.esc(c.discursiva.tema) + '</p><ul style="margin:0;padding-left:18px">' + c.discursiva.criterios.map(function (k) { return '<li><b>' + k.nome + ' (' + k.max + ')</b>: ' + U.esc(k.desc) + '</li>'; }).join('') + '</ul><small class="muted">Nota zero: ' + U.esc(c.discursiva.zero) + '</small>' : '<p class="muted">Sem prova discursiva.</p>') +
          '<h3 style="margin-top:12px">Títulos</h3><p style="margin:0">' + U.esc(c.titulos || '—') + '</p>' +
          '<h3 style="margin-top:12px">Desempate</h3><ol style="margin:0;padding-left:18px">' + (c.desempate || []).map(function (e) { return '<li>' + U.esc(e) + '</li>'; }).join('') + '</ol>' +
          '</div>';
      });
      h += '</div>';
      el.innerHTML = h;
      el.onclick = function (e) {
        if (e.target.closest('[data-act=addConc]')) return concForm(null);
        var ed = e.target.closest('[data-edit]'); if (ed) concForm(SOS.conc(ed.dataset.edit));
      };
    }
  };
  function row(l, v) { return '<tr><td class="muted" style="width:38%">' + l + '</td><td>' + U.esc(v || '—') + '</td></tr>'; }

  function concForm(c) {
    var isNew = !c;
    c = c || { id: '', sigla: '', orgao: '', cargo: '', banca: '', dataProva: U.addDays(U.today(), 60), dataConfirmada: false, turno: '', cor: '#16a34a', areas: {}, secoes: [], etapas: [], aprovacao: [], desempate: [], discursiva: { existe: false }, minimos: { total: 50, porArea: 0 }, totalQuestoes: 0, totalPontos: 0 };
    var areasTxt = Object.keys(c.areas).map(function (k) { var a = c.areas[k]; return a.nome + ';' + a.q + ';' + a.v; }).join('\n');
    var body = '<div class="form">' +
      '<label class="f"><span>Nome curto (aparece nos filtros)</span><input name="sigla" value="' + U.esc(c.sigla) + '" placeholder="Ex.: TJMT · Analista"></label>' +
      '<label class="f"><span>Cor</span><input type="color" name="cor" value="' + c.cor + '"></label>' +
      '<label class="f"><span>Órgão</span><input name="orgao" value="' + U.esc(c.orgao) + '"></label>' +
      '<label class="f"><span>Cargo</span><input name="cargo" value="' + U.esc(c.cargo) + '"></label>' +
      '<label class="f"><span>Banca</span><input name="banca" value="' + U.esc(c.banca) + '"></label>' +
      '<label class="f"><span>Data da prova</span><input type="date" name="dataProva" value="' + c.dataProva + '"></label>' +
      '<label class="f"><span>Turno</span><input name="turno" value="' + U.esc(c.turno || '') + '"></label>' +
      '<label class="chk" style="align-self:end;width:max-content"><input type="checkbox" name="conf"' + (c.dataConfirmada ? ' checked' : '') + '> Data confirmada no edital</label>' +
      '<label class="f"><span>Pontuação mínima total</span><input type="number" step="0.5" name="min" value="' + c.minimos.total + '"></label>' +
      '<label class="chk" style="align-self:end;width:max-content"><input type="checkbox" name="zero"' + (c.minimos.porArea ? ' checked' : '') + '> Elimina quem zerar uma área</label>' +
      (isNew ? '<label class="f full"><span>Áreas/disciplinas da prova — uma por linha: Nome;questões;pontos por questão</span><textarea name="areas" rows="5" placeholder="Língua Portuguesa;10;1\nConhecimentos Específicos;30;2">' + U.esc(areasTxt) + '</textarea></label>' : '<p class="full muted">A estrutura da prova deste concurso vem do edital e não é editável aqui (evita quebrar os vínculos dos tópicos).</p>') +
      '<label class="chk full" style="width:max-content"><input type="checkbox" name="disc"' + (c.discursiva && c.discursiva.existe ? ' checked' : '') + '> Possui prova discursiva</label>' +
      '</div>';
    ui.modal({
      title: isNew ? 'Adicionar concurso' : 'Editar ' + c.sigla, body: body,
      buttons: [isNew ? null : { label: 'Excluir concurso', cls: 'danger', onClick: function () { delConc(c); } }, { label: 'Cancelar', cls: 'ghost' }, {
        label: 'Salvar', onClick: function (close, root) {
          var sigla = ui.val(root, 'sigla').trim(); if (!sigla) { ui.toast('Informe o nome curto.', 'bad'); return false; }
          ['sigla', 'orgao', 'cargo', 'banca', 'dataProva', 'turno', 'cor'].forEach(function (k) { c[k] = ui.val(root, k); });
          c.dataConfirmada = ui.val(root, 'conf');
          c.minimos = { total: +ui.val(root, 'min') || 0, porArea: ui.val(root, 'zero') ? 0.0001 : 0 };
          if (!c.discursiva || !c.discursiva.criterios) c.discursiva = { existe: false };
          c.discursiva.existe = ui.val(root, 'disc');
          if (c.discursiva.existe && !c.discursiva.criterios) c.discursiva = { existe: true, pontos: 100, linhas: '—', tema: '—', criterios: [{ nome: 'Conteúdo', max: 80, desc: '' }, { nome: 'Correção formal', max: 20, desc: '' }], zero: '—' };
          if (isNew) {
            c.id = 'C' + Date.now().toString(36).toUpperCase().slice(-4);
            c.grupo = c.id; c.prioridade = SOS.S.concursos.length + 1;
            var lines = (ui.val(root, 'areas') || '').split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
            if (!lines.length) { ui.toast('Informe ao menos uma área da prova.', 'bad'); return false; }
            c.areas = {}; c.secoes = []; c.totalQuestoes = 0; c.totalPontos = 0;
            lines.forEach(function (l, i) {
              var p = l.split(';'); var k = 'S' + (i + 1);
              var q = parseInt(p[1], 10) || 0, v = parseFloat(String(p[2] || '1').replace(',', '.')) || 1;
              c.areas[k] = { nome: p[0].trim(), q: q, v: v };
              c.secoes.push({ k: k, nome: p[0].trim(), area: k, imp: 3 });
              c.totalQuestoes += q; c.totalPontos += q * v;
            });
            c.etapas = ['Prova objetiva']; c.aprovacao = ['Mínimo de ' + c.minimos.total + ' pontos'];
            SOS.S.concursos.push(c);
            SOS.S.settings.fase.antes[c.id] = 10; SOS.S.settings.fase.depois[c.id] = 20;
            SOS.log('Concurso adicionado', c.sigla);
            ui.toast('Concurso criado. Agora adicione os tópicos no Edital verticalizado.', 'good', 5000);
          } else SOS.log('Concurso editado', c.sigla);
          SOS.save(); SOS.app.render();
        }
      }].filter(Boolean)
    });
  }
  function delConc(c) {
    var excl = SOS.S.topicos.filter(function (t) { return t.concursos.length === 1 && t.concursos[0] === c.id; }).length;
    ui.confirm('Excluir <b>' + U.esc(c.sigla) + '</b>? ' + excl + ' tópicos exclusivos deste concurso também serão excluídos. Tópicos compartilhados permanecem nos outros concursos. Registros de estudo são mantidos.', function () {
      SOS.S.topicos = SOS.S.topicos.filter(function (t) {
        t.refs = t.refs.filter(function (r) { return r.c !== c.id; });
        t.concursos = t.concursos.filter(function (x) { return x !== c.id; });
        return t.concursos.length > 0;
      });
      SOS.S.concursos = SOS.S.concursos.filter(function (x) { return x.id !== c.id; });
      if (SOS.app.conc === c.id) SOS.app.conc = 'all';
      SOS.log('Concurso excluído', c.sigla); SOS.save(); SOS.app.render();
    });
  }

  /* ---------------- Edital verticalizado ---------------- */
  var tab = 'vert', fStatus = '', fSearch = '', collapsed = {};
  SOS.views.edital = {
    render: function (el, q) {
      if (q && q.get('t')) { var tid = q.get('t'); setTimeout(function () { SOS.views.edital.openTopic(tid); }, 30); history.replaceState(null, '', '#edital'); }
      var conc = SOS.app.conc;
      var h = '<div class="tabs"><button class="tab ' + (tab === 'vert' ? 'active' : '') + '" data-tab="vert">Edital verticalizado</button><button class="tab ' + (tab === 'mapa' ? 'active' : '') + '" data-tab="mapa">Mapa de Conteúdos Compartilhados</button></div>';
      if (tab === 'mapa') h += mapaComp();
      else {
        h += '<div class="row" style="margin-bottom:12px"><input type="search" data-f="q" placeholder="Buscar tópico…" value="' + U.esc(fSearch) + '" style="max-width:260px"><select data-f="status"><option value="">Todos os status</option>' + ui.opts(Object.keys(E.STATUS).map(function (k) { return [k, E.STATUS[k]]; }), fStatus) + '</select><span class="spacer"></span><button class="btn ghost sm" data-act="bulk">+ Adicionar em lote</button><button class="btn sm" data-act="add">+ Novo tópico</button></div>';
        if (conc === 'all') h += '<div class="alert info">Visão consolidada por disciplina: cada tópico aparece uma única vez, mesmo quando pertence a mais de um concurso. Selecione um concurso no topo para ver o edital na ordem original.</div>' + consolidated();
        else h += perConc(conc);
      }
      el.innerHTML = h;
      el.onclick = onClick; el.onchange = onChange;
      var qs = el.querySelector('[data-f=q]');
      if (qs) qs.addEventListener('input', function () { fSearch = qs.value; clearTimeout(qs._t); qs._t = setTimeout(function () { SOS.app.render(); var n = document.querySelector('[data-f=q]'); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }, 250); });
    },
    openTopic: openTopic, topicForm: topicForm
  };
  function match(t) {
    if (fStatus && t.status !== fStatus) return false;
    if (fSearch && U.norm(t.titulo).indexOf(U.norm(fSearch)) < 0) return false;
    return true;
  }
  function topicRow(t, refLabel) {
    var st = E.topicStats(t.id);
    return '<div class="topic-row imp' + t.imp + '"><span class="ref">' + U.esc(refLabel) + '</span><div><div class="t">' + U.esc(t.titulo) + '</div><div class="meta">' + ui.shareTag(t) + ' ' + ui.impTag(t.imp) + ' ' + ui.incTag(t) + (st.total ? ' ' + ui.pctBadge(st.pct) + ' <small class="muted">' + st.total + ' q.</small>' : '') + (st.min ? ' <small class="muted">' + U.fmtMin(st.min) + '</small>' : '') + (t.rev && t.rev.next ? ' <small class="muted">próx. rev. ' + U.fmtShort(t.rev.next) + '</small>' : '') + '</div></div>' +
      '<div class="act"><select data-status="' + t.id + '" aria-label="Status">' + ui.opts(Object.keys(E.STATUS).map(function (k) { return [k, E.STATUS[k]]; }), t.status) + '</select><button class="btn xs ghost" data-open="' + t.id + '">Detalhes</button></div></div>';
  }
  function perConc(cid) {
    var c = SOS.conc(cid); if (!c) return '';
    var h = '';
    c.secoes.forEach(function (s) {
      var items = [];
      SOS.S.topicos.forEach(function (t) { t.refs.forEach(function (r) { if (r.c === cid && r.s === s.k) items.push({ t: t, r: r }); }); });
      items.sort(function (a, b) { return a.r.o - b.r.o || a.t.seedOrder - b.t.seedOrder; });
      var all = items.length, fin = items.filter(function (x) { return x.t.status === 'finalizado'; }).length;
      items = items.filter(function (x) { return match(x.t); });
      var a = c.areas[s.area];
      var key = cid + s.k;
      h += '<div class="disc-block card flat" style="padding:0"><div class="disc-head" data-coll="' + key + '"><h3>' + U.esc(s.nome) + '</h3><small class="muted">' + U.esc(a ? a.nome + ' · ' + a.q + ' q. × ' + String(a.v).replace('.', ',') + ' pt' : '') + '</small><div class="right">' + ui.impTag(s.imp) + '<small>' + fin + '/' + all + '</small><div class="prog thin" style="width:80px"><i style="width:' + (all ? fin / all * 100 : 0) + '%"></i></div><span>' + (collapsed[key] ? '▸' : '▾') + '</span></div></div>' +
        (collapsed[key] ? '' : (items.length ? items.map(function (x) { return topicRow(x.t, x.r.l); }).join('') : '<div class="empty">Nenhum tópico corresponde ao filtro.</div>')) + '</div>';
    });
    return h;
  }
  function consolidated() {
    var h = '';
    SOS.S.disciplinas.forEach(function (d) {
      var ts = SOS.S.topicos.filter(function (t) { return t.disc === d.id; });
      if (!ts.length) return;
      var fin = ts.filter(function (t) { return t.status === 'finalizado'; }).length, all = ts.length;
      ts = ts.filter(match);
      var key = 'D' + d.id;
      h += '<div class="disc-block card flat" style="padding:0"><div class="disc-head" data-coll="' + key + '"><span class="dot" style="background:' + d.cor + '"></span><h3>' + U.esc(d.nome) + '</h3><div class="right"><small>' + fin + '/' + all + '</small><div class="prog thin" style="width:80px"><i style="width:' + (fin / all * 100) + '%;background:' + d.cor + '"></i></div><span>' + (collapsed[key] ? '▸' : '▾') + '</span></div></div>' +
        (collapsed[key] ? '' : ts.map(function (t) { return topicRow(t, t.concursos.map(function (c) { return c.charAt(0); }).join('')); }).join('') || '<div class="empty">Nenhum tópico corresponde ao filtro.</div>') + '</div>';
    });
    return h;
  }
  function mapaComp() {
    var groups = { comum: [], parcial: [], camara: [], chapada: [] };
    SOS.S.topicos.forEach(function (t) {
      var hasC = t.concursos.some(function (c) { return c === 'ANA' || c === 'TEC'; }), hasO = t.concursos.indexOf('OUV') > -1;
      if (hasC && hasO) groups[t.parcial ? 'parcial' : 'comum'].push(t); else if (hasO) groups.chapada.push(t); else groups.camara.push(t);
    });
    var both = SOS.S.topicos.filter(function (t) { return t.concursos.indexOf('ANA') > -1 && t.concursos.indexOf('TEC') > -1; }).length;
    var meta = [['comum', '🟢 Estudar uma vez — vale para Câmara e Chapada'], ['parcial', '🟡 Base comum, com profundidade ou recorte diferente'], ['camara', '🔵 Exclusivo da Câmara (Analista e/ou Técnico)'], ['chapada', '🟣 Exclusivo de Chapada (Ouvidor)']];
    var h = '<div class="grid g4">' + meta.map(function (m) { return '<div class="card kpi"><div class="l">' + m[1] + '</div><div class="v">' + groups[m[0]].length + '</div><div class="s">tópicos</div></div>'; }).join('') + '</div>';
    h += '<div class="alert info section">Dentro da Câmara, <b>' + both + '</b> tópicos valem tanto para Analista quanto para Técnico. Cada tópico existe uma única vez: estudos, erros e flashcards dele contam para todos os concursos a que pertence.</div>';
    h += '<div class="card section"><h3>Disciplinas que exigem maior dedicação (pelo edital)</h3><div class="tbl-wrap"><table><thead><tr><th>Concurso</th><th>Área</th><th class="num">Q.</th><th class="num">Pts</th><th class="num">% da objetiva</th></tr></thead><tbody>' +
      SOS.S.concursos.map(function (c) { return Object.keys(c.areas).map(function (k) { var a = c.areas[k], p = a.q * a.v; return '<tr><td>' + U.esc(c.sigla) + '</td><td>' + U.esc(a.nome) + '</td><td class="num">' + a.q + '</td><td class="num">' + String(p).replace('.', ',') + '</td><td class="num"><b>' + Math.round(p / c.totalPontos * 100) + '%</b></td></tr>'; }).join(''); }).join('') + '</tbody></table></div></div>';
    meta.forEach(function (m) {
      var ts = groups[m[0]];
      h += '<div class="card section"><h3>' + m[1] + ' (' + ts.length + ')</h3>' + ts.map(function (t) {
        return '<div class="list-item"><div class="row">' + ui.discTag(t.disc) + '<span>' + U.esc(t.titulo) + '</span><span class="spacer"></span><button class="btn xs ghost" data-open="' + t.id + '">Detalhes</button></div><small class="muted">' + U.esc(refsText(t)) + '</small>' + (t.nota ? '<br><small><b>Diferença:</b> ' + U.esc(t.nota) + '</small>' : '') + '</div>';
      }).join('') + '</div>';
    });
    return h;
  }
  function onClick(e) {
    var x;
    if ((x = e.target.closest('[data-tab]'))) { tab = x.dataset.tab; return SOS.app.render(); }
    if ((x = e.target.closest('[data-coll]'))) { collapsed[x.dataset.coll] = !collapsed[x.dataset.coll]; return SOS.app.render(); }
    if ((x = e.target.closest('[data-open]'))) return openTopic(x.dataset.open);
    if (e.target.closest('[data-act=add]')) return topicForm(null);
    if (e.target.closest('[data-act=bulk]')) return bulkForm();
  }
  function onChange(e) {
    var x = e.target;
    if (x.dataset.status) {
      var t = SOS.topic(x.dataset.status); var old = t.status; t.status = x.value;
      if (old === 'nao' && t.status !== 'nao' && !t.primeiroEstudo) t.primeiroEstudo = U.today();
      if (t.status === 'finalizado') t.finalizadoEm = U.today();
      if (t.status === 'finalizado' && !t.rev) t.rev = { step: 0, next: U.addDays(U.today(), SOS.S.settings.intervalosTopico[0]) };
      SOS.log('Status do tópico', t.titulo + ': ' + E.STATUS[old] + ' → ' + E.STATUS[t.status]);
      SOS.save(); ui.toast('Status atualizado: ' + E.STATUS[t.status], 'good'); SOS.app.renderNav();
      return;
    }
    if (x.dataset.f === 'status') { fStatus = x.value; SOS.app.render(); }
  }

  function openTopic(id) {
    var t = SOS.topic(id); if (!t) return;
    var st = E.topicStats(id), dom = E.dominio(t, st), adv = E.adviceForTopic(id);
    var errs = SOS.S.erros.filter(function (e) { return e.topicId === id; });
    var cards = SOS.S.flashcards.filter(function (c) { return c.topicId === id; });
    var body = '<div class="row" style="margin-bottom:8px">' + ui.discTag(t.disc) + ui.concTags(t.concursos) + ui.shareTag(t) + ui.domTag(dom) + '</div>' +
      '<p style="margin:0 0 4px"><small class="muted">' + U.esc(refsText(t)) + '</small></p>' + (t.nota ? '<p style="margin:0"><small><b>Diferença entre editais:</b> ' + U.esc(t.nota) + '</small></p>' : '') +
      '<div class="grid g4" style="margin:14px 0">' + [['Questões', st.total], ['Acertos', st.acertos], ['Erros', st.erros], ['Aproveitamento', ui.pctBadge(st.pct) + ' ' + ui.trendIcon(st.trend)]].map(function (k) { return '<div class="card flat kpi"><div class="l">' + k[0] + '</div><div class="v" style="font-size:20px">' + k[1] + '</div></div>'; }).join('') + '</div>' +
      '<div class="form">' +
      '<label class="f full"><span>Tópico</span><textarea name="titulo" rows="2">' + U.esc(t.titulo) + '</textarea></label>' +
      '<label class="f"><span>Status</span><select name="status">' + ui.opts(Object.keys(E.STATUS).map(function (k) { return [k, E.STATUS[k]]; }), t.status) + '</select></label>' +
      '<label class="f"><span>Nível de domínio</span><select name="dom">' + ui.opts([['', 'Automático (' + E.DOM[E.dominio(Object.assign({}, t, { dominioManual: null }), st)] + ')'], ['alto', E.DOM.alto], ['medio', E.DOM.medio], ['baixo', E.DOM.baixo], ['nao', E.DOM.nao]], t.dominioManual || '') + '</select></label>' +
      '<label class="f"><span>Grau de importância</span><select name="imp">' + ui.opts([[4, 'Muito alta'], [3, 'Alta'], [2, 'Média'], [1, 'Baixa']], t.imp) + '</select></label>' +
      '<label class="f"><span>Incidência estimada na banca</span><select name="inc">' + ui.opts([['alta', 'Alta'], ['media', 'Média'], ['baixa', 'Baixa'], ['sd', 'Sem dados suficientes para estimar']], t.inc) + '</select></label>' +
      '<label class="f full"><span>Justificativa da incidência (é uma estimativa, não garantia de cobrança)</span><input name="incJust" value="' + U.esc(t.incJust || '') + '"></label>' +
      '<label class="f"><span>Disciplina</span><select name="disc">' + ui.discOptions(t.disc) + '</select></label>' +
      '<label class="f"><span>Tempo investido</span><input disabled value="' + U.fmtMin(st.min) + '"></label>' +
      '<label class="f"><span>Data do primeiro estudo</span><input type="date" name="pe" value="' + (t.primeiroEstudo || '') + '"></label>' +
      '<label class="f"><span>Última revisão</span><input type="date" name="ur" value="' + (t.ultimaRevisao || '') + '"></label>' +
      '<label class="f"><span>Próxima revisão</span><input type="date" name="pr" value="' + (t.rev && t.rev.next || '') + '"></label>' +
      '<label class="f"><span>Erros no Caderno / flashcards</span><input disabled value="' + errs.length + ' erros (' + st.recorrentes + ' recorrentes) · ' + cards.length + ' cartões"></label>' +
      '<label class="f full"><span>Observações</span><textarea name="obs" rows="2">' + U.esc(t.obs || '') + '</textarea></label>' +
      '</div>' +
      (adv.length ? '<div class="alert mid section" style="display:block"><b>Sugestões do Caderno de Erros</b><ul style="margin:6px 0 0;padding-left:18px">' + adv.map(function (a) { return '<li>' + U.esc(a.txt) + '</li>'; }).join('') + '</ul></div>' : '') +
      (st.sessoes.length ? '<h3 class="section">Histórico de estudo</h3><div class="tbl-wrap"><table><thead><tr><th>Data</th><th>Método</th><th class="num">Tempo</th><th class="num">Q.</th><th class="num">%</th></tr></thead><tbody>' + st.sessoes.slice().reverse().map(function (s) { return '<tr><td>' + U.fmtDate(s.data) + '</td><td>' + s.metodo + '</td><td class="num">' + U.fmtMin(s.realizadoMin) + '</td><td class="num">' + (s.total || 0) + '</td><td class="num">' + (s.total ? ui.pctBadge(U.pct(s.acertos, s.total)) : '—') + '</td></tr>'; }).join('') + '</tbody></table></div>' : '');
    ui.modal({
      title: 'Tópico do edital', wide: true, body: body,
      buttons: [
        { label: 'Excluir', cls: 'danger', onClick: function () { ui.confirm('Excluir este tópico do edital? Registros de estudo, erros e flashcards vinculados serão mantidos, mas ficarão sem assunto.', function () { SOS.S.topicos = SOS.S.topicos.filter(function (x) { return x.id !== id; }); SOS.log('Tópico excluído', t.titulo); SOS.save(); SOS.app.render(); }); } },
        { label: 'Vínculos com editais', cls: 'ghost', onClick: function () { setTimeout(function () { topicForm(t); }, 10); } },
        { label: 'Registrar estudo', cls: 'ghost', onClick: function () { setTimeout(function () { ui.sessionModal({ topicId: id }); }, 10); } },
        { label: 'Salvar', onClick: function (close, root) {
          var tit = ui.val(root, 'titulo').trim(); if (!tit) { ui.toast('O título não pode ficar vazio.', 'bad'); return false; }
          t.titulo = tit; t.status = ui.val(root, 'status'); t.dominioManual = ui.val(root, 'dom') || null;
          t.imp = +ui.val(root, 'imp'); t.impManual = t.imp; t.inc = ui.val(root, 'inc'); t.incJust = ui.val(root, 'incJust'); t.disc = ui.val(root, 'disc');
          t.primeiroEstudo = ui.val(root, 'pe') || null; t.ultimaRevisao = ui.val(root, 'ur') || null;
          var pr = ui.val(root, 'pr'); if (pr) { t.rev = t.rev || { step: 0 }; t.rev.next = pr; } else if (t.rev) t.rev.next = null;
          t.obs = ui.val(root, 'obs');
          SOS.log('Tópico editado', t.titulo); SOS.save(); SOS.app.render(); ui.toast('Tópico salvo.', 'good');
        } }
      ]
    });
  }

  /* criar/editar vínculos: concurso + seção + item */
  function topicForm(t) {
    var isNew = !t;
    t = t || { id: U.uid('t'), disc: SOS.S.disciplinas[0].id, titulo: '', refs: [], concursos: [], parcial: false, nota: '', imp: 3, inc: 'sd', incJust: 'Sem dados suficientes.', status: 'nao', rev: null, bonusErro: 0, obs: '', seedOrder: 9000 + SOS.S.topicos.length, custom: true };
    function refRows() {
      return SOS.S.concursos.map(function (c) {
        var mine = t.refs.filter(function (r) { return r.c === c.id; });
        var r = mine[0] || {};
        return '<div class="row" style="margin-bottom:6px"><label class="chk" style="min-width:170px"><input type="checkbox" name="rc_' + c.id + '"' + (mine.length ? ' checked' : '') + '> ' + U.esc(c.sigla) + '</label><select name="rs_' + c.id + '">' + ui.opts(c.secoes.map(function (s) { return [s.k, s.nome]; }), r.s) + '</select><input name="rl_' + c.id + '" placeholder="item (ex.: 4.3)" value="' + U.esc(r.l || '') + '" style="max-width:120px">' + (mine.length > 1 ? '<small class="muted">+' + (mine.length - 1) + ' outro(s) vínculo(s) mantido(s)</small>' : '') + '</div>';
      }).join('');
    }
    var body = '<div class="form"><label class="f full"><span>Título do tópico (use o texto do edital)</span><textarea name="titulo" rows="2">' + U.esc(t.titulo) + '</textarea></label>' +
      '<label class="f"><span>Disciplina</span><select name="disc">' + ui.discOptions(t.disc) + '</select></label>' +
      '<label class="f"><span>Importância</span><select name="imp">' + ui.opts([[4, 'Muito alta'], [3, 'Alta'], [2, 'Média'], [1, 'Baixa']], t.imp) + '</select></label>' +
      '<div class="full"><span class="label" style="font-size:13px;font-weight:500">Concursos e posição no edital</span><p class="muted" style="margin:2px 0 8px;font-size:13px">Marque todos os concursos em que este conteúdo aparece — o tópico será compartilhado, sem duplicar.</p>' + refRows() + '</div>' +
      '<label class="chk full" style="width:max-content"><input type="checkbox" name="parcial"' + (t.parcial ? ' checked' : '') + '> Conteúdo comum, mas com abordagem diferente entre os editais</label>' +
      '<label class="f full"><span>Nota sobre a diferença</span><input name="nota" value="' + U.esc(t.nota || '') + '"></label></div>';
    ui.modal({
      title: isNew ? 'Novo tópico' : 'Vínculos do tópico', wide: true, body: body,
      buttons: [{ label: 'Cancelar', cls: 'ghost' }, { label: 'Salvar', onClick: function (close, root) {
        var tit = ui.val(root, 'titulo').trim(); if (!tit) { ui.toast('Informe o título.', 'bad'); return false; }
        var refs = [];
        SOS.S.concursos.forEach(function (c) {
          if (!ui.val(root, 'rc_' + c.id)) return;
          var s = ui.val(root, 'rs_' + c.id), l = ui.val(root, 'rl_' + c.id).trim() || '+';
          var others = t.refs.filter(function (r) { return r.c === c.id; }).slice(1);
          refs.push({ c: c.id, s: s, o: parseFloat(l) || 999, l: l });
          refs = refs.concat(others);
        });
        if (!refs.length) { ui.toast('Marque ao menos um concurso.', 'bad'); return false; }
        t.titulo = tit; t.disc = ui.val(root, 'disc'); t.imp = +ui.val(root, 'imp'); t.impManual = t.imp; t.refs = refs;
        t.concursos = []; refs.forEach(function (r) { if (t.concursos.indexOf(r.c) < 0) t.concursos.push(r.c); });
        t.parcial = ui.val(root, 'parcial'); t.nota = ui.val(root, 'nota');
        if (isNew) SOS.S.topicos.push(t);
        SOS.log(isNew ? 'Tópico criado' : 'Vínculos alterados', t.titulo); SOS.save(); SOS.app.render(); ui.toast('Tópico salvo.', 'good');
      } }]
    });
  }
  function bulkForm() {
    var body = '<div class="form"><label class="f"><span>Concurso</span><select name="c">' + ui.concOptions(SOS.app.conc !== 'all' ? SOS.app.conc : SOS.S.concursos[0].id) + '</select></label>' +
      '<label class="f"><span>Disciplina (StudyOS)</span><select name="disc">' + ui.discOptions() + '</select></label>' +
      '<label class="f full"><span>Seção do edital</span><select name="s"></select></label>' +
      '<label class="f full"><span>Tópicos — um por linha. Se a linha começar com número (ex.: "4.3 Sintaxe…"), ele vira o item do edital.</span><textarea name="txt" rows="10" placeholder="1. Leitura e interpretação de textos\n2. Ortografia"></textarea></label></div>';
    ui.modal({
      title: 'Adicionar tópicos em lote', wide: true, body: body,
      onOpen: function (root) {
        function fill() { var c = SOS.conc(ui.val(root, 'c')); root.querySelector('[name=s]').innerHTML = ui.opts(c.secoes.map(function (s) { return [s.k, s.nome]; })); }
        root.querySelector('[name=c]').addEventListener('change', fill); fill();
      },
      buttons: [{ label: 'Cancelar', cls: 'ghost' }, { label: 'Adicionar', onClick: function (close, root) {
        var cid = ui.val(root, 'c'), s = ui.val(root, 's'), disc = ui.val(root, 'disc');
        var lines = ui.val(root, 'txt').split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
        if (!lines.length) { ui.toast('Cole ao menos uma linha.', 'bad'); return false; }
        lines.forEach(function (l, i) {
          var m = l.match(/^(\d+(?:\.\d+)*)[.)\-\s]+(.*)$/), lab = m ? m[1] : String(i + 1), tit = m ? m[2] : l;
          SOS.S.topicos.push({ id: U.uid('t'), disc: disc, titulo: tit, refs: [{ c: cid, s: s, o: parseFloat(lab) || i + 1, l: lab }], concursos: [cid], parcial: false, nota: '', imp: 3, inc: 'sd', incJust: 'Sem dados suficientes.', status: 'nao', rev: null, bonusErro: 0, obs: '', seedOrder: 9000 + SOS.S.topicos.length, custom: true });
        });
        SOS.log('Tópicos em lote', lines.length + ' tópicos'); SOS.save(); SOS.app.render(); ui.toast(lines.length + ' tópicos adicionados.', 'good');
      } }]
    });
  }
})();
