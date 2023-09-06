package movie;

import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;

import oracle.ucp.jdbc.PoolDataSource;
import oracle.ucp.jdbc.PoolDataSourceFactory;

/**
 * Creates the movie table used by all the examples. 
 */
public class CreateTable {

    public static void main(String[] args) throws SQLException {
        PoolDataSource pool = PoolDataSourceFactory.getPoolDataSource();
        pool.setURL(String.join("", args));
        pool.setConnectionFactoryClassName("oracle.jdbc.pool.OracleDataSource");
        
        try (Connection con = pool.getConnection()) {
            Statement stmt = con.createStatement();
            stmt.execute("create table movie (data JSON)");
            
            System.out.println("Created table movie");
        }
    }

}
