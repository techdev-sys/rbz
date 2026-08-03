package com.rbz.licensingsystem.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.client.RestClientException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(RestClientException.class)
    public ResponseEntity<Object> handleRestClientException(RestClientException ex) {
        log.error("External Service Error: ", ex);
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.SERVICE_UNAVAILABLE.value());
        body.put("error", "AI Service Unavailable");
        body.put("message", "The AI service is currently overloaded or unreachable. Please try again later.");

        return new ResponseEntity<>(body, HttpStatus.SERVICE_UNAVAILABLE);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Object> handleMaxSizeException(MaxUploadSizeExceededException exc) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.EXPECTATION_FAILED.value());
        body.put("error", "File too large");
        body.put("message", "File too large! Please upload a file smaller than 50MB.");
        return new ResponseEntity<>(body, HttpStatus.EXPECTATION_FAILED);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> handleAllExceptions(Exception ex) {
        // Never expose internal exception details to the client. Log the full
        // error server-side with a reference ID the user can quote to support.
        String referenceId = java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        log.error("Unexpected Error [ref {}]: ", referenceId, ex);
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        body.put("error", "Internal Server Error");
        body.put("message", "Something went wrong on our side. Please try again. "
                + "If the problem persists, contact support and quote reference " + referenceId + ".");
        body.put("reference", referenceId);

        return new ResponseEntity<>(body, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
