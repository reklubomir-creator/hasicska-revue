self.addEventListener("push", event => {
  let message;
  try { message = event.data.json(); } catch { return; }
  if (typeof message?.id !== "string" || message.id.length > 160) return;
  event.waitUntil(self.registration.showNotification("Hasičská revue", {
    body: "Máš nový pokyn nebo zprávu. Otevři přehled jednotky.",
    icon: new URL("jednotka-ikona-192.png", self.registration.scope).href,
    tag: message.id,
    renotify: false,
    data: { id:message.id }
  }));
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const target = new URL("jednotka.html", self.registration.scope);
  if (event.notification.data?.id) {
    target.hash = new URLSearchParams({zprava:event.notification.data.id}).toString();
  }
  event.waitUntil((async () => {
    const windows = await clients.matchAll({type:"window",includeUncontrolled:true});
    const unitWindow = windows.find(window => {
      const url = new URL(window.url);
      return url.origin === target.origin && url.pathname === target.pathname;
    });
    if (unitWindow) {
      unitWindow.postMessage({type:"showUnitNotice",id:event.notification.data?.id});
      return unitWindow.focus();
    }
    return clients.openWindow(target.href);
  })());
});
