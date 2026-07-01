import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// IMPORTANT: This route should be secured in production (e.g., matching a secret token)
// Example: /api/cron/sequences?token=YOUR_CRON_SECRET

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  
  // Basic security check (uncomment and configure in production)
  // if (token !== process.env.CRON_SECRET) return new NextResponse('Unauthorized', { status: 401 });

  console.log('[CRON] Starting Sequence Engine...');

  try {
    // Find all ACTIVE enrollments where nextRunAt <= NOW()
    const dueEnrollments = await prisma.sequenceEnrollment.findMany({
      where: {
        status: 'ACTIVE',
        nextRunAt: { lte: new Date() },
        sequence: { isActive: true }
      },
      include: {
        contact: true,
        sequence: {
          include: {
            steps: {
              orderBy: { stepOrder: 'asc' }
            }
          }
        }
      }
    });

    console.log(`[CRON] Found ${dueEnrollments.length} due sequence steps to process.`);

    const results = [];

    for (const enrollment of dueEnrollments) {
      const currentStepObj = enrollment.sequence.steps.find((s: any) => s.stepOrder === enrollment.currentStep);
      
      if (!currentStepObj) {
        // Sequence reached the end or step was deleted
        await prisma.sequenceEnrollment.update({
          where: { id: enrollment.id },
          data: { status: 'COMPLETED', nextRunAt: null }
        });
        results.push({ id: enrollment.id, status: 'COMPLETED' });
        continue;
      }

      try {
        // Execute Step
        if (currentStepObj.actionType === 'SMS') {
           console.log(`[ACTION] (SIMULATED) Sending SMS to ${enrollment.contact.phone}: ${currentStepObj.content}`);
           
           // Fetch a phone number for the organization to act as sender
           const orgPhone = await prisma.phoneNumber.findFirst({
             where: { organizationId: enrollment.contact.organizationId }
           });
           const fromNumber = orgPhone?.number || "+10000000000"; // Fallback for simulation
           
           // Log it in DB as simulated
           await prisma.smsMessage.create({
             data: {
               telnyxMessageId: `sim-${Date.now()}-${Math.floor(Math.random()*1000)}`,
               direction: 'OUTBOUND',
               body: currentStepObj.content || "",
               status: 'DELIVERED',
               type: 'SMS',
               cost: 0.0,
               fromNumber,
               toNumber: enrollment.contact.phone,
               organizationId: enrollment.contact.organizationId,
               contactId: enrollment.contact.id,
               phoneNumberId: orgPhone?.id,
             }
           });
        } else if (currentStepObj.actionType === 'AI_CALL') {
           console.log(`[ACTION] (SIMULATED) Initiating AI Call to ${enrollment.contact.phone} with prompt: ${currentStepObj.content}`);
        } else if (currentStepObj.actionType === 'WHATSAPP') {
           console.log(`[ACTION] (SIMULATED) Sending WhatsApp to ${enrollment.contact.phone}`);
        }

        // Determine Next Step
        const nextStepOrder = enrollment.currentStep + 1;
        const nextStepObj = enrollment.sequence.steps.find((s: any) => s.stepOrder === nextStepOrder);

        if (nextStepObj) {
          // Schedule next step
          const nextRunTime = new Date();
          nextRunTime.setHours(nextRunTime.getHours() + nextStepObj.delayHours);

          await prisma.sequenceEnrollment.update({
            where: { id: enrollment.id },
            data: {
              currentStep: nextStepOrder,
              nextRunAt: nextRunTime
            }
          });
          results.push({ id: enrollment.id, status: 'SCHEDULED_NEXT', nextRunAt: nextRunTime });
        } else {
          // No more steps
          await prisma.sequenceEnrollment.update({
            where: { id: enrollment.id },
            data: { status: 'COMPLETED', nextRunAt: null }
          });
          results.push({ id: enrollment.id, status: 'COMPLETED' });
        }

      } catch (stepError) {
        console.error(`[CRON] Error processing enrollment ${enrollment.id}:`, stepError);
        // We could retry or mark as FAILED
      }
    }

    return NextResponse.json({ success: true, processed: results.length, results });
  } catch (error) {
    console.error("[CRON] Engine failed:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
