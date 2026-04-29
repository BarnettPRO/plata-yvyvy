# 🥇 Plata Yvyvy

PWA de geolocalización para recolectar monedas guaraníes por todo Paraguay.
Stack: **Next.js 14** · **Supabase** · **Vercel** · **GitHub**

---

## 🚀 Setup en 5 pasos

### 1. Clonar y instalar

```bash
git clone https://github.com/TU-USUARIO/plata-yvyvy.git
cd plata-yvyvy
npm install
```

### 2. Crear proyecto en Supabase

1. Ir a [supabase.com](https://supabase.com) → New project
2. Copiar **Project URL** y **anon key** desde Settings → API
3. Copiar también el **service_role key**
4. En el SQL Editor, ejecutar el archivo `supabase/migrations/001_initial.sql`
5. En Authentication → Providers: habilitar **Email** y **Google**

### 3. Variables de entorno

```bash
cp .env.local.example .env.local
# Editar .env.local con tus keys de Supabase
```

### 4. Correr localmente

```bash
npm run dev
# Abre http://localhost:3000
```

### 5. Deploy a Vercel

1. Subir a GitHub: `git push origin main`
2. Ir a [vercel.com](https://vercel.com) → Import project
3. Seleccionar el repo
4. Agregar las variables de entorno en Vercel → Settings → Environment Variables
5. ¡Deploy automático! 🎉

---

## 📁 Estructura clave

```
app/
  api/coins/         → GET coins cercanas, POST recolectar
  api/ranking/       → GET top 50 jugadores
  map/               → Página principal del juego
  login/             → Auth con magic link o Google
  profile/           → Perfil + código de referido
  ranking/           → Tabla global

lib/
  supabase/          → Clientes browser/server
  game/              → Lógica de monedas, XP, logros
  geo/               → Distancia Haversine

supabase/
  migrations/001_initial.sql   → Schema completo + RLS
```

## 🔑 Variables de entorno requeridas

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública (safe para client) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave privada (solo server-side) |

---

## 🎮 Cómo funciona

- El usuario abre el mapa → GPS detecta su posición
- `/api/coins` consulta monedas cercanas en Postgres; si hay menos de 5, genera nuevas
- Las monedas tienen TTL de 30 minutos y desaparecen vía Supabase Realtime
- Al recolectar, `/api/coins/collect` valida proximidad (≤50m) y actualiza XP
- El ranking se actualiza en tiempo real vía Supabase Realtime subscription
