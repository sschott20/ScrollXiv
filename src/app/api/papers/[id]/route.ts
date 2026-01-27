import { NextRequest, NextResponse } from "next/server";
import {
  getPaperById,
  savePaper,
  unsavePaper,
  isPaperSaved,
} from "@/services/papers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const paper = await getPaperById(id);

    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    const saved = await isPaperSaved(id);

    return NextResponse.json({ paper, saved });
  } catch (error) {
    console.error("Get paper error:", error);
    return NextResponse.json(
      { error: "Failed to get paper" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (action === "save") {
      await savePaper(id);
      return NextResponse.json({ saved: true });
    } else if (action === "unsave") {
      await unsavePaper(id);
      return NextResponse.json({ saved: false });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Paper action error:", error);
    return NextResponse.json(
      { error: "Failed to perform action" },
      { status: 500 }
    );
  }
}
