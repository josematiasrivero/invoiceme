## Workflow

- **To restart containers, always build first, then start** (minimal downtime): `docker compose build && docker compose up -d`. Never use `up --build` or `down && up`.
- Develop on feature branches — never commit directly to `main`.
