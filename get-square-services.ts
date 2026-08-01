import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function findMemberServices() {
    try {
        const { squareClient } = await import('./lib/square');
        console.log('Fetching all services...');
        const response = await squareClient.catalog.searchItems({
            productTypes: ["APPOINTMENTS_SERVICE"],
        });
        
        const result = response as any;
        const items = result.items || [];
        
        console.log('\n--- Found Member Services ---');
        items.forEach((item: any) => {
            const name = item.itemData?.name || '';
            if (name.toLowerCase().includes('member')) {
                const variation = item.itemData?.variations?.[0];
                if (variation) {
                    console.log(`Name: ${name}`);
                    console.log(`Variation ID: ${variation.id}`);
                    console.log(`Price: $${(variation.itemVariationData?.priceMoney?.amount || 0) / 100}`);
                    console.log('---------------------------');
                }
            }
        });
        
        console.log('Copy the specific Variation IDs above and we will add them to .env.local');
    } catch (e) {
        console.error(e);
    }
}

findMemberServices();
