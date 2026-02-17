import express from "express";
import cors from "cors";
import routes from "./routes";

const app = express();

// 1️⃣ Middlewares first
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2️⃣ Routes after middleware
app.use("/api", routes);

// 3️⃣ Health check
app.get("/health", (req, res) => {
  res.json({ message: "Server running" });
});

export default app;
