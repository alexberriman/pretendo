import { ApiConfig } from "../../types/index.js";
import Table from "cli-table3";
import { theme, formatSection } from "../ui/theme.js";

export const handleRoutes = async (config: ApiConfig): Promise<void> => {
  console.log(formatSection("API Routes"));
  
  // Create a table for each resource
  config.resources.forEach((resource) => {
    const resourceName = resource.name;
    
    console.log(theme.subheading(`\n${resourceName.toUpperCase()} Routes`));
    
    const table = new Table({
      head: [
        theme.heading("Method"),
        theme.heading("Path"),
        theme.heading("Description"),
      ],
      style: {
        head: [], // No additional style needed as we colorize the headers directly
        border: [],
      },
    });
    
    // Standard REST endpoints
    table.push(
      [theme.get("GET"), theme.text(`/${resourceName}`), theme.dimText(`List all ${resourceName}`)],
      [theme.get("GET"), theme.text(`/${resourceName}/:id`), theme.dimText(`Get a single ${resourceName}`)],
      [theme.post("POST"), theme.text(`/${resourceName}`), theme.dimText(`Create a new ${resourceName}`)],
      [theme.put("PUT"), theme.text(`/${resourceName}/:id`), theme.dimText(`Update a ${resourceName}`)],
      [theme.patch("PATCH"), theme.text(`/${resourceName}/:id`), theme.dimText(`Partially update a ${resourceName}`)],
      [theme.delete("DELETE"), theme.text(`/${resourceName}/:id`), theme.dimText(`Delete a ${resourceName}`)]
    );
    
    // Relationship endpoints
    const relationships = resource.relationships;
    if (relationships && relationships.length > 0) {
      relationships.forEach((rel) => {
        const relatedResource = rel.resource;
        if (rel.type === "hasMany" || rel.type === "belongsTo") {
          table.push([
            theme.get("GET"),
            theme.text(`/${resourceName}/:id/${relatedResource}`),
            theme.dimText(`Get related ${relatedResource}`),
          ]);
        }
      });
    }
    
    console.log(table.toString());
  });
  
  // Display special endpoints
  if (config.options?.auth?.enabled === true) {
    const authEndpoint = config.options.auth.authEndpoint || "/auth/login";
    
    console.log(theme.subheading("\nAuth Routes"));
    
    const authTable = new Table({
      head: [
        theme.heading("Method"),
        theme.heading("Path"),
        theme.heading("Description"),
      ],
      style: {
        head: [],
        border: [],
      },
    });
    
    authTable.push(
      [theme.post("POST"), theme.text(authEndpoint), theme.dimText("Login")],
      [theme.post("POST"), theme.text("/auth/logout"), theme.dimText("Logout")]
    );
    
    console.log(authTable.toString());
  }
  
  // Admin endpoints
  console.log(theme.subheading("\nAdmin Routes"));
  
  const adminTable = new Table({
    head: [
      theme.heading("Method"),
      theme.heading("Path"),
      theme.heading("Description"),
    ],
    style: {
      head: [],
      border: [],
    },
  });
  
  adminTable.push(
    [theme.post("POST"), theme.text("/__reset"), theme.dimText("Reset database to initial state")],
    [theme.post("POST"), theme.text("/__backup"), theme.dimText("Create database backup")],
    [theme.post("POST"), theme.text("/__restore"), theme.dimText("Restore from backup")]
  );
  
  console.log(adminTable.toString());
};