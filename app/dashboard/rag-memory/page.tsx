import { auth } from "@/auth";
import RagMemoryClient from "./RagMemoryClient";
import { getFqdnConnections } from "./actions";

export default async function RagMemoryPage() {
  const session = await auth();
  
  // Fetch connections on server side for the client to use
  const connectionsRes = await getFqdnConnections();
  const connections = connectionsRes.success ? connectionsRes.data : [];

  return <RagMemoryClient initialConnections={connections} />;
}
