import { DatabaseService } from "../../types/index.js";
import { OutputFormatter } from "../ui/formatter.js";
import { theme } from "../ui/theme.js";

export const handleStats = async (database: DatabaseService): Promise<void> => {
  // Check if database service has a getStats method
  if (!database || typeof database.getStats !== "function") {
    console.log(theme.error("Database statistics not available"));
    return;
  }
  
  console.log(OutputFormatter.formatDatabaseStats(database));
};