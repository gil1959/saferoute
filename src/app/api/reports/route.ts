import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    // const category = formData.get("category");
    // const description = formData.get("description");
    // const lat = formData.get("lat");
    // const lng = formData.get("lng");
    // const files = formData.getAll("files");

    // TODO: 
    // 1. Validate JWT user token (FR-005)
    // 2. Upload files to Cloudinary (FR-003)
    // 3. Insert into prisma.report

    return NextResponse.json({
      status: "success",
      message: "Report submitted successfully and is pending validation"
    }, { status: 201 });

  } catch (error) {
    return NextResponse.json(
      { status: "error", message: "Failed to submit report" },
      { status: 500 }
    );
  }
}
