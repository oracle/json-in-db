package emp;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import oracle.sql.json.OracleJsonObject;

/**
 * Select employees from the emp table where the salary is greater than 30,000.
 * 
 * <p>
 * Run first: {@link CreateTable}, {@link Insert}
 * </p>
 */
public class Filter2 {

    public static void main(String[] args) throws SQLException {
        Connection con = DriverManager.getConnection(args[0]);
        
        // Filter by existance
        PreparedStatement stmt = con.prepareStatement(
          "SELECT e.data, e.data.created.type() FROM emp e WHERE JSON_EXISTS(data, '$.created')");

        ResultSet rs = stmt.executeQuery();
        rs.next();
        
        OracleJsonObject obj = rs.getObject(1, OracleJsonObject.class);
        String type = rs.getString(2);
        System.out.println("Retrieved " + obj.getString("name") + 
                " with created value: " + obj.getInstant("created"));
        
        System.out.println("The server reported type of created is " + type);
        System.out.println("The client reported type of created is " + obj.get("created").getOracleJsonType());
        
        rs.close();
        stmt.close();
        con.close();
    }

}
