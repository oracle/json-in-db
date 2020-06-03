package emp;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.SQLException;

/**
 * Performs a partial update using JSON_TRANSFORM.
 * 
 * <p>
 * Run first: {@link CreateTable}, {@link Insert}
 * </p>
 */
public class UpdateTransform {

    public static void main(String[] args) throws SQLException {
        
        try (Connection con = DriverManager.getConnection(args[0])) {
        
            PreparedStatement stmt = con.prepareStatement(
                "UPDATE emp e " +
                "SET e.data = JSON_TRANSFORM(e.data, SET '$.salary' = :1) " +
                "WHERE e.data.name.string() = :2");
                
            stmt.setInt(1, 70000);
            stmt.setString(2, "Miller");
            
            stmt.execute();
            
            System.out.println("Miller's salary has been updated!"); 
        }            
    }

}
