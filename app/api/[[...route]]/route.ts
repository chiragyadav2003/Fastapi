import { Hono } from "hono";
import { handle } from "hono/vercel";
import { env } from 'hono/adapter';
import { Redis } from "@upstash/redis";

export const runtime = 'edge';

const app = new Hono().basePath("/api");

type EnvConfig = {
    UPSTASH_REDIS_REST_URL: string
    UPSTASH_REDIS_REST_TOKEN: string
}

app.get('/search', (c) => {

    const { UPSTASH_REDIS_REST_TOKEN, UPSTASH_REDIS_REST_URL } = env<EnvConfig>(c);

    // initiate redis db
    const redis = new Redis({
        url: UPSTASH_REDIS_REST_URL!,
        token: UPSTASH_REDIS_REST_TOKEN!
    })

    // accessing search params from query
    const query = c.req.query('q')

    return c.json({
        message: 'Hello Next.js!',
    });
});

export const GET = handle(app);
export const POST = handle(app);

export default app as never;