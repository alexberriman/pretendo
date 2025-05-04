import { DbRecord, ResourceField } from "../../../types/index.js";
import { v4 as uuidv4 } from "uuid";
import { createHash } from "crypto";

/**
 * Special field processing mode
 */
export enum SpecialFieldMode {
  // Process field on insert (default)
  INSERT = "insert",
  // Process field on update
  UPDATE = "update",
  // Process field on both insert and update
  ALWAYS = "always",
}

/**
 * Process a $now special field value
 * Returns the current date/time
 */
export const processNowField = (): Date => {
  return new Date();
};

/**
 * Process a $uuid special field value
 * Returns a random UUID (v4)
 */
export const processUuidField = (): string => {
  return uuidv4();
};

/**
 * Process a $userId special field value
 * Returns the user ID from the current context or null if not available
 */
export const processUserIdField = (
  userId?: number | string,
): number | string | null => {
  return userId ?? null;
};

/**
 * Process a $increment special field value
 * Auto-increments a numeric field based on existing values
 */
export const processIncrementField = (
  records: DbRecord[],
  fieldName: string,
): number => {
  if (!records || records.length === 0) {
    return 1;
  }

  // Find maximum value of this field and increment
  const maxValue = Math.max(
    ...records
      .map((record) => {
        const value = record[fieldName];
        return typeof value === "number" ? value : 0;
      })
      .filter((value) => typeof value === "number"),
  );

  return maxValue + 1;
};

/**
 * Process a $hash special field value
 * Hashes another field's value using SHA-256 (or other algorithm in the future)
 */
export const processHashField = (value: string): string => {
  if (!value) {
    return "";
  }

  return createHash("sha256").update(value).digest("hex");
};

/**
 * Process special field values in a record based on the resource schema
 */
export const processSpecialFields = (
  data: DbRecord,
  resourceFields: ResourceField[],
  existingRecords: DbRecord[] = [],
  mode: SpecialFieldMode = SpecialFieldMode.INSERT,
  userId?: number | string,
): DbRecord => {
  const result = { ...data };

  for (const field of resourceFields) {
    // Skip fields that already have values, unless they should always be processed
    if (result[field.name] !== undefined && mode !== SpecialFieldMode.ALWAYS) {
      continue;
    }

    // Process default values (both simple values and special fields)
    if (field.defaultValue !== undefined) {
      const defaultValue = field.defaultValue;

      // Only apply default values on insert, unless mode is specified differently
      const shouldApplyDefault =
        (mode === SpecialFieldMode.INSERT &&
          result[field.name] === undefined) ||
        mode === SpecialFieldMode.ALWAYS;

      if (!shouldApplyDefault) {
        continue;
      }

      // Process special field values
      if (typeof defaultValue === "string") {
        switch (defaultValue) {
          case "$now":
            result[field.name] = processNowField();
            break;
          case "$uuid":
            result[field.name] = processUuidField();
            break;
          case "$userId":
            result[field.name] = processUserIdField(userId);
            break;
          case "$increment":
            result[field.name] = processIncrementField(
              existingRecords,
              field.name,
            );
            break;
          default:
            // Regular default value, use as is
            result[field.name] = defaultValue;
        }
      } else {
        // Non-string default value, use as is
        result[field.name] = defaultValue;
      }
    }
  }

  return result;
};

/**
 * Process special fields for record updates
 */
export const processSpecialFieldsForUpdate = (
  data: DbRecord,
  resourceFields: ResourceField[],
  existingRecords: DbRecord[] = [],
  userId?: number | string,
): DbRecord => {
  const result = { ...data };

  // Always update updatedAt fields on updates if they exist in the schema
  const updatedAtField = resourceFields.find(
    (field) => field.name === "updatedAt" && field.defaultValue === "$now",
  );

  if (updatedAtField) {
    result.updatedAt = processNowField();
  }

  return processSpecialFields(
    result,
    resourceFields,
    existingRecords,
    SpecialFieldMode.UPDATE,
    userId,
  );
};

/**
 * Process $hash field for passwords or other sensitive data
 * Identifies fields that need to be hashed based on their value or field name
 */
export const processHashFields = (
  data: DbRecord,
  resourceFields: ResourceField[],
): DbRecord => {
  const result = { ...data };

  for (const field of resourceFields) {
    const fieldValue = result[field.name];

    // Check if field has a special hash value
    if (field.defaultValue === "$hash") {
      const valueToHash = fieldValue;
      if (valueToHash !== undefined && typeof valueToHash === "string") {
        result[field.name] = processHashField(valueToHash);
      }
    }

    // Check if a field with a value should be hashed (e.g., "password" field update)
    if (
      field.name.toLowerCase().includes("password") &&
      fieldValue !== undefined &&
      typeof fieldValue === "string"
    ) {
      // Don't hash values that are already hashed (simple check - not foolproof)
      const looksLikeHash = /^[a-f0-9]{40,128}$/i.test(fieldValue);
      if (!looksLikeHash) {
        result[field.name] = processHashField(fieldValue);
      } else {
        // If it already looks like a hash, keep the original value
        result[field.name] = fieldValue;
      }
    }
  }

  return result;
};
