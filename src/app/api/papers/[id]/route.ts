import { NextRequest, NextResponse } from "next/server";
import {
  getPaperById,
  savePaper,
  unsavePaper,
  isPaperSaved,
  markPaperAsDiscarded,
  unmarkPaperAsSeen,
  isPaperDiscarded,
  addTagToPaper,
  removeTagFromPaper,
  addPaperToCollection,
  removePaperFromCollection,
  getPaperTags,
  getPaperCollections,
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
    const discarded = await isPaperDiscarded(id);
    const tags = await getPaperTags(id);
    const collections = await getPaperCollections(id);

    return NextResponse.json({ paper, saved, discarded, tags, collections });
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
    const { action, tagId, collectionId } = body;

    if (action === "save") {
      await savePaper(id);
      return NextResponse.json({ saved: true });
    } else if (action === "unsave") {
      await unsavePaper(id);
      return NextResponse.json({ saved: false });
    } else if (action === "discard") {
      await markPaperAsDiscarded(id);
      return NextResponse.json({ discarded: true });
    } else if (action === "undiscard") {
      await unmarkPaperAsSeen(id);
      return NextResponse.json({ discarded: false });
    } else if (action === "addTag") {
      if (!tagId) {
        return NextResponse.json(
          { error: "Tag ID is required" },
          { status: 400 }
        );
      }
      await addTagToPaper(id, tagId);
      return NextResponse.json({ success: true });
    } else if (action === "removeTag") {
      if (!tagId) {
        return NextResponse.json(
          { error: "Tag ID is required" },
          { status: 400 }
        );
      }
      await removeTagFromPaper(id, tagId);
      return NextResponse.json({ success: true });
    } else if (action === "addToCollection") {
      if (!collectionId) {
        return NextResponse.json(
          { error: "Collection ID is required" },
          { status: 400 }
        );
      }
      await addPaperToCollection(id, collectionId);
      return NextResponse.json({ success: true });
    } else if (action === "removeFromCollection") {
      if (!collectionId) {
        return NextResponse.json(
          { error: "Collection ID is required" },
          { status: 400 }
        );
      }
      await removePaperFromCollection(id, collectionId);
      return NextResponse.json({ success: true });
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
