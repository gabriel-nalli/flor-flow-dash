import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'

const EDGE_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export function usePushNotifications() {
  const isSupported = typeof window !== 'undefined' && 'PushManager' in window && 'serviceWorker' in navigator

  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isSupported) return
    navigator.serviceWorker.ready.then((reg) =>
      reg.pushManager.getSubscription().then((sub) => setIsSubscribed(!!sub))
    )
  }, [isSupported])

  const subscribe = useCallback(async () => {
    if (!isSupported) return
    setLoading(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return

      // Fetch VAPID public key
      const keyRes = await fetch(`${EDGE_BASE}/get-vapid-public-key`)
      const { publicKey } = await keyRes.json()

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
      await fetch(`${EDGE_BASE}/save-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          apikey: anonKey,
        },
        body: JSON.stringify({ subscription: sub.toJSON(), user_id: session.user.id }),
      })

      setIsSubscribed(true)
    } finally {
      setLoading(false)
    }
  }, [isSupported])

  const unsubscribe = useCallback(async () => {
    if (!isSupported) return
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await sub.unsubscribe()
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          await supabase.from('push_subscriptions').delete().eq('user_id', session.user.id)
        }
      }
      setIsSubscribed(false)
    } finally {
      setLoading(false)
    }
  }, [isSupported])

  return { isSupported, isSubscribed, subscribe, unsubscribe, loading }
}
