import { FormField } from "./form/form-field";
import { Actions } from "./layout/actions";
import { HorizontalLine } from "./layout/horizontal-line";
import { Input } from "./form/input";
import { useEffect, useRef } from "preact/hooks";
import { open } from '@tauri-apps/plugin-dialog';
import { useSettings } from "../services/app-settings.service";
import { ComponentChildren } from "preact";

function SettingsForm({ onSave }: { onSave?: () => void }) {
  const settings = useSettings()
  
  return (
    <form
      action=""
      className="flex flex-col gap-4"
      onSubmit={(e: SubmitEvent) => {
        e.preventDefault();

        const form = e.target as HTMLFormElement;

        Array
          .from(form?.elements).filter(elem => elem.hasAttribute('name'))
          .forEach((field) => {
            const fieldName = field.getAttribute('name');

            if (fieldName && fieldName in settings) {
              const config = settings[fieldName];

              const value = (field as HTMLInputElement).value;
              config.update(value);
            }
          });

          onSave && onSave();
      }}
    >
      <FormField>
        <label htmlFor={settings.iRacingPath.configName}>iRacing Folder</label>
        <Input
          type="input"
          name={settings.iRacingPath.configName}
          id={settings.iRacingPath.configName}
          placeholder="C:\Program Files (x86)\iRacing"
          value={settings.iRacingPath.value }
          onClick={async (e: MouseEvent) => {
            const target = e.target as HTMLInputElement;

            const iRacingDir = await open({ defaultPath: target?.value ?? "C:\Program Files (x86)\iRacing", directory: true })
          
            console.log('Result: ', iRacingDir)

            if (!iRacingDir) return;

            settings.iRacingPath.update(iRacingDir);
          }}  
        />
      </FormField>

      <Actions>
        <button type="submit">Save</button>
      </Actions>
    </form>
  )
}

function SettingsModal({ children }: { children: ComponentChildren}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (!ref.current) return;

    ref.current.showModal();

  }, [ref]);
  
  return (
    <dialog ref={ref}>
      {children}
      <SettingsForm onSave={() => { ref.current && ref.current.close(); }} />
    </dialog>
  )
}

export function Setup() {
  return (
    <SettingsModal>
      <h2>Welcome to the iRacing Telemetry Listener</h2>
      <p>This software allows you to push the telemetry file from your iRacing directory to your account in Stream Helper.</p>
      <HorizontalLine />
      <p>Before you can use it, we need to know where your iRacing Telemetry is stored.  This way we can pull up the files</p>
      <br />
    </SettingsModal>
  )
}

export function Settings() {
  

  return (
    <SettingsModal>
      <h2>Settings</h2>
      <p>These settings control how the application functions</p>
      <HorizontalLine />
      <SettingsForm />
    </SettingsModal>
  )
}