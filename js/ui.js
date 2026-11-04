/* StudyOS — componentes de interface compartilhados. */
(function () {
  var SOS = window.SOS, U = SOS.U, E = SOS.E;
  var ui = SOS.ui = {};
  SOS.views = {};

  ui.$ = function (sel, root) { return (root || document).querySelector(sel); };
  ui.$$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  ui.toast = function (msg, kind, ms) {
    var el = document.createElement('div');
    el.className = 'toast ' + (kind || '');
    el.textContent = msg;
    ui.$('#toasts').appendChild(el);
    setTimeout(function () { el.remove(); }, ms || 3200);
  };

  /* modal genérico. opts: {title, body (html), wide, buttons:[{label, cls, onClick(close, root) -> false para não fechar}], onOpen(root)} */
  ui.modal = function (opts) {
    var root = ui.$('#modalRoot');
    var bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = '<div class="modal ' + (opts.wide ? 'wide' : '') + '" role="dialog" aria-modal="true"><div class="modal-h"><h2>' + U.esc(opts.title) + '</h2><span class="spacer"></span><button class="icon-btn" data-x aria-label="Fechar">✕</button></div><div class="modal-b">' + (opts.body || '') + '</div><div class="modal-f"></div></div>';
    var foot = bg.querySelector('.modal-f');
    function close() { bg.remove(); document.removeEventListener('keydown', onKey); if (opts.onClose) opts.onClose(); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    (opts.buttons || [{ label: 'Fechar', cls: 'ghost' }]).forEach(function (b) {
      var btn = document.createElement('button');
      btn.className = 'btn ' + (b.cls || '');
      btn.textContent = b.label;
      btn.addEventListener('click', function () {
        if (b.onClick) { var r = b.onClick(close, bg); if (r === false) return; }
        close();
      });
      foot.appendChild(btn);
    });
    bg.querySelector('[data-x]').addEventListener('click', close);
    bg.addEventListener('mousedown', function (e) { if (e.target === bg) bg._down = true; });
    bg.addEventListener('mouseup', function (e) { if (e.target === bg && bg._down && opts.dismissable !== false) close(); bg._down = false; });
    document.addEventListener('keydown', onKey);
    root.appendChild(bg);
    if (opts.onOpen) opts.onOpen(bg, close);
    var first = bg.querySelector('input:not([type=checkbox]):not([type=hidden]), textarea, select');
    if (first && !opts.noFocus) setTimeout(function () { first.focus(); }, 30);
    return { root: bg, close: close };
  };
  /* toda exclusão passa por aqui */
  ui.confirm = function (msg, onYes, label) {
    ui.modal({
      title: 'Confirmar', body: '<p>' + msg + '</p>',
      buttons: [{ label: 'Cancelar', cls: 'ghost' }, { label: label || 'Excluir', cls: 'danger', onClick: function () { onYes(); } }]
    });
  };

  /* ---------- tags ---------- */
  ui.discTag = function (id) { var d = SOS.disc(id); return '<span class="tag c" style="background:' + d.cor + '">' + U.esc(d.nome) + '</span>'; };
  ui.concTags = function (ids) {
    if (SOS.S && SOS.S.concursos.length < 2) return '';
    return (ids || []).map(function (id) { var c = SOS.conc(id); return c ? '<span class="tag" style="border:1px solid ' + c.cor + ';color:' + c.cor + ';background:transparent">' + U.esc(c.sigla) + '</span>' : ''; }).join(' ');
  };
  ui.shareTag = function (t) {
    if (SOS.S.concursos.length < 2) return '';
    var hasC = t.concursos.some(function (c) { return c === 'ANA' || c === 'TEC'; }), hasO = t.concursos.indexOf('OUV') > -1;
    if (hasC && hasO) return t.parcial ? '<span class="tag mid" title="' + U.esc(t.nota) + '">🟡 Comum c/ diferenças</span>' : '<span class="tag good">🟢 Comum</span>';
    if (hasO) return '<span class="tag" style="background:#f3e8ff;color:#7e22ce">🟣 Só Chapada</span>';
    return '<span class="tag" style="background:#e0ecff;color:#1d4ed8">🔵 Só Câmara</span>';
  };
  ui.impTag = function (v) { var cls = v >= 4 ? 'bad' : v === 3 ? 'mid' : ''; return '<span class="tag ' + cls + '">Imp. ' + E.IMP[v] + '</span>'; };
  ui.incTag = function (t) { return '<span class="tag" title="' + U.esc(t.incJust || '') + '">Inc. ' + E.INC[t.inc] + (t.inc === 'sd' ? '' : ' (est.)') + '</span>'; };
  ui.pctBadge = function (p) { return '<span class="pct ' + U.pctClass(p) + '">' + U.fmtPct(p) + '</span>'; };
  ui.trendIcon = function (tr) { if (!tr) return ''; return { up: '<span class="trend-up" title="Melhorando">▲</span>', down: '<span class="trend-down" title="Piorando">▼</span>', flat: '<span class="trend-flat" title="Estável">■</span>' }[tr]; };
  ui.domTag = function (d) { var cls = { alto: 'good', medio: 'mid', baixo: 'bad', nao: '' }[d]; return '<span class="tag ' + cls + '">' + E.DOM[d] + '</span>'; };

  /* ---------- selects ---------- */
  ui.concOptions = function (sel, includeAll) {
    var h = includeAll ? '<option value="all"' + (sel === 'all' ? ' selected' : '') + '>Consolidado (todos)</option>' : '';
    SOS.S.concursos.forEach(function (c) { h += '<option value="' + c.id + '"' + (sel === c.id ? ' selected' : '') + '>' + U.esc(c.sigla) + '</option>'; });
    return h;
  };
  ui.topicOptions = function (sel, conc, allowEmpty) {
    var h = allowEmpty ? '<option value="">— selecione o assunto —</option>' : '';
    SOS.S.disciplinas.forEach(function (d) {
      var ts = SOS.S.topicos.filter(function (t) { return t.disc === d.id && (!conc || conc === 'all' || t.concursos.indexOf(conc) > -1); });
      if (!ts.length) return;
      h += '<optgroup label="' + U.esc(d.nome) + '">';
      ts.forEach(function (t) { h += '<option value="' + t.id + '"' + (sel === t.id ? ' selected' : '') + '>' + U.esc(t.titulo.length > 95 ? t.titulo.slice(0, 92) + '…' : t.titulo) + '</option>'; });
      h += '</optgroup>';
    });
    return h;
  };
  ui.discOptions = function (sel, allowEmpty) {
    var h = allowEmpty ? '<option value="">Todas as disciplinas</option>' : '';
    SOS.S.disciplinas.forEach(function (d) { h += '<option value="' + d.id + '"' + (sel === d.id ? ' selected' : '') + '>' + U.esc(d.nome) + '</option>'; });
    return h;
  };
  ui.metodoOptions = function (sel) { return E.METODOS.map(function (m) { return '<option' + (m === sel ? ' selected' : '') + '>' + m + '</option>'; }).join(''); };
  ui.opts = function (arr, sel) { return arr.map(function (x) { var v = Array.isArray(x) ? x[0] : x, l = Array.isArray(x) ? x[1] : x; return '<option value="' + U.esc(v) + '"' + (String(sel) === String(v) ? ' selected' : '') + '>' + U.esc(l) + '</option>'; }).join(''); };
  ui.val = function (root, name) { var el = root.querySelector('[name="' + name + '"]'); return el ? (el.type === 'checkbox' ? el.checked : el.value) : null; };
  ui.checked = function (root, name) { return ui.$$('[name="' + name + '"]:checked', root).map(function (i) { return i.value; }); };

  /* ---------- gráficos SVG ---------- */
  ui.lineChart = function (series, opts) {
    opts = opts || {};
    var W = 560, H = opts.h || 180, P = { l: 34, r: 12, t: 12, b: 26 };
    var labels = opts.labels || [];
    var all = []; series.forEach(function (s) { s.data.forEach(function (v) { if (v != null) all.push(v); }); });
    if (!all.length) return '<div class="empty">Sem dados ainda — registre estudos para ver a evolução.</div>';
    var max = opts.max != null ? opts.max : Math.max.apply(null, all) * 1.1 || 1, min = opts.min || 0;
    var n = labels.length, iw = W - P.l - P.r, ih = H - P.t - P.b;
    function x(i) { return P.l + (n <= 1 ? iw / 2 : i * iw / (n - 1)); }
    function y(v) { return P.t + ih - (v - min) / (max - min || 1) * ih; }
    var g = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + U.esc(opts.aria || 'gráfico') + '">';
    [0, 0.5, 1].forEach(function (f) { var v = min + (max - min) * f; g += '<line class="axis" x1="' + P.l + '" x2="' + (W - P.r) + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text x="' + (P.l - 6) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + (opts.fmt ? opts.fmt(v) : Math.round(v)) + '</text>'; });
    labels.forEach(function (l, i) { if (n > 8 && i % 2) return; g += '<text x="' + x(i) + '" y="' + (H - 8) + '" text-anchor="middle">' + U.esc(l) + '</text>'; });
    if (opts.refLine != null) g += '<line x1="' + P.l + '" x2="' + (W - P.r) + '" y1="' + y(opts.refLine) + '" y2="' + y(opts.refLine) + '" stroke="var(--good)" stroke-dasharray="4 4"/>';
    series.forEach(function (s) {
      var pts = [], seg = '';
      s.data.forEach(function (v, i) { if (v == null) { if (pts.length) { seg += '<polyline fill="none" stroke="' + s.color + '" stroke-width="2.2" points="' + pts.join(' ') + '"/>'; pts = []; } return; } pts.push(x(i) + ',' + y(v)); });
      if (pts.length) seg += '<polyline fill="none" stroke="' + s.color + '" stroke-width="2.2" points="' + pts.join(' ') + '"/>';
      g += seg;
      s.data.forEach(function (v, i) { if (v != null) g += '<circle cx="' + x(i) + '" cy="' + y(v) + '" r="3.2" fill="' + s.color + '"><title>' + U.esc((labels[i] || '') + ' — ' + s.name + ': ' + (opts.fmt ? opts.fmt(v) : v)) + '</title></circle>'; });
    });
    g += '</svg>';
    var leg = series.length > 1 ? '<div class="legend">' + series.map(function (s) { return '<span><i class="dot" style="background:' + s.color + '"></i>' + U.esc(s.name) + '</span>'; }).join('') + '</div>' : '';
    return '<div class="chart">' + g + leg + '</div>';
  };
  ui.barChart = function (labels, data, opts) {
    opts = opts || {};
    var W = 560, H = opts.h || 170, P = { l: 30, r: 8, t: 14, b: 26 };
    var max = Math.max.apply(null, data.concat([opts.minMax || 1]));
    var n = data.length, iw = W - P.l - P.r, ih = H - P.t - P.b, bw = Math.min(38, iw / n * 0.62);
    if (!data.some(function (v) { return v > 0; })) return '<div class="empty">Sem dados ainda.</div>';
    var g = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + U.esc(opts.aria || 'gráfico de barras') + '"><line class="axis" x1="' + P.l + '" x2="' + (W - P.r) + '" y1="' + (P.t + ih) + '" y2="' + (P.t + ih) + '"/>';
    data.forEach(function (v, i) {
      var cx = P.l + (i + 0.5) * iw / n, h = v / max * ih;
      g += '<rect x="' + (cx - bw / 2) + '" y="' + (P.t + ih - h) + '" width="' + bw + '" height="' + Math.max(0, h) + '" rx="4" fill="' + (opts.color || 'var(--primary)') + '"><title>' + U.esc(labels[i] + ': ' + (opts.fmt ? opts.fmt(v) : v)) + '</title></rect>';
      if (v > 0) g += '<text class="lbl" x="' + cx + '" y="' + (P.t + ih - h - 4) + '" text-anchor="middle">' + (opts.fmt ? opts.fmt(v) : v) + '</text>';
      if (!(n > 8 && i % 2)) g += '<text x="' + cx + '" y="' + (H - 8) + '" text-anchor="middle">' + U.esc(labels[i]) + '</text>';
    });
    return '<div class="chart">' + g + '</svg></div>';
  };
  ui.hbars = function (rows) {
    if (!rows.length) return '<div class="empty">Sem dados ainda.</div>';
    return '<div class="bars">' + rows.map(function (r) {
      return '<div class="bar-row"><span class="bt" title="' + U.esc(r.label) + '">' + U.esc(r.label) + '</span><span class="bb"><i style="width:' + Math.max(0, Math.min(100, r.value)) + '%;background:' + (r.color || 'var(--primary)') + '"></i></span><span class="num" style="text-align:right">' + (r.text || Math.round(r.value) + '%') + '</span></div>';
    }).join('') + '</div>';
  };
  ui.pctColor = function (p) { return p == null ? 'var(--faint)' : p < 70 ? 'var(--bad)' : p <= 80 ? 'var(--mid)' : 'var(--good)'; };

  /* ---------- modal de registro de estudo (sessão) ---------- */
  /* ---------- cartão do dia: um registro por assunto por dia (leitura + questões + revisão + tempo + observações) ---------- */
  E.daySession = function (topicId, data) { return SOS.S.sessoes.find(function (x) { return x.topicId === topicId && x.data === data && x.origem !== 'TEC' && x.origem !== 'TEC-cad'; }); };
  ui.sessionModal = function (o) {
    o = o || {};
    var S = SOS.S, s = o.session || {};
    var parteLeitura = o.partes ? o.partes.filter(function (p) { return /Leitura|Lei seca|Aula/.test(p.metodo); }).reduce(function (x, p) { return x + p.min; }, 0) : 0;
    var body =
      '<div class="form">' +
      '<label class="f full"><span>Assunto (tópico do edital)</span><select name="topicId">' + ui.topicOptions(s.topicId || o.topicId, null, true) + '</select></label>' +
      '<label class="f"><span>Data</span><input type="date" name="data" value="' + (s.data || o.data || U.today()) + '"></label>' +
      '<label class="f"><span>Método principal</span><select name="metodo">' + ui.metodoOptions((s.metodo || o.metodo || 'Questões').split(' + ')[0]) + '</select></label>' +
      '<div class="full" id="jaExiste"></div>' +
      '<label class="f"><span>Leitura / teoria (00:00h)</span><input name="leit" placeholder="00:40" value="' + (s.leituraMin != null ? U.fmtMin(s.leituraMin).replace('h', '') : parteLeitura ? U.fmtMin(parteLeitura).replace('h', '') : '') + '"></label>' +
      '<label class="f"><span>Tempo total realizado (00:00h)</span><input name="real" placeholder="01:15" value="' + (s.realizadoMin != null ? U.fmtMin(s.realizadoMin).replace('h', '') : '') + '"></label>' +
      '<label class="f"><span>Questões feitas</span><input type="number" min="0" name="total" value="' + (s.total != null ? s.total : '') + '"></label>' +
      '<label class="f"><span>Acertos</span><input type="number" min="0" name="acertos" value="' + (s.acertos != null ? s.acertos : '') + '"></label>' +
      '<div class="full row" id="pctLive"></div>' +
      '<label class="chk" style="width:max-content"><input type="checkbox" name="rev"' + (s.revisao ? ' checked' : '') + '> Fiz revisão deste assunto</label>' +
      '<label class="f"><span>Tempo planejado (00:00h)</span><input name="plan" value="' + U.fmtMin(s.planejadoMin != null ? s.planejadoMin : (o.planMin || 0)).replace('h', '') + '"></label>' +
      '<label class="f"><span>Status do tópico depois</span><select name="status">' + ui.opts([['', 'Manter / automático'], ['estudando', 'Estudando'], ['revisar', 'Revisar'], ['finalizado', 'Finalizado']], '') + '</select></label>' +
      '<label class="f full"><span>Observações</span><textarea name="obs" rows="2">' + U.esc(s.obs || '') + '</textarea></label>' +
      (s.id ? '' : '<label class="chk full" style="width:max-content"><input type="checkbox" name="addErr"> Registrar erros no Caderno de Erros depois de salvar</label>') +
      '</div><small class="muted">Questões resolvidas no TEC com a extensão já entram sozinhas — não lance de novo aqui.</small>';
    ui.modal({
      title: s.id ? 'Editar o dia deste assunto' : 'Registrar estudo do dia',
      body: body,
      onOpen: function (root) {
        function upd() {
          var tot = +ui.val(root, 'total') || 0, ac = +ui.val(root, 'acertos') || 0;
          var box = root.querySelector('#pctLive');
          if (!tot) box.innerHTML = '<small class="muted">Informe questões e acertos para calcular o aproveitamento.</small>';
          else if (ac > tot) box.innerHTML = '<span class="pct bad">Acertos maiores que o total</span>';
          else box.innerHTML = 'Erros: <b>' + (tot - ac) + '</b> · Aproveitamento: ' + ui.pctBadge(U.pct(ac, tot)) + ' <small class="muted">(' + ac + ' ÷ ' + tot + ' × 100)</small>';
          var ex = !s.id && E.daySession(ui.val(root, 'topicId'), ui.val(root, 'data'));
          root.querySelector('#jaExiste').innerHTML = ex ? '<div class="alert info" style="margin:0">Já existe registro deste assunto neste dia (' + U.fmtMin(ex.realizadoMin) + ', ' + (ex.total || 0) + ' questões). <b>O que você lançar agora será somado a ele</b> — um só cartão por assunto por dia.</div>' : '';
        }
        root.addEventListener('input', upd); root.addEventListener('change', upd);
        upd();
      },
      buttons: [{ label: 'Cancelar', cls: 'ghost' }, {
        label: 'Salvar', onClick: function (close, root) {
          var tid = ui.val(root, 'topicId');
          if (!tid) { ui.toast('Selecione o assunto.', 'bad'); return false; }
          var tot = parseInt(ui.val(root, 'total'), 10) || 0, ac = parseInt(ui.val(root, 'acertos'), 10) || 0;
          if (ac > tot) { ui.toast('Acertos não podem ser maiores que o total.', 'bad'); return false; }
          if (tot < 0 || ac < 0) { ui.toast('Valores inválidos.', 'bad'); return false; }
          var data = ui.val(root, 'data') || U.today(), leit = U.parseMin(ui.val(root, 'leit')), real = U.parseMin(ui.val(root, 'real')), plan = U.parseMin(ui.val(root, 'plan'));
          if (!real && leit) real = leit;
          var metodo = ui.val(root, 'metodo'), revisao = ui.val(root, 'rev'), obs = ui.val(root, 'obs').trim();
          var rec, isNew = !s.id, somou = false;
          if (s.id) { rec = s; rec.topicId = tid; rec.data = data; rec.metodo = metodo; rec.leituraMin = leit; rec.realizadoMin = real; rec.planejadoMin = plan; rec.total = tot; rec.acertos = ac; rec.revisao = revisao; rec.obs = obs; }
          else {
            rec = E.daySession(tid, data);
            if (rec) {
              somou = true;
              rec.leituraMin = (+rec.leituraMin || 0) + leit; rec.realizadoMin = (+rec.realizadoMin || 0) + real; rec.planejadoMin = (+rec.planejadoMin || 0) + plan;
              rec.total = (+rec.total || 0) + tot; rec.acertos = (+rec.acertos || 0) + ac; rec.revisao = rec.revisao || revisao;
              if (rec.metodo.split(' + ').indexOf(metodo) < 0) rec.metodo += ' + ' + metodo;
              if (obs) rec.obs = rec.obs ? rec.obs + ' | ' + obs : obs;
            } else {
              rec = { id: U.uid('s'), topicId: tid, data: data, metodo: metodo, leituraMin: leit, realizadoMin: real, planejadoMin: plan, total: tot, acertos: ac, revisao: revisao, obs: obs };
              S.sessoes.push(rec); E.applySessionToTopic(rec);
            }
          }
          if (o.atividadeId) { rec.atividadeIds = rec.atividadeIds || []; if (rec.atividadeIds.indexOf(o.atividadeId) < 0) rec.atividadeIds.push(o.atividadeId); rec.atividadeId = rec.atividadeId || o.atividadeId; }
          var st = ui.val(root, 'status'); var tp = SOS.topic(tid);
          if (st && tp) { tp.status = st; if (st === 'finalizado') tp.finalizadoEm = data; }
          SOS.log(isNew ? (somou ? 'Registro somado ao dia' : 'Registro de estudo') : 'Edição de registro', SOS.topicLabel(tid) + ' — ' + rec.metodo);
          SOS.save();
          ui.toast(somou ? 'Somado ao registro de hoje deste assunto. ♡' : 'Estudo registrado. ♡', 'good');
          var addErr = isNew && ui.val(root, 'addErr');
          if (o.onDone) o.onDone(rec);
          SOS.app.render();
          if (addErr) setTimeout(function () { SOS.views.erros.openForm({ topicId: tid, sessaoId: rec.id }); }, 50);
        }
      }]
    });
  };
})();
