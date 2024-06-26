import React, {memo, useMemo, useState} from 'react'
import {StyleSheet, View} from 'react-native'
import {
  AppBskyFeedDefs,
  AppBskyFeedPost,
  AtUri,
  ModerationDecision,
  RichText as RichTextAPI,
} from '@atproto/api'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {POST_TOMBSTONE, Shadow, usePostShadow} from '#/state/cache/post-shadow'
import {useComposerControls} from '#/state/shell/composer'
import {isReasonFeedSource, ReasonFeedSource} from 'lib/api/feed/types'
import {MAX_POST_LINES} from 'lib/constants'
import {usePalette} from 'lib/hooks/usePalette'
import {makeProfileLink} from 'lib/routes/links'
import {sanitizeDisplayName} from 'lib/strings/display-names'
import {sanitizeHandle} from 'lib/strings/handles'
import {countLines} from 'lib/strings/helpers'
import {s} from 'lib/styles'
import {atoms as a} from '#/alf'
import {ContentHider} from '#/components/moderation/ContentHider'
import {ProfileHoverCard} from '#/components/ProfileHoverCard'
import {RichText} from '#/components/RichText'
import {LabelsOnMyPost} from '../../../components/moderation/LabelsOnMe'
import {PostAlerts} from '../../../components/moderation/PostAlerts'
import {FeedNameText} from '../util/FeedInfoText'
import {Link, TextLink, TextLinkOnWebOnly} from '../util/Link'
import {PostCtrls} from '../util/post-ctrls/PostCtrls'
import {PostEmbeds} from '../util/post-embeds'
import {PostMeta} from '../util/PostMeta'
import {Text} from '../util/text/Text'
import {PreviewableUserAvatar} from '../util/UserAvatar'
import {UserInfoText} from '../util/UserInfoText'

export function FeedItem({
  post,
  record,
  reason,
  moderation,
  isThreadChild,
  isThreadLastChild,
  isThreadParent,
}: {
  post: AppBskyFeedDefs.PostView
  record: AppBskyFeedPost.Record
  reason: AppBskyFeedDefs.ReasonRepost | ReasonFeedSource | undefined
  moderation: ModerationDecision
  isThreadChild?: boolean
  isThreadLastChild?: boolean
  isThreadParent?: boolean
}) {
  const postShadowed = usePostShadow(post)
  const richText = useMemo(
    () =>
      new RichTextAPI({
        text: record.text,
        facets: record.facets,
      }),
    [record],
  )
  if (postShadowed === POST_TOMBSTONE) {
    return null
  }
  if (richText && moderation) {
    return (
      <FeedItemInner
        // Safeguard from clobbering per-post state below:
        key={postShadowed.uri}
        post={postShadowed}
        record={record}
        reason={reason}
        richText={richText}
        moderation={moderation}
        isThreadChild={isThreadChild}
        isThreadLastChild={isThreadLastChild}
        isThreadParent={isThreadParent}
      />
    )
  }
  return null
}

let FeedItemInner = ({
  post,
  record,
  reason,
  richText,
  moderation,
  isThreadChild,
  isThreadLastChild,
  isThreadParent,
}: {
  post: Shadow<AppBskyFeedDefs.PostView>
  record: AppBskyFeedPost.Record
  reason: AppBskyFeedDefs.ReasonRepost | ReasonFeedSource | undefined
  richText: RichTextAPI
  moderation: ModerationDecision
  isThreadChild?: boolean
  isThreadLastChild?: boolean
  isThreadParent?: boolean
}): React.ReactNode => {
  const {openComposer} = useComposerControls()
  const pal = usePalette('default')
  const {_} = useLingui()
  const href = useMemo(() => {
    const urip = new AtUri(post.uri)
    return makeProfileLink(post.author, 'post', urip.rkey)
  }, [post.uri, post.author])

  const replyAuthorDid = useMemo(() => {
    if (!record?.reply) {
      return ''
    }
    const urip = new AtUri(record.reply.parent?.uri || record.reply.root.uri)
    return urip.hostname
  }, [record?.reply])

  const onPressReply = React.useCallback(() => {
    openComposer({
      replyTo: {
        uri: post.uri,
        cid: post.cid,
        text: record.text || '',
        author: post.author,
        embed: post.embed,
        moderation,
      },
    })
  }, [post, record, openComposer, moderation])

  const outerStyles = [
    styles.outer,
    {
      borderColor: pal.colors.border,
      paddingBottom:
        isThreadLastChild || (!isThreadChild && !isThreadParent)
          ? 8
          : undefined,
    },
    isThreadChild ? styles.outerSmallTop : undefined,
  ]

  return (
    <Link
      testID={`feedItem-by-${post.author.handle}`}
      style={outerStyles}
      href={href}
      noFeedback
      accessible={false}>
      <View style={{flexDirection: 'row', gap: 10, paddingLeft: 8}}>
        <View style={{width: 52}}>
          {isThreadChild && (
            <View
              style={[
                styles.replyLine,
                {
                  flexGrow: 1,
                  backgroundColor: pal.colors.replyLine,
                  marginBottom: 4,
                },
              ]}
            />
          )}
        </View>

        <View style={{paddingTop: 12, flexShrink: 1}}>
          {isReasonFeedSource(reason) ? (
            <Link href={reason.href}>
              <Text
                type="sm-bold"
                style={pal.textLight}
                lineHeight={1.2}
                numberOfLines={1}>
                <Trans context="from-feed">
                  From{' '}
                  <FeedNameText
                    type="sm-bold"
                    uri={reason.uri}
                    href={reason.href}
                    lineHeight={1.2}
                    numberOfLines={1}
                    style={pal.textLight}
                  />
                </Trans>
              </Text>
            </Link>
          ) : AppBskyFeedDefs.isReasonRepost(reason) ? (
            <Link
              style={styles.includeReason}
              href={makeProfileLink(reason.by)}
              title={_(
                msg`Reposted by ${sanitizeDisplayName(
                  reason.by.displayName || reason.by.handle,
                )}`,
              )}>
              <FontAwesomeIcon
                icon="retweet"
                style={{
                  marginRight: 4,
                  color: pal.colors.textLight,
                  minWidth: 16,
                }}
              />
              <Text
                type="sm-bold"
                style={pal.textLight}
                lineHeight={1.2}
                numberOfLines={1}>
                <Trans>
                  Reposted by{' '}
                  <ProfileHoverCard inline did={reason.by.did}>
                    <TextLinkOnWebOnly
                      type="sm-bold"
                      style={pal.textLight}
                      lineHeight={1.2}
                      numberOfLines={1}
                      text={sanitizeDisplayName(
                        reason.by.displayName ||
                          sanitizeHandle(reason.by.handle),
                        moderation.ui('displayName'),
                      )}
                      href={makeProfileLink(reason.by)}
                    />
                  </ProfileHoverCard>
                </Trans>
              </Text>
            </Link>
          ) : null}
        </View>
      </View>

      <View style={styles.layout}>
        <View style={styles.layoutAvi}>
          <PreviewableUserAvatar
            size={52}
            did={post.author.did}
            handle={post.author.handle}
            avatar={post.author.avatar}
            moderation={moderation.ui('avatar')}
            type={post.author.associated?.labeler ? 'labeler' : 'user'}
          />
          {isThreadParent && (
            <View
              style={[
                styles.replyLine,
                {
                  flexGrow: 1,
                  backgroundColor: pal.colors.replyLine,
                  marginTop: 4,
                },
              ]}
            />
          )}
        </View>
        <View style={styles.layoutContent}>
          <PostMeta
            author={post.author}
            moderation={moderation}
            authorHasWarning={!!post.author.labels?.length}
            timestamp={post.indexedAt}
            postHref={href}
          />
          {!isThreadChild && replyAuthorDid !== '' && (
            <View style={[s.flexRow, s.mb2, s.alignCenter]}>
              <FontAwesomeIcon
                icon="reply"
                size={9}
                style={[
                  {color: pal.colors.textLight} as FontAwesomeIconStyle,
                  s.mr5,
                ]}
              />
              <Text
                type="md"
                style={[pal.textLight, s.mr2]}
                lineHeight={1.2}
                numberOfLines={1}>
                <Trans context="description">
                  Reply to{' '}
                  <ProfileHoverCard inline did={replyAuthorDid}>
                    <UserInfoText
                      type="md"
                      did={replyAuthorDid}
                      attr="displayName"
                      style={[pal.textLight]}
                    />
                  </ProfileHoverCard>
                </Trans>
              </Text>
            </View>
          )}
          <LabelsOnMyPost post={post} />
          <PostContent
            moderation={moderation}
            richText={richText}
            postEmbed={post.embed}
            postAuthor={post.author}
          />
          <PostCtrls
            post={post}
            record={record}
            richText={richText}
            onPressReply={onPressReply}
            logContext="FeedItem"
          />
        </View>
      </View>
    </Link>
  )
}
FeedItemInner = memo(FeedItemInner)

let PostContent = ({
  moderation,
  richText,
  postEmbed,
  postAuthor,
}: {
  moderation: ModerationDecision
  richText: RichTextAPI
  postEmbed: AppBskyFeedDefs.PostView['embed']
  postAuthor: AppBskyFeedDefs.PostView['author']
}): React.ReactNode => {
  const pal = usePalette('default')
  const {_} = useLingui()
  const [limitLines, setLimitLines] = useState(
    () => countLines(richText.text) >= MAX_POST_LINES,
  )

  const onPressShowMore = React.useCallback(() => {
    setLimitLines(false)
  }, [setLimitLines])

  return (
    <ContentHider
      testID="contentHider-post"
      modui={moderation.ui('contentList')}
      ignoreMute
      childContainerStyle={styles.contentHiderChild}>
      <PostAlerts modui={moderation.ui('contentList')} style={[a.py_xs]} />
      {richText.text ? (
        <View style={styles.postTextContainer}>
          <RichText
            enableTags
            testID="postText"
            value={richText}
            numberOfLines={limitLines ? MAX_POST_LINES : undefined}
            style={[a.flex_1, a.text_md]}
            authorHandle={postAuthor.handle}
          />
        </View>
      ) : undefined}
      {limitLines ? (
        <TextLink
          text={_(msg`Show More`)}
          style={pal.link}
          onPress={onPressShowMore}
          href="#"
        />
      ) : undefined}
      {postEmbed ? (
        <View style={[a.pb_sm]}>
          <PostEmbeds embed={postEmbed} moderation={moderation} />
        </View>
      ) : null}
    </ContentHider>
  )
}
PostContent = memo(PostContent)

const styles = StyleSheet.create({
  outer: {
    borderTopWidth: 1,
    paddingLeft: 10,
    paddingRight: 15,
    // @ts-ignore web only -prf
    cursor: 'pointer',
    overflow: 'hidden',
  },
  outerSmallTop: {
    borderTopWidth: 0,
  },
  replyLine: {
    width: 2,
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  includeReason: {
    flexDirection: 'row',
    marginTop: 2,
    marginBottom: 2,
    marginLeft: -20,
  },
  layout: {
    flexDirection: 'row',
    marginTop: 1,
    gap: 10,
  },
  layoutAvi: {
    paddingLeft: 8,
  },
  layoutContent: {
    flex: 1,
  },
  alert: {
    marginTop: 6,
    marginBottom: 6,
  },
  postTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingBottom: 4,
  },
  contentHiderChild: {
    marginTop: 6,
  },
  embed: {
    marginBottom: 6,
  },
  translateLink: {
    marginBottom: 6,
  },
})
