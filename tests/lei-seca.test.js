/* Testes da Lei seca 2.0 (rodar com: node tests/lei-seca.test.js — precisa do Playwright).
   A “rota de IA” é simulada SÓ AQUI, interceptando a rede (page.route); o site não tem respostas prontas. */
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const URL = 'file://' + path.resolve(__dirname, '..', 'index.html');
const FIX = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'estado-v2.json'), 'utf8'));
let ok = 0, falhas = 0;
const check = (c, m) => { if (c) { ok++; console.log('  ✓ ' + m); } else { falhas++; console.log('  ✗ FALHOU: ' + m); } };

// texto inventado para teste (não é texto oficial)
const TEXTO = [
  'TÍTULO I', 'DAS DISPOSIÇÕES PRELIMINARES', 'CAPÍTULO I', 'DA CÂMARA',
  'Art. 1º A Câmara Municipal compõe-se de vereadores eleitos.',
  'Art. 2º Compete privativamente à Mesa Diretora:',
  'I – dirigir os trabalhos legislativos;',
  'II - promulgar as resoluções, salvo nos casos previstos no art. 10;',
  'a) primeira alínea de teste;',
  '§ 1º A renúncia do vereador será dirigida à Mesa no prazo de 5 (cinco) dias.',
  'Parágrafo único. A cassação depende do voto de dois terços dos membros.',
  'CAPÍTULO II', 'DOS VEREADORES',
  'Art. 3º É vedado ao vereador firmar contrato com o Município.',
  'Art. 4º Os símbolos da Câmara são a bandeira e o brasão.'
].join('\n');

(async () => {
  const b = await chromium.launch();
  const errs = [];
  async function abrir(estado, opts) {
    const ctx = await b.newContext({ viewport: { width: 1360, height: 900 }, acceptDownloads: true });
    if (estado) await ctx.addInitScript(s => { if (!sessionStorage.getItem('fix')) { localStorage.setItem('studyos.data', s); sessionStorage.setItem('fix', '1'); } }, estado);
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(e.message));
    p.on('console', m => { if (m.type() === 'error' && !/fonts|net::|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
    await p.goto(URL); await p.waitForTimeout(1000);
    while (await p.$('.modal')) { await p.click('.modal-f .btn'); await p.waitForTimeout(80); }
    return { ctx, p };
  }
  const go = (p, r) => p.evaluate(r => { location.hash = '#' + r; }, r).then(() => p.waitForTimeout(200));
  const fecharModais = async p => { while (await p.$('.modal')) { await p.click('.modal-bg:last-child [data-x]'); await p.waitForTimeout(80); } };
  async function abrirLeitor(p) { await fecharModais(p); await go(p, 'leis'); await p.click('[data-tab=leis]'); await p.click('[data-read="lei2"]'); await p.waitForTimeout(250); }
  async function selecionar(p, artIdx, trecho) {
    await p.evaluate(({ artIdx, trecho }) => {
      const box = document.querySelector('.lx-text[data-art="' + artIdx + '"]');
      const w = document.createTreeWalker(box, NodeFilter.SHOW_TEXT); let n;
      while ((n = w.nextNode())) { const k = n.textContent.indexOf(trecho); if (k > -1) { const r = document.createRange(); r.setStart(n, k); r.setEnd(n, k + trecho.length); const s = getSelection(); s.removeAllRanges(); s.addRange(r); break; } }
      box.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    }, { artIdx, trecho });
    await p.waitForTimeout(80);
  }

  console.log('1–4. Importação, artigos, dispositivos e literalidade');
  let { ctx, p } = await abrir();
  await go(p, 'leis'); await p.click('[data-tab=leis]'); await p.click('[data-text="lei2"]'); await p.waitForTimeout(120);
  await p.fill('.modal [name=texto]', TEXTO);
  await p.locator('.modal-f .btn', { hasText: 'Salvar' }).click(); await p.waitForTimeout(200);
  const imp = await p.evaluate(() => { const l = SOS.S.leis.find(x => x.id === 'lei2'); return { texto: l.texto, ns: l.arts.map(a => a.n) }; });
  check(imp.texto === TEXTO, 'texto original guardado exatamente como colado');
  check(imp.ns.join() === 'Preâmbulo,1,2,3,4', 'artigos separados (' + imp.ns.join(', ') + ')');
  const est = await p.evaluate(() => { const l = SOS.S.leis.find(x => x.id === 'lei2'); const a = l.arts[2]; return SOS.lex.estrutura(a.t).map(s => s.tipo); });
  check(['caput', 'inc', 'inc', 'ali', 'par', 'par'].every((t, i) => est[i] === t) && est.slice(6).every(t => t === 'cab' || t === 'cabnome'), 'caput, incisos, alínea, § e parágrafo único identificados; capítulo seguinte reconhecido (' + est.join(',') + ')');
  const lit = await p.evaluate(() => SOS.S.leis.find(x => x.id === 'lei2').arts.every(a => SOS.lex.reconstruir(a.t, SOS.lex.estrutura(a.t)) === a.t));
  check(lit, 'formatação não altera o texto: a estrutura reconstrói cada artigo caractere por caractere');
  await abrirLeitor(p);
  const dom = await p.evaluate(() => ({ cap: [...document.querySelectorAll('.lx-cap')].map(e => e.textContent), cls: ['lx-caput', 'lx-inc', 'lx-ali', 'lx-par'].map(c => document.querySelectorAll('.' + c).length), txt: [...document.querySelectorAll('.lx-text[data-art="2"] .lx-seg')].map(e => e.textContent).join('\n'), art: SOS.S.leis.find(x => x.id === 'lei2').arts[2].t }));
  check(dom.cap.length === 3 && /CAPÍTULO II DOS VEREADORES/.test(dom.cap[2]), 'títulos e capítulos exibidos como cabeçalhos (sem inventar títulos)');
  check(dom.cls.every(n => n > 0), 'hierarquia visual: caput, inciso, alínea e parágrafo com estilos próprios');
  check(dom.art.startsWith(dom.txt), 'texto exibido idêntico ao original (sem correção, resumo ou troca de palavras)');

  console.log('3.4 Navegação e filtros');
  await p.fill('#lxq', '3'); await p.waitForTimeout(350);
  check((await p.$$('.lx-art')).length === 1 && /vedado/.test(await p.textContent('.lx-art')), 'busca por número do artigo');
  await p.fill('#lxq', 'brasão'); await p.waitForTimeout(350);
  check((await p.$$('.lx-art')).length === 1 && (await p.$$('.lx-text .hit')).length === 1, 'busca por palavra com o termo realçado');
  await p.fill('#lxq', ''); await p.waitForTimeout(350);
  await p.check('[data-lido="1"]'); await p.waitForTimeout(80);
  await p.click('#lxf [data-f=nao]'); await p.waitForTimeout(80);
  check((await p.$$('.lx-art')).length === 3, 'filtro de não lidos');
  await p.click('#lxf [data-f=todos]'); await p.waitForTimeout(80);
  check(/1 de 4 lidos/.test(await p.textContent('#lxp')), 'progresso conta só artigos (o preâmbulo com títulos não conta)');
  await p.selectOption('#lxcap', { index: 2 }); await p.waitForTimeout(150);
  check(await p.evaluate(() => document.querySelector('#lx-a-3').classList.contains('flash')), 'ir para capítulo leva ao primeiro artigo dele');
  const ua = await p.evaluate(() => SOS.S.leis.find(x => x.id === 'lei2').ultimoArt);
  await fecharModais(p); await abrirLeitor(p);
  check(!!ua && !(await p.$eval('#lxcont', e => e.hidden)) && (await p.textContent('#lxcont')).includes('Art. ' + ua), 'guarda onde parou e oferece “Continuar de onde parei” (' + ua + ')');

  console.log('5–6. Destaques e anotações persistentes');
  await selecionar(p, 2, 'promulgar as resoluções');
  check(!(await p.$eval('.lx-tb', e => e.hidden)), 'barra de marcação aparece ao selecionar um trecho');
  await p.click('.lx-tb [data-cat=pegadinha]'); await p.waitForTimeout(120);
  await selecionar(p, 2, 'dirigir os trabalhos');
  await p.click('.lx-tb [data-cat=nota]'); await p.waitForTimeout(120);
  await p.fill('.modal-bg:last-child [name=nota]', 'Mesa dirige, não o Presidente sozinho');
  await p.locator('.modal-bg:last-child .modal-f .btn', { hasText: 'Salvar' }).click(); await p.waitForTimeout(120);
  await p.click('#lx-a-3 [data-a=nota]'); await p.fill('[data-nota="3"]', 'Vedação: contrato com o Município'); await p.waitForTimeout(400);
  await p.click('#lx-a-3 [data-a=star]'); await p.waitForTimeout(80);
  await p.evaluate(() => SOS.saveNow());
  await p.reload(); await p.waitForTimeout(900);
  await abrirLeitor(p);
  const mk = await p.evaluate(() => { const a = SOS.S.leis.find(x => x.id === 'lei2').arts; return { m: a[2].marks.map(m => [m.cat, m.trecho, m.nota, a[2].t.slice(m.o, m.e) === m.trecho]), n: a[3].nota, s: a[3].star, dom: document.querySelectorAll('.lx-text mark.mk').length }; });
  check(mk.m.length === 2 && mk.m[0][0] === 'pegadinha' && mk.m[0][3] && mk.m[1][0] === 'nota' && /Mesa dirige/.test(mk.m[1][2]), 'marcações salvas com categoria, trecho exato e anotação (após recarregar)');
  check(mk.dom === 2, 'marcações exibidas no texto depois de recarregar');
  check(/contrato/.test(mk.n) && mk.s, 'anotação e destaque do artigo persistem');
  await p.click('mark.mk-pegadinha'); await p.waitForTimeout(80);
  await p.selectOption('.modal-bg:last-child [name=cat]', 'memorizar');
  await p.locator('.modal-bg:last-child .modal-f .btn', { hasText: 'Salvar' }).click(); await p.waitForTimeout(80);
  check(await p.evaluate(() => SOS.S.leis.find(x => x.id === 'lei2').arts[2].marks[0].cat === 'memorizar'), 'marcação editável');

  console.log('15a. Atualização da norma sem perder marcações');
  await fecharModais(p); await go(p, 'leis'); await p.click('[data-tab=leis]'); await p.click('[data-text="lei2"]'); await p.waitForTimeout(120);
  const novo = TEXTO.replace('Art. 2º Compete privativamente', 'Art. 2º (texto atualizado) Compete privativamente').replace('I – dirigir os trabalhos legislativos;', 'I – conduzir as sessões;').replace('Art. 3º É vedado ao vereador firmar contrato com o Município.\n', '');
  await p.fill('.modal [name=texto]', novo);
  await p.locator('.modal-f .btn', { hasText: 'Salvar' }).click(); await p.waitForTimeout(200);
  const up = await p.evaluate(() => { const l = SOS.S.leis.find(x => x.id === 'lei2'), a = l.arts.find(x => x.n === '2'); return { m: a.marks.map(m => [m.trecho, m.orfa, m.orfa || a.t.slice(m.o, m.e) === m.trecho]), alt: a.alterado, orf: l.orfaos.map(o => [o.n, o.nota]), lido: l.arts.find(x => x.n === '1').lido }; });
  check(up.m[0][1] === false && up.m[0][2], 'trecho que mudou de posição foi relocalizado');
  check(up.m[1][1] === true && /dirigir/.test(up.m[1][0]), 'trecho que sumiu: marcação preservada e sinalizada para revisão');
  check(up.orf.length === 1 && up.orf[0][0] === '3' && /contrato/.test(up.orf[0][1]) && up.lido && up.alt, 'artigo removido com anotação guardado em “versão anterior”; leitura mantida; artigo alterado sinalizado');

  console.log('7–9. Flashcards da lei: geração, aprovação e sem duplicidade');
  await abrirLeitor(p);
  check(/precisa revisar/.test(await p.textContent('#lx-a-2')) && /versão anterior/.test(await p.textContent('#lxorf')), 'leitor mostra marcação a revisar e artigos da versão anterior');
  await p.check('[data-sel="2"]'); await p.waitForTimeout(60);
  await p.click('#lxselbar [data-a=gfc]'); await p.waitForTimeout(150);
  await p.selectOption('.modal-bg:last-child [name=nivel]', 'reta'); await p.waitForTimeout(100);
  const prevTxt = await p.textContent('.modal-bg:last-child #gprev');
  await p.locator('.modal-bg:last-child .modal-f .btn', { hasText: 'Enviar para aprovação' }).click(); await p.waitForTimeout(150);
  const dr = await p.evaluate(() => SOS.S.cardDrafts.map(d => ({ t: d.tipo, f: d.frente, v: d.verso, r: d.leiRef, fu: d.fundamento })));
  console.log('   ', dr.map(d => d.t + ': ' + d.v).join(' | '));
  check(dr.length >= 3 && dr.every(d => d.r && d.r.leiId === 'lei2' && d.r.n === '2'), 'cartões gerados por regras com referência legal em campo próprio (' + dr.length + ')');
  check(dr.some(d => d.t === 'Regra e exceção' && /^salvo/.test(d.v)) && dr.some(d => d.v === '5 (cinco) dias') && dr.some(d => d.v === 'dois terços') && dr.some(d => /Mesa Diretora/.test(d.v)), 'tipos: regra e exceção, prazo, quórum e competência, com verso curto');
  check(/cartão/.test(prevTxt) && dr.every(d => d.v.length < 260), 'prévia antes de enviar; nenhum verso copia o artigo inteiro');
  await p.click('.modal-bg:last-child #lxselbar [data-a=gfc]').catch(() => {});
  await p.evaluate(() => { document.querySelector('#lxselbar [data-a=gfc]').click(); }); await p.waitForTimeout(150);
  await p.selectOption('.modal-bg:last-child [name=nivel]', 'reta'); await p.waitForTimeout(100);
  check(/^\s*0 cartão/.test(await p.textContent('.modal-bg:last-child #gprev')), 'gerar de novo não duplica (0 novos)');
  await fecharModais(p);
  await go(p, 'flashcards'); await p.click('[data-tab=aprovar]'); await p.waitForTimeout(100);
  check(/Referência legal: Art\. 2º/.test(await p.textContent('#view')), 'fila de aprovação mostra a referência legal');
  const fid = await p.evaluate(() => SOS.S.cardDrafts[0].id);
  await p.fill('[data-draft="' + fid + '"] [name=tg]', 'Lei_Seca Mesa');
  await p.click('[data-dok="' + fid + '"]'); await p.waitForTimeout(100);
  await p.click('[data-tab=aprovar]'); await p.waitForTimeout(80);
  const ap = await p.evaluate(() => { const c = SOS.S.flashcards[SOS.S.flashcards.length - 1]; return { tipo: c.tipo, ref: c.leiRef, tags: c.tags, srs: !!c.srs, origem: c.origem }; });
  check(ap.tipo !== 'Pergunta objetiva' && ap.ref && ap.ref.n === '2' && /Mesa/.test(ap.tags) && ap.srs && ap.origem === 'Legislação', 'aprovar cria o cartão no baralho com tipo, tags e referência, na revisão espaçada');
  await p.click('[data-act=dall]'); await p.waitForTimeout(100);

  console.log('10–11. Exportação para o Anki e compatibilidade');
  await p.evaluate(() => { SOS.S.flashcards.push({ id: 'fantigo', frente: 'Cartão antigo?', verso: 'Sim', topicId: 'lp01', concursos: ['TEC'], origem: 'Aula', srs: SOS.E.cardNew(), log: [] }); SOS.save(); });
  await p.click('[data-tab=io]'); await p.waitForTimeout(80);
  let [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-act=export]')]);
  let csv = fs.readFileSync(await dl.path(), 'utf8');
  const head = csv.split('\n').find(l => l.startsWith('#columns'));
  check(head === '#columns:Frente;Verso;Disciplina;Assunto;Concurso;Tags;Explicacao;Fundamento;Banca;Tipo;Referencia;Resposta' && csv.includes('#tags column:6'), 'CSV mantém as 6 colunas antigas na mesma ordem e acrescenta as novas no fim');
  check(/Cartão antigo\?/.test(csv) && /Art\. 2º.*Regimento/.test(csv), 'cartão antigo (sem campos novos) e cartão da lei exportados; referência legal no CSV');
  [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-act=exportLei]')]);
  csv = fs.readFileSync(await dl.path(), 'utf8');
  check(!/Cartão antigo/.test(csv) && /Lei_Seca/.test(csv), 'exportar só lei seca');
  await p.click('[data-tab=lista]'); await p.waitForTimeout(80);
  await p.click('[data-pick="fantigo"]'); await p.waitForTimeout(80);
  [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-act=exportSel]')]);
  csv = fs.readFileSync(await dl.path(), 'utf8');
  check(csv.trim().split('\n').filter(l => !l.startsWith('#')).length === 1 && /Cartão antigo/.test(csv), 'exportar só os selecionados');
  const tmp = path.join(require('os').tmpdir(), 'sos-import-' + Date.now());
  fs.writeFileSync(tmp + '-v1.csv', 'Frente;Verso;Disciplina;Assunto;Concurso;Tags\nPergunta formato antigo?;Resposta antiga;;;;tag1\n');
  fs.writeFileSync(tmp + '-v2.csv', '#separator:Semicolon\n#columns:Frente;Verso;Disciplina;Assunto;Concurso;Tags;Explicacao;Fundamento;Banca;Tipo;Referencia;Resposta\nPergunta formato novo?;Resposta<br><br>extra;;;;x;Explica;Art. 9º;Selecon;Literalidade;Art. 9º — Lei X;Resposta limpa\n');
  await p.click('[data-tab=io]'); await p.waitForTimeout(80);
  await p.setInputFiles('input[name=csv]', tmp + '-v1.csv'); await p.waitForTimeout(250);
  await p.setInputFiles('input[name=csv]', tmp + '-v2.csv'); await p.waitForTimeout(250);
  const im = await p.evaluate(() => SOS.S.flashcards.filter(c => c.origem === 'Importado').map(c => [c.frente, c.verso, c.tipo, c.fundamento || '']));
  check(im.length === 2 && im[0][1] === 'Resposta antiga' && im[1][1] === 'Resposta limpa' && im[1][2] === 'Literalidade' && im[1][3] === 'Art. 9º', 'importa CSV antigo (6 colunas) e o novo (com colunas extras)');

  console.log('12. Rota de IA (contrato, segurança e erros)');
  let ultimo = null, modoRota = 'ok';
  await p.route('https://ia.teste/**', async route => {
    const req = JSON.parse(route.request().postData()); ultimo = req;
    if (modoRota === '429') return route.fulfill({ status: 429, body: 'limite' });
    if (modoRota === 'lixo') return route.fulfill({ status: 200, contentType: 'text/plain', body: 'isto não é json' });
    const r = {
      explicar_artigo: { analises: [{ artigo: 'Art. 2º', conceito_central: 'Competências da Mesa <img src=x onerror="window.__xss=1">', regra_geral: 'A Mesa dirige os trabalhos.', excecoes: ['Casos do art. 10'], elementos: [{ tipo: 'competência', texto: 'privativa' }], expressoes_atencao: [{ expressao: 'salvo', efeito: 'introduz exceção' }], exemplo: 'Exemplo simples.', como_pode_ser_cobrado: [{ texto: 'Trocar Mesa por Presidente', base: 'inferencia_pedagogica' }], limitacoes: 'O art. 10 não foi enviado.' }] },
      gerar_flashcards_lei: { cards: [{ frente: 'Quem promulga as resoluções (regra)?', verso: 'A Mesa Diretora', tipo: 'Prazos e competências', fundamento: 'Art. 2º, II', explicacao: 'Competência privativa', artigo: 'Art. 2º', tags: ['Selecon'] }, { frente: 'Quem promulga as resoluções (regra)?', verso: 'A Mesa Diretora', tipo: 'x', artigo: 'Art. 2º' }] },
      gerar_questoes_lei: { questoes: [
        { comando: 'INCORRETA', enunciado: 'Sobre a Mesa Diretora, assinale a alternativa INCORRETA.', alternativas: ['A', 'B', 'C', 'D', 'E'].map((l, i) => ({ letra: l, texto: ['Dirige os trabalhos', 'Promulga resoluções', 'Compete ao Prefeito dirigir os trabalhos', 'A competência é privativa', 'Há exceção no art. 10'][i], comentario: 'Comentário ' + l })), gabarito: 'C', fundamento: 'Art. 2º, I', conhecimento: 'Competência da Mesa', armadilha: 'Troca de competência', artigo: 'Art. 2º' },
        { comando: 'CORRETA', enunciado: 'Questão inválida com 4 alternativas', alternativas: ['A', 'B', 'C', 'D'].map(l => ({ letra: l, texto: l })), gabarito: 'A' }
      ] }
    }[req.acao];
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(r || { erro: 'ação' }) });
  });
  await p.evaluate(() => { SOS.S.settings.iaEndpoint = 'https://ia.teste/rota'; SOS.save(); });
  await abrirLeitor(p);
  await p.click('#lx-a-2 [data-a=ia]'); await p.waitForTimeout(80);
  await p.click('.modal-bg:last-child [data-ac=explicar_artigo]'); await p.waitForTimeout(600);
  check(ultimo && ultimo.acao === 'explicar_artigo' && ultimo.artigos[0].texto.startsWith('Art. 2º (texto atualizado)') && ultimo.banca === 'Instituto Selecon' && !('chave' in ultimo), 'pedido com ação, texto integral do artigo e banca (sem chave)');
  const ia = await p.evaluate(() => ({ html: document.querySelector('#lx-a-2 .lx-ia') && document.querySelector('#lx-a-2 .lx-ia').textContent, img: document.querySelectorAll('.lx-ia img').length, xss: window.__xss, salvo: !!SOS.S.leis.find(x => x.id === 'lei2').ia['2'].explicar_artigo, texto: document.querySelector('.lx-text[data-art="2"]').textContent }));
  check(/Conceito central/.test(ia.html) && /Limitações/.test(ia.html) && /inferência/.test(ia.html) && ia.salvo, 'explicação estruturada (conceito, regra, exceções, … limitações) exibida e guardada');
  check(ia.img === 0 && !ia.xss && /<img/.test(ia.html), 'resposta da IA exibida como texto (HTML/script não executa)');
  check(!/Competências da Mesa/.test(ia.texto), 'explicação fica separada do texto legal');
  modoRota = '429';
  await p.click('#lx-a-2 [data-a=ia]'); await p.waitForTimeout(80); await p.click('.modal-bg:last-child [data-ac=pontos_importantes]'); await p.waitForTimeout(500);
  check(/limite de requisições/.test(await p.textContent('.modal-bg:last-child')), 'erro 429 explicado (limite de requisições)');
  await fecharModais(p); await abrirLeitor(p);
  modoRota = 'lixo';
  await p.click('#lx-a-2 [data-a=ia]'); await p.waitForTimeout(80); await p.click('.modal-bg:last-child [data-ac=pontos_importantes]'); await p.waitForTimeout(500);
  check(/formato inválido/.test(await p.textContent('.modal-bg:last-child')), 'resposta inválida tratada');
  await fecharModais(p); await abrirLeitor(p);
  modoRota = 'ok';
  await p.check('[data-sel="2"]'); await p.click('#lxselbar [data-a=gia]'); await p.waitForTimeout(80);
  await p.click('.modal-bg:last-child [data-ac=gerar_flashcards_lei]'); await p.waitForTimeout(120);
  await p.locator('.modal-bg:last-child .modal-f .btn', { hasText: 'Enviar para aprovação' }).click(); await p.waitForTimeout(600);
  const dia = await p.evaluate(() => SOS.S.cardDrafts.filter(d => d.ia).map(d => [d.frente, d.leiRef && d.leiRef.n, d.tipo]));
  check(dia.length === 1 && dia[0][1] === '2' && ultimo.acao === 'gerar_flashcards_lei' && ultimo.nivel, 'flashcards da IA vão para a fila de aprovação (duplicado da própria resposta ignorado)');
  await fecharModais(p);
  await p.evaluate(() => { SOS.S.settings.iaEndpoint = ''; SOS.save(); });
  await abrirLeitor(p);
  await p.click('#lx-a-2 [data-a=ia]'); await p.waitForTimeout(80); await p.click('.modal-bg:last-child [data-ac=analisar_excecoes]'); await p.waitForTimeout(150);
  const man = await p.textContent('.modal-bg:last-child');
  check(/depende de configuração/.test(man) && /Responda APENAS com um JSON/.test(await p.inputValue('.modal-bg:last-child [data-pr]')), 'sem rota: avisa que depende de configuração e monta o pedido para o Claude');
  await p.fill('.modal-bg:last-child [name=resp]', 'texto qualquer');
  await p.locator('.modal-bg:last-child .modal-f .btn', { hasText: 'Usar resposta' }).click(); await p.waitForTimeout(80);
  check(/formato inválido/.test(await p.textContent('.modal-bg:last-child [data-err]')), 'resposta colada inválida é recusada');
  await p.fill('.modal-bg:last-child [name=resp]', '```json\n{"itens":[{"artigo":"Art. 2º","titulo":"Regra → exceção","texto":"Promulgar é da Mesa, salvo art. 10","trecho":"salvo nos casos previstos no art. 10"}],"limitacoes":""}\n```');
  await p.locator('.modal-bg:last-child .modal-f .btn', { hasText: 'Usar resposta' }).click(); await p.waitForTimeout(200);
  check(/Exceções e ressalvas/.test(await p.textContent('#lx-a-2')), 'resposta colada válida é usada (modo copiar e colar)');
  check(await p.evaluate(() => !/sk-ant|api[_-]?key\s*[:=]/i.test(document.documentElement.outerHTML + [...document.scripts].map(s => s.src).join())), 'nenhuma chave de API no navegador');

  console.log('13–14. Questões A–E e Caderno de Erros');
  await fecharModais(p);
  await p.evaluate(() => { SOS.S.settings.iaEndpoint = 'https://ia.teste/rota'; SOS.save(); });
  await abrirLeitor(p);
  await p.check('[data-sel="2"]'); await p.click('#lxselbar [data-a=gq]'); await p.waitForTimeout(80);
  await p.locator('.modal-bg:last-child .modal-f .btn', { hasText: 'Gerar' }).click(); await p.waitForTimeout(700);
  const qs = await p.evaluate(() => SOS.S.questoesLei.map(q => [q.alternativas.length, q.gabarito, q.artN, q.origem]));
  check(qs.length === 1 && qs[0][0] === 5 && qs[0][2] === '2' && /não oficial/.test(qs[0][3]), 'só questões válidas (5 alternativas A–E, 1 gabarito) são aceitas; marcadas como não oficiais');
  check((await p.$$('.modal-bg:last-child mark.cmd-neg')).length >= 1 && /não oficial/.test(await p.textContent('.modal-bg:last-child')), 'comando negativo (INCORRETA) destacado durante a resolução');
  await p.click('.modal-bg:last-child [data-alt=A]'); await p.waitForTimeout(150);
  const res = await p.textContent('.modal-bg:last-child');
  check(/Gabarito: C/.test(res) && /Comentário A/.test(res) && /Comentário E/.test(res) && /Troca de competência/.test(res) && /Art\. 2º, I/.test(res), 'após responder: gabarito, comentário das 5 alternativas, fundamento e armadilha');
  const er = await p.evaluate(() => SOS.S.erros.filter(e => e.qLeiId).map(e => ({ ref: e.leiRef, oc: e.ocorrencias, mc: e.marcada, cor: e.correta, just: e.justificativa, rev: !!e.rev })));
  check(er.length === 1 && er[0].ref.n === '2' && /^A\)/.test(er[0].mc) && /^C\)/.test(er[0].cor) && /Fundamento/.test(er[0].just) && er[0].rev, 'erro registrado no Caderno com artigo, justificativa e revisão espaçada');
  await p.selectOption('.modal-bg:last-child [data-motivo]', 'Pegadinha da banca'); await p.waitForTimeout(80);
  await p.click('.modal-bg:last-child [data-q=fc]'); await p.waitForTimeout(150);
  await p.locator('.modal-bg:last-child .modal-f .btn', { hasText: 'Aprovar e salvar' }).click(); await p.waitForTimeout(150);
  const fcErr = await p.evaluate(() => { const e = SOS.S.erros.find(x => x.qLeiId); const c = SOS.S.flashcards.find(x => x.erroId === e.id); return { cat: e.categorias, c: c && c.leiRef, ids: e.flashcardIds.length }; });
  check(fcErr.cat[0] === 'Pegadinha da banca' && fcErr.c && fcErr.c.n === '2' && fcErr.ids === 1, 'motivo do erro salvo; flashcard do erro mantém a referência legal');
  await fecharModais(p);
  await go(p, 'leis'); await p.click('[data-tab=quest]'); await p.waitForTimeout(80);
  await p.click('[data-qact=err]'); await p.waitForTimeout(100);
  await p.click('.modal-bg:last-child [data-alt=B]'); await p.waitForTimeout(150);
  const er2 = await p.evaluate(() => SOS.S.erros.filter(e => e.qLeiId).map(e => e.ocorrencias));
  check(er2.length === 1 && er2[0] === 2, 'errar de novo a mesma questão não duplica o erro (conta recorrência)');
  await fecharModais(p);
  await go(p, 'erros'); await p.waitForTimeout(80);
  await p.click('[data-lei]'); await p.waitForTimeout(300);
  check(await p.evaluate(() => !!document.querySelector('.lx-modal #lx-a-2') && document.querySelector('#lx-a-2').getBoundingClientRect().top < 500), 'abrir o artigo original direto pelo registro do erro');
  await ctx.close();

  console.log('15b. Dados antigos preservados');
  const antigo = JSON.parse(JSON.stringify(FIX));
  antigo.leis[2].texto = 'Art. 1º Texto antigo.\nArt. 2º Outro texto.';
  antigo.leis[2].arts = [{ n: '1', t: 'Art. 1º Texto antigo.', lido: true, star: true, nota: 'nota antiga' }, { n: '2', t: 'Art. 2º Outro texto.', lido: false, star: false, nota: '' }];
  antigo.flashcards[0].srs = { due: '2026-12-01', int: 15, ease: 2.6, reps: 4, lapses: 0, streak: 4 }; antigo.flashcards[0].log = [{ d: '2026-11-01', r: 'bom' }];
  ({ ctx, p } = await abrir(JSON.stringify(antigo)));
  const pres = await p.evaluate(() => ({ fc: SOS.S.flashcards.find(c => c.id === 'f1'), a: SOS.S.leis[2].arts, q: SOS.S.questoesLei, ses: SOS.S.sessoes.length, er: SOS.S.erros.length, fs: SOS.S.settings.leitorFonte }));
  check(pres.fc.srs.int === 15 && pres.fc.srs.reps === 4 && pres.fc.log.length === 1 && pres.fc.frente === 'Teste?', 'progresso dos flashcards antigos mantido');
  check(pres.a[0].lido && pres.a[0].star && pres.a[0].nota === 'nota antiga' && Array.isArray(pres.q) && pres.fs === 17 && pres.ses > 0 && pres.er > 0, 'leitura, destaques e anotações antigas mantidos; campos novos com valor padrão');
  await go(p, 'leis'); await p.click('[data-tab=leis]'); await p.click('[data-read="lei3"]'); await p.waitForTimeout(250);
  check(/nota antiga/.test(await p.inputValue('[data-nota="0"]')) && (await p.$$('.lx-art.lido')).length === 1, 'leitor novo abre normas salvas na versão anterior');
  await ctx.close();

  console.log('\nErros de JavaScript: ' + (errs.length ? errs.join(' | ') : 'nenhum'));
  if (errs.length) falhas++;
  console.log(`\nResultado: ${ok} ok, ${falhas} falha(s)`);
  await b.close();
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
