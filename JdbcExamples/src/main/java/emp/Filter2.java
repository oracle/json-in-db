package emp;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import oracle.sql.json.OracleJsonObject;
import oracle.sql.json.OracleJsonValue;

/**
 * With JSON, objects in a table can have different sets of attributes and
 * the types of attributes can vary across values. This example select employees
 * from the emp table that have a "created" attribute and checks the type
 * of the top-level value retrieved and the type of a nested value.
 * 
 * <p>
 * Run first: {@link CreateTable}, {@link Insert}
 * </p>
 */
public class Filter2 {

    public static void main(String[] args) throws SQLException {
        try (Connection con = DriverManager.getConnection(args[0])) {
            // Filter by existence
            PreparedStatement stmt = con.prepareStatement(
              "SELECT e.data FROM emp e WHERE JSON_EXISTS(data, '$.created')");
    
            ResultSet rs = stmt.executeQuery();
            rs.next();
            
            OracleJsonValue v1 = rs.getObject(1, OracleJsonValue.class);
            
            System.out.println("The type of v1 is " + v1.getOracleJsonType());
            
            // Casts the value to OracleJsonObject 
            OracleJsonObject obj = v1.asJsonObject();
            
            OracleJsonValue v2 = obj.get("created");
            
            System.out.println("The type of v2 is " + v2.getOracleJsonType());
            
            System.out.println(obj.getString("name") + " created " + v2.asJsonTimestamp().getString());
            
            rs.close();
            stmt.close();
        }
    }

}
