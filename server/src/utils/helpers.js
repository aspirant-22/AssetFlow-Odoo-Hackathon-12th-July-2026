const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');

const logActivity = async (userId, action, entity, entityId, details = {}) => {
  try {
    await ActivityLog.create({ user: userId, action, entity, entityId, details });
  } catch (err) {
    console.error('Log activity error:', err.message);
  }
};

const createNotification = async (userId, title, message, type, relatedEntity = {}) => {
  try {
    await Notification.create({ user: userId, title, message, type, relatedEntity });
  } catch (err) {
    console.error('Notification error:', err.message);
  }
};

const generateAssetTag = async (AssetModel) => {
  const count = await AssetModel.countDocuments();
  return `AF-${String(count + 1).padStart(4, '0')}`;
};

module.exports = { logActivity, createNotification, generateAssetTag };
