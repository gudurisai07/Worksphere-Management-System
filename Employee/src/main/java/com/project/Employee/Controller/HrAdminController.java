package com.project.Employee.Controller;

import java.util.Map;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.project.Employee.model.HrAdmin;
import com.project.Employee.repo.HrAdminRepository;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@RestController
@RequestMapping("/api/hr")
public class HrAdminController {

    private final HrAdminRepository hrRepo;

    public HrAdminController(HrAdminRepository hrRepo) {
        this.hrRepo = hrRepo;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    public static class HrLoginRequest {
        private String username;
        private String password;
    }

    private void ensureHrAdminSeed() {
        if (!hrRepo.existsByUsername("admin")) {
            HrAdmin admin = new HrAdmin();
            admin.setUsername("admin");
            admin.setPassword("admin");
            admin.setFullName("Chief HR Officer");
            admin.setEmail("admin.hr@company.com");
            admin.setRole("HR Admin");
            hrRepo.save(admin);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginHr(@RequestBody HrLoginRequest creds) {
        ensureHrAdminSeed();

        String username = creds != null && creds.getUsername() != null ? creds.getUsername().trim() : "";
        String password = creds != null && creds.getPassword() != null ? creds.getPassword() : "";

        Optional<HrAdmin> opt = hrRepo.findByUsername(username);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid HR admin username."));
        }

        HrAdmin admin = opt.get();
        if (!password.equals(admin.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid HR admin password."));
        }

        return ResponseEntity.ok(Map.of(
                "id", admin.getId(),
                "username", admin.getUsername(),
                "fullName", admin.getFullName(),
                "email", admin.getEmail(),
                "role", admin.getRole()
        ));
    }
}
