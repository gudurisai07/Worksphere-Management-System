package com.project.Employee.Controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
public class HomeController {

    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> home() {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", "UP");
        response.put("service", "Worksphere Management System API");
        response.put("version", "1.0.0");
        response.put("message", "Application is successfully deployed and connected to the database!");

        Map<String, String> endpoints = new LinkedHashMap<>();
        endpoints.put("welcome", "/manager/wel");
        endpoints.put("getManagers", "/manager/getmanager");
        endpoints.put("apiManagers", "/api/managers");
        endpoints.put("hrLogin", "/api/hr/login");
        endpoints.put("uploadImage", "/api/upload/image");
        response.put("availableEndpoints", endpoints);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        Map<String, String> health = new LinkedHashMap<>();
        health.put("status", "UP");
        return ResponseEntity.ok(health);
    }
}
