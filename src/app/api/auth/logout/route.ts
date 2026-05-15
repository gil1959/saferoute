import { NextResponse } from "next/server";
import { cookieOptions } from "@/lib/auth";

export async function POST() {
  const opts = cookieOptions();
  const response = NextResponse.json({ success: true });
  response.cookies.set(opts.name, "", { maxAge: 0, path: opts.path });
  return response;
}
