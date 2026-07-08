import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

export const maxDuration = 60; // Allow more time for large files

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = session.user.organizationId;
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // 1. Get or Create Knowledge Base for the organization
    let knowledgeBase = await prisma.knowledgeBase.findFirst({
      where: { organizationId }
    });

    if (!knowledgeBase) {
      knowledgeBase = await prisma.knowledgeBase.create({
        data: {
          name: 'Base de connaissances principale',
          organizationId: organizationId
        }
      });
    }

    // 2. Ensure Vector Store exists in OpenAI
    let vectorStoreId = knowledgeBase.openaiVectorStoreId;
    if (!vectorStoreId) {
      const vectorStore = await (openai.beta as any).vectorStores.create({
        name: `KB_${organizationId}`
      });
      vectorStoreId = vectorStore.id;
      
      await prisma.knowledgeBase.update({
        where: { id: knowledgeBase.id },
        data: { openaiVectorStoreId: vectorStoreId }
      });
    }

    // 3. Upload File to OpenAI
    const openaiFile = await openai.files.create({
      file: file,
      purpose: 'assistants'
    });

    // 5. Attach File to Vector Store
    await (openai.beta as any).vectorStores.files.create(vectorStoreId as string, {
      file_id: openaiFile.id
    });

    // 5. Save KnowledgeDocument in Database
    const doc = await prisma.knowledgeDocument.create({
      data: {
        type: 'FILE',
        name: file.name,
        source: file.name,
        openaiFileId: openaiFile.id,
        status: 'READY',
        knowledgeBaseId: knowledgeBase.id
      }
    });

    // 6. Update AI Employees to use this Vector Store
    const employees = await prisma.aIEmployee.findMany({
      where: { organizationId, openaiAssistantId: { not: null } }
    });

    for (const employee of employees) {
      // Connect knowledgeBase in DB
      await prisma.aIEmployee.update({
        where: { id: employee.id },
        data: { knowledgeBaseId: knowledgeBase.id }
      });

      // Update Assistant Tools to ensure file_search is enabled
      await openai.beta.assistants.update(employee.openaiAssistantId!, {
        tools: [{ type: "file_search" }],
        tool_resources: {
          file_search: {
            vector_store_ids: [vectorStoreId as string]
          }
        }
      });
    }

    return NextResponse.json({ success: true, document: doc });

  } catch (error: any) {
    console.error('[Knowledge Upload]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
