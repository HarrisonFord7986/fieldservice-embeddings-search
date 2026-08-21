import assert from "node:assert/strict";
import { followUpNeeded, workOrderSchema } from "../src/fieldservice_search.js";

const open = workOrderSchema.parse({ id: "WO-1", dispatchStatus: "on_site", photoCaption: "Leaking valve", technicianFollowUp: "Order a seal" });
const closed = workOrderSchema.parse({ id: "WO-2", dispatchStatus: "complete", photoCaption: "Repaired valve", technicianFollowUp: "Archive photos" });
assert.equal(followUpNeeded(open), true);
assert.equal(followUpNeeded(closed), false);
console.log("follow-up decision passes for active and complete work orders");
