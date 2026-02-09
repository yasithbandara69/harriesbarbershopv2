const { SquareClient, SquareEnvironment } = require('square');

const client = new SquareClient({
  token: 'MST_ACCESS_TOKEN', // Dummy token just for structure inspection
  environment: SquareEnvironment.Production,
});

console.log("Client keys:", Object.keys(client));
if (client.catalog) {
    console.log("client.catalog keys:", Object.keys(client.catalog));
    console.log("client.catalog prototype keys:", Object.getOwnPropertyNames(Object.getPrototypeOf(client.catalog)));
}
if (client.catalog.object) {
    console.log("client.catalog.object keys:", Object.keys(client.catalog.object));
    console.log("client.catalog.object prototype keys:", Object.getOwnPropertyNames(Object.getPrototypeOf(client.catalog.object)));
}
