const express = require('express');
const webpush = require('web-push');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Subscribe to push notifications
router.post('/subscribe', auth, async (req, res) => {
  try {
    const { subscription } = req.body;
    
    await User.findByIdAndUpdate(req.user._id, {
      pushSubscription: subscription
    });

    res.json({ message: 'Push subscription saved successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send push notification to user
router.post('/send', auth, async (req, res) => {
  try {
    const { title, body, data, userId } = req.body;
    
    // If userId is provided and user is admin, send to specific user
    const targetUserId = userId && req.user.role === 'admin' ? userId : req.user._id;
    const user = await User.findById(targetUserId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.pushSubscription) {
      return res.status(400).json({ message: 'User not subscribed to push notifications' });
    }

    const payload = JSON.stringify({
      title,
      body,
      data: data || {},
      badge: '/icons/icon-72x72.png',
      icon: '/icons/icon-192x192.png',
      timestamp: Date.now()
    });

    try {
      await webpush.sendNotification(user.pushSubscription, payload);
      
      // Save notification to database
      const notification = new Notification({
        user: targetUserId,
        title,
        message: body,
        data: data || {},
        sent: true,
        sentAt: new Date()
      });
      await notification.save();

      res.json({ message: 'Push notification sent successfully' });
    } catch (pushError) {
      console.error('Push notification error:', pushError);
      
      // If push fails, might need to remove invalid subscription
      if (pushError.statusCode === 410 || pushError.statusCode === 404) {
        await User.findByIdAndUpdate(targetUserId, {
          $unset: { pushSubscription: 1 }
        });
      }
      
      res.status(500).json({ message: 'Failed to send push notification' });
    }
  } catch (error) {
    console.error('Error sending push notification:', error);
    res.status(500).json({ message: error.message });
  }
});

// Broadcast notification to all subscribed users (admin only)
router.post('/broadcast', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { title, body, data, type = 'general' } = req.body;
    
    // Get users based on notification type preferences
    let userFilter = { pushSubscription: { $exists: true } };
    
    if (type === 'promotion') {
      userFilter['preferences.notifications.promotions'] = true;
    } else if (type === 'new_product') {
      userFilter['preferences.notifications.newProducts'] = true;
    }

    const users = await User.find(userFilter);

    const payload = JSON.stringify({
      title,
      body,
      data: data || {},
      badge: '/icons/icon-72x72.png',
      icon: '/icons/icon-192x192.png',
      timestamp: Date.now()
    });

    const notifications = [];
    let successCount = 0;
    let failCount = 0;

    const promises = users.map(async (user) => {
      try {
        await webpush.sendNotification(user.pushSubscription, payload);
        
        // Create notification record
        notifications.push({
          user: user._id,
          title,
          message: body,
          type,
          data: data || {},
          sent: true,
          sentAt: new Date()
        });
        
        successCount++;
      } catch (err) {
        console.error('Failed to send to user:', user._id, err);
        
        // Remove invalid subscriptions
        if (err.statusCode === 410 || err.statusCode === 404) {
          await User.findByIdAndUpdate(user._id, {
            $unset: { pushSubscription: 1 }
          });
        }
        
        // Create failed notification record
        notifications.push({
          user: user._id,
          title,
          message: body,
          type,
          data: data || {},
          sent: false
        });
        
        failCount++;
      }
    });

    await Promise.all(promises);
    
    // Bulk insert notifications
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
    
    res.json({ 
      message: `Broadcast completed. Sent: ${successCount}, Failed: ${failCount}`,
      totalUsers: users.length,
      successCount,
      failCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user notifications
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const skip = (page - 1) * limit;

    let filter = { user: req.user._id };
    if (unreadOnly === 'true') {
      filter.read = false;
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({
      user: req.user._id,
      read: false
    });

    res.json({
      notifications,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / limit),
        total
      },
      unreadCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark notification as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark all notifications as read
router.put('/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, read: false },
      { read: true, readAt: new Date() }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get VAPID public key
router.get('/vapid-public-key', (req, res) => {
  res.json({
    publicKey: process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa40HI6YrrAFrmzfzVy'
  });
});

module.exports = router;
