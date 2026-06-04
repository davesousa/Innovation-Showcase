import { NextResponse } from "next/server";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { app } from "@/lib/firebase-app";

type ScheduleDocument = {
  file_name: string;
  download_url: string;
  storage_path: string;
};

export const dynamic = "force-dynamic";

function getContentDispositionFileName(fileName: string) {
  const fallbackFileName = fileName
    .trim()
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, " ");

  const safeFileName = fallbackFileName || "schedule.pdf";
  const quotedFileName = safeFileName.replace(/["\\]/g, "\\$&");
  const encodedFileName = encodeURIComponent(safeFileName);

  return `attachment; filename="${quotedFileName}"; filename*=UTF-8''${encodedFileName}`;
}

export async function GET() {
  const db = getFirestore(app);
  const snapshot = await getDoc(doc(db, "schedule_documents", "current"));

  if (!snapshot.exists()) {
    return new NextResponse("No schedule document has been uploaded yet.", {
      status: 404,
    });
  }

  const scheduleDocument = snapshot.data() as ScheduleDocument;

  if (!scheduleDocument.download_url) {
    return new NextResponse("The uploaded schedule document is missing a download URL.", {
      status: 404,
    });
  }

  const storageResponse = await fetch(scheduleDocument.download_url);

  if (!storageResponse.ok || !storageResponse.body) {
    return new NextResponse("The uploaded schedule document could not be downloaded.", {
      status: 502,
    });
  }

  return new NextResponse(storageResponse.body, {
    headers: {
      "Content-Disposition": getContentDispositionFileName(scheduleDocument.file_name),
      "Content-Type": storageResponse.headers.get("Content-Type") || "application/pdf",
    },
  });
}
