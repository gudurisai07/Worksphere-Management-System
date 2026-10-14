package com.project.Employee.Controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import com.project.Employee.model.Manager;
import com.project.Employee.service.Employeeservice;

@RestController
@RequestMapping("/manager")
public class Employeecontroller {

    @Autowired
    private Employeeservice employeeservice;

    @GetMapping("/wel")
    public String welcome() {
        return "hi sai";
    }

    @GetMapping("/getmanager")
    public List<Manager> getAllManager() {
        return employeeservice.getAllmanagerinfo();
    }

    @GetMapping("/getmgr/{eid}")
    public Manager getmanager(@PathVariable Integer eid) {
        return employeeservice.getManager(eid);
    }

    @GetMapping("/geteml/{gmail}")
    public Manager getManager(@PathVariable String gmail) {
        return employeeservice.findbyEmail(gmail);
    }

    // CHANGED: returns 201 Created (was 200). Path and body are unchanged.
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Manager createdemployeeinfo(@RequestBody Manager m) {
        return employeeservice.createManagerdata(m);
    }

    @PutMapping("/update/{eid}")
    public Manager updateManager(
            @PathVariable Integer eid,
            @RequestBody Manager m) {
        return employeeservice.updatedata(eid, m);
    }

    @DeleteMapping("/delete/{eid}")
    public String deleteManager(@PathVariable Integer eid) {
        employeeservice.deletedata(eid);
        return "Manager " + eid + " deleted successfully";
    }

    @DeleteMapping("/deleteall")
    public String deleteAllManagers() {
        employeeservice.deleteAlldata();
        return "All employees deleted successfully";
    }
}
