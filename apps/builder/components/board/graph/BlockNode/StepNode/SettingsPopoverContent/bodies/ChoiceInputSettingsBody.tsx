import { FormLabel, Stack } from '@chakra-ui/react'
import { DebouncedInput } from 'components/shared/DebouncedInput'
import { SwitchWithLabel } from 'components/shared/SwitchWithLabel'
import { ChoiceInputOptions } from 'models'
import React from 'react'

type ChoiceInputSettingsBodyProps = {
  options?: ChoiceInputOptions
  onOptionsChange: (options: ChoiceInputOptions) => void
}

export const ChoiceInputSettingsBody = ({
  options,
  onOptionsChange,
}: ChoiceInputSettingsBodyProps) => {
  const handleIsMultipleChange = (isMultipleChoice: boolean) =>
    options && onOptionsChange({ ...options, isMultipleChoice })
  const handleButtonLabelChange = (buttonLabel: string) =>
    options && onOptionsChange({ ...options, buttonLabel })

  return (
    <Stack spacing={4}>
      <SwitchWithLabel
        id={'is-multiple'}
        label={'Multiple choice?'}
        initialValue={options?.isMultipleChoice ?? false}
        onCheckChange={handleIsMultipleChange}
      />
      {options?.isMultipleChoice && (
        <Stack>
          <FormLabel mb="0" htmlFor="send">
            Button label:
          </FormLabel>
          <DebouncedInput
            id="send"
            initialValue={options?.buttonLabel ?? 'Send'}
            delay={100}
            onChange={handleButtonLabelChange}
          />
        </Stack>
      )}
    </Stack>
  )
}
