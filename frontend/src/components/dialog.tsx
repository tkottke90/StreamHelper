import { useCallback, useRef } from 'preact/hooks';
import { Fragment, JSX } from "preact/jsx-runtime";
import { DefaultProps } from "../utils/component.utils";
import { cloneElement } from 'preact';


interface DialogProps extends DefaultProps {
  trigger?: JSX.Element
}

export function Dialog({ children, trigger }: DialogProps) {
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

  const triggerElement = cloneElement(trigger ?? (<button>Open</button>), { ref: triggerRef })

  return (
    <Fragment>
      { triggerElement }
      <dialog ref={modalRef} >
        { children }
      </dialog>
    </Fragment>
  );
}