import "dotenv/config";
// import dotenv from "dotenv";
// dotenv.config();
import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import connectDB from "./config/db.js";
import cookieParser from "cookie-parser";
// import { registerSocketHandlers } from "./sockets/sockets.js";

const PORT = process.env.PORT || 8000;

connectDB();

const app = express();

app.use(express.json());
app.use(cookieParser());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

registerSocketHandlers(io);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});