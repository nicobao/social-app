import React, {useCallback} from 'react'
import {Keyboard} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {logEvent} from '#/lib/statsig/statsig'
import {Gif} from '#/state/queries/giphy'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {GifSelectDialog} from '#/components/dialogs/GifSelect'
import {GifSquare_Stroke2_Corner0_Rounded as GifIcon} from '#/components/icons/Gif'

type Props = {
  onClose: () => void
  onSelectGif: (gif: Gif) => void
  disabled?: boolean
}

export function SelectGifBtn({onClose, onSelectGif, disabled}: Props) {
  const {_} = useLingui()
  const control = useDialogControl()
  const t = useTheme()

  const onPressSelectGif = useCallback(async () => {
    logEvent('composer:gif:open', {})
    Keyboard.dismiss()
    control.open()
  }, [control])

  return (
    <>
      <Button
        testID="openGifBtn"
        onPress={onPressSelectGif}
        label={_(msg`Select GIF`)}
        accessibilityHint={_(msg`Opens GIF select dialog`)}
        style={a.p_sm}
        variant="ghost"
        shape="round"
        color="primary"
        disabled={disabled}>
        <GifIcon size="lg" style={disabled && t.atoms.text_contrast_low} />
      </Button>

      <GifSelectDialog
        control={control}
        onClose={onClose}
        onSelectGif={onSelectGif}
      />
    </>
  )
}
