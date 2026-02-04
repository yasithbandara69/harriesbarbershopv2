
const { SquareClient, SquareEnvironment } = require("square");
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const isProduction = process.env.SQUARE_ENVIRONMENT === "production";
const squareClient = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: isProduction ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
});

async function checkPrice() {
  const variationId = 'KBSCWFLBQ4XFOKLB3SI5HNWY';
  try {
    console.log(`Listing all catalog items...`);
    const response = await squareClient.catalog.list({ types: 'ITEM' });

    const objects = response.response ? response.response.objects : (response.result ? response.result.objects : []);

    if (objects) {
        console.log(`Found ${objects.length} items.`);
        objects.forEach(item => {
            console.log(`---`);
            console.log(`Item Name: ${item.itemData.name}`);
            console.log(`Item ID: ${item.id}`);
            if (item.itemData.variations) {
                item.itemData.variations.forEach(v => {
                    console.log(`  Variation Name: ${v.itemVariationData.name}`);
                    console.log(`  Variation ID: ${v.id}`);
                    console.log(`  Price: ${v.itemVariationData.priceMoney?.amount} ${v.itemVariationData.priceMoney?.currency}`);
                });
            }
        });
    } else {
        console.log("No items found.");
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

checkPrice();
