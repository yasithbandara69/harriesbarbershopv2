require('dotenv').config({ path: '.env.local' });
const { Client, Environment } = require('square');

const client = new Client({
    accessToken: process.env.SQUARE_ACCESS_TOKEN,
    environment: Environment.Production
});

async function run() {
    try {
        const res = await client.catalogApi.searchCatalogItems({
            productTypes: ['APPOINTMENTS_SERVICE']
        });
        const items = res.result.items || [];
        items.forEach(i => {
            console.log(i.itemData?.name, i.itemData?.variations?.[0]?.id);
        });
    } catch(e) {
        console.error(e);
    }
}
run();
