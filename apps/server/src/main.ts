import { initTRPC } from '@trpc/server';
import { ensureDir, pathExists, readJson, writeJson } from 'fs-extra';
import { z } from 'zod';

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
            time: z.string().transform((str) => new Date(Number(str) * 1000)),
            lasttime: z
                .string()
                .transform((str) => new Date(Number(str) * 1000)),
            lat: z.string().transform((str) => Number(str)),
            lng: z.string().transform((str) => Number(str)),
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

async function doesLogExist(
    type: string,
    data: LocationSchema['entries'][0] | WeatherSchema['entries'][0],
) {
    const path = `./logs/${type}/${data.time.getTime()}.json`;

    if (await pathExists(path)) {
        console.log(`Log for ${data.time} at ${path} already exists`);
        return true;
    }
}

async function writeLog(type: string, data: LocationSchema | WeatherSchema) {
    if (data.entries.length !== 1) {
        console.log('Multiple entries found');
    }
    ensureDir('./logs/location');
    ensureDir('./logs/weather');

    data.entries.forEach(async (entry) => {
        if (type === 'location') {
            const parsed = data as LocationSchema;

            const path = `./logs/location/${parsed.entries[0].time.getTime()}.json`;

            if (!(await doesLogExist(type, entry))) {
                await writeJson(path, parsed);
                await writeJson('./logs/location/latest.json', parsed);
                console.log(`Wrote location to ${path}`);
            }
        } else if (type === 'weather') {
            const parsed = data as WeatherSchema;

            const path = `./logs/weather/${parsed.entries[0].time.getTime()}.json`;

            if (!(await doesLogExist(type, entry))) {
                await writeJson(path, parsed);
                await writeJson('./logs/weather/latest.json', parsed);
                console.log(
                    `Wrote weather from ${parsed.entries[0].time} to ${path}`,
                );
            }
        } else {
            console.log('Invalid entry' + entry);
        }
    });
}

export async function getLocations() {
    const data = await fetch(
        `https://api.aprs.fi/api/get?name=${key}&what=loc&apikey=${apiKey}&format=json`,
    ).then((res) => res.json());

    const parsedData = locationSchema.safeParse(data);

    if (parsedData.success) {
        console.log('Getting locations');
        writeLog('location', parsedData.data);
        return parsedData.data;
    }

    return null;
}

export async function getWeather() {
    const data = await fetch(
        `https://api.aprs.fi/api/get?name=${key}&what=wx&apikey=${apiKey}&format=json`,
    ).then((res) => res.json());

    const parsedData = weatherSchema.safeParse(data);

    if (parsedData.success) {
        console.log('Getting weather');
        writeLog('weather', parsedData.data);
        return parsedData.data;
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
    const path = `./logs/${type}/latest.json`;

    if (await pathExists(path)) {
        return await readJson(path);
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
        return getNewestLog('location');
    }),
    getWeather: t.procedure.query(async () => {
        return getNewestLog('weather');
    }),
});

export type AppRouter = typeof appRouter;
