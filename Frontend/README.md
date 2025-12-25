# Frontend LAQQ (Vite + React)

Para levantar todo el stack en Docker usa los scripts de la raíz (`./scripts/dev-up.sh`). Si querés correr solo el frontend fuera de Docker:

```bash
cd Frontend
cp ../.env.example .env              # reutiliza VITE_API_BASE_URL
npm install
npm run dev -- --host --port ${FRONTEND_PORT:-3000}
```

Variables relevantes:
- `VITE_API_BASE_URL`: URL de la API (en Docker dev ya está seteada a `http://backend:8000`; fuera de Docker usar `http://localhost:8000`).
- `FRONTEND_PORT`: puerto del dev server (coordina con `CORS_ALLOWED_ORIGINS` del backend).

Tecnologías:
- Vite + React + TypeScript
- TailwindCSS + shadcn/ui

