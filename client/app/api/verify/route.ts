import {
  verifyCloudProof,
  IVerifyResponse,
  ISuccessResult,
} from "@worldcoin/minikit-js";
import { NextRequest, NextResponse } from "next/server";

interface IRequestPayload {
  payload: ISuccessResult;
  action: string;
  signal: string | undefined;
}

export async function POST(req: NextRequest) {
  const { payload, action, signal } = (await req.json()) as IRequestPayload;
  const app_id = process.env.APP_ID as `app_${string}`;

  // Validate required environment variables
  if (!app_id) {
    return NextResponse.json({
      error: "APP_ID not configured",
      status: 500,
      success: false,
    });
  }

  // Validate required parameters
  if (!payload || !action) {
    return NextResponse.json({
      error: "Missing required parameters",
      status: 400,
      success: false,
    });
  }

  try {
    const verifyRes = (await verifyCloudProof(
      payload,
      app_id,
      action,
      signal
    )) as IVerifyResponse;

    if (verifyRes.success) {
      // This is where you should perform backend actions if the verification succeeds
      // Such as, setting a user as "verified" in a database
      return NextResponse.json({
        verifyRes,
        status: 200,
        success: true,
      });
    } else {
      // This is where you should handle errors from the World ID /verify endpoint.
      // Usually these errors are due to a user having already verified.
      return NextResponse.json({
        verifyRes,
        status: 400,
        success: false,
        error: verifyRes.detail || "Verification failed",
      });
    }
  } catch (error) {
    return NextResponse.json({
      error: "Verification failed",
      status: 500,
      success: false,
      detail: error instanceof Error ? error.message : "Unknown error",
    });
  }
}