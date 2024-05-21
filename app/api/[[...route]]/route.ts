import { Hono } from "hono";
import { handle } from "hono/vercel";
import { env } from 'hono/adapter';
import { Redis } from "@upstash/redis/cloudflare";
import { cors } from 'hono/cors';

export const runtime = 'edge';

const app = new Hono().basePath("/api");

app.use('/*', cors());

type EnvConfig = {
    UPSTASH_REDIS_REST_URL: string
    UPSTASH_REDIS_REST_TOKEN: string
}

app.get('/search', async (c) => {
    try {
        const { UPSTASH_REDIS_REST_TOKEN, UPSTASH_REDIS_REST_URL } = env<EnvConfig>(c);

        //------------------------------------
        const start = performance.now();

        // initiate redis db
        const redis = new Redis({
            url: UPSTASH_REDIS_REST_URL,
            token: UPSTASH_REDIS_REST_TOKEN
        })

        // accessing search params from query
        //NOTE: we need to  upperces this query as we have saved data in uppercase in db
        const query = c.req.query('q')?.toUpperCase();

        if (!query) {
            return c.json({ message: "Invalid search query" }, { status: 400 });
        }

        const res = [];

        //zrank is a Redis command used to determine the rank (or index) of a member within a sorted set. The rank is the position of the member within the sorted set, with the scores ordered from the lowest to the highest. The rank is zero-based, meaning the first member has a rank of 0.
        //When you call redis.zrank("terms", query), you are asking the Redis server to find the rank of the member specified by the query variable within the sorted set identified by the key "terms". The result of this command is the rank of the specified member, which is then assigned to the rank variable.
        const rank = await redis.zrank("terms", query);


        if (rank != null && rank != undefined) {
            //zrange Command: zrange is a Redis command used to return a range of members in a sorted set, specified by their rank. The members are returned in order from the lowest to the highest rank.
            const temp = await redis.zrange<string[]>("terms", rank, rank + 300);

            for (const el of temp) {
                if (!el.startsWith(query)) {
                    break;
                }

                // push only final result in res[]
                if (el.endsWith('*')) {
                    res.push(el.substring(0, el.length - 1));
                }
            }
        }

        //---------------------------------
        const end = performance.now();

        // o/p is string array of matched results
        return c.json({
            results: res,
            duration: end - start,
        }, { status: 200 });

    } catch (error) {
        console.error(error);
        return c.json({ results: [], message: "Something went wrong." }, { status: 500 });
    }
});

export const GET = handle(app);
export const POST = handle(app);

export default app as never;