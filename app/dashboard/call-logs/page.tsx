import { getCallLogs } from "./actions";
import { CallLogsClient } from "./CallLogsClient";

export const metadata = {
  title: "Call Logs | Antigravity",
};

export default async function CallLogsPage() {
  const { logs } = await getCallLogs(100, 0);

  return <CallLogsClient initialLogs={logs} />;
}
