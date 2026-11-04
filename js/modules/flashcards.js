/* Flashcards: revisão espaçada (estilo Anki), conversão de erros, decks, sugestões, exportação/importação CSV. */
(function () {
  var SOS = window.SOS, U = SOS.U, ui = SOS.ui, E = SOS.E;
  var tab = 'painel', f = { disc: '', topic: '', origem: '', estado: '', q: '' };
  var ORIGENS = ['Erro', 'Aula', 'Leitura', 'Legislação', 'Conteúdo importante', 'Importado'];
  var TIPOS = ['Pergunta objetiva', 'Conceito', 'Situação-problema', 'Diferença entre dois institutos', 'Dispositivo legal', 'Regra e exceção', 'Prazos e competências', 'Literalidade', 'Comparação', 'Aplicação prática'];
  var picked = {}; // cartões marcados para exportar
  var ESTADOS = { novo: 'Novo', revisao: 'Em revisão', atrasado: 'Atrasado', aprendido: 'Aprendido', dificil: 'Com dificuldade' };

  function inConc(c) { var conc = SOS.app.conc; return conc === 'all' || (c.concursos || []).indexOf(conc) > -1; }

  SOS.views.flashcards = {
    render: function (el, q) {
      if (q && q.get('revisar')) { history.replaceState(null, '', '#flashcards'); setTimeout(review, 30); }
      if (q && q.get('sug')) { tab = 'sug'; history.replaceState(null, '', '#flashcards'); }
      if (q && q.get('aprovar')) { tab = 'aprovar'; history.replaceState(null, '', '#flashcards'); }
      var cs = SOS.S.flashcards.filter(inConc);
      var st = { novo: 0, revisao: 0, atrasado: 0, aprendido: 0, dificil: 0 };
      cs.forEach(function (c) { st[E.cardState(c)]++; });
      var due = cs.filter(E.cardDue).length;
      var logs = []; cs.forEach(function (c) { (c.log || []).forEach(function (l) { logs.push(l); }); });
      var okp = U.pct(logs.filter(function (l) { return l.r !== 'errei'; }).length, logs.length);
      var sug = E.suggestCardsFromErrors();
      var h = '<div class="row" style="margin-bottom:14px"><button class="btn" data-act="review">Revisar flashcards de hoje <span class="badge soft">' + due + '</span></button><span class="spacer"></span><button class="btn ghost" data-act="new">+ Novo flashcard</button></div>';
      h += '<div class="tabs">' + [['painel', 'Painel'], ['aprovar', 'Para aprovar (' + (SOS.S.cardDrafts || []).length + ')'], ['lista', 'Cartões e decks'], ['sug', 'Sugestões (' + sug.length + ')'], ['io', 'Exportar / Importar']].map(function (x) { return '<button class="tab ' + (tab === x[0] ? 'active' : '') + '" data-tab="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>';
      if (tab === 'painel') {
        h += '<div class="grid g4">' + k('Total de cartões', cs.length) + k('Novos', st.novo) + k('Para revisar hoje', due) + k('Atrasados', st.atrasado) + '</div><div class="grid g4 section">' + k('Aprendidos', st.aprendido, '≥ 3 acertos seguidos e intervalo ≥ 15 dias') + k('Com dificuldade', st.dificil) + k('% de acertos', ui.pctBadge(okp), logs.length + ' revisões') + k('Originados de erros', cs.filter(function (c) { return c.erroId; }).length) + '</div>';
        var wk = E.weekly(SOS.app.conc, 8);
        h += '<div class="grid g2 section"><div class="card"><h3>Evolução semanal — % de acertos</h3>' + ui.lineChart([{ name: '% acertos', color: '#16a34a', data: wk.map(function (w) { return w.cardPct; }) }], { labels: wk.map(function (w) { return w.label; }), max: 100, fmt: function (v) { return Math.round(v) + '%'; } }) + '</div><div class="card"><h3>Revisões por semana</h3>' + ui.barChart(wk.map(function (w) { return w.label; }), wk.map(function (w) { return w.cardRev; }), { color: '#16a34a' }) + '</div></div>';
        h += '<div class="card section"><h3>Como funciona a revisão</h3><p style="margin:0">Depois de ver a resposta, avalie: <b>Errei</b> (volta para ' + SOS.S.settings.intervalosCard[0] + ' dia e reduz a facilidade), <b>Difícil</b> (intervalo cresce pouco), <b>Bom</b> (segue os degraus ' + SOS.S.settings.intervalosCard.join(', ') + ' dias e depois multiplica pela facilidade) ou <b>Fácil</b> (pula um degrau). Um cartão só conta como aprendido após 3 acertos seguidos e intervalo de 15 dias ou mais.</p></div>';
        h += porAssunto(cs);
      } else if (tab === 'aprovar') h += aprovar();
      else if (tab === 'lista') h += lista(cs);
      else if (tab === 'sug') h += sugestoes(sug);
      else h += io();
      el.innerHTML = h;
      el.onclick = onClick;
      el.onchange = function (e) { var x = e.target.dataset.f; if (x && x !== 'q') { f[x] = e.target.value; SOS.app.render(); } if (e.target.name === 'csv') importCSV(e.target.files[0]); };
      var qs = el.querySelector('[data-f=q]'); if (qs) qs.addEventListener('input', function () { f.q = qs.value; clearTimeout(qs._t); qs._t = setTimeout(function () { SOS.app.render(); var n = document.querySelector('[data-f=q]'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 300); });
    },
    fromError: fromError, review: review
  };
  /* fila do dia por assunto (um assunto = um item) */
  function porAssunto(cs) {
    var by = {};
    cs.filter(E.cardDue).forEach(function (c) { var k2 = c.topicId || '—'; by[k2] = (by[k2] || 0) + 1; });
    var ks = Object.keys(by).sort(function (a, b) { return by[b] - by[a]; });
    return '<div class="card section"><h3>Fila de hoje por assunto</h3>' + (ks.length ? ks.map(function (k2) { var t = SOS.topic(k2); return '<div class="list-item row">' + (t ? ui.discTag(t.disc) : '') + '<span>' + U.esc(t ? t.titulo : 'Sem assunto') + '</span><span class="spacer"></span><span class="tag">' + by[k2] + ' cartão(ões)</span><button class="btn xs" data-revtopic="' + U.esc(k2 === '—' ? '' : k2) + '">Revisar</button></div>'; }).join('') : '<div class="empty">Nenhum cartão para hoje. ♡</div>') + '</div>';
  }
  function aprovar() {
    var ds = SOS.S.cardDrafts || [], ia = !!SOS.S.settings.iaEndpoint;
    var h = '<div class="alert info" style="display:block">Cartões gerados das questões que você errou ou marcou como “chutei/em dúvida” e da <b>lei seca</b> (Lei seca › Ler / marcar › Flashcards). Frente curta, verso com resposta, fundamento e a explicação do erro em 2 linhas — um conceito por cartão, sem repetir. Nada entra no baralho sem a sua aprovação.' + (ia ? '' : ' <br><small>Geração por regras (sem IA). Para usar IA, configure uma rota de servidor em Configurações — a chave nunca fica no navegador.</small>') + '</div>';
    h += '<div class="row" style="margin-bottom:10px"><button class="btn ghost sm" data-act="dgen">Gerar das questões salvas</button>' + (ia ? '<button class="btn ghost sm" data-act="dia">Melhorar com IA</button>' : '') + '<span class="spacer"></span>' + (ds.length ? '<button class="btn sm good" data-act="dall">Aprovar todos</button>' : '') + '</div>';
    if (!ds.length) return h + '<div class="empty">Nada para aprovar agora.</div>';
    return h + ds.map(function (d) {
      var t = SOS.topic(d.topicId);
      return '<div class="card" style="margin-bottom:10px" data-draft="' + d.id + '"><div class="row" style="margin-bottom:6px">' + (t ? ui.discTag(t.disc) : '') + '<small class="muted">' + U.esc(t ? t.titulo : '') + ' · ' + U.esc(d.origem || '') + (d.ia ? ' · IA' : '') + '</small></div><div class="form">' +
        '<label class="f full"><span>Frente</span><textarea name="fr" rows="2">' + U.esc(d.frente) + '</textarea></label>' +
        '<label class="f full"><span>Verso — resposta</span><textarea name="vs" rows="2">' + U.esc(d.verso) + '</textarea></label>' +
        '<label class="f"><span>Fundamento (artigo ou regra)</span><input name="fu" value="' + U.esc(d.fundamento || '') + '"></label>' +
        '<label class="f"><span>' + (d.leiRef || d.origem === 'Legislação' ? 'Explicação' : 'Explicação do erro (2 linhas)') + '</span><textarea name="ex" rows="2">' + U.esc(d.explicacao || '') + '</textarea></label>' +
        '<label class="f"><span>Tipo</span><select name="tp">' + ui.opts(TIPOS.indexOf(d.tipo) > -1 || !d.tipo ? TIPOS : TIPOS.concat([d.tipo]), d.tipo || 'Pergunta objetiva') + '</select></label>' +
        '<label class="f"><span>Tags (separadas por espaço)</span><input name="tg" value="' + U.esc(Array.isArray(d.tags) ? d.tags.join(' ') : d.tags || '') + '"></label></div>' +
        (d.leiRef ? '<small class="muted">Referência legal: ' + U.esc(refTxt(d.leiRef)) + (d.nivel ? ' · nível ' + U.esc(d.nivel) : '') + '</small>' : '') +
        '<div class="row" style="margin-top:8px"><button class="btn xs good" data-dok="' + d.id + '">Aprovar</button><button class="btn xs ghost" data-dno="' + d.id + '">Descartar</button>' + (d.leiRef ? '<button class="btn xs ghost" data-art="' + U.esc(d.leiRef.leiId) + '|' + U.esc(d.leiRef.n) + '">Abrir artigo</button>' : '') + '</div></div>';
    }).join('');
  }
  function readDraft(id) {
    var el = document.querySelector('[data-draft="' + id + '"]'); if (!el) return null;
    var o = { frente: el.querySelector('[name=fr]').value, verso: el.querySelector('[name=vs]').value, fundamento: el.querySelector('[name=fu]').value, explicacao: el.querySelector('[name=ex]').value };
    if (el.querySelector('[name=tp]')) { o.tipo = el.querySelector('[name=tp]').value; o.tags = el.querySelector('[name=tg]').value.split(/\s+/).filter(Boolean); }
    return o;
  }
  /* referência legal (campo próprio, não depende do texto da pergunta) */
  function refTxt(r) {
    if (!r) return '';
    var l = (SOS.S.leis || []).find(function (x) { return x.id === r.leiId; });
    return (SOS.lex ? SOS.lex.nomeArt(r.n) : 'Art. ' + r.n) + (r.disp && r.disp !== 'caput' ? ', ' + r.disp : '') + (l ? ' — ' + l.nome.split(' — ')[0] : '');
  }

  /* ---------- geração de cartões a partir das questões salvas ---------- */
  var C = SOS.cards = {};
  function firstSentence(s, max) { s = String(s || '').replace(/\s+/g, ' ').trim(); var m = s.match(/^(.{20,}?[.!?])(\s|$)/); s = m ? m[1] : s; return s.length > (max || 170) ? s.slice(0, (max || 170) - 1) + '…' : s; }
  /* já existe (mesma referência ou frente muito parecida) na fila ou no baralho? */
  C.jaExiste = function (d) {
    var S = SOS.S, ds = S.cardDrafts || [];
    if (d.ref && (ds.some(function (x) { return x.ref === d.ref; }) || S.flashcards.some(function (x) { return x.ref === d.ref; }))) return true;
    var lim = d.leiRef ? 0.9 : 0.75; // cartões de lei têm frentes parecidas ("Complete (Art. 5º…)"); exige semelhança maior
    var dup = function (x) { return U.norm(x.frente) === U.norm(d.frente) || (U.similar(x.frente, d.frente) >= lim && (!d.leiRef || U.norm(x.verso) === U.norm(d.verso))); };
    return S.flashcards.some(dup) || ds.some(dup);
  };
  C.addDraft = function (d) {
    var S = SOS.S; S.cardDrafts = S.cardDrafts || [];
    if (!d || !d.frente || !d.verso) return false;
    if (C.jaExiste(d)) return false;
    S.cardDrafts.push(Object.assign({ id: U.uid('dr'), criado: U.today() }, d));
    return true;
  };
  C.fromQuestion = function (q) {
    if (!q || !q.enun || !q.gab || !(q.alts || []).length) return null;
    var alt = function (l) { var a = q.alts.find(function (x) { return x.l === l; }); return a ? a.t : ''; };
    var ce = q.alts.length === 2 && /^certo$/i.test((q.alts[0].t || '').trim());
    var stem = q.enun.replace(/\s+/g, ' ').replace(/\b(assinale|marque) a (alternativa|op[cç][aã]o)[^.?:]*[.?:]?\s*$/i, '').trim();
    if (stem.length > 220) stem = stem.slice(0, 217) + '…';
    var frente = ce ? 'Certo ou errado? ' + stem : (/[?:]$/.test(stem) ? stem : stem + ' → ?');
    var verso = ce ? (q.gab === 'C' ? 'Certo' : 'Errado') : q.gab + ') ' + alt(q.gab);
    var art = (q.com || '').match(/\bart(?:igo)?\.?\s*\d+[º°o]?(?:[^.;\n]{0,60})?/i);
    var exp = (q.marc && q.marc !== q.gab ? 'Você marcou ' + q.marc + (ce ? '' : ') ' + alt(q.marc).slice(0, 60)) + '. ' : q.marca ? 'Você acertou, mas marcou como “' + q.marca + '”. ' : '') + firstSentence(q.com, 160);
    return { frente: frente, verso: verso, fundamento: art ? art[0].trim() : '', explicacao: exp.trim(), topicId: q.topicId && q.topicId !== 'none' ? q.topicId : '', origem: q.v > 0 ? 'Erro' : 'Questão em dúvida', ref: 'q:' + q.id, tecId: q.id };
  };
  C.autoGenerate = function (forcar) {
    var S = SOS.S, st = SOS.tec ? SOS.tec.st() : null, n = 0; if (!st) return 0;
    st.cardFeito = st.cardFeito || {};
    SOS.tec.list().forEach(function (q) {
      if (!(q.v > 0 || q.marca) || st.cardFeito[q.id]) return;
      var d = C.fromQuestion(q); if (!d) return;
      st.cardFeito[q.id] = 1;
      if (C.addDraft(d)) n++;
    });
    return n;
  };
  C.approve = function (id, edit) {
    var S = SOS.S, d = (S.cardDrafts || []).find(function (x) { return x.id === id; }); if (!d) return;
    if (edit) Object.assign(d, edit);
    var t = SOS.topic(d.topicId), er = d.tecId ? S.erros.find(function (e) { return e.tecId === d.tecId; }) : null;
    var tags = Array.isArray(d.tags) ? d.tags.join(' ') : (d.tags || '');
    var c = { id: U.uid('f'), tipo: d.tipo || 'Pergunta objetiva', frente: d.frente.trim(), verso: d.verso.trim(), explicacao: (d.explicacao || '').trim(), fundamento: (d.fundamento || '').trim(), pegadinha: d.pegadinha || '', topicId: d.topicId || '', concursos: t ? t.concursos.slice() : ['TEC'], banca: 'Selecon', origem: er ? 'Erro' : (d.origem || 'Conteúdo importante'), erroId: er ? er.id : null, ref: d.ref || null, tags: tags, srs: E.cardNew(), log: [], criadoEm: U.today() };
    if (d.leiRef) c.leiRef = d.leiRef;
    if (d.nivel) c.nivel = d.nivel;
    if (d.ia) c.ia = true;
    if (!c.frente || !c.verso) return ui.toast('Frente e verso não podem ficar vazios.', 'bad');
    S.flashcards.push(c); if (er) { er.flashcardIds = er.flashcardIds || []; er.flashcardIds.push(c.id); }
    S.cardDrafts = S.cardDrafts.filter(function (x) { return x.id !== id; });
    SOS.log('Flashcard aprovado', c.frente.slice(0, 60)); SOS.save();
  };
  C.discard = function (id) { SOS.S.cardDrafts = (SOS.S.cardDrafts || []).filter(function (x) { return x.id !== id; }); SOS.save(); };
  /* IA: o navegador só chama a SUA rota de servidor; a chave da API fica lá, em variável de ambiente */
  C.generateAI = function () {
    var url = SOS.S.settings.iaEndpoint, st = SOS.tec.st();
    var qs = (SOS.S.cardDrafts || []).filter(function (d) { return d.tecId && !d.ia; }).map(function (d) { var q = st.qs[d.tecId]; return q && { id: q.id, enunciado: q.enun, alternativas: q.alts, gabarito: q.gab, marcada: q.marc, comentario: q.com, assunto: q.ass }; }).filter(Boolean);
    if (!url || !qs.length) return ui.toast(url ? 'Nenhum cartão gerado por regras para melhorar.' : 'Configure a rota de IA em Configurações.', 'mid');
    ui.toast('Enviando ' + qs.length + ' questão(ões) para a sua rota de IA…');
    fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ questoes: qs }) }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }).then(function (j) {
      var n = 0;
      (j.cards || []).forEach(function (c) {
        var d = SOS.S.cardDrafts.find(function (x) { return x.tecId === c.id; }); if (!d || !c.frente || !c.verso) return;
        Object.assign(d, { frente: c.frente, verso: c.verso, fundamento: c.fundamento || d.fundamento, explicacao: c.explicacao || d.explicacao, ia: true }); n++;
      });
      SOS.save(); SOS.app.render(); ui.toast(n + ' cartão(ões) reescrito(s) pela IA — revise antes de aprovar.', 'good');
    }).catch(function (e) { ui.toast('A rota de IA falhou: ' + e.message, 'bad', 6000); });
  };

  function k(l, v, s) { return '<div class="card kpi"><div class="l">' + l + '</div><div class="v">' + v + '</div>' + (s ? '<div class="s">' + s + '</div>' : '') + '</div>'; }

  function lista(cs) {
    cs = cs.filter(function (c) {
      var t = SOS.topic(c.topicId);
      return (!f.disc || (t && t.disc === f.disc)) && (!f.topic || c.topicId === f.topic) && (!f.origem || c.origem === f.origem) && (!f.estado || E.cardState(c) === f.estado) && (!f.q || U.norm(c.frente + ' ' + c.verso).indexOf(U.norm(f.q)) > -1);
    });
    var h = '<div class="row" style="margin-bottom:10px"><input type="search" data-f="q" placeholder="Buscar…" value="' + U.esc(f.q) + '" style="max-width:200px"><select data-f="disc">' + ui.discOptions(f.disc, true) + '</select><select data-f="topic" style="max-width:240px">' + ui.topicOptions(f.topic, SOS.app.conc, true).replace('— selecione o assunto —', 'Todos os assuntos') + '</select><select data-f="origem"><option value="">Todas as origens</option>' + ui.opts(ORIGENS, f.origem) + '</select><select data-f="estado"><option value="">Todos os estados</option>' + ui.opts(Object.keys(ESTADOS).map(function (x) { return [x, ESTADOS[x]]; }), f.estado) + '</select></div>';
    // decks por disciplina › assunto
    var decks = {};
    cs.forEach(function (c) { var t = SOS.topic(c.topicId); var d = t ? t.disc : '—'; (decks[d] = decks[d] || []).push(c); });
    if (!cs.length) return h + '<div class="empty">Nenhum cartão. Crie a partir de um erro do Caderno ou com “+ Novo flashcard”.</div>';
    var np = Object.keys(picked).filter(function (id) { return picked[id] && find(id); }).length;
    h += '<div class="row" style="margin-bottom:6px"><small class="muted">' + np + ' selecionado(s) para exportar</small><button class="btn xs ghost" data-pickall>Selecionar os ' + cs.length + ' do filtro</button>' + (np ? '<button class="btn xs ghost" data-picknone>Limpar seleção</button><button class="btn xs" data-act="exportSel">Exportar selecionados (CSV)</button>' : '') + '</div>';
    lista._ids = cs.map(function (c) { return c.id; });
    Object.keys(decks).forEach(function (d) {
      h += '<div class="card section"><div class="card-h">' + ui.discTag(d) + '<div class="right"><small class="muted">' + decks[d].length + ' cartões</small></div></div>' + decks[d].map(function (c) {
        var t = SOS.topic(c.topicId), s = E.cardState(c);
        return '<div class="list-item"><div class="row"><label class="chk" title="Selecionar para exportar"><input type="checkbox" data-pick="' + c.id + '"' + (picked[c.id] ? ' checked' : '') + '></label><span class="tag ' + ({ aprendido: 'good', dificil: 'bad', atrasado: 'bad', novo: '', revisao: 'mid' }[s]) + '">' + ESTADOS[s] + '</span><span class="tag">' + U.esc(c.origem) + '</span>' + ui.concTags(c.concursos) + '<small class="muted">' + U.esc(t ? t.titulo.slice(0, 70) : '') + '</small><span class="spacer"></span><small class="muted">próx.: ' + U.fmtShort(c.srs.due) + ' · int. ' + c.srs.int + 'd · ' + (c.log || []).length + ' rev.</small></div>' +
          '<div style="margin-top:4px"><b>' + U.esc(c.frente) + '</b></div><div class="muted" style="white-space:pre-wrap">' + U.esc(c.verso) + '</div>' +
          '<div class="row" style="gap:6px;margin-top:6px"><button class="btn xs ghost" data-edit="' + c.id + '">Editar</button>' + (c.erroId ? '<button class="btn xs ghost" data-erro="' + c.erroId + '">Abrir erro de origem</button>' : '') + (c.leiRef ? '<button class="btn xs ghost" data-art="' + U.esc(c.leiRef.leiId) + '|' + U.esc(c.leiRef.n) + '" title="' + U.esc(refTxt(c.leiRef)) + '">Abrir artigo</button>' : '') + '<button class="btn xs ghost" data-reset="' + c.id + '">Reiniciar progresso</button><button class="btn xs ghost" data-del="' + c.id + '">Excluir</button></div></div>';
      }).join('') + '</div>';
    });
    return h;
  }
  function sugestoes(sug) {
    var h = '<p class="muted" style="margin-top:0">O sistema sugere flashcards quando identifica erros recorrentes, confusão entre conceitos, esquecimento, dificuldade com legislação ou assunto com aproveitamento abaixo de 70%. A conversão nunca é automática: você revisa e aprova cada cartão.</p>';
    if (!sug.length) return h + '<div class="empty">Nenhuma sugestão no momento.</div>';
    return h + '<div class="card">' + sug.map(function (e) {
      var t = SOS.topic(e.topicId), why = [];
      if ((e.ocorrencias || 1) > 1) why.push('erro recorrente (' + e.ocorrencias + '×)');
      ['Confusão entre conceitos', 'Esquecimento', 'Desconhecimento da legislação'].forEach(function (c) { if ((e.categorias || []).indexOf(c) > -1) why.push(c.toLowerCase()); });
      var st = E.topicStats(e.topicId); if (st.pct != null && st.pct < 70 && st.total >= 5) why.push('assunto com ' + U.fmtPct(st.pct));
      return '<div class="list-item"><div class="row">' + (t ? ui.discTag(t.disc) : '') + '<b>' + U.esc(t ? t.titulo : '') + '</b><span class="spacer"></span><button class="btn xs" data-fromerr="' + e.id + '">Criar flashcard</button><button class="btn xs ghost" data-ign="' + e.id + '">Ignorar</button></div><small class="muted">Motivo: ' + U.esc(why.join(', ')) + '</small>' + (e.aprender ? '<br><small>' + U.esc(e.aprender) + '</small>' : '') + '</div>';
    }).join('') + '</div>';
  }
  function io() {
    var all = SOS.S.flashcards.filter(inConc), np = Object.keys(picked).filter(function (id) { return picked[id] && find(id); }).length, lei = all.filter(function (c) { return c.leiRef || c.origem === 'Legislação'; }).length;
    return '<div class="grid g2"><div class="card"><h3>Exportar para o Anki (CSV)</h3><p class="muted">Só cartões <b>aprovados</b> (os da fila “Para aprovar” não saem). Colunas: Frente; Verso; Disciplina; Assunto; Concurso; Tags — iguais às de antes — e, no fim, Explicação; Fundamento; Banca; Tipo; Referência legal; Resposta. No Anki: <i>Arquivo › Importar</i>; o cabeçalho já informa separador e colunas (as duas primeiras viram frente e verso).</p><div class="row" style="gap:6px"><button class="btn" data-act="export">Todos do filtro (' + all.length + ')</button><button class="btn ghost" data-act="exportLei"' + (lei ? '' : ' disabled') + '>Só lei seca (' + lei + ')</button><button class="btn ghost" data-act="exportSel"' + (np ? '' : ' disabled') + '>Selecionados (' + np + ')</button></div><p><small class="muted">Para escolher cartões, marque as caixinhas em “Cartões e decks”.</small></p></div>' +
      '<div class="card"><h3>Importar cartões</h3><p class="muted">Aceita CSV com colunas Frente, Verso e opcionalmente Disciplina, Assunto, Concurso, Tags e as colunas extras exportadas pelo StudyOS (separador vírgula, ponto e vírgula ou tab). Cartões com frente igual ou muito semelhante a um existente são ignorados.</p><input type="file" name="csv" accept=".csv,.txt,.tsv"></div></div>';
  }
  function find(id) { return SOS.S.flashcards.find(function (c) { return c.id === id; }); }
  function onClick(e) {
    var x;
    if ((x = e.target.closest('[data-tab]'))) { tab = x.dataset.tab; return SOS.app.render(); }
    if (e.target.closest('[data-act=review]')) return review();
    if ((x = e.target.closest('[data-revtopic]'))) return review(x.dataset.revtopic);
    if ((x = e.target.closest('[data-dok]'))) { SOS.cards.approve(x.dataset.dok, readDraft(x.dataset.dok)); return SOS.app.render(); }
    if ((x = e.target.closest('[data-dno]'))) { SOS.cards.discard(x.dataset.dno); return SOS.app.render(); }
    if (e.target.closest('[data-act=dall]')) { (SOS.S.cardDrafts || []).slice().forEach(function (d) { SOS.cards.approve(d.id, readDraft(d.id)); }); ui.toast('Cartões aprovados e incluídos no baralho.', 'good'); return SOS.app.render(); }
    if (e.target.closest('[data-act=dgen]')) { var n = SOS.cards.autoGenerate(true); ui.toast(n ? n + ' cartão(ões) novo(s) gerado(s) das questões salvas.' : 'Nenhuma questão salva nova para virar cartão.', n ? 'good' : 'mid'); return SOS.app.render(); }
    if (e.target.closest('[data-act=dia]')) return SOS.cards.generateAI();
    if (e.target.closest('[data-act=new]')) return editor([blank()], null);
    if (e.target.closest('[data-act=export]')) return exportCSV();
    if (e.target.closest('[data-act=exportLei]')) return exportCSV(function (c) { return c.leiRef || c.origem === 'Legislação'; }, 'lei-seca');
    if (e.target.closest('[data-act=exportSel]')) return exportCSV(function (c) { return picked[c.id]; }, 'selecionados', true);
    if ((x = e.target.closest('[data-pick]'))) { picked[x.dataset.pick] = x.checked; return SOS.app.render(); }
    if (e.target.closest('[data-pickall]')) { (lista._ids || []).forEach(function (id) { picked[id] = true; }); return SOS.app.render(); }
    if (e.target.closest('[data-picknone]')) { picked = {}; return SOS.app.render(); }
    if ((x = e.target.closest('[data-art]'))) { var pr = x.dataset.art.split('|'); return SOS.leitor.abrirPorId(pr[0], pr.slice(1).join('|')); }
    if ((x = e.target.closest('[data-edit]'))) return editor([find(x.dataset.edit)], null, true);
    if ((x = e.target.closest('[data-erro]'))) { var er = SOS.S.erros.find(function (y) { return y.id === x.dataset.erro; }); return er ? SOS.views.erros.openForm({ erro: er }) : ui.toast('Erro de origem foi excluído.', 'mid'); }
    if ((x = e.target.closest('[data-reset]'))) { var c = find(x.dataset.reset); return ui.confirm('Reiniciar o progresso deste cartão? O histórico de revisões será apagado.', function () { c.srs = E.cardNew(); c.log = []; SOS.save(); SOS.app.render(); }, 'Reiniciar'); }
    if ((x = e.target.closest('[data-del]'))) { var d = find(x.dataset.del); return ui.confirm('Excluir este flashcard? O erro de origem (se houver) não é afetado.', function () { SOS.S.flashcards = SOS.S.flashcards.filter(function (y) { return y.id !== d.id; }); SOS.S.erros.forEach(function (er2) { er2.flashcardIds = (er2.flashcardIds || []).filter(function (i) { return i !== d.id; }); }); SOS.log('Flashcard excluído', d.frente.slice(0, 60)); SOS.save(); SOS.app.render(); }); }
    if ((x = e.target.closest('[data-fromerr]'))) return fromError(SOS.S.erros.find(function (y) { return y.id === x.dataset.fromerr; }));
    if ((x = e.target.closest('[data-ign]'))) { var ei = SOS.S.erros.find(function (y) { return y.id === x.dataset.ign; }); ei.ignorarSugestao = true; SOS.save(); return SOS.app.render(); }
  }
  function blank(topicId) { var t = SOS.topic(topicId); return { id: U.uid('f'), tipo: 'Pergunta objetiva', frente: '', verso: '', explicacao: '', fundamento: '', pegadinha: '', topicId: topicId || '', concursos: t ? t.concursos.slice() : [], banca: 'Selecon', origem: 'Aula', erroId: null, tags: '', srs: E.cardNew(), log: [], criadoEm: U.today() }; }

  function fromError(e, origem) {
    if (!e) return;
    var real = !!(e.id && SOS.S.erros.some(function (x) { return x.id === e.id; }));
    var drafts = E.draftFromError(e).map(function (d) { var c = blank(e.topicId); Object.assign(c, d); c.origem = real ? 'Erro' : (origem || 'Conteúdo importante'); c.erroId = real ? e.id : null; c.banca = e.banca || 'Selecon'; if (e.leiRef) { c.leiRef = e.leiRef; if (!c.fundamento) c.fundamento = e.fundamentoLei || refTxt(e.leiRef); } return c; });
    editor(drafts, real ? e : null);
  }

  /* editor com revisão e aprovação antes de salvar (um ou vários cartões) */
  function editor(cards, erro, isEdit) {
    function cardHtml(c, i) {
      var dup = E.findDuplicateCard(c.frente, c.id);
      return '<div class="card flat" data-i="' + i + '" style="margin-bottom:12px"><div class="row" style="margin-bottom:8px"><b style="font-family:var(--f-head)">Cartão ' + (i + 1) + '</b>' + (cards.length > 1 ? '<label class="chk"><input type="checkbox" name="keep' + i + '" checked> salvar este</label>' : '') + '<span class="spacer"></span><span class="dupwarn" data-dw="' + i + '">' + (dup ? '<span class="tag mid">Parecido com um cartão existente: “' + U.esc(dup.card.frente.slice(0, 50)) + '”</span>' : '') + '</span></div><div class="form">' +
        '<label class="f"><span>Tipo de frente</span><select name="tipo' + i + '">' + ui.opts(TIPOS, c.tipo) + '</select></label>' +
        '<label class="f"><span>Origem</span><select name="origem' + i + '">' + ui.opts(ORIGENS, c.origem) + '</select></label>' +
        '<label class="f full"><span>Frente — pergunta curta e específica (um conceito só)</span><textarea name="frente' + i + '" rows="2">' + U.esc(c.frente) + '</textarea></label>' +
        '<label class="f full"><span>Verso — resposta correta</span><textarea name="verso' + i + '" rows="2">' + U.esc(c.verso) + '</textarea></label>' +
        '<label class="f"><span>Explicação objetiva</span><textarea name="explicacao' + i + '" rows="2">' + U.esc(c.explicacao) + '</textarea></label>' +
        '<label class="f"><span>Fundamentação (lei, artigo, doutrina)</span><textarea name="fundamento' + i + '" rows="2">' + U.esc(c.fundamento) + '</textarea></label>' +
        '<label class="f full"><span>Pegadinha / ponto de atenção</span><input name="pegadinha' + i + '" value="' + U.esc(c.pegadinha) + '"></label>' +
        '<label class="f full"><span>Assunto</span><select name="topic' + i + '">' + ui.topicOptions(c.topicId, null, true) + '</select></label>' +
        '<div class="full row"><span class="muted" style="font-size:13px">Concursos:</span>' + SOS.S.concursos.map(function (cc) { return '<label class="chk"><input type="checkbox" name="conc' + i + '" value="' + cc.id + '"' + ((c.concursos || []).indexOf(cc.id) > -1 ? ' checked' : '') + '> ' + U.esc(cc.sigla) + '</label>'; }).join('') + '</div>' +
        '<label class="f"><span>Banca</span><input name="banca' + i + '" value="' + U.esc(c.banca || '') + '"></label>' +
        '<label class="f"><span>Tags (separadas por espaço)</span><input name="tags' + i + '" value="' + U.esc(c.tags || '') + '"></label>' +
        '</div></div>';
    }
    var tips = erro ? '<div class="alert info" style="display:block"><b>Rascunho gerado a partir do erro.</b> Revise antes de aprovar: a frente deve perguntar o <i>conceito</i> que levou ao erro (não copiar o enunciado inteiro), e o verso deve ser curto. ' + (erro.aprender ? '' : 'Dica: preencha “O que preciso aprender?” no erro para rascunhos melhores.') + '</div>' : '';
    var m = ui.modal({
      title: isEdit ? 'Editar flashcard' : erro ? 'Transformar erro em flashcard' : 'Novo flashcard', wide: true,
      body: tips + '<div id="cardsBox">' + cards.map(cardHtml).join('') + '</div>' + (isEdit ? '' : '<button class="btn sm ghost" data-addcard>+ Outro cartão (conceito diferente)</button>'),
      onOpen: function (root) {
        root.addEventListener('click', function (ev) {
          if (!ev.target.closest('[data-addcard]')) return;
          collect(root); var c = blank(cards[0].topicId); c.origem = cards[0].origem; c.erroId = cards[0].erroId; c.concursos = cards[0].concursos.slice(); cards.push(c);
          root.querySelector('#cardsBox').innerHTML = cards.map(cardHtml).join('');
        });
        root.addEventListener('input', function (ev) {
          var mt = ev.target.name && ev.target.name.match(/^frente(\d+)$/); if (!mt) return;
          var i = +mt[1], dup = E.findDuplicateCard(ev.target.value, cards[i].id);
          root.querySelector('[data-dw="' + i + '"]').innerHTML = dup ? '<span class="tag mid">Parecido com: “' + U.esc(dup.card.frente.slice(0, 50)) + '”</span>' : '';
        });
        root.addEventListener('change', function (ev) {
          var mt = ev.target.name && ev.target.name.match(/^topic(\d+)$/); if (!mt) return;
          var t = SOS.topic(ev.target.value); if (!t) return;
          ui.$$('[name="conc' + mt[1] + '"]', root).forEach(function (cb) { cb.checked = t.concursos.indexOf(cb.value) > -1; });
        });
      },
      buttons: [{ label: 'Cancelar', cls: 'ghost' }, { label: isEdit ? 'Salvar' : 'Aprovar e salvar', cls: 'good', onClick: function (close, root) {
        collect(root);
        var keep = cards.filter(function (c, i) { return cards.length === 1 || ui.val(root, 'keep' + i); });
        for (var i = 0; i < keep.length; i++) {
          if (!keep[i].frente.trim() || !keep[i].verso.trim()) { ui.toast('Preencha frente e verso de todos os cartões selecionados.', 'bad'); return false; }
          if (keep[i].frente.length > 400) { ui.toast('Frente muito longa: cartões devem ser curtos e específicos.', 'mid'); return false; }
        }
        keep.forEach(function (c) {
          if (!find(c.id)) {
            SOS.S.flashcards.push(c);
            if (c.erroId) { var er = SOS.S.erros.find(function (x) { return x.id === c.erroId; }); if (er) { er.flashcardIds = er.flashcardIds || []; if (er.flashcardIds.indexOf(c.id) < 0) er.flashcardIds.push(c.id); } }
          }
        });
        SOS.log(isEdit ? 'Flashcard editado' : 'Flashcard(s) criado(s)', keep.length + ' cartão(ões)');
        SOS.save(); SOS.app.render(); ui.toast(keep.length + ' cartão(ões) salvo(s).', 'good');
      } }]
    });
    function collect(root) {
      cards.forEach(function (c, i) {
        if (!root.querySelector('[name=frente' + i + ']')) return;
        ['tipo', 'origem', 'frente', 'verso', 'explicacao', 'fundamento', 'pegadinha', 'banca', 'tags'].forEach(function (k2) { c[k2] = ui.val(root, k2 + i); });
        c.topicId = ui.val(root, 'topic' + i); c.concursos = ui.checked(root, 'conc' + i);
      });
    }
  }

  /* sessão de revisão */
  function review(topicId) {
    var q = SOS.S.flashcards.filter(function (c) { return E.cardDue(c) && inConc(c) && (!topicId || c.topicId === topicId); }).sort(function (a, b) { return a.srs.due < b.srs.due ? -1 : 1; });
    if (!q.length) { ui.toast('Nenhum flashcard para revisar hoje. 🎉', 'good'); return; }
    var i = 0, res = { errei: 0, dificil: 0, bom: 0, facil: 0 };
    var m = ui.modal({ title: 'Revisar flashcards de hoje', wide: true, body: '<div id="fcr" class="fc"></div>', buttons: [{ label: 'Encerrar', cls: 'ghost' }], onClose: function () { SOS.app.render(); }, noFocus: true });
    function show(reveal) {
      var c = q[i], box = m.root.querySelector('#fcr');
      if (!c) { box.innerHTML = '<div class="empty"><h2>Revisão concluída!</h2>Errei ' + res.errei + ' · Difícil ' + res.dificil + ' · Bom ' + res.bom + ' · Fácil ' + res.facil + '</div>'; return; }
      var t = SOS.topic(c.topicId);
      var lab = function (r) { var n = E.cardPreview(c.srs, r); return n + (n === 1 ? ' dia' : ' dias'); };
      box.innerHTML = '<div class="row" style="margin-bottom:8px"><small class="muted">' + (i + 1) + ' de ' + q.length + '</small>' + (t ? ui.discTag(t.disc) : '') + '<span class="tag">' + U.esc(c.tipo) + '</span>' + ui.concTags(c.concursos) + '</div>' +
        '<div class="fc-face"><div class="q">' + U.esc(c.frente) + '</div>' + (reveal ? '<div class="a"><div style="font-size:17px;white-space:pre-wrap"><b>' + U.esc(c.verso) + '</b></div>' + (c.explicacao ? '<p style="white-space:pre-wrap">' + U.esc(c.explicacao) + '</p>' : '') + (c.fundamento ? '<p class="muted"><b>Fundamentação:</b> ' + U.esc(c.fundamento) + '</p>' : '') + (c.pegadinha ? '<p class="tag mid" style="white-space:normal">⚠ ' + U.esc(c.pegadinha) + '</p>' : '') + (c.erroId ? '<p><small class="muted">Originado de um erro do Caderno' + (function () { var er = SOS.S.erros.find(function (x) { return x.id === c.erroId; }); return er ? ' — conceito errado ' + (er.ocorrencias || 1) + '×' : ''; })() + '</small></p>' : '') + '</div>' : '') + '</div>' +
        (reveal ? '<div class="fc-btns"><button class="btn danger" data-r="errei">Errei<small>' + lab('errei') + '</small></button><button class="btn mid" data-r="dificil">Difícil<small>' + lab('dificil') + '</small></button><button class="btn" data-r="bom">Bom<small>' + lab('bom') + '</small></button><button class="btn good" data-r="facil">Fácil<small>' + lab('facil') + '</small></button></div>' : '<div style="text-align:center;margin-top:14px"><button class="btn" data-show>Mostrar resposta (espaço)</button></div>');
      box.onclick = function (ev) {
        if (ev.target.closest('[data-show]')) return show(true);
        var r = ev.target.closest('[data-r]'); if (r) rate(r.dataset.r);
      };
      m.root.onkeydown = function (ev) {
        if (ev.target.tagName === 'TEXTAREA' || ev.target.tagName === 'INPUT') return;
        if (!reveal && (ev.key === ' ' || ev.key === 'Enter')) { ev.preventDefault(); show(true); }
        else if (reveal && ['1', '2', '3', '4'].indexOf(ev.key) > -1) rate(['errei', 'dificil', 'bom', 'facil'][+ev.key - 1]);
      };
      m.root.tabIndex = -1; m.root.focus();
    }
    function rate(r) {
      var c = q[i]; res[r]++;
      E.cardApply(c.srs, r, U.today());
      c.log = c.log || []; c.log.push({ d: U.today(), r: r });
      // integração com o erro de origem
      if (c.erroId) {
        var er = SOS.S.erros.find(function (x) { return x.id === c.erroId; });
        if (er && er.status !== 'Superado') {
          if (r === 'errei') { if (er.status === 'Corrigido') er.status = 'Em revisão'; }
          else if (E.cardState(c) === 'aprendido') er.status = 'Corrigido';
          else if (er.status === 'Novo' || er.status === 'Precisa estudar novamente') er.status = 'Em revisão';
        }
      }
      if (r === 'errei') q.push(c); // volta ao fim da fila da sessão (como no Anki)
      SOS.save(); i++; show(false);
    }
    show(false);
  }

  /* CSV compatível com Anki */
  function exportCSV(filtro, sufixo, ignoraConc) {
    var cs = SOS.S.flashcards.filter(function (c) { return (ignoraConc || inConc(c)) && (!filtro || filtro(c)); });
    if (!cs.length) { ui.toast('Nenhum cartão para exportar.', 'mid'); return; }
    function html(s) { return U.esc(s || '').replace(/\n/g, '<br>'); }
    var lines = ['#separator:Semicolon', '#html:true', '#columns:Frente;Verso;Disciplina;Assunto;Concurso;Tags;Explicacao;Fundamento;Banca;Tipo;Referencia;Resposta', '#tags column:6'];
    cs.forEach(function (c) {
      var t = SOS.topic(c.topicId);
      var verso = html(c.verso) + (c.explicacao ? '<br><br>' + html(c.explicacao) : '') + (c.fundamento ? '<br><br><i>Fundamentação:</i> ' + html(c.fundamento) : '') + (c.pegadinha ? '<br><br><b>Atenção:</b> ' + html(c.pegadinha) : '');
      var tags = ['StudyOS', (c.origem || '').replace(/\s+/g, '_')].concat(c.leiRef ? ['Lei_Seca'] : []).concat(c.tipo ? ['Tipo::' + c.tipo.replace(/\s+/g, '_')] : []).concat((c.concursos || []).map(function (x) { return 'Concurso::' + x; })).concat(t ? ['Disciplina::' + t.disc] : []).concat((c.tags || '').split(/\s+/).filter(Boolean));
      tags = tags.filter(function (x, k) { return tags.indexOf(x) === k; });
      lines.push([html(c.frente), verso, t ? SOS.disc(t.disc).nome : '', t ? t.titulo : '', (c.concursos || []).map(function (x) { var cc = SOS.conc(x); return cc ? cc.sigla : x; }).join(' / '), tags.join(' '), html(c.explicacao), html(c.fundamento), c.banca || '', c.tipo || '', html(refTxt(c.leiRef)), html(c.verso)].map(U.csvCell).join(';'));
    });
    U.download('studyos-flashcards-anki-' + (sufixo ? sufixo + '-' : '') + U.today() + '.csv', '﻿' + lines.join('\n'), 'text/csv;charset=utf-8');
    ui.toast(cs.length + ' cartões exportados.', 'good');
  }
  function importCSV(file) {
    if (!file) return;
    var r = new FileReader();
    r.onload = function () {
      try {
        var text = String(r.result).replace(/^﻿/, '');
        var sep = /#separator:Tab/i.test(text) ? '\t' : /#separator:Comma/i.test(text) ? ',' : /#separator:Semicolon/i.test(text) ? ';' : null;
        var body = text.split('\n').filter(function (l) { return l.charAt(0) !== '#'; }).join('\n');
        if (!sep) { var first = body.split('\n')[0]; sep = first.split('\t').length > 1 ? '\t' : first.split(';').length >= first.split(',').length ? ';' : ','; }
        var rows = U.parseCSV(body, sep);
        if (rows.length && /^frente$/i.test((rows[0][0] || '').trim())) rows.shift();
        var add = 0, skip = 0;
        function strip(s) { return String(s || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim(); }
        rows.forEach(function (row) {
          var fr = strip(row[0]), vs = row.length > 11 && strip(row[11]) ? strip(row[11]) : strip(row[1]);
          if (!fr || !vs) { skip++; return; }
          if (SOS.S.flashcards.some(function (c) { return U.norm(c.frente) === U.norm(fr) || U.similar(c.frente, fr) >= 0.9; })) { skip++; return; }
          var c = blank(); c.frente = fr; c.verso = vs; c.origem = 'Importado';
          var dn = U.norm(row[2] || ''), an = U.norm(row[3] || '');
          var t = an && SOS.S.topicos.find(function (x) { return U.norm(x.titulo) === an; });
          if (!t && an) t = SOS.S.topicos.filter(function (x) { return !dn || U.norm(SOS.disc(x.disc).nome) === dn || U.norm(x.disc) === dn; }).sort(function (a, b) { return U.similar(b.titulo, an) - U.similar(a.titulo, an); })[0];
          if (t && an && U.similar(t.titulo, an) < 0.3 && U.norm(t.titulo) !== an) t = null;
          if (t) { c.topicId = t.id; c.concursos = t.concursos.slice(); }
          var cn = row[4] || '';
          SOS.S.concursos.forEach(function (cc) { if (cn.indexOf(cc.sigla) > -1 || cn.split(/[\s\/]+/).indexOf(cc.id) > -1) { if (c.concursos.indexOf(cc.id) < 0) c.concursos.push(cc.id); } });
          c.tags = (row[5] || '').split(/\s+/).filter(function (x) { return x && x !== 'StudyOS' && x.indexOf('::') < 0; }).join(' ');
          if (row.length > 11) { c.explicacao = strip(row[6]); c.fundamento = strip(row[7]); c.banca = strip(row[8]) || c.banca; if (strip(row[9])) c.tipo = strip(row[9]); }
          SOS.S.flashcards.push(c); add++;
        });
        SOS.log('Flashcards importados', add + ' novos, ' + skip + ' ignorados'); SOS.save(); SOS.app.render();
        ui.toast(add + ' cartão(ões) importado(s); ' + skip + ' ignorado(s) (duplicados ou incompletos).', add ? 'good' : 'mid', 6000);
      } catch (err) { ui.toast('Não foi possível ler o arquivo: ' + err.message, 'bad', 6000); }
    };
    r.readAsText(file, 'utf-8');
  }
})();
