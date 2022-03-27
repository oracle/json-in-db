package emp;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import com.google.gson.Gson;

import emp.model.Emp;
import oracle.ucp.jdbc.PoolDataSource;
import oracle.ucp.jdbc.PoolDataSourceFactory;

/**
 * Retrieves a plain/custom Java using GSON.
 * 
 * This is similar to the {@code JSONB} example
 * but uses GSON instead.  
 * 
 * <p>
 * Run first: {@link CreateTable}, {@link Insert}
 * </p>
 * 
 */
public class GSON {

    public static void main(String[] args) throws SQLException {
        
        PoolDataSource pool = PoolDataSourceFactory.getPoolDataSource();
        pool.setURL(String.join("", args));
        pool.setConnectionFactoryClassName("oracle.jdbc.pool.OracleDataSource");
        
        try (Connection con = pool.getConnection()) {
        	
            PreparedStatement stmt = con.prepareStatement(
                "SELECT e.data FROM emp e WHERE e.data.name.string() = 'Blake'");
            
            ResultSet rs = stmt.executeQuery();
            rs.next();

            Emp clark =  new Gson().fromJson(rs.getString(1), Emp.class);

            System.out.println(clark.getJob());
            
        }
    }
}
