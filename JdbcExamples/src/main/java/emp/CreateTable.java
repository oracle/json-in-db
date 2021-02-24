package emp;

import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;

import oracle.ucp.jdbc.PoolDataSource;
import oracle.ucp.jdbc.PoolDataSourceFactory;

/**
 * Creates the employee table (emp) used by all the examples. 
 */
public class CreateTable {

    public static void main(String[] args) throws SQLException {
        PoolDataSource pool = PoolDataSourceFactory.getPoolDataSource();
        pool.setURL(args[0]);
        pool.setConnectionFactoryClassName("oracle.jdbc.pool.OracleDataSource");
        
        try (Connection con = pool.getConnection()) {

            Statement stmt = con.createStatement();
            stmt.execute("create table emp (data JSON)");
            
            System.out.println("Created table emp");
        }
    }

}
