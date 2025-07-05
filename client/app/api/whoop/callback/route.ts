import { NextRequest, NextResponse } from "next/server";

// Simple in-memory cache to prevent duplicate processing
const processedCodes = new Map<string, { timestamp: number; processing: boolean }>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  const fiveMinutesAgo = now - 5 * 60 * 1000;
  
  for (const [code, entry] of processedCodes.entries()) {
    if (entry.timestamp < fiveMinutesAgo && !entry.processing) {
      processedCodes.delete(code);
    }
  }
}, 5 * 60 * 1000);

export async function POST(req: NextRequest) {
  try {
    const { code, state, wallet_address } = await req.json();

    if (!code || !state || !wallet_address) {
      return NextResponse.json(
        { error: "Missing required parameters: code, state, or wallet_address" },
        { status: 400 }
      );
    }

    // Check if this code is already being processed or was recently processed
    const existingEntry = processedCodes.get(code);
    if (existingEntry) {
      if (existingEntry.processing) {
        return NextResponse.json(
          { error: "OAuth code is already being processed" },
          { status: 409 }
        );
      }
      
      // If processed recently (within 2 minutes), return error
      const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
      if (existingEntry.timestamp > twoMinutesAgo) {
        return NextResponse.json(
          { error: "OAuth code has already been processed recently" },
          { status: 409 }
        );
      }
    }

    // Mark as processing
    processedCodes.set(code, { timestamp: Date.now(), processing: true });

    // Verify state parameter contains wallet address
    if (!state.startsWith(wallet_address)) {
      processedCodes.set(code, { timestamp: Date.now(), processing: false });
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
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({
        code
      })
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      processedCodes.set(code, { timestamp: Date.now(), processing: false });
      throw new Error(errorData.details || `Token exchange failed: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.data.access_token;

    // Step 2: Authenticate and store data using the access token
    const storeResponse = await fetch(`${fastifyUrl}/api/whoop/authenticate-and-store`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({
        accessToken,
        walletAddress: wallet_address,
        limit: 25
      })
    });

    if (!storeResponse.ok) {
      const errorData = await storeResponse.json();
      processedCodes.set(code, { timestamp: Date.now(), processing: false });
      throw new Error(errorData.details || `Data storage failed: ${storeResponse.status}`);
    }

    const storeData = await storeResponse.json();
    
    // Mark as successfully processed
    processedCodes.set(code, { timestamp: Date.now(), processing: false });
    
    return NextResponse.json({
      status: "success",
      message: "Whoop account connected and data stored successfully",
      data: storeData.data
    });

  } catch (error) {
    console.error("Whoop callback error:", error);
    
    // Mark as failed (not processing)
    const { code } = await req.json().catch(() => ({}));
    if (code) {
      processedCodes.set(code, { timestamp: Date.now(), processing: false });
    }
    
    return NextResponse.json(
      { 
        error: "Failed to complete Whoop authentication",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 