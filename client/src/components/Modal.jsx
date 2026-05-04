import { useEffect } from 'react';
import { MdClose } from 'react-icons/md';

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div className={`w-full ${sizes[size]} bg-surface-50 border border-surface-200 rounded-2xl shadow-2xl animate-fadeInUp`}>
        <div className="flex items-center justify-between p-5 border-b border-surface-200">
          <h2 className="font-display font-bold text-lg">{title}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-surface-100 rounded-lg transition-colors">
            <MdClose size={18} className="text-white/60" />
          </button>
        </div>
        <div className="p-5 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
