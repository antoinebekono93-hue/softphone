import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';
import * as cheerio from 'cheerio';
import { syncAgentSkillsWithOpenAI } from '@/lib/openai-skills';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = session.user.organizationId;
    const body = await req.json();
    const { url, employeeId } = body;

    if (!url || !employeeId) {
      return NextResponse.json({ error: 'URL and employeeId are required' }, { status: 400 });
    }

    const employee = await prisma.aIEmployee.findUnique({
      where: { id: employeeId, organizationId }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // 1. Fetch and Scrape URL
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Extract main text (removing scripts, styles, etc.)
    $('script, style, noscript, iframe, img, svg').remove();
    const textContent = $('body').text().replace(/\s+/g, ' ').trim();
    
    if (!textContent || textContent.length < 50) {
      return NextResponse.json({ error: 'Not enough text content found on the page' }, { status: 400 });
    }

    // Create a virtual file to upload to OpenAI
    const filename = `scraped_${url.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    const buffer = Buffer.from(`URL: ${url}\n\nContenu:\n${textContent}`, 'utf-8');
    const file = new File([buffer], filename, { type: 'text/plain' });

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // 2. Get or Create Knowledge Base for this employee
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

    // 3. Ensure Vector Store exists
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

    // 4. Upload File to OpenAI
    const openaiFile = await openai.files.create({
      file: file,
      purpose: 'assistants'
    });

    // 5. Attach File to Vector Store
    await (openai.beta as any).vectorStores.files.create(vectorStoreId, {
      file_id: openaiFile.id
    });

    // 6. Save KnowledgeDocument in Database
    const doc = await prisma.knowledgeDocument.create({
      data: {
        type: 'URL',
        name: url,
        source: url,
        openaiFileId: openaiFile.id,
        status: 'READY',
        knowledgeBaseId: knowledgeBase.id
      }
    });

    // 7. Update AI Employee to use this Vector Store and its skills
    if (employee.openaiAssistantId) {
      await syncAgentSkillsWithOpenAI(employee.id);
    }

    return NextResponse.json({ success: true, document: doc });

  } catch (error: any) {
    console.error('[Knowledge Scrape]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
