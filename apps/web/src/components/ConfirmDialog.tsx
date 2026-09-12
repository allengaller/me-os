import Modal from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = '确认',
  cancelLabel = '取消',
  variant = 'primary',
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-sm">
      <div className="px-6 py-5">
        <p className="text-sm text-slate-600">{message}</p>
      </div>
      <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
        <button
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-700 rounded-lg disabled:opacity-50"
        >
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={`px-5 py-2.5 text-sm font-medium rounded-lg disabled:opacity-50 ${
            variant === 'danger'
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-[var(--color-ink-soft)] hover:bg-[var(--color-ink-soft-hover)] text-white'
          }`}
        >
          {loading ? '处理中...' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}