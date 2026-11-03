/* Banco de questões (TEC Concursos + questões próprias): importação/sincronização com a extensão,
   mapeamento assunto TEC → tópico do edital, meus cadernos, treino/simulado, integração com
   Caderno de Erros, estatísticas, flashcards e discursivas. */
(function () {
  var SOS = window.SOS, U = SOS.U, ui = SOS.ui, E = SOS.E;
  var T = SOS.tec = {};
  var tab = 'questoes', f = { disc: '', topic: '', banca: '', res: '', cad: '', q: '', com: '' };
  var page = 0, PER = 30;

  /* ---------- estado ---------- */
  T.st = function () {
    var S = SOS.S;
    if (!S.tec) S.tec = {};
    var t = S.tec;
    t.qs = t.qs || {}; t.cads = t.cads || {}; t.aliasAss = t.aliasAss || {}; t.aliasMat = t.aliasMat || {};
    t.removidos = t.removidos || {}; t.cadTrack = t.cadTrack || {}; t.erroIgnorado = t.erroIgnorado || {}; t.treinos = t.treinos || [];
    if (!S.cadernos) S.cadernos = [];
    return t;
  };
  T.list = function () { var q = T.st().qs; return Object.keys(q).map(function (k) { return q[k]; }); };
  T.fp = function (enun) { return U.norm(enun).slice(0, 300); };

  /* ---------- matéria do TEC → disciplina do StudyOS ---------- */
  var KW = [
    [/l[ií]ngua portuguesa|portugu[eê]s|gram[aá]tica|reda[cç][aã]o(?! oficial)|interpreta[cç][aã]o de texto/, 'LP'],
    [/racioc[ií]nio|matem[aá]tica|l[oó]gica|estat[ií]stica/, 'RLM'],
    [/inform[aá]tica|tecnologia da informa|computa/, 'INF'],
    [/hist[oó]ria.*mato grosso|geografia.*mato grosso|mato grosso/, 'HGMT'],
    [/[eé]tica|filosofia/, 'ETI'],
    [/rela[cç][oõ]es (humanas|interpessoais)|atendimento/, 'RI'],
    [/direito administrativo|licita|improbidade/, 'DA'],
    [/direito constitucional|constitui[cç][aã]o/, 'DC'],
    [/administra[cç][aã]o p[uú]blica|administra[cç][aã]o geral|gest[aã]o p[uú]blica|pol[ií]ticas p[uú]blicas|afo|or[cç]ament/, 'AP'],
    [/lgpd|prote[cç][aã]o de dados|acesso [aà] informa|13\.?460|usu[aá]rio do servi[cç]o/, 'LEGF'],
    [/ouvidoria/, 'OUVD'],
    [/reda[cç][aã]o oficial|arquivolog|correspond[eê]ncia/, 'RDA'],
    [/processo legislativo|poder legislativo|regimento interno/, 'PLM'],
    [/contabilidade|seguran[cç]a do trabalho|fotografia/, 'TCX'],
    [/legisla[cç][aã]o (municipal|local)|lei org[aâ]nica|estatuto (dos|do) servidor/, 'LEGC'],
    [/hist[oó]ria|geografia|atualidades|conhecimentos gerais/, 'CGB']
  ];
  T.inferDisc = function (q) {
    var key = U.norm(q.mat || '');
    var st = T.st();
    if (key && st.aliasMat[key]) return st.aliasMat[key];
    var s = String((q.mat || '') + ' ' + (q.ass || '')).toLowerCase();
    for (var i = 0; i < KW.length; i++) if (KW[i][0].test(s)) return KW[i][1];
    return '';
  };
  /* ---------- assunto do TEC → tópico do edital ---------- */
  T.assKey = function (q) { return U.norm((q.mat || '') + ' | ' + (q.ass || '')); };
  T.suggest = function (q) {
    var disc = q.disc || T.inferDisc(q), ass = q.ass || q.mat || '';
    return SOS.S.topicos.map(function (t) {
      var s = U.similar(ass, t.titulo);
      var a = U.norm(ass), b = U.norm(t.titulo);
      if (a && (b.indexOf(a) > -1 || a.indexOf(b.split(':')[0]) > -1)) s += 0.35;
      if (disc && t.disc === disc) s += 0.2; else if (disc) s -= 0.15;
      return { t: t, s: s };
    }).sort(function (x, y) { return y.s - x.s; }).slice(0, 6);
  };
  T.resolveTopic = function (q) {
    var st = T.st(), k = T.assKey(q), al = st.aliasAss[k];
    if (al) return al.topicId; // pode ser 'none'
    var sug = T.suggest(q)[0];
    if (sug && sug.s >= 0.6) { st.aliasAss[k] = { topicId: sug.t.id, auto: true, label: (q.mat || '') + ' › ' + (q.ass || '') }; return sug.t.id; }
    return null; // pendente: perguntar
  };
  T.pendingAssuntos = function () {
    var seen = {}, out = [];
    T.list().forEach(function (q) { if (q.topicId) return; var k = T.assKey(q); if (seen[k]) { seen[k].n++; return; } seen[k] = { k: k, q: q, n: 1 }; out.push(seen[k]); });
    return out;
  };
  T.setAlias = function (k, topicId, label) {
    var st = T.st();
    st.aliasAss[k] = { topicId: topicId, auto: false, label: label };
    T.list().forEach(function (q) { if (T.assKey(q) === k) q.topicId = topicId; });
    T.syncDerived();
  };

  /* ---------- importação / mesclagem ---------- */
  function fromV1(e) { return { id: e.id, d: e.d, t: e.t, v: e.v || 1, ds: e.ds || [e.d], hist: (e.ds || [e.d]).map(function (d, i) { return { d: d, t: (e.t || 0) + i, r: 'E', m: e.marc, src: 'tec' }; }), mat: e.mat, ass: e.ass, cad: e.cad, banca: e.banca, orgao: e.orgao, ano: e.ano, enun: e.enun, alts: e.alts || [], marc: e.marc, gab: e.gab, com: e.com, prof: e.prof, url: e.url, ult: 'E' }; }
  T.importData = function (obj, silent) {
    if (typeof obj === 'string') obj = JSON.parse(obj);
    if (!obj || (!Array.isArray(obj.qs) && !Array.isArray(obj.erros))) throw new Error('JSON não é da extensão StudyOS/TEC.');
    var st = T.st(), incoming = Array.isArray(obj.qs) ? obj.qs : obj.erros.map(fromV1);
    var byFp = {}; T.list().forEach(function (q) { if (q.enun) byFp[T.fp(q.enun)] = q; });
    var novos = 0, atual = 0, ign = 0, repet = 0;
    incoming.forEach(function (n) {
      if (!n || !n.id) return;
      var fp = n.enun ? T.fp(n.enun) : null;
      if (st.removidos[n.id] || (fp && st.removidos['fp:' + fp])) { ign++; return; }
      var ex = st.qs[n.id] || (fp && byFp[fp]);
      if (!ex) {
        var q = JSON.parse(JSON.stringify(n)); q.hist = q.hist || []; q.ds = q.ds || []; q.v = q.v || 0; q.origem = q.origem || 'tec';
        st.qs[q.id] = q; if (fp) byFp[fp] = q; novos++; return;
      }
      var antes = JSON.stringify(ex);
      ['mat', 'ass', 'banca', 'orgao', 'ano', 'cargo', 'enun', 'marc', 'gab', 'prof', 'url', 'cad', 'cadId', 'formato', 'ult'].forEach(function (k) { if (n[k] && !ex[k + 'Editado']) ex[k] = n[k]; });
      if (n.alts && n.alts.length && !ex.altsEditado) ex.alts = n.alts;
      if (n.com && n.com !== ex.com) ex.com = n.com;
      if (n.est) ex.est = Object.assign({}, ex.est || {}, n.est);
      var have = {}; (ex.hist || []).forEach(function (h) { have[h.t + h.r] = 1; });
      (n.hist || []).forEach(function (h) { if (!have[h.t + h.r]) { ex.hist.push(h); have[h.t + h.r] = 1; } });
      ex.hist.sort(function (a, b) { return a.t - b.t; });
      if ((n.v || 0) > (ex.vTec || 0)) { if (ex.vTec != null && n.v > ex.vTec) repet++; ex.v = (ex.v || 0) + (n.v - (ex.vTec || 0)); ex.vTec = n.v; }
      var dsHave = {}; (ex.ds || []).forEach(function (d) { dsHave[d] = (dsHave[d] || 0) + 1; });
      ex.ds = ex.ds || []; (n.ds || []).forEach(function (d) { if (!dsHave[d]) { ex.ds.push(d); } else dsHave[d]--; });
      if (JSON.stringify(ex) !== antes) atual++;
    });
    // primeira importação: guarda a contagem do TEC (vTec) para detectar repetições futuras
    T.list().forEach(function (q) { if (q.vTec == null && q.origem === 'tec') q.vTec = q.v || 0; });
    (obj.cads || []).forEach(function (c) { var a = st.cads[c.id]; if (!a || c.res >= a.res) st.cads[c.id] = Object.assign({}, a || {}, c); });
    T.syncDerived();
    st.ultimaSync = new Date().toISOString();
    SOS.save();
    var r = { novos: novos, atualizados: atual, ignorados: ign, repetidas: repet };
    if (!silent) ui.toast('Importação: ' + novos + ' nova(s), ' + atual + ' atualizada(s)' + (ign ? ', ' + ign + ' removida(s) por você ignorada(s)' : '') + '.', 'good', 6000);
    else if (novos || repet) ui.toast('TEC sincronizado: ' + novos + ' questão(ões) nova(s)' + (repet ? ', ' + repet + ' erro(s) repetido(s)' : '') + '.', 'good', 4000);
    return r;
  };

  /* ---------- derivados: estatísticas (sessões), Caderno de Erros, cadernos do TEC ---------- */
  T.syncDerived = function () {
    var S = SOS.S, st = T.st();
    T.list().forEach(function (q) {
      if (!q.disc) q.disc = T.inferDisc(q);
      if (!q.topicId) q.topicId = T.resolveTopic(q);
    });
    // 1) sessões automáticas por dia × tópico (uma tentativa = uma questão)
    var before = {}; S.sessoes.forEach(function (s) { if (s.origem === 'TEC') before[s.id] = s; });
    var groups = {};
    T.list().forEach(function (q) {
      if (!q.topicId || q.topicId === 'none' || !SOS.topic(q.topicId)) return;
      (q.hist || []).forEach(function (h) {
        var k = 'tec-' + h.d + '-' + q.topicId;
        var g = groups[k] = groups[k] || { id: k, topicId: q.topicId, data: h.d, metodo: 'Questões', planejadoMin: 0, realizadoMin: 0, total: 0, acertos: 0, origem: 'TEC', obs: 'Questões resolvidas (TEC/treino) — registro automático' };
        g.total++; if (h.r === 'A') g.acertos++;
      });
    });
    S.sessoes = S.sessoes.filter(function (s) { return s.origem !== 'TEC'; });
    Object.keys(groups).sort().forEach(function (k) {
      var g = groups[k], old = before[k];
      if (old) { g.realizadoMin = old.realizadoMin || 0; g.obs = old.obs || g.obs; }
      S.sessoes.push(g);
      if (!old) E.applySessionToTopic(g);
    });
    // 2) Caderno de Erros: cada questão errada vira (ou atualiza) um erro
    T.list().forEach(function (q) {
      if (!(q.v > 0)) return;
      var er = S.erros.find(function (e) { return e.tecId === q.id; });
      var ign = st.erroIgnorado[q.id];
      if (!er) {
        if (ign != null && q.v <= ign) return; // você excluiu este erro e não errou de novo
        var alt = function (l) { var a = (q.alts || []).find(function (x) { return x.l === l; }); return l ? l + (a ? ') ' + a.t : '') : ''; };
        var t = q.topicId && q.topicId !== 'none' ? SOS.topic(q.topicId) : null;
        er = { id: U.uid('e'), origem: 'TEC', tecId: q.id, topicId: t ? t.id : '', data: (q.ds && q.ds[0]) || q.d || U.today(), banca: q.banca || '', prova: [q.banca, q.ano, q.orgao, q.cargo].filter(Boolean).join(' · '),
          enunciado: q.enun || '', marcada: alt(q.marc), correta: alt(q.gab), justificativa: q.com ? q.com + (q.prof ? '\n— ' + q.prof : '') : '', porque: '', aprender: '', obs: 'Importado do TEC' + (q.cad ? ' (' + q.cad + ')' : ''), link: q.url || '', imagem: '',
          categorias: [], status: 'Novo', ocorrencias: q.v, flashcardIds: [], concursos: t ? t.concursos.slice() : [], rev: E.erroNew((q.ds && q.ds[q.ds.length - 1]) || U.today()) };
        S.erros.push(er);
        if (t) t.bonusErro = (t.bonusErro || 0) + 0.5;
      } else {
        while ((er.ocorrencias || 1) < q.v) E.erroRepeat(er);
        if (!er.justificativa && q.com) er.justificativa = q.com + (q.prof ? '\n— ' + q.prof : '');
        if (!er.topicId && q.topicId && q.topicId !== 'none' && SOS.topic(q.topicId)) { er.topicId = q.topicId; er.concursos = SOS.topic(q.topicId).concursos.slice(); }
      }
    });
    // 3) cadernos do TEC em modo automático: registra só o que não foi capturado questão a questão
    Object.keys(st.cads).forEach(function (id) {
      var c = st.cads[id], tr = st.cadTrack[id];
      if (!tr || tr.mode !== 'auto' || !tr.topicId || !SOS.topic(tr.topicId)) return;
      var cap = T.capturedIn(c);
      var unRes = Math.max(0, c.res - cap.res), unAc = Math.max(0, c.ac - cap.ac);
      var dRes = unRes - (tr.baseRes || 0), dAc = unAc - (tr.baseAc || 0);
      if (dRes > 0) {
        var s = { id: U.uid('s'), topicId: tr.topicId, data: U.today(), metodo: 'Questões', planejadoMin: 0, realizadoMin: 0, total: dRes, acertos: Math.max(0, Math.min(dRes, dAc)), origem: 'TEC-cad', obs: 'Caderno TEC: ' + c.cad + ' (resolvidas fora da extensão)' };
        S.sessoes.push(s); E.applySessionToTopic(s);
        tr.baseRes = unRes; tr.baseAc = unAc;
      }
    });
  };
  T.capturedIn = function (c) {
    var res = 0, ac = 0;
    T.list().forEach(function (q) { if (q.cadId === c.id || (!q.cadId && q.cad && q.cad === c.cad)) (q.hist || []).forEach(function (h) { if (h.src !== 'sos') { res++; if (h.r === 'A') ac++; } }); });
    return { res: res, ac: ac };
  };

  /* ---------- ponte com a extensão (postMessage) ---------- */
  var SID = U.uid('sid');
  T.bridgeSeen = null;
  window.addEventListener('message', function (ev) {
    if (ev.source !== window || !ev.data || ev.data.src !== 'tec-bridge') return;
    if (ev.data.t === 'ping') { T.bridgeSeen = Date.now(); window.postMessage({ src: 'tec-panel', t: 'pong', sid: SID }, '*'); return; }
    if (ev.data.t === 'backupInfo') { T.extBackup = ev.data.info; if (SOS.app && SOS.app.renderBanner) SOS.app.renderBanner(); return; }
    if (ev.data.t === 'backupData') {
      var b = ev.data.backup; if (!b) return ui.toast('A extensão não tem cópia guardada.', 'mid');
      try { SOS.importJSON(JSON.parse(b.data), 'replace'); SOS.recoveredFrom = null; T.extBackup = null; SOS.app.applyTheme(); SOS.app.render(); ui.toast('Dados restaurados da cópia da extensão (' + new Date(b.when).toLocaleString('pt-BR') + ').', 'good', 6000); }
      catch (e) { ui.toast('Não foi possível restaurar: ' + e.message, 'bad', 6000); }
      return;
    }
    if (ev.data.t === 'data' && SOS.S) {
      try { T.importData(ev.data.json, true); if (/^#tec/.test(location.hash) || /^#(erros|dashboard)/.test(location.hash)) SOS.app.render(); else SOS.app.renderNav(); }
      catch (e) { console.warn('StudyOS: falha ao sincronizar com a extensão', e); }
    }
  });

  /* cópia automática do StudyOS dentro da extensão (no máximo a cada 20 s, só se houver dados) */
  T.hasData = function (S) { S = S || SOS.S; return !!(S && (S.sessoes.length || S.erros.length || S.flashcards.length || S.atividades.length || S.discursivas.length || Object.keys((S.tec || {}).qs || {}).length)); };
  var lastBk = 0, bkTimer = null;
  T.pushBackup = function () {
    if (!T.bridgeSeen || Date.now() - T.bridgeSeen > 15000 || !T.hasData()) return;
    clearTimeout(bkTimer);
    var wait = Math.max(0, 20000 - (Date.now() - lastBk));
    bkTimer = setTimeout(function () {
      lastBk = Date.now();
      var S = SOS.S;
      window.postMessage({ src: 'tec-panel', t: 'backup', when: new Date().toISOString(), where: location.href.split('#')[0], resumo: S.sessoes.length + ' registros · ' + S.erros.length + ' erros · ' + S.flashcards.length + ' flashcards', data: JSON.stringify({ app: 'StudyOS', data: S }) }, '*');
    }, wait);
  };
  T.requestBackup = function () { window.postMessage({ src: 'tec-panel', t: 'getBackup' }, '*'); };

  /* ---------- utilidades de exibição ---------- */
  function resOf(q) { var h = q.hist || []; return h.length ? h[h.length - 1].r : q.ult || null; }
  function altText(q, l) { var a = (q.alts || []).find(function (x) { return x.l === l; }); return a ? a.t : ''; }
  function inConc(q) { var c = SOS.app.conc; if (c === 'all') return true; var t = q.topicId && SOS.topic(q.topicId); return t ? t.concursos.indexOf(c) > -1 : false; }
  function filtered() {
    return T.list().filter(function (q) {
      if (!inConc(q)) return false;
      if (f.disc && q.disc !== f.disc) return false;
      if (f.topic && q.topicId !== f.topic) return false;
      if (f.banca && (q.banca || '') !== f.banca) return false;
      if (f.res === 'E' && resOf(q) !== 'E') return false;
      if (f.res === 'A' && resOf(q) !== 'A') return false;
      if (f.res === 'rep' && !(q.v > 1)) return false;
      if (f.res === 'nunca' && (q.hist || []).length) return false;
      if (f.com === 'sim' && !q.com) return false;
      if (f.com === 'nao' && q.com) return false;
      if (f.cad && !(SOS.S.cadernos.find(function (c) { return c.id === f.cad; }) || { qids: [] }).qids.includes(q.id)) return false;
      if (f.q && U.norm([q.enun, q.ass, q.mat, q.com].join(' ')).indexOf(U.norm(f.q)) < 0) return false;
      return true;
    }).sort(function (a, b) { return (b.t || 0) - (a.t || 0); });
  }

  /* ---------- view ---------- */
  SOS.views.tec = {
    render: function (el, qs) {
      T.st();
      var all = T.list(), pend = T.pendingAssuntos();
      var bridgeOn = T.bridgeSeen && Date.now() - T.bridgeSeen < 10000;
      var h = '<div class="row" style="margin-bottom:12px"><span class="tag ' + (bridgeOn ? 'good' : '') + '">' + (bridgeOn ? '● Extensão conectada — sincronização automática' : '○ Extensão não detectada nesta página') + '</span>' + (T.st().ultimaSync ? '<small class="muted">última sincronização: ' + new Date(T.st().ultimaSync).toLocaleString('pt-BR') + '</small>' : '') + '<span class="spacer"></span><button class="btn ghost sm" data-act="manual">+ Questão própria</button><button class="btn sm" data-act="treino">Treinar / simulado</button></div>';
      if (pend.length) h += '<div class="alert mid"><span><b>' + pend.length + '</b> assunto(s) do TEC ainda sem tópico do edital — as tentativas deles não entram nas estatísticas até você associar.</span><button class="btn sm" data-tab="mapa">Associar agora</button></div>';
      h += '<div class="tabs">' + [['questoes', 'Questões (' + all.length + ')'], ['cadernos', 'Meus cadernos (' + SOS.S.cadernos.length + ')'], ['tec', 'Cadernos do TEC (' + Object.keys(T.st().cads).length + ')'], ['mapa', 'Associar assuntos' + (pend.length ? ' (' + pend.length + ')' : '')], ['treinos', 'Treinos feitos (' + T.st().treinos.length + ')'], ['io', 'Importar / extensão']].map(function (x) { return '<button class="tab ' + (tab === x[0] ? 'active' : '') + '" data-tab="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>';
      if (tab === 'questoes') h += vQuestoes();
      else if (tab === 'cadernos') h += vCadernos();
      else if (tab === 'tec') h += vCadTec();
      else if (tab === 'mapa') h += vMapa(pend);
      else if (tab === 'treinos') h += vTreinos();
      else h += vIO();
      el.innerHTML = h;
      el.onclick = onClick; el.onchange = onChange;
      var qs2 = el.querySelector('[data-f=q]'); if (qs2) qs2.addEventListener('input', function () { f.q = qs2.value; page = 0; clearTimeout(qs2._t); qs2._t = setTimeout(function () { SOS.app.render(); var n = document.querySelector('[data-f=q]'); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }, 300); });
    }
  };

  function vQuestoes() {
    var list = filtered(), bancas = [];
    T.list().forEach(function (q) { if (q.banca && bancas.indexOf(q.banca) < 0) bancas.push(q.banca); });
    var errs = list.filter(function (q) { return q.v > 0; }).length, rep = list.filter(function (q) { return q.v > 1; }).length;
    var tent = 0, ac = 0; list.forEach(function (q) { (q.hist || []).forEach(function (x) { tent++; if (x.r === 'A') ac++; }); });
    var h = '<div class="grid g4">' + k('Questões', list.length) + k('Tentativas', tent, ui.pctBadge(U.pct(ac, tent)) + ' de acerto') + k('Com erro', errs) + k('Erradas 2× ou mais', rep) + '</div>';
    h += '<div class="alert info section" style="display:block">Questões resolvidas no TEC entram <b>sozinhas</b> nas estatísticas (por tópico e dia) e os erros vão para o Caderno de Erros. <b>Não registre de novo</b> essas questões em “Registrar estudo” — se quiser anotar o tempo, edite a sessão automática em Questões e desempenho deixando os campos de questões como estão.</div>';
    h += '<div class="card"><div class="row" style="margin-bottom:10px"><input type="search" data-f="q" placeholder="Buscar no enunciado/comentário…" value="' + U.esc(f.q) + '" style="max-width:220px"><select data-f="disc">' + ui.discOptions(f.disc, true) + '</select><select data-f="topic" style="max-width:230px">' + ui.topicOptions(f.topic, SOS.app.conc, true).replace('— selecione o assunto —', 'Todos os tópicos') + '</select><select data-f="banca"><option value="">Todas as bancas</option>' + ui.opts(bancas, f.banca) + '</select><select data-f="res">' + ui.opts([['', 'Qualquer resultado'], ['E', 'Errei (última)'], ['A', 'Acertei (última)'], ['rep', 'Repetidas (2×+)'], ['nunca', 'Nunca resolvidas']], f.res) + '</select><select data-f="com">' + ui.opts([['', 'Com ou sem comentário'], ['sim', 'Com comentário'], ['nao', 'Sem comentário']], f.com) + '</select><select data-f="cad"><option value="">Todos os cadernos</option>' + ui.opts(SOS.S.cadernos.map(function (c) { return [c.id, c.nome]; }), f.cad) + '</select></div>';
    if (list.length) h += '<div class="row" style="margin-bottom:8px"><small class="muted">' + list.length + ' questão(ões) no filtro</small><span class="spacer"></span><button class="btn xs ghost" data-act="addAllCad">Adicionar filtradas a um caderno</button><button class="btn xs ghost" data-act="treinoFiltro">Treinar as filtradas</button></div>';
    var pages = Math.max(1, Math.ceil(list.length / PER)); if (page >= pages) page = pages - 1;
    h += list.length ? list.slice(page * PER, page * PER + PER).map(item).join('') : '<div class="empty">Nenhuma questão. Instale a extensão (aba “Importar / extensão”) e resolva questões no TEC — elas aparecem aqui sozinhas.</div>';
    if (pages > 1) h += '<div class="row" style="justify-content:center;margin-top:10px"><button class="btn xs ghost" data-pg="-1">◀</button><small>página ' + (page + 1) + ' de ' + pages + '</small><button class="btn xs ghost" data-pg="1">▶</button></div>';
    return h + '</div>';
  }
  function k(l, v, s) { return '<div class="card kpi"><div class="l">' + l + '</div><div class="v">' + v + '</div>' + (s ? '<div class="s">' + s + '</div>' : '') + '</div>'; }
  function item(q) {
    var t = q.topicId && q.topicId !== 'none' ? SOS.topic(q.topicId) : null, r = resOf(q);
    var tent = (q.hist || []).length, ac = (q.hist || []).filter(function (x) { return x.r === 'A'; }).length;
    return '<div class="list-item"><div class="row">' + (r === 'E' ? '<span class="tag bad">Errei</span>' : r === 'A' ? '<span class="tag good">Acertei</span>' : '<span class="tag">Não resolvida</span>') + (q.v > 1 ? '<span class="tag bad">errada ' + q.v + '×</span>' : '') + (t ? ui.discTag(t.disc) : q.disc ? ui.discTag(q.disc) : '') + '<small><b>' + U.esc(q.mat || '') + '</b>' + (q.ass ? ' › ' + U.esc(q.ass) : '') + '</small><span class="spacer"></span><small class="muted">' + U.esc([q.banca, q.ano, q.orgao].filter(Boolean).join(' · ')) + (q.origem === 'manual' ? ' · questão própria' : '') + '</small></div>' +
      (t ? '<small class="muted">Tópico do edital: ' + U.esc(t.titulo) + '</small>' : q.topicId === 'none' ? '<small class="muted">Fora do edital</small>' : '<small class="tag mid">sem tópico — associe em “Associar assuntos”</small>') +
      '<div style="margin:6px 0;white-space:pre-wrap">' + U.esc((q.enun || '').length > 400 ? q.enun.slice(0, 397) + '…' : q.enun) + '</div>' +
      '<details><summary style="cursor:pointer;font-size:13px;color:var(--primary)">Alternativas, gabarito, comentário e estatística</summary><div style="margin-top:6px">' +
      (q.alts || []).map(function (a) { var isG = a.l === q.gab, isM = a.l === q.marc; return '<div style="padding:4px 8px;border-radius:7px;margin-bottom:3px;' + (isG ? 'background:var(--good-soft)' : isM ? 'background:var(--bad-soft)' : '') + '"><b>' + U.esc(a.l) + ')</b> ' + U.esc(a.t) + (isG ? ' <span class="tag good">gabarito</span>' : '') + (isM ? ' <span class="tag">minha resposta</span>' : '') + '</div>'; }).join('') +
      (q.gab ? '' : '<small class="muted">Gabarito não capturado.</small>') +
      (q.com ? '<div class="card flat" style="margin-top:6px;white-space:pre-wrap"><b>Comentário' + (q.prof ? ' — ' + U.esc(q.prof) : '') + ':</b>\n' + U.esc(q.com) + '</div>' : '<small class="muted">Sem comentário guardado (no TEC, abra “Ver resolução” para a extensão capturar).</small>') +
      (q.est ? '<div style="margin-top:6px"><small class="muted">Estatística: ' + U.esc(Object.keys(q.est).map(function (x) { return x + ': ' + q.est[x]; }).join(' · ')) + '</small></div>' : '') +
      (q.nota ? '<div class="alert info" style="margin-top:6px;display:block"><b>Minha anotação:</b> ' + U.esc(q.nota) + '</div>' : '') +
      '<small class="muted">Tentativas: ' + tent + (tent ? ' (' + ac + ' acertos) · ' + (q.hist || []).map(function (x) { return U.fmtShort(x.d) + (x.r === 'A' ? '✓' : '✗'); }).join(' ') : '') + '</small></div></details>' +
      '<div class="row" style="gap:6px;margin-top:6px"><button class="btn xs" data-solve="' + q.id + '">Resolver</button><select data-tocad="' + q.id + '" style="padding:2px 6px;font-size:12px"><option value="">+ caderno…</option>' + ui.opts(SOS.S.cadernos.map(function (c) { return [c.id, c.nome]; })) + '<option value="__new">+ novo caderno</option></select><button class="btn xs ghost" data-card="' + q.id + '">Flashcard</button><button class="btn xs ghost" data-disc="' + q.id + '">Tema de discursiva</button><button class="btn xs ghost" data-edit="' + q.id + '">Editar / anotar</button>' + (q.url ? '<a class="btn xs ghost" href="' + U.esc(q.url) + '" target="_blank" rel="noopener">Abrir no TEC</a>' : '') + '<button class="btn xs ghost" data-rm="' + q.id + '">Remover</button></div></div>';
  }

  function vCadernos() {
    var h = '<div class="row" style="margin-bottom:10px"><p class="muted" style="margin:0">Cadernos seus: junte questões do TEC e questões próprias, anote, reordene, resolva e transforme em simulado.</p><span class="spacer"></span><button class="btn sm" data-act="newCad">+ Novo caderno</button></div>';
    if (!SOS.S.cadernos.length) return h + '<div class="empty">Nenhum caderno ainda.</div>';
    return h + '<div class="grid g3">' + SOS.S.cadernos.map(function (c) {
      var qs = c.qids.map(function (id) { return T.st().qs[id]; }).filter(Boolean);
      var tent = 0, ac = 0; qs.forEach(function (q) { (q.hist || []).forEach(function (x) { tent++; if (x.r === 'A') ac++; }); });
      return '<div class="card"><div class="card-h"><h3>' + U.esc(c.nome) + '</h3></div>' + (c.desc ? '<p class="muted" style="margin:0 0 8px;white-space:pre-wrap">' + U.esc(c.desc) + '</p>' : '') + '<div class="row"><span class="tag">' + qs.length + ' questões</span><span class="tag">' + qs.filter(function (q) { return q.v > 0; }).length + ' com erro</span>' + ui.pctBadge(U.pct(ac, tent)) + '</div><div class="row" style="margin-top:10px;gap:6px"><button class="btn xs" data-cadsolve="' + c.id + '">Resolver</button><button class="btn xs ghost" data-cadsim="' + c.id + '">Simulado</button><button class="btn xs ghost" data-cadopen="' + c.id + '">Abrir / editar</button><button class="btn xs ghost" data-caddel="' + c.id + '">Excluir</button></div></div>';
    }).join('') + '</div>';
  }
  function vCadTec() {
    var st = T.st(), ids = Object.keys(st.cads);
    var h = '<p class="muted" style="margin-top:0">Totais lidos da barra “Questão X de Y (R Resolvidas, A Acertos e E Erros)”. As questões que a extensão capturou uma a uma já contam nas estatísticas; aqui você decide o que fazer com as resolvidas <b>antes</b> da extensão (ou em outro aparelho), sem contar duas vezes.</p>';
    if (!ids.length) return h + '<div class="empty">Nenhum caderno do TEC lido ainda.</div>';
    return h + '<div class="card"><div class="tbl-wrap"><table><thead><tr><th>Caderno</th><th class="num">Total</th><th class="num">Resolvidas</th><th class="num">Acertos</th><th class="num">Erros</th><th class="num">Capturadas</th><th>Acompanhamento</th></tr></thead><tbody>' + ids.map(function (id) {
      var c = st.cads[id], tr = st.cadTrack[id], cap = T.capturedIn(c), un = Math.max(0, c.res - cap.res);
      var ctl;
      if (!tr) ctl = '<select data-cadtopic="' + id + '" style="max-width:220px">' + ui.topicOptions(guessCadTopic(c), null, true) + '</select><br><button class="btn xs" data-cadall="' + id + '">Registrar tudo (' + un + ' não capturadas)</button> <button class="btn xs ghost" data-cadfrom="' + id + '">Só acompanhar daqui</button>';
      else ctl = '<span class="tag good">' + (tr.mode === 'auto' ? 'automático' : 'manual') + '</span> <small class="muted">' + U.esc(SOS.topicLabel(tr.topicId).slice(0, 50)) + '</small><br><label class="chk" style="margin-top:4px"><input type="checkbox" data-cadauto="' + id + '"' + (tr.mode === 'auto' ? ' checked' : '') + '> registrar diferenças automaticamente</label>' + (tr.mode !== 'auto' && un - (tr.baseRes || 0) > 0 ? ' <button class="btn xs" data-caddiff="' + id + '">Registrar diferença (' + (un - (tr.baseRes || 0)) + ')</button>' : '');
      return '<tr><td>' + U.esc(c.cad || id) + '<br><small class="muted">lido em ' + U.fmtDate(c.d) + '</small></td><td class="num">' + c.tot + '</td><td class="num">' + c.res + '</td><td class="num">' + c.ac + '</td><td class="num">' + c.er + '</td><td class="num">' + cap.res + '</td><td>' + ctl + '</td></tr>';
    }).join('') + '</tbody></table></div></div>';
  }
  function guessCadTopic(c) {
    var cnt = {}; T.list().forEach(function (q) { if ((q.cadId === c.id || q.cad === c.cad) && q.topicId && q.topicId !== 'none') cnt[q.topicId] = (cnt[q.topicId] || 0) + 1; });
    var best = Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a]; })[0];
    if (best) return best;
    var s = T.suggest({ ass: c.cad, mat: c.cad })[0]; return s && s.s > 0.3 ? s.t.id : '';
  }
  function vMapa(pend) {
    var st = T.st();
    var h = '<p class="muted" style="margin-top:0">Associe cada assunto do TEC a um tópico do seu edital. A escolha fica lembrada e vale para as questões antigas e futuras desse assunto.</p>';
    if (pend.length) h += '<div class="card"><h3>Pendentes</h3>' + pend.map(function (p, i) {
      var sug = T.suggest(p.q);
      return '<div class="list-item"><div class="row"><b>' + U.esc(p.q.mat || '—') + '</b> › ' + U.esc(p.q.ass || '—') + '<span class="tag">' + p.n + ' questão(ões)</span></div><div class="row" style="margin-top:6px"><select data-alias="' + i + '" style="max-width:420px"><option value="">— escolha o tópico —</option><optgroup label="Sugestões">' + sug.map(function (s) { return '<option value="' + s.t.id + '">' + U.esc(SOS.disc(s.t.disc).nome + ' › ' + s.t.titulo.slice(0, 80)) + '</option>'; }).join('') + '</optgroup>' + ui.topicOptions('', null, false) + '<option value="none">Não pertence a nenhum tópico do edital</option></select><select data-aliasdisc="' + i + '"><option value="">Disciplina (opcional)</option>' + ui.opts(SOS.S.disciplinas.map(function (d) { return [d.id, d.nome]; }), p.q.disc) + '</select></div></div>';
    }).join('') + '</div>';
    var keys = Object.keys(st.aliasAss);
    h += '<div class="card section"><h3>Associações lembradas (' + keys.length + ')</h3>' + (keys.length ? '<div class="tbl-wrap"><table><tbody>' + keys.map(function (k2) { var a = st.aliasAss[k2]; return '<tr><td>' + U.esc(a.label || k2) + '</td><td>' + (a.topicId === 'none' ? '<i>fora do edital</i>' : U.esc(SOS.topicLabel(a.topicId))) + (a.auto ? ' <span class="tag">automática</span>' : '') + '</td><td class="num"><button class="btn xs ghost" data-unalias="' + U.esc(k2) + '">Refazer</button></td></tr>'; }).join('') + '</tbody></table></div>' : '<div class="empty">Nenhuma.</div>') + '</div>';
    T._pend = pend;
    return h;
  }
  function vTreinos() {
    var tr = T.st().treinos.slice().reverse();
    if (!tr.length) return '<div class="empty">Nenhum treino ainda. Use “Treinar / simulado”.</div>';
    return '<div class="card"><div class="tbl-wrap"><table><thead><tr><th>Data</th><th>Tipo</th><th>Origem</th><th class="num">Questões</th><th class="num">Acertos</th><th class="num">%</th><th class="num">Tempo</th></tr></thead><tbody>' + tr.map(function (t) { return '<tr><td>' + U.fmtDate(t.data) + '</td><td>' + (t.modo === 'simulado' ? 'Simulado' : 'Estudo') + '</td><td>' + U.esc(t.origem || '') + '</td><td class="num">' + t.n + '</td><td class="num">' + t.ac + '</td><td class="num">' + ui.pctBadge(U.pct(t.ac, t.n)) + '</td><td class="num">' + U.fmtMin(t.min) + '</td></tr>'; }).join('') + '</tbody></table></div></div>';
  }
  function vIO() {
    return '<div class="grid g2"><div class="card"><h3>Instalar a extensão do Chrome</h3><ol style="padding-left:18px;margin:0">' +
      '<li>Baixe o repositório (<i>Code › Download ZIP</i>) e <b>extraia</b>. A extensão está na pasta <code>extensao-tec</code>.</li>' +
      '<li>No Chrome, abra <code>chrome://extensions</code> e ligue o <b>Modo do desenvolvedor</b> (canto superior direito).</li>' +
      '<li>Clique em <b>Carregar sem compactação</b> e escolha a pasta <code>extensao-tec</code>.</li>' +
      '<li>Se você usa o StudyOS como arquivo no computador: em <i>Detalhes</i> da extensão, ligue <b>Permitir acesso a URLs de arquivo</b>.</li>' +
      '<li>Fixe o ícone (quebra-cabeça › alfinete). Abra o TEC, resolva questões e volte aqui: elas chegam sozinhas.</li></ol>' +
      '<p class="muted">A extensão só lê o que aparece na sua tela no TEC e guarda no seu navegador. Ela não responde, não clica e não baixa questões em lote. Uso pessoal — confira os termos de uso do TEC antes de compartilhar.</p></div>' +
      '<div class="card"><h3>Importar manualmente</h3><p class="muted" style="margin-top:0">Use se a sincronização automática não estiver ativa (por exemplo, outro aparelho). Aceita o JSON da extensão (formato novo ou o antigo “tec-erros”). Não duplica: mescla por id e pelo texto do enunciado.</p><input type="file" name="tecfile" accept=".json,application/json"><textarea name="tecpaste" rows="4" placeholder="…ou cole o JSON aqui" style="margin-top:8px"></textarea><div class="row" style="margin-top:8px"><button class="btn sm" data-act="paste">Importar JSON colado</button></div>' +
      '<hr><h3>Questões removidas por você</h3><p class="muted" style="margin:0 0 6px">' + Object.keys(T.st().removidos).filter(function (x) { return x.indexOf('fp:') !== 0; }).length + ' questão(ões) não voltarão em novas importações.</p><button class="btn xs ghost" data-act="unremove">Permitir que voltem</button></div></div>';
  }

  /* ---------- eventos ---------- */
  function onChange(e) {
    var x = e.target;
    if (x.dataset.f && x.dataset.f !== 'q') { f[x.dataset.f] = x.value; page = 0; return SOS.app.render(); }
    if (x.dataset.tocad) { var qid = x.dataset.tocad; if (x.value === '__new') return cadForm(null, [qid]); if (x.value) { var c = SOS.S.cadernos.find(function (y) { return y.id === x.value; }); if (c.qids.indexOf(qid) < 0) c.qids.push(qid); SOS.save(); ui.toast('Adicionada a “' + c.nome + '”.', 'good'); } x.value = ''; return; }
    if (x.dataset.alias != null) {
      var p = T._pend[+x.dataset.alias]; if (!x.value) return;
      var dsel = document.querySelector('[data-aliasdisc="' + x.dataset.alias + '"]');
      if (dsel && dsel.value) { T.st().aliasMat[U.norm(p.q.mat || '')] = dsel.value; T.list().forEach(function (q) { if (U.norm(q.mat || '') === U.norm(p.q.mat || '')) q.disc = dsel.value; }); }
      T.setAlias(p.k, x.value, (p.q.mat || '') + ' › ' + (p.q.ass || ''));
      SOS.log('Assunto TEC associado', (p.q.ass || '') + ' → ' + (x.value === 'none' ? 'fora do edital' : SOS.topicLabel(x.value)));
      SOS.save(); ui.toast('Associação lembrada e aplicada às questões desse assunto.', 'good'); return SOS.app.render();
    }
    if (x.dataset.cadauto) { var tr = T.st().cadTrack[x.dataset.cadauto]; tr.mode = x.checked ? 'auto' : 'manual'; T.syncDerived(); SOS.save(); return SOS.app.render(); }
    if (x.name === 'tecfile' && x.files[0]) { var r = new FileReader(); r.onload = function () { try { T.importData(r.result, false); SOS.app.render(); } catch (err) { ui.toast('Arquivo inválido: ' + err.message, 'bad', 6000); } }; r.readAsText(x.files[0]); }
  }
  function onClick(e) {
    var x, st = T.st();
    if ((x = e.target.closest('[data-tab]'))) { tab = x.dataset.tab; return SOS.app.render(); }
    if ((x = e.target.closest('[data-pg]'))) { page += +x.dataset.pg; return SOS.app.render(); }
    if (e.target.closest('[data-act=paste]')) { var v = document.querySelector('[name=tecpaste]').value.trim(); if (!v) return ui.toast('Cole o JSON primeiro.', 'mid'); try { T.importData(v, false); SOS.app.render(); } catch (err) { ui.toast('JSON inválido: ' + err.message, 'bad', 6000); } return; }
    if (e.target.closest('[data-act=unremove]')) return ui.confirm('Permitir que as questões removidas voltem na próxima importação?', function () { st.removidos = {}; SOS.save(); SOS.app.render(); }, 'Permitir');
    if (e.target.closest('[data-act=manual]')) return qForm(null);
    if (e.target.closest('[data-act=treino]')) return treinoSetup({});
    if (e.target.closest('[data-act=treinoFiltro]')) return treinoSetup({ ids: filtered().map(function (q) { return q.id; }), origem: 'Filtro do banco' });
    if (e.target.closest('[data-act=addAllCad]')) return addAllToCad(filtered().map(function (q) { return q.id; }));
    if (e.target.closest('[data-act=newCad]')) return cadForm(null, []);
    if ((x = e.target.closest('[data-solve]'))) return runTreino([st.qs[x.dataset.solve]], 'estudo', 0, 'Questão avulsa');
    if ((x = e.target.closest('[data-edit]'))) return qForm(st.qs[x.dataset.edit]);
    if ((x = e.target.closest('[data-card]'))) return toCard(st.qs[x.dataset.card]);
    if ((x = e.target.closest('[data-disc]'))) return toTema(st.qs[x.dataset.disc]);
    if ((x = e.target.closest('[data-rm]'))) { var q = st.qs[x.dataset.rm]; return ui.confirm('Remover esta questão do banco? Ela não voltará em novas importações. Erros, estatísticas e flashcards já criados a partir dela são mantidos.', function () { st.removidos[q.id] = 1; if (q.enun) st.removidos['fp:' + T.fp(q.enun)] = 1; delete st.qs[q.id]; SOS.S.cadernos.forEach(function (c) { c.qids = c.qids.filter(function (i) { return i !== q.id; }); }); SOS.log('Questão removida do banco', q.id); SOS.save(); SOS.app.render(); }, 'Remover'); }
    if ((x = e.target.closest('[data-unalias]'))) { delete st.aliasAss[x.dataset.unalias]; T.list().forEach(function (q) { if (T.assKey(q) === x.dataset.unalias) q.topicId = null; }); tabSync(); return; }
    if ((x = e.target.closest('[data-cadsolve]'))) { var c = SOS.S.cadernos.find(function (y) { return y.id === x.dataset.cadsolve; }); return runTreino(c.qids.map(function (i) { return st.qs[i]; }).filter(Boolean), 'estudo', 0, 'Caderno: ' + c.nome); }
    if ((x = e.target.closest('[data-cadsim]'))) { var c2 = SOS.S.cadernos.find(function (y) { return y.id === x.dataset.cadsim; }); return treinoSetup({ ids: c2.qids, origem: 'Caderno: ' + c2.nome, modo: 'simulado' }); }
    if ((x = e.target.closest('[data-cadopen]'))) return cadForm(SOS.S.cadernos.find(function (y) { return y.id === x.dataset.cadopen; }));
    if ((x = e.target.closest('[data-caddel]'))) { var c3 = SOS.S.cadernos.find(function (y) { return y.id === x.dataset.caddel; }); return ui.confirm('Excluir o caderno “' + U.esc(c3.nome) + '”? As questões continuam no banco.', function () { SOS.S.cadernos = SOS.S.cadernos.filter(function (y) { return y.id !== c3.id; }); SOS.save(); SOS.app.render(); }); }
    if ((x = e.target.closest('[data-cadall]')) || (x = e.target.closest('[data-cadfrom]'))) {
      var id = x.dataset.cadall || x.dataset.cadfrom, cad = st.cads[id];
      var tsel = document.querySelector('[data-cadtopic="' + id + '"]').value;
      if (!tsel) return ui.toast('Escolha o tópico do edital deste caderno.', 'bad');
      var cap = T.capturedIn(cad), un = Math.max(0, cad.res - cap.res), unAc = Math.max(0, cad.ac - cap.ac);
      if (x.dataset.cadall) {
        if (un > 0) { var s = { id: U.uid('s'), topicId: tsel, data: U.today(), metodo: 'Questões', planejadoMin: 0, realizadoMin: 0, total: un, acertos: Math.min(un, unAc), origem: 'TEC-cad', obs: 'Caderno TEC: ' + cad.cad + ' (histórico anterior à extensão)' }; SOS.S.sessoes.push(s); E.applySessionToTopic(s); }
        st.cadTrack[id] = { mode: 'auto', topicId: tsel, baseRes: un, baseAc: unAc };
        ui.toast(un + ' questão(ões) anteriores registradas. Daqui em diante, automático.', 'good', 5000);
      } else { st.cadTrack[id] = { mode: 'auto', topicId: tsel, baseRes: un, baseAc: unAc }; ui.toast('Acompanhando a partir de agora.', 'good'); }
      SOS.log('Caderno TEC acompanhado', cad.cad); SOS.save(); return SOS.app.render();
    }
    if ((x = e.target.closest('[data-caddiff]'))) { var tr = st.cadTrack[x.dataset.caddiff]; tr.mode = 'auto'; T.syncDerived(); tr.mode = 'manual'; SOS.save(); ui.toast('Diferença registrada.', 'good'); return SOS.app.render(); }
  }
  function tabSync() { T.syncDerived(); SOS.save(); SOS.app.render(); }

  /* ---------- formulários ---------- */
  function qForm(q) {
    var isNew = !q;
    q = q || { id: 'm' + U.uid(''), origem: 'manual', d: U.today(), t: Date.now(), v: 0, ds: [], hist: [], mat: '', ass: '', banca: '', ano: '', orgao: '', enun: '', alts: [], gab: '', com: '', nota: '' };
    var altsTxt = (q.alts || []).map(function (a) { return a.l + ') ' + a.t; }).join('\n');
    ui.modal({
      title: isNew ? 'Nova questão própria' : 'Editar questão / anotar', wide: true,
      body: '<div class="form"><label class="f full"><span>Enunciado</span><textarea name="enun" rows="4">' + U.esc(q.enun) + '</textarea></label>' +
        '<label class="f full"><span>Alternativas — uma por linha, no formato “A) texto” (ou “C) Certo” / “E) Errado”)</span><textarea name="alts" rows="5">' + U.esc(altsTxt) + '</textarea></label>' +
        '<label class="f"><span>Gabarito (letra)</span><input name="gab" value="' + U.esc(q.gab || '') + '" maxlength="1"></label>' +
        '<label class="f"><span>Tópico do edital</span><select name="topic">' + ui.topicOptions(q.topicId, null, true) + '<option value="none"' + (q.topicId === 'none' ? ' selected' : '') + '>Fora do edital</option></select></label>' +
        '<label class="f"><span>Matéria</span><input name="mat" value="' + U.esc(q.mat || '') + '"></label><label class="f"><span>Assunto</span><input name="ass" value="' + U.esc(q.ass || '') + '"></label>' +
        '<label class="f"><span>Banca</span><input name="banca" value="' + U.esc(q.banca || '') + '"></label><label class="f"><span>Ano / órgão</span><input name="orgao" value="' + U.esc([q.ano, q.orgao].filter(Boolean).join(' · ')) + '"></label>' +
        '<label class="f full"><span>Comentário / explicação</span><textarea name="com" rows="3">' + U.esc(q.com || '') + '</textarea></label>' +
        '<label class="f full"><span>Minha anotação</span><textarea name="nota" rows="2">' + U.esc(q.nota || '') + '</textarea></label></div>',
      buttons: [{ label: 'Cancelar', cls: 'ghost' }, { label: 'Salvar', onClick: function (c, root) {
        var enun = ui.val(root, 'enun').trim(); if (!enun) { ui.toast('Informe o enunciado.', 'bad'); return false; }
        var alts = ui.val(root, 'alts').split('\n').map(function (l) { return l.trim(); }).filter(Boolean).map(function (l, i) { var m = l.match(/^([A-Ea-e])\s*[\)\.\-:]\s*(.*)$/); return m ? { l: m[1].toUpperCase(), t: m[2] } : { l: 'ABCDE'[i], t: l }; });
        var gab = ui.val(root, 'gab').trim().toUpperCase();
        if (alts.length && gab && !alts.some(function (a) { return a.l === gab; })) { ui.toast('O gabarito não corresponde a nenhuma alternativa.', 'bad'); return false; }
        if (enun !== q.enun) q.enunEditado = !isNew; if (JSON.stringify(alts) !== JSON.stringify(q.alts)) q.altsEditado = !isNew;
        q.enun = enun; q.alts = alts; q.gab = gab; q.topicId = ui.val(root, 'topic') || null;
        if (q.topicId && q.topicId !== 'none') q.disc = SOS.topic(q.topicId).disc;
        q.mat = ui.val(root, 'mat'); q.ass = ui.val(root, 'ass'); q.banca = ui.val(root, 'banca'); var oa = ui.val(root, 'orgao'); if (isNew) q.orgao = oa;
        q.com = ui.val(root, 'com'); q.nota = ui.val(root, 'nota');
        T.st().qs[q.id] = q; T.syncDerived();
        SOS.log(isNew ? 'Questão própria criada' : 'Questão editada', q.id); SOS.save(); SOS.app.render(); ui.toast('Questão salva.', 'good');
      } }]
    });
  }
  function cadForm(c, addIds) {
    var isNew = !c;
    c = c || { id: U.uid('cad'), nome: '', desc: '', qids: (addIds || []).slice(), notas: {}, criado: U.today() };
    var st = T.st();
    function rows() {
      return c.qids.map(function (id, i) { var q = st.qs[id]; if (!q) return ''; return '<div class="list-item"><div class="row"><b>' + (i + 1) + '.</b><span style="flex:1;min-width:0">' + U.esc((q.enun || '').slice(0, 160)) + '</span><button class="btn xs ghost" data-up="' + i + '">▲</button><button class="btn xs ghost" data-down="' + i + '">▼</button><button class="btn xs ghost" data-out="' + i + '">Tirar</button></div><textarea data-nota="' + id + '" rows="1" placeholder="Anotação desta questão no caderno…" style="margin-top:4px">' + U.esc(c.notas[id] || '') + '</textarea></div>'; }).join('') || '<div class="empty">Sem questões. Adicione pelo banco (“+ caderno…” em cada questão).</div>';
    }
    var m = ui.modal({
      title: isNew ? 'Novo caderno' : 'Caderno: ' + c.nome, wide: true,
      body: '<div class="form"><label class="f"><span>Nome</span><input name="nome" value="' + U.esc(c.nome) + '"></label><label class="f"><span>Descrição</span><input name="desc" value="' + U.esc(c.desc) + '"></label></div><h3 class="section">Questões (' + c.qids.length + ')</h3><div id="cadRows">' + rows() + '</div>',
      onOpen: function (root) {
        root.addEventListener('click', function (ev) {
          var b = ev.target.closest('[data-up],[data-down],[data-out]'); if (!b) return;
          collect(root);
          var i = +(b.dataset.up || b.dataset.down || b.dataset.out);
          if (b.dataset.up != null && i > 0) c.qids.splice(i - 1, 0, c.qids.splice(i, 1)[0]);
          if (b.dataset.down != null && i < c.qids.length - 1) c.qids.splice(i + 1, 0, c.qids.splice(i, 1)[0]);
          if (b.dataset.out != null) c.qids.splice(i, 1);
          root.querySelector('#cadRows').innerHTML = rows();
        });
      },
      buttons: [{ label: 'Cancelar', cls: 'ghost' }, { label: 'Salvar', onClick: function (cl, root) {
        var nome = ui.val(root, 'nome').trim(); if (!nome) { ui.toast('Dê um nome ao caderno.', 'bad'); return false; }
        c.nome = nome; c.desc = ui.val(root, 'desc'); collect(root);
        if (isNew) SOS.S.cadernos.push(c);
        SOS.log(isNew ? 'Caderno criado' : 'Caderno editado', c.nome); SOS.save(); SOS.app.render(); ui.toast('Caderno salvo.', 'good');
      } }]
    });
    function collect(root) { ui.$$('[data-nota]', root).forEach(function (t) { if (t.value.trim()) c.notas[t.dataset.nota] = t.value; else delete c.notas[t.dataset.nota]; }); }
  }
  function addAllToCad(ids) {
    if (!ids.length) return;
    ui.modal({ title: 'Adicionar ' + ids.length + ' questão(ões) a um caderno', body: '<label class="f"><span>Caderno</span><select name="c"><option value="__new">+ Novo caderno</option>' + ui.opts(SOS.S.cadernos.map(function (c) { return [c.id, c.nome]; })) + '</select></label>', buttons: [{ label: 'Cancelar', cls: 'ghost' }, { label: 'Adicionar', onClick: function (cl, root) {
      var v = ui.val(root, 'c'); if (v === '__new') { setTimeout(function () { cadForm(null, ids); }, 10); return; }
      var c = SOS.S.cadernos.find(function (y) { return y.id === v; }); var n = 0; ids.forEach(function (id) { if (c.qids.indexOf(id) < 0) { c.qids.push(id); n++; } });
      SOS.save(); SOS.app.render(); ui.toast(n + ' adicionada(s) a “' + c.nome + '”.', 'good');
    } }] });
  }
  function toCard(q) {
    var er = SOS.S.erros.find(function (e) { return e.tecId === q.id; });
    if (er) return SOS.views.flashcards.fromError(er);
    var g = q.gab ? q.gab + ') ' + altText(q, q.gab) : '';
    SOS.views.flashcards.fromError({ id: null, topicId: q.topicId && q.topicId !== 'none' ? q.topicId : '', aprender: '', correta: g, justificativa: q.com || '', porque: '', banca: q.banca || 'Selecon', categorias: [] }, 'Conteúdo importante');
  }
  function toTema(q) {
    var t = q.topicId && q.topicId !== 'none' ? SOS.topic(q.topicId) : null;
    var conc = t ? (t.concursos.indexOf('ANA') > -1 ? 'ANA' : t.concursos.indexOf('TEC') > -1 ? 'TEC' : t.concursos[0]) : 'ANA';
    SOS.S.temas.push({ id: U.uid('tm'), titulo: (q.ass || q.mat || 'Tema') + ' — a partir de questão', proposta: q.enun + (q.alts && q.alts.length ? '\n\n(Base: questão objetiva — desenvolva o tema em 20 a 30 linhas, explicando o conceito cobrado.)' : ''), concursoId: conc, topicId: t ? t.id : '' });
    SOS.save(); ui.toast('Tema criado em Discursivas › Temas.', 'good', 4000);
  }

  /* ---------- treino / simulado ---------- */
  function treinoSetup(o) {
    var st = T.st();
    var pool = (o.ids ? o.ids.map(function (i) { return st.qs[i]; }) : T.list()).filter(function (q) { return q && q.gab && (q.alts || []).length; });
    ui.modal({
      title: 'Treinar / simulado', body: '<p class="muted" style="margin-top:0">' + pool.length + ' questão(ões) com gabarito disponíveis' + (o.origem ? ' em <b>' + U.esc(o.origem) + '</b>' : ' no banco') + '.</p><div class="form">' +
        (o.ids ? '' : '<label class="f"><span>Disciplina</span><select name="disc">' + ui.discOptions('', true) + '</select></label><label class="f"><span>Tópico</span><select name="topic">' + ui.topicOptions('', SOS.app.conc, true).replace('— selecione o assunto —', 'Todos') + '</select></label><label class="f"><span>Quais</span><select name="quais">' + ui.opts([['todas', 'Todas'], ['erradas', 'Só as que errei'], ['rep', 'Erradas 2× ou mais'], ['nunca', 'Nunca resolvidas']], 'todas') + '</select></label>') +
        '<label class="f"><span>Modo</span><select name="modo">' + ui.opts([['estudo', 'Estudo — mostra gabarito e comentário a cada questão'], ['simulado', 'Simulado — corrige só no final']], o.modo || 'estudo') + '</select></label>' +
        '<label class="f"><span>Quantidade</span><input type="number" name="n" min="1" value="' + Math.min(20, pool.length || 20) + '"></label>' +
        '<label class="f"><span>Tempo total (minutos, 0 = sem limite)</span><input type="number" name="min" min="0" value="0"></label>' +
        '<label class="chk" style="width:max-content"><input type="checkbox" name="rand" checked> Embaralhar</label></div><small class="muted">Na Selecon, treine com ritmo: referência de ~3 min por questão no simulado.</small>',
      buttons: [{ label: 'Cancelar', cls: 'ghost' }, { label: 'Começar', cls: 'good', onClick: function (c, root) {
        var p = pool.slice();
        if (!o.ids) {
          var d = ui.val(root, 'disc'), tp = ui.val(root, 'topic'), qu = ui.val(root, 'quais');
          p = p.filter(function (q) { return (!d || q.disc === d) && (!tp || q.topicId === tp) && (qu !== 'erradas' || q.v > 0) && (qu !== 'rep' || q.v > 1) && (qu !== 'nunca' || !(q.hist || []).length) && inConc(q); });
        }
        if (ui.val(root, 'rand')) p.sort(function () { return Math.random() - 0.5; });
        p = p.slice(0, Math.max(1, +ui.val(root, 'n') || 10));
        if (!p.length) { ui.toast('Nenhuma questão com esses filtros.', 'mid'); return false; }
        setTimeout(function () { runTreino(p, ui.val(root, 'modo'), +ui.val(root, 'min') || 0, o.origem || 'Banco de questões'); }, 10);
      } }]
    });
  }
  function runTreino(qs, modo, minutos, origem) {
    qs = qs.filter(function (q) { return q && (q.alts || []).length; });
    if (!qs.length) return ui.toast('Questão sem alternativas.', 'mid');
    var i = 0, resp = {}, revealed = {}, t0 = Date.now(), timer = null, fim = false;
    var m = ui.modal({ title: (modo === 'simulado' ? 'Simulado' : 'Treino') + ' — ' + origem, wide: true, body: '<div id="trn"></div>', dismissable: false, noFocus: true, buttons: [{ label: 'Encerrar e corrigir', cls: 'ghost', onClick: function () { if (!fim) finish(); return false; } }], onClose: function () { clearInterval(timer); } });
    if (minutos) timer = setInterval(function () { var left = minutos * 60 - (Date.now() - t0) / 1000; var c = m.root.querySelector('#clk'); if (c) c.textContent = U.pad(Math.floor(Math.max(0, left) / 60)) + ':' + U.pad(Math.floor(Math.max(0, left) % 60)); if (left <= 0 && !fim) { ui.toast('Tempo esgotado.', 'mid'); finish(); } }, 1000);
    function show() {
      var q = qs[i], box = m.root.querySelector('#trn'), r = resp[q.id], rev = modo === 'estudo' && revealed[q.id];
      box.innerHTML = '<div class="row" style="margin-bottom:8px"><small class="muted">' + (i + 1) + ' de ' + qs.length + '</small>' + (q.disc ? ui.discTag(q.disc) : '') + '<small class="muted">' + U.esc([q.banca, q.ano, q.orgao].filter(Boolean).join(' · ')) + '</small><span class="spacer"></span>' + (minutos ? '<span class="tag" id="clk">--:--</span>' : '') + '</div>' +
        '<div class="fc-face"><div style="white-space:pre-wrap;font-size:15.5px">' + U.esc(q.enun) + '</div><div style="margin-top:12px">' + q.alts.map(function (a) {
          var st = ''; if (rev) { if (a.l === q.gab) st = 'background:var(--good-soft);border-color:var(--good)'; else if (a.l === r) st = 'background:var(--bad-soft);border-color:var(--bad)'; } else if (a.l === r) st = 'background:var(--primary-soft);border-color:var(--primary)';
          return '<button class="btn ghost" data-alt="' + U.esc(a.l) + '" style="display:flex;width:100%;white-space:normal;text-align:left;margin-bottom:6px;justify-content:flex-start;' + st + '"' + (rev ? ' disabled' : '') + '><b>' + U.esc(a.l) + ')</b>&nbsp;' + U.esc(a.t) + '</button>';
        }).join('') + '</div>' +
        (rev ? '<div class="a"><b>' + (r === q.gab ? '✓ Acertou' : '✗ Errou — gabarito ' + U.esc(q.gab)) + '</b>' + (q.com ? '<div style="white-space:pre-wrap;margin-top:8px">' + U.esc(q.com) + '</div>' : '') + (q.nota ? '<div class="alert info" style="margin-top:8px;display:block">' + U.esc(q.nota) + '</div>' : '') + '</div>' : '') + '</div>' +
        '<div class="row" style="margin-top:12px"><button class="btn ghost sm" data-nav="-1"' + (i === 0 ? ' disabled' : '') + '>◀ Anterior</button><span class="spacer"></span>' + (modo === 'estudo' && r && !rev ? '<button class="btn sm" data-reveal>Confirmar resposta</button>' : '') + (i < qs.length - 1 ? '<button class="btn sm ' + (modo === 'estudo' && !rev ? 'ghost' : '') + '" data-nav="1">Próxima ▶</button>' : '<button class="btn sm good" data-end>Finalizar</button>') + '</div>';
      box.onclick = function (ev) {
        var b;
        if ((b = ev.target.closest('[data-alt]')) && !rev) { resp[q.id] = b.dataset.alt; return show(); }
        if (ev.target.closest('[data-reveal]')) { revealed[q.id] = true; return show(); }
        if ((b = ev.target.closest('[data-nav]'))) { i = Math.max(0, Math.min(qs.length - 1, i + +b.dataset.nav)); return show(); }
        if (ev.target.closest('[data-end]')) finish();
      };
    }
    function finish() {
      fim = true; clearInterval(timer);
      var d = U.today(), now = Date.now(), ac = 0, n = 0, byDisc = {};
      qs.forEach(function (q, k2) {
        var r = resp[q.id]; if (!r) return;
        n++; var ok = r === q.gab; if (ok) ac++;
        q.hist = (q.hist || []).concat([{ d: d, t: now + k2, r: ok ? 'A' : 'E', m: r, src: 'sos' }]);
        if (!ok) { q.v = (q.v || 0) + 1; q.ds = (q.ds || []).concat([d]); }
        var dk = q.disc || '—'; byDisc[dk] = byDisc[dk] || { n: 0, ac: 0 }; byDisc[dk].n++; if (ok) byDisc[dk].ac++;
      });
      var minUsed = Math.round((now - t0) / 60000);
      T.st().treinos.push({ id: U.uid('tr'), data: d, modo: modo, origem: origem, n: n, ac: ac, min: minUsed, ids: qs.map(function (q) { return q.id; }) });
      T.syncDerived(); SOS.log('Treino de questões', origem + ' — ' + ac + '/' + n); SOS.save();
      m.root.querySelector('#trn').innerHTML = '<div class="empty" style="padding:10px"><h2>' + ac + ' de ' + n + ' respondidas certas ' + ui.pctBadge(U.pct(ac, n)) + '</h2><small>' + (qs.length - n) + ' sem resposta · ' + U.fmtMin(minUsed) + '</small></div>' +
        ui.hbars(Object.keys(byDisc).map(function (dk) { var b = byDisc[dk], p = U.pct(b.ac, b.n); return { label: SOS.disc(dk).nome, value: p, color: ui.pctColor(p), text: b.ac + '/' + b.n }; })) +
        '<h3 class="section">Revisão</h3>' + qs.map(function (q, k2) { var r = resp[q.id]; return '<div class="list-item"><div class="row"><b>' + (k2 + 1) + '.</b>' + (!r ? '<span class="tag">em branco</span>' : r === q.gab ? '<span class="tag good">certa</span>' : '<span class="tag bad">errada</span>') + '<small>sua: ' + U.esc(r || '—') + ' · gabarito: ' + U.esc(q.gab) + '</small></div><small class="muted">' + U.esc((q.enun || '').slice(0, 180)) + '</small>' + (r && r !== q.gab && q.com ? '<details><summary style="cursor:pointer;font-size:13px;color:var(--primary)">comentário</summary><div style="white-space:pre-wrap;font-size:13.5px">' + U.esc(q.com) + '</div></details>' : '') + '</div>'; }).join('') +
        '<p class="muted" style="font-size:13px">Resultados registrados nas estatísticas por tópico; questões erradas foram para o Caderno de Erros (as repetidas aumentam a prioridade do assunto).</p>';
      var f2 = m.root.querySelector('.modal-f'); f2.innerHTML = ''; var b = document.createElement('button'); b.className = 'btn'; b.textContent = 'Fechar'; b.onclick = function () { m.close(); }; f2.appendChild(b);
    }
    show();
  }
})();
