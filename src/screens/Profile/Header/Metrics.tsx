import React from 'react'
import {View} from 'react-native'
import {AppBskyActorDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {pluralize} from '#/lib/strings/helpers'
import {Shadow} from '#/state/cache/types'
import {makeProfileLink} from 'lib/routes/links'
import {formatCount} from 'view/com/util/numeric/format'
import {atoms as a, useTheme} from '#/alf'
import {InlineLinkText} from '#/components/Link'
import {Text} from '#/components/Typography'

export function ProfileHeaderMetrics({
  profile,
}: {
  profile: Shadow<AppBskyActorDefs.ProfileViewDetailed>
}) {
  const t = useTheme()
  const {_} = useLingui()
  const following = formatCount(profile.followsCount || 0)
  const followers = formatCount(profile.followersCount || 0)
  const pluralizedFollowers = pluralize(profile.followersCount || 0, 'follower')

  return (
    <View
      style={[a.flex_row, a.gap_sm, a.align_center, a.pb_md]}
      pointerEvents="box-none">
      <InlineLinkText
        testID="profileHeaderFollowersButton"
        style={[a.flex_row, t.atoms.text]}
        to={makeProfileLink(profile, 'followers')}
        label={`${followers} ${pluralizedFollowers}`}>
        <Text style={[a.font_bold, a.text_md]}>{followers} </Text>
        <Text style={[t.atoms.text_contrast_medium, a.text_md]}>
          {pluralizedFollowers}
        </Text>
      </InlineLinkText>
      <InlineLinkText
        testID="profileHeaderFollowsButton"
        style={[a.flex_row, t.atoms.text]}
        to={makeProfileLink(profile, 'follows')}
        label={_(msg`${following} following`)}>
        <Trans>
          <Text style={[a.font_bold, a.text_md]}>{following} </Text>
          <Text style={[t.atoms.text_contrast_medium, a.text_md]}>
            following
          </Text>
        </Trans>
      </InlineLinkText>
      <Text style={[a.font_bold, t.atoms.text, a.text_md]}>
        {formatCount(profile.postsCount || 0)}{' '}
        <Text style={[t.atoms.text_contrast_medium, a.font_normal, a.text_md]}>
          {pluralize(profile.postsCount || 0, 'post')}
        </Text>
      </Text>
    </View>
  )
}
