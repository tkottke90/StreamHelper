import { useRef } from 'preact/hooks';
import { JSX, ComponentChildren } from "preact";
import { DefaultProps } from "../utils/component.utils";
import { cloneElement, createContext, Ref } from 'preact';
import { useHtmlElementListeners } from '../utils/html.utils';
import { X as XIcon } from 'lucide-preact';
import { Signal, useSignal } from '@preact/signals';

const X = XIcon as any;

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

const defaultDialogContext: iDalogContext = {
  dialog: null,
  close: (value?: string) => {},
  value: undefined
}

export const DialogContext = createContext<iDalogContext>(defaultDialogContext)

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

  const Provider = DialogContext.Provider as any;

  return (
    <Provider value={{
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
      <dialog ref={modalRef} className="relative backdrop:slate-950 ">
        <div className="flex">
          <h2 className="flex-grow">{title}</h2>
          { !disableClose && <button className="p-0 flex items-center" onClick={() => {cancelModal(modalRef.current, onCancel)}}><X /></button> }
        </div>
        <br />
        { children }
      </dialog>
    </Provider>
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