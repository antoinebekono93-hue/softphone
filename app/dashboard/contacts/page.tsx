import { getContacts } from "./actions";
import { ContactsClient } from "./ContactsClient";

export const metadata = {
  title: "Contacts | Antigravity",
};

export default async function ContactsPage() {
  const contacts = await getContacts();

  return <ContactsClient initialContacts={contacts} />;
}
