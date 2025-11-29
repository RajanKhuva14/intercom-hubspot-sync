// app/api/oauth/intercom/route.ts
import { NextRequest, NextResponse } from "next/server";
import { exchangeIntercomCodeForToken } from "@/lib/intercom";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.json({ success: false, error }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json({ success: false, error: "Missing code" }, { status: 400 });
  }

  try {
    await exchangeIntercomCodeForToken(code);
    return NextResponse.redirect(new URL("/?intercom=connected", req.url));
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || "OAuth failed" }, { status: 500 });
  }
}
