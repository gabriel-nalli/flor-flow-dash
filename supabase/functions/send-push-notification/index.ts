import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const VAPID_PUBLIC_KEY = 'BOigPuMKj1-eY6UyAlZuZxc5lrwE4VuL6BlqbQdy7U_N7FzuiSOcacAPI20fpynCNXhTUdxRATTeT_jdQZFBJMk'
const VAPID_EMAIL = 'mailto:gabrielnalli70@gmail.com'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { lead_id, lead_nome } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
    if (!vapidPrivateKey) {
      throw new Error('VAPID_PRIVATE_KEY not set in Edge Function Secrets')
    }

    webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, vapidPrivateKey)

    // Fetch subscriptions for VENDEDORA and SDR roles
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth, user_id, profiles!inner(role)')

    if (subError) throw subError

    // Filter by role in JS (safer than relying on PostgREST join filter)
    const filtered = (subscriptions ?? []).filter((row: any) =>
      row.profiles?.role === 'VENDEDORA' || row.profiles?.role === 'SDR'
    )

    if (!filtered.length) {
      return new Response(JSON.stringify({ ok: true, sent: 0, reason: 'no subscribers' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const payload = JSON.stringify({
      title: 'Novo lead disponível!',
      body: lead_nome ? `Nome: ${lead_nome}` : 'Um novo lead está aguardando atendimento.',
      url: '/leads',
    })

    const results = await Promise.allSettled(
      filtered.map((row: any) =>
        webpush.sendNotification(
          { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
          payload
        )
      )
    )

    const sent = results.filter((r) => r.status === 'fulfilled').length
    const failed = results
      .filter((r) => r.status === 'rejected')
      .map((r: any) => r.reason?.message)

    return new Response(JSON.stringify({ ok: true, sent, total: filtered.length, failed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
