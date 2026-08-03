'use client'

function urlBase64ToUint8Array(
  base64String: string
) {
  const padding =
    '='.repeat(
      (4 - base64String.length % 4) % 4
    )

  const base64 = (
    base64String + padding
  )
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)

  return Uint8Array.from(
    [...rawData].map(
      character =>
        character.charCodeAt(0)
    )
  )
}

export async function subscribeToPush() {
  console.log('subscribeToPush()')

  if (
    !('serviceWorker' in navigator) ||
    !('PushManager' in window)
  ) {
    throw new Error(
      'Push notifications are not supported.'
    )
  }

  const permission =
    await Notification.requestPermission()

  if (permission !== 'granted') {
    throw new Error(
      'Notification permission was not granted.'
    )
  }

  const registration =
    await navigator.serviceWorker.register(
      '/sw.js'
    )

  await navigator.serviceWorker.ready

  let subscription =
    await registration.pushManager
      .getSubscription()

  if (!subscription) {
    const publicKey =
      process.env
        .NEXT_PUBLIC_VAPID_PUBLIC_KEY

    if (!publicKey) {
      throw new Error(
        'Missing public VAPID key.'
      )
    }

    subscription =
      await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey:
          urlBase64ToUint8Array(publicKey)
      })
  }

  return subscription
}

export async function unsubscribeFromPush() {
  const registration =
    await navigator.serviceWorker.ready

  const subscription =
    await registration.pushManager
      .getSubscription()

  if (!subscription) {
    return null
  }

  const endpoint = subscription.endpoint

  await subscription.unsubscribe()

  return endpoint
}