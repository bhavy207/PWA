// Service Worker Registration
export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content available, prompt user to refresh
                  if (confirm('New version available! Refresh to update?')) {
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    });
  }
};

// PWA Install Prompt
export const setupInstallPrompt = () => {
  let deferredPrompt;
  let installButton = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('beforeinstallprompt fired');
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install button
    const installPrompt = document.querySelector('.install-prompt');
    if (installPrompt) {
      installPrompt.style.display = 'block';
    }
    
    // Trigger custom event
    window.dispatchEvent(new CustomEvent('pwaInstallable'));
  });

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to install prompt: ${outcome}`);
      
      if (outcome === 'accepted') {
        console.log('User accepted install prompt');
        window.dispatchEvent(new CustomEvent('pwaInstalled'));
      }
      
      deferredPrompt = null;
    }
  };

  // Listen for install button clicks
  window.addEventListener('pwaInstallClick', handleInstallClick);

  // Detect if app was installed
  window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    window.dispatchEvent(new CustomEvent('pwaInstalled'));
  });

  return {
    showInstallPrompt: () => deferredPrompt !== null,
    installApp: handleInstallClick
  };
};

// Push Notification Utilities
export const pushNotificationUtils = {
  // Check if push notifications are supported
  isSupported: () => {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  },

  // Check current permission status
  getPermissionStatus: () => {
    return Notification.permission;
  },

  // Request notification permission
  requestPermission: async () => {
    if (!pushNotificationUtils.isSupported()) {
      throw new Error('Push notifications are not supported');
    }

    const permission = await Notification.requestPermission();
    return permission;
  },

  // Subscribe to push notifications
  subscribe: async (vapidPublicKey) => {
    if (!pushNotificationUtils.isSupported()) {
      throw new Error('Push notifications are not supported');
    }

    const registration = await navigator.serviceWorker.ready;
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    });

    return subscription;
  },

  // Unsubscribe from push notifications
  unsubscribe: async () => {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      return true;
    }
    
    return false;
  },

  // Get existing subscription
  getSubscription: async () => {
    if (!pushNotificationUtils.isSupported()) {
      return null;
    }

    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  }
};

// Utility function to convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Cache Management
export const cacheUtils = {
  // Cache critical resources
  cacheCriticalResources: async () => {
    if ('caches' in window) {
      const cache = await caches.open('pwa-ecommerce-critical');
      const criticalUrls = [
        '/',
        '/offline.html',
        '/manifest.json'
      ];
      
      try {
        await cache.addAll(criticalUrls);
        console.log('Critical resources cached');
      } catch (error) {
        console.error('Failed to cache critical resources:', error);
      }
    }
  },

  // Clear old caches
  clearOldCaches: async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      const oldCaches = cacheNames.filter(name => 
        name.includes('pwa-ecommerce') && !name.includes('v1.0.0')
      );
      
      await Promise.all(oldCaches.map(name => caches.delete(name)));
      console.log('Old caches cleared');
    }
  }
};

// Network Status
export const networkUtils = {
  // Check if online
  isOnline: () => navigator.onLine,

  // Setup online/offline event listeners
  setupNetworkListeners: (onOnline, onOffline) => {
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    
    // Cleanup function
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }
};

// Background Sync
export const backgroundSyncUtils = {
  // Register background sync
  registerSync: async (tag) => {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register(tag);
      console.log(`Background sync registered: ${tag}`);
    }
  },

  // Check if background sync is supported
  isSupported: () => {
    return 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype;
  }
};
