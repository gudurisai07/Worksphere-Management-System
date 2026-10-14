package com.project.Employee.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "managers", uniqueConstraints = {
    @UniqueConstraint(columnNames = "name"),
    @UniqueConstraint(columnNames = "gmail")
})
@Getter
@Setter
@NoArgsConstructor
public class ManagerAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long mid;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false, unique = true)
    private String gmail;

    @Column(nullable = false)
    private Long phoneno;

    @Column(nullable = false)
    private String sector; // "IT" or "NON-IT"

    @Column(nullable = false)
    private String department; // Domain / field (e.g. Software Engineering & Tech Lead)

    @Column(nullable = false)
    private String position; // e.g. Team Manager, Senior Director, Vice President, Head of Department

    private String ranking; // "Top Executive", "Senior Leadership", "Associate Lead"

    private String password;

    private String registeredAt;

    private String status; // "Active" or "Inactive"

    private Double salary; // Manager salary in database

    @Column(name = "profile_pic", columnDefinition = "TEXT")
    private String profilePic; // Cloudinary image URL or avatar
}
