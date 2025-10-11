/* push.js - registers service worker, asks for notification permission, subscribes and posts subscription to server */
(async function(){
  if(!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  try{
    const reg = await navigator.serviceWorker.register('assets/pwa/sw.js');
    console.log('SW registered', reg);
    // Manifest is linked elsewhere; request permission
    const permission = await Notification.requestPermission();
    if(permission !== 'granted'){ console.log('Notifications permission not granted'); return; }
    // Ask server for VAPID public key or use default placeholder stored in window.VAPID_PUBLIC
    let vapidPublic = window.VAPID_PUBLIC || null;
    if(!vapidPublic){
      // try fetch /vapidPublic (not implemented) - for demo skip subscription
      console.log('No VAPID public key available on client; you may set window.VAPID_PUBLIC or implement server endpoint.');
    }
    // Subscribe (if key is present). In many setups, server returns base64 public VAPID key.
    if(vapidPublic){
      const converted = urlBase64ToUint8Array(vapidPublic);
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: converted });
      console.log('Push subscription', sub);
      // send to server
      await fetch('/subscribe', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ subscription: sub }) });
    }
  } catch(e){
    console.warn('Push registration failed', e);
  }

  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
})();