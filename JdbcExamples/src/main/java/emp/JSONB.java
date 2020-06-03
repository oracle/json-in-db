package emp;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import javax.json.bind.JsonbBuilder;
import javax.json.stream.JsonGenerator;
import javax.json.stream.JsonParser;

import org.eclipse.yasson.YassonJsonb;

import oracle.jdbc.OracleTypes;
import oracle.sql.json.OracleJsonFactory;

/**
 * Stores and retrieves a plain/custom Java object as JSON using JSON-B (javax.json.bind). 
 * @see https://javaee.github.io/jsonb-spec/
 */
public class JSONB {
    
    public static class Emp {

        String name;
        
        String job;
        
        BigDecimal salary;
        
        String email;

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

    }

    public static void main(String[] args) throws SQLException {
        
        OracleJsonFactory factory = new OracleJsonFactory();
        YassonJsonb jsonb = (YassonJsonb) JsonbBuilder.create();
        
        try (Connection con = DriverManager.getConnection(args[0])) {
            
            Emp emp = new Emp();
            emp.setName("King");
            emp.setEmail("king@oracle.com");
            emp.setSalary(BigDecimal.valueOf(200000));
            emp.setJob("President");
            
            // convert Emp class to binary JSON
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            JsonGenerator gen = factory.createJsonBinaryGenerator(out)
                    .wrap(JsonGenerator.class);
            jsonb.toJson(emp, gen);
            gen.close();
            byte[] oson = out.toByteArray();
            
            PreparedStatement stmt = con.prepareStatement("INSERT INTO emp VALUES (?)");
            stmt.setObject(1, oson, OracleTypes.JSON);
            stmt.execute();
            stmt.close();
            
            System.out.println("Emp object inserted successfully!");
            
            stmt = con.prepareStatement(
                "SELECT e.data FROM emp e WHERE e.data.name.string() = :1");
            stmt.setString(1, "King");
            ResultSet rs = stmt.executeQuery();
            rs.next();
            JsonParser parser = rs.getObject(1, JsonParser.class);
            Emp e = jsonb.fromJson(parser, Emp.class);
            System.out.println("Emp object retrieved from database. ");
            System.out.println(e.getName() + ", " + e.getEmail());
        }
        
    }
}
