import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      include: {
        papers: true,
      },
      orderBy: { name: "asc" },
    });

    // Format with usage counts
    const formattedTags = tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
      usageCount: tag.papers.length,
      createdAt: tag.createdAt,
    }));

    return NextResponse.json({ tags: formattedTags });
  } catch (error) {
    console.error("Get tags error:", error);
    return NextResponse.json(
      { error: "Failed to get tags" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, color } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const normalizedName = name.trim().toLowerCase();

    // Check if tag already exists (case-insensitive)
    const existingTag = await prisma.tag.findUnique({
      where: { name: normalizedName },
    });

    if (existingTag) {
      return NextResponse.json({ tag: existingTag });
    }

    // Create new tag
    const tag = await prisma.tag.create({
      data: {
        name: normalizedName,
        color: color || "#6366f1", // Default indigo color
      },
    });

    return NextResponse.json({ tag });
  } catch (error) {
    console.error("Create tag error:", error);
    return NextResponse.json(
      { error: "Failed to create tag" },
      { status: 500 }
    );
  }
}
