/* content.js — lê a tela do TEC enquanto você resolve e guarda no chrome.storage.local.
   Só leitura: não clica, não responde, não envia nada para servidor nenhum. */
(function () {
  'use strict';

  // ---------- seletores (hipóteses — confira com o Diagnóstico do popup) ----------
  var SEL = {
    errou: '.questao-enunciado-resolucao-errou',
    acertou: '.questao-enunciado-resolucao-acertou',
    enunciado: ['[tec-formatar-html="vm.questao.enunciado"]', '.questao-enunciado-texto'],
    alternativas: '.questao-enunciado-alternativas > li',
    altLetra: '.questao-enunciado-alternativa-opcao',
    altTexto: '.questao-enunciado-alternativa-texto',
    selecionada: '.questao-alternativa-selecionada',
    comentario: '[tec-formatar-html="vm.comentario.textoComentario"]',
    professor: '[ng-bind="vm.comentario.nomeProfessor"]'
  };
  var LETRAS = 'ABCDEFGH';

  var dadosPagina = null;        // resumo vindo do page.js (AngularJS)
  var pendente = { id: null, desde: 0, contado: false }; // regra dos 2 segundos
  var ocupado = false;
  var marcas = {};               // id → 'chutei' | 'em dúvida' (marcado por você no painel)
  var CAMPOS_CONTEUDO = ['enun', 'alts', 'marc', 'gab', 'com', 'prof', 'est'];

  // limpeza única: acertos comuns antigos passam a guardar só o contador
  chrome.storage.local.get(['qs', 'limpezaAcertos'], function (st) {
    if (st.limpezaAcertos) return;
    var qs = st.qs || {}, n = 0;
    Object.keys(qs).forEach(function (k) { var q = qs[k]; if (q.v > 0 || q.marca) return; CAMPOS_CONTEUDO.forEach(function (f) { if (q[f] != null) { delete q[f]; n++; } }); q.soContador = true; });
    chrome.storage.local.set({ qs: qs, limpezaAcertos: true });
  });

  window.addEventListener('message', function (ev) {
    if (ev.source !== window || !ev.data || ev.data.src !== 'tec-page') return;
    if (ev.data.t === 'q') dadosPagina = ev.data.data;
  });

  // ---------- utilitários ----------
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function primeiro(lista) { for (var i = 0; i < lista.length; i++) { var e = $(lista[i]); if (e) return e; } return null; }
  function visivel(el) { return !!(el && (el.offsetWidth || el.offsetHeight || el.getClientRects().length)); }
  function txt(el) { return el ? (el.innerText || el.textContent || '').replace(/ /g, ' ').trim() : ''; }
  function hoje() { var d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); } // data local
  function hash(s) { var h = 5381; for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
  function letraDe(x, alts) {
    if (x == null || x === '') return null;
    if (typeof x === 'number') return alts.length === 2 && /certo/i.test(alts[0].t) ? (x <= 1 ? 'C' : 'E') : (LETRAS[x - 1] || null);
    var s = String(x).trim();
    if (/^certo$/i.test(s)) return 'C';
    if (/^errado$/i.test(s)) return 'E';
    return s.charAt(0).toUpperCase();
  }

  // ---------- leitura da questão na tela ----------
  function cabecalho(enunEl) {
    // sobe a partir do enunciado até achar um bloco que contenha "Matéria:" ou "#123456"
    var el = enunEl;
    for (var i = 0; i < 8 && el && el.parentElement; i++) {
      el = el.parentElement;
      var t = txt(el);
      if (/Mat[ée]ria\s*:/i.test(t) || /#\d{5,}/.test(t)) return t;
    }
    return '';
  }
  function lerQuestao() {
    var enunEl = primeiro(SEL.enunciado);
    if (!enunEl || !visivel(enunEl)) return null;
    var cab = cabecalho(enunEl);
    var alts = $$(SEL.alternativas).map(function (li) {
      var l = txt($(SEL.altLetra, li)), t = txt($(SEL.altTexto, li)) || txt(li);
      if (!l && /^(certo|errado)$/i.test(t)) l = t.charAt(0).toUpperCase();
      return { l: l.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 1) || l, t: t, sel: li.matches(SEL.selecionada) || !!$(SEL.selecionada, li) };
    }).filter(function (a) { return a.t; });
    var blocoErrou = $(SEL.errou), blocoAcertou = $(SEL.acertou);
    var resultado = visivel(blocoErrou) ? 'E' : visivel(blocoAcertou) ? 'A' : null;
    var p = dadosPagina || {};
    var marc = (alts.filter(function (a) { return a.sel; })[0] || {}).l || letraDe(p.alternativaSelecionada, alts);
    var gab = null, mg = (txt(blocoErrou) + ' ' + txt(blocoAcertou)).match(/Gabarito\s*:?\s*(Certo|Errado|[A-E])\b/i);
    if (mg) gab = letraDe(mg[1], alts);
    if (!gab && resultado === 'A') gab = marc;
    if (!gab && p.numeroAlternativaCorreta != null) gab = letraDe(p.numeroAlternativaCorreta, alts);
    var com = txt($(SEL.comentario)) || p.comentario || null;
    var prof = txt($(SEL.professor)) || p.professor || null;
    var m;
    var mat = ((m = cab.match(/Mat[ée]ria\s*:\s*([^\n]+?)(?:\s+Assunto\s*:|\n|$)/i)) && m[1].trim()) || p.nomeMateria || null;
    var ass = ((m = cab.match(/Assunto\s*:\s*([^\n]+)/i)) && m[1].trim()) || p.assunto || null;
    var prova = cab.match(/#(\d{5,})\s+([^\n]+)/);
    var idNum = p.idQuestao || (prova && prova[1]) || null;
    var partes = prova ? prova[2].split(/\s+-\s+/) : [];
    var enun = txt(enunEl);
    var est = p.estatistica || null;
    var mEst = (txt(blocoErrou) + ' ' + txt(blocoAcertou) + ' ' + cab).match(/(\d{1,3}(?:[.,]\d+)?)\s*%\s*(?:de\s+)?acert/i);
    if (mEst) { est = est || {}; est.percentualAcertoTela = mEst[1].replace(',', '.'); }
    return {
      id: idNum ? 'q' + idNum : 'h' + hash(enun.slice(0, 600)),
      resultado: resultado,
      q: {
        mat: mat, ass: ass, banca: p.bancaSigla || partes[0] || null, ano: p.ano || partes[1] || null,
        orgao: p.orgaoNome || partes.slice(2).join(' - ') || null, cargo: p.cargo || null,
        enun: enun, alts: alts.map(function (a) { return { l: a.l, t: a.t }; }), marc: marc || null, gab: gab,
        com: com, prof: prof, est: est, anulada: !!p.anulada, formato: p.formatoQuestao || (alts.length === 2 ? 'CE' : alts.length ? 'ME' : 'D'),
        url: location.href.split('#')[0] + (location.hash || '')
      }
    };
  }

  // ---------- totais do caderno: "Questão 2 de 484 (2 Resolvidas, 0 Acertos e 2 Erros)" ----------
  var RX_CAD = /Quest[aã]o\s+(\d+)\s+de\s+(\d+)\s*\(\s*(\d+)\s+Resolvidas?\s*,\s*(\d+)\s+Acertos?\s+e\s+(\d+)\s+Erros?\s*\)/i;
  function lerCaderno() {
    var m = (document.body.innerText || '').match(RX_CAD);
    if (!m) return null;
    var idUrl = location.href.match(/cadernos?\/(?:[a-z-]+\/)?(\d+)/i);
    var titulo = (document.title || '').replace(/\s*[|\-–]\s*TEC Concursos.*$/i, '').trim();
    return { id: 'c' + (idUrl ? idUrl[1] : hash(titulo)), cad: titulo, atual: +m[1], tot: +m[2], res: +m[3], ac: +m[4], er: +m[5], d: hoje(), t: Date.now(), url: location.href };
  }

  // ---------- aviso no canto da tela ----------
  var avisoEl = null, avisoTimer = null;
  function aviso(msg, cor) {
    if (!avisoEl) {
      avisoEl = document.createElement('div');
      avisoEl.setAttribute('style', 'position:fixed;right:16px;bottom:16px;z-index:2147483647;padding:10px 14px;border-radius:10px;font:600 14px/1.4 system-ui,sans-serif;color:#fff;box-shadow:0 6px 24px rgba(0,0,0,.25);max-width:340px;pointer-events:none');
      document.documentElement.appendChild(avisoEl);
    }
    avisoEl.style.background = cor || '#4f46e5';
    avisoEl.textContent = msg;
    avisoEl.style.display = 'block';
    clearTimeout(avisoTimer);
    avisoTimer = setTimeout(function () { avisoEl.style.display = 'none'; }, 5000);
  }

  // ---------- gravação ----------
  function mesclar(antigo, novo) {
    var r = Object.assign({}, antigo);
    Object.keys(novo).forEach(function (k) {
      var v = novo[k];
      if (v == null || v === '' || (Array.isArray(v) && !v.length)) return; // nunca apaga o que já havia
      if (k === 'est' && antigo.est) v = Object.assign({}, antigo.est, v);
      r[k] = v;
    });
    return r;
  }
  function guardar(lido, contar, avisarMarca) {
    if (ocupado) return;
    ocupado = true;
    chrome.storage.local.get(['qs'], function (st) {
      var qs = st.qs || {};
      var antigo = qs[lido.id] || { id: lido.id, d: hoje(), t: Date.now(), v: 0, ds: [], hist: [] };
      if (marcas[lido.id]) antigo = Object.assign({}, antigo, { marca: marcas[lido.id] });
      // conteúdo completo só quando errou ou marcou "chutei"/"em dúvida"; acerto comum = só o contador
      var completo = lido.resultado === 'E' || antigo.v > 0 || !!antigo.marca;
      var dados = lido.q;
      if (!completo) { dados = {}; Object.keys(lido.q).forEach(function (k) { if (CAMPOS_CONTEUDO.indexOf(k) < 0) dados[k] = lido.q[k]; }); }
      var reg = mesclar(antigo, dados);
      if (completo) delete reg.soContador; else reg.soContador = true;
      reg.ult = lido.resultado;
      var cad = lerCaderno(); if (cad && !reg.cad) reg.cad = cad.cad;
      if (cad) reg.cadId = reg.cadId || cad.id;
      // questão que já aparece errada sem ter sido resolvida aqui (ex.: respondida no celular):
      // entra como erro (v=1) mas sem tentativa no histórico — as estatísticas vêm dos totais do caderno, sem contar duas vezes
      if (!contar && lido.resultado === 'E' && !(reg.v > 0)) { reg.v = 1; reg.ds = [hoje()]; reg.foraExt = true; }
      if (contar) {
        reg.hist = (reg.hist || []).concat([{ d: hoje(), t: Date.now(), r: lido.resultado, m: reg.marc || null, src: 'tec' }]);
        if (lido.resultado === 'E') { reg.v = (reg.v || 0) + 1; reg.ds = (reg.ds || []).concat([hoje()]); }
      }
      var mudou = JSON.stringify(antigo) !== JSON.stringify(reg);
      if (!mudou) { ocupado = false; return; }
      qs[lido.id] = reg;
      chrome.storage.local.set({ qs: qs }, function () {
        ocupado = false;
        if (avisarMarca) aviso('✎ Marcada como “' + reg.marca + '” — questão completa guardada para virar flashcard', '#8b5cf6');
        if (!contar) return;
        if (lido.resultado === 'E') {
          var totalErros = Object.keys(qs).filter(function (k) { return qs[k].v > 0; }).length;
          var msg = reg.v > 1 ? '⚠ Errada ' + reg.v + ' vezes!' : '✗ Erro guardado (' + totalErros + ' no total)';
          if (!reg.com) msg += ' — abra "Ver resolução" para guardar o comentário';
          aviso(msg, reg.v > 1 ? '#d97706' : '#dc2626');
        } else aviso('✓ Acerto registrado', '#16a34a');
      });
    });
  }
  function guardarCaderno() {
    var c = lerCaderno(); if (!c) return;
    chrome.storage.local.get(['cads'], function (st) {
      var cads = st.cads || {}, ant = cads[c.id];
      if (ant && c.res < ant.res) return; // página ainda carregando
      var novo = Object.assign({}, ant || {}, c);
      if (ant && ant.res === novo.res && ant.ac === novo.ac && ant.er === novo.er && ant.tot === novo.tot) return;
      cads[c.id] = novo;
      chrome.storage.local.set({ cads: cads });
    });
  }

  // ---------- painel discreto: "Chutei" / "Em dúvida" (só marca no StudyOS; não clica em nada do TEC) ----------
  var painel = null;
  function montarPainel() {
    if (painel) return;
    painel = document.createElement('div');
    painel.setAttribute('style', 'position:fixed;left:16px;bottom:16px;z-index:2147483646;display:flex;gap:6px;align-items:center;padding:6px 8px;border-radius:12px;background:#fff7f9;border:1px solid #e9c9d1;box-shadow:0 4px 16px rgba(120,60,80,.18);font:600 12px system-ui,sans-serif;color:#7a3e52');
    painel.innerHTML = '<span style="opacity:.8">StudyOS:</span>';
    [['chutei', 'Chutei'], ['em dúvida', 'Em dúvida']].forEach(function (b) {
      var x = document.createElement('button');
      x.textContent = b[1]; x.dataset.m = b[0];
      x.setAttribute('style', 'border:1px solid #d9a9b6;background:#fff;color:#7a3e52;border-radius:999px;padding:3px 10px;cursor:pointer;font:inherit');
      x.addEventListener('click', function () {
        var lido = lerQuestao(); if (!lido) return aviso('Abra uma questão primeiro', '#7a3e52');
        marcas[lido.id] = marcas[lido.id] === b[0] ? null : b[0];
        atualizarPainel(lido.id);
        if (marcas[lido.id] && lido.resultado) guardar(lido, false, true);
        else if (marcas[lido.id]) aviso('✎ Marcada como “' + b[0] + '”: será guardada completa ao responder', '#8b5cf6');
      });
      painel.appendChild(x);
    });
    document.documentElement.appendChild(painel);
  }
  function atualizarPainel(id) {
    if (!painel) return;
    Array.prototype.forEach.call(painel.querySelectorAll('button'), function (x) { var on = marcas[id] === x.dataset.m; x.style.background = on ? '#a85d6e' : '#fff'; x.style.color = on ? '#fff' : '#7a3e52'; });
  }

  // ---------- ciclo principal (o TEC troca de questão sem recarregar a página) ----------
  function tick() {
    try {
      guardarCaderno();
      var lido = lerQuestao();
      if (painel) painel.style.display = lido ? 'flex' : 'none';
      if (!lido) return;
      montarPainel(); atualizarPainel(lido.id);
      if (!lido.resultado) { // questão aberta e ainda sem resposta
        if (pendente.id !== lido.id) pendente = { id: lido.id, desde: Date.now(), contado: false };
        return;
      }
      var contar = pendente.id === lido.id && !pendente.contado && Date.now() - pendente.desde >= 2000;
      if (contar) pendente.contado = true;
      if (pendente.id !== lido.id) pendente = { id: lido.id, desde: 0, contado: true }; // só reabriu uma questão já resolvida
      guardar(lido, contar);
    } catch (e) { /* nunca quebrar a página do TEC */ }
  }
  setInterval(tick, 1000);

  // ---------- diagnóstico (pedido pelo popup) ----------
  chrome.runtime.onMessage.addListener(function (msg, sender, responder) {
    if (!msg || msg.t !== 'diag') return;
    var cont = {};
    Object.keys(SEL).forEach(function (k) {
      var v = SEL[k];
      cont[k] = Array.isArray(v) ? v.map(function (s) { return s + ' → ' + $$(s).length; }).join(' | ') : v + ' → ' + $$(v).length;
    });
    var resposta = null;
    function ouvir(ev) { if (ev.source === window && ev.data && ev.data.src === 'tec-page' && ev.data.t === 'diag') resposta = ev.data.data; }
    window.addEventListener('message', ouvir);
    window.postMessage({ src: 'tec-content', t: 'diag' }, '*');
    setTimeout(function () {
      window.removeEventListener('message', ouvir);
      var lido = null; try { lido = lerQuestao(); } catch (e) { lido = { erro: String(e) }; }
      responder({
        versao: chrome.runtime.getManifest().version, url: location.href, quando: new Date().toString(),
        seletores: cont, angular: resposta || { angular: false, obs: 'page.js não respondeu' },
        questaoLida: lido, cadernoLido: lerCaderno(),
        regraDosDoisSegundos: pendente
      });
    }, 600);
    return true; // resposta assíncrona
  });
})();
