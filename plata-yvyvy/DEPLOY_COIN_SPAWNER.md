# Deploy Coin Spawning Edge Function

## Option 1: Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI globally
npm install -g supabase

# Deploy the function
npx supabase functions deploy spawn-coins --project-ref anskelgrnddgcvcgxkcf

# Set up the cron schedule
# Go to Supabase Dashboard > Database > SQL Editor
# Run the contents of: supabase/functions/spawn-coins/schedule.sql
```

## Option 2: Manual Deployment via Dashboard

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard/project/anskelgrnddgcvcgxkcf

2. **Create Edge Function**:
   - Navigate to Edge Functions
   - Click "Create Function"
   - Name: `spawn-coins`
   - Copy the contents of `supabase/functions/spawn-coins/index.ts`

3. **Set Environment Variables**:
   - `SUPABASE_URL`: https://anskelgrnddgcvcgxkcf.supabase.co
   - `SUPABASE_SERVICE_ROLE_KEY`: Get from Settings > API

4. **Set Up Cron Schedule**:
   - Go to Database > SQL Editor
   - Run the contents of `supabase/functions/spawn-coins/schedule.sql`

## Function Details

- **Endpoint**: https://anskelgrnddgcvcgxkcf.supabase.co/functions/v1/spawn-coins
- **Method**: POST
- **Purpose**: Maintains 50 uncollected coins across Paraguay
- **Values**: 50, 100 (common), 500 (rare), 1000 (legendary)
- **Schedule**: Daily at 6am UTC
- **Trigger**: Also runs when map loads with 0 coins

## Testing

```bash
# Test the function
curl -X POST https://anskelgrnddgcvcgxkcf.supabase.co/functions/v1/spawn-coins \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## Verification

1. Check coins table: Should have 50 uncollected coins
2. Test map load: Should trigger spawn if 0 coins exist
3. Verify cron: Check logs for daily execution
