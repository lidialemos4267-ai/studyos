/* StudyOS — roteamento, menu, filtro global e inicialização. */
(function () {
  var SOS = window.SOS, U = SOS.U, ui = SOS.ui, E = SOS.E;
  var app = SOS.app = {};
  app.NAV = [
    ['dashboard', 'Dashboard', '◎'], ['concursos', 'Concursos', '◆'], ['edital', 'Edital verticalizado', '☰'],
    ['plano', 'Planejamento', '▦'], ['desempenho', 'Questões e desempenho', '✓'], ['tec', 'Banco de questões (TEC)', '⊞'], ['erros', 'Caderno de Erros', '✎'],
    ['flashcards', 'Flashcards', '❏'], ['revisoes', 'Revisões', '↻'], ['discursivas', 'Discursivas', '¶'],
    ['simulados', 'Simulados', '⏱'], ['leis', 'Lei seca e jurisprudência', '§'], ['estatisticas', 'Estatísticas', '▲'], ['config', 'Configurações', '⚙']
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
      flashcards: SOS.S.flashcards.filter(E.cardDue).length,
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
    sel.style.display = v.noFilter ? 'none' : '';
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
  });
})();
