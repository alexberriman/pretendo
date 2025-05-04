import { DbRecord, QueryFilter } from "../../../types/index.js";

/**
 * Applies a single filter to a record and determines if the record matches
 */
export const applyFilter = (record: DbRecord, filter: QueryFilter): boolean => {
  const { field, operator, value, caseSensitive = true } = filter;
  const recordValue = record[field];

  // Handle undefined or null values
  if (recordValue === undefined || recordValue === null) {
    return ["eq", "in"].includes(operator) ? false : true;
  }

  let fieldValue = recordValue;
  let compareValue = value;

  // Handle case insensitivity for string comparisons
  if (typeof fieldValue === "string" && !caseSensitive) {
    fieldValue = (fieldValue as string).toLowerCase();
    if (typeof compareValue === "string") {
      compareValue = compareValue.toLowerCase();
    } else if (Array.isArray(compareValue)) {
      compareValue = compareValue.map((v) =>
        typeof v === "string" ? v.toLowerCase() : v,
      );
    }
  }

  switch (operator) {
    case "eq":
      return fieldValue === compareValue;
    case "ne":
      return fieldValue !== compareValue;
    case "gt":
      return (
        typeof fieldValue === "number" &&
        typeof compareValue === "number" &&
        fieldValue > compareValue
      );
    case "gte":
      return (
        typeof fieldValue === "number" &&
        typeof compareValue === "number" &&
        fieldValue >= compareValue
      );
    case "lt":
      return (
        typeof fieldValue === "number" &&
        typeof compareValue === "number" &&
        fieldValue < compareValue
      );
    case "lte":
      return (
        typeof fieldValue === "number" &&
        typeof compareValue === "number" &&
        fieldValue <= compareValue
      );
    case "in":
      return Array.isArray(compareValue) && compareValue.includes(fieldValue);
    case "nin":
      return Array.isArray(compareValue) && !compareValue.includes(fieldValue);
    case "contains":
      return (
        typeof fieldValue === "string" &&
        typeof compareValue === "string" &&
        fieldValue.includes(compareValue)
      );
    case "startsWith":
      return (
        typeof fieldValue === "string" &&
        typeof compareValue === "string" &&
        fieldValue.startsWith(compareValue)
      );
    case "endsWith":
      return (
        typeof fieldValue === "string" &&
        typeof compareValue === "string" &&
        fieldValue.endsWith(compareValue)
      );
    default:
      return false;
  }
};
