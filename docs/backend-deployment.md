# Backend Deployment

The FastAPI backend is ready for Docker, Render, and Railway-style deployments.

## Required Environment Variables

Set these in the hosting provider dashboard. Do not commit production secrets.

```env
DATABASE_URL=postgresql://postgres.optghlauklftecyjowqa:<password>@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
SECRET_KEY=<long-random-secret>
DEMO_MODE=false
SUPABASE_URL=https://optghlauklftecyjowqa.supabase.co
SUPABASE_PUBLISHABLE_KEY=<publishable-key>
```

The app automatically converts Supabase Postgres URLs to SQLAlchemy's
`postgresql+psycopg://` driver format and adds `sslmode=require`.

## Render

1. Connect the repo in Render.
2. Use the included `render.yaml` blueprint, or create a Web Service manually.
3. If configuring manually:
   - Root directory: `backend`
   - Build command: `pip install -r requirements.txt`
   - Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Health check path: `/health`
4. Add the environment variables above.

## Railway

Railway can use the included `railway.json` and `backend/Dockerfile`.

Required variables are the same as above. Railway provides `PORT`
automatically; the Dockerfile reads it at runtime.

## Docker

From the project root:

```bash
docker build -f backend/Dockerfile -t farm2market-api ./backend
docker run --env-file .env -p 8000:8000 farm2market-api
```

Then verify:

```bash
curl http://localhost:8000/health
```

