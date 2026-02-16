import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tag = await prisma.tag.findUnique({
      where: { id },
      include: {
        papers: {
          include: {
            paper: true,
          },
        },
      },
    });

    if (!tag) {
      return NextResponse.json(
        { error: "Tag not found" },
        { status: 404 }
      );
    }

    // Format papers
    const papers = tag.papers.map((pt) => {
      const paper = pt.paper;
      return {
        id: paper.id,
        arxivId: paper.arxivId,
        title: paper.title,
        authors: JSON.parse(paper.authors),
        abstract: paper.abstract,
        categories: JSON.parse(paper.categories),
        publishedDate: paper.publishedDate,
        pdfUrl: paper.pdfUrl,
        hook: paper.hook,
        keyConcepts: paper.keyConcepts ? JSON.parse(paper.keyConcepts) : null,
        summary: paper.summary,
        whyMatters: paper.whyMatters,
      };
    });

    return NextResponse.json({
      tag: {
        id: tag.id,
        name: tag.name,
        color: tag.color,
        papers,
        createdAt: tag.createdAt,
      },
    });
  } catch (error) {
    console.error("Get tag error:", error);
    return NextResponse.json(
      { error: "Failed to get tag" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, color } = body;

    const tag = await prisma.tag.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim().toLowerCase() }),
        ...(color !== undefined && { color }),
      },
    });

    return NextResponse.json({ tag });
  } catch (error) {
    console.error("Update tag error:", error);
    return NextResponse.json(
      { error: "Failed to update tag" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.tag.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete tag error:", error);
    return NextResponse.json(
      { error: "Failed to delete tag" },
      { status: 500 }
    );
  }
}
