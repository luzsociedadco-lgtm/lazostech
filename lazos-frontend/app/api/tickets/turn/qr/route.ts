import { NextResponse } from "next/server";
import QRCode from "qrcode";

const LUNCH_TURN_QR_ID = "lazos-lunch-turns-v1";

export async function GET() {
  const svg = await QRCode.toString(LUNCH_TURN_QR_ID, {
    type: "svg",
    margin: 1,
    width: 256,
    color: {
      dark: "#111111",
      light: "#ffffff"
    }
  });

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
}
