package com.example.demo.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class AlreadyFollowingException extends RuntimeException {
    public AlreadyFollowingException(String message) {
        super(message);
    }
}
