import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  
  // Clear the auth session cookies
  cookieStore.delete("auth-session");
  cookieStore.delete("user-data");
  cookieStore.delete("siwe");
  
  return NextResponse.json({
    success: true,
    message: "Logged out successfully",
  });
} 