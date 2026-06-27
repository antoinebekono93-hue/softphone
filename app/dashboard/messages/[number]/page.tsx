import { ChatClient } from "./ChatClient";

export default async function MessageThreadPage({ params }: { params: { number: string } }) {
  const decodedNumber = decodeURIComponent(params.number);

  return (
    <ChatClient contactNumber={decodedNumber} />
  );
}
