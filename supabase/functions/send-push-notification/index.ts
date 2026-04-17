import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

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

    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!
    const vapidEmail = Deno.env.get('VAPID_EMAIL')!

    webpush.setVapidDetails(`mailto:${vapidEmail}`, vapidPublicKey, vapidPrivateKey)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Fetch all subscriptions for VENDEDORA and SDR
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('subscription, user_id, profiles!inner(role)')
      .in('profiles.role', ['VENDEDORA', 'SDR'])

    if (error) throw error
    if (!subscriptions?.length) {
      return new Response(JSON.stringify({ ok: true, sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const payload = JSON.stringify({
      title: 'Novo lead disponível!',
      body: lead_nome ? `Nome: ${lead_nome}` : 'Um novo lead está aguardando atendimento.',
      url: '/leads',
    })

    const results = await Promise.allSettled(
      subscriptions.map((row) => webpush.sendNotification(row.subscription, payload))
    )

    const sent = results.filter((r) => r.status === 'fulfilled').length

    return new Response(JSON.stringify({ ok: true, sent, total: subscriptions.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
