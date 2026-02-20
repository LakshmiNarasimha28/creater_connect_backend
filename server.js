import "dotenv/config";
// import dotenv from "dotenv";
// dotenv.config();
import http from "http";
import express from "express";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoutes from "./routes/authroutes.js";
import assetRoutes from "./routes/assetroutes.js";
// import { registerSocketHandlers } from "./sockets/sockets.js";

const PORT = process.env.PORT || 8000;

connectDB();

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    secure: true,
    credentials: true,
  },
});

app.use(authRoutes);
app.use(assetRoutes);
// registerSocketHandlers(io);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});