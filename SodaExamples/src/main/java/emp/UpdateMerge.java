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
 * Performs a partial update using JSON_MERGEPATCH.
 * 
 * <p>
 * Run first: {@link CreateTable}, {@link Insert}
 * </p>
 */
public class UpdateMerge {

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
            
            OracleDocument doc = col.find().filter("{\"name\":\"Miller\"}").getOne();
            
            OracleJsonObject patch = factory.createObject();
            patch.put("job", "Architect");
            patch.put("salary", 60000);
            
            col.find().key(doc.getKey())
                      .mergeOne(db.createDocumentFrom(patch));
            
            System.out.println("Miller's salary and title have been updated"); 
        }            
    }
}
