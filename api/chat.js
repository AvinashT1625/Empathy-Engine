import { handleChat } from '../development.mjs';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.writeHead(405, {
      Allow: 'POST',
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    });
    response.end(JSON.stringify({ error: 'Method not allowed.' }));
    return;
  }

  await handleChat(request, response);
}
