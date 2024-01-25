package movie;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import oracle.sql.json.OracleJsonObject;
import oracle.ucp.jdbc.PoolDataSource;
import oracle.ucp.jdbc.PoolDataSourceFactory;

/**
 * Select movies from the movie table where the gross is greater than 500,000,000.
 * 
 * <p>
 * Run first: {@link CreateTable}, {@link Insert}
 * </p>
 */
public class Filter {

    /**
     * @param args
     * @throws SQLException
     */
    public static void main(String[] args) throws SQLException {
        PoolDataSource pool = PoolDataSourceFactory.getPoolDataSource();
        pool.setURL(String.join("", args));
        pool.setConnectionFactoryClassName("oracle.jdbc.pool.OracleDataSource");
        
        try (Connection con = pool.getConnection()) {
            // Filter by gross
            PreparedStatement stmt = con.prepareStatement(
                "SELECT m.data FROM movie m WHERE m.data.gross.number() > :1");
    
            stmt.setInt(1, 500_000_000);
            ResultSet rs = stmt.executeQuery();
            while (rs.next()) {
                OracleJsonObject obj = rs.getObject(1, OracleJsonObject.class);
                String name = obj.getString("name");
                String genre  = obj.getString("genre");
                BigDecimal gross = obj.getBigDecimal("gross");
                System.out.println(name + "\t" + genre + "\t" + gross);
            }
            rs.close();
            stmt.close();
        }
        
    }

}
