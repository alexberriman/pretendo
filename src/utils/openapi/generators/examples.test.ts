import { describe, it, expect } from "vitest";
import { generateExamples } from "./examples.js";
import { Resource } from "../../../types/index.js";

describe("examples", () => {
  describe("generateExamples", () => {
    it("should generate examples from initial data", () => {
      const resources: Resource[] = [
        {
          name: "users",
          fields: [
            { name: "id", type: "number" },
            { name: "name", type: "string" },
          ],
          initialData: [
            { id: 1, name: "John Doe" },
            { id: 2, name: "Jane Smith" },
          ],
        },
        {
          name: "posts",
          fields: [
            { name: "id", type: "number" },
            { name: "title", type: "string" },
          ],
          initialData: [{ id: 1, title: "First Post" }],
        },
      ];

      const result = generateExamples(resources);

      expect(result).toHaveProperty("usersExample");
      expect(result).toHaveProperty("postsExample");

      expect(result.usersExample.value).toEqual({ id: 1, name: "John Doe" });
      expect(result.postsExample.value).toEqual({ id: 1, title: "First Post" });
    });

    it("should skip resources with no initial data", () => {
      const resources: Resource[] = [
        {
          name: "users",
          fields: [
            { name: "id", type: "number" },
            { name: "name", type: "string" },
          ],
          initialData: [{ id: 1, name: "John Doe" }],
        },
        {
          name: "tags",
          fields: [
            { name: "id", type: "number" },
            { name: "name", type: "string" },
          ],
          // No initialData
        },
        {
          name: "categories",
          fields: [
            { name: "id", type: "number" },
            { name: "name", type: "string" },
          ],
          initialData: [], // Empty array
        },
      ];

      const result = generateExamples(resources);

      expect(result).toHaveProperty("usersExample");
      expect(result).not.toHaveProperty("tagsExample");
      expect(result).not.toHaveProperty("categoriesExample");
    });

    it("should return an empty object when no resources have initial data", () => {
      const resources: Resource[] = [
        {
          name: "users",
          fields: [
            { name: "id", type: "number" },
            { name: "name", type: "string" },
          ],
        },
        {
          name: "posts",
          fields: [
            { name: "id", type: "number" },
            { name: "title", type: "string" },
          ],
        },
      ];

      const result = generateExamples(resources);

      expect(Object.keys(result)).toHaveLength(0);
    });
  });
});
