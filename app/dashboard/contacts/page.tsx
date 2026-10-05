import { getContacts, getContactGroups } from "./actions";
import { ContactsClient } from "./ContactsClient";

export const metadata = {
  title: "Contacts | Buster Call",
};

export default async function ContactsPage() {
  const contacts = await getContacts();
  const groups = await getContactGroups();

  return (
    <ContactsClient 
      initialContacts={JSON.parse(JSON.stringify(contacts))} 
      initialGroups={JSON.parse(JSON.stringify(groups))} 
    />
  );
}
