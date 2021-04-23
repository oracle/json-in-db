package emp;

import java.sql.Connection;

import oracle.soda.OracleCollection;
import oracle.soda.OracleDatabase;
import oracle.soda.OracleDocument;
import oracle.soda.rdbms.OracleRDBMSClient;
import oracle.sql.json.OracleJsonFactory;
import oracle.sql.json.OracleJsonObject;
import oracle.ucp.jdbc.PoolDataSource;
import oracle.ucp.jdbc.PoolDataSourceFactory;

/**
 * Updates an employee document using whole document replacement.
 * 
 * <p>
 * Run first: {@link CreateCollection}, {@link Insert}
 * </p>
 */
public class Update {

    public static void main(String[] args) throws Exception {
        OracleJsonFactory factory = new OracleJsonFactory();
        OracleRDBMSClient client = new OracleRDBMSClient();
        PoolDataSource pool = PoolDataSourceFactory.getPoolDataSource();
        pool.setMaxStatements(50);
        pool.setURL(args[0]);
        pool.setConnectionFactoryClassName("oracle.jdbc.pool.OracleDataSource");
        
        try (Connection con = pool.getConnection()) {
            OracleDatabase db = client.getDatabase(con);
            OracleCollection col = db.openCollection("employees");
            OracleDocument doc = col.find().filter("{\"name\":\"Blake\"}").getOne();
            
            OracleJsonObject obj = doc.getContentAs(OracleJsonObject.class);
            
            System.out.println(obj);
            
            // At this point, obj is a direct pointer into binary JSON sent 
            // from the server and is immutable.  Calling put() on the object
            // would raise an error.  The next line makes a mutable copy:
            obj = factory.createObject(obj);

            obj.put("salary", 25000);
            
            col.find().key(doc.getKey())
                      .replaceOne(db.createDocumentFrom(obj));
            
            System.out.println("Blake's salary is updated");
            System.out.println(obj);
        }
    }

}
