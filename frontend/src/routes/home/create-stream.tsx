import { useSignal, batch } from "@preact/signals";
import { JSX } from "preact/jsx-runtime";
import { StreamDTO } from "../../../../backend/src/dto/stream.dto";
import { Dialog } from "../../components/dialog";
import { RouteIcon } from "../../components/icons/route.icon";
import { useStreamService } from "../../services/steram.service";

export function CreateStream({ label, button }: { label?: string, button?: JSX.Element }) {
  const { createStream } = useStreamService();
  const stream = useSignal<StreamDTO | undefined>(undefined);
  const loading = useSignal(false);
  
  const defaultButton = (
    <button className="btn-accent" onClick={async () => {
      if (!loading.value) {
        loading.value = true;
        createStream()
          .then((newStream) => {
            batch(() => {
              loading.value = false;
              stream.value = newStream.value;
            });
          })
      }
    }}>
      <p class="iconify mdi--plus"></p>
      <span>{label ?? ''}</span>
    </button>
  );

  return (
    <Dialog trigger={button ?? defaultButton}>
      { loading.value
          ? <div className="flex flex-col gap-4">
              <h3 className="text-center" >Creating New Stream</h3>
              <RouteIcon size={32}></RouteIcon>
            </div>
          : <div>
              <h2>New Stream</h2>
              <ul>
                <li>Stream Key: { stream.value?.key }</li>
                <li>Stream URL: { stream.value?.url }</li>
              </ul>
            </div>
      }
    </Dialog>
  )
}