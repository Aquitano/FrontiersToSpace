import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { useState } from 'react';
import { trpc } from '../utils/trpc';
import MapMain from './MapOverview';

/**
 * Wrapper for MapOverview to provide trpc and react-query
 *
 * @deprecated This is not used anymore, but kept for reference
 */
const MapWrapper = () => {
	const [queryClient] = useState(() => new QueryClient());
	const [trpcClient] = useState(() =>
		trpc.createClient({
			links: [
				httpBatchLink({
					url: 'http://165.232.118.212:8080/trpc',
				}),
			],
		}),
	);
	return (
		<trpc.Provider client={trpcClient} queryClient={queryClient}>
			<QueryClientProvider client={queryClient}>
				<MapMain />
			</QueryClientProvider>
		</trpc.Provider>
	);
};
export default MapWrapper;
