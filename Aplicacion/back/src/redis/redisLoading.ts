import redisClient from "./redisClient.js";
import { setTimeout } from "timers/promises";

export default async function redisLoading() {

    return await intento();

}

async function intento() {
    try {
        return await redisClient.ping();
    }
    catch (err) {
        await setTimeout(1000);
        return await intento();
    }
}