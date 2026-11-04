/* Lei seca e jurisprudência: leitura por artigos, marcação, anotações, flashcards,
   cronograma de lei seca e de jurisprudência (sempre com aprovação). */
(function () {
  var SOS = window.SOS, U = SOS.U, ui = SOS.ui, E = SOS.E;
  var tab = 'prior', normaSel = 'lc01', nivelSel = 1;
  var L = SOS.leis = {};

  /* leis do edital (os links oficiais só foram incluídos para normas federais; as municipais você cola) */
  L.seed = function () {
    var P = 'https://www.planalto.gov.br/ccivil_03/';
    return [
      ['Lei Orgânica do Município de Cuiabá', 'lc01', ''],
      ['Regimento Interno da Câmara Municipal de Cuiabá (Resolução nº 08/2016)', 'lc02', ''],
      ['LC nº 93/2003 — Estatuto dos Servidores de Cuiabá', 'lc03', ''],
      ['LC nº 235/2011 — PCCV da Câmara (com alterações da LC nº 609/2026)', 'lc04', ''],
      ['Lei nº 12.527/2011 — Lei de Acesso à Informação', 'lf02', P + '_ato2011-2014/2011/lei/l12527.htm'],
      ['Lei nº 13.460/2017 — Direitos do Usuário do Serviço Público', 'lf03', P + '_ato2015-2018/2017/lei/l13460.htm'],
      ['Lei nº 13.709/2018 — LGPD', 'lf01', P + '_ato2015-2018/2018/lei/l13709.htm'],
      ['Lei nº 14.133/2021 — Licitações e Contratos', 'da10', P + '_ato2019-2022/2021/lei/l14133.htm'],
      ['Constituição Federal (arts. 1º a 14, 29 a 31, 37 a 43, 196 a 200)', 'dc02', P + 'constituicao/constituicao.htm'],
      ['Lei Orgânica do Município de Chapada dos Guimarães', 'lh01', ''],
      ['Estatuto do Servidor de Chapada dos Guimarães', 'lh02', ''],
      ['Lei nº 1447/2011 (Chapada) — ementa a confirmar', 'lh03', ''],
      ['LC nº 62/2014 (Chapada) — ementa a confirmar', 'lh04', ''],
      ['Lei nº 1570/2014 (Chapada) — ementa a confirmar', 'lh05', ''],
      ['LC nº 97/2023 (Chapada) — ementa a confirmar', 'lh06', '']
    ].map(function (x, i) { return { id: 'lei' + (i + 1), nome: x[0], topicId: x[1], link: x[2], texto: '', arts: [], totalArts: 0 }; });
  };
  L.st = function () {
    var S = SOS.S;
    if (!Array.isArray(S.leis)) S.leis = L.seed();
    if (!Array.isArray(S.juris)) S.juris = [];
    return S;
  };

  /* divide o texto colado em artigos (Art. 1º, Art. 2º…); se não achar, em trechos */
  L.parse = function (texto) {
    var t = String(texto || '').replace(/\r/g, '').trim();
    if (!t) return [];
    var parts = t.split(/\n(?=\s*Art\.?\s*\d+)/i);
    var out = [];
    if (parts.length > 1) {
      parts.forEach(function (p, i) {
        p = p.trim(); if (!p) return;
        var m = p.match(/^(?:Art|ART|art)\.?\s*(\d+(?:\.\d{3})*)\s*[ºo°]?\s*(?:-\s*([A-Z])\b)?/);
        out.push({ n: m ? m[1].replace(/\./g, '') + (m[2] ? '-' + m[2] : '') : (i === 0 ? 'Preâmbulo' : String(i)), t: p, lido: false, star: false, nota: '' });
      });
    } else {
      var paras = t.split(/\n{2,}/), buf = '', k = 1;
      paras.forEach(function (p) { buf += (buf ? '\n\n' : '') + p; if (buf.length > 1200) { out.push({ n: 'Trecho ' + k++, t: buf, lido: false, star: false, nota: '' }); buf = ''; } });
      if (buf) out.push({ n: 'Trecho ' + k, t: buf, lido: false, star: false, nota: '' });
    }
    return out;
  };
  function prog(l) { var n = l.arts.length || l.totalArts || 0, lidos = l.arts.length ? l.arts.filter(function (a) { return a.lido; }).length : (l.lidosManual || 0); return { n: n, lidos: lidos, pct: n ? lidos / n * 100 : 0 }; }
  function examFor(topicId) {
    var t = SOS.topic(topicId); var cs = t ? t.concursos.map(function (c) { return SOS.conc(c); }).filter(Boolean) : SOS.S.concursos;
    var fut = cs.filter(function (c) { return c.dataProva > U.today(); }).sort(function (a, b) { return a.dataProva < b.dataProva ? -1 : 1; });
    return fut[0] || null;
  }

  SOS.views.leis = {
    render: function (el) {
      L.st();
      var conc = SOS.app.conc;
      var leis = SOS.S.leis.filter(function (l) { var t = SOS.topic(l.topicId); return conc === 'all' || !t || t.concursos.indexOf(conc) > -1; });
      var h = '<div class="tabs">' + [['prior', 'Prioridades (Nível 1/2/3)'], ['leis', 'Leis (' + leis.length + ')'], ['crono', 'Cronograma de lei seca'], ['juris', 'Jurisprudência (' + SOS.S.juris.length + ')']].map(function (x) { return '<button class="tab ' + (tab === x[0] ? 'active' : '') + '" data-tab="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>';
      if (tab === 'prior') h += vPrior();
      else if (tab === 'leis') {
        h += '<div class="row" style="margin-bottom:10px"><p class="muted" style="margin:0">Cole o texto oficial de cada norma: o StudyOS separa por artigos para você marcar como lido, destacar, anotar e criar flashcards. Para a Selecon, a legislação municipal (Lei Orgânica e Estatuto) costuma ser cobrada de forma direta — estimativa baseada no perfil da banca, não em análise de provas.</p><span class="spacer"></span><button class="btn sm" data-act="newLei">+ Nova norma</button></div>';
        h += '<div class="grid g3">' + leis.map(function (l) {
          var p = prog(l), t = SOS.topic(l.topicId), ex = examFor(l.topicId);
          return '<div class="card"><div class="card-h"><h3>' + U.esc(l.nome) + '</h3></div><div class="row">' + (t ? ui.discTag(t.disc) + ui.concTags(t.concursos) : '') + '</div>' +
            '<div class="prog" style="margin:10px 0 4px"><i style="width:' + p.pct + '%"></i></div><small class="muted">' + (p.n ? p.lidos + ' de ' + p.n + (l.arts.length ? ' artigos lidos' : ' artigos (contagem manual)') : 'Texto ainda não colado') + (ex ? ' · prova em ' + U.fmtShort(ex.dataProva) : '') + '</small>' +
            '<div class="row" style="margin-top:10px;gap:6px">' + (l.arts.length ? '<button class="btn xs" data-read="' + l.id + '">Ler / marcar</button>' : '') + '<button class="btn xs ghost" data-text="' + l.id + '">' + (l.arts.length ? 'Atualizar texto' : 'Colar texto') + '</button>' + (l.link ? '<a class="btn xs ghost" href="' + U.esc(l.link) + '" target="_blank" rel="noopener">Fonte oficial</a>' : '') + '<button class="btn xs ghost" data-plan="' + l.id + '">Cronograma</button><button class="btn xs ghost" data-del="' + l.id + '">Excluir</button></div></div>';
        }).join('') + '</div>';
      } else if (tab === 'crono') {
        var acts = SOS.S.atividades.filter(function (a) { return a.tipo === 'leiseca' || a.tipo === 'juris'; }).sort(function (a, b) { return a.data < b.data ? -1 : 1; });
        h += '<div class="row" style="margin-bottom:10px"><p class="muted" style="margin:0">Blocos de leitura distribuídos até a véspera da prova, de segunda a sábado. Eles aparecem no Planejamento e seguem as regras de carga diária.</p><span class="spacer"></span><button class="btn sm" data-act="planAny">+ Montar cronograma</button></div>';
        h += '<div class="card">' + (acts.length ? '<div class="tbl-wrap"><table><thead><tr><th>Data</th><th>Leitura</th><th class="num">Duração</th><th>Status</th></tr></thead><tbody>' + acts.map(function (a) { return '<tr><td>' + U.DIAS_C[U.dow(a.data)] + ' ' + U.fmtDate(a.data) + '</td><td>' + U.esc(a.titulo) + '</td><td class="num">' + U.fmtMin(a.planMin) + '</td><td>' + (a.status === 'feito' ? '<span class="tag good">feito</span>' : a.data < U.today() ? '<span class="tag bad">atrasado</span>' : '<span class="tag">a fazer</span>') + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<div class="empty">Nenhum bloco de lei seca ou jurisprudência no planejamento.</div>') + '</div>';
      } else {
        h += '<div class="alert info" style="display:block">Para os seus editais (Selecon, cargos municipais), jurisprudência tem peso menor que a lei seca — o conteúdo cobra principalmente legislação, princípios e noções. Registre aqui só o que aparecer nas questões ou nos comentários dos professores (por exemplo, súmulas sobre nepotismo, estágio probatório ou acumulação de cargos), sempre conferindo o texto na fonte oficial.</div>';
        h += '<div class="row" style="margin-bottom:10px"><span class="spacer"></span><button class="btn ghost sm" data-act="planJuris">Distribuir pendentes no planejamento</button><button class="btn sm" data-act="newJuris">+ Nova jurisprudência</button></div>';
        h += '<div class="card">' + (SOS.S.juris.length ? SOS.S.juris.map(function (j) { var t = SOS.topic(j.topicId); return '<div class="list-item"><div class="row"><span class="tag ' + (j.status === 'lido' ? 'good' : j.status === 'revisar' ? 'mid' : '') + '">' + U.esc(j.status) + '</span><b>' + U.esc([j.tribunal, j.tipo, j.numero].filter(Boolean).join(' · ')) + '</b>' + (t ? ui.discTag(t.disc) : '') + '<span class="spacer"></span><button class="btn xs ghost" data-jcard="' + j.id + '">Flashcard</button><button class="btn xs ghost" data-jedit="' + j.id + '">Editar</button><button class="btn xs ghost" data-jdel="' + j.id + '">Excluir</button></div><div style="white-space:pre-wrap;margin-top:4px">' + U.esc(j.tese) + '</div>' + (j.fonte ? '<small><a href="' + U.esc(j.fonte) + '" target="_blank" rel="noopener">fonte</a></small>' : '') + (j.nota ? '<br><small class="muted">' + U.esc(j.nota) + '</small>' : '') + '</div>'; }).join('') : '<div class="empty">Nenhuma jurisprudência registrada.</div>') + '</div>';
      }
      el.innerHTML = h;
      el.onclick = onClick;
      el.onchange = function (e) { var nm = e.target.dataset.nm; if (nm == null) return; var lei = leiDe(normaSel); lei.arts[+nm].nivelManual = e.target.value ? +e.target.value : null; SOS.save(); SOS.app.render(); };
    }
  };
  function find(id) { return SOS.S.leis.find(function (l) { return l.id === id; }); }
  function leiDe(tid) { return SOS.S.leis.find(function (l) { return l.topicId === tid; }); }
  function vPrior() {
    var LP = SOS.leiPrior, N = LP.NORMAS[normaSel], lei = leiDe(normaSel);
    var h = '<div class="alert info" style="display:block"><b>Priorização é uma estimativa</b>, não garantia de cobrança. Ordem dos critérios: (a) o que a Selecon já cobrou (provas de 2021 que você informou); (b) prazos, quóruns, competências, vedações e exceções; (c) ligação com o cargo de Técnico; (d) alterações recentes (LC 609/2026). O Nível 1 foi limitado para caber em cerca de uma semana de leitura (6 blocos de 35 min).</div>';
    h += '<div class="seg" style="margin-bottom:12px;flex-wrap:wrap">' + SOS.E.NORMAS.map(function (k) { return '<button data-norma="' + k + '" class="' + (k === normaSel ? 'active' : '') + '">' + U.esc(LP.NORMAS[k].nome.split(' — ')[0].split(' (')[0].replace(' do Município de Cuiabá', '').replace(' da Câmara Municipal de Cuiabá', '')) + '</button>'; }).join('') + '</div>';
    h += '<div class="card"><h3>' + U.esc(N.nome) + '</h3><p style="margin:0 0 6px"><small>Fonte oficial: ' + N.fontes.map(function (f) { return '<a href="' + f[1] + '" target="_blank" rel="noopener">' + U.esc(f[0]) + '</a>'; }).join(' · ') + '</small></p><p class="muted" style="margin:0;font-size:13px">Não consegui abrir o texto oficial daqui. Cole o texto da norma em <b>Leis › Colar texto</b> para ver os artigos numerados e classificados.</p></div>';
    var cls = lei && lei.arts.length ? LP.classificar(lei) : null;
    if (cls) {
      var cnt = { 1: 0, 2: 0, 3: 0 }, ch = { 1: 0, 2: 0, 3: 0 };
      cls.forEach(function (x) { cnt[x.nivel]++; ch[x.nivel] += x.chars; });
      h += '<div class="grid g3 section">' + [1, 2, 3].map(function (n) { return '<button class="card kpi" data-nivel="' + n + '" style="text-align:left;cursor:pointer;' + (n === nivelSel ? 'outline:2px solid var(--primary)' : '') + '"><div class="l">Nível ' + n + ' — ' + ['', 'obrigatório', 'se der tempo', 'leitura rápida ou ignorar'][n] + '</div><div class="v">' + cnt[n] + ' artigos</div><div class="s">≈ ' + U.fmtMin(ch[n] / 450) + ' de leitura</div></button>'; }).join('') + '</div>';
      h += '<div class="card section"><div class="card-h"><h3>Nível ' + nivelSel + '</h3><div class="right"><button class="btn xs ghost" data-cards="' + nivelSel + '">Gerar flashcards de fixação deste nível</button></div></div>' + cls.filter(function (x) { return x.nivel === nivelSel; }).sort(function (a, b) { return b.score - a.score; }).map(function (x) {
        return '<div class="list-item"><div class="row"><b style="font-family:var(--f-head)">' + (/^\d/.test(x.n) ? 'Art. ' + U.esc(x.n) : U.esc(x.n)) + '</b><span>' + U.esc(x.assunto) + (x.assunto.length >= 110 ? '…' : '') + '</span><span class="spacer"></span><select data-nm="' + x.i + '" style="padding:2px 6px;font-size:12px">' + ui.opts([['', 'auto'], [1, 'Nível 1'], [2, 'Nível 2'], [3, 'Nível 3']], lei.arts[x.i].nivelManual || '') + '</select></div><small class="muted">Por quê: ' + U.esc(x.porque.join(' ')) + '</small><br><small>❓ ' + U.esc(x.pergunta) + '</small></div>';
      }).join('') + '</div>';
    } else {
      [1, 2, 3].forEach(function (n) {
        var ts = N.temas.filter(function (t) { return t.n === n; });
        h += '<div class="card section"><h3>Nível ' + n + ' — ' + ['', 'obrigatório', 'se der tempo', 'leitura rápida ou ignorar'][n] + '</h3>' + ts.map(function (t) { return '<div class="list-item"><div class="row"><b>' + U.esc(t.tema) + '</b>' + (t.a ? '<span class="tag good">já cobrado pela Selecon</span>' : '') + '</div><small class="muted">Por quê: ' + U.esc(t.porque) + '</small><br><small>❓ ' + U.esc(t.q) + '</small></div>'; }).join('') + '</div>';
      });
    }
    if (N.edital) h += '<div class="card section"><h3>Artigos citados no edital (números verificados no Edital 001/2026-CMC)</h3>' + N.edital.map(function (e) { return '<div class="list-item"><div class="row"><b style="font-family:var(--f-head)">Art. ' + U.esc(e[0]) + '</b><span>' + U.esc(e[1]) + '</span><span class="tag good">Nível 1</span></div><small class="muted">Por quê: ' + U.esc(e[2]) + '</small><br><small>❓ ' + U.esc(e[3]) + '</small></div>'; }).join('') + '</div>';
    return h;
  }
  function onClick(e) {
    var x;
    if ((x = e.target.closest('[data-tab]'))) { tab = x.dataset.tab; return SOS.app.render(); }
    if ((x = e.target.closest('[data-norma]'))) { normaSel = x.dataset.norma; nivelSel = 1; return SOS.app.render(); }
    if ((x = e.target.closest('[data-nivel]'))) { nivelSel = +x.dataset.nivel; return SOS.app.render(); }
    if ((x = e.target.closest('[data-cards]'))) {
      var lei0 = leiDe(normaSel), cls0 = SOS.leiPrior.classificar(lei0), n0 = 0;
      cls0.filter(function (c) { return c.nivel === +x.dataset.cards; }).forEach(function (c) {
        var art = lei0.arts[c.i]; var txt = art.t.length > 380 ? art.t.slice(0, 377) + '…' : art.t;
        if (SOS.cards && SOS.cards.addDraft({ frente: c.pergunta, verso: txt, fundamento: (/^\d/.test(c.n) ? 'Art. ' + c.n + ', ' : '') + lei0.nome.split(' — ')[0], explicacao: c.porque[0] || '', topicId: lei0.topicId, origem: 'Legislação', ref: 'lei:' + lei0.id + ':' + c.n })) n0++;
      });
      ui.toast(n0 + ' flashcard(s) na fila de aprovação (Flashcards › Para aprovar).', 'good', 5000); SOS.save(); return SOS.app.renderNav();
    }
    if (e.target.closest('[data-act=newLei]')) return leiForm(null);
    if ((x = e.target.closest('[data-text]'))) return leiForm(find(x.dataset.text));
    if ((x = e.target.closest('[data-read]'))) return reader(find(x.dataset.read));
    if ((x = e.target.closest('[data-plan]'))) return planForm(find(x.dataset.plan));
    if (e.target.closest('[data-act=planAny]')) return planForm(null);
    if ((x = e.target.closest('[data-del]'))) { var l = find(x.dataset.del); return ui.confirm('Excluir “' + U.esc(l.nome) + '” e suas marcações? Blocos já planejados continuam no Planejamento.', function () { SOS.S.leis = SOS.S.leis.filter(function (y) { return y.id !== l.id; }); SOS.save(); SOS.app.render(); }); }
    if (e.target.closest('[data-act=newJuris]')) return jurisForm(null);
    if ((x = e.target.closest('[data-jedit]'))) return jurisForm(SOS.S.juris.find(function (j) { return j.id === x.dataset.jedit; }));
    if ((x = e.target.closest('[data-jdel]'))) { var j = SOS.S.juris.find(function (y) { return y.id === x.dataset.jdel; }); return ui.confirm('Excluir esta jurisprudência?', function () { SOS.S.juris = SOS.S.juris.filter(function (y) { return y.id !== j.id; }); SOS.save(); SOS.app.render(); }); }
    if ((x = e.target.closest('[data-jcard]'))) { var jj = SOS.S.juris.find(function (y) { return y.id === x.dataset.jcard; }); return SOS.views.flashcards.fromError({ id: null, topicId: jj.topicId || '', aprender: 'O que diz ' + [jj.tribunal, jj.tipo, jj.numero].filter(Boolean).join(' ') + '?', correta: jj.tese, justificativa: '', porque: '', banca: '', categorias: ['Desconhecimento da legislação'] }, 'Legislação'); }
    if (e.target.closest('[data-act=planJuris]')) return planJuris();
  }

  function leiForm(l) {
    var isNew = !l;
    l = l || { id: U.uid('lei'), nome: '', topicId: '', link: '', texto: '', arts: [], totalArts: 0 };
    ui.modal({
      title: isNew ? 'Nova norma' : l.nome, wide: true,
      body: '<div class="form"><label class="f full"><span>Nome</span><input name="nome" value="' + U.esc(l.nome) + '"></label><label class="f"><span>Tópico do edital</span><select name="topic">' + ui.topicOptions(l.topicId, null, true) + '</select></label><label class="f"><span>Link da fonte oficial</span><input name="link" value="' + U.esc(l.link) + '" placeholder="https://"></label>' +
        '<label class="f full"><span>Texto da norma (cole do site oficial). Os artigos são separados automaticamente pelas linhas que começam com “Art.”.</span><textarea name="texto" rows="12">' + U.esc(l.texto) + '</textarea></label>' +
        '<label class="f"><span>Sem o texto? Informe só o nº de artigos (para o cronograma)</span><input type="number" min="0" name="total" value="' + (l.totalArts || '') + '"></label></div>' + (l.arts.length ? '<div class="alert mid">Atualizar o texto mantém as marcações dos artigos com o mesmo número.</div>' : ''),
      buttons: [{ label: 'Cancelar', cls: 'ghost' }, { label: 'Salvar', onClick: function (c, root) {
        var nome = ui.val(root, 'nome').trim(); if (!nome) { ui.toast('Informe o nome.', 'bad'); return false; }
        var texto = ui.val(root, 'texto');
        if (texto.length > 900000) { ui.toast('Texto muito grande para o navegador. Cole só os artigos cobrados.', 'bad', 6000); return false; }
        var old = {}; l.arts.forEach(function (a) { old[a.n] = a; });
        l.nome = nome; l.topicId = ui.val(root, 'topic'); l.link = ui.val(root, 'link'); l.texto = texto;
        l.arts = L.parse(texto).map(function (a) { var o = old[a.n]; if (o) { a.lido = o.lido; a.star = o.star; a.nota = o.nota; } return a; });
        l.totalArts = +ui.val(root, 'total') || 0;
        if (isNew) SOS.S.leis.push(l);
        SOS.log('Norma salva', l.nome + ' — ' + l.arts.length + ' artigos'); SOS.save(); SOS.app.render();
        ui.toast(l.arts.length ? l.arts.length + ' artigos identificados.' : 'Norma salva.', 'good');
      } }]
    });
  }

  function reader(l) {
    var flt = 'todos', q = '';
    var m = ui.modal({ title: l.nome, wide: true, noFocus: true, body: '<div class="row" style="margin-bottom:10px"><input type="search" id="lq" placeholder="Buscar no texto…" style="max-width:240px"><div class="seg" id="lf"><button data-f="todos" class="active">Todos</button><button data-f="nao">Não lidos</button><button data-f="star">Destacados</button><button data-f="nota">Com anotação</button></div><span class="spacer"></span><small id="lp" class="muted"></small></div><div id="arts"></div>', buttons: [{ label: 'Fechar', cls: 'ghost' }], onClose: function () { SOS.app.render(); } });
    var root = m.root;
    function draw() {
      var arts = l.arts.map(function (a, i) { return { a: a, i: i }; }).filter(function (x) { return (flt === 'todos' || (flt === 'nao' && !x.a.lido) || (flt === 'star' && x.a.star) || (flt === 'nota' && x.a.nota)) && (!q || U.norm(x.a.t).indexOf(U.norm(q)) > -1); });
      var p = prog(l); root.querySelector('#lp').textContent = p.lidos + ' de ' + p.n + ' lidos (' + Math.round(p.pct) + '%)';
      root.querySelector('#arts').innerHTML = arts.slice(0, 400).map(function (x) {
        return '<div class="card flat" style="margin-bottom:8px;' + (x.a.lido ? 'opacity:.75' : '') + (x.a.star ? ';border-color:var(--mid)' : '') + '"><div class="row"><b style="font-family:var(--f-head)">' + (/^\d/.test(x.a.n) ? 'Art. ' + U.esc(x.a.n) : U.esc(x.a.n)) + '</b><span class="spacer"></span><label class="chk"><input type="checkbox" data-lido="' + x.i + '"' + (x.a.lido ? ' checked' : '') + '> lido</label><button class="btn xs ghost" data-star="' + x.i + '">' + (x.a.star ? '★ destacado' : '☆ destacar') + '</button><button class="btn xs ghost" data-fc="' + x.i + '">Flashcard</button></div><div style="white-space:pre-wrap;margin-top:6px;font-size:14.5px">' + U.esc(x.a.t) + '</div><textarea data-nota="' + x.i + '" rows="1" placeholder="Anotação…" style="margin-top:6px">' + U.esc(x.a.nota || '') + '</textarea></div>';
      }).join('') + (arts.length > 400 ? '<div class="empty">Mostrando 400 de ' + arts.length + ' — use a busca.</div>' : '') || '<div class="empty">Nada com esse filtro.</div>';
    }
    root.querySelector('#lq').addEventListener('input', function (e) { q = e.target.value; clearTimeout(this._t); this._t = setTimeout(draw, 250); });
    root.querySelector('#lf').addEventListener('click', function (e) { var b = e.target.closest('[data-f]'); if (!b) return; flt = b.dataset.f; ui.$$('#lf button', root).forEach(function (x) { x.classList.toggle('active', x === b); }); draw(); });
    root.addEventListener('change', function (e) {
      if (e.target.dataset.lido != null) { var a = l.arts[+e.target.dataset.lido]; a.lido = e.target.checked; a.lidoEm = a.lido ? U.today() : null; SOS.save(); draw(); }
    });
    root.addEventListener('input', function (e) { if (e.target.dataset.nota != null) { l.arts[+e.target.dataset.nota].nota = e.target.value; SOS.save(); } });
    root.addEventListener('click', function (e) {
      var b;
      if ((b = e.target.closest('[data-star]'))) { var a = l.arts[+b.dataset.star]; a.star = !a.star; SOS.save(); draw(); }
      if ((b = e.target.closest('[data-fc]'))) {
        var art = l.arts[+b.dataset.fc], txt = art.t.length > 400 ? art.t.slice(0, 397) + '…' : art.t;
        SOS.views.flashcards.fromError({ id: null, topicId: l.topicId || '', aprender: 'O que dispõe o ' + (/^\d/.test(art.n) ? 'art. ' + art.n : art.n) + ' — ' + l.nome.split(' — ')[0] + '?', correta: txt, justificativa: '', porque: '', banca: '', categorias: ['Desconhecimento da legislação'] }, 'Legislação');
      }
    });
    draw();
  }

  /* cronograma de lei seca: distribui os artigos (por tamanho) nos dias úteis até a véspera da prova */
  function planForm(l) {
    var ls = SOS.S.leis.filter(function (x) { return x.arts.length || x.totalArts; });
    if (!ls.length) return ui.toast('Cole o texto (ou informe o nº de artigos) de ao menos uma norma.', 'mid', 5000);
    l = l && (l.arts.length || l.totalArts) ? l : ls[0];
    var ex = examFor(l.topicId);
    ui.modal({
      title: 'Cronograma de lei seca', wide: true,
      body: '<div class="form"><label class="f full"><span>Norma</span><select name="lei">' + ui.opts(ls.map(function (x) { return [x.id, x.nome]; }), l.id) + '</select></label>' +
        '<label class="f"><span>Começar em</span><input type="date" name="ini" value="' + U.addDays(U.today(), 1) + '"></label><label class="f"><span>Terminar até</span><input type="date" name="fim" value="' + (ex ? U.addDays(ex.dataProva, -2) : U.addDays(U.today(), 21)) + '"></label>' +
        '<label class="f"><span>Minutos por bloco (aprox.)</span><input type="number" name="min" min="10" value="40"></label><label class="chk" style="align-self:end;width:max-content"><input type="checkbox" name="soNaoLidos" checked> Só artigos ainda não lidos</label>' +
        '<label class="f full"><span>Dias da semana</span><div class="checks">' + [1, 2, 3, 4, 5, 6].map(function (d) { return '<label class="chk"><input type="checkbox" name="dw" value="' + d + '" checked> ' + U.DIAS_C[d] + '</label>'; }).join('') + '</div></label></div><div id="prev" class="section"></div>',
      onOpen: function (root) { var f = function () { preview(root); }; root.addEventListener('change', f); root.addEventListener('input', f); f(); },
      buttons: [{ label: 'Cancelar', cls: 'ghost' }, { label: 'Aprovar e enviar ao Planejamento', cls: 'good', onClick: function (c, root) {
        var p = preview(root); if (!p.length) { ui.toast('Nada a distribuir.', 'mid'); return false; }
        p.forEach(function (b) { SOS.S.atividades.push(b); });
        SOS.log('Cronograma de lei seca', p.length + ' blocos'); SOS.save(); SOS.app.render(); ui.toast(p.length + ' blocos de lei seca adicionados ao Planejamento.', 'good');
      } }]
    });
    function preview(root) {
      var lei = find(ui.val(root, 'lei')), ini = ui.val(root, 'ini'), fim = ui.val(root, 'fim'), min = Math.max(10, +ui.val(root, 'min') || 40), dws = ui.checked(root, 'dw').map(Number), so = ui.val(root, 'soNaoLidos');
      var t = SOS.topic(lei.topicId);
      var units = lei.arts.length ? lei.arts.filter(function (a) { return !so || !a.lido; }).map(function (a) { return { n: a.n, c: a.t.length }; }) : Array.apply(null, Array(Math.max(0, lei.totalArts - (lei.lidosManual || 0)))).map(function (_, i) { return { n: String(i + 1 + (lei.lidosManual || 0)), c: 800 }; });
      var days = []; for (var d = ini; d <= fim && days.length < 200; d = U.addDays(d, 1)) if (dws.indexOf(U.dow(d)) > -1) days.push(d);
      var box = root.querySelector('#prev');
      if (!units.length || !days.length) { box.innerHTML = '<div class="empty">' + (!units.length ? 'Todos os artigos já foram lidos.' : 'Nenhum dia disponível no período.') + '</div>'; return []; }
      var totalC = units.reduce(function (s, u) { return s + u.c; }, 0);
      var charsPerMin = 450; // leitura atenta de lei
      var needBlocks = Math.max(1, Math.ceil(totalC / charsPerMin / min));
      var nb = Math.min(days.length, needBlocks), per = totalC / nb, blocks = [], cur = [], acc = 0;
      units.forEach(function (u) { cur.push(u); acc += u.c; if (acc >= per && blocks.length < nb - 1) { blocks.push(cur); cur = []; acc = 0; } });
      if (cur.length) blocks.push(cur);
      var step = days.length / blocks.length;
      var out = blocks.map(function (b, i) {
        var c = b.reduce(function (s, u) { return s + u.c; }, 0);
        return { id: U.uid('a'), data: days[Math.floor(i * step)], topicId: lei.topicId || null, disc: t ? t.disc : null, metodo: 'Lei seca', planMin: Math.max(15, Math.round(c / charsPerMin / 5) * 5), titulo: lei.nome.split(' — ')[0] + ' — ' + (b.length > 1 ? 'arts. ' + b[0].n + ' a ' + b[b.length - 1].n : (/^\d/.test(b[0].n) ? 'art. ' : '') + b[0].n), tipo: 'leiseca', leiId: lei.id, status: 'nao', obs: '' };
      });
      var over = needBlocks > days.length;
      box.innerHTML = (over ? '<div class="alert mid">O período é curto para a leitura no ritmo escolhido: os blocos ficaram maiores que ' + min + ' min. Aumente o período ou os minutos por bloco.</div>' : '') + '<p class="muted">' + units.length + ' artigo(s) em ' + out.length + ' bloco(s), ~' + U.fmtMin(totalC / charsPerMin) + ' de leitura no total.</p>' + out.slice(0, 60).map(function (a) { return '<div class="list-item row" style="padding:4px 0"><small style="width:90px">' + U.DIAS_C[U.dow(a.data)] + ' ' + U.fmtShort(a.data) + '</small><span>' + U.esc(a.titulo) + '</span><span class="spacer"></span><small>' + U.fmtMin(a.planMin) + '</small></div>'; }).join('');
      return out;
    }
  }

  function jurisForm(j) {
    var isNew = !j;
    j = j || { id: U.uid('j'), tribunal: 'STF', tipo: 'Súmula', numero: '', tese: '', data: '', topicId: '', fonte: '', status: 'pendente', nota: '' };
    ui.modal({
      title: isNew ? 'Nova jurisprudência' : 'Editar jurisprudência', wide: true,
      body: '<div class="form"><label class="f"><span>Tribunal</span><input name="tribunal" value="' + U.esc(j.tribunal) + '" placeholder="STF, STJ, TJMT, TCE-MT…"></label><label class="f"><span>Tipo</span><select name="tipo">' + ui.opts(['Súmula', 'Súmula vinculante', 'Tema de repercussão geral', 'Recurso repetitivo', 'Informativo', 'Acórdão', 'Parecer/Resolução'], j.tipo) + '</select></label><label class="f"><span>Número</span><input name="numero" value="' + U.esc(j.numero) + '"></label><label class="f"><span>Tópico do edital</span><select name="topic">' + ui.topicOptions(j.topicId, null, true) + '</select></label>' +
        '<label class="f full"><span>Enunciado / tese (copie da fonte oficial)</span><textarea name="tese" rows="4">' + U.esc(j.tese) + '</textarea></label><label class="f"><span>Link da fonte</span><input name="fonte" value="' + U.esc(j.fonte) + '"></label><label class="f"><span>Status</span><select name="status">' + ui.opts(['pendente', 'lido', 'revisar'], j.status) + '</select></label><label class="f full"><span>Anotação</span><input name="nota" value="' + U.esc(j.nota) + '"></label></div>',
      buttons: [{ label: 'Cancelar', cls: 'ghost' }, { label: 'Salvar', onClick: function (c, root) {
        var tese = ui.val(root, 'tese').trim(); if (!tese) { ui.toast('Informe o enunciado/tese.', 'bad'); return false; }
        ['tribunal', 'tipo', 'numero', 'fonte', 'status', 'nota'].forEach(function (k) { j[k] = ui.val(root, k); }); j.tese = tese; j.topicId = ui.val(root, 'topic');
        if (isNew) SOS.S.juris.push(j); SOS.save(); SOS.app.render();
      } }]
    });
  }
  function planJuris() {
    var pend = SOS.S.juris.filter(function (j) { return j.status !== 'lido' && !SOS.S.atividades.some(function (a) { return a.jurisId === j.id && a.status !== 'feito'; }); });
    if (!pend.length) return ui.toast('Nenhuma jurisprudência pendente sem agendamento.', 'mid');
    var d = U.addDays(U.today(), 1), out = [], perDay = 2, cnt = 0;
    pend.forEach(function (j) {
      while (U.dow(d) === 0) d = U.addDays(d, 1);
      var t = SOS.topic(j.topicId);
      out.push({ id: U.uid('a'), data: d, topicId: j.topicId || null, disc: t ? t.disc : null, metodo: 'Leitura', planMin: 15, titulo: 'Jurisprudência: ' + [j.tribunal, j.tipo, j.numero].filter(Boolean).join(' '), tipo: 'juris', jurisId: j.id, status: 'nao', obs: '' });
      if (++cnt % perDay === 0) d = U.addDays(d, 1);
    });
    ui.modal({ title: 'Distribuir jurisprudência', body: '<p class="muted" style="margin-top:0">Até 2 por dia, 15 min cada, de segunda a sábado.</p>' + out.map(function (a) { return '<div class="list-item row" style="padding:4px 0"><small style="width:90px">' + U.DIAS_C[U.dow(a.data)] + ' ' + U.fmtShort(a.data) + '</small><span>' + U.esc(a.titulo) + '</span></div>'; }).join(''), buttons: [{ label: 'Cancelar', cls: 'ghost' }, { label: 'Aprovar', cls: 'good', onClick: function () { out.forEach(function (a) { SOS.S.atividades.push(a); }); SOS.save(); SOS.app.render(); ui.toast(out.length + ' leitura(s) agendada(s).', 'good'); } }] });
  }
})();
