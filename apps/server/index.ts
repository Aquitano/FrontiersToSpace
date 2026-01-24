import * as trpcExpress from '@trpc/server/adapters/express';
import cors from 'cors';
import express, { type Request, type Response } from 'express';
import helmet from 'helmet';
import { z } from 'zod';
import { appRouter, getLocations, getWeather, writeFullLogs } from './src/main';

const PostInputSchema = z.object({
    call: z.string(),
    lat: z.number(),
    lon: z.number(),
    alt: z.number(),
    temp: z.string(),
    humi: z.string(),
    pres: z.string(),
    alt_max: z.string(),
    count: z.string(),
    rate: z.string(),
    ozone_ppb: z.string(),
    ozone_ppm: z.string(),
});
export type InputSchema = z.infer<typeof PostInputSchema>;

const app = express();
const port = process.env.PORT || 8080;
const host = process.env.HOST || '0.0.0.0';

app.use(helmet());

app.use(express.json());

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'https://space.thomasbreindl.me',
    'http://localhost:4321',
    'http://localhost:3000',
];

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin) {
                callback(null, true);
                return;
            }
            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
    }),
);

app.post('/', (req: Request, res: Response) => {
    try {
        // Validate the data against the schema
        const data = PostInputSchema.parse(req.body);

        // Process the data
        writeFullLogs(data);

        res.status(200).send('Data received');
    } catch (error) {
        res.status(400).send('Invalid data');
    }
});

app.use(
    '/trpc',
    trpcExpress.createExpressMiddleware({
        router: appRouter,
        createContext() {
            return {};
        },
    }),
);

app.get('/', (req, res) => {
    res.send('Hello from api-server');
});

app.listen(port, () => {
    console.log(`api-server listening on port ${port}`);

    setInterval(
        async () => {
            await getLocations();
            await new Promise((resolve) => setTimeout(resolve, 10 * 1000));
            await getWeather();
        },
        2 * 60 * 1000 /* 2 minutes */,
    );
});
