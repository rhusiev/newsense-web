import { CustomConfirmModal, ErrorToast } from "~/components/UIOverlay";
import { AuthModal } from "~/components/AuthModal";
import { FeedManageModal, FeedInfoModal } from "~/components/FeedModals";
import { SettingsModal } from "~/components/SettingsModal";
import type { Feed, User } from "~/lib/types";

interface SharedModalsProps {
    authModal: { open: boolean; view: "login" | "register" };
    setAuthModal: (val: any) => void;
    manageModal: { open: boolean; mode: "create" | "edit"; feed?: Feed | null };
    setManageModal: (val: any) => void;
    infoModalFeed: Feed | null;
    setInfoModalFeed: (feed: Feed | null) => void;
    settingsOpen: boolean;
    setSettingsOpen: (val: boolean) => void;
    confirmConfig: any;
    setConfirmConfig: (val: any) => void;
    error: string | null;
    setError: (msg: string | null) => void;
    onSuccess: () => void;
    user: User | null;
}

export function SharedModals({
    authModal,
    setAuthModal,
    manageModal,
    setManageModal,
    infoModalFeed,
    setInfoModalFeed,
    settingsOpen,
    setSettingsOpen,
    confirmConfig,
    setConfirmConfig,
    error,
    setError,
    onSuccess,
    user,
}: SharedModalsProps) {
    return (
        <>
            <CustomConfirmModal
                {...confirmConfig}
                onClose={() =>
                    setConfirmConfig((prev: any) => ({
                        ...prev,
                        isOpen: false,
                    }))
                }
            />
            {error && (
                <ErrorToast message={error} onClose={() => setError(null)} />
            )}

            <AuthModal
                isOpen={authModal.open}
                onClose={() => setAuthModal({ ...authModal, open: false })}
                initialView={authModal.view}
            />
            {user && (
                <FeedManageModal
                    isOpen={manageModal.open}
                    mode={manageModal.mode}
                    feed={manageModal.feed}
                    onClose={() =>
                        setManageModal({ ...manageModal, open: false })
                    }
                    onSuccess={onSuccess}
                />
            )}
            {user && (
                <FeedInfoModal
                    feed={infoModalFeed}
                    onClose={() => setInfoModalFeed(null)}
                />
            )}
            <SettingsModal
                isOpen={settingsOpen}
                onClose={() => setSettingsOpen(false)}
            />
        </>
    );
}
