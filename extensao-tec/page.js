/* page.js — roda no "mundo" da página (MAIN) só para LER os dados do AngularJS do TEC.
   Não altera nada na página. Envia um resumo da questão atual por window.postMessage. */
(function () {
  if (window.__studyosTecPage) return;
  window.__studyosTecPage = true;

  var SEL_ENUN = ['[tec-formatar-html="vm.questao.enunciado"]', '.questao-enunciado-texto', '.questao-enunciado'];

  // sobe pelos scopes do AngularJS até achar vm.questao
  function acharVm() {
    if (!window.angular || !window.angular.element) return null;
    for (var i = 0; i < SEL_ENUN.length; i++) {
      var el = document.querySelector(SEL_ENUN[i]);
      if (!el) continue;
      try {
        var sc = window.angular.element(el).scope();
        for (var n = 0; sc && n < 20; n++) {
          if (sc.vm && sc.vm.questao) return sc.vm;
          sc = sc.$parent;
        }
      } catch (e) { /* ignora */ }
    }
    return null;
  }

  function texto(html) {
    if (!html) return null;
    var d = document.createElement('div');
    d.innerHTML = String(html);
    return (d.innerText || d.textContent || '').trim();
  }

  // procura campos de estatística (nomes variam): números em chaves com "acert", "estat" ou "percent"
  function estatistica(obj) {
    var out = {};
    if (!obj || typeof obj !== 'object') return out;
    Object.keys(obj).forEach(function (k) {
      if (!/acert|estat|percent|resolv|erra/i.test(k)) return;
      var v = obj[k];
      if (typeof v === 'number' || typeof v === 'string') out[k] = v;
      else if (v && typeof v === 'object' && !Array.isArray(v)) {
        Object.keys(v).slice(0, 15).forEach(function (k2) { var v2 = v[k2]; if (typeof v2 === 'number' || typeof v2 === 'string') out[k + '.' + k2] = v2; });
      }
    });
    return out;
  }

  function resumo(vm) {
    var q = vm.questao || {}, c = vm.comentario || {};
    var est = Object.assign({}, estatistica(q), estatistica(vm.estatistica || vm.estatisticas || null));
    return {
      idQuestao: q.idQuestao || q.id || null,
      nomeMateria: q.nomeMateria || null,
      bancaSigla: q.bancaSigla || q.siglaBanca || null,
      orgaoNome: q.orgaoNome || q.nomeOrgao || q.orgaoSigla || null,
      ano: q.ano || q.anoProva || null,
      cargo: q.cargoSigla || q.nomeCargo || null,
      numeroAlternativaCorreta: q.numeroAlternativaCorreta != null ? q.numeroAlternativaCorreta : null,
      alternativaSelecionada: q.alternativaSelecionada != null ? q.alternativaSelecionada : (vm.alternativaSelecionada != null ? vm.alternativaSelecionada : null),
      anulada: !!q.anulada,
      formatoQuestao: q.formatoQuestao || null,
      assunto: vm.nomeAssuntoExibicao || q.nomeAssunto || null,
      comentario: texto(c.textoComentario),
      professor: c.nomeProfessor || null,
      estatistica: Object.keys(est).length ? est : null
    };
  }

  var ultimo = '';
  setInterval(function () {
    var vm = acharVm();
    var dados = vm ? resumo(vm) : null;
    var s = JSON.stringify(dados);
    if (s !== ultimo) { ultimo = s; window.postMessage({ src: 'tec-page', t: 'q', data: dados }, '*'); }
  }, 1000);

  // diagnóstico pedido pelo content.js
  window.addEventListener('message', function (ev) {
    if (ev.source !== window || !ev.data || ev.data.src !== 'tec-content' || ev.data.t !== 'diag') return;
    var vm = acharVm();
    window.postMessage({ src: 'tec-page', t: 'diag', data: {
      angular: !!window.angular,
      vmEncontrado: !!vm,
      chavesVm: vm ? Object.keys(vm).slice(0, 80) : [],
      chavesQuestao: vm && vm.questao ? Object.keys(vm.questao).slice(0, 120) : [],
      resumo: vm ? resumo(vm) : null
    } }, '*');
  });
})();
