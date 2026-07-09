import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';
import { syncAgentSkillsWithOpenAI } from '@/lib/openai-skills';

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
    const employeeId = formData.get('employeeId') as string;

    if (!file || !employeeId) {
      return NextResponse.json({ error: 'File and employeeId are required' }, { status: 400 });
    }

    const employee = await prisma.aIEmployee.findUnique({
      where: { id: employeeId, organizationId }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // 1. Get or Create Knowledge Base for this employee
    let knowledgeBase = employee.knowledgeBaseId 
      ? await prisma.knowledgeBase.findUnique({ where: { id: employee.knowledgeBaseId } })
      : null;

    if (!knowledgeBase) {
      knowledgeBase = await prisma.knowledgeBase.create({
        data: {
          name: `Base de ${employee.name}`,
          organizationId: organizationId
        }
      });
      await prisma.aIEmployee.update({
        where: { id: employee.id },
        data: { knowledgeBaseId: knowledgeBase.id }
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

    // 6. Update AI Employee to use this Vector Store and its skills
    if (employee.openaiAssistantId) {
      await syncAgentSkillsWithOpenAI(employee.id);
    }

    return NextResponse.json({ success: true, document: doc });

  } catch (error: any) {
    console.error('[Knowledge Upload]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
