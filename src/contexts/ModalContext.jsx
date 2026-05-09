import React, { createContext, useContext, useState, useCallback } from 'react';
import Modal from '../components/Modal';

const ModalContext = createContext({});

export const ModalProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    confirmText: 'ตกลง',
    cancelText: 'ยกเลิก',
    showCancel: false,
    loading: false,
    onConfirm: null,
    onClose: null
  });

  const closeModal = useCallback(() => {
    setModalState(prev => ({ ...prev, isOpen: false, loading: false }));
  }, []);

  const showModal = useCallback(({
    type = 'info',
    title,
    message = '',
    confirmText = 'ตกลง',
    cancelText = 'ยกเลิก',
    showCancel = false,
    onConfirm = null
  }) => {
    setModalState({
      isOpen: true,
      type,
      title,
      message,
      confirmText,
      cancelText,
      showCancel,
      loading: false,
      onConfirm,
      onClose: closeModal
    });
  }, [closeModal]);

  // Shortcut functions สำหรับใช้งานง่าย
  const showSuccess = useCallback((title, message, onConfirm) => {
    showModal({ type: 'success', title, message, confirmText: 'ตกลง', onConfirm });
  }, [showModal]);

  const showError = useCallback((title, message, onConfirm) => {
    showModal({ type: 'error', title, message, confirmText: 'ตกลง', onConfirm });
  }, [showModal]);

  const showWarning = useCallback((title, message, onConfirm) => {
    showModal({ type: 'warning', title, message, confirmText: 'ตกลง', onConfirm });
  }, [showModal]);

  const showInfo = useCallback((title, message, onConfirm) => {
    showModal({ type: 'info', title, message, confirmText: 'ตกลง', onConfirm });
  }, [showModal]);

  const showConfirm = useCallback((title, message, onConfirm, confirmText = 'ยืนยัน', cancelText = 'ยกเลิก') => {
    showModal({ 
      type: 'confirm', 
      title, 
      message, 
      confirmText, 
      cancelText, 
      showCancel: true, 
      onConfirm 
    });
  }, [showModal]);

  const setLoading = useCallback((loading) => {
    setModalState(prev => ({ ...prev, loading }));
  }, []);

  return (
    <ModalContext.Provider value={{
      showModal,
      showSuccess,
      showError,
      showWarning,
      showInfo,
      showConfirm,
      closeModal,
      setLoading
    }}>
      {children}
      <Modal
        isOpen={modalState.isOpen}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        showCancel={modalState.showCancel}
        loading={modalState.loading}
        onConfirm={modalState.onConfirm}
        onClose={modalState.onClose}
      />
    </ModalContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

export default ModalContext;
