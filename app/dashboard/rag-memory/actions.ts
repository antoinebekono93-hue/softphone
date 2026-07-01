"use server";

import { auth } from "@/auth";

export async function getFqdnConnections() {
  const session = await auth();
  if (!session?.user?.organizationId) return { error: "Unauthorized" };

  try {
    const res = await fetch("https://api.telnyx.com/v2/fqdn_connections", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${process.env.TELNYX_API_KEY}`,
      }
    });

    if (!res.ok) {
      return { error: "Failed to fetch FQDN connections" };
    }

    const json = await res.json();
    return { success: true, data: json.data };
  } catch (error) {
    return { error: "Unexpected error fetching connections" };
  }
}

export async function toggleConversationPersistence(connectionId: string, enabled: boolean) {
  const session = await auth();
  if (!session?.user?.organizationId) return { error: "Unauthorized" };

  try {
    const res = await fetch(`https://api.telnyx.com/v2/fqdn_connections/${connectionId}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${process.env.TELNYX_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        conversation_persistence: enabled
      })
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[Conversation Persistence Error]", err);
      return { error: "Failed to update conversation persistence" };
    }

    return { success: true };
  } catch (error) {
    return { error: "Unexpected error toggling persistence" };
  }
}

export async function searchConversationHistory(query: string, limit: number = 10) {
  const session = await auth();
  if (!session?.user?.organizationId) return { error: "Unauthorized" };

  try {
    const url = new URL("https://api.telnyx.com/v2/ai/conversation_histories");
    url.searchParams.append("q", query);
    url.searchParams.append("record_type", "voice");
    url.searchParams.append("top_k", limit.toString());

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${process.env.TELNYX_API_KEY}`,
      }
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[Search History Error]", err);
      return { error: "Failed to search conversation history" };
    }

    const json = await res.json();
    return { success: true, data: json.data };
  } catch (error) {
    return { error: "Unexpected error searching history" };
  }
}
