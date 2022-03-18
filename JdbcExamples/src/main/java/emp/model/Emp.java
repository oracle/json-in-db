package emp.model;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class Emp {

    String name;
    
    String job;
    
    BigDecimal salary;
    
    String email;
    
    List<Phone> phoneNumbers = new ArrayList<Phone>();

    public Emp() {
        
    }
    
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getJob() {
        return job;
    }

    public void setJob(String job) {
        this.job = job;
    }

    public BigDecimal getSalary() {
        return salary;
    }

    public void setSalary(BigDecimal salary) {
        this.salary = salary;
    }
    
    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
    
    public List<Phone> getPhoneNumbers() {
        return this.phoneNumbers;
    }
    
    public void setPhoneNumbers(List<Phone> phones) {
        this.phoneNumbers = phones;
    }

}