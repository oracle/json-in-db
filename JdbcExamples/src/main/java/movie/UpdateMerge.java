package movie;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import oracle.sql.json.OracleJsonFactory;
import oracle.sql.json.OracleJsonObject;
import oracle.ucp.jdbc.PoolDataSource;
import oracle.ucp.jdbc.PoolDataSourceFactory;

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
        
        PoolDataSource pool = PoolDataSourceFactory.getPoolDataSource();
        pool.setURL(String.join("", args));
        pool.setConnectionFactoryClassName("oracle.jdbc.pool.OracleDataSource");
        
        try (Connection con = pool.getConnection()) {
        
            PreparedStatement stmt = con.prepareStatement(
                "UPDATE movie m " +
                "SET m.data = JSON_MERGEPATCH(m.data, :1) " +
                "WHERE m.data.name.string() = :2");
                
            OracleJsonObject patch = factory.createObject();
            patch.put("release", OffsetDateTime.of(2014, 11, 7, 0, 0, 0, 0, ZoneOffset.UTC));
            patch.put("gross", 1_000_000_000);
            
            stmt.setObject(1, patch);
            stmt.setString(2, "Interstellar");
            
            stmt.execute();
            
            System.out.println("Document has been updated have been updated"); 
        }            
    }

}
