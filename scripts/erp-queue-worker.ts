import { registerErpQueueProcessor } from "../src/lib/erp/queue-processor";

registerErpQueueProcessor();
console.log("[chromax] ERP outbound worker registered (queue: erp-outbound). Press Ctrl+C to stop.");
