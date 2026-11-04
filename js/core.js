/* StudyOS — núcleo: utilitários, armazenamento, autosave, snapshots, backup. */
(function () {
  var SOS = window.SOS;
  var KEY = 'studyos.data';
  var SNAP_PREFIX = 'studyos.snap.';
  var SCHEMA = 1;

  /* ---------------- utilitários ---------------- */
  var U = SOS.U = {};
  U.uid = function (p) { return (p || 'x') + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); };
  U.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  U.pad = function (n) { return (n < 10 ? '0' : '') + n; };
  U.iso = function (d) { d = d || new Date(); return d.getFullYear() + '-' + U.pad(d.getMonth() + 1) + '-' + U.pad(d.getDate()); };
  U.today = function () { return SOS.__fakeToday || U.iso(new Date()); };
  U.parse = function (s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); };
  U.addDays = function (s, n) { var d = U.parse(s); d.setDate(d.getDate() + n); return U.iso(d); };
  U.diffDays = function (a, b) { return Math.round((U.parse(b) - U.parse(a)) / 86400000); };
  U.dow = function (s) { return U.parse(s).getDay(); }; // 0 = domingo
  U.monday = function (s) { var w = U.dow(s); return U.addDays(s, w === 0 ? -6 : 1 - w); };
  U.DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  U.DIAS_C = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  U.MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  U.fmtDate = function (s) { if (!s) return '—'; var p = s.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; };
  U.fmtShort = function (s) { if (!s) return '—'; var p = s.split('-'); return p[2] + '/' + p[1]; };
  /* duração no formato 00:00h */
  U.fmtMin = function (m) { m = Math.max(0, Math.round(m || 0)); return U.pad(Math.floor(m / 60)) + ':' + U.pad(m % 60) + 'h'; };
  U.parseMin = function (s) {
    if (s == null || s === '') return 0;
    s = String(s).trim().replace(/h$/i, '');
    if (s.indexOf(':') > -1) { var p = s.split(':'); return (parseInt(p[0], 10) || 0) * 60 + (parseInt(p[1], 10) || 0); }
    return parseInt(s, 10) || 0;
  };
  /* percentual = acertos ÷ total × 100 */
  U.pct = function (ac, tot) { return tot > 0 ? (ac / tot) * 100 : null; };
  U.fmtPct = function (p) { return p == null ? '—' : (Math.round(p * 10) / 10).toString().replace('.', ',') + '%'; };
  /* < 70 vermelho · 70–80 amarelo · > 80 verde */
  U.pctClass = function (p) { if (p == null) return 'neutral'; if (p < 70) return 'bad'; if (p <= 80) return 'mid'; return 'good'; };
  U.norm = function (s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim(); };
  U.similar = function (a, b) {
    var A = U.norm(a).split(' ').filter(function (w) { return w.length > 2; });
    var B = U.norm(b).split(' ').filter(function (w) { return w.length > 2; });
    if (!A.length || !B.length) return 0;
    var setB = {}; B.forEach(function (w) { setB[w] = 1; });
    var inter = 0, setA = {};
    A.forEach(function (w) { if (!setA[w]) { setA[w] = 1; if (setB[w]) inter++; } });
    var uni = Object.keys(setA).length + Object.keys(setB).length - inter;
    return inter / uni;
  };
  U.download = function (name, text, mime) {
    var blob = new Blob([text], { type: mime || 'application/octet-stream' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };
  U.csvCell = function (v) { v = String(v == null ? '' : v); return /[";\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
  U.parseCSV = function (text, sep) {
    var rows = [], row = [], cell = '', q = false, i, c;
    sep = sep || (text.split('\n')[0].split(';').length >= text.split('\n')[0].split(',').length ? ';' : ',');
    for (i = 0; i < text.length; i++) {
      c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c;
      } else if (c === '"') q = true;
      else if (c === sep || c === '\t' && sep === '\t') { row.push(cell); cell = ''; }
      else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
      else if (c !== '\r') cell += c;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (x) { return x.trim() !== ''; }); });
  };

  /* ---------------- estado ---------------- */
  SOS.defaultSettings = function () {
    return {
      minDia: 255,              // 4h15 por dia útil (seg–sáb)
      minRevisaoDia: 60,        // capacidade da fila de revisões
      minPorRevisao: 20,
      maxDisciplinasDia: 3,
      fase: { // pesos por concurso antes/depois da prova de Chapada
        antes: { OUV: 60, TEC: 40 },
        depois: { TEC: 100, OUV: 0 }
      },
      intervalosTopico: [1, 7, 15, 30, 60],
      intervalosErro: [1, 3, 7, 15, 30],
      intervalosCard: [1, 3, 7, 15, 30],
      charsPorLinha: 75,
      tema: 'auto',
      ultimoBackup: null,
      lembreteBackupDias: 7,
      metaDiariaMin: 240,         // meta diária simples (minutos)
      metaQuestoesTotal: 700,     // meta de questões até a prova
      iaEndpoint: '',             // rota do servidor de IA (a chave fica no servidor)
      leitorFonte: 17,            // tamanho da letra no leitor de lei seca (px)
      leitorRealce: true          // realçar termos de atenção no leitor
    };
  };

  SOS.freshState = function () {
    var conc = SOS.seedConcursos();
    return {
      schema: SCHEMA, seedVersion: SOS.SEED_VERSION, criadoEm: new Date().toISOString(),
      settings: SOS.defaultSettings(),
      concursos: conc,
      disciplinas: SOS.seedDisciplinas(),
      topicos: SOS.parseSeedTopicos(conc),
      atividades: [], sessoes: [], erros: [], flashcards: [], discursivas: [], temas: [], simulados: [],
      cadernos: [], tec: {}, leis: SOS.leis ? SOS.leis.seed() : [], juris: [],
      historico: []
    };
  };

  function migrate(d) {
    if (!d.schema) d.schema = 1;
    var base = SOS.freshState();
    ['atividades', 'sessoes', 'erros', 'flashcards', 'discursivas', 'temas', 'simulados', 'historico'].forEach(function (k) { if (!Array.isArray(d[k])) d[k] = []; });
    d.settings = Object.assign(base.settings, d.settings || {});
    if (!Array.isArray(d.concursos) || !d.concursos.length) d.concursos = base.concursos;
    if (!Array.isArray(d.disciplinas) || !d.disciplinas.length) d.disciplinas = base.disciplinas;
    if (!Array.isArray(d.topicos) || !d.topicos.length) d.topicos = base.topicos;
    if (!Array.isArray(d.cadernos)) d.cadernos = [];
    if (!d.tec || typeof d.tec !== 'object') d.tec = {};
    if (!Array.isArray(d.leis) && SOS.leis) d.leis = SOS.leis.seed();
    if (!Array.isArray(d.juris)) d.juris = [];
    // v2: perfil da banca e incidência estimada (fonte: Sendera — texto editorial, não análise de provas)
    if (!d.migr2) {
      d.migr2 = true;
      var perfil = ['Múltipla escolha (A–D nestes editais), sem penalidade por erro.', 'Enunciados curtos e objetivos; conhecimentos específicos em nível básico-médio.', 'Cobra legislação municipal e estadual do concurso — priorize Lei Orgânica e Estatuto do Servidor local.', 'Português tradicional: ortografia, acentuação, pontuação, regência.', 'Matemática/RLM em nível fundamental-médio.', 'Atualidades do município e do estado.', 'Resolva provas da Selecon da mesma região (MT) e cronometre o ritmo por questão.'];
      (d.concursos || []).forEach(function (c) { if (c.banca && /selecon/i.test(c.banca) && !c.bancaPerfil) { c.bancaPerfil = perfil; c.bancaFonte = 'Sendera — “Como a SELECON cobra” (análise editorial do site; não é levantamento verificado de provas).'; } });
      var alta = { lc01: 1, lc03: 1, lh01: 1, lh02: 1, lp06: 1, lp07: 1, lp28: 1, lp14: 1, hg18: 1 };
      (d.topicos || []).forEach(function (t) { if (alta[t.id] && t.inc === 'sd') { t.inc = 'alta'; t.incJust = 'Estimativa: perfil da Selecon (Sendera) indica cobrança frequente de ' + ({ lc01: 'Lei Orgânica do município', lc03: 'estatuto do servidor local', lh01: 'Lei Orgânica do município', lh02: 'estatuto do servidor local', hg18: 'atualidades do estado/município' }[t.id] || 'português tradicional (ortografia, acentuação, pontuação, regência)') + '. Não é garantia de cobrança; validar com provas anteriores.'; } });
    }
    if (SOS.migrateV3) SOS.migrateV3(d);
    if (SOS.migrateV4) SOS.migrateV4(d);
    if (SOS.applyConfig) SOS.applyConfig(d);
    if (!d.diario) d.diario = {};
    if (!Array.isArray(d.cardDrafts)) d.cardDrafts = [];
    if (!Array.isArray(d.questoesLei)) d.questoesLei = []; // questões A–E geradas a partir da lei seca
    return d;
  }

  SOS.load = function () {
    var raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { SOS.storageError = e; }
    if (raw) {
      try { SOS.S = migrate(JSON.parse(raw)); return 'loaded'; }
      catch (e) {
        // dado corrompido: tenta o snapshot mais recente
        var snaps = SOS.listSnapshots();
        for (var i = 0; i < snaps.length; i++) {
          try { SOS.S = migrate(JSON.parse(localStorage.getItem(snaps[i].key))); SOS.recoveredFrom = snaps[i].date; return 'recovered'; } catch (e2) { /* próximo */ }
        }
        try { localStorage.setItem('studyos.corrupted.' + Date.now(), raw); } catch (e3) { /* sem espaço */ }
      }
    }
    SOS.S = migrate(SOS.freshState());
    SOS.saveNow();
    return 'fresh';
  };

  var timer = null;
  SOS.lastSaved = null;
  SOS.save = function () {
    clearTimeout(timer);
    timer = setTimeout(SOS.saveNow, 250);
    SOS.setSaveIndicator('salvando…');
  };
  SOS.saveNow = function () {
    clearTimeout(timer); timer = null;
    try {
      localStorage.setItem(KEY, JSON.stringify(SOS.S));
      SOS.lastSaved = new Date();
      SOS.setSaveIndicator('salvo às ' + U.pad(SOS.lastSaved.getHours()) + ':' + U.pad(SOS.lastSaved.getMinutes()));
      SOS.dailySnapshot();
      if (SOS.tec && SOS.tec.pushBackup) SOS.tec.pushBackup();
      return true;
    } catch (e) {
      SOS.setSaveIndicator('ERRO AO SALVAR', true);
      if (SOS.ui) SOS.ui.toast('Não foi possível salvar no navegador (' + (e.name || 'erro') + '). Exporte um backup agora em Configurações.', 'bad', 8000);
      return false;
    }
  };
  SOS.flush = function () { if (timer) SOS.saveNow(); };
  SOS.setSaveIndicator = function (txt, err) {
    var el = document.getElementById('saveState');
    if (el) { el.textContent = txt; el.classList.toggle('err', !!err); }
  };

  SOS.dailySnapshot = function () {
    var key = SNAP_PREFIX + U.today();
    try {
      localStorage.setItem(key, JSON.stringify(SOS.S));
      var snaps = SOS.listSnapshots();
      snaps.slice(10).forEach(function (s) { localStorage.removeItem(s.key); });
    } catch (e) {
      // sem espaço: remove os snapshots mais antigos e tenta de novo uma vez
      var all = SOS.listSnapshots();
      if (all.length > 2) { localStorage.removeItem(all[all.length - 1].key); }
    }
  };
  SOS.listSnapshots = function () {
    var out = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf(SNAP_PREFIX) === 0) out.push({ key: k, date: k.slice(SNAP_PREFIX.length), size: (localStorage.getItem(k) || '').length });
      }
    } catch (e) { /* ignore */ }
    return out.sort(function (a, b) { return a.date < b.date ? 1 : -1; });
  };
  SOS.restoreSnapshot = function (key) {
    var d = JSON.parse(localStorage.getItem(key));
    SOS.S = migrate(d);
    SOS.saveNow();
  };

  SOS.exportJSON = function () {
    SOS.S.settings.ultimoBackup = U.today();
    SOS.saveNow();
    var payload = { app: 'StudyOS', exportadoEm: new Date().toISOString(), data: SOS.S };
    U.download('studyos-backup-' + U.today() + '.json', JSON.stringify(payload, null, 1), 'application/json');
  };
  SOS.validateImport = function (obj) {
    var d = obj && obj.data ? obj.data : obj;
    if (!d || typeof d !== 'object') throw new Error('Arquivo não é um backup do StudyOS.');
    if (!Array.isArray(d.topicos) || !Array.isArray(d.concursos)) throw new Error('Backup sem concursos/tópicos — arquivo inválido.');
    return d;
  };
  SOS.importJSON = function (obj, mode) {
    var d = SOS.validateImport(obj);
    // guarda o estado atual antes de qualquer importação
    try { localStorage.setItem(SNAP_PREFIX + U.today() + '-pre-import', JSON.stringify(SOS.S)); } catch (e) { /* ignore */ }
    if (mode === 'replace') { SOS.S = migrate(d); }
    else {
      var S = SOS.S;
      ['concursos', 'disciplinas', 'topicos', 'atividades', 'sessoes', 'erros', 'flashcards', 'discursivas', 'temas', 'simulados', 'cadernos', 'leis', 'juris', 'questoesLei', 'cardDrafts'].forEach(function (k) {
        S[k] = S[k] || [];
        var have = {}; (S[k] || []).forEach(function (x) { have[x.id] = x; });
        (d[k] || []).forEach(function (x) { if (!have[x.id]) S[k].push(x); });
      });
      if (d.tec && d.tec.qs && SOS.tec) { var tq = d.tec.qs; SOS.tec.importData({ qs: Object.keys(tq).map(function (k) { return tq[k]; }), cads: Object.keys(d.tec.cads || {}).map(function (k) { return d.tec.cads[k]; }) }, true); }
    }
    SOS.saveNow();
  };

  SOS.log = function (acao, detalhe) {
    SOS.S.historico.unshift({ t: new Date().toISOString(), acao: acao, detalhe: detalhe || '' });
    if (SOS.S.historico.length > 500) SOS.S.historico.length = 500;
  };

  /* ---------------- acesso ---------------- */
  SOS.conc = function (id) { return SOS.S.concursos.find(function (c) { return c.id === id; }); };
  SOS.disc = function (id) { return SOS.S.disciplinas.find(function (d) { return d.id === id; }) || { id: id, nome: id || '—', cor: '#94a3b8' }; };
  SOS.topic = function (id) { return SOS.S.topicos.find(function (t) { return t.id === id; }); };
  SOS.topicLabel = function (id) { var t = SOS.topic(id); return t ? t.titulo : '(tópico removido)'; };

  window.addEventListener('beforeunload', function () { SOS.flush(); });
  window.addEventListener('storage', function (e) {
    if (e.key === KEY && SOS.ui) SOS.ui.toast('O StudyOS foi alterado em outra aba. Recarregue esta página para evitar sobrescrever dados.', 'mid', 10000);
  });
})();
