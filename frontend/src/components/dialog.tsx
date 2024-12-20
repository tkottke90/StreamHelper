import { Inputs, Ref, useCallback, useEffect, useRef } from 'preact/hooks';
import { Fragment, JSX } from "preact/jsx-runtime";
import { DefaultProps } from "../utils/component.utils";
import { cloneElement } from 'preact';
import { registerEvent, useHtmlElementListeners } from '../utils/html.utils';

interface DialogProps extends DefaultProps {
  trigger?: JSX.Element,
  onClose?: (event: Event) => void,
  onCancel?: (event: Event) => void,
  onOpen?: () => void,
}

export function Dialog({ children, trigger, onClose, onCancel, onOpen }: DialogProps) {
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
      <dialog ref={modalRef}>
        { children }
      </dialog>
    </Fragment>
  );
}

function openModalIfClosed(modal: HTMLDialogElement | null) {
  if (!modal?.open) {
    modal?.showModal();
  }
}