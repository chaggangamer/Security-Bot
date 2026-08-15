export async function GET() {
  return Response.json(
    { status: 'healthy', service: 'dashboard' },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
