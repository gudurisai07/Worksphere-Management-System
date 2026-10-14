package com.project.Employee.exception;

/** Thrown when another employee already uses the same email. Mapped to HTTP 409. */
public class DuplicateEmailException extends RuntimeException {

    public DuplicateEmailException(String gmail) {
        super("An employee with email '" + gmail + "' already exists");
    }
}
