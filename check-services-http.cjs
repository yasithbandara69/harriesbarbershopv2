const https = require('https');
require('dotenv').config({ path: '.env.local' });

const options = {
  hostname: 'connect.squareup.com',
  port: 443,
  path: '/v2/catalog/search-catalog-items',
  method: 'POST',
  headers: {
    'Square-Version': '2024-03-20',
    'Authorization': 'Bearer ' + process.env.SQUARE_ACCESS_TOKEN,
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, res => {
  let data = '';
  res.on('data', d => { data += d; });
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      const items = parsed.items || [];
      items.forEach(i => {
         if(i.item_data && i.item_data.name && i.item_data.name.toLowerCase().includes('subscription')) {
             console.log(i.item_data.name, '=>', i.item_data.variations[0].id);
         }
      });
    } catch(e) { console.error(e); }
  });
});

req.write(JSON.stringify({ product_types: ['APPOINTMENTS_SERVICE'] }));
req.end();
