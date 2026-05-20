import { NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type ScheduleDocument = {
  file_name: string;
  download_url: string;
  storage_path: string;
};

export const dynamic = "force-dynamic";

export async function GET() {
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

  return NextResponse.redirect(scheduleDocument.download_url);
}
