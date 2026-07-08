export async function check_availability(date: string, apiKey?: string, eventTypeId?: string) {
  // En production, on appellerait l'API Cal.com:
  // GET https://api.cal.com/v1/availability?apiKey={apiKey}&eventTypeId={eventTypeId}&dateFrom={date}&dateTo={date}
  
  // Pour l'instant, on simule une réponse pour que le flux vocal soit fonctionnel
  console.log(`[Scheduling] Vérification des dispos pour la date: ${date}`);
  
  // Simulation d'une recherche en base ou sur Cal.com
  const mockSlots = [
    { time: "09:00", available: true },
    { time: "10:30", available: true },
    { time: "14:00", available: true },
    { time: "15:30", available: true },
    { time: "17:00", available: true }
  ];

  // RÈGLE UX CEO: On ne renvoie que les 2 premiers créneaux pour éviter que l'IA ne sature le client
  const topSlots = mockSlots.slice(0, 2);

  return {
    success: true,
    date: date,
    message: `J'ai trouvé ${mockSlots.length} créneaux libres, voici les deux premiers: ${topSlots.map(s => s.time).join(' et ')}.`,
    slots: topSlots
  };
}

export async function book_appointment(date: string, time: string, name: string, phone: string, apiKey?: string, eventTypeId?: string) {
  // En production, appel à l'API Cal.com:
  // POST https://api.cal.com/v1/bookings
  
  console.log(`[Scheduling] Réservation confirmée pour ${name} le ${date} à ${time}. Tel: ${phone}`);

  // Simulation de réservation réussie
  return {
    success: true,
    bookingReference: `CAL-${Math.floor(Math.random() * 10000)}`,
    message: `Le rendez-vous est bien confirmé pour ${name} le ${date} à ${time}. Un SMS de confirmation sera envoyé au ${phone}.`
  };
}
