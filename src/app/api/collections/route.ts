import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const collections = await prisma.collection.findMany({
      include: {
        papers: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Format with paper counts
    const formattedCollections = collections.map((collection) => ({
      id: collection.id,
      name: collection.name,
      description: collection.description,
      color: collection.color,
      icon: collection.icon,
      paperCount: collection.papers.length,
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
    }));

    return NextResponse.json({ collections: formattedCollections });
  } catch (error) {
    console.error("Get collections error:", error);
    return NextResponse.json(
      { error: "Failed to get collections" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, color, icon } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const collection = await prisma.collection.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        color: color || "#8b5cf6", // Default purple color
        icon: icon || "📚",
      },
    });

    return NextResponse.json({ collection });
  } catch (error) {
    console.error("Create collection error:", error);
    return NextResponse.json(
      { error: "Failed to create collection" },
      { status: 500 }
    );
  }
}
