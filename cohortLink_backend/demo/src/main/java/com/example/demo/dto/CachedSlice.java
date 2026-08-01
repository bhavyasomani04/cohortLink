package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Slice;

import java.util.List;

/**
 * A fully Jackson-serializable wrapper around Spring Data's {@link Slice}.
 *
 * <p>Spring's {@code SliceImpl} has no default constructor, making it impossible for
 * Jackson to deserialize from Redis cache. This class mirrors the JSON shape that
 * {@code SliceImpl} produces (so the frontend does not need any changes), but is a
 * plain POJO that Jackson can freely serialize and deserialize.
 *
 * <p>Use {@link #of(Slice)} to convert a {@code Slice} from the repository into a
 * {@code CachedSlice} before storing it in Redis.
 *
 * @param <T> the type of elements in the slice
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CachedSlice<T> {

    /** The page content — the actual list of items. */
    private List<T> content;

    /** Whether there is a next page (used by the frontend for infinite scroll). */
    private boolean hasNext;

    /** Whether this is the last page ({@code !hasNext}). */
    private boolean last;

    /** Whether this is the first page ({@code number == 0}). */
    private boolean first;

    /** Zero-based page number. */
    private int number;

    /** Requested page size (e.g. 12). */
    private int size;

    /** Actual number of elements returned on this page (may be less than {@code size} on last page). */
    private int numberOfElements;

    /** Whether the content list is empty. */
    private boolean empty;

    /**
     * Factory method — converts a Spring Data {@link Slice} into a {@link CachedSlice}.
     *
     * @param slice the source slice from the repository / service
     * @param <T>   element type
     * @return a cacheable, fully serializable representation of the slice
     */
    public static <T> CachedSlice<T> of(Slice<T> slice) {
        return new CachedSlice<>(
                new java.util.ArrayList<>(slice.getContent()),
                slice.hasNext(),
                slice.isLast(),
                slice.isFirst(),
                slice.getNumber(),
                slice.getSize(),
                slice.getNumberOfElements(),
                slice.isEmpty()
        );
    }
}
