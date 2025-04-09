import { DatabaseService } from "../../types/index.js";
import { theme } from "../ui/theme.js";

// Reset database
export const handleReset = async (database: DatabaseService): Promise<void> => {
  console.log(theme.warning("Resetting database to initial state..."));

  const resetResult = await database.reset();

  if (resetResult.ok === false) {
    console.error(
      theme.error("Error resetting database:"),
      resetResult.error.message,
    );
    return;
  }

  console.log(theme.success("Database reset successfully"));
};

// Backup database
export const handleBackup = async (
  database: DatabaseService,
): Promise<void> => {
  if (!database || typeof database.backup !== "function") {
    console.log(theme.error("Database backup functionality not available"));
    return;
  }

  console.log(theme.info("Creating database backup..."));

  const backupResult = await database.backup();

  if (backupResult.ok === false) {
    console.error(
      theme.error("Error backing up database:"),
      backupResult.error.message,
    );
    return;
  }

  console.log(theme.success("Database backup created successfully"));
};

// Restore database
export const handleRestore = async (
  database: DatabaseService,
): Promise<void> => {
  if (!database || typeof database.restore !== "function") {
    console.log(theme.error("Database restore functionality not available"));
    return;
  }

  console.log(theme.warning("Restoring database from backup..."));

  const restoreResult = await database.restore("default");

  if (restoreResult.ok === false) {
    console.error(
      theme.error("Error restoring database:"),
      restoreResult.error.message,
    );
    return;
  }

  console.log(theme.success("Database restored successfully"));
};
