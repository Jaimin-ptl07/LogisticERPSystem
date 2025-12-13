import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import clsx from 'clsx';

interface ModalProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
}

interface ModalHeaderProps {
  children: React.ReactNode;
  onClose: () => void;
  showCloseButton?: boolean;
}

interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

const Modal: React.FC<ModalProps> & {
  Header: typeof ModalHeader;
  Body: typeof ModalBody;
  Footer: typeof ModalFooter;
} = ({
  children,
  isOpen,
  onClose,
  title,
  size = 'md',
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeOnEscape) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, closeOnEscape]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  const modal = (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={closeOnBackdropClick ? onClose : undefined}
      />

      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={clsx(
            'relative w-full transform rounded-lg bg-white shadow-xl transition-all',
            sizeClasses[size],
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {title && (
            <ModalHeader onClose={onClose} showCloseButton={showCloseButton}>
              <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            </ModalHeader>
          )}
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

const ModalHeader: React.FC<ModalHeaderProps> = ({
  children,
  onClose,
  showCloseButton = true,
}) => {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
      {children}
      {showCloseButton && (
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500 focus:outline-none focus:text-gray-500 transition-colors"
        >
          <X size={24} />
        </button>
      )}
    </div>
  );
};

const ModalBody: React.FC<ModalBodyProps> = ({ children, className }) => {
  return <div className={clsx('px-6 py-4', className)}>{children}</div>;
};

const ModalFooter: React.FC<ModalFooterProps> = ({ children, className }) => {
  return (
    <div className={clsx('px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg', className)}>
      {children}
    </div>
  );
};

Modal.Header = ModalHeader;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;

export default Modal;