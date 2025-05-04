// This file is a facade over the refactored relationship code
import {
  RelationshipExpander,
  createRelationshipExpander,
} from "./service/relationship/index.js";

// Re-export the types
export type { RelationshipExpander };

// Re-export the factory function
export { createRelationshipExpander };
