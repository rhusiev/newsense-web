import { Modal } from "./ui/Modal";

export function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      <div className="p-10 text-center text-gray-400 italic">
        Settings coming soon...
      </div>
    </Modal>
  );
}
