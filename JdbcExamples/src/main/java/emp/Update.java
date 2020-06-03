package emp;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

import oracle.jdbc.OracleType;
import oracle.sql.json.OracleJsonFactory;
import oracle.sql.json.OracleJsonObject;

/**
 * Updates an employee record using whole document replacement.
 * 
 * <p>
 * Run first: {@link CreateTable}, {@link Insert}
 * </p>
 */
public class Update {

    public static void main(String[] args) throws Exception {
        OracleJsonFactory factory = new OracleJsonFactory();
        
        try (Connection con = DriverManager.getConnection(args[0])) {
        
            PreparedStatement stmt = con.prepareStatement(
                    "SELECT e.data FROM emp e WHERE e.data.name.string() = :1");
                
            stmt.setString(1, "Blake");
            
            ResultSet rs = stmt.executeQuery();
            rs.next();
            
            OracleJsonObject obj = rs.getObject(1, OracleJsonObject.class);
            
            System.out.println(obj);
            
            // At this point, obj is a direct pointer into binary JSON sent 
            // from the server and is immutable.  Calling put() on the object
            // would raise an error.  The next line makes a mutable copy:
            obj = factory.createObject(obj);

            obj.put("salary", 25000);
            
            PreparedStatement update = con.prepareStatement(
                    "UPDATE emp e SET e.data = :1 WHERE e.data.name.string() = :2");
            
            update.setObject(1, obj, OracleType.JSON);
            update.setString(2, "Blake");
            update.execute();
            
            System.out.println("Blake's salary is updated");
            System.out.println(obj);
        }
    }

}
