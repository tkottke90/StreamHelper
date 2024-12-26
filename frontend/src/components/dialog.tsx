import { useRef } from 'preact/hooks';
import { JSX } from "preact/jsx-runtime";
import { DefaultProps } from "../utils/component.utils";
import { cloneElement, createContext, Ref } from 'preact';
import { useHtmlElementListeners } from '../utils/html.utils';
import { X } from 'lucide-preact';
import { Signal, useSignal } from '@preact/signals';

interface DialogProps extends DefaultProps {
  title?: string;
  trigger?: JSX.Element,
  disableClose?: boolean,
  open?: Signal<Boolean>,
  onClose?: () => void,
  onCancel?: () => void,
  onOpen?: () => void,
}

interface iDalogContext {
  dialog: HTMLDialogElement | null;
  close: (value?: string) => void;
  value: string | undefined;
}

export const DialogContext = createContext<iDalogContext>({
  dialog: null,
  close: (value?: string) => {},
  value: undefined
})

export function Dialog({ children, trigger, disableClose, title, onCancel, onClose, onOpen }: DialogProps) {
  const modalValue = useSignal<string | undefined>();
  const modalRef = useRef<HTMLDialogElement>(null)

  const triggerRef = useHtmlElementListeners(
    [
      [ 'click', () => openModal(modalRef.current, onOpen) ]
    ],
    [ trigger ]
  );

  const triggerElement = cloneElement(trigger ?? (<button>Open</button>), { ref: triggerRef })

  return (
    <DialogContext.Provider value={{
      dialog: modalRef.current,
      value: modalValue.value,
      close: (value?: string) => {
        if (onClose) {
          onClose()
        }

        closeModal(modalRef.current, value)
      }
    }}>
      { triggerElement }
      <dialog ref={modalRef} className="relative">
        <div className="flex">
          <h2 className="flex-grow">{title}</h2>
          { !disableClose && <button className="p-0 flex items-center" onClick={() => {cancelModal(modalRef.current, onCancel)}}><X /></button> }
        </div>
        <br />
        { children }
      </dialog>
    </DialogContext.Provider>
  );
}

type ModalRef = HTMLDialogElement | null;

export function openModal(modal: ModalRef, onOpen?: (() => void)) {
  if (modal) {
    if (onOpen) {
      onOpen();
    }

    modal.showModal();
  }
}

export function closeModal(modal: ModalRef, value?: string) {
  if (modal) {
    modal.close(value);
  }
}

export function cancelModal(modal: ModalRef, onCancel?: (() => void)) {
  if (onCancel) {
    onCancel();
  }
  
  closeModal(modal);
}