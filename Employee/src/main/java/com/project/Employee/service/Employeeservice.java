
package com.project.Employee.service;

import java.util.List;
import com.project.Employee.model.Manager;

public interface Employeeservice {

    Manager createManagerdata(Manager m);

    List<Manager> getAllmanagerinfo();

    Manager getManager(Integer eid);

    Manager updatedata(Integer eid, Manager m);

    void deletedata(Integer eid);

    Manager findbyEmail(String gmail);

    void deleteAlldata();
}
