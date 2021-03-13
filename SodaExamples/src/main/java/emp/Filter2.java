package emp;

import java.sql.Connection;

import oracle.soda.OracleCollection;
import oracle.soda.OracleCursor;
import oracle.soda.OracleDatabase;
import oracle.soda.OracleDocument;
import oracle.soda.rdbms.OracleRDBMSClient;
import oracle.sql.json.OracleJsonObject;
import oracle.sql.json.OracleJsonValue;
import oracle.ucp.jdbc.PoolDataSource;
import oracle.ucp.jdbc.PoolDataSourceFactory;

/**
 * With JSON, objects in a collection can have different sets of attributes and
 * the types of attributes can vary across values. This example select employees
 * that have a "created" attribute and checks the type
 * of thae top-level value retrieved and the type of a nested value.
 * 
 * <p>
 * Run first: {@link CreateCollection}, {@link Insert}
 * </p>
 */
public class Filter2 {

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
                    .filter("{\"created\" : {\"$exists\" : true}}")
                    .getCursor();
            
            OracleDocument doc = cursor.next();
            OracleJsonValue v1 = doc.getContentAs(OracleJsonValue.class);
            
            System.out.println("The type of v1 is " + v1.getOracleJsonType());
            
            // Casts the value to OracleJsonObject 
            OracleJsonObject obj = v1.asJsonObject();
            
            OracleJsonValue v2 = obj.get("created");
            
            System.out.println("The type of v2 is " + v2.getOracleJsonType());
            
            System.out.println(obj.getString("name") + " created " 
                + v2.asJsonTimestampTZ().getString());
            
            cursor.close();
        }
    }

}
