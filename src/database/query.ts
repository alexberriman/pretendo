import { QueryFilter, QueryOptions, QuerySort } from "../types/index.js";

// Parse query string parameters into QueryOptions
export const parseQueryOptions = (
  queryParams: Record<string, string | string[] | undefined>,
): QueryOptions => {
  const options: QueryOptions = {};

  // Parse pagination
  const page = queryParams.page
    ? parseInt(queryParams.page as string, 10)
    : undefined;
  const perPage = queryParams.perPage
    ? parseInt(queryParams.perPage as string, 10)
    : undefined;

  if (page !== undefined && !isNaN(page)) {
    options.page = Math.max(1, page); // Ensure minimum of 1
  }

  if (perPage !== undefined && !isNaN(perPage)) {
    options.perPage = Math.max(1, perPage); // Ensure minimum of 1
  }

  // Parse sorting
  if (queryParams.sortBy) {
    const sortParams = Array.isArray(queryParams.sortBy)
      ? queryParams.sortBy
      : [queryParams.sortBy];

    const sort: QuerySort[] = [];

    sortParams.forEach((param) => {
      const parts = param.split(",");

      parts.forEach((part) => {
        // Check for specified order with dot notation (e.g., name.asc, price.desc)
        if (part.includes(".")) {
          const [field, order] = part.split(".");
          if (field && (order === "asc" || order === "desc")) {
            sort.push({ field, order });
          }
        } else {
          // Default to ascending order if not specified
          sort.push({ field: part, order: "asc" });
        }
      });
    });

    if (sort.length > 0) {
      options.sort = sort;
    }
  }

  // Parse field selection
  if (queryParams.fields) {
    const fields = Array.isArray(queryParams.fields)
      ? queryParams.fields.flatMap((f) => f.split(","))
      : queryParams.fields.split(",");

    options.fields = fields.map((f) => f.trim()).filter(Boolean);
  }

  // Parse expand (relationships)
  if (queryParams.expand) {
    const expand = Array.isArray(queryParams.expand)
      ? queryParams.expand.flatMap((e) => e.split(","))
      : queryParams.expand.split(",");

    options.expand = expand.map((e) => e.trim()).filter(Boolean);
  }

  // Parse filters
  const filters: QueryFilter[] = [];

  for (const [key, value] of Object.entries(queryParams)) {
    if (
      !value ||
      ["page", "perPage", "sortBy", "fields", "expand"].includes(key)
    ) {
      continue;
    }

    // Check if filter uses bracket notation (e.g., age[gt]=30)
    if (key.includes("[") && key.includes("]")) {
      const matches = key.match(/^([^[]+)\[([^\]]+)\]$/);

      if (matches && matches.length === 3) {
        const [_, field, operator] = matches;

        const validOperators = [
          "eq",
          "ne",
          "gt",
          "gte",
          "lt",
          "lte",
          "in",
          "nin",
          "contains",
          "startsWith",
          "endsWith",
        ];

        if (validOperators.includes(operator)) {
          let filterValue = value;

          // Handle comma-separated values for 'in' and 'nin' operators
          if (
            (operator === "in" || operator === "nin") &&
            typeof filterValue === "string"
          ) {
            filterValue = filterValue.split(",").map((v) => {
              // Try to convert to number if possible
              const num = Number(v);
              return !isNaN(num) ? num : v.trim();
            }) as unknown as string[];
          } else if (typeof filterValue === "string") {
            // Try to convert to number if possible
            const num = Number(filterValue);
            filterValue = !isNaN(num)
              ? (num as unknown as string)
              : filterValue;
          }

          // Check for case insensitivity marker
          const caseSensitive = !field.startsWith("i:");
          const actualField = caseSensitive ? field : field.substring(2);

          filters.push({
            field: actualField,
            operator: operator as QueryFilter["operator"],
            value: filterValue,
            caseSensitive,
          });
        }
      }
    } else {
      // Simple equality filter (e.g., name=John)
      filters.push({
        field: key,
        operator: "eq",
        value,
        caseSensitive: true,
      });
    }
  }

  if (filters.length > 0) {
    options.filters = filters;
  }

  return options;
};
