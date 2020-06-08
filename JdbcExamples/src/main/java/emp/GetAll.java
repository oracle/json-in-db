package emp;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

/**
 * Gets all the JSON values from the employee table.
 * 
 * <p>
 * Run first: {@link CreateTable}, {@link Insert}
 * </p>
 */
public class GetAll {

    public static void main(String[] args) throws SQLException {
        try (Connection con = DriverManager.getConnection(args[0])) {
            Statement stmt = con.createStatement();
            
            ResultSet rs = stmt.executeQuery("SELECT data FROM emp");
            
            while (rs.next()) {
                String text = rs.getObject(1, String.class);
                System.out.println(text);
            }
            
            rs.close();
        }
    }

}
