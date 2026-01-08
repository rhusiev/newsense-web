import { X, AlertCircle, HelpCircle } from "lucide-react";
import { createPortal } from "react-dom";

export function CustomConfirmModal({ isOpen, title, message, onConfirm, onClose, type = "info" }: any) {
    if (!isOpen) return null;
    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                <div className={`p-6 ${type === 'danger' ? 'bg-red-50' : 'bg-[#fcfdfc]'}`}>
                    <div className="flex items-center gap-3 mb-3">
                        {type === 'danger' ? <AlertCircle className="text-red-600" /> : <HelpCircle className="text-[#587e5b]" />}
                        <h3 className="font-serif text-lg font-bold text-[#0e3415]">{title}</h3>
                    </div>
                    <p className="text-sm text-gray-600">{message}</p>
                </div>
                <div className="px-6 py-4 bg-white flex justify-end gap-3 border-t">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">Cancel</button>
                    <button onClick={() => { onConfirm(); onClose(); }} className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${type === 'danger' ? 'bg-red-600' : 'bg-[#0e3415]'}`}>Confirm</button>
                </div>
            </div>
        </div>, document.body
    );
}

export function ErrorToast({ message, onClose }: { message: string, onClose: () => void }) {
    return createPortal(
        <div className="fixed bottom-6 right-6 z-[300] flex items-center gap-3 bg-red-600 text-white px-5 py-4 rounded-xl shadow-2xl animate-in slide-in-from-right-10">
            <AlertCircle size={20} />
            <span className="text-sm font-medium">{message}</span>
            <button onClick={onClose} className="ml-4 hover:bg-white/20 rounded-full p-2 transition-colors">
                <X size={18} />
            </button>
        </div>, document.body
    );
}
