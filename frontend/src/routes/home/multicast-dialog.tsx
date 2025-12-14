import { Signal, useSignal } from "@preact/signals";
import { Eye, EyeClosed, Twitch, Youtube } from "lucide-preact";
import { useEffect, useMemo, useRef } from "preact/hooks";
import { JSX } from "preact/jsx-runtime";
import { CreateStreamDestinationInput, StreamDestinationResponse } from "../../../../backend/src/dto/stream-destination.dto";
import { StreamDTOWithLinks } from "../../../../backend/src/dto/stream.dto";
import { Dialog, useDialogContext } from "../../components/dialog";
import { FormField } from "../../components/form/form-field";
import { Input, InputWithButton, ToggleInput } from "../../components/form/input";
import { Actions } from "../../components/layout/actions";
import { createStreamDestination, deleteStreamDestination, getStreamDestination, getStreamDestinationMetadata, updateStreamDestination } from "../../services/stream.service";
import { BaseProps } from "../../utils/component.utils";

import { Button } from "../../components/form/button";
import { capitalize } from "../../utils/string.utils";

type Destinations = 'youtube' | 'twitch';

interface MulticastProps extends Record<string, any> {
  destination: Destinations;
  stream: StreamDTOWithLinks;
  onClose?: () => void | Promise<void>
}

const BrandingMap: Record<Destinations, JSX.Element> = {
  'twitch': <Twitch size={24} className={`stroke-zinc-600 hover:stroke-twitch-violet-400 group-data-[active="true"]:stroke-twitch-violet-600`} />,
  'youtube': <Youtube size={24} className={`stroke-zinc-600 hover:stroke-youtube-red-400 group-data-[active="true"]:stroke-youtube-red-600`} />
}

export function MulticastDialog({ destination, stream, onClose }: BaseProps<MulticastProps>) {
  const destinationData = useSignal<StreamDestinationResponse | undefined>();
  const platformMetadata = useSignal<{ name: string, rtmpUrl: string | null, requiresCustomUrl: boolean } | undefined>();

  const destinationPath = useMemo(() => {
    if (typeof stream.links.destinations !== 'string' && destination in stream.links.destinations) {
      return stream.links.destinations[destination]
    } else {
      return ''
    }
  }, [stream])

  useEffect(() => {
    if (destinationPath) {
      getStreamDestination(destinationPath)
        .then(destination => {
          destinationData.value = destination;
        })
    }
  }, [stream, destinationPath])

  // Fetch platform metadata on mount
  useEffect(() => {
    getStreamDestinationMetadata().then((metadata) => {
      platformMetadata.value = metadata.platforms[destination];
    });
  }, [destination]);

  return (
    <Dialog
      onClose={() => {
        destinationData.value = undefined;

        onClose?.();
      }}
      title={`Configure Multicast: ${capitalize(destination)}`}
      trigger={
        <button data-active={Boolean(destinationPath)} className="group">{
          BrandingMap[destination]
        }</button>
      }
    >
      <MulticastForm
        data={destinationData}
        metadata={platformMetadata}
        stream={stream}
        destination={destination}
      />
    </Dialog>
  );
}

interface MulticastFormProps extends Record<string, any> {
  data: Signal<StreamDestinationResponse | undefined>;
  metadata: Signal<{ name: string, rtmpUrl: string | null, requiresCustomUrl: boolean } | undefined>;
  stream: StreamDTOWithLinks;
  destination: Destinations;
}

function MulticastForm({ data, metadata, stream, destination }: BaseProps<MulticastFormProps>) {
  const formRef = useRef<HTMLFormElement>(null);
  const typeToggle = useSignal<'text' | 'password'>('password');
  const { close } = useDialogContext();

  const handleDelete = async () => {
    if (!data.value?.id) return;

    try {
      if (formRef.current)
        formRef.current.reset();

      await deleteStreamDestination(data.value.id);
      // Clear the data signal to prevent stale data from showing
      data.value = undefined;
      // Close the dialog after successful delete
      close();
    } catch (err) {
      console.error('Failed to delete destination:', err);
    }
  }

  return (
    <form ref={formRef} onSubmit={(e) => handleSubmit(e).then(() => {
      if (formRef.current)
        formRef.current.reset();

      close()
    })}>
        <input name="streamId" value={stream.id} hidden type="number" />
        <input name="platform" value={destination} hidden />
        <input name="destinationId" value={data.value?.id} hidden type="number" />

        <FormField className="flex-row gap-4">
          <ToggleInput
            label="Enabled"
            id="enabled"
            name="enabled"
            checked={data.value?.enabled}
          />
        </FormField>

        <br />

        <FormField>
          <label htmlFor="url">Stream URL</label>
          <Input id="url" name="url" className="rounded border px-4 py-2" type="text" autoComplete="never" value={data.value?.rtmpUrl ?? metadata.value?.rtmpUrl} />
        </FormField>

        <br />

        <FormField>
          <label htmlFor="stream-key">Stream Key</label>
          <InputWithButton
            id="stream-key"
            name="stream-key"
            className="rounded border px-4 py-2"
            type={typeToggle.value}
            autoComplete="never"
            button={
              typeToggle.value == 'text'
                ? <EyeClosed title="Hide Value" />
                : <Eye title="Show Value" />
            }
            onButtonClick={() => {
              typeToggle.value = typeToggle.value === 'text' ? 'password' : 'text';
            }}

            onFocus={(e: MouseEvent) => (e.currentTarget as HTMLInputElement).select()}
            defaultValue={" ".repeat(20)}
          />
          <small className="pt-2 text-sm opacity-50">Your keys are never shared with the frontend once you save them. The value will be the same regardless.</small>
        </FormField>

        <br />

        <Actions className="justify-end">
          <Button disabled={!data.value?.id} type="button" variant="destructive" onClick={handleDelete}>Delete</Button>

          <Button type="submit" variant="primaryOutline">Save</Button>
        </Actions>
      </form>
  )
}

function getFormFieldValue<TInputElement extends HTMLInputElement, TResponse = string>(form: HTMLFormElement, key: string, parseFn?: (input: unknown) => TResponse) {
  const field = form.elements.namedItem(key);

  if (!field) {
    return '';
  }

  if (parseFn) {
    return parseFn((field as TInputElement).value);
  }

  switch((field as TInputElement).type) {
    case 'number': {
      return parseInt((field as TInputElement).value, 10);
    }

    case 'checkbox': {
      return Boolean((field as TInputElement).checked);
    }

    default:
      return (field as TInputElement).value;
  }
}

export async function handleSubmit(e: SubmitEvent) {
  e.preventDefault();

  const form = e.currentTarget as HTMLFormElement;

  const destinationId = getFormFieldValue(form, 'destinationId');
  const streamId = getFormFieldValue(form, 'streamId');
  const platform = getFormFieldValue(form, 'platform');
  const url = getFormFieldValue(form, 'url');
  const key = getFormFieldValue(form, 'stream-key', (input) => `${input}`.trim());
  const enabled = getFormFieldValue(form, 'enabled');

  if (!url || !key ) {
    return;
  }

  try {
    if (destinationId) {
      // Update existing destination
      await updateStreamDestination(Number(destinationId), {
        rtmpUrl: (url as string) ?? '',
        streamKey: key as string ?? ''
      });
    } else {
      // Create new destination
      await createStreamDestination({
        streamId: Number(streamId),
        platform: platform,
        rtmpUrl: url as string ?? '',
        streamKey: key as string ?? '',
        enabled: Boolean(enabled)
      } as CreateStreamDestinationInput);
    }
  } catch (err) {
    console.error('Failed to save destination:', err);
  }
}