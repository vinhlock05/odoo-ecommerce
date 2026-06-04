import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const odooUrl =
    process.env.ODOO_INTERNAL_URL ??
    process.env.NEXT_PUBLIC_ODOO_URL ??
    'http://localhost:8069'

  const checks: Record<string, string> = {}
  let overall: 'ok' | 'degraded' = 'ok'

  // Check Odoo API reachability
  try {
    const res = await fetch(`${odooUrl}/fashionos/api/v1/health`, {
      signal: AbortSignal.timeout(3000),
      cache: 'no-store',
    })
    checks['odoo'] = res.ok ? 'ok' : `http_${res.status}`
    if (!res.ok) overall = 'degraded'
  } catch {
    checks['odoo'] = 'unreachable'
    overall = 'degraded'
  }

  return NextResponse.json(
    {
      status: overall,
      service: 'FashionOS Web',
      timestamp: Date.now(),
      checks,
    },
    { status: overall === 'ok' ? 200 : 503 },
  )
}
