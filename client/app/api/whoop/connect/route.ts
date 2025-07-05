import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { wallet_address } = await req.json();

    if (!wallet_address) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    // Call the Fastify server to initiate Whoop OAuth flow
    const fastifyUrl = process.env.FASTIFY_SERVER_URL || 'http://localhost:3001';
    
    const response = await fetch(`${fastifyUrl}/api/whoop/auth/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress: wallet_address
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json({
      status: "success",
      auth_url: data.auth_url,
      redirect_uri: data.redirect_uri,
      state: data.state
    });

  } catch (error) {
    console.error("Whoop connect error:", error);
    return NextResponse.json(
      { 
        error: "Failed to initiate Whoop connection",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 