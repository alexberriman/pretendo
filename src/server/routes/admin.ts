import { Request, Response } from "express";
import { DatabaseService, ErrorResponse } from "../../types/index.js";

// Handler for POST /__reset
export const resetHandler = (db: DatabaseService) => {
  return async (req: Request, res: Response) => {
    const result = await db.reset();

    if (!result.ok) {
      const errorResponse: ErrorResponse = {
        status: 500,
        message: "Failed to reset database",
        details: result.error.message,
      };
      return res.status(500).json(errorResponse);
    }

    res.status(204).end();
  };
};

// Handler for POST /__backup
export const backupHandler = (db: DatabaseService) => {
  return async (req: Request, res: Response) => {
    const path = req.body.path;

    const result = await db.backup(path);

    if (!result.ok) {
      const errorResponse: ErrorResponse = {
        status: 500,
        message: "Failed to backup database",
        details: result.error.message,
      };
      return res.status(500).json(errorResponse);
    }

    res.json({ path: result.value });
  };
};

// Handler for POST /__restore
export const restoreHandler = (db: DatabaseService) => {
  return async (req: Request, res: Response) => {
    const path = req.body.path;

    if (!path) {
      const errorResponse: ErrorResponse = {
        status: 400,
        message: "Path parameter is required",
        code: "INVALID_REQUEST",
      };
      return res.status(400).json(errorResponse);
    }

    const result = await db.restore(path);

    if (!result.ok) {
      const errorResponse: ErrorResponse = {
        status: 500,
        message: "Failed to restore database",
        details: result.error.message,
      };
      return res.status(500).json(errorResponse);
    }

    res.status(204).end();
  };
};
