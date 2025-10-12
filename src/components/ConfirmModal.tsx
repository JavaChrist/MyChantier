import React from 'react';
import { AlertTriangle, Check, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export function ConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  type = 'info'
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const getIconColor = () => {
    switch (type) {
      case 'danger':
        return 'text-red-400 bg-red-400/10';
      case 'warning':
        return 'text-yellow-400 bg-yellow-400/10';
      default:
        return 'text-blue-400 bg-blue-400/10';
    }
  };

  const getConfirmButtonColor = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700';
      default:
        return 'bg-primary-600 hover:bg-primary-700';
    }
  };

  return (
    <div className="modal">
      <div className="modal-backdrop" onClick={onCancel} />
      <div className="modal-content max-w-sm">
        <div className="flex items-start space-x-3 mb-4">
          <div className={`p-2 rounded-lg ${getIconColor()}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-100 mb-2">{title}</h3>
            <p className="text-gray-300 text-sm">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-700">
          <button
            onClick={onCancel}
            className="btn-secondary flex items-center space-x-2"
          >
            <X className="w-4 h-4" />
            <span>{cancelText}</span>
          </button>
          <button
            onClick={onConfirm}
            className={`${getConfirmButtonColor()} text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2`}
          >
            <Check className="w-4 h-4" />
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
