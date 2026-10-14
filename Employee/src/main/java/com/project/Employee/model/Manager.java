
package com.project.Employee.model;

import jakarta.persistence.*;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "Employee1")
@Getter
@Setter
@NoArgsConstructor
public class Manager {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer eid;

    private String ename;
    private Integer age;
    private Double salary;
    private String gmail;
    private Long phoneno;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "manager_mid")
    private ManagerAccount manager;
}
