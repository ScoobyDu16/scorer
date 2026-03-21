import express from "express";
import cors from "cors";
import routes from "./routes";
import logger, { requestLogger, errorLogger } from "./utils/logger";
import { securityMiddleware, deviceTrackingMiddleware } from "./middleware/security.middleware";

const app = express();

// 1️⃣ Logging middleware first
app.use(requestLogger);

// 2️⃣ Security middleware
app.use(securityMiddleware);
app.use(deviceTrackingMiddleware);

// 3️⃣ Standard middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4️⃣ Routes after middleware
app.use("/api", routes);

// 5️⃣ Error handling middleware (must be last)
app.use(errorLogger);

// 6️⃣ Health check
app.get("/health", (req, res) => {
  logger.info("Health check accessed");
  res.json({ message: "Server running" });
});

// 7️⃣ 404 handler
app.use((req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ message: "Route not found" });
});

export default app;
