/* Configurações: disponibilidade, pesos por fase, intervalos, backup/restauração, snapshots, tema e redefinição. */
(function () {
  var SOS = window.SOS, U = SOS.U, ui = SOS.ui;

  SOS.views.config = {
    noFilter: true,
    render: function (el) {
      var s = SOS.S.settings, snaps = SOS.listSnapshots();
      var used = 0; try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); used += (localStorage.getItem(k) || '').length; } } catch (e) { /* ok */ }
      var h = '<div class="grid g2">';
      h += '<div class="card"><h3>Backup e restauração</h3><p class="muted" style="margin-top:0">Os dados ficam salvos automaticamente no navegador a cada alteração e sobrevivem ao fechamento. Mesmo assim, exporte backups regularmente: limpar os dados do navegador apaga tudo.</p>' +
        '<div class="row"><button class="btn" data-act="export">Exportar backup (.json)</button><label class="btn ghost" style="cursor:pointer">Importar backup<input type="file" name="imp" accept=".json,application/json" hidden></label></div>' +
        '<p><small class="muted">Último backup exportado: <b>' + U.fmtDate(s.ultimoBackup) + '</b> · Espaço usado: ' + Math.round(used / 1024) + ' KB (limite típico do navegador: ~5 MB)</small></p>' +
        '<h3 style="margin-top:14px">Cópia automática na extensão</h3>' + (SOS.tec && SOS.tec.extBackup ? '<p style="margin:0 0 6px"><small class="muted">Última cópia: <b>' + new Date(SOS.tec.extBackup.when).toLocaleString('pt-BR') + '</b> · ' + U.esc(SOS.tec.extBackup.resumo || '') + '<br>de: ' + U.esc(SOS.tec.extBackup.where || '') + '</small></p><button class="btn xs ghost" data-act="extRestore">Restaurar esta cópia</button>' : '<p class="muted" style="margin:0"><small>' + (SOS.tec && SOS.tec.bridgeSeen ? 'Ativa — a primeira cópia é feita na próxima alteração.' : 'Instale a extensão StudyOS — TEC para ter cópia automática que sobrevive a trocas de endereço e versões.') + '</small></p>') +
        '<h3 style="margin-top:14px">Versões automáticas (snapshots diários)</h3>' + (snaps.length ? '<table><tbody>' + snaps.map(function (x) { return '<tr><td>' + U.esc(x.date.length > 10 ? U.fmtDate(x.date.slice(0, 10)) + ' (antes de importar)' : U.fmtDate(x.date)) + '</td><td class="num"><small class="muted">' + Math.round(x.size / 1024) + ' KB</small></td><td class="num"><button class="btn xs ghost" data-snap="' + x.key + '">Restaurar</button></td></tr>'; }).join('') + '</tbody></table>' : '<div class="empty">Nenhum snapshot ainda.</div>') + '</div>';
      h += '<div class="card"><h3>Disponibilidade e planejamento</h3><div class="form">' +
        f('Tempo de estudo por dia, seg–sáb (00:00h)', '<input name="minDia" value="' + U.fmtMin(s.minDia).replace('h', '') + '">') +
        f('Máximo de disciplinas por dia', '<input type="number" min="1" max="5" name="maxDisciplinasDia" value="' + s.maxDisciplinasDia + '">') +
        f('Capacidade diária de revisões (00:00h)', '<input name="minRevisaoDia" value="' + U.fmtMin(s.minRevisaoDia).replace('h', '') + '">') +
        f('Minutos por revisão de tópico', '<input type="number" min="5" name="minPorRevisao" value="' + s.minPorRevisao + '">') +
        '<div class="full"><b style="font-family:var(--f-head);font-size:13px">Peso de cada concurso no planejamento (%)</b><p class="muted" style="margin:2px 0 6px;font-size:13px">“Antes” vale até a prova de Chapada (22/11); “depois”, até a prova da Câmara. Concursos com prova já realizada recebem peso zero automaticamente.</p><table><thead><tr><th>Concurso</th><th class="num">Antes</th><th class="num">Depois</th></tr></thead><tbody>' + SOS.S.concursos.map(function (c) { return '<tr><td>' + U.esc(c.sigla) + '</td><td class="num"><input type="number" min="0" max="100" name="fa_' + c.id + '" value="' + (s.fase.antes[c.id] || 0) + '" style="width:80px"></td><td class="num"><input type="number" min="0" max="100" name="fd_' + c.id + '" value="' + (s.fase.depois[c.id] || 0) + '" style="width:80px"></td></tr>'; }).join('') + '</tbody></table></div>' +
        f('Intervalos de revisão de tópicos (dias)', '<input name="intervalosTopico" value="' + s.intervalosTopico.join(', ') + '">') +
        f('Intervalos do Caderno de Erros (dias)', '<input name="intervalosErro" value="' + s.intervalosErro.join(', ') + '">') +
        f('Intervalos iniciais dos flashcards (dias)', '<input name="intervalosCard" value="' + s.intervalosCard.join(', ') + '">') +
        f('Caracteres por linha manuscrita (discursiva)', '<input type="number" min="40" max="120" name="charsPorLinha" value="' + s.charsPorLinha + '">') +
        f('Lembrete de backup a cada (dias)', '<input type="number" min="1" name="lembreteBackupDias" value="' + s.lembreteBackupDias + '">') +
        f('Meta diária (00:00h)', '<input name="metaDiariaMin" value="' + U.fmtMin(s.metaDiariaMin || 240).replace('h', '') + '">') +
        f('Meta de questões até a prova', '<input type="number" min="0" name="metaQuestoesTotal" value="' + (s.metaQuestoesTotal || 700) + '">') +
        '<label class="f full"><span>Rota de IA (opcional — URL do SEU servidor; a chave da API fica lá, nunca aqui). Usada nos flashcards, no assistente da lei seca e nas questões A–E. Sem rota, o StudyOS oferece “copiar e colar com o Claude”. Formato em docs/ia-rota.md.</span><input name="iaEndpoint" placeholder="https://…/api/flashcards" value="' + U.esc(s.iaEndpoint || '') + '"></label>' +
        f('Tema', '<select name="tema">' + ui.opts([['auto', 'Automático (sistema)'], ['light', 'Claro'], ['dark', 'Escuro']], s.tema) + '</select>') +
        '</div><div class="row" style="margin-top:12px"><button class="btn" data-act="save">Salvar configurações</button></div></div>';
      h += '</div><div class="card section"><h3>Zona de cuidado</h3><p class="muted" style="margin-top:0">Redefinir apaga todos os registros e recarrega os editais originais. Um snapshot do estado atual é guardado antes.</p><button class="btn danger" data-act="reset">Redefinir StudyOS</button></div>';
      el.innerHTML = h;
      el.onclick = function (e) {
        var x;
        if (e.target.closest('[data-act=export]')) { SOS.exportJSON(); ui.toast('Backup exportado.', 'good'); return SOS.app.render(); }
        if (e.target.closest('[data-act=save]')) return save(el);
        if (e.target.closest('[data-act=extRestore]')) return ui.confirm('Substituir os dados atuais pela cópia guardada na extensão? (Um snapshot do estado atual é guardado antes.)', function () { SOS.tec.requestBackup(); }, 'Restaurar');
        if ((x = e.target.closest('[data-snap]'))) return ui.confirm('Restaurar a versão de ' + U.esc(x.dataset.snap.replace('studyos.snap.', '')) + '? O estado atual será substituído (exporte um backup antes, se quiser guardá-lo).', function () { SOS.restoreSnapshot(x.dataset.snap); SOS.app.applyTheme(); SOS.app.render(); ui.toast('Versão restaurada.', 'good'); }, 'Restaurar');
        if (e.target.closest('[data-act=reset]')) return ui.confirm('Apagar TODOS os dados e recomeçar? Esta ação não pode ser desfeita (exceto pelos snapshots/backup).', function () { try { localStorage.setItem('studyos.snap.' + U.today() + '-pre-reset', JSON.stringify(SOS.S)); } catch (er) { /* ok */ } SOS.S = SOS.freshState(); SOS.saveNow(); SOS.load(); SOS.app.render(); ui.toast('StudyOS redefinido.', 'mid'); }, 'Apagar tudo');
      };
      el.onchange = function (e) {
        if (e.target.name !== 'imp' || !e.target.files[0]) return;
        var r = new FileReader();
        r.onload = function () {
          var obj;
          try { obj = JSON.parse(r.result); SOS.validateImport(obj); } catch (err) { ui.toast('Arquivo inválido: ' + err.message, 'bad', 6000); return; }
          ui.modal({
            title: 'Importar backup', body: '<p>Como deseja importar?</p><ul><li><b>Substituir</b>: o conteúdo do backup passa a ser o estado atual.</li><li><b>Mesclar</b>: adiciona apenas os registros que ainda não existem (por identificador).</li></ul><p class="muted">O estado atual é guardado como snapshot antes da importação.</p>',
            buttons: [{ label: 'Cancelar', cls: 'ghost' }, { label: 'Mesclar', cls: 'ghost', onClick: function () { SOS.importJSON(obj, 'merge'); SOS.app.render(); ui.toast('Backup mesclado.', 'good'); } }, { label: 'Substituir', cls: 'danger', onClick: function () { SOS.importJSON(obj, 'replace'); SOS.app.applyTheme(); SOS.app.render(); ui.toast('Backup restaurado.', 'good'); } }]
          });
        };
        r.readAsText(e.target.files[0]);
      };
    }
  };
  function f(l, inp) { return '<label class="f"><span>' + l + '</span>' + inp + '</label>'; }
  function ints(v, fallback) { var a = String(v).split(/[,;\s]+/).map(function (x) { return parseInt(x, 10); }).filter(function (x) { return x > 0; }); return a.length ? a.sort(function (x, y) { return x - y; }) : fallback; }
  function save(el) {
    var s = SOS.S.settings;
    var md = U.parseMin(ui.val(el, 'minDia')); if (md < 60 || md > 720) { ui.toast('Tempo diário deve ficar entre 01:00 e 12:00.', 'bad'); return; }
    s.minDia = md; s.maxDisciplinasDia = Math.max(1, Math.min(5, +ui.val(el, 'maxDisciplinasDia') || 3));
    s.minRevisaoDia = U.parseMin(ui.val(el, 'minRevisaoDia')) || 60; s.minPorRevisao = Math.max(5, +ui.val(el, 'minPorRevisao') || 20);
    SOS.S.concursos.forEach(function (c) { s.fase.antes[c.id] = +ui.val(el, 'fa_' + c.id) || 0; s.fase.depois[c.id] = +ui.val(el, 'fd_' + c.id) || 0; });
    s.intervalosTopico = ints(ui.val(el, 'intervalosTopico'), s.intervalosTopico);
    s.intervalosErro = ints(ui.val(el, 'intervalosErro'), s.intervalosErro);
    s.intervalosCard = ints(ui.val(el, 'intervalosCard'), s.intervalosCard);
    s.charsPorLinha = Math.max(40, Math.min(120, +ui.val(el, 'charsPorLinha') || 75));
    s.lembreteBackupDias = Math.max(1, +ui.val(el, 'lembreteBackupDias') || 7);
    s.tema = ui.val(el, 'tema');
    s.metaDiariaMin = U.parseMin(ui.val(el, 'metaDiariaMin')) || 240; s.metaQuestoesTotal = Math.max(0, +ui.val(el, 'metaQuestoesTotal') || 700);
    var ia = (ui.val(el, 'iaEndpoint') || '').trim(); if (ia && !/^https:\/\//.test(ia)) { ui.toast('A rota de IA precisa começar com https://', 'bad'); return; } s.iaEndpoint = ia;
    SOS.log('Configurações salvas'); SOS.save(); SOS.app.applyTheme(); SOS.app.render(); ui.toast('Configurações salvas.', 'good');
  }
})();
