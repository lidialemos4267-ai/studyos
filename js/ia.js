/* Assistente de IA do StudyOS.
   O navegador NUNCA guarda chave de API. Há dois caminhos, ambos com IA de verdade (nada é simulado):
   1) Rota de servidor configurada em Configurações (settings.iaEndpoint): POST { acao, versao, ... } → JSON.
   2) Sem rota: o StudyOS monta o pedido para você colar numa conversa com o Claude e colar a resposta (JSON) de volta.
   Em ambos os casos a resposta é validada antes de ser usada, e todo texto é exibido com escape (sem HTML).
   Compatibilidade: o pedido antigo de flashcards ({ questoes }) continua igual em flashcards.js. */
(function () {
  var SOS = window.SOS, U = SOS.U;
  var IA = SOS.ia = {};
  var MAX = 4000; // limite de caracteres por campo, para não estourar o armazenamento

  IA.ACOES = {
    explicar_artigo: 'Explicar artigo',
    pontos_importantes: 'Pontos importantes',
    analisar_excecoes: 'Exceções e ressalvas',
    identificar_pegadinhas: 'Possíveis pegadinhas',
    comparar_artigos: 'Comparar dispositivos',
    gerar_flashcards_lei: 'Gerar flashcards',
    gerar_questoes_lei: 'Criar questões (A–E)'
  };

  /* formato esperado de cada resposta (vai no pedido manual e está documentado em docs/ia-rota.md) */
  IA.FORMATOS = {
    explicar_artigo: '{"analises":[{"artigo":"Art. 5º","conceito_central":"...","regra_geral":"...","excecoes":["..."],"elementos":[{"tipo":"prazo|competência|requisito|proibição|permissão|responsabilidade","texto":"..."}],"expressoes_atencao":[{"expressao":"salvo","efeito":"..."}],"exemplo":"...","como_pode_ser_cobrado":[{"texto":"...","base":"inferencia_pedagogica|incidencia_comprovada","fonte":"(só se comprovada)"}],"limitacoes":"o que não dá para afirmar só com o texto fornecido"}]}',
    pontos_importantes: '{"itens":[{"artigo":"Art. 5º","titulo":"...","texto":"...","trecho":"trecho literal do dispositivo"}],"limitacoes":"..."}',
    analisar_excecoes: '{"itens":[{"artigo":"Art. 5º","titulo":"regra → exceção","texto":"...","trecho":"trecho literal"}],"limitacoes":"..."}',
    identificar_pegadinhas: '{"itens":[{"artigo":"Art. 5º","titulo":"...","texto":"como a alternativa pode ser alterada para ficar errada","trecho":"trecho literal"}],"limitacoes":"..."}',
    comparar_artigos: '{"aspectos":[{"aspecto":"competência|prazo|regra|exceção|responsabilidade|conceito","valores":[{"artigo":"Art. 5º","texto":"..."}]}],"complementares":"...","como_nao_confundir":"...","limitacoes":"..."}',
    gerar_flashcards_lei: '{"cards":[{"frente":"...","verso":"...","tipo":"Conceito|Regra e exceção|Prazos e competências|Literalidade|Comparação|Aplicação prática","fundamento":"Art. 5º, § 1º","explicacao":"...","artigo":"Art. 5º","tags":["Lei Seca","Selecon"]}]}',
    gerar_questoes_lei: '{"questoes":[{"comando":"CORRETA|INCORRETA|EXCETO","enunciado":"...","alternativas":[{"letra":"A","texto":"...","comentario":"por que está certa/errada"},{"letra":"B","texto":"...","comentario":"..."},{"letra":"C","texto":"...","comentario":"..."},{"letra":"D","texto":"...","comentario":"..."},{"letra":"E","texto":"...","comentario":"..."}],"gabarito":"C","fundamento":"Art. 5º, § 1º","conhecimento":"o que a questão avalia","armadilha":"a pegadinha usada","artigo":"Art. 5º"}]}'
  };
  var REGRAS = [
    'Use SOMENTE o texto dos dispositivos enviados. Não invente jurisprudência, prazos, competências, exceções nem números de artigo.',
    'Quando algo não puder ser afirmado só com o texto enviado, diga isso no campo "limitacoes".',
    'Ao citar o texto legal, copie literalmente; não reescreva o dispositivo.',
    'Separe inferência pedagógica (o que pode ser cobrado) de incidência comprovada em provas (só com fonte).',
    'Linguagem simples, frases curtas, em português do Brasil.'
  ];
  var EXTRA = {
    gerar_flashcards_lei: 'Um conhecimento por cartão; frente curta e autossuficiente; verso objetivo (sem copiar o artigo inteiro); sem cartões duplicados ou inúteis. Nível "essencial": conceitos, regras, competências e exceções relevantes. "intermediario": + prazos, requisitos e diferenças. "reta": literalidade relevante, palavras restritivas, prazos, competências, pegadinhas e distinções que invertem o sentido.',
    gerar_questoes_lei: 'Estilo da banca Instituto Selecon: 5 alternativas (A a E), uma única correta, enunciado objetivo; alterne comandos positivos (CORRETA) e negativos (INCORRETA/EXCETO). Distratores: troca de competência, alteração de prazo, inversão de regra, supressão de exceção, generalização indevida, troca de expressão importante. Comente as 5 alternativas. Estas questões NÃO são oficiais da Selecon.',
    comparar_artigos: 'Aponte diferenças de conceitos, competências, regras gerais e exceções, prazos, responsabilidades e se os dispositivos se complementam.'
  };

  IA.rota = function () { return (SOS.S && SOS.S.settings && SOS.S.settings.iaEndpoint) || ''; };
  IA.pedido = function (acao, dados) {
    return Object.assign({ acao: acao, versao: 2, banca: 'Instituto Selecon', concurso: 'Técnico Legislativo — Câmara Municipal de Cuiabá' }, dados || {});
  };

  function erro(code, msg) { var e = new Error(msg); e.code = code; return e; }
  IA.mensagem = function (e) {
    return ({
      sem_rota: 'A IA depende de configuração: cadastre a rota do seu servidor em Configurações ou use “copiar e colar com o Claude”.',
      conexao: 'Não foi possível conectar à rota de IA (sem internet ou endereço incorreto).',
      tempo: 'A rota de IA demorou demais para responder. Tente com menos artigos.',
      limite: 'A rota de IA recusou por limite de requisições. Aguarde alguns minutos e tente de novo.',
      indisponivel: 'O serviço de IA está indisponível agora. Tente mais tarde.',
      http: 'A rota de IA respondeu com erro',
      invalida: 'A resposta da IA veio em formato inválido'
    }[e && e.code] || 'Falha na IA') + (e && e.message && e.code !== 'sem_rota' ? ' — ' + e.message : '') + '.';
  };

  /* chamada à rota de servidor, com tempo limite e tratamento de erros */
  IA.chamar = (function () {
    return function (acao, dados, opts) {
      var url = IA.rota();
      if (!url) return Promise.reject(erro('sem_rota', ''));
      var ctl = typeof AbortController !== 'undefined' ? new AbortController() : null, to;
      return new Promise(function (res, rej) {
        to = setTimeout(function () { if (ctl) ctl.abort(); }, (opts && opts.timeout) || 90000);
        fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.assign(IA.pedido(acao, dados), { instrucoes: IA.promptManual(acao, dados) })), signal: ctl ? ctl.signal : undefined })
          .then(function (r) {
            if (r.status === 429) throw erro('limite', 'HTTP 429');
            if (r.status === 502 || r.status === 503 || r.status === 504) throw erro('indisponivel', 'HTTP ' + r.status);
            if (!r.ok) throw erro('http', 'HTTP ' + r.status);
            return r.text();
          }, function (e) { throw erro(e && e.name === 'AbortError' ? 'tempo' : 'conexao', e && e.name === 'AbortError' ? '' : String((e && e.message) || e)); })
          .then(function (txt) { clearTimeout(to); res(IA.validar(acao, txt)); })
          .catch(function (e) { clearTimeout(to); rej(e.code ? e : erro('invalida', e.message)); });
      });
    };
  })();

  /* texto do pedido para colar numa conversa com o Claude (modo sem servidor) */
  IA.promptManual = function (acao, dados) {
    return 'Você é um assistente de estudo de lei seca para concurso público. Tarefa: ' + IA.ACOES[acao] + '.\n\nRegras:\n- ' + REGRAS.join('\n- ') + (EXTRA[acao] ? '\n- ' + EXTRA[acao] : '') +
      '\n\nResponda APENAS com um JSON válido (sem texto antes ou depois), exatamente neste formato:\n' + IA.FORMATOS[acao] +
      '\n\nDados (JSON):\n' + JSON.stringify(IA.pedido(acao, dados), null, 1);
  };

  /* ---------- validação das respostas ---------- */
  function str(v, n) { if (v == null) return ''; if (typeof v === 'object') v = JSON.stringify(v); v = String(v).trim(); return v.length > (n || MAX) ? v.slice(0, (n || MAX) - 1) + '…' : v; }
  function arr(v) { return Array.isArray(v) ? v : v == null || v === '' ? [] : [v]; }
  IA.extrairJSON = function (txt) {
    if (txt && typeof txt === 'object') return txt;
    txt = String(txt || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');
    try { return JSON.parse(txt); } catch (e) { /* tenta achar o objeto dentro do texto */ }
    var a = txt.indexOf('{'), b = txt.lastIndexOf('}');
    if (a > -1 && b > a) { try { return JSON.parse(txt.slice(a, b + 1)); } catch (e2) { /* inválido */ } }
    throw erro('invalida', 'não é JSON');
  };
  IA.validar = function (acao, txt) {
    var j = IA.extrairJSON(txt);
    if (!j || typeof j !== 'object') throw erro('invalida', 'resposta vazia');
    if (j.erro || j.error) throw erro('http', str(j.erro || (j.error && j.error.message) || j.error, 200));
    var out;
    if (acao === 'explicar_artigo') {
      out = { analises: arr(j.analises || j.analise).filter(function (a) { return a && typeof a === 'object' && (a.conceito_central || a.regra_geral); }).slice(0, 30).map(function (a) {
        return { artigo: str(a.artigo, 40), conceito_central: str(a.conceito_central), regra_geral: str(a.regra_geral), excecoes: arr(a.excecoes).map(function (x) { return str(x); }).slice(0, 20),
          elementos: arr(a.elementos).map(function (x) { return typeof x === 'object' ? { tipo: str(x.tipo, 40), texto: str(x.texto) } : { tipo: '', texto: str(x) }; }).slice(0, 30),
          expressoes_atencao: arr(a.expressoes_atencao).map(function (x) { return typeof x === 'object' ? { expressao: str(x.expressao, 60), efeito: str(x.efeito) } : { expressao: str(x, 60), efeito: '' }; }).slice(0, 20),
          exemplo: str(a.exemplo), como_pode_ser_cobrado: arr(a.como_pode_ser_cobrado).map(function (x) { return typeof x === 'object' ? { texto: str(x.texto), base: /comprovad/i.test(x.base || '') && x.fonte ? 'incidencia_comprovada' : 'inferencia_pedagogica', fonte: str(x.fonte, 300) } : { texto: str(x), base: 'inferencia_pedagogica', fonte: '' }; }).slice(0, 15),
          limitacoes: str(a.limitacoes) };
      }) };
      if (!out.analises.length) throw erro('invalida', 'sem análises');
    } else if (acao === 'pontos_importantes' || acao === 'analisar_excecoes' || acao === 'identificar_pegadinhas') {
      out = { itens: arr(j.itens).filter(function (x) { return x && (x.texto || typeof x === 'string'); }).slice(0, 60).map(function (x) { return typeof x === 'string' ? { artigo: '', titulo: '', texto: str(x), trecho: '' } : { artigo: str(x.artigo, 40), titulo: str(x.titulo, 200), texto: str(x.texto), trecho: str(x.trecho, 600) }; }), limitacoes: str(j.limitacoes) };
      if (!out.itens.length) throw erro('invalida', 'sem itens');
    } else if (acao === 'comparar_artigos') {
      out = { aspectos: arr(j.aspectos).filter(function (a) { return a && a.aspecto; }).slice(0, 30).map(function (a) { return { aspecto: str(a.aspecto, 120), valores: arr(a.valores).map(function (v) { return { artigo: str(v && v.artigo, 40), texto: str(v && v.texto) }; }).slice(0, 10) }; }), complementares: str(j.complementares), como_nao_confundir: str(j.como_nao_confundir), limitacoes: str(j.limitacoes) };
      if (!out.aspectos.length) throw erro('invalida', 'sem aspectos');
    } else if (acao === 'gerar_flashcards_lei') {
      out = { cards: arr(j.cards).filter(function (c) { return c && c.frente && c.verso; }).slice(0, 80).map(function (c) { return { frente: str(c.frente, 500), verso: str(c.verso, 800), tipo: str(c.tipo, 60), fundamento: str(c.fundamento, 300), explicacao: str(c.explicacao, 800), artigo: str(c.artigo, 40), tags: arr(c.tags).map(function (t) { return str(t, 40); }).slice(0, 10) }; }) };
      if (!out.cards.length) throw erro('invalida', 'nenhum cartão com frente e verso');
    } else if (acao === 'gerar_questoes_lei') {
      out = { questoes: arr(j.questoes).map(function (q) {
        if (!q || !q.enunciado) return null;
        var alts = arr(q.alternativas).map(function (a, i) { return a && { letra: str(a.letra || 'ABCDE'.charAt(i), 1).toUpperCase(), texto: str(a.texto, 800), comentario: str(a.comentario, 800) }; }).filter(Boolean);
        var letras = alts.map(function (a) { return a.letra; }).join('');
        var gab = str(q.gabarito, 1).toUpperCase();
        if (alts.length !== 5 || letras !== 'ABCDE' || 'ABCDE'.indexOf(gab) < 0 || !gab || alts.some(function (a) { return !a.texto; })) return null;
        var cmd = str(q.comando, 20).toUpperCase();
        if (!/^(CORRETA|INCORRETA|EXCETO)$/.test(cmd)) cmd = /\b(INCORRETA|EXCETO)\b/i.test(q.enunciado) ? RegExp.$1.toUpperCase() : 'CORRETA';
        return { comando: cmd, enunciado: str(q.enunciado, 1500), alternativas: alts, gabarito: gab, fundamento: str(q.fundamento, 300), conhecimento: str(q.conhecimento, 300), armadilha: str(q.armadilha, 600), artigo: str(q.artigo, 40) };
      }).filter(Boolean).slice(0, 30) };
      if (!out.questoes.length) throw erro('invalida', 'nenhuma questão com 5 alternativas (A–E) e um gabarito');
    } else throw erro('invalida', 'ação desconhecida');
    return out;
  };

  /* ---------- fluxo com interface: rota → resultado; sem rota → copiar e colar ---------- */
  IA.executar = function (acao, dados, onOk, titulo) {
    var ui = SOS.ui;
    if (IA.rota()) {
      ui.toast('Pedindo à IA: ' + IA.ACOES[acao] + '…', '', 4000);
      return IA.chamar(acao, dados).then(function (r) { onOk(r, { modo: 'rota' }); }).catch(function (e) {
        ui.modal({ title: 'A IA não respondeu', body: '<p>' + U.esc(IA.mensagem(e)) + '</p><p class="muted">Você pode tentar de novo ou usar o modo “copiar e colar com o Claude”.</p>', buttons: [{ label: 'Fechar', cls: 'ghost' }, { label: 'Copiar e colar com o Claude', onClick: function () { setTimeout(function () { manual(acao, dados, onOk, titulo); }, 20); } }, { label: 'Tentar de novo', onClick: function () { setTimeout(function () { IA.executar(acao, dados, onOk, titulo); }, 20); } }] });
      });
    }
    manual(acao, dados, onOk, titulo);
  };
  function manual(acao, dados, onOk, titulo) {
    var ui = SOS.ui, pr = IA.promptManual(acao, dados);
    ui.modal({
      title: (titulo || IA.ACOES[acao]) + ' — IA', wide: true, noFocus: true,
      body: '<div class="alert info" style="display:block"><b>A IA depende de configuração.</b> ' + (IA.rota() ? '' : 'Não há rota de servidor cadastrada (Configurações › Rota de IA). ') + 'Sem servidor, faça assim: <ol style="margin:6px 0 0;padding-left:20px"><li>Copie o pedido abaixo e cole numa conversa com o Claude.</li><li>Copie a resposta (JSON) e cole no segundo campo.</li><li>O StudyOS confere o formato antes de usar. Nada entra no seu material sem a sua aprovação.</li></ol></div>' +
        '<div class="row" style="margin:8px 0 4px"><b style="font-family:var(--f-head)">1. Pedido</b><span class="spacer"></span><button class="btn xs" data-copy>Copiar pedido</button></div><textarea readonly rows="6" data-pr style="font-size:12px">' + U.esc(pr) + '</textarea>' +
        '<div style="margin:12px 0 4px"><b style="font-family:var(--f-head)">2. Resposta do Claude (JSON)</b></div><textarea rows="7" name="resp" placeholder="Cole aqui a resposta…"></textarea><div data-err class="muted" style="margin-top:6px"></div>',
      onOpen: function (root) {
        root.querySelector('[data-copy]').addEventListener('click', function () {
          var ta = root.querySelector('[data-pr]');
          var ok = function () { ui.toast('Pedido copiado. Cole na conversa com o Claude.', 'good'); };
          if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(pr).then(ok, function () { ta.select(); try { document.execCommand('copy'); ok(); } catch (e) { ui.toast('Selecione o texto e copie manualmente.', 'mid'); } });
          else { ta.select(); try { document.execCommand('copy'); ok(); } catch (e) { ui.toast('Selecione o texto e copie manualmente.', 'mid'); } }
        });
      },
      buttons: [{ label: 'Cancelar', cls: 'ghost' }, { label: 'Usar resposta', onClick: function (c, root) {
        var txt = ui.val(root, 'resp');
        try { var r = IA.validar(acao, txt); } catch (e) { root.querySelector('[data-err]').innerHTML = '<span style="color:var(--bad)">' + U.esc(IA.mensagem(e)) + '</span> Confira se colou a resposta inteira.'; return false; }
        setTimeout(function () { onOk(r, { modo: 'manual' }); }, 10);
      } }]
    });
  }
})();
