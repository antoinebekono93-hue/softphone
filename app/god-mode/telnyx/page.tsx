import { getSystemSettings } from "./actions";
import { TelnyxHubClient } from "./TelnyxHubClient";

export const metadata = {
  title: "Telnyx Hub | God Mode",
};

export default async function TelnyxControlPage() {
  const settings = await getSystemSettings();

  return <TelnyxHubClient initialSettings={settings} />;
}
