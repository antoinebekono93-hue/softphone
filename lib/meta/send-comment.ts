export async function sendMetaCommentReply(
  commentId: string, 
  text: string, 
  pageAccessToken: string,
  mode: "PUBLIC" | "PRIVATE" = "PUBLIC"
) {
  try {
    let url = "";
    let payload: any = {};

    if (mode === "PUBLIC") {
      // Replying publicly to the comment
      url = `https://graph.facebook.com/v18.0/${commentId}/comments?access_token=${pageAccessToken}`;
      payload = {
        message: text
      };
    } else {
      // Replying privately to the user via Messenger
      url = `https://graph.facebook.com/v18.0/${commentId}/private_replies?access_token=${pageAccessToken}`;
      payload = {
        message: text
      };
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    if (data.error) {
      console.error(`Erreur d'envoi Meta API (Mode: ${mode}):`, data.error);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Erreur critique d'envoi Meta Commentaire (${mode}):`, error);
    return false;
  }
}
