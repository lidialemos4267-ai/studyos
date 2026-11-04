/* Rota de IA do StudyOS — exemplo para Cloudflare Workers (gratuito no plano básico).
   A chave da API fica SÓ aqui, como segredo do Worker (ANTHROPIC_API_KEY). O navegador nunca a vê.
   Implantação: veja docs/ia-rota.md. */
import Anthropic from "@anthropic-ai/sdk";

const ACOES = ["explicar_artigo", "pontos_importantes", "analisar_excecoes", "identificar_pegadinhas", "comparar_artigos", "gerar_flashcards_lei", "gerar_questoes_lei"];
const MAX_CHARS = 80000; // limite de tamanho do pedido (protege seu saldo)
const SISTEMA = "Você é um assistente de estudo de lei seca para concursos públicos no Brasil. Use somente o texto legal recebido; não invente jurisprudência, prazos, competências, exceções ou números de artigo. Responda apenas com o JSON pedido, sem texto antes ou depois.";

function cors(env, origin) {
  const permitidas = (env.ORIGENS_PERMITIDAS || "").split(",").map((s) => s.trim()).filter(Boolean);
  const ok = permitidas.includes(origin);
  return { ok, headers: { "Access-Control-Allow-Origin": ok ? origin : permitidas[0] || "null", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Vary": "Origin" } };
}
const json = (obj, status, headers) => new Response(JSON.stringify(obj), { status, headers: { ...headers, "Content-Type": "application/json; charset=utf-8" } });

/* pedido antigo do StudyOS ({ questoes }) — flashcards a partir de questões erradas */
function promptLegado(questoes) {
  return "Para cada questão abaixo (que a estudante errou ou marcou como dúvida), escreva um flashcard: frente curta com o conceito que levou ao erro, verso objetivo, fundamento (artigo ou regra, só se estiver no comentário) e explicação do erro em até 2 linhas. Responda APENAS com JSON no formato {\"cards\":[{\"id\":\"id da questão\",\"frente\":\"...\",\"verso\":\"...\",\"fundamento\":\"...\",\"explicacao\":\"...\"}]}.\n\nQuestões (JSON):\n" + JSON.stringify(questoes);
}

export default {
  async fetch(request, env) {
    const c = cors(env, request.headers.get("Origin") || "");
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: c.headers });
    if (request.method !== "POST") return json({ erro: "Use POST." }, 405, c.headers);
    if (!c.ok) return json({ erro: "Origem não autorizada." }, 403, c.headers);

    const bruto = await request.text();
    if (bruto.length > MAX_CHARS) return json({ erro: "Pedido grande demais. Selecione menos artigos." }, 413, c.headers);
    let pedido;
    try { pedido = JSON.parse(bruto); } catch { return json({ erro: "JSON inválido." }, 400, c.headers); }

    let texto;
    if (pedido.acao) {
      if (!ACOES.includes(pedido.acao) || typeof pedido.instrucoes !== "string") return json({ erro: "Ação desconhecida." }, 400, c.headers);
      texto = pedido.instrucoes;
    } else if (Array.isArray(pedido.questoes)) {
      texto = promptLegado(pedido.questoes);
    } else return json({ erro: "Pedido sem ação." }, 400, c.headers);

    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    try {
      const resp = await client.beta.messages.create({
        model: "claude-opus-5-5",
        max_tokens: 16000,
        output_config: { effort: "medium" },
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default", // se o modelo recusar por política, a API tenta o modelo recomendado
        system: SISTEMA,
        messages: [{ role: "user", content: texto }],
      });
      if (resp.stop_reason === "refusal") return json({ erro: "A IA recusou este pedido." }, 422, c.headers);
      if (resp.stop_reason === "max_tokens") return json({ erro: "Resposta cortada. Peça menos itens por vez." }, 422, c.headers);
      const saida = resp.content.filter((b) => b.type === "text").map((b) => b.text).join("");
      // devolve o JSON que a IA escreveu; o StudyOS valida o formato antes de usar
      return new Response(saida, { status: 200, headers: { ...c.headers, "Content-Type": "application/json; charset=utf-8" } });
    } catch (e) {
      if (e instanceof Anthropic.RateLimitError) return json({ erro: "Limite de requisições." }, 429, c.headers);
      if (e instanceof Anthropic.AuthenticationError) return json({ erro: "Chave da API inválida no servidor." }, 500, c.headers);
      if (e instanceof Anthropic.APIError) return json({ erro: "Erro da API (" + e.status + ")." }, e.status >= 500 ? 503 : 502, c.headers);
      return json({ erro: "Falha inesperada no servidor." }, 500, c.headers);
    }
  },
};
