package com.project.Employee.repo;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.project.Employee.model.Manager;

public interface Employeerepo
        extends JpaRepository<Manager, Integer> {

    // CHANGED: returns Optional (no more silent null) and uses "First" so that
    // pre-existing duplicate emails in the table cannot crash the lookup.
    Optional<Manager> findFirstByGmailIgnoreCase(String gmail);

    boolean existsByGmailIgnoreCase(String gmail);

    // Used on update: "does a DIFFERENT employee already use this email?"
    boolean existsByGmailIgnoreCaseAndEidNot(String gmail, Integer eid);
}
