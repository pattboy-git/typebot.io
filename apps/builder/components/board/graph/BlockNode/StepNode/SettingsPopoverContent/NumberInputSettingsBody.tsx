import { FormLabel, HStack, Stack } from '@chakra-ui/react'
import { SmartNumberInput } from 'components/settings/SmartNumberInput'
import { DebouncedInput } from 'components/shared/DebouncedInput'
import { NumberInputOptions } from 'models'
import React from 'react'
import { removeUndefinedFields } from 'services/utils'

type NumberInputSettingsBodyProps = {
  options?: NumberInputOptions
  onOptionsChange: (options: NumberInputOptions) => void
}

export const NumberInputSettingsBody = ({
  options,
  onOptionsChange,
}: NumberInputSettingsBodyProps) => {
  const handlePlaceholderChange = (placeholder: string) =>
    onOptionsChange({ ...options, labels: { ...options?.labels, placeholder } })
  const handleButtonLabelChange = (button: string) =>
    onOptionsChange({ ...options, labels: { ...options?.labels, button } })
  const handleMinChange = (min?: number) =>
    onOptionsChange(removeUndefinedFields({ ...options, min }))
  const handleMaxChange = (max?: number) =>
    onOptionsChange(removeUndefinedFields({ ...options, max }))
  const handleStepChange = (step?: number) =>
    onOptionsChange(removeUndefinedFields({ ...options, step }))

  return (
    <Stack spacing={4}>
      <Stack>
        <FormLabel mb="0" htmlFor="placeholder">
          Placeholder:
        </FormLabel>
        <DebouncedInput
          id="placeholder"
          initialValue={options?.labels?.placeholder ?? 'Type your answer...'}
          delay={100}
          onChange={handlePlaceholderChange}
        />
      </Stack>
      <Stack>
        <FormLabel mb="0" htmlFor="button">
          Button label:
        </FormLabel>
        <DebouncedInput
          id="button"
          initialValue={options?.labels?.button ?? 'Send'}
          delay={100}
          onChange={handleButtonLabelChange}
        />
      </Stack>
      <HStack justifyContent="space-between">
        <FormLabel mb="0" htmlFor="min">
          Min:
        </FormLabel>
        <SmartNumberInput
          id="min"
          initialValue={options?.min}
          onValueChange={handleMinChange}
        />
      </HStack>
      <HStack justifyContent="space-between">
        <FormLabel mb="0" htmlFor="max">
          Max:
        </FormLabel>
        <SmartNumberInput
          id="max"
          initialValue={options?.max}
          onValueChange={handleMaxChange}
        />
      </HStack>
      <HStack justifyContent="space-between">
        <FormLabel mb="0" htmlFor="step">
          Step:
        </FormLabel>
        <SmartNumberInput
          id="step"
          initialValue={options?.step}
          onValueChange={handleStepChange}
        />
      </HStack>
    </Stack>
  )
}
