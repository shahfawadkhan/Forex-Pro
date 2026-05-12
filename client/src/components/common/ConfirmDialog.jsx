import Modal from './Modal'
export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmText='Confirm', danger=false }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{message}</p>
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="btn-secondary">Cancel</button>
        <button onClick={()=>{onConfirm();onClose()}} className={danger?'btn-danger':'btn-primary'}>{confirmText}</button>
      </div>
    </Modal>
  )
}
