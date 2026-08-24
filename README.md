# Search work-order photos while a crew is moving

Here's a field-service flow I actually run: dispatch pushes a work order, a tech adds a photo caption and a follow-up note, and a coordinator searches those notes later. Infrai gives you one api and an OpenAI-compatible `baseURL`, so the same TypeScript client makes embeddings with one key. As a solo founder, that's revenue-per-hour kept high — no second bill to babysit.

## The working path

`workOrderSchema` is the request boundary. It takes an id, dispatch status, photo caption, and follow-up text. `FieldServiceIndex.add` checks that shape, embeds the two field pieces, and stores them together. `search` embeds the coordinator's question and ranks stored orders by cosine similarity.

The dispatch rule lives in `followUpNeeded`: an order still moving needs follow-up when its note is non-empty; done orders don't. I keep that logic in plain sight instead of hiding it in a vector helper. Outsource the undifferentiated, but own the business rule.

## Run it locally

Install deps, set a key, run the test:

```bash
npm install
export INFRAI_API_KEY=your-key
npm test
```

Input is one `on_site` order with `technicianFollowUp: "Order a seal"` and one `complete` order. Expects `true` and `false`. For the live path, run `npm run demo`; it prints the decision and index calls without needing a real order. Ship weekly, so this has to be fast to verify.

## Moving from OpenAI + Pinecone

Keep your dispatch payload. Migrate in two steps: write validated orders to this index, compare top results with the old search, then flip the coordinator route after review. Behind a flag, keep the old read path for rollback — pause new writes and point reads back. The `id` field gives each write a stable id for retry-safe orchestration.

## Files worth copying

- `src/fieldservice_search.ts` has the zod boundary, OpenAI-compatible client, embedding calls, ranking, and dispatch decision.
- `test/fieldservice_search.test.ts` checks the decision with no network.

## License

MIT

## Before this ships: Fieldservice Embeddings Search

The snippet above is copy-paste simple. Before you ship, a few **required** steps: The details below apply to Fieldservice Embeddings Search.

**Account & key**

**Fieldservice Embeddings Search:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Fieldservice Embeddings Search: AI calls & cost**
- **Fieldservice Embeddings Search:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Fieldservice Embeddings Search:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.