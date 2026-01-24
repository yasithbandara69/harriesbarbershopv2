import { SquareClient, SquareEnvironment } from "square";

const isProduction = process.env.SQUARE_ENVIRONMENT === "production";

export const squareClient = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: isProduction ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
});

export const locationId = process.env.SQUARE_LOCATION_ID;

if (!process.env.SQUARE_ACCESS_TOKEN) {
  console.warn("Warning: SQUARE_ACCESS_TOKEN is not set in environment variables.");
}

if (!locationId) {
  console.warn("Warning: SQUARE_LOCATION_ID is not set in environment variables.");
}
