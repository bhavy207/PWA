import { notificationsAPI } from './api';
import { pushNotificationUtils } from './pwaUtils';
import toast from 'react-hot-toast';

class NotificationService {
  constructor() {
    this.vapidPublicKey = null;
    this.isSubscribed = false;
    this.subscription = null;
  }

  // Initialize the service
  async init() {
    try {
      // Get VAPID public key from server
      const response = await notificationsAPI.getVapidKey();
      this.vapidPublicKey = response.data.publicKey;
      
      // Check if already subscribed
      this.subscription = await pushNotificationUtils.getSubscription();
      this.isSubscribed = !!this.subscription;
      
      console.log('Notification service initialized');
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
    }
  }

  // Check if notifications are supported
  isSupported() {
    return pushNotificationUtils.isSupported();
  }

  // Get current permission status
  getPermissionStatus() {
    return pushNotificationUtils.getPermissionStatus();
  }

  // Request permission for notifications
  async requestPermission() {
    try {
      const permission = await pushNotificationUtils.requestPermission();
      
      if (permission === 'granted') {
        toast.success('Notifications enabled!');
        return true;
      } else if (permission === 'denied') {
        toast.error('Notifications blocked. Enable them in browser settings.');
        return false;
      } else {
        toast('Notification permission dismissed');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Failed to request notification permission');
      return false;
    }
  }

  // Subscribe to push notifications
  async subscribe() {
    try {
      if (!this.isSupported()) {
        throw new Error('Push notifications are not supported');
      }

      if (!this.vapidPublicKey) {
        await this.init();
      }

      // Request permission if not granted
      const permission = this.getPermissionStatus();
      if (permission !== 'granted') {
        const granted = await this.requestPermission();
        if (!granted) {
          return false;
        }
      }

      // Subscribe to push manager
      const subscription = await pushNotificationUtils.subscribe(this.vapidPublicKey);
      
      // Send subscription to server
      await notificationsAPI.subscribe(subscription);
      
      this.subscription = subscription;
      this.isSubscribed = true;
      
      toast.success('Successfully subscribed to notifications!');
      return true;
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      toast.error('Failed to subscribe to notifications');
      return false;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe() {
    try {
      const unsubscribed = await pushNotificationUtils.unsubscribe();
      
      if (unsubscribed) {
        this.subscription = null;
        this.isSubscribed = false;
        toast.success('Unsubscribed from notifications');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error unsubscribing from notifications:', error);
      toast.error('Failed to unsubscribe from notifications');
      return false;
    }
  }

  // Show local notification
  showLocalNotification(title, options = {}) {
    if (this.getPermissionStatus() === 'granted') {
      const notification = new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        ...options
      });

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      return notification;
    }
  }

  // Send test notification
  async sendTestNotification() {
    try {
      await notificationsAPI.sendNotification({
        title: 'Test Notification',
        body: 'This is a test notification from PWA Shop!',
        data: { url: '/' }
      });
      
      toast.success('Test notification sent!');
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error('Failed to send test notification');
    }
  }

  // Handle order notifications
  async sendOrderNotification(order, type = 'created') {
    const titles = {
      created: 'Order Confirmed!',
      processing: 'Order Processing',
      shipped: 'Order Shipped!',
      delivered: 'Order Delivered!',
      cancelled: 'Order Cancelled'
    };

    const bodies = {
      created: `Your order #${order._id?.slice(-6)} has been confirmed`,
      processing: `Your order #${order._id?.slice(-6)} is being processed`,
      shipped: `Your order #${order._id?.slice(-6)} has been shipped`,
      delivered: `Your order #${order._id?.slice(-6)} has been delivered`,
      cancelled: `Your order #${order._id?.slice(-6)} has been cancelled`
    };

    try {
      await notificationsAPI.sendNotification({
        title: titles[type],
        body: bodies[type],
        data: { 
          url: `/orders/${order._id}`,
          orderId: order._id,
          type: 'order_update'
        }
      });
    } catch (error) {
      console.error('Error sending order notification:', error);
    }
  }

  // Handle promotional notifications
  async sendPromotionalNotification(title, message, url = '/') {
    try {
      await notificationsAPI.sendNotification({
        title,
        body: message,
        data: { url, type: 'promotion' }
      });
    } catch (error) {
      console.error('Error sending promotional notification:', error);
    }
  }

  // Get notification history
  async getNotifications(params = {}) {
    try {
      const response = await notificationsAPI.getNotifications(params);
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return { notifications: [], unreadCount: 0 };
    }
  }

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      await notificationsAPI.markAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Mark all notifications as read
  async markAllAsRead() {
    try {
      await notificationsAPI.markAllAsRead();
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark notifications as read');
    }
  }

  // Setup notification event listeners
  setupEventListeners() {
    // Listen for service worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'notification-clicked') {
          // Handle notification click events
          console.log('Notification clicked:', event.data);
        }
      });
    }
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;
