import { NextRequest, NextResponse } from "next/server";
import { getProfileByWallet } from "@/lib/services/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ wallet: string }> }
) {
  try {
    const { wallet } = await params;
    const walletAddress = wallet;

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    const profile = await getProfileByWallet(walletAddress);

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      wallet_address: profile.wallet_address,
      username: profile.username,
      world_id: profile.world_id,
      nullifier_hash: profile.nullifier_hash,
      verification_level: profile.verification_level,
      is_verified: profile.is_verified,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}