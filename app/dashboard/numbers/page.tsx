import { getNumbers, getUsers } from "./actions";
import { NumbersClient } from "./NumbersClient";

export const metadata = {
  title: "Phone Numbers | Antigravity",
};

export default async function NumbersPage() {
  const [numbers, users] = await Promise.all([
    getNumbers(),
    getUsers()
  ]);

  return <NumbersClient initialNumbers={numbers} users={users} />;
}
