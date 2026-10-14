package com.project.Employee.exception;

/** Thrown when the request body has missing or invalid data. Mapped to HTTP 400. */
public class InvalidEmployeeException extends RuntimeException {

    public InvalidEmployeeException(String message) {
        super(message);
    }
}
