package emp;

import java.io.FileInputStream;
import java.sql.Connection;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import oracle.soda.OracleCollection;
import oracle.soda.OracleDatabase;
import oracle.soda.rdbms.OracleRDBMSClient;
import oracle.sql.json.OracleJsonFactory;
import oracle.sql.json.OracleJsonObject;
import oracle.ucp.jdbc.PoolDataSource;
import oracle.ucp.jdbc.PoolDataSourceFactory;

/**
 * Inserts three JSON values into the {@code employee} collection.
 * 
 * <p>
 * Run {@link CreateCollection} before running this example. The purpose of this
 * example is to show several ways of inserting document into a collections. In
 * all cases, the value inserted is converted to Oracle's binary JSON format
 * internally before being sent to the database.
 * </p>
 */
public class Insert {

    public static void main(String[] args) throws Exception {
        OracleRDBMSClient client = new OracleRDBMSClient();
        PoolDataSource pool = PoolDataSourceFactory.getPoolDataSource();
        pool.setMaxStatements(50);
        pool.setURL(args[0]);
        pool.setConnectionFactoryClassName("oracle.jdbc.pool.OracleDataSource");
        
        try (Connection con = pool.getConnection()) {
            OracleDatabase db = client.getDatabase(con);
            OracleCollection col = db.openCollection("employees");
            
            // JSON text (String)
            String str = "{\"name\":\"Blake\", \"job\": \"Intern\", \"salary\":20000}";
            col.insert(db.createDocumentFrom(str));

            // JSON object
            OracleJsonFactory factory = new OracleJsonFactory();
            OracleJsonObject obj = factory.createObject();
            obj.put("name", "Smith");
            obj.put("job", "Programmer");
            obj.put("salary", 40000);
            obj.put("created", OffsetDateTime.now(ZoneOffset.UTC));
            col.insert(db.createDocumentFrom(obj));
    
            // JSON text (byte stream/file)
            FileInputStream in = new FileInputStream("data/miller.json");
            col.insert(db.createDocumentFrom(in));
            in.close();
            
            System.out.println("Inserted three employees into the employee collection");
        }
    }
}
