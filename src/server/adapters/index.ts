// Re-export types
export type {
  ServerAdapter,
  ServerRequest,
  ServerResponse,
  ServerNextFunction,
  RequestHandler,
  RouterConfigurator,
} from "./server-adapter.js";

// Re-export values/classes
export { BaseServerAdapter, HookEvent } from "./server-adapter.js";

export { ExpressAdapter } from "./express-adapter.js";

import { ServerAdapter } from "./server-adapter.js";
import { ExpressAdapter } from "./express-adapter.js";

/**
 * Factory function to create a server adapter
 * @param adapterType The type of adapter to create (defaults to "express")
 * @returns A ServerAdapter instance
 */
export function createServerAdapter(adapterType = "express"): ServerAdapter {
  switch (adapterType.toLowerCase()) {
    case "express":
      return new ExpressAdapter();
    default:
      throw new Error(`Unsupported server adapter type: ${adapterType}`);
  }
}
