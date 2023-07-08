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
app.use(cors());
const port = 8080;

app.use(helmet());

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
	console.log(`api-server listening at http://165.232.118.212:${port}`);

	const queryData = setInterval(async () => {
		await getLocations();
		await new Promise((resolve) => setTimeout(resolve, 10 * 1000));
		await getWeather();
	}, 2 * 60 * 1000 /* 2 minutes */);
});
