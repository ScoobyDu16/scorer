import express from "express";
import cors from "cors";
import routes from "./routes";
import logger, { requestLogger, errorLogger } from "./utils/logger";

const app = express();

// 1️⃣ Logging middleware first
app.use(requestLogger);

// 2️⃣ Standard middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3️⃣ Routes after middleware
app.use("/api", routes);

// 4️⃣ Error handling middleware (must be last)
app.use(errorLogger);

// 5️⃣ Health check
app.get("/health", (req, res) => {
  logger.info("Health check accessed");
  res.json({ message: "Server running" });
});

// 6️⃣ 404 handler
app.use((req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ message: "Route not found" });
});

export default app;
