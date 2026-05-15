import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/mailer";

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email wajib diisi." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ error: "Akun tidak ditemukan." }, { status: 404 });
    }
    if (user.email_verified) {
      return NextResponse.json({ error: "Email sudah terverifikasi." }, { status: 400 });
    }

    const verify_code = generateCode();
    const verify_expires = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.user.update({
      where: { email },
      data: { verify_code, verify_expires },
    });

    await sendVerificationEmail(email, user.full_name, verify_code);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[RESEND VERIFY ERROR]", err);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}
