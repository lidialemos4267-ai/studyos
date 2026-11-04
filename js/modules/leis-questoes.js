/* Lei seca — questões A–E no estilo da banca (geradas por IA, NÃO oficiais), resolução com comentários
   e integração com o Caderno de Erros e com os flashcards. */
(function () {
  var SOS = window.SOS, U = SOS.U, ui = SOS.ui, E = SOS.E, X = SOS.lex;
  var Q = SOS.leisQ = {};

  Q.st = function () { if (!Array.isArray(SOS.S.questoesLei)) SOS.S.questoesLei = []; return SOS.S.questoesLei; };
  function lei(id) { return (SOS.S.leis || []).find(function (l) { return l.id === id; }); }
  function chave(q) { return U.norm(q.enunciado + ' ' + q.alternativas.map(function (a) { return a.texto; }).join(' ')).slice(0, 300); }

  Q.adicionar = function (l, idxs, questoes, modo) {
    var lista = Q.st(), out = [];
    questoes.forEach(function (q) {
      var k = chave(q); if (lista.some(function (x) { return chave(x) === k; })) return; // sem duplicar
      var i = idxs.find(function (j) { return SOS.leitor.casaArtigo(q.artigo || q.fundamento, l.arts[j].n); });
      if (i == null && idxs.length === 1) i = idxs[0];
      var nq = Object.assign({ id: U.uid('ql'), leiId: l.id, norma: String(l.nome).split(' — ')[0], artN: i != null ? l.arts[i].n : null, artigos: idxs.map(function (j) { return l.arts[j].n; }), criada: U.today(), origem: 'IA (não oficial)', modo: modo || '', resp: [] }, q);
      lista.push(nq); out.push(nq);
    });
    SOS.log('Questões da lei (IA)', out.length + ' questão(ões)'); SOS.save();
    return out;
  };

  /* destaca o comando negativo (INCORRETA / EXCETO / NÃO) depois do escape */
  Q.destacarComando = function (txt) {
    return U.esc(txt).replace(/\b(INCORRETA|INCORRETAS|EXCETO|ERRADA|N[ÃA]O)\b/g, '<mark class="cmd-neg">$1</mark>');
  };

  Q.view = function () {
    var lista = Q.st(), pend = lista.filter(function (q) { return !q.resp.length; }), err = lista.filter(function (q) { return q.resp.length && !q.resp[q.resp.length - 1].ok; });
    var tot = lista.filter(function (q) { return q.resp.length; }), ac = tot.filter(function (q) { return q.resp[q.resp.length - 1].ok; }).length;
    var h = '<div class="alert info" style="display:block"><b>Questões geradas por IA no estilo da banca</b> (5 alternativas, uma correta, comandos positivos e negativos). <b>Não são questões oficiais da Selecon.</b> Para criar: abra uma lei em <b>Leis › Ler / marcar</b>, selecione artigos (caixinha ao lado do número) e use <b>Questões A–E</b>. Questão errada vai para o Caderno de Erros com o artigo vinculado.</div>';
    h += '<div class="row" style="margin-bottom:10px"><span class="tag">' + lista.length + ' questões</span><span class="tag">' + pend.length + ' não respondidas</span>' + (tot.length ? ui.pctBadge(U.pct(ac, tot.length)) : '') + '<span class="spacer"></span>' + (pend.length ? '<button class="btn sm" data-qact="pend">Resolver não respondidas (' + pend.length + ')</button>' : '') + (err.length ? '<button class="btn sm ghost" data-qact="err">Refazer as que errei (' + err.length + ')</button>' : '') + '</div>';
    if (!lista.length) return h + '<div class="empty">Nenhuma questão criada ainda.</div>';
    var by = {}; lista.forEach(function (q) { (by[q.norma] = by[q.norma] || []).push(q); });
    Object.keys(by).forEach(function (n) {
      h += '<div class="card section"><h3>' + U.esc(n) + '</h3>' + by[n].map(function (q) {
        var r = q.resp[q.resp.length - 1];
        return '<div class="list-item"><div class="row"><span class="tag ' + (r ? (r.ok ? 'good' : 'bad') : '') + '">' + (r ? (r.ok ? 'acertei' : 'errei') : 'não respondida') + '</span><span class="tag">' + U.esc(q.comando) + '</span>' + (q.artN ? '<small class="muted">' + U.esc(X.nomeArt(q.artN)) + '</small>' : '') + '<span class="spacer"></span><button class="btn xs" data-qres="' + q.id + '">Resolver</button>' + (q.artN ? '<button class="btn xs ghost" data-qart="' + q.id + '">Abrir artigo</button>' : '') + '<button class="btn xs ghost" data-qdel="' + q.id + '">Excluir</button></div><div style="margin-top:4px">' + Q.destacarComando(q.enunciado.length > 220 ? q.enunciado.slice(0, 217) + '…' : q.enunciado) + '</div></div>';
      }).join('') + '</div>';
    });
    return h;
  };
  Q.onClick = function (e) {
    var x, lista = Q.st();
    if ((x = e.target.closest('[data-qres]'))) { Q.resolver([lista.find(function (q) { return q.id === x.dataset.qres; })]); return true; }
    if ((x = e.target.closest('[data-qart]'))) { var q = lista.find(function (y) { return y.id === x.dataset.qart; }); SOS.leitor.abrirPorId(q.leiId, q.artN); return true; }
    if ((x = e.target.closest('[data-qdel]'))) { var qd = lista.find(function (y) { return y.id === x.dataset.qdel; }); ui.confirm('Excluir esta questão gerada? Erros já registrados no Caderno continuam lá.', function () { SOS.S.questoesLei = lista.filter(function (y) { return y.id !== qd.id; }); SOS.save(); SOS.app.render(); }); return true; }
    if ((x = e.target.closest('[data-qact]'))) { var qs = x.dataset.qact === 'pend' ? lista.filter(function (q) { return !q.resp.length; }) : lista.filter(function (q) { return q.resp.length && !q.resp[q.resp.length - 1].ok; }); Q.resolver(qs); return true; }
    return false;
  };

  /* resolução: escolhe → corrige → comenta as 5 alternativas → erro vai ao Caderno */
  Q.resolver = function (qs) {
    qs = (qs || []).filter(Boolean); if (!qs.length) return;
    var i = 0, ok = 0;
    var m = ui.modal({ title: 'Questões da lei — estilo Selecon (geradas por IA)', wide: true, noFocus: true, body: '<div id="qlr"></div>', buttons: [{ label: 'Encerrar', cls: 'ghost' }], onClose: function () { SOS.app.render(); } });
    function show(marc) {
      var q = qs[i], box = m.root.querySelector('#qlr');
      if (!q) { box.innerHTML = '<div class="empty"><h2>Fim</h2>' + ok + ' de ' + qs.length + ' corretas.</div>'; return; }
      var resp = marc != null, certo = marc === q.gabarito;
      var h = '<div class="row"><small class="muted">' + (i + 1) + ' de ' + qs.length + '</small><span class="tag">' + U.esc(q.norma) + (q.artN ? ' · ' + U.esc(X.nomeArt(q.artN)) : '') + '</span><span class="tag mid">gerada por IA — não oficial</span>' + (q.comando !== 'CORRETA' ? '<span class="tag bad">comando negativo: ' + U.esc(q.comando) + '</span>' : '') + '</div>' +
        '<div class="fc-face ql"><div class="ql-enun">' + Q.destacarComando(q.enunciado) + '</div><div class="ql-alts">' + q.alternativas.map(function (a) {
          var cls = !resp ? '' : a.letra === q.gabarito ? ' certa' : a.letra === marc ? ' errada' : ' outra';
          return '<button class="ql-alt' + cls + '" data-alt="' + a.letra + '"' + (resp ? ' disabled' : '') + '><b>' + a.letra + ')</b> ' + U.esc(a.texto) + (resp && a.comentario ? '<small class="ql-com">' + (a.letra === q.gabarito ? '✓ ' : '✗ ') + U.esc(a.comentario) + '</small>' : '') + '</button>';
        }).join('') + '</div>';
      if (resp) {
        h += '<div class="a"><p><b>' + (certo ? '✓ Você acertou.' : '✗ Você marcou ' + marc + '. Gabarito: ' + q.gabarito + '.') + '</b></p>' + (q.fundamento ? '<p><b>Fundamento:</b> ' + U.esc(q.fundamento) + '</p>' : '') + (q.conhecimento ? '<p><b>O que foi avaliado:</b> ' + U.esc(q.conhecimento) + '</p>' : '') + (q.armadilha ? '<p><b>Armadilha:</b> ' + U.esc(q.armadilha) + '</p>' : '') + '</div>';
        var er = q.erroId && SOS.S.erros.find(function (x) { return x.id === q.erroId; });
        if (!certo && er) h += '<div class="alert mid" style="display:block">Registrado no <b>Caderno de Erros</b>' + ((er.ocorrencias || 1) > 1 ? ' (errou ' + er.ocorrencias + '×)' : '') + '. Motivo do erro: <select data-motivo>' + ui.opts(E.CAT_ERRO, (er.categorias || [])[0]) + '</select></div>';
      }
      h += '</div><div class="row" style="margin-top:12px">' + (q.artN ? '<button class="btn sm ghost" data-q="art">Abrir artigo</button>' : '') + (resp && !certo ? '<button class="btn sm ghost" data-q="fc">Criar flashcard do erro</button>' : '') + '<span class="spacer"></span>' + (resp ? '<button class="btn sm" data-q="prox">' + (i + 1 < qs.length ? 'Próxima' : 'Concluir') + '</button>' : '<small class="muted">Escolha uma alternativa.</small>') + '</div>';
      box.innerHTML = h;
      box.onclick = function (ev) {
        var b = ev.target.closest('[data-alt]');
        if (b && !resp) { var mc = b.dataset.alt, acertou = mc === q.gabarito; q.resp.push({ d: U.today(), marc: mc, ok: acertou }); if (acertou) ok++; else Q.registrarErro(q, mc); SOS.save(); return show(mc); }
        var a = ev.target.closest('[data-q]'); if (!a) return;
        if (a.dataset.q === 'prox') { i++; return show(null); }
        if (a.dataset.q === 'art') return SOS.leitor.abrirPorId(q.leiId, q.artN);
        if (a.dataset.q === 'fc') { var er2 = SOS.S.erros.find(function (x) { return x.id === q.erroId; }); if (er2) SOS.views.flashcards.fromError(er2); }
      };
      box.onchange = function (ev) { if (ev.target.matches('[data-motivo]')) { var er3 = SOS.S.erros.find(function (x) { return x.id === q.erroId; }); if (er3) { er3.categorias = [ev.target.value]; SOS.save(); ui.toast('Motivo do erro salvo.', 'good'); } } };
    }
    show(null);
  };

  /* erro vinculado ao artigo (sem duplicar: errar de novo a mesma questão conta como recorrência) */
  Q.registrarErro = function (q, marc) {
    var S = SOS.S, l = lei(q.leiId), alt = function (k) { var a = q.alternativas.find(function (x) { return x.letra === k; }); return a ? k + ') ' + a.texto : k; };
    var ex = S.erros.find(function (e) { return e.qLeiId === q.id; });
    if (ex) { E.erroRepeat(ex); ex.marcada = alt(marc); q.erroId = ex.id; return ex; }
    var tid = (l && l.topicId) || '', t = SOS.topic(tid), cg = q.alternativas.find(function (a) { return a.letra === q.gabarito; });
    var e = { id: U.uid('e'), topicId: tid, data: U.today(), banca: 'Questão gerada por IA (estilo Selecon)', prova: 'Não oficial · ' + q.norma + (q.artN ? ' · ' + X.nomeArt(q.artN) : ''),
      enunciado: q.enunciado + '\n' + q.alternativas.map(function (a) { return a.letra + ') ' + a.texto; }).join('\n'), marcada: alt(marc), correta: alt(q.gabarito),
      justificativa: [(cg && cg.comentario) || '', q.fundamento ? 'Fundamento: ' + q.fundamento : ''].filter(Boolean).join('\n'), porque: q.armadilha ? 'Armadilha: ' + q.armadilha : '', aprender: q.conhecimento || '', obs: '', link: '', imagem: '',
      categorias: ['Desconhecimento da legislação'], status: 'Novo', ocorrencias: 1, flashcardIds: [], concursos: t ? t.concursos.slice() : [], origem: 'Lei seca (IA)', qLeiId: q.id,
      leiRef: q.artN ? { leiId: q.leiId, n: q.artN, disp: '' } : null, fundamentoLei: q.fundamento || '' };
    e.rev = E.erroNew(e.data);
    S.erros.push(e); if (t) t.bonusErro = (t.bonusErro || 0) + 0.5;
    q.erroId = e.id;
    SOS.log('Erro registrado (questão da lei)', q.norma);
    return e;
  };
})();
