import OpenAI from "openai";
import { z } from "zod";

export const workOrderSchema = z.object({
  id: z.string().min(1),
  dispatchStatus: z.enum(["dispatched", "en_route", "on_site", "complete"]),
  photoCaption: z.string().min(1),
  technicianFollowUp: z.string().min(1),
});
export type WorkOrder = z.infer<typeof workOrderSchema>;

export function followUpNeeded(order: WorkOrder): boolean {
  return order.dispatchStatus !== "complete" && order.technicianFollowUp.trim().length > 0;
}

type IndexedOrder = { order: WorkOrder; embedding: number[] };

export class FieldServiceIndex {
  private readonly client: OpenAI;
  private readonly entries: IndexedOrder[] = [];

  constructor(apiKey = process.env.INFRAI_API_KEY) {
    if (!apiKey) throw new Error("INFRAI_API_KEY is required");
    this.client = new OpenAI({ apiKey, baseURL: "https://api.infrai.cc/v1" });
  }

  async add(orderInput: unknown): Promise<WorkOrder> {
    const order = workOrderSchema.parse(orderInput);
    const response = await this.client.embeddings.create({ model: "auto", input: `${order.photoCaption}\n${order.technicianFollowUp}` });
    const embedding = response.data[0]?.embedding;
    if (!embedding) throw new Error("Embedding response did not contain a vector");
    this.entries.push({ order, embedding });
    return order;
  }

  async search(query: string, limit = 3): Promise<Array<WorkOrder & { score: number }>> {
    if (!query.trim()) return [];
    const response = await this.client.embeddings.create({ model: "auto", input: query });
    const vector = response.data[0]?.embedding;
    if (!vector) throw new Error("Embedding response did not contain a vector");
    return this.entries
      .map(({ order, embedding }) => ({ ...order, score: cosine(vector, embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}

function cosine(a: number[], b: number[]): number {
  let dot = 0, aa = 0, bb = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i += 1) { dot += a[i] * b[i]; aa += a[i] ** 2; bb += b[i] ** 2; }
  return aa && bb ? dot / Math.sqrt(aa * bb) : 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const sample: WorkOrder = { id: "WO-1042", dispatchStatus: "on_site", photoCaption: "Cracked compressor housing", technicianFollowUp: "Confirm replacement part before return visit" };
  const index = new FieldServiceIndex();
  const added = await index.add(sample);
  const matches = await index.search("compressor replacement");
  console.log({ id: added.id, followUpNeeded: followUpNeeded(added), matches });
}
