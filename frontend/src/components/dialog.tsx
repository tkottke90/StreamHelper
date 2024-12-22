import { useRef } from 'preact/hooks';
import { Fragment, JSX } from "preact/jsx-runtime";
import { DefaultProps } from "../utils/component.utils";
import { cloneElement } from 'preact';
import { useHtmlElementListeners } from '../utils/html.utils';
import { X } from 'lucide-preact';

interface DialogProps extends DefaultProps {
  title?: string;
  trigger?: JSX.Element,
  disableClose?: boolean,
  onClose?: (event: Event) => void,
  onCancel?: (event: Event) => void,
  onOpen?: () => void,
}

export function Dialog({ children, trigger, onOpen, disableClose, title }: DialogProps) {
  const modalRef = useRef<HTMLDialogElement>(null)

  const triggerRef = useHtmlElementListeners(
    [
      [
        'click',
        () => {
          console.log('open Modal');
          openModalIfClosed(modalRef.current);
          
          if (onOpen) {
            onOpen();
          }
        }
      ]
    ],
    [ trigger ]
  );

  const triggerElement = cloneElement(trigger ?? (<button>Open</button>), { ref: triggerRef })

  return (
    <Fragment>
      { triggerElement }
      <dialog ref={modalRef} className="relative">
        <div className="flex">
          <h2 className="flex-grow">{title}</h2>
          { !disableClose && <button className="p-0 flex items-center" onClick={() => closeModal(modalRef.current)}><X /></button> }
        </div>
        <br />
        { children }
      </dialog>
    </Fragment>
  );
}

export function openModalIfClosed(modal: HTMLDialogElement | null) {
  if (!modal?.open) {
    modal?.showModal();
  }
}

export function closeModal(modal: HTMLDialogElement | null) {
  if (modal && modal.open) {
    modal.close();
  }
}