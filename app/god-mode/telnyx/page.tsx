import { getSystemSettings } from "./actions";
import { TelnyxHubClient } from "./TelnyxHubClient";

export const metadata = {
  title: "Provider Hub | God Mode",
};

export default async function TelnyxControlPage() {
  const settings = await getSystemSettings();

  return <TelnyxHubClient initialSettings={settings} />;
}
