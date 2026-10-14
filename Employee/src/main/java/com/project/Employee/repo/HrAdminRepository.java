package com.project.Employee.repo;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.project.Employee.model.HrAdmin;

public interface HrAdminRepository extends JpaRepository<HrAdmin, Long> {

    Optional<HrAdmin> findByUsername(String username);

    boolean existsByUsername(String username);
}
