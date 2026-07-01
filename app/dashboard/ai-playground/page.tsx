import { auth } from "@/auth";
import PlaygroundClient from "./PlaygroundClient";

export default async function PlaygroundPage() {
  await auth();
  return <PlaygroundClient />;
}
