import { getSimCards, getSimCardGroups, purchaseEsim, getEsimActivationCode } from '../lib/telnyx-esim';

async function main() {
  console.log("=== Testing Telnyx eSIM SDK Integration ===");
  
  console.log("\n[1] Fetching SIM Cards...");
  const sims = await getSimCards();
  console.log("SIM Cards Result:", JSON.stringify(sims, null, 2));

  console.log("\n[2] Fetching SIM Card Groups...");
  const groups = await getSimCardGroups();
  console.log("SIM Card Groups Result:", JSON.stringify(groups, null, 2));

  // Commented out to prevent accidental purchases
  // console.log("\n[3] Purchasing an eSIM...");
  // const purchase = await purchaseEsim(1);
  // console.log("Purchase Result:", JSON.stringify(purchase, null, 2));
  
  if (sims.success && sims.data && sims.data.length > 0) {
    const firstSim = sims.data[0];
    if (firstSim.type === 'esim') {
      console.log(`\n[4] Fetching Activation Code for eSIM ${firstSim.iccid}...`);
      const qrCode = await getEsimActivationCode(firstSim.id);
      console.log("Activation Code Result:", JSON.stringify(qrCode, null, 2));
    } else {
      console.log(`\n[4] Skipping activation code fetch, first SIM is physical (ICCID: ${firstSim.iccid})`);
    }
  }

  console.log("\n=== Done ===");
}

main().catch(console.error);
