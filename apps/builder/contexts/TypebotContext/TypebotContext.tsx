import { ToastId, useToast } from '@chakra-ui/react'
import { PublicTypebot, Settings, Theme, Typebot } from 'models'
import { useRouter } from 'next/router'
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  createPublishedTypebot,
  parseTypebotToPublicTypebot,
  updatePublishedTypebot,
} from 'services/publicTypebot'
import {
  checkIfPublished,
  checkIfTypebotsAreEqual,
  parseDefaultPublicId,
  updateTypebot,
} from 'services/typebots'
import { fetcher, omit, preventUserFromRefreshing } from 'services/utils'
import useSWR from 'swr'
import { isDefined } from 'utils'
import { BlocksActions, blocksActions } from './actions/blocks'
import { stepsAction, StepsActions } from './actions/steps'
import { variablesAction, VariablesActions } from './actions/variables'
import { edgesAction, EdgesActions } from './actions/edges'
import { useRegisterActions } from 'kbar'
import useUndo from 'services/utils/useUndo'
import { useDebounce } from 'use-debounce'
import { itemsAction, ItemsActions } from './actions/items'
const autoSaveTimeout = 40000

type UpdateTypebotPayload = Partial<{
  theme: Theme
  settings: Settings
  publicId: string
  name: string
}>

export type SetTypebot = (typebot: Typebot | undefined) => void
const typebotContext = createContext<
  {
    typebot?: Typebot
    publishedTypebot?: PublicTypebot
    isPublished: boolean
    isPublishing: boolean
    hasUnsavedChanges: boolean
    isSavingLoading: boolean
    save: () => Promise<ToastId | undefined>
    undo: () => void
    redo: () => void
    canRedo: boolean
    canUndo: boolean
    updateTypebot: (updates: UpdateTypebotPayload) => void
    updateOnBothTypebots: (updates: {
      publicId?: string
      name?: string
    }) => void
    publishTypebot: () => void
  } & BlocksActions &
    StepsActions &
    ItemsActions &
    VariablesActions &
    EdgesActions
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
>({})

export const TypebotContext = ({
  children,
  typebotId,
}: {
  children: ReactNode
  typebotId: string
}) => {
  const router = useRouter()
  const toast = useToast({
    position: 'top-right',
    status: 'error',
  })
  const { typebot, publishedTypebot, isLoading, mutate } = useFetchedTypebot({
    typebotId,
    onError: (error) =>
      toast({
        title: 'Error while fetching typebot',
        description: error.message,
      }),
  })

  const [
    { present: localTypebot },
    {
      redo,
      undo,
      canRedo,
      canUndo,
      set: setLocalTypebot,
      presentRef: currentTypebotRef,
    },
  ] = useUndo<Typebot | undefined>(undefined)

  const saveTypebot = async () => {
    const typebotToSave = currentTypebotRef.current
    if (!typebotToSave) return
    setIsSavingLoading(true)
    const { error } = await updateTypebot(typebotToSave.id, typebotToSave)
    setIsSavingLoading(false)
    if (error) return toast({ title: error.name, description: error.message })
    mutate({ typebot: typebotToSave })
    window.removeEventListener('beforeunload', preventUserFromRefreshing)
  }

  const savePublishedTypebot = async (newPublishedTypebot: PublicTypebot) => {
    setIsPublishing(true)
    const { error } = await updatePublishedTypebot(
      newPublishedTypebot.id,
      newPublishedTypebot
    )
    setIsPublishing(false)
    if (error) return toast({ title: error.name, description: error.message })
    mutate({
      typebot: currentTypebotRef.current as Typebot,
      publishedTypebot: newPublishedTypebot,
    })
  }

  const hasUnsavedChanges = useMemo(
    () =>
      isDefined(typebot) &&
      isDefined(localTypebot) &&
      !checkIfTypebotsAreEqual(localTypebot, typebot),
    [typebot, localTypebot]
  )

  useAutoSave({
    handler: saveTypebot,
    item: localTypebot,
    canSave: hasUnsavedChanges,
    debounceTimeout: autoSaveTimeout,
  })

  const [localPublishedTypebot, setLocalPublishedTypebot] =
    useState<PublicTypebot>()
  const [isSavingLoading, setIsSavingLoading] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)

  const isPublished = useMemo(
    () =>
      isDefined(typebot) &&
      isDefined(publishedTypebot) &&
      checkIfPublished(typebot, publishedTypebot),
    [typebot, publishedTypebot]
  )

  useEffect(() => {
    if (!localTypebot || !typebot) return
    currentTypebotRef.current = localTypebot
    if (!checkIfTypebotsAreEqual(localTypebot, typebot)) {
      window.removeEventListener('beforeunload', preventUserFromRefreshing)
      window.addEventListener('beforeunload', preventUserFromRefreshing)
    } else {
      window.removeEventListener('beforeunload', preventUserFromRefreshing)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localTypebot])

  useEffect(() => {
    if (isLoading) return
    if (!typebot) {
      toast({ status: 'info', description: "Couldn't find typebot" })
      router.replace('/typebots')
      return
    }
    setLocalTypebot({ ...typebot })
    if (publishedTypebot) setLocalPublishedTypebot({ ...publishedTypebot })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading])

  useRegisterActions(
    [
      {
        id: 'save',
        name: 'Save typebot',
        perform: () => saveTypebot(),
      },
    ],
    []
  )

  useRegisterActions(
    [
      {
        id: 'undo',
        name: 'Undo changes',
        perform: undo,
      },
    ],
    [localTypebot]
  )

  const updateLocalTypebot = (updates: UpdateTypebotPayload) =>
    localTypebot && setLocalTypebot({ ...localTypebot, ...updates })

  const updateLocalPublishedTypebot = (updates: UpdateTypebotPayload) =>
    publishedTypebot &&
    setLocalPublishedTypebot({
      ...localPublishedTypebot,
      ...(updates as PublicTypebot),
    })

  const publishTypebot = async () => {
    if (!localTypebot) return
    const newLocalTypebot = { ...localTypebot }
    if (!localPublishedTypebot) {
      const newPublicId = parseDefaultPublicId(
        localTypebot.name,
        localTypebot.id
      )
      updateLocalTypebot({ publicId: newPublicId })
      newLocalTypebot.publicId = newPublicId
    }
    if (hasUnsavedChanges || !localPublishedTypebot) await saveTypebot()
    if (localPublishedTypebot) {
      await savePublishedTypebot({
        ...parseTypebotToPublicTypebot(newLocalTypebot),
        id: localPublishedTypebot.id,
      })
    } else {
      setIsPublishing(true)
      const { data, error } = await createPublishedTypebot(
        omit(parseTypebotToPublicTypebot(newLocalTypebot), 'id')
      )
      setLocalPublishedTypebot(data)
      setIsPublishing(false)
      if (error) return toast({ title: error.name, description: error.message })
      mutate({ typebot: localTypebot })
    }
  }

  const updateOnBothTypebots = async (updates: {
    publicId?: string
    name?: string
  }) => {
    updateLocalTypebot(updates)
    await saveTypebot()
    if (!localPublishedTypebot) return
    updateLocalPublishedTypebot(updates)
    await savePublishedTypebot({
      ...localPublishedTypebot,
      ...(updates as PublicTypebot),
    })
  }

  return (
    <typebotContext.Provider
      value={{
        typebot: localTypebot,
        publishedTypebot: localPublishedTypebot,
        hasUnsavedChanges,
        isSavingLoading,
        save: saveTypebot,
        undo,
        redo,
        canUndo,
        canRedo,
        publishTypebot,
        isPublishing,
        isPublished,
        updateTypebot: updateLocalTypebot,
        updateOnBothTypebots,
        ...blocksActions(localTypebot as Typebot, setLocalTypebot),
        ...stepsAction(localTypebot as Typebot, setLocalTypebot),
        ...variablesAction(localTypebot as Typebot, setLocalTypebot),
        ...edgesAction(localTypebot as Typebot, setLocalTypebot),
        ...itemsAction(localTypebot as Typebot, setLocalTypebot),
      }}
    >
      {children}
    </typebotContext.Provider>
  )
}

export const useTypebot = () => useContext(typebotContext)

export const useFetchedTypebot = ({
  typebotId,
  onError,
}: {
  typebotId: string
  onError: (error: Error) => void
}) => {
  const { data, error, mutate } = useSWR<
    { typebot: Typebot; publishedTypebot?: PublicTypebot },
    Error
  >(`/api/typebots/${typebotId}`, fetcher)
  if (error) onError(error)
  return {
    typebot: data?.typebot,
    publishedTypebot: data?.publishedTypebot,
    isLoading: !error && !data,
    mutate,
  }
}

const useAutoSave = <T,>({
  handler,
  item,
  canSave,
  debounceTimeout,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (item?: T) => Promise<any>
  item?: T
  canSave: boolean
  debounceTimeout: number
}) => {
  const [debouncedItem] = useDebounce(item, debounceTimeout)
  return useEffect(() => {
    if (canSave) handler(item)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedItem])
}
