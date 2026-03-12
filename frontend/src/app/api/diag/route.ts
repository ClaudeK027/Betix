import { NextResponse } from 'next/server';

export async function GET() {
    const apiKey = process.env.STRIPE_SECRET_KEY || '';
    const maskedKey = apiKey.substring(0, 7) + '...';

    return NextResponse.json({
        env: process.env.NODE_ENV,
        stripe_key_prefix: maskedKey,
        is_live_key: apiKey.startsWith('sk_live_'),
        build_timestamp: "2026-03-12 (DIAG_V2_STRIPE)",
        public_url: process.env.NEXT_PUBLIC_APP_URL || 'not set'
    });
}
