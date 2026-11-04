/* StudyOS — aplicação da configuração do concurso (a cada abertura) e migração v3
   (cargo único Técnico Legislativo + um item por assunto por dia). Roda dentro de migrate(). */
(function () {
  var SOS = window.SOS;

  /* datas e dados do arquivo js/config-concurso.js valem sempre sobre o que estava salvo */
  SOS.applyConfig = function (d) {
    var C = SOS.CONFIG; if (!C) return;
    var c = (d.concursos || []).find(function (x) { return x.id === C.concurso.id; });
    if (!c) return;
    c.dataProva = C.prova.data; c.turno = C.prova.turno; c.duracao = C.prova.duracao + ' (objetiva + discursiva)';
    c.dataConfirmada = true; c.vagas = C.concurso.vagasDetalhe; c.remuneracao = C.concurso.remuneracao;
    c.cronograma = C.datas;
    c.sigla = 'Técnico Legislativo';
  };

  function uniq(a) { var o = []; a.forEach(function (x) { if (x && o.indexOf(x) < 0) o.push(x); }); return o; }
  function joinObs(a) { return uniq(a.map(function (x) { return (x || '').trim(); })).join(' | '); }

  /* une sessões manuais do mesmo assunto e dia (somando) — devolve os casos para conferir */
  SOS.mergeDaySessions = function (d, rel) {
    var keep = [], groups = {};
    d.sessoes.forEach(function (s) {
      if (s.origem === 'TEC' || s.origem === 'TEC-cad') { keep.push(s); return; }
      var k = s.topicId + '|' + s.data;
      (groups[k] = groups[k] || []).push(s);
    });
    Object.keys(groups).forEach(function (k) {
      var g = groups[k];
      if (g.length === 1) { keep.push(g[0]); return; }
      var m = Object.assign({}, g[0]);
      m.planejadoMin = 0; m.realizadoMin = 0; m.total = 0; m.acertos = 0; m.leituraMin = 0;
      g.forEach(function (s) {
        m.planejadoMin += +s.planejadoMin || 0; m.realizadoMin += +s.realizadoMin || 0;
        m.total += +s.total || 0; m.acertos += +s.acertos || 0; m.leituraMin += +s.leituraMin || 0;
        if (s.revisao || s.metodo === 'Revisão') m.revisao = true;
      });
      m.metodo = uniq(g.map(function (s) { return s.metodo; })).join(' + ');
      m.obs = joinObs(g.map(function (s) { return s.obs; }));
      m.atividadeIds = uniq(g.map(function (s) { return s.atividadeId; }).concat(g.map(function (s) { return (s.atividadeIds || []).join(','); }).join(',').split(',')));
      m.unidoDe = g.length;
      var concs = uniq(g.map(function (s) { return s.conc; }));
      var ambig = [];
      if (concs.length > 1) ambig.push('registros marcados para concursos diferentes (' + concs.join(', ') + ')');
      if (g.some(function (s) { return s.total > 0; }) && g.filter(function (s) { return s.total > 0; }).length > 1) ambig.push('mais de um registro com questões no mesmo dia — confira se não são a mesma bateria contada duas vezes');
      rel.sessoes.push({ data: m.data, topicId: m.topicId, n: g.length, ambiguo: ambig });
      keep.push(m);
    });
    d.sessoes = keep;
  };

  /* une atividades do mesmo assunto e dia num cartão só */
  SOS.mergeDayActivities = function (d, rel) {
    var keep = [], groups = {};
    d.atividades.forEach(function (a) {
      if (!a.topicId) { keep.push(a); return; }
      var k = a.topicId + '|' + a.data;
      (groups[k] = groups[k] || []).push(a);
    });
    Object.keys(groups).forEach(function (k) {
      var g = groups[k];
      if (g.length === 1) { keep.push(g[0]); return; }
      var m = SOS.combineActivities(g);
      var sts = uniq(g.map(function (a) { return a.status; }));
      var ambig = [];
      if (sts.length > 1) ambig.push('partes com status diferentes (' + sts.join(', ') + ') — o cartão ficou "' + m.status + '"');
      if (rel) rel.atividades.push({ data: m.data, topicId: m.topicId, n: g.length, ambiguo: ambig });
      keep.push(m);
    });
    d.atividades = keep;
  };
  SOS.combineActivities = function (g) {
    var m = Object.assign({}, g[0]);
    m.planMin = g.reduce(function (s, a) { return s + (+a.planMin || 0); }, 0);
    var mets = uniq(g.map(function (a) { return a.metodo; }));
    m.metodo = mets.length > 1 ? mets.join(' + ') : mets[0];
    m.partes = g.map(function (a) { return { metodo: a.metodo, min: +a.planMin || 0, titulo: a.titulo || '' }; });
    m.titulo = uniq(g.map(function (a) { return a.titulo; })).join(' · ');
    m.obs = joinObs(g.map(function (a) { return a.obs; }));
    m.sessionIds = uniq(g.map(function (a) { return a.sessionId; }).concat([].concat.apply([], g.map(function (a) { return a.sessionIds || []; }))));
    m.sessionId = m.sessionIds[0] || null;
    var sts = uniq(g.map(function (a) { return a.status; }));
    m.status = sts.length === 1 ? sts[0] : (sts.indexOf('feito') > -1 || sts.indexOf('andamento') > -1 ? 'andamento' : sts.indexOf('revisar') > -1 ? 'revisar' : sts.indexOf('naofeito') > -1 ? 'naofeito' : 'nao');
    m.gerado = g.every(function (a) { return a.gerado; });
    return m;
  };

  SOS.migrateV3 = function (d) {
    if (d.migr3) return;
    var rel = { quando: new Date().toISOString(), removidosAnalista: [], arquivadosChapada: 0, sessoes: [], atividades: [], orfaos: 0, despoluidas: 0 };
    var ALVO = 'TEC';
    d.arquivo = d.arquivo || { concursos: [], topicos: [], simulados: [], nota: 'Concursos fora do foco atual (Técnico Legislativo). Restaure pelo backup do GitHub/branch ou peça ao Claude.' };
    // 1) concursos: Analista sai; Chapada vai para o arquivo; Técnico fica
    (d.concursos || []).forEach(function (c) { if (c.id !== ALVO && c.id !== 'ANA') d.arquivo.concursos.push(c); });
    d.concursos = (d.concursos || []).filter(function (c) { return c.id === ALVO; });
    if (!d.concursos.length) d.concursos = SOS.seedConcursos().filter(function (c) { return c.id === ALVO; });
    // 2) tópicos: só vínculos do Técnico
    var keep = [];
    (d.topicos || []).forEach(function (t) {
      var onlyAna = t.concursos.every(function (c) { return c === 'ANA'; });
      var refsT = t.refs.filter(function (r) { return r.c === ALVO; });
      if (refsT.length) {
        t.refs = refsT; t.concursos = [ALVO]; t.parcial = false; t.nota = '';
        if (!t.impManual) { var c = d.concursos[0]; t.imp = Math.max.apply(null, refsT.map(function (r) { var s = c.secoes.find(function (x) { return x.k === r.s; }); return s ? s.imp : 2; })); }
        keep.push(t);
      } else if (onlyAna || t.concursos.indexOf('ANA') > -1 && t.concursos.indexOf('OUV') < 0) rel.removidosAnalista.push(t.titulo);
      else { d.arquivo.topicos.push(t); rel.arquivadosChapada++; }
    });
    d.topicos = keep;
    var tids = {}; keep.forEach(function (t) { tids[t.id] = 1; });
    // 3) demais registros
    d.erros.forEach(function (e) { e.concursos = [ALVO]; });
    d.flashcards.forEach(function (c) { c.concursos = [ALVO]; });
    d.temas.forEach(function (t) { t.concursoId = ALVO; });
    d.discursivas.forEach(function (x) { x.concursoId = ALVO; });
    d.simulados = d.simulados.filter(function (s) { if (s.concursoId === ALVO) return true; d.arquivo.simulados.push(s); return false; });
    rel.orfaos = d.sessoes.filter(function (s) { return !tids[s.topicId]; }).length;
    d.settings.fase = { antes: { TEC: 100 }, depois: { TEC: 100 } };
    if (d.settings.minDia < 60) d.settings.minDia = 255;
    // 4) leis: só as do Técnico
    if (Array.isArray(d.leis)) d.leis = d.leis.filter(function (l) { return !l.topicId || tids[l.topicId]; });
    // 5) disciplinas sem tópico saem dos menus
    var used = {}; keep.forEach(function (t) { used[t.disc] = 1; });
    d.disciplinas = d.disciplinas.filter(function (x) { return used[x.id]; });
    // 6) um item por assunto por dia
    SOS.mergeDaySessions(d, rel);
    SOS.mergeDayActivities(d, rel);
    // 7) banco do TEC: acertos comuns guardam só o contador
    var inCad = {}; (d.cadernos || []).forEach(function (c) { (c.qids || []).forEach(function (i) { inCad[i] = 1; }); });
    var qs = (d.tec && d.tec.qs) || {};
    Object.keys(qs).forEach(function (k) {
      var q = qs[k];
      if (q.origem === 'manual' || q.v > 0 || q.marca || inCad[k]) return;
      if (q.enun || (q.alts && q.alts.length) || q.com) { ['enun', 'alts', 'com', 'prof', 'est', 'marc', 'gab'].forEach(function (f) { delete q[f]; }); q.soContador = true; rel.despoluidas++; }
    });
    d.migr3 = true; d.migr3Relatorio = rel; d.replanPendente = true;
    (d.historico = d.historico || []).unshift({ t: rel.quando, acao: 'Migração v3', detalhe: 'Cargo único Técnico Legislativo; ' + rel.sessoes.length + ' grupos de registros unidos; ' + rel.atividades.length + ' grupos de atividades unidos' });
  };
})();
