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
 * Shows how a nested array can be processed.
 * 
 * <p>
 * Run first: {@link CreateCollection}, {@link Insert}, {@link AddPhoneNumbers}
 * </p>
 */
public class GetPhoneNumbers {

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
                    .filter("{\"name\" : \"Smith\"}")
                    .getCursor();
            
            while (cursor.hasNext()) {
                OracleDocument doc = cursor.next();
                OracleJsonObject obj = doc.getContentAs(OracleJsonObject.class);
                String name = obj.getString("name");
                String job  = obj.getString("job");
                System.out.println(name + " - " + job);

                for (OracleJsonValue value : obj.get("phones").asJsonArray()) {
                   OracleJsonObject phone = value.asJsonObject();
                   System.out.println("   " + phone.getString("type") + " " + phone.getString("number"));
                }
            }
            cursor.close();
        }
        
    }

}
