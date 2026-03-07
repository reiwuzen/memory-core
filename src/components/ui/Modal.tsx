import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import Button from "./Button";

type ModalProps = {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  actions?: ReactNode;
};

const Modal = ({ title, isOpen, onClose, children, actions }: ModalProps) => {
  useEffect(() => {
    if (!isOpen) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="ui-modal__overlay" role="presentation" onClick={onClose}>
      <section
        className="ui-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="ui-modal__header">
          <h2>{title}</h2>
          <Button variant="ghost" onClick={onClose} aria-label="Close modal">
            Close
          </Button>
        </header>
        <div className="ui-modal__content">{children}</div>
        {actions ? <footer className="ui-modal__actions">{actions}</footer> : null}
      </section>
    </div>,
    document.body,
  );
};

export default Modal;
