const { DEFAULT_USERNAME } = require('../config/constants');
const {
  emptyTrash,
  readTrash,
  removeTrashItem,
  restoreTrashItem,
} = require('../services/trashService');

const getTrash = async (req, res, next) => {
  try {
    const username = req.headers['x-username'] || DEFAULT_USERNAME;
    return res.status(200).json({ success: true, data: await readTrash(username) });
  } catch (error) {
    next(error);
  }
};

const restoreTrashEntry = async (req, res, next) => {
  try {
    const username = req.headers['x-username'] || DEFAULT_USERNAME;
    const entry = await restoreTrashItem(username, req.params.type, req.params.id);
    return res.status(200).json({ success: true, message: 'Khôi phục thành công', data: entry });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};

const permanentlyDeleteTrashEntry = async (req, res, next) => {
  try {
    const username = req.headers['x-username'] || DEFAULT_USERNAME;
    const entry = await removeTrashItem(username, req.params.type, req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy mục trong thùng rác' });
    }
    return res.status(200).json({ success: true, message: 'Đã xóa vĩnh viễn' });
  } catch (error) {
    next(error);
  }
};

const emptyAllTrash = async (req, res, next) => {
  try {
    const username = req.headers['x-username'] || DEFAULT_USERNAME;
    await emptyTrash(username);
    return res.status(200).json({ success: true, message: 'Đã làm trống thùng rác' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTrash, restoreTrashEntry, permanentlyDeleteTrashEntry, emptyAllTrash };
