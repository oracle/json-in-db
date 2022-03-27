package emp;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

import javax.json.bind.JsonbBuilder;
import javax.json.stream.JsonGenerator;
import javax.json.stream.JsonParser;

import org.eclipse.yasson.YassonJsonb;

import emp.model.Emp;
import emp.model.Phone;
import oracle.jdbc.OracleTypes;
import oracle.sql.json.OracleJsonFactory;
import oracle.ucp.jdbc.PoolDataSource;
import oracle.ucp.jdbc.PoolDataSourceFactory;

/**
 * Stores and retrieves a plain/custom Java object as JSON using JSON-B (javax.json.bind). 
 * @see https://javaee.github.io/jsonb-spec/
 */
public class JSONB {
    
    public static void main(String[] args) throws SQLException {
        
        OracleJsonFactory factory = new OracleJsonFactory();
        YassonJsonb jsonb = (YassonJsonb) JsonbBuilder.create();
        
        PoolDataSource pool = PoolDataSourceFactory.getPoolDataSource();
        pool.setURL(String.join("", args));
        pool.setConnectionFactoryClassName("oracle.jdbc.pool.OracleDataSource");
        
        try (Connection con = pool.getConnection()) {
            
            Emp emp = new Emp();
            emp.setName("King");
            emp.setEmail("king@oracle.com");
            emp.setSalary(BigDecimal.valueOf(200000));
            emp.setJob("President");
            
            List<Phone> phones = new ArrayList<Phone>();
            phones.add(new Phone(Phone.Type.MOBILE, "555-333-2222"));
            phones.add(new Phone(Phone.Type.WORK, "555-333-1111"));
            emp.setPhoneNumbers(phones);
            
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
            for (Phone p : e.getPhoneNumbers()) {
                System.out.println("  " + p.getType() + " " + p.getNumber());
            }
        }
        
    }
}
