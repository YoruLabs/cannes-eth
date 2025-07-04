import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { reference_id, auth_success_redirect_url, auth_failure_redirect_url } = await req.json();

    const response = await fetch(
      "https://api.tryterra.co/v2/auth/authenticateUser?resource=oura",
      {
        method: "POST",
        headers: {
          "dev-id": "nu3-testing-yvWUmUCOy3",
          "x-api-key": "ttFrGmI3G798Lzi_0GXbB6rt-N03c_Yl",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language: "en",
          reference_id: reference_id || "my_first_connection",
          auth_success_redirect_url,
          auth_failure_redirect_url,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Terra API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("Terra API error:", error);
    return NextResponse.json(
      { 
        error: "Failed to authenticate with Terra API",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 