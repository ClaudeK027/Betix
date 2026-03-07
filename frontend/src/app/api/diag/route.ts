import { NextResponse } from 'next/server';

export async function GET() {
    const apiKey = process.env.MOLLIE_API_KEY || '';
    const maskedKey = apiKey.substring(0, 7) + '...';

    return NextResponse.json({
        env: process.env.NODE_ENV,
        mollie_key_prefix: maskedKey,
        is_test_key: apiKey.startsWith('test_'),
        build_timestamp: "2026-03-07 14:47 (DIAG_V1)",
        public_url: process.env.NEXT_PUBLIC_APP_URL || 'not set'
    });
}
