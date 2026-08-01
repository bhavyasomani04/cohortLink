/**
 * CommentsDrawer.jsx
 *
 * Slide-up bottom drawer showing comments for a post.
 * Opens lazily — comments are only fetched when the drawer opens.
 *
 * Props:
 *   post      — FeedPostResponse | null  (null = drawer closed)
 *   onClose   — callback to close the drawer
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Drawer, Text, Avatar, Textarea, Button,
  Loader, ScrollArea, Divider,
} from '@mantine/core';
import { Send } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { getPostComments, addComment } from '../services/api';
import { useAuth } from '../context/AuthContext';

dayjs.extend(relativeTime);

const CommentsDrawer = ({ post, onClose }) => {
  const { dbUser } = useAuth();

  const [comments, setComments]       = useState([]);
  const [loading, setLoading]         = useState(false);
  const [hasMore, setHasMore]         = useState(true);
  const [page, setPage]               = useState(0);
  const [draft, setDraft]             = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const bottomRef = useRef(null);

  const isOpen = !!post;

  // Fetch first page of comments when drawer opens
  useEffect(() => {
    if (!post?.id) return;
    let cancelled = false;

    setComments([]);
    setPage(0);
    setHasMore(true);
    setLoading(true);

    getPostComments(post.id, 0, 20)
      .then((data) => {
        if (cancelled) return;
        const items = Array.isArray(data) ? data : (data?.content ?? []);
        setComments(items);
        if (items.length < 20) setHasMore(false);
      })
      .catch(() => { /* non-critical */ })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [post?.id]);

  const loadMore = async () => {
    const nextPage = page + 1;
    setPage(nextPage);
    const data = await getPostComments(post.id, nextPage, 20).catch(() => []);
    const items = Array.isArray(data) ? data : (data?.content ?? []);
    setComments((prev) => [...prev, ...items]);
    if (items.length < 20) setHasMore(false);
  };

  const handleSubmit = async () => {
    if (!draft.trim() || !dbUser) return;
    setSubmitting(true);
    try {
      const newComment = await addComment(post.id, draft.trim());
      setComments((prev) => [newComment, ...prev]);
      setDraft('');
      // Scroll to top after posting
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch {
      // silently fail — user can retry
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      opened={isOpen}
      onClose={onClose}
      position="bottom"
      size="75vh"
      radius="lg"
      title={
        <Text fw={700} size="md" className="text-slate-800">
          Comments {post?.commentCount != null ? `(${post.commentCount})` : ''}
        </Text>
      }
      styles={{
        header: { paddingBottom: 12, borderBottom: '1px solid #f1f5f9' },
        body: { padding: 0, display: 'flex', flexDirection: 'column', height: 'calc(75vh - 60px)' },
      }}
    >
      {/* Comment list */}
      <ScrollArea className="flex-1 px-4 py-3" style={{ flex: 1 }}>
        <div ref={bottomRef} />

        {loading && (
          <div className="flex justify-center py-8">
            <Loader size="sm" color="blue" />
          </div>
        )}

        {!loading && comments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Text size="sm" className="text-slate-400">No comments yet. Be the first!</Text>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <Avatar size={32} radius="xl" color="blue" className="shrink-0">
                {(c.author?.name || 'U')[0].toUpperCase()}
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <Text size="sm" fw={700} className="text-slate-800">{c.author?.name || 'User'}</Text>
                  <Text size="xs" className="text-slate-400">{dayjs(c.createdAt).fromNow()}</Text>
                </div>
                <Text size="sm" className="text-slate-600 leading-relaxed">{c.content}</Text>
              </div>
            </div>
          ))}
        </div>

        {hasMore && !loading && comments.length > 0 && (
          <div className="flex justify-center pt-4 pb-2">
            <Button variant="subtle" size="xs" onClick={loadMore} className="text-slate-500">
              Load more
            </Button>
          </div>
        )}
      </ScrollArea>

      {/* Comment input — only for authenticated users */}
      {dbUser ? (
        <>
          <Divider />
          <div className="flex items-end gap-2 px-4 py-3">
            <Avatar size={32} radius="xl" color="blue" className="shrink-0 mb-1">
              {(dbUser.name || 'U')[0].toUpperCase()}
            </Avatar>
            <Textarea
              className="flex-1"
              placeholder="Add a comment…"
              value={draft}
              onChange={(e) => setDraft(e.currentTarget.value)}
              minRows={1}
              maxRows={4}
              autosize
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              styles={{ input: { borderRadius: 20, paddingLeft: 14 } }}
            />
            <Button
              size="sm"
              radius="xl"
              loading={submitting}
              disabled={!draft.trim()}
              onClick={handleSubmit}
              className="mb-1 border-0"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}
              aria-label="Post comment"
            >
              <Send size={16} />
            </Button>
          </div>
        </>
      ) : (
        <div className="px-4 py-3 border-t border-gray-100 text-center">
          <Text size="sm" className="text-slate-400">Sign in to leave a comment</Text>
        </div>
      )}
    </Drawer>
  );
};

export default CommentsDrawer;
