import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email wajib diisi." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Selalu return success agar tidak bocorkan info akun terdaftar
    if (!user || !user.email_verified) {
      return NextResponse.json({ success: true });
    }

    const reset_token = crypto.randomBytes(48).toString("hex");
    const reset_expires = new Date(Date.now() + 60 * 60 * 1000); // 1 jam

    await prisma.user.update({
      where: { email },
      data: { reset_token, reset_expires },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${reset_token}`;

    await sendPasswordResetEmail(email, user.full_name, resetUrl);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[FORGOT PASSWORD ERROR]", err);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}
