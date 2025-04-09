import { Server } from "../../types/index.js";
import { theme, formatSection } from "../ui/theme.js";
import http from "http";
import https from "https";
// We're not using the url module directly, but keeping it for future use
import _url from "url";

export const handleRequest = async (
  args: string[],
  server: Server,
): Promise<void> => {
  if (!args || args.length < 2) {
    console.log(
      theme.error("Invalid request format. Usage:"),
      theme.text("request [METHOD] [PATH] [BODY]"),
    );
    console.log(theme.dimText("Example: request GET /users"));
    console.log(
      theme.dimText(
        'Example: request POST /users \'{"name":"John","email":"john@example.com"}\'',
      ),
    );
    return;
  }

  const method = args[0].toUpperCase();
  const path = args[1];
  const body = args.length > 2 ? args.slice(2).join(" ") : undefined;

  // Check if method is valid
  const validMethods = ["GET", "POST", "PUT", "PATCH", "DELETE"];
  if (!validMethods.includes(method)) {
    console.log(
      theme.error(
        `Invalid method: ${method}. Valid methods are: ${validMethods.join(", ")}`,
      ),
    );
    return;
  }

  // Get server URL
  const serverUrl = server.getUrl();
  if (!serverUrl) {
    console.log(theme.error("Server URL not available"));
    return;
  }

  // Make the request
  try {
    console.log(theme.info(`Making ${method} request to ${path}...`));

    const response = await makeRequest(serverUrl, path, method, body);

    // Format and display the response
    console.log(formatSection("Response"));
    console.log(
      theme.dimText(`Status: ${response.statusCode} ${response.statusMessage}`),
    );
    console.log(theme.dimText("Headers:"));

    Object.entries(response.headers).forEach(([key, value]) => {
      console.log(`  ${theme.dimText(key)}: ${theme.text(String(value))}`);
    });

    console.log(theme.dimText("Body:"));

    // Try to parse and pretty-print JSON
    try {
      const parsed = JSON.parse(response.body);
      console.log(JSON.stringify(parsed, null, 2));
    } catch {
      // If not JSON, just print raw body
      console.log(response.body);
    }
  } catch (error) {
    console.error(
      theme.error("Error making request:"),
      error instanceof Error ? error.message : String(error),
    );
  }
};

interface Response {
  statusCode: number;
  statusMessage: string;
  headers: Record<string, string | string[] | undefined>;
  body: string;
}

// Helper function to make HTTP requests
const makeRequest = (
  serverUrl: string,
  path: string,
  method: string,
  body?: string,
): Promise<Response> => {
  return new Promise((resolve, reject) => {
    try {
      // Parse the server URL
      const parsedUrl = new URL(path, serverUrl);

      // Determine if we need http or https
      const client = parsedUrl.protocol === "https:" ? https : http;

      const options: {
        hostname: string;
        port: string;
        path: string;
        method: string;
        headers: Record<string, string | number>;
      } = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname + parsedUrl.search,
        method: method,
        headers: {
          Accept: "application/json",
        },
      };

      // Add content-type and content-length headers if body is provided
      if (body) {
        options.headers = {
          ...options.headers,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        };
      }

      const req = client.request(options, (res) => {
        let responseBody = "";

        res.on("data", (chunk) => {
          responseBody += chunk;
        });

        res.on("end", () => {
          resolve({
            statusCode: res.statusCode || 0,
            statusMessage: res.statusMessage || "",
            headers: res.headers || {},
            body: responseBody,
          });
        });
      });

      req.on("error", (error) => {
        reject(error);
      });

      // Write request body if provided
      if (body) {
        req.write(body);
      }

      req.end();
    } catch (error) {
      reject(error);
    }
  });
};
