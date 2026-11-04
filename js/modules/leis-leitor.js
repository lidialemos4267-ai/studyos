/* Lei seca 2.0 — leitor estilo Vade Mecum: hierarquia visual, navegação, filtros, destaques por trecho,
   anotações, assistente de IA e geração de flashcards/questões. O texto legal é exibido sem nenhuma alteração. */
(function () {
  var SOS = window.SOS, U = SOS.U, ui = SOS.ui, X = SOS.lex;
  var R = SOS.leitor = {};
  var CATS = { conceito: 'Conceito importante', atencao: 'Atenção', pegadinha: 'Pegadinha', memorizar: 'Memorizar', nota: 'Minha anotação' };
  var CAT_ICO = { conceito: '◆', atencao: '!', pegadinha: '⚠', memorizar: '★', nota: '✎' };
  R.CATS = CATS;
  var LIMITE_CHARS_IA = 60000;

  function nome(n) { return X.nomeArt(n); }
  function normaCurta(l) { return String(l.nome || '').split(' — ')[0]; }
  function marks(a) { if (!Array.isArray(a.marks)) a.marks = []; return a.marks; }
  function iaDe(l, n) { l.ia = l.ia || {}; return l.ia[n] || null; }

  /* cabeçalhos (títulos/capítulos/seções) e contexto de cada artigo */
  function contexto(l) {
    var antes = {}, cap = {}, lista = [], pend = [], atual = '';
    l.arts.forEach(function (a, i) {
      if (pend.length) { antes[i] = pend; lista.push({ i: i, txt: pend.join(' — ') }); atual = pend[pend.length - 1]; pend = []; }
      cap[i] = atual;
      var segs = X.estrutura(a.t), bloco = [];
      segs.forEach(function (s) {
        if (!s.fim) return;
        var txt = a.t.slice(s.o, s.e).trim();
        if (s.tipo === 'cab') { if (bloco.length) pend.push(bloco.join(' ')); bloco = [txt]; } else bloco.push(txt);
      });
      if (bloco.length) pend.push(bloco.join(' '));
    });
    return { antes: antes, cap: cap, lista: lista };
  }
  R.contexto = contexto;

  /* HTML do texto legal: cada pedaço guarda sua posição (data-o) no texto original */
  function textoHtml(a, realce, busca) {
    var t = a.t, segs = X.estrutura(t), kws = realce ? X.termosAtencao(t) : [], ms = marks(a).filter(function (m) { return !m.orfa && m.e > m.o; });
    var hits = [];
    if (busca) { var nq = busca.toLowerCase(), lt = t.toLowerCase(), p = lt.indexOf(nq); while (p > -1 && hits.length < 200) { hits.push({ o: p, e: p + nq.length }); p = lt.indexOf(nq, p + nq.length); } }
    var h = '';
    segs.forEach(function (s) {
      if (s.tipo === 'vazio' || s.fim) return;
      var pts = [s.o, s.e];
      function addR(list) { list.forEach(function (r) { if (r.o < s.e && r.e > s.o) { pts.push(Math.max(r.o, s.o), Math.min(r.e, s.e)); } }); }
      if (s.lab) pts.push(s.o + s.lab);
      addR(kws); addR(ms); addR(hits);
      pts = pts.filter(function (x, k, arr) { return arr.indexOf(x) === k; }).sort(function (x, y) { return x - y; });
      var inner = '';
      for (var k = 0; k < pts.length - 1; k++) {
        var o = pts[k], e = pts[k + 1]; if (e <= o) continue;
        var cls = [];
        if (s.lab && o < s.o + s.lab) cls.push('lx-lb');
        if (kws.some(function (r) { return r.o <= o && r.e >= e; })) cls.push('kw');
        if (hits.some(function (r) { return r.o <= o && r.e >= e; })) cls.push('hit');
        var mk = null; ms.forEach(function (m) { if (m.o <= o && m.e >= e) mk = m; });
        var txt = U.esc(t.slice(o, e));
        if (mk) inner += '<mark data-o="' + o + '" data-mk="' + mk.id + '" class="mk mk-' + mk.cat + (cls.length ? ' ' + cls.join(' ') : '') + '" title="' + U.esc(CATS[mk.cat] + (mk.nota ? ': ' + mk.nota : '')) + '">' + txt + '</mark>';
        else inner += '<span data-o="' + o + '"' + (cls.length ? ' class="' + cls.join(' ') + '"' : '') + '>' + txt + '</span>';
      }
      h += '<p class="lx-seg lx-' + s.tipo + '">' + inner + '</p>';
    });
    return h;
  }
  R.textoHtml = textoHtml;

  function renderIA(l, a) {
    var r = iaDe(l, a.n); if (!r) return '';
    var e = U.esc, h = '';
    if (r.explicar_artigo) {
      var x = r.explicar_artigo.dados;
      h += '<div class="lx-ia-b"><div class="lx-ia-t">Explicação</div>' +
        (x.conceito_central ? '<h5>1. Conceito central</h5><p>' + e(x.conceito_central) + '</p>' : '') +
        (x.regra_geral ? '<h5>2. Regra geral</h5><p>' + e(x.regra_geral) + '</p>' : '') +
        '<h5>3. Exceções</h5>' + (x.excecoes.length ? '<ul>' + x.excecoes.map(function (y) { return '<li>' + e(y) + '</li>'; }).join('') + '</ul>' : '<p class="muted">Nenhuma exceção expressa no dispositivo.</p>') +
        (x.elementos.length ? '<h5>4. Elementos importantes</h5><ul>' + x.elementos.map(function (y) { return '<li>' + (y.tipo ? '<b>' + e(y.tipo) + ':</b> ' : '') + e(y.texto) + '</li>'; }).join('') + '</ul>' : '') +
        (x.expressoes_atencao.length ? '<h5>5. Expressões de atenção</h5><ul>' + x.expressoes_atencao.map(function (y) { return '<li><b>“' + e(y.expressao) + '”</b>' + (y.efeito ? ' — ' + e(y.efeito) : '') + '</li>'; }).join('') + '</ul>' : '') +
        (x.exemplo ? '<h5>6. Exemplo prático</h5><p>' + e(x.exemplo) + '</p>' : '') +
        (x.como_pode_ser_cobrado.length ? '<h5>7. Como pode ser cobrado</h5><ul>' + x.como_pode_ser_cobrado.map(function (y) { return '<li><span class="tag ' + (y.base === 'incidencia_comprovada' ? 'good' : '') + '">' + (y.base === 'incidencia_comprovada' ? 'já cobrado' + (y.fonte ? ' (' + e(y.fonte) + ')' : '') : 'inferência') + '</span> ' + e(y.texto) + '</li>'; }).join('') + '</ul>' : '') +
        (x.limitacoes ? '<p class="muted"><b>Limitações:</b> ' + e(x.limitacoes) + '</p>' : '') + '</div>';
    }
    [['pontos_importantes', 'Pontos importantes'], ['analisar_excecoes', 'Exceções e ressalvas'], ['identificar_pegadinhas', 'Possíveis pegadinhas']].forEach(function (k) {
      if (!r[k[0]]) return; var d = r[k[0]].dados;
      h += '<div class="lx-ia-b"><div class="lx-ia-t">' + k[1] + '</div><ul>' + d.itens.map(function (y) { return '<li>' + (y.titulo ? '<b>' + e(y.titulo) + ':</b> ' : '') + e(y.texto) + (y.trecho ? '<br><small class="muted">“' + e(y.trecho) + '”</small>' : '') + '</li>'; }).join('') + '</ul>' + (d.limitacoes ? '<p class="muted"><b>Limitações:</b> ' + e(d.limitacoes) + '</p>' : '') + '</div>';
    });
    if (!h) return '';
    return '<div class="lx-ia"><div class="row"><b>✦ Assistente de IA</b><small class="muted">não substitui o texto legal — confira no dispositivo</small><span class="spacer"></span><button class="btn xs ghost" data-a="iaapagar">Apagar explicações</button></div>' + h + '</div>';
  }

  function artHtml(st, i) {
    var l = st.l, a = l.arts[i], segs = X.estrutura(a.t), corpo = segs.some(function (s) { return s.tipo !== 'vazio' && !s.fim; });
    var h = (st.ctx.antes[i] || []).map(function (c) { return '<div class="lx-cap" id="lx-c-' + i + '">' + U.esc(c) + '</div>'; }).join('');
    if (!corpo) return h ? '<div data-art-wrap="' + i + '">' + h + '</div>' : '';
    var ms = marks(a), orf = ms.filter(function (m) { return m.orfa; });
    var sel = st.sel.indexOf(i) > -1;
    h += '<article class="lx-art' + (a.lido ? ' lido' : '') + (a.star ? ' star' : '') + (sel ? ' sel' : '') + '" id="lx-a-' + i + '" data-i="' + i + '">' +
      '<header class="lx-h"><label class="lx-ck" title="Selecionar para ações em grupo"><input type="checkbox" data-sel="' + i + '"' + (sel ? ' checked' : '') + '></label>' + (segs.some(function (x) { return x.tipo === 'caput'; }) ? '<span class="lx-ctx">' + (st.ctx.antes[i] ? '' : U.esc(st.ctx.cap[i] || '')) + '</span>' : '<span class="lx-num">' + U.esc(/^\d/.test(a.n) ? nome(a.n) : a.n) + '</span>') + (a.alterado ? '<span class="tag mid" title="O texto mudou na última atualização da norma">texto atualizado</span>' : '') + (a.star ? '<span class="lx-star" title="Destacado">★</span>' : '') +
      '<span class="spacer"></span><span class="lx-tools"><label class="chk"><input type="checkbox" data-lido="' + i + '"' + (a.lido ? ' checked' : '') + '> lido</label>' +
      '<button class="btn xs ghost" data-a="star" title="Destacar artigo">' + (a.star ? '★' : '☆') + '</button><button class="btn xs ghost" data-a="nota">Anotar</button><button class="btn xs ghost" data-a="fc">Flashcards</button><button class="btn xs ghost" data-a="ia">✦ IA</button></span></header>' +
      '<div class="lx-text" data-art="' + i + '">' + textoHtml(a, st.realce, st.busca) + '</div>' +
      (ms.length ? '<ul class="lx-marks">' + ms.map(function (m) { return '<li class="' + (m.orfa ? 'orfa' : '') + '"><span class="mk-chip mk-' + m.cat + '">' + CAT_ICO[m.cat] + ' ' + CATS[m.cat] + '</span> <span class="lx-tr">“' + U.esc(m.trecho.length > 120 ? m.trecho.slice(0, 117) + '…' : m.trecho) + '”</span>' + (m.nota ? ' — <i>' + U.esc(m.nota) + '</i>' : '') + (m.orfa ? ' <span class="tag mid">precisa revisar: trecho não localizado após a atualização</span>' : '') + ' <button class="btn xs ghost" data-mk-edit="' + m.id + '">editar</button></li>'; }).join('') + '</ul>' : '') +
      (a.nota || st.notaAberta[i] ? '<textarea class="lx-nota" data-nota="' + i + '" rows="2" placeholder="Minha anotação sobre este artigo (fica separada do texto legal)…">' + U.esc(a.nota || '') + '</textarea>' : '') +
      renderIA(l, a) + '</article>';
    return h;
  }

  function filtrados(st) {
    var l = st.l, q = (st.q || '').trim(), num = q.match(/^(?:art(?:igo)?\.?\s*)?(\d+(?:-[A-Za-z])?)\s*[ºo°]?$/i);
    st.busca = num ? '' : q;
    return l.arts.map(function (a, i) { return i; }).filter(function (i) {
      var a = l.arts[i];
      if (st.flt === 'nao' && a.lido) return false;
      if (st.flt === 'star' && !a.star) return false;
      if (st.flt === 'nota' && !a.nota) return false;
      if (st.flt === 'marcas' && !marks(a).length) return false;
      if (num) return String(a.n).toUpperCase() === num[1].toUpperCase() || String(a.n).toUpperCase().indexOf(num[1].toUpperCase() + '-') === 0;
      if (q) return a.t.toLowerCase().indexOf(q.toLowerCase()) > -1 || U.norm(a.t).indexOf(U.norm(q)) > -1;
      return true;
    });
  }
  function prog(l) { var arts = l.arts.filter(function (a) { return X.temCorpo(a.t); }), n = arts.length, lid = arts.filter(function (a) { return a.lido; }).length; return { n: n, lidos: lid, pct: n ? lid / n * 100 : 0 }; }

  R.abrirPorId = function (leiId, n) { SOS.leis.st(); var l = SOS.S.leis.find(function (x) { return x.id === leiId; }); if (!l || !l.arts.length) return ui.toast('Artigo não encontrado: a norma foi excluída ou o texto ainda não foi colado.', 'mid', 5000); R.abrir(l, n); };

  R.abrir = function (l, irPara) {
    var s = SOS.S.settings;
    var st = { l: l, flt: 'todos', q: '', sel: [], realce: s.leitorRealce !== false, fonte: s.leitorFonte || 17, leitura: false, limite: 80, notaAberta: {}, ctx: contexto(l) };
    var temCap = st.ctx.lista.length > 0;
    var m = ui.modal({
      title: l.nome, wide: true, noFocus: true, onClose: function () { if (st.obs) st.obs.disconnect(); if (tb.parentNode) tb.remove(); SOS.save(); SOS.app.render(); },
      body: '<div class="lx">' +
        '<div class="lx-bar"><input type="search" id="lxq" placeholder="Buscar palavra ou nº do artigo (ex.: 12)" aria-label="Buscar"><button class="btn xs ghost lx-ajustes" data-a="ajustes" aria-expanded="false">Filtros e ajustes</button><div class="lx-extra"><div class="seg" id="lxf"><button data-f="todos" class="active">Todos</button><button data-f="nao">Não lidos</button><button data-f="star">Destacados</button><button data-f="nota">Com anotação</button><button data-f="marcas">Com marcações</button></div>' +
        '<span class="spacer"></span><div class="lx-font"><button class="btn xs ghost" data-a="fmenos" aria-label="Diminuir fonte">A−</button><button class="btn xs ghost" data-a="fmais" aria-label="Aumentar fonte">A+</button></div><label class="chk"><input type="checkbox" id="lxrealce"' + (st.realce ? ' checked' : '') + '> realçar termos de atenção</label><button class="btn xs ghost" data-a="leitura">Modo leitura</button></div></div>' +
        '<div class="lx-bar lx-bar2">' + (temCap ? '<select class="lx-capsel" id="lxcap" aria-label="Ir para capítulo/seção"><option value="">Ir para título/capítulo…</option>' + st.ctx.lista.map(function (c) { return '<option value="' + c.i + '">' + U.esc(c.txt.length > 90 ? c.txt.slice(0, 87) + '…' : c.txt) + '</option>'; }).join('') + '</select>' : '') +
        '<button class="btn xs ghost" data-a="cont" id="lxcont"' + (l.ultimoArt ? '' : ' hidden') + '>Continuar de onde parei' + (l.ultimoArt ? ' (' + U.esc(nome(l.ultimoArt)) + ')' : '') + '</button>' +
        '<span class="spacer"></span><span id="lxselbar" class="lx-selbar"></span><div class="lx-prog"><div class="prog"><i id="lxpb"></i></div><small id="lxp" class="muted"></small></div></div>' +
        '<div id="lxorf"></div><div class="lx-body" id="lxbody"></div></div>',
      buttons: [{ label: 'Fechar', cls: 'ghost' }]
    });
    var root = m.root, body = root.querySelector('#lxbody');
    root.querySelector('.modal').classList.add('lx-modal');
    var tb = document.createElement('div'); tb.className = 'lx-tb'; tb.hidden = true;
    tb.innerHTML = Object.keys(CATS).map(function (k) { return '<button class="mk-chip mk-' + k + '" data-cat="' + k + '">' + CAT_ICO[k] + ' ' + CATS[k] + '</button>'; }).join('');
    root.appendChild(tb);

    function aplicaFonte() { body.style.setProperty('--lx-fs', st.fonte + 'px'); }
    function barra() {
      var p = prog(l); root.querySelector('#lxp').textContent = p.lidos + ' de ' + p.n + ' lidos (' + Math.round(p.pct) + '%)'; root.querySelector('#lxpb').style.width = p.pct + '%';
      var sb = root.querySelector('#lxselbar'), n = st.sel.length;
      sb.innerHTML = n ? '<b>' + n + ' selecionado(s)</b> <button class="btn xs" data-a="gfc">Flashcards</button><button class="btn xs ghost" data-a="gia">✦ IA</button><button class="btn xs ghost" data-a="gq">Questões A–E</button>' + (n > 1 ? '<button class="btn xs ghost" data-a="gcmp">Comparar</button>' : '') + '<button class="btn xs ghost" data-a="selx">Limpar</button>' : '<button class="btn xs ghost" data-a="gfc">Gerar flashcards…</button>';
      var orf = l.orfaos || [];
      root.querySelector('#lxorf').innerHTML = orf.length ? '<div class="alert mid" style="display:block"><b>' + orf.length + ' artigo(s) da versão anterior</b> tinham anotações ou marcações e não existem mais com o mesmo número. Nada foi apagado: confira e descarte quando quiser.<ul style="margin:6px 0 0;padding-left:18px">' + orf.map(function (o, k) { return '<li>' + U.esc(nome(o.n)) + (o.nota ? ' — anotação: “' + U.esc(o.nota.slice(0, 80)) + '”' : '') + ((o.marks || []).length ? ' — ' + o.marks.length + ' marcação(ões)' : '') + ' <button class="btn xs ghost" data-orf-ver="' + k + '">ver</button><button class="btn xs ghost" data-orf-del="' + k + '">descartar</button></li>'; }).join('') + '</ul></div>' : '';
    }
    function desenhar() {
      var ids = filtrados(st), vis = ids.slice(0, st.limite);
      body.innerHTML = vis.length ? vis.map(function (i) { return artHtml(st, i); }).join('') + (ids.length > vis.length ? '<div class="empty"><button class="btn sm ghost" data-a="mais">Mostrar mais (' + (ids.length - vis.length) + ' restantes)</button></div>' : '') : '<div class="empty">Nada com esse filtro ou busca.</div>';
      barra(); observar();
    }
    function redesenhaArt(i) {
      var el = body.querySelector('#lx-a-' + i); if (!el) return desenhar();
      var w = document.createElement('div'); w.innerHTML = artHtml(st, i);
      var novo = w.querySelector('#lx-a-' + i); if (novo) el.replaceWith(novo); barra(); observar();
    }
    function observar() {
      if (typeof IntersectionObserver === 'undefined') return;
      if (st.obs) st.obs.disconnect();
      var t = null;
      st.obs = new IntersectionObserver(function (ents) {
        ents.forEach(function (en) { if (en.isIntersecting) { var i = +en.target.dataset.i; if (l.arts[i] && l.ultimoArt !== l.arts[i].n) { l.ultimoArt = l.arts[i].n; clearTimeout(t); t = setTimeout(function () { SOS.save(); }, 1200); } } });
      }, { root: root.querySelector('.modal-b'), rootMargin: '0px 0px -70% 0px' });
      ui.$$('.lx-art', body).forEach(function (a) { st.obs.observe(a); });
    }
    function ir(i) {
      if (filtrados(st).indexOf(i) < 0) { st.flt = 'todos'; st.q = ''; root.querySelector('#lxq').value = ''; ui.$$('#lxf button', root).forEach(function (b) { b.classList.toggle('active', b.dataset.f === 'todos'); }); }
      var pos = filtrados(st).indexOf(i); if (pos >= st.limite) st.limite = pos + 20;
      desenhar();
      var el = body.querySelector('#lx-c-' + i) || body.querySelector('#lx-a-' + i);
      if (el) { el.scrollIntoView({ block: 'start' }); var a2 = body.querySelector('#lx-a-' + i); if (a2) { a2.classList.add('flash'); setTimeout(function () { a2.classList.remove('flash'); }, 1600); } }
    }
    R._st = st; // para testes e integrações

    /* ---------- eventos ---------- */
    root.querySelector('#lxq').addEventListener('input', function (e) { st.q = e.target.value; clearTimeout(this._t); this._t = setTimeout(function () { st.limite = 80; desenhar(); }, 250); });
    root.querySelector('#lxq').addEventListener('keydown', function (e) { if (e.key === 'Enter') { var ids = filtrados(st); if (ids.length === 1) ir(ids[0]); } });
    root.querySelector('#lxf').addEventListener('click', function (e) { var b = e.target.closest('[data-f]'); if (!b) return; st.flt = b.dataset.f; st.limite = 80; ui.$$('#lxf button', root).forEach(function (x) { x.classList.toggle('active', x === b); }); desenhar(); });
    root.querySelector('#lxrealce').addEventListener('change', function (e) { st.realce = e.target.checked; s.leitorRealce = st.realce; SOS.save(); desenhar(); });
    var capSel = root.querySelector('#lxcap'); if (capSel) capSel.addEventListener('change', function () { if (capSel.value !== '') ir(+capSel.value); capSel.value = ''; });
    root.addEventListener('change', function (e) {
      var d = e.target.dataset;
      if (d.lido != null) { var a = l.arts[+d.lido]; a.lido = e.target.checked; a.lidoEm = a.lido ? U.today() : null; if (a.lido) l.ultimoArt = a.n; SOS.save(); redesenhaArt(+d.lido); }
      if (d.sel != null) { var i = +d.sel, k = st.sel.indexOf(i); if (e.target.checked && k < 0) st.sel.push(i); else if (!e.target.checked && k > -1) st.sel.splice(k, 1); st.sel.sort(function (x, y) { return x - y; }); var el = body.querySelector('#lx-a-' + i); if (el) el.classList.toggle('sel', e.target.checked); barra(); }
    });
    root.addEventListener('input', function (e) { if (e.target.dataset.nota != null) { l.arts[+e.target.dataset.nota].nota = e.target.value; SOS.save(); } });
    root.addEventListener('click', function (e) {
      var b, art = e.target.closest('.lx-art'), i = art ? +art.dataset.i : null;
      if ((b = e.target.closest('[data-cat]'))) { e.preventDefault(); return criarMarca(b.dataset.cat); }
      if ((b = e.target.closest('mark[data-mk]')) && i != null) return editarMarca(i, b.dataset.mk);
      if ((b = e.target.closest('[data-mk-edit]')) && i != null) return editarMarca(i, b.dataset.mkEdit);
      if ((b = e.target.closest('[data-orf-del]'))) { var k = +b.dataset.orfDel; return ui.confirm('Descartar as anotações e marcações do ' + U.esc(nome(l.orfaos[k].n)) + ' da versão anterior?', function () { l.orfaos.splice(k, 1); SOS.save(); barra(); }, 'Descartar'); }
      if ((b = e.target.closest('[data-orf-ver]'))) { var o = l.orfaos[+b.dataset.orfVer]; return ui.modal({ title: nome(o.n) + ' — versão anterior', wide: true, body: '<div class="lx-text lx-solo">' + textoHtml({ t: o.t, marks: (o.marks || []).filter(function (x) { return x.o != null; }) }, false, '') + '</div>' + (o.nota ? '<p><b>Anotação:</b> ' + U.esc(o.nota) + '</p>' : '') + ((o.marks || []).length ? '<ul>' + o.marks.map(function (x) { return '<li>' + CATS[x.cat] + ': “' + U.esc(x.trecho) + '”' + (x.nota ? ' — ' + U.esc(x.nota) : '') + '</li>'; }).join('') + '</ul>' : '') }); }
      if (!(b = e.target.closest('[data-a]'))) return;
      var act = b.dataset.a;
      if (act === 'fmais' || act === 'fmenos') { st.fonte = Math.max(14, Math.min(26, st.fonte + (act === 'fmais' ? 1 : -1))); s.leitorFonte = st.fonte; SOS.save(); return aplicaFonte(); }
      if (act === 'ajustes') { var lx = root.querySelector('.lx'); lx.classList.toggle('lx-aberto'); b.setAttribute('aria-expanded', lx.classList.contains('lx-aberto')); return; }
      if (act === 'leitura') { st.leitura = !st.leitura; root.querySelector('.lx').classList.toggle('lx-read', st.leitura); b.classList.toggle('active', st.leitura); b.textContent = st.leitura ? 'Sair do modo leitura' : 'Modo leitura'; return; }
      if (act === 'cont') { var ix = l.arts.findIndex(function (a) { return a.n === l.ultimoArt; }); return ix > -1 ? ir(ix) : null; }
      if (act === 'mais') { st.limite += 80; return desenhar(); }
      if (act === 'selx') { st.sel = []; return desenhar(); }
      if (act === 'star') { l.arts[i].star = !l.arts[i].star; SOS.save(); return redesenhaArt(i); }
      if (act === 'nota') { st.notaAberta[i] = true; redesenhaArt(i); var ta = body.querySelector('[data-nota="' + i + '"]'); if (ta) ta.focus(); return; }
      if (act === 'iaapagar') return ui.confirm('Apagar as explicações de IA guardadas deste artigo? O texto legal e suas anotações não são afetados.', function () { delete l.ia[l.arts[i].n]; SOS.save(); redesenhaArt(i); }, 'Apagar');
      if (act === 'fc') return R.gerarCards(l, [i], st);
      if (act === 'gfc') return R.gerarCards(l, st.sel.length ? st.sel.slice() : [], st);
      if (act === 'ia') return assistente([i]);
      if (act === 'gia') return assistente(st.sel.slice());
      if (act === 'gq') return R.pedirQuestoes(l, st.sel.slice());
      if (act === 'gcmp') return pedirIA('comparar_artigos', st.sel.slice());
    });

    /* ---------- destaques por trecho ---------- */
    function posicao(node, off) {
      if (!node) return null;
      if (node.nodeType === 3) { var el = node.parentElement && node.parentElement.closest('[data-o]'); return el ? +el.dataset.o + off : null; }
      var kids = node.childNodes;
      if (off < kids.length) { var k = kids[off], e2 = k.nodeType === 1 ? (k.matches('[data-o]') ? k : k.querySelector('[data-o]')) : null; if (e2) return +e2.dataset.o; }
      var all = node.querySelectorAll ? node.querySelectorAll('[data-o]') : []; if (all.length) { var last = all[all.length - 1]; return +last.dataset.o + last.textContent.length; }
      return null;
    }
    function selecaoAtual() {
      var sel = window.getSelection(); if (!sel || sel.isCollapsed || !sel.rangeCount) return null;
      var r = sel.getRangeAt(0), sa = (r.startContainer.nodeType === 1 ? r.startContainer : r.startContainer.parentElement), sb = (r.endContainer.nodeType === 1 ? r.endContainer : r.endContainer.parentElement);
      var ta = sa && sa.closest('.lx-text[data-art]'), tb2 = sb && sb.closest('.lx-text[data-art]');
      if (!ta || ta !== tb2) return { erro: 'Selecione um trecho dentro de um único artigo.' };
      var i = +ta.dataset.art, a = l.arts[i], o = posicao(r.startContainer, r.startOffset), e = posicao(r.endContainer, r.endOffset);
      if (o == null || e == null) return null;
      if (e < o) { var tmp = o; o = e; e = tmp; }
      while (o < e && /\s/.test(a.t.charAt(o))) o++;
      while (e > o && /\s/.test(a.t.charAt(e - 1))) e--;
      if (e - o < 2) return null;
      return { i: i, o: o, e: e, rect: r.getBoundingClientRect() };
    }
    function mostraTb() {
      var s2 = selecaoAtual();
      if (!s2 || s2.erro) { tb.hidden = true; if (s2 && s2.erro) ui.toast(s2.erro, 'mid'); return; }
      st.pendente = s2; tb.hidden = false;
      var w = tb.offsetWidth || 420, x = Math.max(8, Math.min(window.innerWidth - w - 8, s2.rect.left + s2.rect.width / 2 - w / 2)), y = s2.rect.top - 48;
      if (y < 8) y = s2.rect.bottom + 8;
      tb.style.left = x + 'px'; tb.style.top = y + 'px';
    }
    body.addEventListener('mouseup', function () { setTimeout(mostraTb, 10); });
    body.addEventListener('touchend', function () { setTimeout(mostraTb, 250); });
    body.addEventListener('keyup', function (e) { if (e.shiftKey) setTimeout(mostraTb, 10); });
    root.querySelector('.modal-b').addEventListener('scroll', function () { tb.hidden = true; });
    function criarMarca(cat) {
      var p = st.pendente; tb.hidden = true; if (!p) return;
      var a = l.arts[p.i], mk = Object.assign({ id: U.uid('mk'), cat: cat, o: p.o, e: p.e, trecho: a.t.slice(p.o, p.e), nota: '', criado: U.today(), orfa: false }, X.contexto(a.t, p.o, p.e));
      st.pendente = null; if (window.getSelection) window.getSelection().removeAllRanges();
      if (cat === 'nota') return editarMarca(p.i, null, mk);
      marks(a).push(mk); SOS.save(); redesenhaArt(p.i); ui.toast('Marcação “' + CATS[cat] + '” salva.', 'good');
    }
    function editarMarca(i, id, novo) {
      var a = l.arts[i], mk = novo || marks(a).find(function (x) { return x.id === id; }); if (!mk) return;
      ui.modal({ title: novo ? 'Minha anotação no trecho' : 'Editar marcação', body: '<p class="muted" style="margin-top:0">' + U.esc(nome(a.n)) + ': “' + U.esc(mk.trecho) + '”</p>' + (mk.orfa ? '<div class="alert mid">Depois da atualização da norma, este trecho não foi localizado com segurança. A marcação foi preservada; confira o texto novo.</div>' : '') + '<div class="form"><label class="f full"><span>Categoria</span><select name="cat">' + ui.opts(Object.keys(CATS).map(function (k) { return [k, CATS[k]]; }), mk.cat) + '</select></label><label class="f full"><span>Anotação (opcional; separada do texto legal)</span><textarea name="nota" rows="3">' + U.esc(mk.nota || '') + '</textarea></label></div>',
        buttons: [{ label: 'Cancelar', cls: 'ghost' }].concat(novo ? [] : [{ label: 'Remover marcação', cls: 'danger', onClick: function () { a.marks = marks(a).filter(function (x) { return x.id !== mk.id; }); SOS.save(); redesenhaArt(i); } }]).concat([{ label: 'Salvar', onClick: function (c, r) {
          mk.cat = ui.val(r, 'cat'); mk.nota = ui.val(r, 'nota').trim();
          if (mk.cat === 'nota' && !mk.nota) { ui.toast('Escreva a anotação.', 'bad'); return false; }
          if (novo) marks(a).push(mk); SOS.save(); redesenhaArt(i);
        } }]) });
    }

    /* ---------- assistente de IA ---------- */
    function assistente(idxs) {
      if (!idxs.length) return ui.toast('Selecione ao menos um artigo.', 'mid');
      var rot = idxs.length === 1 ? nome(l.arts[idxs[0]].n) : idxs.length + ' artigos';
      var acoes = ['explicar_artigo', 'pontos_importantes', 'analisar_excecoes', 'identificar_pegadinhas', 'comparar_artigos', 'gerar_flashcards_lei', 'gerar_questoes_lei'];
      ui.modal({ title: 'Assistente — ' + rot, body: '<p class="muted" style="margin-top:0">A IA explica e organiza; o texto legal continua sendo a referência. ' + (SOS.ia.rota() ? 'Usando a sua rota de IA.' : 'Sem rota de IA configurada: você poderá copiar o pedido para o Claude e colar a resposta.') + '</p><div class="lx-acoes">' + acoes.map(function (k) { var dis = k === 'comparar_artigos' && idxs.length < 2; return '<button class="btn ghost" data-ac="' + k + '"' + (dis ? ' disabled title="Selecione 2 ou mais artigos"' : '') + '>' + SOS.ia.ACOES[k] + '</button>'; }).join('') + '</div>',
        onOpen: function (r, close) { r.addEventListener('click', function (e) { var b = e.target.closest('[data-ac]'); if (!b || b.disabled) return; close(); var k = b.dataset.ac; if (k === 'gerar_flashcards_lei') R.gerarCards(l, idxs, st, 'ia'); else if (k === 'gerar_questoes_lei') R.pedirQuestoes(l, idxs); else pedirIA(k, idxs); }); },
        buttons: [{ label: 'Fechar', cls: 'ghost' }] });
    }
    function pedirIA(acao, idxs) {
      var dados = R.payload(l, idxs, st.ctx); if (!dados) return;
      SOS.ia.executar(acao, dados, function (res, info) {
        if (acao === 'comparar_artigos') return mostrarComparacao(idxs, res);
        var lista = acao === 'explicar_artigo' ? res.analises : res.itens, sobra = [];
        idxs.forEach(function (i) {
          var a = l.arts[i], meus = idxs.length === 1 ? lista : lista.filter(function (x) { return R.casaArtigo(x.artigo, a.n); });
          if (!meus.length) return;
          l.ia = l.ia || {}; l.ia[a.n] = l.ia[a.n] || {};
          l.ia[a.n][acao] = { em: U.today(), modo: info.modo, dados: acao === 'explicar_artigo' ? meus[0] : { itens: meus, limitacoes: res.limitacoes } };
        });
        if (idxs.length > 1) lista.forEach(function (x) { if (!idxs.some(function (i) { return R.casaArtigo(x.artigo, l.arts[i].n); })) sobra.push(x); });
        SOS.log('IA — ' + SOS.ia.ACOES[acao], normaCurta(l) + ' · ' + idxs.length + ' artigo(s)'); SOS.save();
        idxs.forEach(function (i) { redesenhaArt(i); });
        var el = body.querySelector('#lx-a-' + idxs[0] + ' .lx-ia'); if (el) el.scrollIntoView({ block: 'nearest' });
        ui.toast('Pronto: ' + SOS.ia.ACOES[acao] + ' — veja abaixo do artigo.', 'good');
        if (sobra.length) ui.modal({ title: SOS.ia.ACOES[acao] + ' — itens sem artigo identificado', body: '<ul>' + sobra.map(function (x) { return '<li>' + U.esc(x.artigo ? x.artigo + ': ' : '') + U.esc(x.conceito_central || x.texto || '') + '</li>'; }).join('') + '</ul>' });
      }, SOS.ia.ACOES[acao] + ' — ' + (idxs.length === 1 ? nome(l.arts[idxs[0]].n) : idxs.length + ' artigos'));
    }
    function mostrarComparacao(idxs, res) {
      var e = U.esc, arts = idxs.map(function (i) { return nome(l.arts[i].n); });
      ui.modal({ title: 'Comparação — ' + arts.join(' × '), wide: true,
        body: '<p class="muted" style="margin-top:0">✦ Gerado por IA a partir do texto enviado. Confira no dispositivo.</p><div class="tbl-wrap"><table><thead><tr><th>Aspecto</th>' + arts.map(function (a) { return '<th>' + e(a) + '</th>'; }).join('') + '</tr></thead><tbody>' + res.aspectos.map(function (as) { return '<tr><td><b>' + e(as.aspecto) + '</b></td>' + idxs.map(function (i) { var v = as.valores.find(function (x) { return R.casaArtigo(x.artigo, l.arts[i].n); }); return '<td>' + e(v ? v.texto : '—') + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>' +
          (res.complementares ? '<p><b>Como se complementam:</b> ' + e(res.complementares) + '</p>' : '') + (res.como_nao_confundir ? '<p><b>Como não confundir:</b> ' + e(res.como_nao_confundir) + '</p>' : '') + (res.limitacoes ? '<p class="muted"><b>Limitações:</b> ' + e(res.limitacoes) + '</p>' : ''),
        buttons: [{ label: 'Fechar', cls: 'ghost' }, { label: 'Gerar flashcards de comparação', onClick: function () { setTimeout(function () { R.gerarCards(l, idxs, st, 'ia', 'comparacao'); }, 20); } }] });
    }

    aplicaFonte(); desenhar();
    if (irPara != null) { var ix = l.arts.findIndex(function (a) { return String(a.n) === String(irPara); }); if (ix > -1) setTimeout(function () { ir(ix); }, 30); }
    return st;
  };

  /* artigo da resposta da IA ("Art. 5º", "art. 5", "5") corresponde ao número do artigo? */
  R.casaArtigo = function (txt, n) {
    var m = String(txt || '').match(/(\d+)(?:\s*[ºo°])?(?:\s*-\s*([A-Z]))?/i); if (!m) return false;
    return (m[1] + (m[2] ? '-' + m[2].toUpperCase() : '')) === String(n).toUpperCase();
  };
  R.payload = function (l, idxs, ctx) {
    ctx = ctx || contexto(l);
    var arts = idxs.map(function (i) { var a = l.arts[i]; return { id: l.id + ':' + a.n, numero: /^\d/.test(a.n) ? nome(a.n) : a.n, texto: a.t, capitulo: ctx.cap[i] || '' }; });
    var tot = arts.reduce(function (s, a) { return s + a.texto.length; }, 0);
    if (!arts.length) { ui.toast('Selecione ao menos um artigo.', 'mid'); return null; }
    if (tot > LIMITE_CHARS_IA) { ui.toast('Texto grande demais para um pedido (' + Math.round(tot / 1000) + ' mil caracteres). Selecione menos artigos.', 'mid', 6000); return null; }
    return { norma: l.nome, artigos: arts };
  };

  /* ---------- geração de flashcards (regras ou IA) → fila de aprovação existente ---------- */
  R.gerarCards = function (l, idxs, st, motorIni, foco) {
    var ctx = (st && st.ctx) || contexto(l), sel = (st && st.sel) || [];
    var dest = l.arts.map(function (a, i) { return i; }).filter(function (i) { return l.arts[i].star || marks(l.arts[i]).length; });
    var caps = ctx.lista;
    var escIni = idxs.length === 1 ? 'atual' : idxs.length ? 'sel' : dest.length ? 'dest' : caps.length ? 'cap' : 'atual';
    var body = '<div class="form"><label class="f full"><span>Quais artigos</span><select name="esc">' +
      (idxs.length === 1 ? '<option value="atual">Este artigo (' + U.esc(nome(l.arts[idxs[0]].n)) + ')</option>' : '') +
      '<option value="sel"' + (sel.length ? '' : ' disabled') + '>Selecionados (' + sel.length + ')</option><option value="dest"' + (dest.length ? '' : ' disabled') + '>Destacados ou com marcações (' + dest.length + ')</option>' +
      (caps.length ? caps.map(function (c, k) { return '<option value="cap' + k + '">Capítulo: ' + U.esc(c.txt.length > 70 ? c.txt.slice(0, 67) + '…' : c.txt) + '</option>'; }).join('') : '') + '</select></label>' +
      '<label class="f"><span>Nível</span><select name="nivel">' + ui.opts(X.NIVEIS, foco === 'comparacao' ? 'intermediario' : 'intermediario') + '</select></label>' +
      '<label class="f"><span>Como gerar</span><select name="motor">' + ui.opts([['regras', 'Regras do StudyOS (sem IA)'], ['ia', 'IA (rota ou copiar e colar)']], motorIni || 'regras') + '</select></label></div>' +
      '<p class="muted" style="font-size:13px"><b>Essencial:</b> conceitos, regras, competências e exceções. <b>Intermediário:</b> + prazos, requisitos e literalidade de vedações. <b>Reta final:</b> + palavras restritivas e detalhes que invertem o sentido. Os cartões vão para <b>Flashcards › Para aprovar</b>: você edita, aprova ou descarta.</p><div id="gprev"></div>';
    function alvo(r) {
      var v = ui.val(r, 'esc');
      if (v === 'atual') return idxs.slice(0, 1);
      if (v === 'sel') return sel.slice();
      if (v === 'dest') return dest.slice();
      if (/^cap/.test(v)) { var k = +v.slice(3), ini = caps[k].i, fim = caps[k + 1] ? caps[k + 1].i : l.arts.length; var out = []; for (var i = ini; i < fim; i++) out.push(i); return out; }
      return [];
    }
    function prev(r) {
      var a = alvo(r), box = r.querySelector('#gprev');
      if (ui.val(r, 'motor') === 'ia') { box.innerHTML = '<div class="alert info">A IA escolhe o tipo de cartão (conceito, regra e exceção, prazos e competências, literalidade, comparação, aplicação prática) para ' + a.length + ' artigo(s)' + (foco === 'comparacao' ? ', com foco nas diferenças entre eles' : '') + '.</div>'; return null; }
      var ds = []; a.forEach(function (i) { ds = ds.concat(X.cardsPorRegras(l, l.arts[i], ui.val(r, 'nivel'))); });
      var novos = ds.filter(function (d) { return !SOS.cards.jaExiste(d); });
      box.innerHTML = '<p><b>' + novos.length + '</b> cartão(ões) novo(s)' + (ds.length > novos.length ? ' · ' + (ds.length - novos.length) + ' ignorado(s) por já existirem' : '') + '.</p>' + (novos.length ? '<div class="lx-prev">' + novos.slice(0, 40).map(function (d) { return '<div class="list-item"><span class="tag">' + U.esc(d.tipo) + '</span> <b>' + U.esc(d.frente) + '</b><br><small>→ ' + U.esc(d.verso) + ' · <i>' + U.esc(d.fundamento) + '</i></small></div>'; }).join('') + '</div>' : '<div class="empty">Nenhum cartão útil encontrado por regras nestes artigos (as regras procuram prazos, quóruns, competências, exceções, definições e vedações). Tente o nível “Reta final” ou a IA.</div>');
      return novos;
    }
    ui.modal({ title: 'Gerar flashcards — ' + normaCurta(l), wide: true, body: body,
      onOpen: function (r) { if (escIni && r.querySelector('[name=esc] option[value="' + escIni + '"]:not([disabled])')) r.querySelector('[name=esc]').value = escIni; r.addEventListener('change', function () { prev(r); }); prev(r); },
      buttons: [{ label: 'Cancelar', cls: 'ghost' }, { label: 'Enviar para aprovação', cls: 'good', onClick: function (c, r) {
        var a = alvo(r); if (!a.length) { ui.toast('Nenhum artigo nesse escopo.', 'mid'); return false; }
        var nivel = ui.val(r, 'nivel');
        if (ui.val(r, 'motor') === 'ia') {
          var dados = R.payload(l, a, ctx); if (!dados) return false;
          dados.nivel = nivel; if (foco) dados.foco = foco;
          setTimeout(function () { SOS.ia.executar('gerar_flashcards_lei', dados, function (res, info) { var n = R.cardsDaIA(l, a, res.cards, nivel); ui.toast(n + ' cartão(ões) da IA na fila de aprovação' + (res.cards.length > n ? ' (' + (res.cards.length - n) + ' ignorado(s) por duplicidade)' : '') + '. Veja em Flashcards › Para aprovar.', n ? 'good' : 'mid', 6000); SOS.app.renderNav(); }, 'Flashcards da lei'); }, 20);
          return;
        }
        var ns = prev(r) || [], n = 0;
        ns.forEach(function (d) { if (SOS.cards.addDraft(d)) n++; });
        SOS.log('Flashcards da lei (regras)', normaCurta(l) + ' · ' + n + ' cartão(ões)'); SOS.save(); SOS.app.renderNav();
        ui.toast(n + ' cartão(ões) na fila de aprovação (Flashcards › Para aprovar).', n ? 'good' : 'mid', 5000);
      } }] });
  };
  /* converte os cartões da IA em rascunhos da fila existente (com referência legal em campo próprio) */
  R.cardsDaIA = function (l, idxs, cards, nivel) {
    var n = 0, norma = normaCurta(l);
    cards.forEach(function (c) {
      var i = idxs.find(function (k) { return R.casaArtigo(c.artigo || c.fundamento, l.arts[k].n); });
      if (i == null && idxs.length === 1) i = idxs[0];
      var a = i != null ? l.arts[i] : null;
      var d = { frente: c.frente, verso: c.verso, tipo: c.tipo || 'Dispositivo legal', fundamento: (c.fundamento || (a ? nome(a.n) : '')) + (norma && (c.fundamento || a) ? ' — ' + norma : ''), explicacao: c.explicacao || '', topicId: l.topicId || '', origem: 'Legislação', nivel: nivel, ia: true, tags: ['Lei_Seca'].concat(c.tags || []).map(function (t) { return String(t).replace(/\s+/g, '_'); }), leiRef: a ? { leiId: l.id, n: a.n, disp: '' } : null, ref: 'lexia:' + l.id + ':' + U.norm(c.frente).slice(0, 80) };
      if (SOS.cards.addDraft(d)) n++;
    });
    SOS.log('Flashcards da lei (IA)', norma + ' · ' + n + ' cartão(ões)'); SOS.save();
    return n;
  };

  R.pedirQuestoes = function (l, idxs) {
    if (!idxs.length) return ui.toast('Selecione ao menos um artigo (caixinha ao lado do número).', 'mid', 5000);
    ui.modal({ title: 'Criar questões no estilo Selecon', body: '<p class="muted" style="margin-top:0">Questões de 5 alternativas (A–E), uma correta, alternando comandos CORRETA / INCORRETA / EXCETO, com comentário de cada alternativa. <b>São geradas por IA e não são questões oficiais da Selecon.</b></p><div class="form"><label class="f"><span>Quantidade</span><select name="qtd">' + ui.opts(['3', '5', '8', '10'], '5') + '</select></label></div>',
      buttons: [{ label: 'Cancelar', cls: 'ghost' }, { label: 'Gerar', onClick: function (c, r) {
        var dados = R.payload(l, idxs); if (!dados) return false;
        dados.quantidade = +ui.val(r, 'qtd') || 5;
        setTimeout(function () { SOS.ia.executar('gerar_questoes_lei', dados, function (res, info) { var qs = SOS.leisQ.adicionar(l, idxs, res.questoes, info.modo); ui.toast(qs.length + ' questão(ões) criada(s).', 'good'); if (qs.length) SOS.leisQ.resolver(qs); }, 'Questões A–E'); }, 20);
      } }] });
  };
})();
