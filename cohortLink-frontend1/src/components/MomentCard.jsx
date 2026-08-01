/**
 * MomentCard.jsx
 *
 * Instagram-style post card for the club Moments feed.
 *
 * Props:
 *   post        — FeedPostResponse object from the backend
 *   onComment   — callback(post) to open the comments drawer
 *
 * Patterns applied:
 *   - React.memo: card never re-renders unless its own post prop changes
 *   - Optimistic UI: like toggles instantly, reverts on API failure
 *   - Multi-image: simple dot carousel using CSS if images.length > 1
 *   - aspectRatio from backend sets the container height before image loads
 *     (prevents layout shift)
 */

import React, { useState, useCallback } from 'react';
import { Avatar, Text, ActionIcon, Loader } from '@mantine/core';
import { Heart, MessageCircle, MapPin } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { likePost, unlikePost } from '../services/api';
import { useAuth } from '../context/AuthContext';

dayjs.extend(relativeTime);

// ─── Image Carousel ───────────────────────────────────────────────────────────
const ImageCarousel = ({ images }) => {
  const [active, setActive] = useState(0);

  if (!images || images.length === 0) return null;

  const sorted = [...images].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  const img    = sorted[active];

  // aspectRatio from backend (e.g. 1.33 = 4:3). Clamp between 0.5 and 1.78 for sanity.
  const ratio    = Math.min(Math.max(img.aspectRatio || 1, 0.5), 1.78);
  const paddingPct = `${(1 / ratio) * 100}%`;

  return (
    <div className="relative w-full overflow-hidden bg-gray-100">
      {/* Aspect-ratio box — reserves height before image loads */}
      <div style={{ paddingBottom: paddingPct }} className="relative w-full">
        <img
          src={img.thumbnailUrl || img.originalImageUrl}
          alt={`Post image ${active + 1}`}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
          loading="lazy"
        />
      </div>

      {/* Dot indicators (only when multiple images) */}
      {sorted.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
          {sorted.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                i === active ? 'bg-white scale-125' : 'bg-white/50'
              }`}
              aria-label={`Image ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Prev / Next tap zones for multi-image */}
      {sorted.length > 1 && (
        <>
          <button
            onClick={() => setActive((p) => Math.max(0, p - 1))}
            className="absolute left-0 top-0 h-full w-1/3 cursor-default"
            aria-label="Previous image"
          />
          <button
            onClick={() => setActive((p) => Math.min(sorted.length - 1, p + 1))}
            className="absolute right-0 top-0 h-full w-1/3 cursor-default"
            aria-label="Next image"
          />
        </>
      )}
    </div>
  );
};

// ─── Gradient placeholder when no image ──────────────────────────────────────
const NoImagePlaceholder = () => (
  <div
    className="w-full h-48 flex items-center justify-center"
    style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
  >
    <span className="text-white/40 text-sm font-medium">No image</span>
  </div>
);

// ─── MomentCard ───────────────────────────────────────────────────────────────
const MomentCard = React.memo(function MomentCard({ post, onComment }) {
  const { dbUser } = useAuth();

  // Optimistic like state
  const [liked, setLiked]         = useState(post.hasLiked ?? false);
  const [likeCount, setLikeCount] = useState(post.likeCount ?? 0);
  const [likeLoading, setLikeLoading] = useState(false);

  const handleLike = useCallback(async () => {
    if (!dbUser) return; // unauthenticated — silently ignore

    // Optimistic update
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => wasLiked ? c - 1 : c + 1);

    try {
      if (wasLiked) {
        setLikeLoading(true);
        await unlikePost(post.id);
      } else {
        setLikeLoading(true);
        await likePost(post.id);
      }
    } catch {
      // Revert on failure
      setLiked(wasLiked);
      setLikeCount((c) => wasLiked ? c + 1 : c - 1);
    } finally {
      setLikeLoading(false);
    }
  }, [liked, post.id, dbUser]);

  const authorName  = post.author?.name  || post.club?.name || 'Unknown';
  const authorAvatar = post.club?.profileImageUrl || null;
  const authorInitial = (post.club?.name || 'C')[0].toUpperCase();

  return (
    <article className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">

      {/* Header — Club avatar + name + time */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Avatar
          src={authorAvatar}
          radius="xl"
          size={38}
          color="blue"
          className="shrink-0"
        >
          {authorInitial}
        </Avatar>
        <div className="flex-1 min-w-0">
          <Text fw={700} size="sm" className="text-slate-800 leading-tight truncate">
            {post.club?.name || authorName}
          </Text>
          <Text size="xs" className="text-slate-400">
            {post.author?.name && post.author.name !== post.club?.name
              ? `${post.author.name} · ` : ''}
            {dayjs(post.createdAt).fromNow()}
          </Text>
        </div>
      </div>

      {/* Image(s) */}
      {post.images && post.images.length > 0
        ? <ImageCarousel images={post.images} />
        : <NoImagePlaceholder />
      }

      {/* Action row */}
      <div className="flex items-center gap-1 px-3 pt-2 pb-1">
        <ActionIcon
          variant="transparent"
          size="lg"
          onClick={handleLike}
          disabled={likeLoading || !dbUser}
          aria-label={liked ? 'Unlike post' : 'Like post'}
          className="transition-transform duration-150 active:scale-90"
        >
          {likeLoading
            ? <Loader size={16} color="red" />
            : <Heart
                size={22}
                className="transition-colors duration-200"
                fill={liked ? '#ef4444' : 'none'}
                stroke={liked ? '#ef4444' : '#64748b'}
              />
          }
        </ActionIcon>
        <Text size="sm" fw={600} className="text-slate-600 mr-3">{likeCount}</Text>

        <ActionIcon
          variant="transparent"
          size="lg"
          onClick={() => onComment(post)}
          aria-label="View comments"
          className="transition-transform duration-150 active:scale-90"
        >
          <MessageCircle size={22} className="text-slate-500" />
        </ActionIcon>
        <Text size="sm" fw={600} className="text-slate-600">{post.commentCount ?? 0}</Text>
      </div>

      {/* Caption */}
      {post.caption && (
        <div className="px-4 pb-3">
          <Text size="sm" className="text-slate-700 leading-relaxed">
            <span className="font-semibold text-slate-800 mr-1">
              {post.club?.name || authorName}
            </span>
            {post.caption}
          </Text>
        </div>
      )}
    </article>
  );
});

export default MomentCard;
