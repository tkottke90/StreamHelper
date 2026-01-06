import { copyToClipboard } from "@/utils/html.utils";
import { useComputed, useSignal } from "@preact/signals";
import { Copy, Trash2, TriangleAlert } from "lucide-preact";
import { Ref } from "preact";
import { forwardRef, FunctionComponent, useCallback, useRef } from "preact/compat";
import { BaseProps, Nullable, Timeout } from "../../utils/component.utils";

const variants = Object.freeze({
  default: 'hover:bg-zinc-400 active:bg-zinc-500 active:text-white',
  primary: 'text-matisse-900 hover:bg-matisse-800/20 active:bg-matisse-800 active:border-matisse-900 active:text-white',
  primaryOutline: '!border-matisse-900 text-matisse-900 hover:bg-matisse-800/20 active:bg-matisse-800 active:text-white',
  primaryRaised: 'text-white bg-matisse-500 hover:bg-matisse-600 active:bg-matisse-800 active:border-matisse-900 active:text-white shadow active:shadow-none',
  secondary: '',
  secondaryOutline: '',
  destructive: 'text-flush-mahogany--500 hover:bg-flush-mahogany-400/20 active:bg-flush-mahogany-500 active:text-white ',
  destructiveRaised: 'text-white bg-flush-mahogany-500 hover:bg-flush-mahogany-600 active:bg-flush-mahogany-800 active:border-flush-mahogany-900 active:text-white shadow active:shadow-none',
  success: 'text-green-700 bg-green-100 hover:bg-green-200 active:bg-green-300'
} as const);

const layoutStyles = Object.freeze({
  default: 'py-2 px-4',
  icon: 'p-2 w-fit h-fit'
} as const);

export type ButtonVariant = keyof typeof variants;

export const Button: FunctionComponent<BaseProps<{ variant: ButtonVariant, icon?: boolean }> & { ref?: Ref<HTMLButtonElement> }> =
  forwardRef<HTMLButtonElement, BaseProps<{ variant: keyof typeof variants }>>((props, ref) => {
    const {variant, className, ...btnProps} = props;

    return (<button
      ref={ref} {...btnProps}
      className={`border border-transparent rounded-2xl outline-transparent cursor-pointer ${layoutStyles[props.icon ? 'icon' : 'default']} ${variants[variant ?? 'default']} disabled:bg-zinc-600/30 disabled:text-zinc-800/50 disabled:cursor-default ${className}`}
    />)
  }) as any;


interface ConfirmButtonProps extends Record<string, any> {
  title?: string;
  confirmTitle?: string;
  onConfirm: () => void | Promise<void>;
  variant?: Extract<ButtonVariant, 'destructiveRaised' | 'destructive'>;
}

export function ConfirmButton({
  title,
  confirmTitle,
  onConfirm,
  variant = 'destructiveRaised',
  className=""
}: BaseProps<ConfirmButtonProps>) {
  // Setup ref to track timeout
  const elemRef = useRef<Nullable<Timeout>>(null);
  
  const confirming = useSignal(false);

  const handleConfirm = useCallback(() => {
    const isConfirming = confirming.peek();

    if (elemRef.current) {
      clearTimeout(elemRef.current)
    }

    if (isConfirming) {
      onConfirm();
    } else {

      // Create timeout which will fire the callback
      // after the delay
      elemRef.current = setTimeout(() => {
        confirming.value = false;
      }, 5000);

      confirming.value = true;
    }
  }, [])

  return (
    <Button
      title={confirming.value ? confirmTitle : title}
      className={`${className} data-[confirming="true"]:bg-orange-500 `}
      variant={variant}
      onClick={handleConfirm}
      data-confirming={confirming.value}
    >
      {confirming.value ? <TriangleAlert size={16} /> : <Trash2 size={16} />}
    </Button>
  )
}

interface CopyButtonProps<T> extends Record<string, any> {
  title?: string;
  variant?: ButtonVariant
  value: () => T;
}

export function CopyButton<T>({ title, className, value }: BaseProps<CopyButtonProps<T>>) {
  const variant = useSignal<ButtonVariant>('default');

  const titleValue = useComputed(() => {
    switch(variant.value) {
      case 'success': {
        return 'Copied!';
      }
      case 'destructive': {
        return 'Failed to copy';
      }
      default: {
        return title;
      }
    }
  });

  return (
    <Button
      title={titleValue}
      className={className}
      variant={variant.value}
      onClick={async () => {
        try {
          // Load the value from the getter
          const val = value();

          // Copy the value to the clipboard
          if (typeof val === 'string') {
            // If it is a string, copy it directly
            await copyToClipboard(val);
          } else {
            // Otherwise, copy the JSON representation
            await copyToClipboard(
              JSON.stringify(val)
            );
          }

          variant.value = 'success';

          // Clear feedback after 2 seconds
          setTimeout(() => {
            variant.value = 'default';
          }, 2000);

        } catch (error) {
          console.error('Failed to copy:', error);
          
          variant.value = 'destructive';

          // Clear feedback after 3 seconds for errors
          setTimeout(() => {
            variant.value = 'default';
          }, 3000);
        }

        copyToClipboard(
          JSON.stringify(value())
        );
      }}
    >
      <Copy size={16} />
    </Button>
  )
}