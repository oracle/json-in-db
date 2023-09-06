package movie;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;

import oracle.ucp.jdbc.PoolDataSource;
import oracle.ucp.jdbc.PoolDataSourceFactory;

/**
 * Performs a partial update using JSON_TRANSFORM.
 * 
 * <p>
 * Run first: {@link CreateTable}, {@link Insert}
 * </p>
 */
public class UpdateTransform {

    public static void main(String[] args) throws SQLException {
        
        PoolDataSource pool = PoolDataSourceFactory.getPoolDataSource();
        pool.setURL(String.join("", args));
        pool.setConnectionFactoryClassName("oracle.jdbc.pool.OracleDataSource");
        
        try (Connection con = pool.getConnection()) {
        
            PreparedStatement stmt = con.prepareStatement(
                "UPDATE movie m " +
                "SET m.data = JSON_TRANSFORM(m.data, SET '$.gross' = :1) " +
                "WHERE m.data.name.string() = :2");
                
            stmt.setInt(1, 1_000_000_000);
            stmt.setString(2, "Iron Man");
            
            stmt.execute();
            
            System.out.println("Movie has been updated!"); 
        }            
    }

}
