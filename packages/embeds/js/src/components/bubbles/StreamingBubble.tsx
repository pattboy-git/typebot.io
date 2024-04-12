import { streamingMessage } from '@/utils/streamingMessageSignal'
import { For, createEffect, createSignal } from 'solid-js'
import { marked } from 'marked'
import domPurify from 'dompurify'

type Props = {
  streamingMessageId: string
}

export const StreamingBubble = (props: Props) => {
  const [content, setContent] = createSignal<string[]>([])

  marked.use({
    renderer: {
      link: (href, _title, text) => {
        return `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`
      },
    },
  })

  createEffect(() => {
    if (streamingMessage()?.id !== props.streamingMessageId) return []
    setContent(
      streamingMessage()
        ?.content.split('\n\n')
        .map((line) =>
          domPurify.sanitize(marked.parse(line), {
            ADD_ATTR: ['target'],
          })
        ) ?? []
    )
  })

  return (
    <div class="flex flex-col animate-fade-in">
      <div class="flex w-full items-center">
        <div class="flex relative items-start typebot-host-bubble max-w-full">
          <div
            class="flex items-center absolute px-4 py-2 bubble-typing "
            style={{
              width: '100%',
              height: '100%',
            }}
            data-testid="host-bubble"
          />
          <div
            class={
              'flex flex-col overflow-hidden text-fade-in mx-4 my-2 relative text-ellipsis h-full gap-6'
            }
          >
            <For each={content()}>{(line) => <span innerHTML={line} />}</For>
          </div>
        </div>
      </div>
    </div>
  )
}
