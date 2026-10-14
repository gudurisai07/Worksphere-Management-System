package com.project.Employee.Controller;

import java.time.Instant;
import java.util.*;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.project.Employee.model.ManagerAccount;
import com.project.Employee.repo.ManagerAccountRepository;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@RestController
@RequestMapping("/api/managers")
public class ManagerAccountController {

    private final ManagerAccountRepository managerRepo;

    public ManagerAccountController(ManagerAccountRepository managerRepo) {
        this.managerRepo = managerRepo;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    public static class ManagerLoginRequest {
        private String emailOrName;
        private String password;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    public static class GoogleAuthRequest {
        private String email;
        private String name;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    public static class PromoteRequest {
        private String sector;
        private String department; // Domain
        private String position;
        private String ranking;
        private Double salary;
        private String profilePic;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    public static class StatusRequest {
        private String status; // "Active" or "Inactive"
    }

    // GET /api/managers - returns exact real managers from MySQL (no auto re-seeding!)
    @GetMapping
    public List<ManagerAccount> getAllManagers() {
        return managerRepo.findAll();
    }

    // POST /api/managers/register - save manager in MySQL with unique checks
    @PostMapping("/register")
    public ResponseEntity<?> registerManager(@RequestBody ManagerAccount m) {
        String name = m.getName() != null ? m.getName().trim() : "";
        String gmail = m.getGmail() != null ? m.getGmail().trim().toLowerCase() : "";

        if (name.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Name is required."));
        }
        if (gmail.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email is required."));
        }

        // Unique Name Check
        if (managerRepo.existsByNameIgnoreCase(name)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Manager name \"" + name + "\" is already registered."));
        }

        // Unique Email Check
        if (managerRepo.existsByGmailIgnoreCase(gmail)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Email \"" + gmail + "\" is already registered. Please login."));
        }

        m.setName(name);
        m.setGmail(gmail);
        if (m.getPosition() == null || m.getPosition().isBlank()) {
            m.setPosition("Team Manager");
        }
        if (m.getRanking() == null || m.getRanking().isBlank()) {
            m.setRanking("Standard Lead");
        }
        if (m.getRegisteredAt() == null || m.getRegisteredAt().isBlank()) {
            m.setRegisteredAt(Instant.now().toString());
        }
        if (m.getStatus() == null || m.getStatus().isBlank()) {
            m.setStatus("Active");
        }
        if (m.getSalary() == null || m.getSalary() <= 0) {
            m.setSalary(85000.0);
        }

        ManagerAccount saved = managerRepo.save(m);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // POST /api/managers/login - verify manager credentials from MySQL
    @PostMapping("/login")
    public ResponseEntity<?> loginManager(@RequestBody ManagerLoginRequest creds) {
        String query = creds != null && creds.getEmailOrName() != null ? creds.getEmailOrName().trim() : "";
        String password = creds != null && creds.getPassword() != null ? creds.getPassword() : "";

        Optional<ManagerAccount> match = managerRepo.findByGmailIgnoreCase(query);
        if (match.isEmpty()) {
            match = managerRepo.findByNameIgnoreCase(query);
        }

        if (match.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Manager account not found. Please register first."));
        }

        ManagerAccount manager = match.get();

        // Status check: Inactive managers cannot login
        if ("Inactive".equalsIgnoreCase(manager.getStatus())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Your manager account has been deactivated (OFF) by HR. Please contact administrator."));
        }

        if (!password.equals(manager.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid manager password."));
        }

        return ResponseEntity.ok(manager);
    }

    // POST /api/managers/google-auth - authenticates or auto-registers with Google in MySQL
    @PostMapping("/google-auth")
    public ResponseEntity<?> googleAuth(@RequestBody GoogleAuthRequest payload) {
        String email = payload != null && payload.getEmail() != null ? payload.getEmail().trim().toLowerCase() : "";
        String name = payload != null && payload.getName() != null ? payload.getName().trim() : "Google Manager";

        if (email.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Google email is required."));
        }

        Optional<ManagerAccount> existing = managerRepo.findByGmailIgnoreCase(email);
        if (existing.isPresent()) {
            ManagerAccount manager = existing.get();
            if ("Inactive".equalsIgnoreCase(manager.getStatus())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Your manager account has been deactivated (OFF) by HR."));
            }
            return ResponseEntity.ok(manager);
        }

        ManagerAccount newMgr = new ManagerAccount();
        if (managerRepo.existsByNameIgnoreCase(name)) {
            name = name + " (" + email.split("@")[0] + ")";
        }
        newMgr.setName(name);
        newMgr.setGmail(email);
        newMgr.setPhoneno(9888877777L);
        newMgr.setSector("IT");
        newMgr.setDepartment("Artificial Intelligence & Machine Learning (AI/ML)");
        newMgr.setPosition("Team Manager");
        newMgr.setRanking("Standard Lead");
        newMgr.setPassword("google-oauth");
        newMgr.setRegisteredAt(Instant.now().toString());
        newMgr.setStatus("Active");
        newMgr.setSalary(95000.0);

        ManagerAccount saved = managerRepo.save(newMgr);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // PUT /api/managers/{id}/status - HR toggles Active (ON) / Inactive (OFF) in MySQL
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateManagerStatus(
            @PathVariable Long id,
            @RequestBody StatusRequest req) {

        Optional<ManagerAccount> opt = managerRepo.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Manager not found with ID " + id));
        }

        ManagerAccount m = opt.get();
        String targetStatus = req != null && req.getStatus() != null && req.getStatus().equalsIgnoreCase("Inactive")
                ? "Inactive"
                : "Active";
        m.setStatus(targetStatus);

        ManagerAccount saved = managerRepo.save(m);
        return ResponseEntity.ok(saved);
    }

    // PUT /api/managers/{id}/promote - HR assigns top position, updates domain & salary
    @PutMapping("/{id}/promote")
    public ResponseEntity<?> promoteManager(
            @PathVariable Long id,
            @RequestBody PromoteRequest req) {

        Optional<ManagerAccount> opt = managerRepo.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Manager not found with ID " + id));
        }

        ManagerAccount m = opt.get();
        if (req != null) {
            if (req.getSector() != null && !req.getSector().isBlank()) {
                m.setSector(req.getSector().trim());
            }
            if (req.getDepartment() != null && !req.getDepartment().isBlank()) {
                m.setDepartment(req.getDepartment().trim()); // Domain
            }
            if (req.getPosition() != null && !req.getPosition().isBlank()) {
                m.setPosition(req.getPosition().trim());
            }
            if (req.getRanking() != null && !req.getRanking().isBlank()) {
                m.setRanking(req.getRanking().trim());
            }
            if (req.getSalary() != null && req.getSalary() > 0) {
                m.setSalary(req.getSalary());
            }
            if (req.getProfilePic() != null && !req.getProfilePic().isBlank()) {
                m.setProfilePic(req.getProfilePic());
            }
        }

        ManagerAccount updated = managerRepo.save(m);
        return ResponseEntity.ok(updated);
    }

    // PUT /api/managers/{id}/avatar - update manager profile picture
    @PutMapping("/{id}/avatar")
    public ResponseEntity<?> updateAvatar(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Optional<ManagerAccount> opt = managerRepo.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Manager not found with ID " + id));
        }
        ManagerAccount m = opt.get();
        String pic = body != null ? body.get("profilePic") : null;
        m.setProfilePic(pic);
        ManagerAccount saved = managerRepo.save(m);
        return ResponseEntity.ok(saved);
    }

    // DELETE /api/managers/{id} - delete single manager from MySQL
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteManager(@PathVariable Long id) {
        if (!managerRepo.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Manager not found with ID " + id));
        }
        managerRepo.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Manager " + id + " deleted successfully."));
    }

    // DELETE /api/managers/deleteall - delete all managers from MySQL
    @DeleteMapping("/deleteall")
    public ResponseEntity<?> deleteAllManagers() {
        managerRepo.deleteAll();
        return ResponseEntity.ok(Map.of("message", "All managers deleted successfully from database."));
    }
}
