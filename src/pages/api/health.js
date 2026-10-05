export const prerender = false;

export function GET() {
  return new Response('{"ok":true}', {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}
