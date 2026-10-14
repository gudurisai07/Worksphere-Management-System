package com.project.Employee.repo;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.project.Employee.model.ManagerAccount;

public interface ManagerAccountRepository extends JpaRepository<ManagerAccount, Long> {

    Optional<ManagerAccount> findByGmailIgnoreCase(String gmail);

    Optional<ManagerAccount> findByNameIgnoreCase(String name);

    boolean existsByGmailIgnoreCase(String gmail);

    boolean existsByNameIgnoreCase(String name);
}
