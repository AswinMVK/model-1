const Notification = require('../models/Notification');

const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving notifications', error: error.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, readStatus: false }, { readStatus: true });
    res.json({ message: 'Notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error marking notifications', error: error.message });
  }
};

module.exports = { getNotifications, markAsRead };
