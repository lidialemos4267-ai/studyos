# Rota de IA do StudyOS

O site é estático e **não guarda chave de API**. A IA funciona de dois jeitos. Nos dois, a resposta é **conferida pelo site** antes de ser usada e exibida sem HTML (nenhum script da resposta roda).

| Jeito | Precisa de quê | Como funciona |
|---|---|---|
| **Copiar e colar com o Claude** | Nada | Sem rota configurada, o site mostra o pedido pronto. Você cola numa conversa com o Claude, copia a resposta (JSON) e cola de volta. |
| **Rota de servidor** | Conta na Cloudflare (grátis) + chave da API da Anthropic (paga por uso) | O site chama a sua rota, e a rota chama a IA com a chave guardada como segredo. É automático. |

## Contrato

O site envia `POST` com JSON:

```json
{
  "acao": "gerar_flashcards_lei",
  "versao": 2,
  "banca": "Instituto Selecon",
  "concurso": "Técnico Legislativo — Câmara Municipal de Cuiabá",
  "norma": "Nome da legislação",
  "artigos": [{ "id": "lei2:5", "numero": "Art. 5º", "texto": "texto integral do dispositivo", "capitulo": "CAPÍTULO I DA MESA" }],
  "nivel": "essencial | intermediario | reta",
  "quantidade": 5,
  "foco": "comparacao",
  "instrucoes": "texto completo do pedido (regras + formato da resposta), igual ao do modo copiar e colar"
}
```

`nivel` só vai nos flashcards, `quantidade` só nas questões e `foco` só nos flashcards de comparação.

| `acao` | Resposta esperada |
|---|---|
| `explicar_artigo` | `{ "analises": [{ "artigo", "conceito_central", "regra_geral", "excecoes": [], "elementos": [{ "tipo", "texto" }], "expressoes_atencao": [{ "expressao", "efeito" }], "exemplo", "como_pode_ser_cobrado": [{ "texto", "base": "inferencia_pedagogica \| incidencia_comprovada", "fonte" }], "limitacoes" }] }` |
| `pontos_importantes`, `analisar_excecoes`, `identificar_pegadinhas` | `{ "itens": [{ "artigo", "titulo", "texto", "trecho" }], "limitacoes" }` |
| `comparar_artigos` | `{ "aspectos": [{ "aspecto", "valores": [{ "artigo", "texto" }] }], "complementares", "como_nao_confundir", "limitacoes" }` |
| `gerar_flashcards_lei` | `{ "cards": [{ "frente", "verso", "tipo", "fundamento", "explicacao", "artigo", "tags": [] }] }` |
| `gerar_questoes_lei` | `{ "questoes": [{ "comando": "CORRETA \| INCORRETA \| EXCETO", "enunciado", "alternativas": [{ "letra": "A", "texto", "comentario" }, …5], "gabarito": "C", "fundamento", "conhecimento", "armadilha", "artigo" }] }` |

Regras de validação no site (`js/ia.js`):
- campos longos são cortados;
- questão sem exatamente 5 alternativas (A a E) ou sem gabarito é descartada;
- cartão sem frente ou verso é descartado;
- duplicados não entram na fila.

**Pedido antigo, compatível:** sem `acao`, com `{ "questoes": [...] }`. Resposta: `{ "cards": [{ "id", "frente", "verso", "fundamento", "explicacao" }] }`. É o botão "Melhorar com IA" da fila de flashcards.

**Erros tratados pelo site:**

| Situação | O site mostra |
|---|---|
| Sem internet ou endereço errado | aviso de conexão |
| Demora acima de 90 s | aviso de tempo esgotado |
| HTTP 429 | limite de requisições |
| HTTP 502, 503 ou 504 | serviço indisponível |
| Outro erro HTTP | o código do erro |
| JSON inválido | formato inválido |

Em todos os casos, o site oferece tentar de novo ou usar o modo copiar e colar.

## Montar a rota no Cloudflare Workers (passo a passo)

Arquivos prontos em [`docs/ia-rota/`](ia-rota/): `worker.js`, `wrangler.toml` e `package.json`.

1. Crie uma conta grátis em cloudflare.com e instale o Node.js.
2. Crie uma chave em console.anthropic.com (o uso é cobrado por pedido).
3. Na pasta `docs/ia-rota`, instale as dependências:

   ```bash
   npm install
   ```

4. Entre na sua conta da Cloudflare:

   ```bash
   npx wrangler login
   ```

5. Guarde a chave como segredo. Ela fica só na Cloudflare:

   ```bash
   npx wrangler secret put ANTHROPIC_API_KEY
   ```

6. Publique a rota:

   ```bash
   npx wrangler deploy
   ```

7. Copie o endereço que aparecer (`https://studyos-ia.<sua-conta>.workers.dev`) e cole em **Configurações › Rota de IA**.

A rota usa o modelo `claude-opus-5-5`. Se o modelo recusar por política, a API tenta sozinha o modelo recomendado (`fallbacks: "default"`).

**Proteções:**
- só aceita as ações listadas;
- só aceita pedidos vindos do endereço em `ORIGENS_PERMITIDAS` (o seu GitHub Pages; para usar pelo `index.html` local, acrescente `null`);
- recusa pedidos acima de 80 mil caracteres.

Mesmo assim, quem descobrir o endereço pode tentar usá-lo. Por isso, defina um limite de gastos no console da Anthropic.
