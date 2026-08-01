package com.example.demo.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.stream.Collectors;

/**
 * Centralised exception-to-HTTP-response mapping.
 *
 * <p>Rules:
 * <ul>
 *   <li>No stack traces are ever exposed in response bodies.</li>
 *   <li>Internal details are only logged server-side.</li>
 *   <li>All responses use a consistent JSON structure.</li>
 * </ul>
 *
 * <p>Response shape:
 * <pre>
 * { "error": "...", "message": "..." }       — for most errors
 * { "error": "...", "details": { "field": "message" } }  — for validation errors
 * </pre>
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    // ── 404 Not Found ─────────────────────────────────────────────────────────

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(ResourceNotFoundException ex) {
        log.debug("Resource not found: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "Not Found", "message", ex.getMessage()));
    }

    // ── 409 Conflict ──────────────────────────────────────────────────────────

    @ExceptionHandler(EmailAlreadyExistsException.class)
    public ResponseEntity<Map<String, String>> handleEmailConflict(EmailAlreadyExistsException ex) {
        log.debug("Email conflict: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("error", "Conflict", "message", "Email already registered"));
    }


    @ExceptionHandler(AlreadyFollowingException.class)
    public ResponseEntity<Map<String, String>> handleAlreadyFollowing(AlreadyFollowingException ex) {
        log.debug("Already following: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("error", "Conflict", "message", "Already following this club"));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> handleIllegalState(IllegalStateException ex) {
        log.debug("Illegal state: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("error", "Conflict", "message", ex.getMessage()));
    }

    // ── 400 Validation ────────────────────────────────────────────────────────

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.toMap(
                        FieldError::getField,
                        fe -> fe.getDefaultMessage() != null ? fe.getDefaultMessage() : "Invalid value",
                        (a, b) -> a   // keep first message on duplicate field
                ));
        log.debug("Validation failed: {}", fieldErrors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", "Validation Failed", "details", fieldErrors));
    }

    // ── ResponseStatusException (403, etc.) ───────────────────────────────────

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handleResponseStatus(ResponseStatusException ex) {
        log.debug("ResponseStatusException: {} {}", ex.getStatusCode(), ex.getReason());
        return ResponseEntity.status(ex.getStatusCode())
                .body(Map.of("error", ex.getStatusCode().toString(),
                             "message", ex.getReason() != null ? ex.getReason() : ""));
    }

    // ── Catch-all: 500 Internal Server Error ──────────────────────────────────

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleAll(Exception ex) {
        // Log full stack trace server-side only
        log.error("Unhandled exception", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Internal Server Error"));
    }
}
