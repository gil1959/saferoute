import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: "Email dan kode wajib diisi." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ error: "Akun tidak ditemukan." }, { status: 404 });
    }
    if (user.email_verified) {
      return NextResponse.json({ error: "Email sudah terverifikasi." }, { status: 400 });
    }
    if (!user.verify_code || !user.verify_expires) {
      return NextResponse.json({ error: "Kode verifikasi tidak tersedia. Daftar ulang." }, { status: 400 });
    }
    if (new Date() > user.verify_expires) {
      return NextResponse.json({ error: "EXPIRED", message: "Kode sudah kedaluwarsa. Minta kode baru." }, { status: 410 });
    }
    if (user.verify_code !== code.trim()) {
      return NextResponse.json({ error: "Kode verifikasi salah." }, { status: 400 });
    }

    await prisma.user.update({
      where: { email },
      data: {
        email_verified: true,
        verify_code: null,
        verify_expires: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[VERIFY ERROR]", err);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}
