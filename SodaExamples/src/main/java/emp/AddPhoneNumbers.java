package emp;

import java.sql.Connection;
import java.util.Random;
import oracle.soda.OracleCollection;
import oracle.soda.OracleDatabase;
import oracle.soda.OracleDocument;
import oracle.soda.OracleCursor;
import oracle.soda.rdbms.OracleRDBMSClient;
import oracle.sql.json.OracleJsonFactory;
import oracle.sql.json.OracleJsonObject;
import oracle.sql.json.OracleJsonArray;
import oracle.ucp.jdbc.PoolDataSource;
import oracle.ucp.jdbc.PoolDataSourceFactory;

/**
 * Adds a nested array of phone numbers to each employee.
 * 
 * <p>
 * Run first: {@link CreateCollection}, {@link Insert}
 * </p>
 */
public class AddPhoneNumbers {

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
            OracleCursor cursor = col.find().getCursor();
            int count = 0;
            while (cursor.hasNext()) {
                OracleDocument doc = cursor.next();
                OracleJsonObject emp = doc.getContentAs(OracleJsonObject.class);
                emp = factory.createObject(emp); // mutable copy
                OracleJsonArray arr = factory.createArray();

                // mobile phone
                OracleJsonObject mobile = factory.createObject();
                mobile.put("type", "mobile");
                mobile.put("number", generateNumber(count++));
                arr.add(mobile);
                
                // home phone
                if (count % 2 == 0) {
                    OracleJsonObject home = factory.createObject();
                    home.put("type", "home");
                    home.put("number", generateNumber(count++));
                    arr.add(home);
                }

                // work phone
                if (count % 3 == 0) {
                    OracleJsonObject work = factory.createObject();
                    work.put("type", "work");
                    work.put("number", generateNumber(count++));
                    arr.add(work);
                }
                emp.put("phones", arr);
                System.out.println(emp);
                col.find().key(doc.getKey())
                   .replaceOne(db.createDocumentFrom(emp));
	    }             
            cursor.close();
        }
    }
    
    private static String generateNumber(int value) {
        Random r = new Random(value);
        StringBuilder builder = new StringBuilder();
        builder.append("+1-");
        for (int i = 0; i < 3; i++) {
            builder.append(String.valueOf(r.nextInt(9)));
        }
        builder.append("-555-");
        for (int i = 0; i < 4; i++) {
            builder.append(String.valueOf(r.nextInt(9)));
        }
        return builder.toString();
    }
}
