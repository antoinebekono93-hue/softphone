import { getContacts, getContactGroups } from "./actions";
import { ContactsClient } from "./ContactsClient";

export const metadata = {
  title: "Contacts | Antigravity",
};

export default async function ContactsPage() {
  const contacts = await getContacts();
  const groups = await getContactGroups();

  return <ContactsClient initialContacts={contacts} initialGroups={groups} />;
}
