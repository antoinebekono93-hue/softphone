"use server";

export async function saveTelnyxKey(_key: string) {
  return { error: "La clé Telnyx est gérée centralement dans God Mode et ne peut pas être définie par un compte client." };
}
