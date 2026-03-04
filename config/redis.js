import { createClient } from "redis";

export let pubclient = null;
export let subclient = null;

export const connectRedis = async () => {
    try {
        pubclient = createClient({
            url: process.env.REDIS_URL || "redis://localhost:6379",
        });

        subclient = pubclient.duplicate();

        await pubclient.connect();
        await subclient.connect();
        console.log("Connected to Redis");
        return true;
    } catch (error) {
        console.warn("Redis connection failed. Running without Redis:", error.message);
        pubclient = null;
        subclient = null;
        return false;
    }
};