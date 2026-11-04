/* Teste da extensão do Chrome numa página que IMITA a estrutura do TEC (questão inventada).
   Rodar com: node tests/extensao.test.js  (precisa do Playwright com Chromium). */
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs'), os = require('os');
const EXT = path.resolve(__dirname, '..', 'extensao-tec'), MOCK = fs.readFileSync(path.join(__dirname, 'fixtures', 'mock-tec.html'), 'utf8');
let ok = 0, falhas = 0;
const check = (c, m) => { if (c) { ok++; console.log('  ✓ ' + m); } else { falhas++; console.log('  ✗ FALHOU: ' + m); } };
(async () => {
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'sos-ext-'));
  const ctx = await chromium.launchPersistentContext(prof, { channel: 'chromium', headless: true, args: ['--disable-extensions-except=' + EXT, '--load-extension=' + EXT] });
  await ctx.route('https://www.tecconcursos.com.br/**', r => r.fulfill({ contentType: 'text/html', body: MOCK }));
  const errs = [];
  const pg = await ctx.newPage(); await pg.goto('chrome://extensions'); await pg.waitForTimeout(600);
  const id = await pg.evaluate(() => document.querySelector('extensions-manager').shadowRoot.querySelector('extensions-item-list').shadowRoot.querySelector('extensions-item').id);
  await pg.goto('chrome-extension://' + id + '/popup.html'); await pg.waitForTimeout(300);
  const store = () => pg.evaluate(() => new Promise(r => chrome.storage.local.get(null, r)));
  // dado antigo: acerto salvo completo (versão anterior) → deve ser limpo
  await pg.evaluate(() => new Promise(r => chrome.storage.local.set({ qs: { q1: { id: 'q1', v: 0, enun: 'antigo', alts: [{ l: 'A', t: 'x' }], com: 'c', hist: [{ d: '2026-11-01', t: 1, r: 'A' }] } } }, r)));
  const abrirQ = async (n) => { const t = await ctx.newPage(); t.on('pageerror', e => errs.push(e.message)); await t.goto('https://www.tecconcursos.com.br/questoes/cadernos/123456?id=' + n); await t.waitForTimeout(3300); return t; };

  console.log('1. Acerto comum: só o contador');
  let t = await abrirQ(111); await t.evaluate(() => acertar()); await t.waitForTimeout(2200);
  let st = await store(), q = st.qs.q111;
  check(q && q.hist.length === 1 && q.hist[0].r === 'A' && q.mat === 'Direito Administrativo' && q.ass, 'acerto registrado com assunto e data');
  check(!q.enun && !q.alts && !q.com && q.soContador, 'acerto comum NÃO guarda enunciado, alternativas nem comentário');
  check(st.limpezaAcertos && !st.qs.q1.enun && st.qs.q1.hist.length === 1, 'acertos antigos limpos (contador preservado)');
  await t.close();

  console.log('2. Erro: questão completa');
  t = await abrirQ(222); await t.evaluate(() => errar()); await t.waitForTimeout(2200);
  q = (await store()).qs.q222;
  check(q && q.v === 1 && q.enun && q.alts.length === 4 && q.gab === 'C' && q.marc === 'B', 'erro guarda enunciado, alternativas, gabarito e resposta');
  await t.evaluate(() => comentar()); await t.waitForTimeout(2200);
  check(/impessoalidade/i.test((await store()).qs.q222.com || ''), 'comentário guardado depois');
  await t.close();

  console.log('3. Acertei, mas chutei: questão completa');
  t = await abrirQ(333);
  check(await t.evaluate(() => [...document.querySelectorAll('button')].some(b => b.textContent === 'Chutei')), 'botões “Chutei” e “Em dúvida” aparecem na tela');
  await t.evaluate(() => acertar()); await t.waitForTimeout(2200);
  await t.evaluate(() => [...document.querySelectorAll('button')].find(b => b.textContent === 'Chutei').click()); await t.waitForTimeout(1500);
  q = (await store()).qs.q333;
  check(q && q.marca === 'chutei' && q.enun && q.gab === 'C' && q.hist.length === 1 && !q.soContador, 'marcado como chute: guarda completa sem contar tentativa extra');
  await t.close();

  console.log('4. Popup e diagnóstico');
  await pg.reload(); await pg.waitForTimeout(300);
  check((await pg.textContent('#kq')) === '4', 'popup conta as questões');
  t = await abrirQ(444);
  const r = await pg.evaluate(() => new Promise(res => chrome.tabs.query({}, tabs => { const x = tabs.find(y => /tecconcursos/.test(y.url)); chrome.tabs.sendMessage(x.id, { t: 'diag' }, res); })));
  check(r && r.angular.vmEncontrado && r.questaoLida.id === 'q444', 'diagnóstico funciona');
  console.log('\nErros de JavaScript: ' + (errs.length ? errs.join(' | ') : 'nenhum')); if (errs.length) falhas++;
  console.log(`\nResultado: ${ok} ok, ${falhas} falha(s)`);
  await ctx.close(); process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
