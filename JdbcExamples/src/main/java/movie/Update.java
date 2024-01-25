package movie;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

import oracle.jdbc.OracleType;
import oracle.sql.json.OracleJsonFactory;
import oracle.sql.json.OracleJsonObject;
import oracle.ucp.jdbc.PoolDataSource;
import oracle.ucp.jdbc.PoolDataSourceFactory;

/**
 * Updates an movie record using whole document replacement.
 * 
 * <p>
 * Run first: {@link CreateTable}, {@link Insert}
 * </p>
 */
public class Update {

    public static void main(String[] args) throws Exception {
        OracleJsonFactory factory = new OracleJsonFactory();
        
        PoolDataSource pool = PoolDataSourceFactory.getPoolDataSource();
        pool.setURL(String.join("", args));
        pool.setConnectionFactoryClassName("oracle.jdbc.pool.OracleDataSource");
        
        try (Connection con = pool.getConnection()) {
        
            PreparedStatement stmt = con.prepareStatement(
                    "SELECT m.data FROM movie m WHERE m.data.name.string() = :1");
                
            stmt.setString(1, "Iron Man");
            
            ResultSet rs = stmt.executeQuery();
            rs.next();
            
            OracleJsonObject obj = rs.getObject(1, OracleJsonObject.class);
            
            System.out.println(obj);
            
            // At this point, obj is a direct pointer into binary JSON sent 
            // from the server and is immutable.  Calling put() on the object
            // would raise an error.  The next line makes a mutable copy:
            obj = factory.createObject(obj);

            obj.put("gross", obj.getBigDecimal("gross").add(BigDecimal.valueOf(1000_000)));
            
            PreparedStatement update = con.prepareStatement(
                    "UPDATE movie m SET m.data = :1 WHERE m.data.name.string() = :2");
            
            update.setObject(1, obj, OracleType.JSON);
            update.setString(2, "Iron Man");
            update.execute();
            
            System.out.println("Iron Man's gross is updated");
            System.out.println(obj);
        }
    }

}
