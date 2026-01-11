import { X, AlertCircle, HelpCircle } from "lucide-react";
import { createPortal } from "react-dom";
import { Button } from "~/components/ui/Button";
import { Modal } from "~/components/ui/Modal";

interface CustomConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onClose: () => void;
    type?: "info" | "danger";
}

export function CustomConfirmModal({
    isOpen,
    title,
    message,
    onConfirm,
    onClose,
    type = "info",
}: CustomConfirmModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            maxWidth="max-w-sm"
        >
            <div
                className={`p-6 ${type === "danger" ? "bg-red-50" : "bg-brand-surface"}`}
            >
                <div className="flex items-center gap-3 mb-3">
                    {type === "danger" ? (
                        <AlertCircle className="text-red-600" />
                    ) : (
                        <HelpCircle className="text-brand-accent" />
                    )}
                    <h3 className="font-serif text-lg font-bold text-brand-900">
                        {title}
                    </h3>
                </div>
                <p className="text-sm text-gray-600">{message}</p>
            </div>
            <div className="px-6 py-4 bg-white flex justify-end gap-3 border-t border-gray-100">
                <Button variant="ghost" onClick={onClose}>
                    Cancel
                </Button>
                <Button
                    variant={type === "danger" ? "danger" : "primary"}
                    onClick={() => {
                        onConfirm();
                        onClose();
                    }}
                >
                    Confirm
                </Button>
            </div>
        </Modal>
    );
}

export function ErrorToast({
    message,
    onClose,
}: {
    message: string;
    onClose: () => void;
}) {
    if (!message) return null;

    return createPortal(
        <div className="fixed bottom-6 right-6 z-[300] flex items-center gap-3 bg-red-600 text-white px-5 py-4 rounded-xl shadow-2xl animate-in slide-in-from-right-10 max-w-sm">
            <AlertCircle size={20} className="shrink-0" />
            <span className="text-sm font-medium">{message}</span>
            <button
                onClick={onClose}
                className="ml-auto hover:bg-white/20 rounded-full p-2 transition-colors"
            >
                <X size={18} />
            </button>
        </div>,
        document.body,
    );
}
