import { ChatClient } from "./ChatClient";

export default async function MessageThreadPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const decodedNumber = decodeURIComponent(number);

  return (
    <ChatClient contactNumber={decodedNumber} />
  );
}
