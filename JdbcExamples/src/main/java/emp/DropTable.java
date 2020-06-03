package emp;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;

/** 
 * Drops the employee table used by the other examples. 
 */
public class DropTable {

    public static void main(String[] args) throws SQLException {
        try (Connection con = DriverManager.getConnection(args[0])) {
            Statement stmt = con.createStatement();
            stmt.execute("drop table emp");
        }
    }

}
