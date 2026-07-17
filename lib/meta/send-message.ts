export async function sendMetaMessage(
  recipientId: string, 
  text: string, 
  pageAccessToken: string,
  provider: string = "FACEBOOK"
) {
  try {
    let url = `https://graph.facebook.com/v18.0/me/messages?access_token=${pageAccessToken}`;

    let payload: any = {
      messaging_type: "RESPONSE",
      recipient: {
        id: recipientId
      },
      message: {
        text: text
      }
    };

    // Note: If WhatsApp, the payload and URL are different
    // https://graph.facebook.com/v18.0/{PHONE_NUMBER_ID}/messages
    // For now, this assumes standard Messenger/Instagram Graph API structure.
    // When WhatsApp is fully integrated via Embedded Signup, this function
    // should branch based on the `provider` param to send WhatsApp Cloud API payload.

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    if (data.error) {
      console.error("Erreur d'envoi Meta API:", data.error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Erreur critique d'envoi Meta:", error);
    return false;
  }
}
