/**
 * useFeed.js
 *
 * Cursor-based infinite scroll hook for the club post feed.
 *
 * Pattern:
 *   - Cursor pagination: passes `createdAt` of the last post as the cursor
 *     to prevent duplicates on scroll (per SKILL.md note).
 *   - IntersectionObserver on a sentinel <div> triggers the next page fetch.
 *   - AGENTS.md Rule: loading initialised to true in useState, never set
 *     synchronously inside a useEffect.
 *
 * Exposes: { posts, loading, loadingMore, hasMore, sentinelRef, error }
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { getClubPostsFeed } from '../services/api';

const PAGE_SIZE = 10;

export function useFeed(clubId) {
  // AGENTS.md: initialise loading true directly in useState
  const [posts, setPosts]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore]       = useState(true);
  const [error, setError]           = useState(null);

  // cursor = createdAt ISO string of the last loaded post; null = first page
  const cursorRef    = useRef(null);
  const sentinelRef  = useRef(null);
  // Prevent concurrent fetches
  const fetchingRef  = useRef(false);

  const fetchPage = useCallback(async (isFirstPage = false) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      const data = await getClubPostsFeed(clubId, isFirstPage ? null : cursorRef.current, PAGE_SIZE);

      // Backend returns a Slice — it may be an array or { content: [] }
      const items = Array.isArray(data) ? data : (data?.content ?? []);

      if (items.length === 0) {
        setHasMore(false);
        return;
      }

      // Update cursor to the createdAt of the last item in this batch
      cursorRef.current = items[items.length - 1].createdAt;

      // If fewer items than requested, we've reached the end
      if (items.length < PAGE_SIZE) setHasMore(false);

      setPosts((prev) => isFirstPage ? items : [...prev, ...items]);
    } catch (err) {
      setError(err.message || 'Failed to load posts.');
    } finally {
      fetchingRef.current = false;
      if (isFirstPage) setLoading(false);
      else setLoadingMore(false);
    }
  }, [clubId]);

  // Initial fetch when clubId changes
  useEffect(() => {
    if (!clubId) return;
    let cancelled = false;

    // Reset state for new club
    setPosts([]);
    setHasMore(true);
    setError(null);
    cursorRef.current = null;
    fetchingRef.current = false;

    // setLoading(true) is NOT called here — it's initialised true in useState
    fetchPage(true).then(() => {
      if (cancelled) return;
    });

    return () => { cancelled = true; };
  }, [clubId, fetchPage]);

  // IntersectionObserver — fires when sentinel enters viewport
  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !fetchingRef.current) {
          setLoadingMore(true);
          fetchPage(false);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, fetchPage]);

  return { posts, loading, loadingMore, hasMore, sentinelRef, error };
}
