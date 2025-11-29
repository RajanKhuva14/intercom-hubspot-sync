// app/api/oauth/hubspot/route.ts
import { NextRequest, NextResponse } from "next/server";
import { exchangeHubspotCodeForToken } from "@/lib/hubspot";

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
    await exchangeHubspotCodeForToken(code);
    return NextResponse.redirect(new URL("/?hubspot=connected", req.url));
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || "OAuth failed" }, { status: 500 });
  }
}
