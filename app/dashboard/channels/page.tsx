import { ChannelsClient } from "./ChannelsClient";
import { getOrganizationNumbers } from "./actions";

export const metadata = {
  title: "Rich Messaging Channels | Antigravity",
};

export default async function ChannelsPage() {
  const numbers = await getOrganizationNumbers();

  return <ChannelsClient numbers={numbers} />;
}
