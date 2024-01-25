package movie;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import oracle.sql.json.OracleJsonObject;
import oracle.sql.json.OracleJsonValue;
import oracle.ucp.jdbc.PoolDataSource;
import oracle.ucp.jdbc.PoolDataSourceFactory;

/**
 * With JSON, objects in a table can have different sets of attributes and
 * the types of attributes can vary across values. This example selects a movie
 * from the movie table that has a "created" attribute and checks the type
 * of the top-level value retrieved and the type of a nested value.
 * 
 * <p>
 * Run first: {@link CreateTable}, {@link Insert}
 * </p>
 */
public class Filter2 {

    public static void main(String[] args) throws SQLException {
        PoolDataSource pool = PoolDataSourceFactory.getPoolDataSource();
        pool.setURL(String.join("", args));
        pool.setConnectionFactoryClassName("oracle.jdbc.pool.OracleDataSource");
        
        try (Connection con = pool.getConnection()) {
            // Filter by existence
            PreparedStatement stmt = con.prepareStatement(
              "SELECT m.data FROM movie m WHERE JSON_EXISTS(data, '$.release')");
    
            ResultSet rs = stmt.executeQuery();
            rs.next();
            
            OracleJsonValue v1 = rs.getObject(1, OracleJsonValue.class);
            
            System.out.println("The type of v1 is " + v1.getOracleJsonType());
            
            // Casts the value to OracleJsonObject 
            OracleJsonObject obj = v1.asJsonObject();
            
            OracleJsonValue v2 = obj.get("release");
            
            System.out.println("The type of v2 is " + v2.getOracleJsonType());
            
            System.out.println(obj.getString("name") + " released " + 
                v2.asJsonTimestampTZ());
            
            rs.close();
            stmt.close();
        }
    }

}
