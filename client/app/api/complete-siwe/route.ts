import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  MiniAppWalletAuthSuccessPayload,
  verifySiweMessage,
} from "@worldcoin/minikit-js";

interface IRequestPayload {
  payload: MiniAppWalletAuthSuccessPayload;
  nonce: string;
}

export const POST = async (req: NextRequest) => {
  const { payload, nonce } = (await req.json()) as IRequestPayload;
  const cookieStore = await cookies();
  
  if (nonce != cookieStore.get("siwe")?.value) {
    return NextResponse.json({
      status: "error",
      isValid: false,
      message: "Invalid nonce",
    });
  }
  try {
    const validMessage = await verifySiweMessage(payload, nonce);

    // Set a session cookie to indicate the user is authenticated
    cookieStore.set("auth-session", "true", {
      httpOnly: true,
      secure: process.env.NEXT_PUBLIC_APP_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    // Store user data in session
    cookieStore.set("user-data", JSON.stringify({
      address: payload.address,
      // Add other user data as needed
    }), {
      httpOnly: true,
      secure: process.env.NEXT_PUBLIC_APP_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return NextResponse.json({
      status: "success",
      isValid: validMessage.isValid,
    });
  } catch (error: any) {
    // Handle errors in validation or processing
    return NextResponse.json({
      status: "error",
      isValid: false,
      message: error.message,
    });
  }
};