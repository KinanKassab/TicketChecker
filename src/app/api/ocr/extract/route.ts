import { NextRequest, NextResponse } from "next/server";

// Server-side OCR extraction using Tesseract.js
// This is a fallback when client-side OCR is not available

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload an image." },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size too large. Maximum 5MB allowed." },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    try {
      // Try to use Tesseract.js on server
      const Tesseract = (await import("tesseract.js")).default;
      
      const { data: { text } } = await Tesseract.recognize(buffer, "eng+ara", {
        logger: () => {}, // Suppress logs
      });

      return NextResponse.json({ text });
    } catch (importError) {
      // If Tesseract.js is not available, return error
      console.error("Tesseract.js not available on server:", importError);
      return NextResponse.json(
        { 
          error: "OCR service not available. Please install tesseract.js package.",
          text: "" 
        },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error("Error in OCR extraction:", error);
    return NextResponse.json(
      { error: "Failed to process image" },
      { status: 500 }
    );
  }
}
