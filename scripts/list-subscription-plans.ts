
import { squareClient } from '../lib/square';

async function listPlans() {
  try {
    console.log("Listing Subscription Plans...");
    const response = await squareClient.catalog.listCatalog(undefined, 'SUBSCRIPTION_PLAN');
    
    if (response.result.objects) {
      response.result.objects.forEach(obj => {
        console.log(`Plan Name: ${obj.subscriptionPlanData?.name}`);
        console.log(`ID: ${obj.id}`);
        console.log('---');
      });
    } else {
      console.log("No subscription plans found.");
    }
  } catch (error) {
    console.error("Error listing plans:", error);
  }
}

listPlans();
