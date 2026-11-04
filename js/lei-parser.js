/* Lei seca 2.0 — análise da estrutura do texto legal (só visual: o texto original nunca é alterado).
   - estrutura(t): divide um artigo em dispositivos (caput, parágrafo, inciso, alínea, item, títulos/capítulos).
     A junção de todas as linhas com '\n' reproduz o texto original exatamente.
   - reancorar(marca, texto): relocaliza um destaque depois que a norma é atualizada.
   - termosAtencao(t): expressões que costumam decidir questões (salvo, exceto, vedado, prazos, quóruns…).
   - cardsPorRegras(lei, art, nivel): flashcards gerados por regras (sem IA) a partir do texto literal. */
(function () {
  var SOS = window.SOS;
  var X = SOS.lex = {};

  var RX = {
    cab: /^\s*(LIVRO|PARTE|T[ÍI]TULO|CAP[ÍI]TULO|SE[ÇC][ÃA]O|SUBSE[ÇC][ÃA]O)\s+([IVXLCDM]+|[ÚU]NIC[OA]|\d+)\b/i,
    art: /^\s*(?:Art|ART|art)\.?\s*\d+(?:\.\d{3})*\s*(?:[ºo°]|-?\s*[A-Z]\b)?\.?(?:\s*-\s*[A-Z]\b)?\s*[-–—.]?/,
    par: /^\s*(?:§\s*\d+\s*[ºo°]?(?:-[A-Z])?\.?|Par[áa]grafo\s+[úu]nico\.?)\s*[-–—.]?/i,
    inc: /^\s*[IVXLCDM]{1,7}(?:-[A-Z])?\s*(?:[-–—]|\.(?=\s))\s*/,
    ali: /^\s*[a-z]\)\s*/,
    item: /^\s*\d{1,2}(?:\.|\))\s+/,
    nota: /^\s*\((?:Reda[çc][ãa]o|Inclu[íi]d|Revogad|Acrescid|Vide|Vig[êe]ncia|Alterad|Regulament|Promulga|Vetad)/i
  };

  function maiusc(s) { var l = s.replace(/[^A-Za-zÀ-ÿ]/g, ''); return l.length >= 3 && l === l.toUpperCase(); }

  /* divide o texto de um artigo em linhas classificadas, com a posição exata de cada uma no texto original */
  X.estrutura = function (t) {
    t = String(t || '');
    var linhas = t.split('\n'), o = 0, out = [], prevCab = false;
    linhas.forEach(function (ln) {
      var seg = { o: o, e: o + ln.length, tipo: 'txt', lab: 0 };
      var m;
      if (!ln.trim()) seg.tipo = 'vazio';
      else if ((m = ln.match(RX.cab))) { seg.tipo = 'cab'; seg.lab = m[0].length; }
      else if (prevCab && maiusc(ln) && ln.trim().length < 160 && !RX.art.test(ln)) seg.tipo = 'cabnome';
      else if ((m = ln.match(RX.art)) && /^\s*art/i.test(ln)) { seg.tipo = 'caput'; seg.lab = m[0].length; }
      else if ((m = ln.match(RX.par))) { seg.tipo = 'par'; seg.lab = m[0].length; }
      else if ((m = ln.match(RX.inc))) { seg.tipo = 'inc'; seg.lab = m[0].length; }
      else if ((m = ln.match(RX.ali))) { seg.tipo = 'ali'; seg.lab = m[0].length; }
      else if ((m = ln.match(RX.item))) { seg.tipo = 'item'; seg.lab = m[0].length; }
      else if (RX.nota.test(ln)) seg.tipo = 'nota';
      else if (maiusc(ln) && ln.trim().length < 120 && !/[.;:]$/.test(ln.trim())) seg.tipo = 'cabnome';
      // o rótulo não inclui espaços finais
      if (seg.lab) { while (seg.lab > 0 && /\s/.test(ln.charAt(seg.lab - 1))) seg.lab--; }
      prevCab = seg.tipo === 'cab' || (seg.tipo === 'cabnome' && prevCab);
      if (seg.tipo !== 'vazio' && seg.tipo !== 'cab' && seg.tipo !== 'cabnome') prevCab = false;
      out.push(seg); o += ln.length + 1;
    });
    // títulos/capítulos que ficam no fim do artigo pertencem (visualmente) ao artigo seguinte
    var k = out.length - 1;
    while (k >= 0 && (out[k].tipo === 'vazio' || out[k].tipo === 'cab' || out[k].tipo === 'cabnome')) { if (out[k].tipo !== 'vazio') out[k].fim = true; k--; }
    // um artigo que só tem títulos (ex.: preâmbulo com "TÍTULO I") também é cabeçalho
    return out;
  };
  /* confere a literalidade: as linhas, juntas, devem ser idênticas ao texto */
  /* o artigo tem corpo (não é só título/capítulo)? — com cache, para textos grandes */
  var cacheCorpo = {};
  X.temCorpo = function (t) { t = String(t || ''); if (cacheCorpo[t] != null) return cacheCorpo[t]; var r = X.estrutura(t).some(function (s) { return s.tipo !== 'vazio' && !s.fim; }); if (Object.keys(cacheCorpo).length > 5000) cacheCorpo = {}; return (cacheCorpo[t] = r); };
  X.reconstruir = function (t, segs) { return segs.map(function (s) { return String(t).slice(s.o, s.e); }).join('\n'); };

  /* rótulo do dispositivo (para o fundamento): caput, § 1º, inciso II, alínea a */
  X.rotulo = function (t, seg, pai) {
    var lab = String(t).slice(seg.o, seg.o + seg.lab).replace(/[\s\-–—.]+$/, '').trim();
    if (seg.tipo === 'caput') return 'caput';
    if (seg.tipo === 'par') return /nico/i.test(lab) ? 'parágrafo único' : lab;
    if (seg.tipo === 'inc') return (pai ? pai + ', ' : '') + 'inciso ' + lab;
    if (seg.tipo === 'ali') return (pai ? pai + ', ' : '') + 'alínea ' + lab.replace(')', '');
    if (seg.tipo === 'item') return (pai ? pai + ', ' : '') + 'item ' + lab.replace(/[.)]/, '');
    return '';
  };

  /* termos de atenção (realce opcional no leitor) */
  var ATENCAO = /\b(salvo|exceto|ressalvad[oa]s?|com exce[çc][ãa]o d[eoa]s?|somente|apenas|exclusivamente|privativamente|obrigatoriamente|facultativamente|independentemente|necessariamente|vedad[oa]s?|proibid[oa]s?|defeso|compete|competir[áa]|incumbe|cabe|poder[áa]|dever[áa]|n[ãa]o poder[áa]o?|vedada|dispensad[oa]s?|maioria absoluta|maioria simples|maioria relativa|dois ter[çc]os|um ter[çc]o|tr[êe]s quintos|unanimidade)\b|\b\d+\s*(?:\([^)]{2,30}\)\s*)?(?:dias?(?:\s+[úu]teis)?|horas?|meses|m[êe]s|anos?|sess[õo]es)\b/gi;
  X.termosAtencao = function (t) {
    var out = [], m; t = String(t || ''); ATENCAO.lastIndex = 0;
    while ((m = ATENCAO.exec(t))) { out.push({ o: m.index, e: m.index + m[0].length, txt: m[0] }); if (out.length > 400) break; }
    return out;
  };

  /* relocaliza um destaque no texto novo; se não houver segurança, marca como órfão (a anotação é preservada) */
  X.reancorar = function (mk, t) {
    t = String(t || ''); var tr = mk.trecho || '';
    if (!tr) { mk.orfa = true; return mk; }
    var pos = [], i = t.indexOf(tr);
    while (i > -1 && pos.length < 50) { pos.push(i); i = t.indexOf(tr, i + 1); }
    if (!pos.length) {
      // tenta ignorando diferenças de espaços/quebras de linha
      var rx = new RegExp(tr.trim().split(/\s+/).map(function (w) { return w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('\\s+'), 'g'), m;
      while ((m = rx.exec(t)) && pos.length < 50) pos.push({ i: m.index, s: m[0] });
      if (pos.length === 1) { mk.o = pos[0].i; mk.e = pos[0].i + pos[0].s.length; mk.trecho = pos[0].s; mk.orfa = false; return mk; }
      pos = pos.map(function (p) { return p.i; });
      if (!pos.length) { mk.orfa = true; return mk; }
    }
    var best = pos[0];
    if (pos.length > 1) {
      var sc = pos.map(function (p) {
        var a = t.slice(Math.max(0, p - 30), p), d = t.slice(p + tr.length, p + tr.length + 30), s = 0;
        if (mk.ctxA && a.slice(-mk.ctxA.length) === mk.ctxA) s += 2; else if (mk.ctxA && a.indexOf(mk.ctxA.slice(-10)) > -1) s += 1;
        if (mk.ctxD && d.indexOf(mk.ctxD) === 0) s += 2; else if (mk.ctxD && d.indexOf(mk.ctxD.slice(0, 10)) > -1) s += 1;
        return s;
      });
      var max = Math.max.apply(null, sc), qt = sc.filter(function (s) { return s === max; }).length;
      if (max === 0 || qt > 1) { mk.orfa = true; return mk; }
      best = pos[sc.indexOf(max)];
    }
    mk.o = best; mk.e = best + tr.length; mk.orfa = false;
    return mk;
  };
  /* Art. 1º a 9º (ordinal); a partir do 10, cardinal */
  X.nomeArt = function (n) { n = String(n == null ? '' : n); var m = n.match(/^(\d+)(.*)$/); if (!m) return n; return 'Art. ' + m[1] + (+m[1] < 10 ? 'º' : '') + m[2]; };
  X.contexto = function (t, o, e) { return { ctxA: String(t).slice(Math.max(0, o - 20), o), ctxD: String(t).slice(e, e + 20) }; };

  /* ---------- flashcards por regras (sem IA), sempre a partir do texto literal ---------- */
  function hash(s) { var h = 5381; for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
  function janela(s, o, e, rep) {
    var a = Math.max(0, o - 150), b = Math.min(s.length, e + 110);
    if (a > 0) { var sp = s.indexOf(' ', a); a = sp > -1 && sp < o ? sp + 1 : a; }
    if (b < s.length) { var sp2 = s.lastIndexOf(' ', b); b = sp2 > e ? sp2 : b; }
    return (a > 0 ? '…' : '') + s.slice(a, o) + rep + s.slice(e, b) + (b < s.length ? '…' : '');
  }
  function curto(s, n) { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).replace(/\s\S*$/, '') + '…' : s; }
  var LIM = { essencial: 3, intermediario: 6, reta: 10 };
  var LIM_INC = { essencial: 2, intermediario: 4, reta: 8 };
  X.NIVEIS = [['essencial', 'Essencial'], ['intermediario', 'Intermediário'], ['reta', 'Reta final']];

  X.cardsPorRegras = function (lei, art, nivel) {
    nivel = LIM[nivel] ? nivel : 'intermediario';
    var t = art.t, segs = X.estrutura(t), norma = String(lei.nome || '').split(' — ')[0];
    var nArt = X.nomeArt(art.n), out = [], vistos = {};
    var pai = '';
    var caput = segs.filter(function (s) { return s.tipo === 'caput'; })[0];
    var caputTxt = caput ? t.slice(caput.o + caput.lab, caput.e).trim() : '';
    function add(tipo, frente, verso, seg, prio) {
      frente = frente.replace(/\s+/g, ' ').trim(); verso = verso.replace(/\s+/g, ' ').trim();
      if (!frente || !verso || verso.length > 260) return;
      var k = tipo + '|' + seg.o + '|' + verso.toLowerCase(); if (vistos[k]) return; vistos[k] = 1;
      var disp = seg.rot ? nArt + ', ' + seg.rot : nArt;
      out.push({ prio: prio, frente: frente, verso: verso, tipo: tipo, fundamento: disp + ' — ' + norma, explicacao: 'Texto literal: “' + curto(t.slice(seg.o, seg.e), 320) + '”', topicId: lei.topicId || '', origem: 'Legislação', nivel: nivel, tags: ['Lei_Seca', tipo.replace(/\s+/g, '_')], leiRef: { leiId: lei.id, n: art.n, disp: seg.rot || '' }, ref: 'lex:' + lei.id + ':' + art.n + ':' + hash(frente) });
    }
    // competência no caput (com incisos)
    var comp = caputTxt.match(/\b(Compete|Cabe|Incumbe)\s+(privativamente\s+|exclusivamente\s+|ainda\s+)?(?:a|à|ao|às|aos)\s+([^,:;]{3,90}?)(?:\s*[,:;]|\s+(?=que\b)|$)/i) || caputTxt.match(/\b[ÉE]\s+da\s+compet[êe]ncia\s+(privativa\s+|exclusiva\s+)?d[oa]s?\s+([^,:;]{3,90}?)\s*[,:;]/i);
    var autoridade = comp ? (comp.length === 4 ? comp[3] : comp[2]).trim() : '', modo = comp ? ((comp.length === 4 ? comp[2] : comp[1]) || '').trim() : '';
    var conceito = /considera-se|consideram-se|entende-se por|para (?:os )?(?:fins|efeitos)/i.test(caputTxt);
    var nInc = 0;
    segs.forEach(function (s) {
      if (s.tipo === 'vazio' || s.tipo === 'cab' || s.tipo === 'cabnome' || s.tipo === 'nota') return;
      if (s.tipo === 'caput') pai = '';
      if (s.tipo === 'par') pai = X.rotulo(t, s);
      s.rot = X.rotulo(t, s, s.tipo === 'inc' || s.tipo === 'ali' || s.tipo === 'item' ? pai : '');
      var corpo = t.slice(s.o + s.lab, s.e).replace(/^[\s\-–—.]+/, ''), off = s.o + (t.slice(s.o, s.e).indexOf(corpo));
      if (corpo.length < 12) return;
      var m;
      // incisos de competência / conceito
      if (s.tipo === 'inc' && nInc < LIM_INC[nivel]) {
        if (autoridade) { nInc++; add('Prazos e competências', nArt + ' (' + norma + '): a quem compete — “' + curto(corpo.replace(/[;.]$/, ''), 160) + '”?', autoridade + (modo ? ' (' + modo + ')' : ''), s, 2); }
        if (conceito && (m = corpo.match(/^([^:]{2,60}):\s*(.{10,})$/))) { nInc++; add('Conceito', 'Conceito (' + nArt + ', ' + norma + '): o que é “' + m[1].trim() + '”?', curto(m[2].replace(/[;.]$/, ''), 240), s, 3); return; }
      }
      // exceção
      if ((m = corpo.match(/^(.{15,}?)[,;]?\s+\b(salvo|exceto|ressalvad[oa]s?|com exce[çc][ãa]o d[eoa]s?|a n[ãa]o ser)\b\s*(.{10,}?)(?:[.;]\s*$|$)/i))) {
        add('Regra e exceção', nArt + ' (' + norma + ') — regra: “' + curto(m[1], 170) + '”. Qual é a ressalva prevista?', m[2] + ' ' + curto(m[3], 220), s, 1);
      }
      // definição no próprio dispositivo
      if ((m = corpo.match(/^(?:para (?:os )?(?:fins|efeitos)[^,]*,\s*)?(?:considera-se|entende-se por)\s+(.{3,80}?)\s*(?:,|:)\s*(.{10,})$/i))) add('Conceito', 'Conceito (' + nArt + ', ' + norma + '): o que se considera ' + m[1].trim() + '?', curto(m[2].replace(/[;.]$/, ''), 240), s, 3);
      // prazos
      var rxP = /\b(\d+)\s*(?:\(([^)]{2,30})\)\s*)?(dias?(?:\s+[úu]teis|\s+corridos)?|horas?|meses|m[êe]s|anos?|sess[õo]es(?:\s+ordin[áa]rias)?)\b/gi;
      while ((m = rxP.exec(corpo))) add('Prazos e competências', 'Complete (' + nArt + ', ' + norma + '): ' + janela(corpo, m.index, m.index + m[0].length, '____'), m[0], s, 4);
      // quóruns
      var rxQ = /\b(maioria absoluta|maioria simples|maioria relativa|dois ter[çc]os|2\/3|um ter[çc]o|1\/3|tr[êe]s quintos|3\/5|unanimidade)\b/gi;
      while ((m = rxQ.exec(corpo))) add('Prazos e competências', 'Qual o quórum? (' + nArt + ', ' + norma + '): ' + janela(corpo, m.index, m.index + m[0].length, '____'), m[0], s, 4);
      // competência sem incisos (o caput inteiro)
      if (s.tipo === 'caput' && autoridade && !segs.some(function (x) { return x.tipo === 'inc'; })) {
        var resto = corpo.slice(corpo.indexOf(autoridade) + autoridade.length).replace(/^[\s,:;]+/, '');
        if (resto.length > 10) add('Prazos e competências', nArt + ' (' + norma + '): a quem compete ' + curto(resto.replace(/[.;]$/, ''), 170) + '?', autoridade + (modo ? ' (' + modo + ')' : ''), s, 2);
      }
      // vedações e palavras restritivas (literalidade) — intermediário e reta final
      if (nivel !== 'essencial' && (m = corpo.match(/\b([ée] vedad[oa]|s[ãa]o vedad[oa]s|[ée] proibid[oa]|[ée] defeso|n[ãa]o poder[áa]o?)\b/i))) add('Literalidade', 'Complete a expressão legal (' + nArt + ', ' + norma + '): ' + janela(corpo, m.index, m.index + m[0].length, '____'), m[0], s, 5);
      if (nivel === 'reta' && (m = corpo.match(/\b(somente|exclusivamente|privativamente|obrigatoriamente|facultativamente|independentemente|necessariamente|apenas)\b/i))) add('Literalidade', 'Palavra restritiva (' + nArt + ', ' + norma + '): ' + janela(corpo, m.index, m.index + m[0].length, '____'), m[0], s, 6);
    });
    return out.sort(function (a, b) { return a.prio - b.prio; }).slice(0, LIM[nivel]).map(function (c) { delete c.prio; return c; });
  };
})();
