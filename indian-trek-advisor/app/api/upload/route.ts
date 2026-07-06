import { NextRequest, NextResponse } from "next/server"
import { cloudinary } from "@/lib/cloudinary"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const folder = formData.get("folder") as string | null
    const userId = formData.get("userId") as string | null

    if (!file) {
      return NextResponse.json(
        { error: "No file provided." },
        { status: 400 },
      )
    }

    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Only JPG, PNG, and PDF files are allowed." },
        { status: 400 },
      )
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 5MB." },
        { status: 400 },
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadFolder = folder || "guide-documents"
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_").replace(/\.[^.]+$/, "")
    const publicId = `${userId || "anon"}/${Date.now()}-${cleanName}`

    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `trekadvisor/${uploadFolder}`,
          public_id: publicId,
          resource_type: "auto",
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result as { secure_url: string })
        },
      )
      uploadStream.end(buffer)
    })

    return NextResponse.json({ url: result.secure_url }, { status: 200 })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 },
    )
  }
}
