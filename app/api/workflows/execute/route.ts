import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Twilio } from "twilio";

// Helper for template replacement. e.g. "Hello {{triggerNode.data.name}}"
function resolveTemplate(template: string, state: Record<string, any>) {
  if (!template) return "";
  return template.replace(/\{\{([^}]+)\}\}/g, (match: string, path: string) => {
    // path could be trigger.data.name or triggerNode-123.data.name
    // Let's support trigger.data.xxx mapped to the trigger node
    const parts = path.split('.');
    let current: any = state;
    for (const part of parts) {
      if (current === undefined || current === null) return "";
      current = current[part];
    }
    return current !== undefined ? String(current) : "";
  });
}

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const flowId = searchParams.get("flowId");
    
    if (!flowId) return new NextResponse("Missing flowId", { status: 400 });

    const workflow = await prisma.automationWorkflow.findUnique({
      where: { id: flowId },
      include: { organization: true }
    });

    if (!workflow || !workflow.isActive) {
      return new NextResponse("Workflow not found or inactive", { status: 404 });
    }

    const payload = await req.json().catch(() => ({}));

    // Create a Run log
    const workflowRun = await prisma.workflowRun.create({
      data: {
        workflowId: workflow.id,
        status: "RUNNING",
        triggerData: payload,
        runLogs: JSON.stringify([])
      }
    });

    // Parse Nodes & Edges
    const nodes: any[] = JSON.parse(workflow.nodes as string);
    const edges: any[] = JSON.parse(workflow.edges as string);

    // Find trigger node
    let currentNode = nodes.find(n => n.type === "triggerNode");
    
    // Global state object accessible by all nodes
    let state: Record<string, any> = {};
    if (currentNode) {
      // Alias for easy access: {{trigger.data...}}
      state["trigger"] = { data: payload };
      state[currentNode.id] = { data: payload };
    }

    let runLogs: any[] = [];
    let hasFailed = false;

    // Execution Loop
    while (currentNode && !hasFailed) {
      console.log(`Executing node: ${currentNode.id} (${currentNode.type})`);
      const logEntry = {
        nodeId: currentNode.id,
        nodeType: currentNode.type,
        startedAt: new Date().toISOString(),
        status: "SUCCESS",
        output: null as any,
        error: null as any
      };
      
      let nextEdgeSourceHandle = null;

      try {
        if (currentNode.type === "httpActionNode") {
          const url = resolveTemplate(currentNode.data.url || "", state);
          const bodyStr = resolveTemplate(currentNode.data.body || "", state);

          const response = await fetch(url, {
            method: currentNode.data.method || "POST",
            headers: { "Content-Type": "application/json" },
            body: bodyStr
          });
          
          const responseData = await response.text();
          let jsonResponse = null;
          try { jsonResponse = JSON.parse(responseData); } catch(e) {}
          
          state[currentNode.id] = { data: jsonResponse || responseData };
          logEntry.output = state[currentNode.id];
        }
        else if (currentNode.type === "smsActionNode") {
          const msg = resolveTemplate(currentNode.data.message || "", state);
          state[currentNode.id] = { data: { sentMessage: msg } };
          logEntry.output = state[currentNode.id];
          // Mock send
          console.log(`[SMS] To Send: ${msg}`);
        }
        else if (currentNode.type === "emailNode") {
          const to = resolveTemplate(currentNode.data.to || "", state);
          const subject = resolveTemplate(currentNode.data.subject || "", state);
          state[currentNode.id] = { data: { sentTo: to, subject } };
          logEntry.output = state[currentNode.id];
          console.log(`[EMAIL] To: ${to}, Subject: ${subject}`);
        }
        else if (currentNode.type === "delayNode") {
          const mins = parseInt(currentNode.data.minutes || "5", 10);
          state[currentNode.id] = { data: { delayedMinutes: mins } };
          logEntry.output = state[currentNode.id];
          console.log(`[DELAY] Simulation of ${mins} min`);
        }
        else if (currentNode.type === "aiGenerationNode") {
          const prompt = resolveTemplate(currentNode.data.systemPrompt || "", state);
          const input = resolveTemplate(currentNode.data.inputVariable || "", state);
          
          // MOCK AI CALL - in real life, await openai.chat.completions...
          const aiResponse = `[Mock AI] Résultat pour: ${input}`;
          state[currentNode.id] = { data: { output: aiResponse } };
          logEntry.output = state[currentNode.id];
        }
        else if (currentNode.type === "ifElseNode") {
          const variable = resolveTemplate(currentNode.data.conditionVariable || "", state);
          const value = currentNode.data.conditionValue || "";
          const operator = currentNode.data.operator || "=="; // Assuming dropdown added an operator, if not default to ==
          
          let result = false;
          // Simple string comparison for now
          if (operator === "==") result = (variable === value);
          else if (operator === "!=") result = (variable !== value);
          else if (operator === "contains") result = (variable.includes(value));
          else if (operator === ">") result = (parseFloat(variable) > parseFloat(value));
          else if (operator === "<") result = (parseFloat(variable) < parseFloat(value));

          state[currentNode.id] = { data: { result } };
          logEntry.output = state[currentNode.id];
          
          // Important: we tell the edge resolver which handle to use!
          nextEdgeSourceHandle = result ? "true" : "false";
        }
        
      } catch (err: any) {
        console.error(`Error executing node ${currentNode.id}:`, err);
        logEntry.status = "FAILED";
        logEntry.error = err.message;
        hasFailed = true;
      }

      runLogs.push(logEntry);

      if (hasFailed) break;

      // Find next node via edge
      // If we specified a sourceHandle (like 'true' or 'false'), find that specific edge
      const edge = edges.find(e => 
        e.source === currentNode.id && 
        (!nextEdgeSourceHandle || e.sourceHandle === nextEdgeSourceHandle)
      );

      if (edge) {
        currentNode = nodes.find(n => n.id === edge.target);
      } else {
        currentNode = undefined; // End of branch
      }
    }

    // Update Run log
    await prisma.workflowRun.update({
      where: { id: workflowRun.id },
      data: {
        status: hasFailed ? "FAILED" : "SUCCESS",
        completedAt: new Date(),
        runLogs: JSON.stringify(runLogs)
      }
    });

    return NextResponse.json({ 
      success: !hasFailed, 
      executedFlowId: workflow.id, 
      runId: workflowRun.id,
      state 
    });

  } catch (error) {
    console.error("Execute workflow error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
