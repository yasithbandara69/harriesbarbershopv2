# Harrie's Barbershop Booking App

This project uses Next.js and the Square Appointments API to create a custom booking flow.

## Getting Started

### 1. Prerequisites
- Node.js (v18+)
- A Square Developer Account (https://developer.squareup.com)

### 2. Environment Setup
Create a file named `.env.local` in the root directory and add your Square credentials:

```bash
SQUARE_ACCESS_TOKEN=your_access_token_here
SQUARE_LOCATION_ID=your_location_id_here
SQUARE_ENVIRONMENT=sandbox
```
*(Use `production` for live data)*

### 3. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure
- `app/book/page.tsx`: The main booking wizard logic.
- `app/actions.ts`: Server actions for interacting with Square API.
- `lib/square.ts`: Square client initialization.

## Features
- **Barber Selection**: Lists staff members.
- **Service Selection**: Lists available services from Square Catalog.
- **Availability Search**: Finds open slots for the selected staff and service.
- **Booking Creation**: Creates a new appointment and customer profile (if needed).
