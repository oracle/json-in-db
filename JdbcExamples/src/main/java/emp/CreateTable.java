package emp;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;

/**
 * Creates the employee table (emp) used by all the examples. 
 */
public class CreateTable {

    public static void main(String[] args) throws SQLException {
        try (Connection con = DriverManager.getConnection(args[0])) {

            Statement stmt = con.createStatement();
            stmt.execute("create table emp (data JSON)");
            
            System.out.println("Created table emp");
        }
    }

}
