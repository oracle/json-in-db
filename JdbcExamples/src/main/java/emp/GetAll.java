package emp;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

import oracle.ucp.jdbc.PoolDataSource;
import oracle.ucp.jdbc.PoolDataSourceFactory;

/**
 * Gets all the JSON values from the employee table.
 * 
 * <p>
 * Run first: {@link CreateTable}, {@link Insert}
 * </p>
 */
public class GetAll {

    public static void main(String[] args) throws SQLException {
        PoolDataSource pool = PoolDataSourceFactory.getPoolDataSource();
        pool.setURL(args[0]);
        pool.setConnectionFactoryClassName("oracle.jdbc.pool.OracleDataSource");
        
        try (Connection con = pool.getConnection()) {
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
