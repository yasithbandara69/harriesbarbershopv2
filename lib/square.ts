// @ts-ignore
const { SquareClient } = require("square");

const Client = SquareClient;

// Ensure Environment is available or default to strings
const Environment = {
  Production: "https://connect.squareup.com",
  Sandbox: "https://connect.squareupsandbox.com"
};

const isProduction = process.env.SQUARE_ENVIRONMENT === "production";

export const squareClient = new Client({
  token: process.env.SQUARE_ACCESS_TOKEN, // Note: SquareClient uses 'token', not 'accessToken' in some versions, check d.ts or runtime
  environment: isProduction ? Environment.Production : Environment.Sandbox,
});

export const locationId = process.env.SQUARE_LOCATION_ID;

if (!process.env.SQUARE_ACCESS_TOKEN) {
  console.warn("Warning: SQUARE_ACCESS_TOKEN is not set in environment variables.");
}

if (!locationId) {
  console.warn("Warning: SQUARE_LOCATION_ID is not set in environment variables.");
}
