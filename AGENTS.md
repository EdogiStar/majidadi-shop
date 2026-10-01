# AGENTS.md

## Project

Majidadi General Services is an e-commerce shop for phones, laptops, stationery,
books, and other general merchandise.

- **Business name:** Majidadi General Services
- **Address:** Shop No. 2, Opposite Sunset, Along Abaji Area Council, FCT Abuja

## Repository structure

- `frontend/` contains the React, Vite, and TypeScript application.
- `backend/` contains the Node.js, Express, and TypeScript REST API.
- The frontend communicates with the backend through REST APIs.
- Supabase provides authentication and PostgreSQL data storage.

## Technology and integrations

- **Frontend:** React + Vite + TypeScript; deploy to Vercel.
- **Backend:** Node.js + Express + TypeScript; deploy to Render.
- **Database:** Supabase PostgreSQL with Row Level Security (RLS) enabled.
- **Authentication:** Supabase Auth, including Google OAuth through Supabase.
- **Payments:** Paystack. Secret operations must run only in the backend.
- **Transactional email:** Mailgun, to be added later.

The Supabase project already exists, Google OAuth is configured, and Paystack
Test Mode is ready. Production deployment will happen later. Do not invent
credentials or configuration values.

## Coding and security rules

- Use TypeScript and prefer simple, readable, maintainable code.
- Avoid over-engineering, unnecessary abstractions, and unnecessary dependencies.
- Do not introduce classes or design patterns unless they solve a real problem.
- Keep components reasonably small and focused.
- Separate business logic from HTTP/controller logic where appropriate.
- Validate user input on the backend and handle errors consistently.
- Use environment variables for secrets and configuration.
- Never hardcode or expose API keys, passwords, tokens, or other secrets.
- Never commit `.env` files or secret credentials.
- Keep authentication and authorization explicit.
- Protect admin-only operations on the backend.
- Customers may access only their own private data and orders.
- Respect Supabase RLS; never disable it as a shortcut.
- Apply secure coding practices throughout the application.
- Do not modify existing configuration unnecessarily.

## Development workflow

1. Inspect the existing project structure and understand the implementation
   before changing it.
2. Make small, focused changes that address the requested work.
3. Follow existing patterns, naming, formatting, and configuration.
4. Briefly explain important architectural decisions.
5. Run the appropriate tests, build, and type checks after meaningful changes.
6. Do not silently change unrelated files or create unrequested features.
7. Never replace working code with generated code without understanding it.

When implementing backend integrations, keep Paystack secret-key operations
server-side and keep frontend configuration limited to values that are safe to
expose. Mailgun configuration should be added only when that feature is
implemented.