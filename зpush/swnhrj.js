"use strict";

function showNotification(notice) {
    return self.registration.showNotification(notice.title, {
        body: notice.body || '',
        icon: notice.icon || undefined,
        image: notice.image || undefined,
        imageUrl: notice.image || undefined,
        vibrate: notice.vibrate || true,
        badge: notice.badge || undefined,
        sound: notice.sound || undefined,
        sticky: notice.sticky || true,
        requireInteraction: notice.requireInteraction || true,
        actions: notice.actions || [],
        data: {
            url: notice.url,
            eventUrl: notice.eventUrl || '/'
        },
        renotify: notice.renotify || false,
        tag: notice.tag || 'id1'
    });
}

self.addEventListener("install", function (t) {
    t.waitUntil(self.skipWaiting());
});

self.addEventListener("push", function (event) {
    var push = event.data.json(),
        chain = [];

    if (push.type === 'ad') {
        chain.push(showNotification(push));
    }

    if (push.type === 'ping') {
        var PingPromise = fetch(push.pingUrl).then(function (response) {
            var contentType = response.headers.get("content-type");
            return contentType && contentType.indexOf("application/json") !== -1 ? response.json() : response.text();
        }).then(function (json) {
            return json.type === 'ad' ? showNotification(json) : null;
        });

        chain.push(PingPromise);
    }
    event.waitUntil(Promise.all(chain));
});

self.addEventListener('notificationclick', function (event) {
    var chain = [],
        noticeData = event.notification.data;

    chain.push(clients.openWindow(noticeData.url));
    event.notification.close();
    event.waitUntil(Promise.all(chain));
});

self.addEventListener('notificationclose', function (event) {
    var chain = [],
        noticeData = event.notification.data;

    if (noticeData) {
        chain.push(fetch(noticeData.eventUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                event_id: 'notificationclose'
            })
        }));
    }

    event.waitUntil(Promise.all(chain));
});
