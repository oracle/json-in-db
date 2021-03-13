package emp;

import java.sql.Connection;

import oracle.soda.OracleCollection;
import oracle.soda.OracleCursor;
import oracle.soda.OracleDatabase;
import oracle.soda.OracleDocument;
import oracle.soda.rdbms.OracleRDBMSClient;
import oracle.sql.json.OracleJsonObject;
import oracle.ucp.jdbc.PoolDataSource;
import oracle.ucp.jdbc.PoolDataSourceFactory;

/**
 * Select employees from the employee collection where the 
 * salary is greater than 30,000.
 * 
 * <p>
 * Run first: {@link CreateCollection}, {@link Insert}
 * </p>
 */
public class Filter {

    public static void main(String[] args) throws Exception {
        OracleRDBMSClient client = new OracleRDBMSClient();
        PoolDataSource pool = PoolDataSourceFactory.getPoolDataSource();
        pool.setMaxStatements(50);
        pool.setURL(args[0]);
        pool.setConnectionFactoryClassName("oracle.jdbc.pool.OracleDataSource");
        
        try (Connection con = pool.getConnection()) {
            OracleDatabase db = client.getDatabase(con);
            OracleCollection col = db.openCollection("employees");
            
            OracleCursor cursor = col.find()
                    .filter("{\"salary\" : {\"$gt\":30000}}")
                    .getCursor();
            
            while (cursor.hasNext()) {
                OracleDocument doc = cursor.next();
                OracleJsonObject obj = doc.getContentAs(OracleJsonObject.class);
                String name = obj.getString("name");
                String job  = obj.getString("job");
                System.out.println(name + " - " + job);
            }
            
            cursor.close();
        }
        
    }

}
