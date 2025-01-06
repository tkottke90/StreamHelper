import { batch, Signal, useSignal } from "@preact/signals";
import { Plus } from "lucide-preact";
import { useContext } from "preact/hooks";
import { JSX } from "preact/jsx-runtime";
import { StreamDTO } from "../../../../backend/src/dto/stream.dto";
import { Dialog, DialogContext } from "../../components/dialog";
import { RouteIcon } from "../../components/icons/route.icon";
import { Actions } from "../../components/layout/actions";
import { createStream } from "../../services/stream.service";

export function CreateStream({ label, button }: { label?: string, button?: JSX.Element }) {
  const stream = useSignal<StreamDTO | undefined>(undefined);
  const loading = useSignal(false);
  
  const defaultButton = (
    <button className="btn-primary--raised">
      <Plus />
      <span>{label ?? ''}</span>
    </button>
  );

  return (
    <Dialog
      trigger={button ?? defaultButton}
      title="Creating New Stream"
      onOpen={async () => {
        if (!loading.value) {
          loading.value = true;
          const newStream = await callLoadStreamAPI()

          batch(() => {
            stream.value = newStream.value;
            loading.value = false;
          })
        }
      }}
      onClose={() => {
        stream.value = undefined;
      }}
    >
      { loading.value
          ? <LoadingNewStream />
          : <NewStreamDetails stream={stream} />
      }
    </Dialog>
  )
}

function LoadingNewStream() {
  return (
    <div className="flex flex-col gap-4">
      <RouteIcon size={32}></RouteIcon>
    </div>
  )
}

function NewStreamDetails({ stream }: { stream: Signal<StreamDTO|undefined>}) {
  const { close } = useContext(DialogContext)
  
  return (
    <div>
      <h3>New Stream Created</h3>
      <ul>
        <li>Stream Key: { stream.value?.key }</li>
        <li>Stream URL: { stream.value?.url }</li>
      </ul>
      <br />
      <Actions>
        <button className="btn-primary--raised" onClick={() => close()} >Close</button>
      </Actions>
    </div>
  )
}

export async function callLoadStreamAPI() {
  return createStream();
}