import { Inputs, Ref, useCallback, useEffect, useRef } from 'preact/hooks';
import { Fragment, JSX } from "preact/jsx-runtime";
import { DefaultProps } from "../utils/component.utils";
import { cloneElement } from 'preact';

const inertEvent = (e: Event) => {};

interface DialogProps extends DefaultProps {
  trigger?: JSX.Element,
  onClose?: (event: Event) => void,
  onCancel?: (event: Event) => void,
}

export function Dialog({ children, trigger, onClose, onCancel }: DialogProps) {
  const modalRef = useRef<HTMLDialogElement>(null);

  const triggerRef = useCallback((node: HTMLElement | null) => {
    if (!node) return;

    const openDialog = () => {
      console.log('openDialog')

      if (!modalRef.current?.open) {
        modalRef.current?.showModal();
      }
    }

    node.addEventListener('click', openDialog)

  }, [trigger, modalRef]);

  useEffect(() => {
    if (modalRef.current) {
      const modal = modalRef.current;
      modal.addEventListener('onClose', onClose ?? inertEvent)
      modal.addEventListener('onCancel', onCancel ?? inertEvent)
    }

    return () => {}
  }, []);

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