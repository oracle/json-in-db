package emp;

import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;

import oracle.ucp.jdbc.PoolDataSource;
import oracle.ucp.jdbc.PoolDataSourceFactory;

/** 
 * Drops the employee table used by the other examples. 
 */
public class DropTable {

    public static void main(String[] args) throws SQLException {
        PoolDataSource pool = PoolDataSourceFactory.getPoolDataSource();
        pool.setURL(args[0]);
        pool.setConnectionFactoryClassName("oracle.jdbc.pool.OracleDataSource");
        
        try (Connection con = pool.getConnection()) {
            Statement stmt = con.createStatement();
            stmt.execute("drop table emp");
        }
    }

}
