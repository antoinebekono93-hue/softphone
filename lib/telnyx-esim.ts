'use server';

import { getConfiguredTelnyxClient } from '@/lib/telnyx';

// ----------------------------------------------------------------------
// TYPES & ENUMS
// ----------------------------------------------------------------------

export type EsimStatus = 'enabled' | 'disabled' | 'standby';

// ----------------------------------------------------------------------
// GET SIM CARDS (Inventaire)
// ----------------------------------------------------------------------
export async function getSimCards(params: any = {}) {
  try {
    const client = await getConfiguredTelnyxClient();
    // Default sort by created_at desc (if supported) or we just list them
    const response = await client.simCards.list(params);
    // Since it's an async iterator/PagePromise, we must collect the results
    const sims = [];
    for await (const sim of response) {
      sims.push(sim);
    }
    return { success: true, data: sims };
  } catch (error: any) {
    console.error('getSimCards error:', error.message || error);
    return { success: false, error: error.message || String(error) };
  }
}

// ----------------------------------------------------------------------
// GET SIM CARD GROUPS
// ----------------------------------------------------------------------
export async function getSimCardGroups(params: any = {}) {
  try {
    const client = await getConfiguredTelnyxClient();
    const response = await client.simCardGroups.list(params);
    const groups = [];
    for await (const group of response) {
      groups.push(group);
    }
    return { success: true, data: groups };
  } catch (error: any) {
    console.error('getSimCardGroups error:', error.message || error);
    return { success: false, error: error.message || String(error) };
  }
}

// ----------------------------------------------------------------------
// PURCHASE NEW ESIM
// ----------------------------------------------------------------------
export async function purchaseEsim(amount: number = 1, sim_card_group_id?: string) {
  try {
    const client = await getConfiguredTelnyxClient();
    const payload: any = { amount };
    if (sim_card_group_id) {
      payload.sim_card_group_id = sim_card_group_id;
    }
    
    // As per telnyx api: POST /v2/actions/purchase/esims
    // Using the sdk method
    const purchaseResponse = await client.actions.purchase.create(payload);
    return { success: true, data: purchaseResponse.data };
  } catch (error: any) {
    console.error('purchaseEsim error:', error.message || error);
    return { success: false, error: error.message || String(error) };
  }
}

// ----------------------------------------------------------------------
// GET ESIM ACTIVATION CODE (QR)
// ----------------------------------------------------------------------
export async function getEsimActivationCode(simId: string) {
  try {
    const client = await getConfiguredTelnyxClient();
    const response = await client.simCards.getActivationCode(simId);
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('getEsimActivationCode error:', error.message || error);
    return { success: false, error: error.message || String(error) };
  }
}

// ----------------------------------------------------------------------
// UPDATE SIM CARD (Data Limit, Status, etc)
// ----------------------------------------------------------------------
export async function updateSimCard(simId: string, updates: any) {
  try {
    const client = await getConfiguredTelnyxClient();
    const response = await client.simCards.update(simId, updates);
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('updateSimCard error:', error.message || error);
    return { success: false, error: error.message || String(error) };
  }
}

// ----------------------------------------------------------------------
// ENABLE / DISABLE / STANDBY (Actions)
// ----------------------------------------------------------------------
export async function setSimCardStatus(simId: string, status: EsimStatus) {
  try {
    const client = await getConfiguredTelnyxClient();
    let response;
    if (status === 'enabled') {
      response = await client.simCards.actions.enable(simId);
    } else if (status === 'disabled') {
      response = await client.simCards.actions.disable(simId);
    } else if (status === 'standby') {
      response = await client.simCards.actions.setStandby(simId);
    }
    return { success: true, data: response?.data };
  } catch (error: any) {
    console.error('setSimCardStatus error:', error.message || error);
    return { success: false, error: error.message || String(error) };
  }
}

// ----------------------------------------------------------------------
// SET DATA USAGE NOTIFICATION ALERTS
// ----------------------------------------------------------------------
export async function createDataUsageNotification(simId: string, amount: string, unit: 'MB'|'GB') {
  try {
    const client = await getConfiguredTelnyxClient();
    const payload = {
      sim_card_id: simId,
      threshold: { amount, unit }
    };
    const response = await client.simCardDataUsageNotifications.create(payload);
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('createDataUsageNotification error:', error.message || error);
    return { success: false, error: error.message || String(error) };
  }
}
