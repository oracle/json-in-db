package emp;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.SQLException;

import oracle.sql.json.OracleJsonFactory;
import oracle.sql.json.OracleJsonObject;

/**
 * Performs a partial update using JSON_MERGEPATCH.
 * 
 * <p>
 * Run first: {@link CreateTable}, {@link Insert}
 * </p>
 */
public class UpdateMerge {

    public static void main(String[] args) throws SQLException {
        OracleJsonFactory factory = new OracleJsonFactory();
        
        try (Connection con = DriverManager.getConnection(args[0])) {
        
            PreparedStatement stmt = con.prepareStatement(
                "UPDATE emp e " +
                "SET e.data = JSON_MERGEPATCH(e.data, :1) " +
                "WHERE e.data.name.string() = :2");
                
            OracleJsonObject patch = factory.createObject();
            patch.put("job", "Architect");
            patch.put("salary", 60000);
            
            stmt.setObject(1, patch);
            stmt.setString(2, "Miller");
            
            stmt.execute();
            
            System.out.println("Miller's salary and title have been updated"); 
        }            
    }

}
