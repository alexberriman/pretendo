import { describe, it, expect, vi, beforeEach } from "vitest";
import { createStore } from "./store.js";
import { ApiConfig, DbRecord } from "../types/index.js";

// Create mock functions
const mockGetData = vi.fn((data, collection) => {
  if (collection) {
    if (!data[collection]) {
      data[collection] = [];
    }
    return { ok: true, value: data[collection] };
  }
  return data;
});

const mockGetCollection = vi.fn((data, name) => {
  if (!data[name]) {
    data[name] = [];
  }
  return { ok: true, value: data[name] };
});

const mockGetRecord = vi.fn((data, collection, id, primaryKey) => {
  if (!data[collection]) {
    data[collection] = [];
  }
  const record = data[collection].find((r) => r[primaryKey || "id"] === id);
  return { ok: true, value: record || null };
});

const mockSetRecord = vi.fn((data, collection, record, primaryKey) => {
  if (!data[collection]) {
    data[collection] = [];
  }
  const pk = primaryKey || "id";
  if (!record[pk]) {
    record[pk] = 1;
  }
  const index = data[collection].findIndex((r) => r[pk] === record[pk]);
  if (index >= 0) {
    data[collection][index] = { ...record };
  } else {
    data[collection].push({ ...record });
  }
  return { ok: true, value: { ...record } };
});

const mockAddRecord = vi.fn((data, collection, record, primaryKey) => {
  if (!data[collection]) {
    data[collection] = [];
  }
  const pk = primaryKey || "id";
  if (!record[pk]) {
    record[pk] = 1;
  }
  data[collection].push({ ...record });
  return { ok: true, value: { ...record } };
});

const mockUpdateRecord = vi.fn(
  (data, collection, id, updateData, primaryKey, merge) => {
    if (!data[collection]) {
      data[collection] = [];
      return { ok: true, value: null };
    }
    const pk = primaryKey || "id";
    const index = data[collection].findIndex((r) => r[pk] === id);
    if (index < 0) {
      return { ok: true, value: null };
    }
    const currentRecord = data[collection][index];
    const updatedRecord = merge
      ? { ...currentRecord, ...updateData, [pk]: id }
      : { ...updateData, [pk]: id };
    data[collection][index] = updatedRecord;
    return { ok: true, value: { ...updatedRecord } };
  },
);

const mockDeleteRecord = vi.fn((data, collection, id, primaryKey) => {
  if (!data[collection]) {
    data[collection] = [];
    return { ok: true, value: false };
  }
  const pk = primaryKey || "id";
  const index = data[collection].findIndex((r) => r[pk] === id);
  if (index < 0) {
    return { ok: true, value: false };
  }
  data[collection].splice(index, 1);
  return { ok: true, value: true };
});

const mockFindRelated = vi.fn(
  (data, collection, id, relatedCollection, foreignKey) => {
    if (!data[collection] || !data[relatedCollection]) {
      return { ok: true, value: [] };
    }
    const relatedRecords = data[relatedCollection].filter(
      (r) => r[foreignKey] === id,
    );
    return { ok: true, value: relatedRecords };
  },
);

const mockQuery = vi.fn((data, collection, options) => {
  if (!data[collection]) {
    data[collection] = [];
  }
  return { ok: true, value: [...data[collection]] };
});

const mockResetStore = vi.fn(() => {
  return { ok: true, value: undefined };
});

const mockGetPrimaryKey = vi.fn((collection) =>
  collection === "orders" ? "orderId" : "id",
);

// Mock utility functions to avoid dependency on actual implementation
vi.mock("./utils/index.js", () => ({
  getData: (data, collection) => mockGetData(data, collection),
  getCollection: (data, name) => mockGetCollection(data, name),
  getRecord: (data, collection, id, primaryKey) =>
    mockGetRecord(data, collection, id, primaryKey),
  setRecord: (data, collection, record, primaryKey) =>
    mockSetRecord(data, collection, record, primaryKey),
  addRecord: (data, collection, record, primaryKey) =>
    mockAddRecord(data, collection, record, primaryKey),
  updateRecord: (data, collection, id, updateData, primaryKey, merge) =>
    mockUpdateRecord(data, collection, id, updateData, primaryKey, merge),
  deleteRecord: (data, collection, id, primaryKey, cascadeRelationships) =>
    mockDeleteRecord(data, collection, id, primaryKey),
  findRelated: (
    data,
    collection,
    id,
    relatedCollection,
    foreignKey,
    queryOptions,
    primaryKey,
  ) => mockFindRelated(data, collection, id, relatedCollection, foreignKey),
  query: (data, collection, options) => mockQuery(data, collection, options),
  resetStore: (newData) => mockResetStore(newData),
  applyFilters: vi.fn(),
  applySorting: vi.fn(),
  applyPagination: vi.fn(),
  selectFields: vi.fn(),
  getPrimaryKey: (collection) => mockGetPrimaryKey(collection),
  generateId: vi.fn(),
}));

describe("createStore", () => {
  let mockApiConfig: ApiConfig;

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Set up a mock API config for testing
    mockApiConfig = {
      resources: [
        { name: "users", primaryKey: "id" },
        { name: "products", primaryKey: "id" },
        { name: "orders", primaryKey: "orderId" },
      ],
      data: {
        users: [
          { id: 1, name: "User 1" },
          { id: 2, name: "User 2" },
        ],
        products: [
          { id: 1, name: "Product 1", price: 10 },
          { id: 2, name: "Product 2", price: 20 },
        ],
      },
    } as unknown as ApiConfig;
  });

  it("should initialize collections from resources", () => {
    const store = createStore(mockApiConfig);

    // Test that initializes collections from resources
    const data = store.getData() as Record<string, DbRecord[]>;
    expect(data).toHaveProperty("users");
    expect(data).toHaveProperty("products");
    expect(data).toHaveProperty("orders");
  });

  it("should load initial data if provided", () => {
    const store = createStore(mockApiConfig);

    // Use getData to verify data was loaded
    store.getData("users");
    expect(mockGetData).toHaveBeenCalled();

    // Use getCollection to get a specific collection
    store.getCollection("products");
    expect(mockGetCollection).toHaveBeenCalledWith(
      expect.anything(),
      "products",
    );
  });

  it("should use the correct primary key for each collection", () => {
    const store = createStore(mockApiConfig);

    // Test that it uses the correct primary key
    store.getRecord("orders", "ord-1");
    expect(mockGetRecord).toHaveBeenCalledWith(
      expect.anything(),
      "orders",
      "ord-1",
      "orderId",
    );
  });

  it("should provide access to all store operations", () => {
    const store = createStore(mockApiConfig);

    // Verify that all expected methods exist
    expect(store).toHaveProperty("getData");
    expect(store).toHaveProperty("getCollection");
    expect(store).toHaveProperty("getRecord");
    expect(store).toHaveProperty("setRecord");
    expect(store).toHaveProperty("addRecord");
    expect(store).toHaveProperty("updateRecord");
    expect(store).toHaveProperty("deleteRecord");
    expect(store).toHaveProperty("findRelated");
    expect(store).toHaveProperty("query");
    expect(store).toHaveProperty("reset");
  });

  it("should call the appropriate utility functions", () => {
    const store = createStore(mockApiConfig);

    // Test getData
    store.getData("users");
    expect(mockGetData).toHaveBeenCalledWith(expect.anything(), "users");

    // Test getRecord
    store.getRecord("users", 1);
    expect(mockGetRecord).toHaveBeenCalledWith(
      expect.anything(),
      "users",
      1,
      "id",
    );

    // Test setRecord
    const record = { id: 1, name: "Updated User" };
    store.setRecord("users", record);
    expect(mockSetRecord).toHaveBeenCalledWith(
      expect.anything(),
      "users",
      record,
      "id",
    );

    // Test addRecord
    const newRecord = { name: "New User" };
    store.addRecord("users", newRecord);
    expect(mockAddRecord).toHaveBeenCalledWith(
      expect.anything(),
      "users",
      newRecord,
      "id",
    );

    // Test updateRecord
    const updateData = { name: "Updated Name" };
    store.updateRecord("users", 1, updateData);
    expect(mockUpdateRecord).toHaveBeenCalledWith(
      expect.anything(),
      "users",
      1,
      updateData,
      "id",
      undefined,
    );

    // Test deleteRecord
    store.deleteRecord("users", 1);
    expect(mockDeleteRecord).toHaveBeenCalledWith(
      expect.anything(),
      "users",
      1,
      "id",
    );

    // Test findRelated
    store.findRelated("users", 1, "orders", "userId");
    expect(mockFindRelated).toHaveBeenCalledWith(
      expect.anything(),
      "users",
      1,
      "orders",
      "userId",
    );

    // Test query
    const queryOptions = {
      filters: [{ field: "name", operator: "contains", value: "User" }],
    };
    store.query("users", queryOptions);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.anything(),
      "users",
      queryOptions,
    );

    // Test reset
    const newData = { users: [{ id: 3, name: "User 3" }] };
    store.reset(newData);
    expect(mockResetStore).toHaveBeenCalledWith(newData);
  });
});
