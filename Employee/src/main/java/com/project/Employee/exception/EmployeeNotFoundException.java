package com.project.Employee.exception;

/** Thrown when an employee cannot be found by id or by email. Mapped to HTTP 404. */
public class EmployeeNotFoundException extends RuntimeException {

    public EmployeeNotFoundException(String message) {
        super(message);
    }

    public static EmployeeNotFoundException withId(Integer eid) {
        return new EmployeeNotFoundException("Employee not found with id: " + eid);
    }

    public static EmployeeNotFoundException withEmail(String gmail) {
        return new EmployeeNotFoundException("Employee not found with email: " + gmail);
    }
}
