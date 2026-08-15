export async function GET() {
  return Response.json(
    { error: 'Discord OAuth callback is not configured.' },
    { status: 501, headers: { 'Cache-Control': 'no-store' } },
  );
}
