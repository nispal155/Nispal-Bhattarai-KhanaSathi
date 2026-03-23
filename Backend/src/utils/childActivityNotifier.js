const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendNotification } = require('../services/socket');

const notifyParentOfChildActivity = async (childUserOrId, {
  title,
  message,
  link = '/cart'
}) => {
  let childUser = childUserOrId;

  if (!childUser?._id || !childUser?.parentAccount) {
    childUser = await User.findById(childUserOrId).select('_id username parentAccount');
  }

  if (!childUser?._id || !childUser?.parentAccount) {
    return;
  }

  await Notification.create({
    user: childUser.parentAccount,
    type: 'system',
    title,
    message,
    data: { link }
  });

  sendNotification(childUser.parentAccount, {
    type: 'system',
    title,
    message,
    link
  });
};

module.exports = {
  notifyParentOfChildActivity
};
