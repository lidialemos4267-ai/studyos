/* popup.js — contagens, exportação, limpeza (dois cliques) e diagnóstico. */
function pacote(st) {
  var qs = st.qs || {}, cads = st.cads || {};
  var lista = Object.keys(qs).map(function (k) { return qs[k]; });
  // "erros" mantém compatibilidade com o formato tec-erros v1
  var erros = lista.filter(function (q) { return q.v > 0; }).map(function (q) {
    return { id: q.id, d: q.d, t: q.t, v: q.v, ds: q.ds, mat: q.mat, ass: q.ass, cad: q.cad, banca: q.banca, orgao: q.orgao, ano: q.ano, enun: q.enun, alts: q.alts, marc: q.marc, gab: q.gab, com: q.com, prof: q.prof, url: q.url };
  });
  return { app: 'tec-studyos', v: 2, em: new Date().toISOString(), qs: lista, erros: erros, cads: Object.keys(cads).map(function (k) { return cads[k]; }) };
}
function msg(t, cor) { var m = document.getElementById('msg'); m.textContent = t; m.style.color = cor || '#16a34a'; }
function atualizar() {
  chrome.storage.local.get(['qs', 'cads'], function (st) {
    var qs = st.qs || {}, l = Object.keys(qs).map(function (k) { return qs[k]; });
    document.getElementById('kq').textContent = l.length;
    document.getElementById('ke').textContent = l.filter(function (q) { return q.v > 0; }).length;
    document.getElementById('kr').textContent = l.filter(function (q) { return q.v > 1; }).length;
    document.getElementById('kc').textContent = Object.keys(st.cads || {}).length;
  });
}
document.getElementById('baixar').addEventListener('click', function () {
  chrome.storage.local.get(['qs', 'cads'], function (st) {
    var blob = new Blob([JSON.stringify(pacote(st), null, 1)], { type: 'application/json' });
    var a = document.createElement('a');
    var d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    a.href = URL.createObjectURL(blob); a.download = 'tec-questoes-' + d.toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    msg('Arquivo baixado.');
  });
});
document.getElementById('copiar').addEventListener('click', function () {
  chrome.storage.local.get(['qs', 'cads'], function (st) {
    navigator.clipboard.writeText(JSON.stringify(pacote(st))).then(function () { msg('JSON copiado. Cole em StudyOS › Banco de questões › Importar.'); }, function () { msg('Não foi possível copiar.', '#dc2626'); });
  });
});
var armado = false, timerArmado = null;
document.getElementById('limpar').addEventListener('click', function () {
  var b = document.getElementById('limpar');
  if (!armado) { armado = true; b.classList.add('armed'); b.textContent = 'Clique de novo para APAGAR tudo da extensão'; timerArmado = setTimeout(function () { armado = false; b.classList.remove('armed'); b.textContent = 'Limpar dados da extensão'; }, 4000); return; }
  clearTimeout(timerArmado);
  chrome.storage.local.remove(['qs', 'cads'], function () { armado = false; b.classList.remove('armed'); b.textContent = 'Limpar dados da extensão'; msg('Dados da extensão apagados (o StudyOS mantém o que já recebeu).', '#d97706'); atualizar(); });
});
document.getElementById('diag').addEventListener('click', function () {
  var out = document.getElementById('out');
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (!tabs[0]) return;
    chrome.tabs.sendMessage(tabs[0].id, { t: 'diag' }, function (r) {
      out.hidden = false;
      if (chrome.runtime.lastError || !r) { out.textContent = 'Abra uma questão no www.tecconcursos.com.br e tente de novo.\n(' + (chrome.runtime.lastError ? chrome.runtime.lastError.message : 'sem resposta') + ')'; return; }
      var s = JSON.stringify(r, null, 1);
      out.textContent = s;
      navigator.clipboard.writeText(s).then(function () { msg('Relatório copiado — cole na conversa com o Claude se algo não funcionar.'); });
    });
  });
});
atualizar();
