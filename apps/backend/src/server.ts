import "./config/env";

import app from "./app";
import { testDbConnection } from "./db";
import logger from "./utils/logger";

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  logger.info(`Server starting on port ${PORT}`);
  await testDbConnection();
  logger.info(`Server successfully started on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { error });
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});
