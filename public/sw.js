self.addEventListener('push', event => {
  let payload = {}

  try {
    payload = event.data
      ? event.data.json()
      : {}
  } catch {
    payload = {
      title: 'MarketHub',
      message: event.data?.text()
    }
  }

  const title =
    payload.title || 'MarketHub'

  const options = {
    body:
      payload.message ||
      'You have a new notification.',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    data: {
      url: payload.url || '/en/market-hub'
    }
  }

  event.waitUntil(
    self.registration.showNotification(
      title,
      options
    )
  )
})

self.addEventListener(
  'notificationclick',
  event => {
    event.notification.close()

    const url =
      event.notification.data?.url ||
      '/en/market-hub'

    event.waitUntil(
      clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      }).then(windowClients => {
        const existingClient =
          windowClients.find(client =>
            client.url.includes(url)
          )

        if (existingClient) {
          existingClient.focus()
          return
        }

        return clients.openWindow(url)
      })
    )
  }
)