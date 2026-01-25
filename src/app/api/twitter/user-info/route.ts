import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const twitterUsername = searchParams.get("username");

        if (!twitterUsername) {
            return NextResponse.json(
                { error: "username query parameter is required" },
                { status: 400 }
            );
        }

        const apiKey = process.env.TWITTER_API_KEY;
        if (!apiKey) {
            console.error("TWITTER_API_KEY is not configured");
            return NextResponse.json(
                { error: "Twitter API key not configured" },
                { status: 500 }
            );
        }

        const response = await fetch(
            `https://api.twitterapi.io/twitter/user/info`,
            {
                method: "GET",
                headers: {
                    "X-API-Key": apiKey,
                },
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Twitter API error:", errorText);
            return NextResponse.json(
                { error: "Failed to fetch user info from Twitter API" },
                { status: response.status }
            );
        }

        const data = await response.json();

        return NextResponse.json({ status: "success", data });
    } catch (error: any) {
        console.error("Error fetching Twitter user info:", error);
        return NextResponse.json(
            {
                error: "Failed to fetch Twitter user info",
                details: error.message || "Unknown error",
            },
            { status: 500 }
        );
    }
}
