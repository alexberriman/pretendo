import {
  DbRecord,
  QueryOptions,
  Relationship,
  Result,
} from "../../../types/index.js";

export type RelationshipExpander = {
  expandRelationships: (
    collection: string,
    records: DbRecord[],
    expandPaths: string[],
  ) => Result<DbRecord[], Error>;
  getRelationships: (collection: string) => Result<Relationship[], Error>;
  findRelatedRecords: (
    collection: string,
    id: string | number,
    relationship: string,
    options?: QueryOptions,
  ) => Result<DbRecord[], Error>;
};
