package emp;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.sql.Connection;

import javax.json.bind.JsonbBuilder;
import javax.json.stream.JsonGenerator;
import javax.json.stream.JsonParser;

import org.eclipse.yasson.YassonJsonb;

import oracle.soda.OracleCollection;
import oracle.soda.OracleDatabase;
import oracle.soda.OracleDocument;
import oracle.soda.rdbms.OracleRDBMSClient;
import oracle.sql.json.OracleJsonFactory;
import oracle.ucp.jdbc.PoolDataSource;
import oracle.ucp.jdbc.PoolDataSourceFactory;

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

    public static void main(String[] args) throws Exception {
        
        OracleJsonFactory factory = new OracleJsonFactory();
        YassonJsonb jsonb = (YassonJsonb) JsonbBuilder.create();
        
        OracleRDBMSClient client = new OracleRDBMSClient();
        PoolDataSource pool = PoolDataSourceFactory.getPoolDataSource();
        pool.setMaxStatements(50);
        pool.setURL(args[0]);
        pool.setConnectionFactoryClassName("oracle.jdbc.pool.OracleDataSource");
        
        try (Connection con = pool.getConnection()) {
            OracleDatabase db = client.getDatabase(con);
            OracleCollection col = db.openCollection("employees");
            
            
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
            OracleDocument doc = db.createDocumentFrom(out.toByteArray());
            col.insert(doc);
            
            System.out.println("Employee object inserted successfully!");
            
            OracleDocument king = col.find().filter("{\"name\":\"King\"}").getOne();
            JsonParser parser = king.getContentAs(JsonParser.class);
            Emp e = jsonb.fromJson(parser, Emp.class);
            System.out.println("Employee object retrieved from database. ");
            System.out.println(e.getName() + ", " + e.getEmail());
        }
        
    }
}
