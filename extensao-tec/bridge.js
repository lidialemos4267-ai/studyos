/* bridge.js — entrega os dados ao seu StudyOS (aberto no GitHub Pages ou como arquivo local).
   Só age em páginas que respondem ao "ping" com o protocolo do StudyOS. */
(function () {
  if (window.__studyosBridge) return;
  window.__studyosBridge = true;
  var sid = null, ultimoEnvio = '';

  function pacote(st) {
    var qs = st.qs || {}, cads = st.cads || {};
    var lista = Object.keys(qs).map(function (k) { return qs[k]; });
    return { app: 'tec-studyos', v: 2, em: new Date().toISOString(), qs: lista, cads: Object.keys(cads).map(function (k) { return cads[k]; }) };
  }
  function enviar(forcar) {
    chrome.storage.local.get(['qs', 'cads'], function (st) {
      var json = pacote(st), s = JSON.stringify([json.qs, json.cads]);
      if (!forcar && s === ultimoEnvio) return;
      ultimoEnvio = s;
      window.postMessage({ src: 'tec-bridge', t: 'data', json: json }, '*');
    });
  }
  setInterval(function () { window.postMessage({ src: 'tec-bridge', t: 'ping' }, '*'); }, 3000);
  window.postMessage({ src: 'tec-bridge', t: 'ping' }, '*');
  window.addEventListener('message', function (ev) {
    if (ev.source !== window || !ev.data || ev.data.src !== 'tec-panel') return;
    if (ev.data.t === 'pong' && ev.data.sid !== sid) { sid = ev.data.sid; enviar(true); }
  });
  chrome.storage.onChanged.addListener(function (mud, area) { if (sid && area === 'local' && (mud.qs || mud.cads)) enviar(false); });
})();
