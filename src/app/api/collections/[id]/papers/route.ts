import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: collectionId } = await params;
    const body = await request.json();
    const { paperId, action } = body;

    if (!paperId || typeof paperId !== "string") {
      return NextResponse.json(
        { error: "Paper ID is required" },
        { status: 400 }
      );
    }

    if (action === "add") {
      // Check if paper exists
      const paper = await prisma.paper.findUnique({
        where: { id: paperId },
      });

      if (!paper) {
        return NextResponse.json(
          { error: "Paper not found" },
          { status: 404 }
        );
      }

      // Add paper to collection (upsert to avoid duplicates)
      await prisma.paperCollection.upsert({
        where: {
          paperId_collectionId: {
            paperId,
            collectionId,
          },
        },
        update: {},
        create: {
          paperId,
          collectionId,
        },
      });

      return NextResponse.json({ success: true, action: "added" });
    } else if (action === "remove") {
      // Remove paper from collection
      await prisma.paperCollection.deleteMany({
        where: {
          paperId,
          collectionId,
        },
      });

      return NextResponse.json({ success: true, action: "removed" });
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'add' or 'remove'" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Collection paper action error:", error);
    return NextResponse.json(
      { error: "Failed to perform action" },
      { status: 500 }
    );
  }
}
