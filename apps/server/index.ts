import * as trpcExpress from '@trpc/server/adapters/express';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { appRouter, getLocations, getWeather } from './src/main';

const app = express();
app.use(cors());
const port = 8080;

app.use(helmet());

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
  console.log(`api-server listening at http://localhost:${port}`);

  // const queryData = setInterval(async () => {
  //     await getLocations();
  //     await new Promise((resolve) => setTimeout(resolve, 10 * 1000));
  //     await getWeather();

  //     console.log('Updated data');
  // }, 2 * 60 * 1000 /* 2 minutes */);
});
