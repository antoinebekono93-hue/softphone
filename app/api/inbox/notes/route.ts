import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");
    const contactId = searchParams.get("contactId");
    const opportunityId = searchParams.get("opportunityId");

    if (!storeId) {
      return NextResponse.json({ error: "Store ID is required" }, { status: 400 });
    }
    
    if (!contactId && !opportunityId) {
        return NextResponse.json({ error: "Contact ID or Opportunity ID is required" }, { status: 400 });
    }

    const notes = await prisma.internalNote.findMany({
      where: {
        organizationId: storeId,
        ...(contactId ? { contactId } : {}),
        ...(opportunityId ? { opportunityId } : {}),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json(
      { error: "Error fetching notes" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");

    if (!storeId) {
      return NextResponse.json({ error: "Store ID is required" }, { status: 400 });
    }

    const body = await req.json();
    const { content, contactId, opportunityId, authorId } = body;

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }
    
    // Fallback to a system user or first user if authorId is not provided
    let finalAuthorId = authorId;
    if (!finalAuthorId) {
        const firstUser = await prisma.user.findFirst({
            where: { organizationId: storeId }
        });
        if (firstUser) {
            finalAuthorId = firstUser.id;
        } else {
             return NextResponse.json({ error: "Author ID is required and no default user found" }, { status: 400 });
        }
    }

    const newNote = await prisma.internalNote.create({
      data: {
        content,
        organizationId: storeId,
        ...(contactId ? { contactId } : {}),
        ...(opportunityId ? { opportunityId } : {}),
        authorId: finalAuthorId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(newNote);
  } catch (error) {
    console.error("Error creating note:", error);
    return NextResponse.json(
      { error: "Error creating note" },
      { status: 500 }
    );
  }
}
