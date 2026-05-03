import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = createAdminClient()
  
  if (!supabase) {
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }

  try {
    // Check if respawn is needed
    const { data: shouldRespawn } = await supabase
      .rpc('should_respawn_coins')

    if (!shouldRespawn) {
      return NextResponse.json({ 
        message: 'Coins already respawned today',
        nextRespawn: getNextRespawnTime()
      })
    }

    // Generate new daily coins
    const { data: batchId } = await supabase
      .rpc('generate_daily_coins')

    return NextResponse.json({ 
      message: 'Daily coins respawned successfully',
      batchId,
      nextRespawn: getNextRespawnTime()
    })
  } catch (error) {
    console.error('Daily respawn error:', error)
    return NextResponse.json({ error: 'Failed to respawn coins' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = createAdminClient()
  
  if (!supabase) {
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }

  try {
    // Force respawn (for testing or manual trigger)
    const { data: batchId } = await supabase
      .rpc('generate_daily_coins')

    return NextResponse.json({ 
      message: 'Daily coins force respawned',
      batchId,
      nextRespawn: getNextRespawnTime()
    })
  } catch (error) {
    console.error('Force respawn error:', error)
    return NextResponse.json({ error: 'Failed to respawn coins' }, { status: 500 })
  }
}

// Helper function to get next respawn time (midnight Paraguay time)
function getNextRespawnTime(): string {
  const now = new Date()
  
  // Convert to Paraguay timezone (GMT-4)
  const paraguayTime = new Date(now.getTime() - (4 * 60 * 60 * 1000))
  
  // Get tomorrow's date in Paraguay time
  const tomorrow = new Date(paraguayTime)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  
  // Convert back to UTC for response
  const nextRespawnUTC = new Date(tomorrow.getTime() + (4 * 60 * 60 * 1000))
  
  return nextRespawnUTC.toISOString()
}
