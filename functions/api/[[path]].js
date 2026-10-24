/**
 * Cloudflare Pages Function for every /api/* request.
 * Reuses the Worker handler in src/worker.js, so routes and behavior match the Worker.
 * Static files (public/) are served by Pages directly and never reach this function.
 */
import worker from '../../src/worker.js';

export async function onRequest(context) {
  return worker.fetch(context.request, context.env, context);
}
