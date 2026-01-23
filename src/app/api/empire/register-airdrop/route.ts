import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy endpoint to register airdrop with Clanker's service
 * This keeps the Empire API key secure on the server side
 */
export async function POST(request: NextRequest) {
    const apiKey = process.env.EMPIRE_API_KEY;

    if (!apiKey) {
        return NextResponse.json(
            { error: 'Empire API key is not configured' },
            { status: 500 }
        );
    }

    try {
        const body = await request.json();

        // Validate required fields
        if (!body.tokenAddress || !body.airdropTree) {
            return NextResponse.json(
                { error: 'Missing required fields: tokenAddress, airdropTree' },
                { status: 400 }
            );
        }

        // Wait for token indexing (recommended: 5-10 seconds)
        await new Promise(resolve => setTimeout(resolve, 5000));

        const airdropResponse = await fetch('https://empirebuilder.world/api/register-clanker-airdrop', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey
            },
            body: JSON.stringify({
                tokenAddress: body.tokenAddress,
                airdropTree: body.airdropTree
            })
        });

        if (!airdropResponse.ok) {
            const errorData = await airdropResponse.json();
            console.error('Clanker airdrop registration error:', errorData);
            return NextResponse.json(
                { error: 'Failed to register airdrop', details: errorData },
                { status: airdropResponse.status }
            );
        }

        const result = await airdropResponse.json();
        return NextResponse.json(result);

    } catch (error: any) {
        console.error('Error registering airdrop:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
