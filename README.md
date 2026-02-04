# FreshSaver

FreshSaver is an AI co-pilot for grocery store operators. Instead of forcing busy managers through dense dashboards, the app listens for natural-language prompts such as "Milk is expiring" and materializes the exact UI needed to act—charts, sliders, and workflows appear only when relevant.

## Key Features

- **WasteRiskAnalyzer**: Highlights imminent spoilage with a loss forecast calculated from the mock inventory data and rendered through a red bar chart for rapid triage.
- **FlashSaleBuilder**: Suggests targeted flash sales with a discount slider that recomputes recovered revenue in real time and offers a ready-to-share WhatsApp call-to-action.
- **FoodBankCard**: Provides a fall-back donation plan when stock is beyond recovery, surfacing local charity pickups inside the same conversational thread.
- **Conversational Generative UI**: Built with the Tambo SDK so every component can be summoned, dissolved, and reconfigured by simple chat turns.

## Architecture Overview

- **Frontend**: Next.js App Router + React Server Components for routing, with Tailwind CSS for styling.
- **AI UI Engine**: Tambo SDK orchestrates component lifecycles and state across the chat-first interface.
- **Visualization**: Recharts powers the waste and recovery charts inside the WasteRiskAnalyzer experience.
- **Data Layer**: Mock data in `src/data/inventory.json` emulates inventory records from recognizable Indian SKUs.

## Getting Started

1. Clone this repository and install dependencies with `npm install`.
2. Copy `example.env.local` to `.env.local` and set `NEXT_PUBLIC_TAMBO_API_KEY` (via `npx tambo init` or manual entry).
3. Launch the development server with `npm run dev` and open `http://localhost:3000`.
4. Open the chat interface and try prompts describing near-expiry stock to activate the generated workflows.

## Development Workflow

- **Tech Stack**: TypeScript, Next.js, Tailwind CSS, Tambo SDK, and Recharts.
- **Code Organization**: Conversational UI components live under `src/components/tambo`; shared utilities and hooks sit in `src/lib` and `src/services`.
- **Testing**: Run `npm run lint` for lint checks. Add component-specific tests under `src/__tests__` (not yet included) as you expand coverage.

## Product Narrative

1. **Trigger**: A store lead reports, "I have 50 cartons of Amul Milk expiring in 2 days."
2. **Analyze**: WasteRiskAnalyzer consults the inventory dataset, calculates the ₹3,600 loss, and raises a red alert chart.
3. **Act**: FlashSaleBuilder offers a flash-sale plan, tying discount adjustments directly to projected revenue recovery.
4. **Pivot**: If the user replies "Actually, it's spoiled," the sale UI dissolves and the FoodBankCard component surfaces donation logistics.

## Roadmap Snapshot

- Add automated alerts for forecasted waste before the user prompts.
- Integrate real inventory APIs and retail ERPs to replace the mock dataset.
- Layer in team collaboration so multiple store associates can share the same context.

FreshSaver builds on the Tambo analytics template; explore [https://tambo.co/docs](https://tambo.co/docs) for deeper component registration and orchestration guidance.
