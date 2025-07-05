import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { code, state, wallet_address } = await req.json();

    if (!code || !state || !wallet_address) {
      return NextResponse.json(
        { error: "Missing required parameters: code, state, or wallet_address" },
        { status: 400 }
      );
    }

    // Verify state parameter contains wallet address
    if (!state.startsWith(wallet_address)) {
      return NextResponse.json(
        { error: "Invalid state parameter" },
        { status: 400 }
      );
    }

    const fastifyUrl = process.env.FASTIFY_SERVER_URL || 'http://localhost:3001';

    // Step 1: Exchange code for access token
    const tokenResponse = await fetch(`${fastifyUrl}/api/whoop/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code
      })
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      throw new Error(errorData.details || `Token exchange failed: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.data.access_token;

    // Step 2: Authenticate and store data using the access token
    const storeResponse = await fetch(`${fastifyUrl}/api/whoop/authenticate-and-store`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accessToken,
        walletAddress: wallet_address,
        limit: 25
      })
    });

    if (!storeResponse.ok) {
      const errorData = await storeResponse.json();
      throw new Error(errorData.details || `Data storage failed: ${storeResponse.status}`);
    }

    const storeData = await storeResponse.json();
    
    return NextResponse.json({
      status: "success",
      message: "Whoop account connected and data stored successfully",
      data: storeData.data
    });

  } catch (error) {
    console.error("Whoop callback error:", error);
    return NextResponse.json(
      { 
        error: "Failed to complete Whoop authentication",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 