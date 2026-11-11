// Retired: no anonymous phone login or arbitrary/test messaging authority.
export async function GET() { return Response.json({error:'This endpoint is unavailable.'},{status:410,headers:{'Cache-Control':'no-store'}}) }
