import { PrismaClient } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { initTRPC } from '@trpc/server';
import { z } from 'zod';

const prisma = new PrismaClient();
prisma.$on('beforeExit', async () => {
	await prisma.$disconnect();
});

const apiKey = process.env.APRS_API_KEY;
const key = 'DL7HMX-15';

const locationSchema = z.object({
	command: z.literal('get'),
	result: z.literal('ok'),
	what: z.literal('loc'),
	found: z.number(),
	entries: z.array(
		z.object({
			class: z.literal('a'),
			name: z.literal(key),
			type: z.literal('w'),
			time: z.number().transform((str) => new Date(Number(str) * 1000)),
			lasttime: z.string().transform((str) => new Date(Number(str) * 1000)),
			lat: z.number(),
			lng: z.number(),
			//course: z.string().transform((str) => Number(str)),
			//speed: z.string().transform((str) => Number(str)),
			symbol: z.string(),
			srccall: z.string(),
			dstcall: z.string(),
			comment: z.string(),
			path: z.string(),
		}),
	),
});
type LocationSchema = z.infer<typeof locationSchema>;

const weatherSchema = z.object({
	command: z.literal('get'),
	result: z.literal('ok'),
	what: z.literal('wx'),
	found: z.number(),
	entries: z.array(
		z.object({
			name: z.literal(key),
			time: z.string().transform((str) => new Date(Number(str) * 1000)),
			temp: z.string(),
			humidity: z.string(),
		}),
	),
});
type WeatherSchema = z.infer<typeof weatherSchema>;

async function writeLog(type: string, data: LocationSchema | WeatherSchema) {
	console.log(`Writing ${type} to database`);
	await Promise.all(
		data.entries.map(async (entry) => {
			try {
				if (type === 'location') {
					const parsed = entry as LocationSchema['entries'][0];

					const existingLocation = await prisma.location.findFirst({
						where: { lasttime: parsed.lasttime },
					});

					if (!existingLocation) {
						console.log(parsed.lasttime);
						await prisma.location.create({
							data: {
								name: parsed.name,
								type: parsed.type,
								time: parsed.time,
								lasttime: parsed.lasttime,
								lat: parsed.lat,
								lng: parsed.lng,
								symbol: parsed.symbol,
								srccall: parsed.srccall,
								dstcall: parsed.dstcall,
								comment: parsed.comment,
								path: parsed.path,
							},
						});
						console.log(`Wrote location from ${parsed.time} to database`);
					}
				} else if (type === 'weather') {
					const parsed = entry as WeatherSchema['entries'][0];

					const existingWeather = await prisma.weather.findFirst({
						where: { time: parsed.time },
					});

					if (!existingWeather) {
						await prisma.weather.create({
							data: {
								name: parsed.name,
								time: parsed.time,
								temp: parsed.temp,
								humidity: parsed.humidity,
							},
						});
						console.log(`Wrote weather from ${parsed.time} to database`);
					}
				} else {
					console.log('Invalid entry' + JSON.stringify(entry));
				}
			} catch (err) {
				if (err instanceof PrismaClientKnownRequestError && err.code === 'P2002') {
					console.log(`Record with time ${entry.time} already exists`);
				} else {
					console.error(err);
				}
			}
		}),
	);
}

export async function getLocations() {
	try {
		const response = await fetch(
			`https://api.aprs.fi/api/get?name=${key}&what=loc&apikey=${apiKey}&format=json`,
		);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();

		const parsedData = locationSchema.safeParse(data);

		if (parsedData.success) {
			console.log('Getting locations');
			await writeLog('location', parsedData.data);
			return parsedData.data;
		} else {
			console.error('Data validation failed:', parsedData.error);
		}
	} catch (error) {
		console.error('Failed to fetch locations:', error);
	}

	return null;
}

export async function getWeather() {
	try {
		const response = await fetch(
			`https://api.aprs.fi/api/get?name=${key}&what=wx&apikey=${apiKey}&format=json`,
		);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();

		const parsedData = weatherSchema.safeParse(data);

		if (parsedData.success) {
			console.log('Getting weather');
			await writeLog('weather', parsedData.data);
			return parsedData.data;
		} else {
			console.error('Data validation failed:', parsedData.error);
		}
	} catch (error) {
		console.error('Failed to fetch weather:', error);
	}

	return null;
}

/* API-ENDPOINTS */
const t = initTRPC.create();
const router = t.router;

/**
 * Get the newest log of a type
 *
 * @param type The type of log to get
 */
async function getNewestLog(type: string) {
	if (type === 'location') {
		return await prisma.location.findFirst({
			orderBy: { time: 'desc' },
		});
	} else if (type === 'weather') {
		return await prisma.weather.findFirst({
			orderBy: { time: 'desc' },
		});
	}
	return null;
}

/**
 * tRPC router for the app
 * @see https://trpc.io
 */
export const appRouter = router({
	hello: t.procedure.query(() => 'Hello world!'),
	getLocation: t.procedure.query(async () => {
		return getNewestLog('location') as unknown as Promise<LocationSchema['entries'][number]>;
	}),
	getWeather: t.procedure.query(async () => {
		return getNewestLog('weather') as unknown as Promise<WeatherSchema['entries'][number]>;
	}),
	getLocations: t.procedure.query(async () => {
		return await prisma.location.findMany();
	}),
	getWeathers: t.procedure.query(async () => {
		return await prisma.weather.findMany();
	}),
});

export type AppRouter = typeof appRouter;
