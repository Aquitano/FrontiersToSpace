import type { AppRouter } from '@/server/router';
import { createTRPCReact } from '@trpc/react-query';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';

/**
 * Inference helper for inputs.
 *
 * @example type HelloInput = RouterInputs['example']['hello']
 * @deprecated tRPC no longer in use
 */
export type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helper for outputs.
 *
 * @example type HelloOutput = RouterOutputs['example']['hello']
 * @deprecated tRPC no longer in use
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>;

/**
 * tRPC client for the web app
 *
 * @deprecated tRPC no longer in use
 * @see https://trpc.io/docs/client/react
 */
export const trpc = createTRPCReact<AppRouter>();
