/* StudyOS — roteamento, menu, filtro global e inicialização. */
(function () {
  var SOS = window.SOS, U = SOS.U, ui = SOS.ui, E = SOS.E;
  var app = SOS.app = {};
  app.NAV = [
    ['dashboard', 'Início', '♡'], ['plano', 'Planejamento', '✿'], ['leis', 'Lei seca', '§'], ['flashcards', 'Flashcards', '❀'],
    ['erros', 'Caderno de Erros', '✎'], ['revisoes', 'Revisões', '↻'], ['desempenho', 'Questões e desempenho', '✓'], ['tec', 'Banco de questões (TEC)', '❖'],
    ['discursivas', 'Discursivas', '¶'], ['simulados', 'Simulados', '◷'], ['edital', 'Edital verticalizado', '☰'], ['concursos', 'Concurso', '✦'],
    ['estatisticas', 'Estatísticas', '✧'], ['config', 'Configurações', '⚙']
  ];
  app.conc = 'all';
  try { app.conc = localStorage.getItem('studyos.ui.conc') || 'all'; } catch (e) { /* ok */ }

  function routeFromHash() { var h = (location.hash || '#dashboard').slice(1).split('?'); return { name: h[0] || 'dashboard', q: new URLSearchParams(h[1] || '') }; }
  app.go = function (name, q) { location.hash = '#' + name + (q ? '?' + q : ''); };

  app.badges = function () {
    var t = U.today();
    return {
      revisoes: E.revisionQueue(t).length,
      erros: SOS.S.erros.filter(E.erroDue).length,
      flashcards: SOS.S.flashcards.filter(E.cardDue).length + (SOS.S.cardDrafts || []).length,
      plano: E.pendingActivities().length,
      tec: SOS.tec ? SOS.tec.pendingAssuntos().length : 0
    };
  };
  app.renderNav = function () {
    var r = routeFromHash(), b = app.badges();
    ui.$('#nav').innerHTML = app.NAV.map(function (n) {
      var badge = b[n[0]] ? '<span class="badge">' + b[n[0]] + '</span>' : '';
      return '<a href="#' + n[0] + '" class="' + (r.name === n[0] ? 'active' : '') + '"><span class="n">' + n[2] + '</span>' + n[1] + badge + '</a>';
    }).join('');
  };
  app.renderBanner = function () {
    var s = SOS.S.settings, h = '';
    if (SOS.recoveredFrom) h += '<div class="alert bad">Os dados principais estavam corrompidos e foram recuperados do snapshot de ' + U.fmtDate(SOS.recoveredFrom.slice(0, 10)) + '.</div>';
    if (SOS.storageError) h += '<div class="alert bad">O navegador bloqueou o armazenamento local. Os dados NÃO serão salvos — abra o arquivo em uma janela normal (não anônima) ou exporte backups.</div>';
    var eb = SOS.tec && SOS.tec.extBackup;
    if (eb && !SOS.tec.hasData()) h += '<div class="alert info"><span>🔁 A extensão tem uma cópia dos seus dados de <b>' + new Date(eb.when).toLocaleString('pt-BR') + '</b> (' + U.esc(eb.resumo || '') + '). Este StudyOS está vazio — provavelmente você abriu por outro endereço ou numa versão nova.</span><button class="btn sm" data-act="restoreExt">Restaurar meus dados</button></div>';
    var last = s.ultimoBackup, need = !last || U.diffDays(last, U.today()) >= s.lembreteBackupDias;
    var hasData = SOS.S.sessoes.length + SOS.S.erros.length + SOS.S.flashcards.length > 0;
    if (need && hasData) h += '<div class="alert mid"><span>💾 ' + (last ? 'Último backup em ' + U.fmtDate(last) + '.' : 'Você ainda não exportou nenhum backup.') + ' Exporte um arquivo para não depender só do navegador.</span><button class="btn sm" data-act="backupNow">Exportar backup agora</button></div>';
    ui.$('#banner').innerHTML = h ? '<div style="padding:12px 24px 0">' + h + '</div>' : '';
  };
  app.render = function () {
    var r = routeFromHash();
    var v = SOS.views[r.name] || SOS.views.dashboard;
    var meta = app.NAV.find(function (n) { return n[0] === r.name; }) || app.NAV[0];
    ui.$('#pageTitle').textContent = meta[1];
    document.title = meta[1] + ' · StudyOS';
    var sel = ui.$('#concFilter');
    sel.innerHTML = ui.concOptions(app.conc, true);
    sel.style.display = v.noFilter || SOS.S.concursos.length < 2 ? 'none' : '';
    if (SOS.S.concursos.length < 2) app.conc = 'all';
    app.renderNav(); app.renderBanner();
    var el = ui.$('#view');
    try { v.render(el, r.q); }
    catch (e) { console.error(e); el.innerHTML = '<div class="alert bad">Erro ao exibir este módulo: ' + U.esc(e.message) + '. Seus dados não foram afetados.</div>'; }
  };
  app.applyTheme = function () {
    var t = SOS.S.settings.tema;
    if (t === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t);
  };

  document.addEventListener('DOMContentLoaded', function () {
    SOS.load();
    app.applyTheme();
    // migração v3: recalcula o plano até a prova e mostra (uma vez) o relatório
    if (SOS.S.replanPendente) {
      var r = E.replanAll(); SOS.mergeDayActivities(SOS.S, { sessoes: [], atividades: [] });
      if (SOS.S.migr3Relatorio) SOS.S.migr3Relatorio.replan = r;
      delete SOS.S.replanPendente; SOS.saveNow();
    }
    if (SOS.cards) { if (SOS.cards.autoGenerate()) SOS.saveNow(); }
    if (SOS.S.migr4Aviso) { delete SOS.S.migr4Aviso; SOS.saveNow(); setTimeout(function () { ui.toast('Chapada dos Guimarães (Ouvidor, 22/11) está de volta no plano, junto com o Técnico. ♡', 'good', 7000); }, 600); }
    window.addEventListener('hashchange', function () { app.render(); window.scrollTo(0, 0); closeMenu(); });
    ui.$('#concFilter').addEventListener('change', function (e) { app.conc = e.target.value; try { localStorage.setItem('studyos.ui.conc', app.conc); } catch (x) { /* ok */ } app.render(); });
    ui.$('#quickSession').addEventListener('click', function () { ui.sessionModal(); });
    ui.$('#banner').addEventListener('click', function (e) { if (e.target.closest('[data-act=backupNow]')) { SOS.exportJSON(); app.render(); } if (e.target.closest('[data-act=restoreExt]')) SOS.tec.requestBackup(); });
    function closeMenu() { ui.$('#sidebar').classList.remove('open'); ui.$('#scrim').classList.remove('open'); }
    ui.$('#menuBtn').addEventListener('click', function () { ui.$('#sidebar').classList.add('open'); ui.$('#scrim').classList.add('open'); });
    ui.$('#scrim').addEventListener('click', closeMenu);
    // virada do dia com a página aberta
    var day = U.today();
    setInterval(function () { if (U.today() !== day) { day = U.today(); app.render(); } }, 60000);
    app.render();
    var R = SOS.S.migr3Relatorio;
    if (R && !SOS.S.migr3Visto && (SOS.S.sessoes.length || SOS.S.atividades.some(function (a) { return !a.gerado; }) || R.removidosAnalista.length)) setTimeout(function () { app.migrationReport(); }, 300);
    else if (R && !SOS.S.migr3Visto) { SOS.S.migr3Visto = true; SOS.save(); }
  });
  app.migrationReport = function () {
    var R = SOS.S.migr3Relatorio, amb = R.sessoes.filter(function (x) { return x.ambiguo.length; }).concat(R.atividades.filter(function (x) { return x.ambiguo.length; }));
    var li = function (x) { return '<li>' + U.fmtDate(x.data) + ' — ' + U.esc(SOS.topicLabel(x.topicId)) + ' (' + x.n + ' itens): ' + U.esc(x.ambiguo.join('; ')) + '</li>'; };
    ui.modal({
      title: 'Seu StudyOS foi atualizado ♡',
      body: '<ul style="padding-left:18px;margin-top:0">' +
        '<li>Agora o foco é só <b>Técnico Legislativo · Câmara de Cuiabá · prova em ' + U.fmtDate(SOS.CONFIG.prova.data) + '</b>.</li>' +
        '<li>' + R.removidosAnalista.length + ' tópico(s) exclusivo(s) do Analista saíram do plano e do edital' + (R.arquivadosChapada ? '; ' + R.arquivadosChapada + ' tópico(s) de Chapada foram arquivados (não apagados)' : '') + '.</li>' +
        '<li>Um cartão por assunto por dia: ' + R.sessoes.length + ' grupo(s) de registros e ' + R.atividades.length + ' grupo(s) de atividades foram unidos (tempos e questões somados, observações juntadas).</li>' +
        (R.replan ? '<li>Plano recalculado até a prova: ' + R.replan.novas + ' cartões novos (' + R.replan.removidas + ' gerados antes foram substituídos).</li>' : '') +
        (R.despoluidas ? '<li>Banco de questões: acertos comuns agora guardam só o contador.</li>' : '') +
        (R.orfaos ? '<li>' + R.orfaos + ' registro(s) de estudo eram de assuntos que saíram; eles continuam guardados.</li>' : '') + '</ul>' +
        (amb.length ? '<div class="alert mid" style="display:block"><b>Confira estes casos (podem ter sido contados duas vezes):</b><ul style="margin:6px 0 0;padding-left:18px">' + amb.map(li).join('') + '</ul><small>Corrija em Questões e desempenho, se necessário.</small></div>' : '<p class="muted">Nenhum caso ambíguo encontrado.</p>'),
      buttons: [{ label: 'Entendi', onClick: function () { SOS.S.migr3Visto = true; SOS.save(); } }]
    });
  };
})();
