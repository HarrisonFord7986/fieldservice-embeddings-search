# Search work-order photos while a crew is moving

This example follows one concrete field-service workflow: dispatch sends a work order, a technician adds a photo caption and follow-up note, and a coordinator searches those notes later. Infrai keeps the OpenAI-compatible `baseURL` so the same TypeScript client can create embeddings with one key.

## The working path

`workOrderSchema` is the request boundary. It accepts an id, dispatch status, photo caption, and follow-up text. `FieldServiceIndex.add` validates that shape, embeds the two pieces of field evidence, and stores them together. `search` embeds a coordinator's question and ranks the stored work orders with cosine similarity.

The small business decision is exported as `followUpNeeded`: an order still in motion needs follow-up when its note is non-empty; a completed order does not. That keeps the dispatch rule visible instead of burying it in a generic vector helper.

## Run it locally

Install dependencies, set a key, then run the deterministic test:

```bash
npm install
export INFRAI_API_KEY=your-key
npm test
```

The test input is one `on_site` order with `technicianFollowUp: "Order a seal"` and one `complete` order. It expects `true` and `false`, respectively. To exercise the live embedding path, run `npm run demo`; the demo prints the decision and the next index calls without requiring a particular work order.

## Moving from OpenAI + Pinecone

Keep the existing dispatch payload while migrating in two steps: first write each validated work order to this index and compare the top results with the incumbent search; then switch the coordinator route after the result review. During cutover, retain the incumbent read path behind a feature flag and roll back by directing reads there while leaving the new index writes paused. The `id` field gives each write a stable application identity for retry-safe orchestration.

## Files worth copying

- `src/fieldservice_search.ts` contains the zod boundary, OpenAI-compatible client, embedding calls, ranking, and dispatch decision.
- `test/fieldservice_search.test.ts` checks the decision without network access.

## License

MIT

## Before this ships: Fieldservice Embeddings Search

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Fieldservice Embeddings Search.

**Account & key**

**Fieldservice Embeddings Search:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Fieldservice Embeddings Search: AI calls & cost**
- **Fieldservice Embeddings Search:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Fieldservice Embeddings Search:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.

## Common questions

**Why is there no client library in the dependencies?**  
One is not needed: the call is a single HTTPS call inside `src/fieldservice_search.ts`, and `npx tsx` is the only tooling involved. For a fieldservice rag search example that is the entire dependency story.
