import "dotenv/config";
import http from "http";
import express from "express";
import connectDB from "./config/db.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/authroutes.js";
import assetRoutes from "./routes/assetroutes.js";
import chatRoutes from "./routes/chatroutes.js";
import paymentRoutes from "./routes/paymentroutes.js";
import webhookRoutes from "./routes/webhookroutes.js";
import planRoutes from "./routes/planroutes.js";
import { initializeSocket } from "./socket/socket.js";
import { connectRedis } from "./config/redis.js";

connectDB();
await connectRedis();

const app = express();
const server = http.createServer(app);

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.disable("x-powered-by");

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false
});

app.use(express.json({
  limit: "2mb",
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));
app.use(cookieParser());
const clientOrigin = process.env.CLIENT_URL || "http://localhost:5173";
app.use(cors({
  origin: clientOrigin,
  credentials: true
}));
app.use("/api", apiLimiter);

app.get("/", (req, res) => {
  res.json({ message: "Server is running", status: "ok" });
});

app.get("/health", (req, res) => {
  res.json({ status: "healthy" });
});

app.use("/api/auth", authRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/plans", planRoutes);

// Initialize Socket.IO
const io = initializeSocket(server);

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});