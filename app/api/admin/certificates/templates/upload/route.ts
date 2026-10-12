import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth/session";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";
import { storeCertificateFile } from "@/lib/storage/certificate-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_TEMPLATE_SIZE = 15 * 1024 * 1024; // 15MB limit

export async function POST(request: NextRequest) {
  try {
    const session = await verifyAdminSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No certificate template file provided." },
        { status: 400 }
      );
    }

    if (file.size > MAX_TEMPLATE_SIZE) {
      return NextResponse.json(
        { success: false, error: "Template file exceeds the 15MB maximum limit." },
        { status: 400 }
      );
    }

    const allowedMimeTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
    ];

    let mimeType = file.type.toLowerCase();
    if (mimeType === "image/jpg") mimeType = "image/jpeg";

    if (!allowedMimeTypes.includes(mimeType)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid file type. Please upload a PDF, PNG, or JPEG certificate template.",
        },
        { status: 400 }
      );
    }

    const rawBuffer = Buffer.from(await file.arrayBuffer());

    let pageWidth = 842;
    let pageHeight = 595;
    let orientation: "landscape" | "portrait" = "landscape";

    if (mimeType === "application/pdf") {
      try {
        const pdfDoc = await PDFDocument.load(rawBuffer);
        const pageCount = pdfDoc.getPageCount();
        if (pageCount === 0) {
          return NextResponse.json(
            { success: false, error: "Uploaded PDF has no pages." },
            { status: 400 }
          );
        }
        const firstPage = pdfDoc.getPages()[0];
        const size = firstPage.getSize();
        pageWidth = Math.round(size.width);
        pageHeight = Math.round(size.height);
        orientation = pageWidth >= pageHeight ? "landscape" : "portrait";
      } catch (err: any) {
        return NextResponse.json(
          { success: false, error: `Malformed or unreadable PDF: ${err.message}` },
          { status: 400 }
        );
      }
    } else {
      // Process image template with sharp
      try {
        const metadata = await sharp(rawBuffer).metadata();
        const imgWidth = metadata.width || 1200;
        const imgHeight = metadata.height || 848;

        // Map image pixels to typical PDF points maintaining aspect ratio
        const isLandscape = imgWidth >= imgHeight;
        if (isLandscape) {
          pageWidth = 842;
          pageHeight = Math.round((imgHeight / imgWidth) * 842);
          orientation = "landscape";
        } else {
          pageWidth = 595;
          pageHeight = Math.round((imgHeight / imgWidth) * 595);
          orientation = "portrait";
        }
      } catch (err: any) {
        return NextResponse.json(
          { success: false, error: `Failed to inspect image file: ${err.message}` },
          { status: 400 }
        );
      }
    }

    // Store template file in private storage
    const fileReference = await storeCertificateFile(
      rawBuffer,
      file.name,
      mimeType,
      {
        pageWidth,
        pageHeight,
        orientation,
        uploadedBy: session.email,
      }
    );

    return NextResponse.json({
      success: true,
      fileReference,
      fileName: file.name,
      mimeType,
      pageWidth,
      pageHeight,
      orientation,
      message: "Template uploaded and analyzed successfully.",
    });
  } catch (error: any) {
    console.error("[TEMPLATE UPLOAD ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to upload template" },
      { status: 500 }
    );
  }
}
