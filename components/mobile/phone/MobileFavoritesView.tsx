"use client";

import { Star } from "lucide-react";
import { ContactListMobile } from "./ContactListMobile";
import { EmptyStateMobile } from "./EmptyStateMobile";
import { ScreenTitle } from "./ScreenTitle";
import { isFavoriteContact, type PhoneContact } from "./phone-utils";

/**
 * Onglet Favoris : contacts prioritaires (VIP / clients à forte valeur).
 * Adapté de l'onglet Favoris de l'app Téléphone. Si la notion de favori
 * explicite n'existe pas encore côté données, on dérive des contacts VIP
 * afin de rester branché sur la logique existante sans refactor backend.
 */
export function MobileFavoritesView({
  contacts,
  onCall,
  onSelect,
}: {
  contacts: PhoneContact[];
  onCall: (contact: PhoneContact) => void;
  onSelect?: (contact: PhoneContact) => void;
}) {
  const favorites = contacts.filter(isFavoriteContact);

  return (
    <div className="flex min-h-full flex-col">
      <ScreenTitle title="Favoris" />
      {favorites.length === 0 ? (
        <EmptyStateMobile
          icon={Star}
          title="Aucun favori"
          description="Vos contacts VIP et clients prioritaires apparaîtront ici pour un appel en un geste."
        />
      ) : (
        <div className="px-4 pb-6">
          <ContactListMobile contacts={favorites} onCall={onCall} onSelect={onSelect} grouped={false} />
        </div>
      )}
    </div>
  );
}
