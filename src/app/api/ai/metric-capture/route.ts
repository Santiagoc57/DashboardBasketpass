import { NextResponse } from "next/server";

import {
  extractMetricFromCapture,
  technicalCaptureKindSchema,
} from "@/lib/ai/metric-capture";

export async function POST(request: Request) {
  const formData = await request.formData();
  const image = formData.get("image");
  const kindResult = technicalCaptureKindSchema.safeParse(formData.get("kind"));

  if (!(image instanceof File)) {
    return NextResponse.json(
      { error: "Adjunta una captura válida." },
      { status: 400 },
    );
  }

  if (!kindResult.success) {
    return NextResponse.json(
      { error: "El tipo de lectura no es válido." },
      { status: 400 },
    );
  }

  if (!image.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "La captura adjunta debe ser una imagen." },
      { status: 400 },
    );
  }

  const result = await extractMetricFromCapture({
    kind: kindResult.data,
    image,
  });

  return NextResponse.json(result.body, { status: result.status });
}
