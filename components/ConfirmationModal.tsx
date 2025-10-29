import React from 'react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    confirmButtonClass?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    confirmButtonClass = 'bg-red-600 hover:bg-red-700',
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in" role="dialog" aria-modal="true">
            <div onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
            <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-md rounded-xl bg-card-light dark:bg-card-dark shadow-xl p-6 sm:p-8 m-4">
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                        <span className="material-symbols-outlined text-red-500 text-3xl">warning</span>
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-text-light dark:text-text-dark" id="modal-title">{title}</h2>
                        <p className="text-text-muted-light dark:text-text-muted-dark mt-2">{message}</p>
                    </div>
                </div>
                <div className="flex justify-end gap-4 mt-8">
                    <button onClick={onClose} className="h-11 px-6 text-sm font-bold text-text-light dark:text-text-dark bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                        Cancel
                    </button>
                    <button onClick={onConfirm} className={`h-11 px-6 text-sm font-bold text-white rounded-lg transition-colors ${confirmButtonClass}`}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
