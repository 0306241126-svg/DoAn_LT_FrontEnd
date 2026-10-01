import React, { createContext, useContext, useState, useRef } from 'react';
import ConfirmModal from '../components/common/ConfirmModal';

const ConfirmContext = createContext();

export function ConfirmProvider({ children }) {
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Xác nhận',
    cancelText: 'Hủy bỏ',
    type: 'danger',
  });

  const resolverRef = useRef(null);

  /**
   * Hàm confirm trả về Promise<boolean>
   * Cách dùng: const isConfirmed = await confirm({ title: '...', message: '...' });
   */
  const confirm = ({
    title = 'Xác nhận hành động',
    message = 'Bạn có chắc chắn muốn thực hiện?',
    confirmText = 'Xóa',
    cancelText = 'Hủy bỏ',
    type = 'danger',
  } = {}) => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      type,
    });

    return new Promise((resolve) => {
      resolverRef.current = resolve;
    });
  };

  const handleConfirm = () => {
    setModalConfig((prev) => ({ ...prev, isOpen: false }));
    if (resolverRef.current) resolverRef.current(true);
  };

  const handleCancel = () => {
    setModalConfig((prev) => ({ ...prev, isOpen: false }));
    if (resolverRef.current) resolverRef.current(false);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <ConfirmModal
        {...modalConfig}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  return useContext(ConfirmContext);
}