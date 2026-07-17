import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { employeeId, replyToCommentsPublicly, replyToCommentsPrivately } = await req.json();

    if (!employeeId) {
      return NextResponse.json({ error: 'Missing employeeId' }, { status: 400 });
    }

    // Verify ownership
    const employee = await prisma.aIEmployee.findUnique({
      where: { id: employeeId, organizationId: session.user.organizationId }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const updatedEmployee = await prisma.aIEmployee.update({
      where: { id: employeeId },
      data: {
        replyToCommentsPublicly: replyToCommentsPublicly ?? employee.replyToCommentsPublicly,
        replyToCommentsPrivately: replyToCommentsPrivately ?? employee.replyToCommentsPrivately
      }
    });

    return NextResponse.json(updatedEmployee);
  } catch (error: any) {
    console.error('[AI Employee Meta Settings Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
