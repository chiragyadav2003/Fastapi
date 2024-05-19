import { Hono } from "hono";
import { handle } from "hono/vercel";

export const runtime = 'edge';

const app = new Hono().basePath("/api");

app.get('/search', (c) => {
    return c.json({
        message: 'Hello Next.js!',
    });
});

export const GET = handle(app);
export const POST = handle(app);

export default app as never;