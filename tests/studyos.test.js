/* Testes do StudyOS (rodar com: node tests/studyos.test.js — precisa do Playwright instalado).
   Usa o navegador Chromium em modo headless e o index.html local. */
const { chromium, devices } = require('playwright');
const path = require('path'), fs = require('fs');
const URL = 'file://' + path.resolve(__dirname, '..', 'index.html');
const FIX = fs.readFileSync(path.join(__dirname, 'fixtures', 'estado-v2.json'), 'utf8');
let ok = 0, falhas = 0;
const check = (c, m) => { if (c) { ok++; console.log('  ✓ ' + m); } else { falhas++; console.log('  ✗ FALHOU: ' + m); } };

(async () => {
  const b = await chromium.launch();
  const errs = [];
  async function abrir(estado, dev) {
    const ctx = await b.newContext(dev || { viewport: { width: 1360, height: 900 }, acceptDownloads: true });
    if (estado) await ctx.addInitScript(s => { if (!sessionStorage.getItem('fix')) { localStorage.setItem('studyos.data', s); sessionStorage.setItem('fix', '1'); } }, estado);
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(e.message));
    p.on('console', m => { if (m.type() === 'error' && !/fonts|net::/.test(m.text())) errs.push('console: ' + m.text()); });
    await p.goto(URL); await p.waitForTimeout(1200);
    return { ctx, p };
  }
  const go = (p, r) => p.evaluate(r => { location.hash = '#' + r; }, r).then(() => p.waitForTimeout(200));

  console.log('1. Cargo único e datas');
  let { ctx, p } = await abrir();
  if (await p.$('.modal')) await p.click('.modal-f .btn');
  const c1 = await p.evaluate(() => ({ conc: SOS.S.concursos.map(c => c.id), data: SOS.S.concursos[0].dataProva, turno: SOS.S.concursos[0].turno, ana: SOS.S.topicos.some(t => t.refs.some(r => r.c === 'ANA')), ap: SOS.S.topicos.some(t => t.disc === 'AP'), filtro: getComputedStyle(document.querySelector('#concFilter')).display, cfg: SOS.CONFIG.datas.filter(d => !d.data).map(d => d.id) }));
  check(c1.conc.join() === 'TEC,OUV', 'Técnico Legislativo (principal) + Chapada · Ouvidor; Analista fora');
  check(c1.data === '2026-12-20' && c1.turno === 'Tarde', 'prova em 20/12/2026, à tarde (do arquivo de configuração)');
  check(!c1.ana && !c1.ap, 'nenhum tópico/vínculo do Analista Legislativo');
  check(c1.filtro !== 'none', 'filtro de concurso visível (dois concursos)');
  const ch = await p.evaluate(() => { const A = SOS.S.atividades, by = d => A.filter(a => a.data === d); const w = SOS.E.phaseWeights('2026-11-10'), w2 = SOS.E.phaseWeights('2026-11-30');
    const antes = A.filter(a => a.data < '2026-11-22' && a.metodo === 'Lei seca' && a.topicId).map(a => a.topicId);
    return { data: SOS.conc('OUV').dataProva, prova: by('2026-11-22').some(a => a.tipo === 'prova'), vesp: by('2026-11-21').reduce((x, a) => x + a.planMin, 0), w: [w.OUV, w.TEC], w2: [w2.OUV, w2.TEC], lai: antes.includes('lf02') && antes.includes('lf03'), simCh: by('2026-11-15').some(a => /Chapada/.test(a.titulo)), depois: A.filter(a => a.data > '2026-11-22' && a.topicId).every(a => SOS.topic(a.topicId).concursos.includes('TEC')) }; });
  console.log('   ', JSON.stringify(ch));
  check(ch.data === '2026-11-22' && ch.prova && ch.vesp > 0 && ch.vesp <= 90, 'Chapada: prova em 22/11 no plano, véspera leve');
  check(ch.w[0] === 0.6 && ch.w[1] === 0.4 && ch.w2[0] === 0 && ch.w2[1] === 1, 'pesos: 60% Chapada / 40% Câmara até 22/11; depois 100% Técnico');
  check(ch.lai && ch.simCh && ch.depois, 'LAI e Lei 13.460 na lei seca antes de Chapada, simulado no formato de Chapada, e depois só conteúdo do Técnico');
  check(/dias<\/b> para Chapada|para Chapada/.test(await p.textContent('.hero')), 'contagem de Chapada no início');
  check(['locais', 'gabarito', 'recursos', 'res_objetiva', 'res_discursiva', 'res_final'].every(x => c1.cfg.includes(x)), 'datas pendentes marcadas como “a confirmar”');
  const html = (await p.content()) + fs.readFileSync(path.join(__dirname, '..', 'js', 'seed.js'), 'utf8');
  check(!/2026-12-13'|13\/12\/2026\s*\(dom/.test(html.replace(/adiada de 13\/12\/2026|dataAnterior: '2026-12-13'/g, '')), 'nenhuma data 13/12/2026 em uso');

  console.log('2. Plano até a prova');
  const pl = await p.evaluate(() => {
    const A = SOS.S.atividades, ex = SOS.E.examDate(), byDay = {};
    A.forEach(a => (byDay[a.data] = byDay[a.data] || []).push(a));
    const viol = [];
    Object.keys(byDay).forEach(d => {
      const tps = byDay[d].filter(a => a.topicId).map(a => a.topicId);
      if (new Set(tps).size !== tps.length) viol.push(d + ' assunto repetido');
      const ds = [...new Set(byDay[d].filter(a => a.disc).map(a => a.disc))];
      if (ds.length > 3) viol.push(d + ' >3 disciplinas'); if (ds.includes('LP') && ds.includes('INF')) viol.push(d + ' LP+INF');
      if (byDay[d].filter(a => a.metodo === 'Lei seca').length > 1) viol.push(d + ' >1 norma');
    });
    const fin = Object.keys(byDay).filter(d => SOS.E.isRetaFinal(d)), antes = Object.keys(byDay).filter(d => !SOS.E.isRetaFinal(d) && d < ex);
    const sims = ds => ds.filter(d => byDay[d].some(a => a.metodo === 'Simulado' && a.planMin > 0)).length / Math.max(1, ds.length);
    const rev = ds => ds.reduce((x, d) => x + byDay[d].filter(a => /Revis|Flashcards/.test(a.metodo)).reduce((y, a) => y + a.planMin, 0), 0) / Math.max(1, ds.length);
    const leiAntesSim = Object.keys(byDay).filter(d => byDay[d].some(a => a.tipo === 'leirev')).length;
    return { ultimo: Object.keys(byDay).sort().pop(), ex, viol, simFin: sims(fin), simAntes: sims(antes), revFin: rev(fin), revAntes: rev(antes), leiAntesSim, prova: (byDay[ex] || []).some(a => a.tipo === 'prova'), vesp: (byDay[SOS.U.addDays(ex, -1)] || []).map(a => a.planMin).reduce((x, y) => x + y, 0), normas: [...new Set(A.filter(a => a.metodo === 'Lei seca' && a.topicId).map(a => a.topicId))] };
  });
  console.log('   ', JSON.stringify(pl));
  check(pl.ultimo === pl.ex && pl.prova, 'plano vai até o dia da prova (20/12)');
  check(pl.viol.length === 0, 'cada assunto 1 vez por dia, ≤3 disciplinas, Português ≠ Informática, 1 norma por dia' + (pl.viol.length ? ': ' + pl.viol.slice(0, 3) : ''));
  check(pl.simFin > pl.simAntes * 2 && pl.revFin > pl.revAntes, 'reta final (10 dias) com mais simulados e mais revisão');
  check(['lc01', 'lc02', 'lc03', 'lc04'].every(x => pl.normas.includes(x)) && pl.leiAntesSim > 3, 'lei seca das 4 normas da Câmara (+ leis de Chapada antes de 22/11), com revisão antes dos simulados');
  check(pl.vesp > 0 && pl.vesp <= 90, 'véspera leve');

  console.log('3. Registro único por assunto/dia');
  await go(p, 'desempenho'); await p.click('[data-act=new]');
  await p.selectOption('.modal [name=topicId]', 'in02'); await p.fill('.modal [name=leit]', '00:30'); await p.fill('.modal [name=real]', '00:50'); await p.fill('.modal [name=total]', '10'); await p.fill('.modal [name=acertos]', '8');
  await p.locator('.modal-f .btn', { hasText: 'Salvar' }).click(); await p.waitForTimeout(150);
  await p.click('[data-act=new]'); await p.selectOption('.modal [name=topicId]', 'in02'); await p.waitForTimeout(80);
  check(/será somado/.test(await p.textContent('#jaExiste')), 'avisa que o novo lançamento será somado ao do dia');
  await p.fill('.modal [name=real]', '00:20'); await p.fill('.modal [name=total]', '5'); await p.fill('.modal [name=acertos]', '5'); await p.check('.modal [name=rev]');
  await p.locator('.modal-f .btn', { hasText: 'Salvar' }).click(); await p.waitForTimeout(150);
  const s3 = await p.evaluate(() => SOS.S.sessoes.filter(s => s.topicId === 'in02' && s.data === SOS.U.today()));
  check(s3.length === 1 && s3[0].total === 15 && s3[0].acertos === 13 && s3[0].realizadoMin === 70 && s3[0].leituraMin === 30 && s3[0].revisao, 'um só registro: 15 questões, 13 acertos, 01:10h, leitura e revisão');
  check((await p.$$eval('#view tbody tr', r => r.length)) === 1, 'histórico mostra 1 linha para o assunto no dia');
  await ctx.close();

  console.log('4. Migração de dados antigos');
  ({ ctx, p } = await abrir(FIX));
  const rel = await p.$('.modal') ? await p.textContent('.modal') : '';
  check(/foi atualizado/.test(rel) && /Confira estes casos/.test(rel), 'relatório da migração com casos ambíguos');
  const m = await p.evaluate(() => {
    const S = SOS.S, t = SOS.U.today(), y = SOS.U.addDays(t, -1);
    const w = S.sessoes.filter(s => s.topicId === 'in02' && s.data === y), l = S.sessoes.filter(s => s.topicId === 'lp01' && s.data === y);
    const a = S.atividades.filter(x => x.topicId === 'in02' && x.data === t);
    return { w: w.map(s => [s.total, s.acertos, s.realizadoMin, s.obs]), l: l.length, amb: S.migr3Relatorio.sessoes.filter(x => x.ambiguo.length).length + S.migr3Relatorio.atividades.filter(x => x.ambiguo.length).length, a: a.map(x => [x.planMin, x.metodo, x.status, x.obs]), conc: S.concursos.map(c => c.id), arq: S.arquivo.concursos.map(c => c.id), errC: S.erros[0].concursos, fc: S.flashcards[0].concursos, q1: S.tec.qs.q1 && [!!S.tec.qs.q1.enun, S.tec.qs.q1.hist.length], ap02: S.topicos.some(x => x.id === 'ap02'), s4: S.sessoes.some(s => s.id === 's4') };
  });
  console.log('   ', JSON.stringify(m));
  check(m.w.length === 1 && m.w[0][0] === 15 && m.w[0][1] === 11 && m.w[0][2] === 85 && /li o capítulo/.test(m.w[0][3]) && /extra/.test(m.w[0][3]), 'Informática do mesmo dia: 3 registros viraram 1 (tempos e questões somados, observações juntadas)');
  check(m.a.length === 1 && m.a[0][0] === 100 && m.a[0][2] === 'andamento', 'atividades do mesmo assunto/dia viraram 1 cartão (100 min, status “em andamento” por ser ambíguo)');
  check(m.amb >= 2, 'casos ambíguos sinalizados (concursos diferentes, status diferentes)');
  check(m.conc.join() === 'TEC,OUV' && !m.arq.includes('OUV') && !m.ap02 && m.s4, 'Analista removido, Chapada mantida, registro antigo preservado');
  check(m.errC.join() === 'TEC,OUV' && !m.errC.includes('ANA') && !m.fc.includes('ANA'), 'erros e flashcards sem o Analista (tópico compartilhado: Técnico + Chapada)');
  check(m.q1 && m.q1[0] === false && m.q1[1] === 1, 'acerto comum do banco: conteúdo removido, contador mantido');
  const antes = await p.evaluate(() => JSON.stringify([SOS.S.sessoes.length, SOS.S.atividades.length]));
  await p.locator('.modal-f .btn', { hasText: 'Entendi' }).click(); await p.waitForTimeout(400);
  await p.reload(); await p.waitForTimeout(900);
  const depois = await p.evaluate(() => JSON.stringify([SOS.S.sessoes.length, SOS.S.atividades.length]));
  check(!(await p.$('.modal')) && antes === depois, 'migração roda uma vez só (depois de “Entendi”, não repete nem altera os dados)');
  await ctx.close();

  console.log('5. Início motivacional');
  ({ ctx, p } = await abrir());
  if (await p.$('.modal')) await p.click('.modal-f .btn');
  const dias = await p.evaluate(() => SOS.U.diffDays(SOS.U.today(), '2026-12-20'));
  const hero = await p.textContent('.hero');
  check(hero.includes(String(dias)) && /dias para a prova/.test(hero), 'destaque com ' + dias + ' dias para a prova');
  check(/Técnico Legislativo · Câmara de Cuiabá · 11 vagas · prova em 20\/12/.test(hero), 'lembrete do motivo visível');
  if (await p.evaluate(() => new Date() < new Date('2026-11-30T23:59:00'))) check(/para o fim das inscrições/.test(hero), 'contagem para o fim das inscrições');
  check((await p.$$eval('.pbar', e => e.length)) === 4, 'barra de progresso: assuntos, questões, lei seca, flashcards');
  await p.evaluate(() => { const s = { id: 'sx', topicId: 'lp01', data: SOS.U.today(), metodo: 'Questões', realizadoMin: 250, total: 20, acertos: 17 }; SOS.S.sessoes.push(s); SOS.save(); SOS.app.render(); });
  await p.waitForTimeout(150);
  check(/Meta batida/.test(await p.textContent('#view')), 'meta diária batida');
  check(/1\s*dia seguido/.test(await p.textContent('#view')), 'sequência (streak) de dias');
  await p.click('[data-act=fechar]'); await p.waitForTimeout(100);
  check(await p.$('.carinho') !== null, '“conquistei hoje” com mensagem carinhosa');
  const fr = await p.evaluate(() => { const o = {}; ['comeco', 'semCulpa', 'meta', 'retaFinal', 'vespera'].forEach(k => o[k] = SOS.motiv.FRASES[k].length); return o; });
  check(Object.values(fr).every(n => n >= 2), 'frases para começo do dia, sem culpa, meta, reta final e véspera');

  console.log('6. Lei seca priorizada');
  await go(p, 'leis');
  check(/Estimativa|estimativa/.test(await p.textContent('#view')) && /já cobrado pela Selecon/.test(await p.textContent('#view')), 'aviso de estimativa + temas já cobrados');
  await p.click('[data-norma=lc02]'); await p.waitForTimeout(100);
  await p.click('[data-tab=leis]'); await p.click('[data-text="lei2"]'); await p.waitForTimeout(150);
  await p.fill('.modal [name=texto]', 'TEXTO DE TESTE (inventado)\nArt. 10. A renúncia do vereador será dirigida à Mesa Diretora.\nArt. 11. Os líderes serão indicados pelas bancadas no prazo de 5 (cinco) dias.\nArt. 12. Os símbolos da Câmara são a bandeira e o brasão.\nArt. 13. As proposições tramitarão em regime normal.');
  await p.locator('.modal-f .btn', { hasText: 'Salvar' }).click(); await p.waitForTimeout(150);
  const cl = await p.evaluate(() => SOS.leiPrior.classificar(SOS.S.leis.find(l => l.topicId === 'lc02')).map(x => [x.n, x.nivel]));
  console.log('   ', JSON.stringify(cl));
  const nv = Object.fromEntries(cl);
  check(nv['10'] === 1 && nv['11'] === 1 && nv['12'] === 3 && nv['13'] === 2, 'renúncia e líderes = Nível 1; tramitação = Nível 2; símbolos = Nível 3');
  await p.click('[data-tab=prior]'); await p.click('[data-norma=lc02]'); await p.waitForTimeout(100);
  check(/Art\. 10/.test(await p.textContent('#view')) && /❓/.test(await p.textContent('#view')), 'lista com número, assunto, motivo e pergunta de fixação');
  await p.click('[data-norma=lc03]'); await p.waitForTimeout(80);
  check(/Art\. 28/.test(await p.textContent('#view')) && /Art\. 24, § 2º/.test(await p.textContent('#view')), 'artigos citados no edital (Estatuto) listados');

  console.log('7. Flashcards só do que erro');
  await p.evaluate(() => { SOS.tec.importData({ qs: [
    { id: 'q900', d: SOS.U.today(), t: 1, v: 1, ds: [SOS.U.today()], hist: [{ d: SOS.U.today(), t: 1, r: 'E', m: 'B' }], mat: 'Direito Administrativo', ass: 'Princípios da Administração Pública', banca: 'SELECON', enun: 'Questão inventada: qual princípio exige neutralidade da administração?', alts: [{ l: 'A', t: 'Publicidade' }, { l: 'B', t: 'Eficiência' }, { l: 'C', t: 'Impessoalidade' }], marc: 'B', gab: 'C', com: 'A impessoalidade impõe tratamento neutro. Art. 37 da CF.', origem: 'tec', ult: 'E' },
    { id: 'q901', d: SOS.U.today(), t: 2, v: 0, hist: [{ d: SOS.U.today(), t: 2, r: 'A' }], mat: 'Direito Administrativo', ass: 'Princípios da Administração Pública', origem: 'tec', ult: 'A', soContador: true }
  ] }, true); SOS.app.render(); });
  const dr = await p.evaluate(() => SOS.S.cardDrafts.map(d => ({ f: d.frente, v: d.verso, fu: d.fundamento, ex: d.explicacao, ref: d.ref })));
  console.log('   ', JSON.stringify(dr));
  check(dr.length === 1 && dr[0].ref === 'q:q900', 'cartão gerado só da questão errada (acerto comum não vira cartão)');
  check(/C\) Impessoalidade/.test(dr[0].v) && /Art\. 37/.test(dr[0].fu) && /Você marcou B/.test(dr[0].ex), 'verso com resposta, fundamento e explicação do erro');
  await p.evaluate(() => { SOS.tec.syncDerived(); SOS.cards.autoGenerate(); });
  check(await p.evaluate(() => SOS.S.cardDrafts.length) === 1, 'sem cartões repetidos ao sincronizar de novo');
  await go(p, 'flashcards'); await p.click('[data-tab=aprovar]'); await p.waitForTimeout(100);
  await p.fill('[data-draft] [name=fr]', 'Qual princípio exige tratamento neutro pela Administração?');
  await p.click('[data-dok]'); await p.waitForTimeout(100);
  const fc = await p.evaluate(() => ({ n: SOS.S.flashcards.length, f: SOS.S.flashcards[0] && SOS.S.flashcards[0].frente, erro: !!(SOS.S.flashcards[0] && SOS.S.flashcards[0].erroId), drafts: SOS.S.cardDrafts.length }));
  check(fc.n === 1 && /neutro/.test(fc.f) && fc.erro && fc.drafts === 0, 'aprovar (com edição) cria o cartão vinculado ao erro');
  await p.click('[data-tab=painel]'); await p.waitForTimeout(80);
  check(/Fila de hoje por assunto/.test(await p.textContent('#view')) && (await p.$$('[data-revtopic]')).length === 1, 'fila do dia por assunto');
  const srs = await p.evaluate(() => { const c = SOS.E.cardNew(), seq = []; ['bom', 'bom', 'bom', 'errei', 'bom'].forEach(r => { SOS.E.cardApply(c, r, SOS.U.today()); seq.push(c.int); }); return seq; });
  check(srs.join() === '1,3,7,1,1' || (srs[1] > srs[0] && srs[2] > srs[1] && srs[3] === 1), 'repetição espaçada: aumenta com acerto, volta ao início com erro (' + srs + ')');
  check(await p.evaluate(() => !/sk-|api[_-]?key/i.test(document.documentElement.outerHTML)), 'nenhuma chave de API no código do navegador');

  console.log('8. Visual e celular');
  await ctx.close();
  ({ ctx, p } = await abrir(null, devices['iPhone 13']));
  if (await p.$('.modal')) await p.click('.modal-f .btn');
  for (const r of ['dashboard', 'plano', 'leis', 'flashcards', 'desempenho', 'config']) { await go(p, r); const ov = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth); check(ov <= 1, r + ': sem rolagem lateral no celular'); }
  const font = await p.evaluate(() => getComputedStyle(document.querySelector('h1')).fontFamily);
  check(/Fraunces/.test(font), 'título com fonte serifada (Fraunces)');
  await ctx.close();
  ({ ctx, p } = await abrir(null, { viewport: { width: 1360, height: 900 }, colorScheme: 'dark' }));
  if (await p.$('.modal')) await p.click('.modal-f .btn');
  const bg = await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bg').trim());
  check(bg === '#1f171b', 'modo escuro na mesma paleta');
  await ctx.close();

  console.log('\nErros de JavaScript: ' + (errs.length ? errs.join(' | ') : 'nenhum'));
  if (errs.length) falhas++;
  console.log(`\nResultado: ${ok} ok, ${falhas} falha(s)`);
  await b.close();
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
