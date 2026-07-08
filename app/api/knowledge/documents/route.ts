import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

// GET: List all documents
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = session.user.organizationId;

    const knowledgeBase = await prisma.knowledgeBase.findFirst({
      where: { organizationId },
      include: { documents: { orderBy: { createdAt: 'desc' } } }
    });

    return NextResponse.json({ documents: knowledgeBase?.documents || [] });
  } catch (error: any) {
    console.error('[Knowledge GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Remove a document
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = session.user.organizationId;
    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get('id');

    if (!documentId) {
      return NextResponse.json({ error: 'Missing document ID' }, { status: 400 });
    }

    const doc = await prisma.knowledgeDocument.findUnique({
      where: { id: documentId },
      include: { knowledgeBase: true }
    });

    if (!doc || doc.knowledgeBase.organizationId !== organizationId) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }

    // Remove from OpenAI if fileId exists
    if (doc.openaiFileId) {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      try {
        await openai.files.del(doc.openaiFileId);
      } catch (e) {
        console.warn('File may already be deleted from OpenAI', e);
      }
    }

    // Delete from DB
    await prisma.knowledgeDocument.delete({
      where: { id: documentId }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Knowledge DELETE]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
