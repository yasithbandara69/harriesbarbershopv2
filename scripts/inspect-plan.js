const { Client, Environment } = require("square");
const path = require("path");
const fs = require("fs");

try {
  // Load environment variables manually
  const envPath = path.resolve(__dirname, "../.env.local");
  console.log("Reading env from:", envPath);
  const envContent = fs.readFileSync(envPath, "utf-8");
  const envConfig = {};
  envContent.split("\n").forEach((line) => {
    const parts = line.split("=");
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join("=").trim();
      if (key && value) {
        envConfig[key] = value;
      }
    }
  });

  if (!envConfig.SQUARE_ACCESS_TOKEN) {
      throw new Error("SQUARE_ACCESS_TOKEN not found in .env.local");
  }

  const client = new Client({
    accessToken: envConfig.SQUARE_ACCESS_TOKEN,
    environment: Environment.Production, 
  });

  async function inspectPlan(planId) {
    try {
      console.log(`Fetching Plan ID: ${planId}...`);
      const response = await client.catalog.object.get({
          objectId: planId
      });
      
      const data = JSON.parse(JSON.stringify(response.result || response.body || response, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
      ));

      if (data.object) {
          console.log("Plan Details:");
          console.log(JSON.stringify(data.object, null, 2));
      } else {
          console.log("Plan Object Not Found in response:", JSON.stringify(data, null, 2));
      }

    } catch (error) {
      console.error("Error fetching plan:", error);
    }
  }

  // Gold Haircut Subscription ID
  const PLAN_ID = "KBSCWFLBQ4XFOKLB3SI5HNWY"; 
  inspectPlan(PLAN_ID);

} catch (err) {
  console.error("Script setup error:", err);
}
