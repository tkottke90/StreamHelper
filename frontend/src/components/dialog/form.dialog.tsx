import { BaseProps } from "@/utils/component.utils";
import { Plus } from "lucide-preact";
import { JSX } from "preact/jsx-runtime";
import { Dialog, useDialogContext } from "../dialog";
import { Button } from "../form/button";

interface DialogFormProps extends Record<string, unknown> {
  onSave?: (formData: FormData, form: HTMLFormElement) => void | Promise<void>;
  closeOnSave?: boolean;
}

interface FormDialogProps extends DialogFormProps {
  title: string;
  trigger?: JSX.Element;
}

export function FormDialog({ children, title, trigger, onSave, closeOnSave, className }: BaseProps<FormDialogProps>) {
  return (
    <Dialog
      title={title}
      trigger={trigger ?? <Button variant="primaryRaised" className="btn-primary--raised"><Plus /></Button>}
    >
      <DialogForm onSave={onSave} closeOnSave={closeOnSave} className={className}>
        {children}
      </DialogForm>
    </Dialog>
  )
}

export function DialogForm({ children, onSave, closeOnSave = true, className = "" }: BaseProps<DialogFormProps>) {
  const { close } = useDialogContext();

  return (
    <form 
      className={className}
      onSubmit={async (e) => {
        e.preventDefault();

        const form = e.target as HTMLFormElement;

        if (!form) {
          throw new Error('Form not found');
        }

        if (!form.checkValidity()) {
          throw new Error('Invalid Form');
        }

        const formData = new FormData(form);

        try {
          // Call onSave and await it if it returns a Promise
          // This handles both sync and async functions
          if (onSave) {
            await onSave(formData, form);
          }
        } catch (err) {
          // Log error but don't prevent form reset/close
          console.error('Error saving form:', err);
          throw err; // Re-throw to prevent form reset/close on error
        }

        // Only reset and close if onSave succeeded
        form.reset();
        
        // Close the dialog after the save if flag is set
        closeOnSave && close();
      }}
    >
      {children}
    </form>
  )
}