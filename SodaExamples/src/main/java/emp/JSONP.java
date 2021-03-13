package emp;

import java.sql.Connection;
import java.sql.Wrapper;

import javax.json.Json;
import javax.json.JsonBuilderFactory;
import javax.json.JsonObject;
import javax.json.JsonValue;

import oracle.soda.OracleCollection;
import oracle.soda.OracleDatabase;
import oracle.soda.OracleDocument;
import oracle.soda.rdbms.OracleRDBMSClient;
import oracle.sql.json.OracleJsonObject;
import oracle.sql.json.OracleJsonValue;
import oracle.ucp.jdbc.PoolDataSource;
import oracle.ucp.jdbc.PoolDataSourceFactory;

/**
 * Inserts and retrieves a value using JSON-P (javax.json) interfaces.
 * 
 * <p>
 * Run first: {@link CreateCollection}, {@link Insert}
 * </p>
 * 
 * @see https://javaee.github.io/jsonp/ 
 */
public class JSONP {

    public static void main(String[] args) throws Exception {
        JsonBuilderFactory factory = Json.createBuilderFactory(null);
        
        OracleRDBMSClient client = new OracleRDBMSClient();
        PoolDataSource pool = PoolDataSourceFactory.getPoolDataSource();
        pool.setMaxStatements(50);
        pool.setURL(args[0]);
        pool.setConnectionFactoryClassName("oracle.jdbc.pool.OracleDataSource");
        
        try (Connection con = pool.getConnection()) {
            OracleDatabase db = client.getDatabase(con);
            OracleCollection col = db.openCollection("employees");

            JsonObject obj = factory.createObjectBuilder()
                                    .add("name", "Clark")
                                    .add("job", "Manager")
                                    .add("salary", 80000)
                                    .build();
            col.insert(db.createDocumentFrom(obj));

            System.out.println("Inserted employee Clark ");
            
            // retrieve employee Smith 
            
            OracleDocument doc = col.find().filter("{\"name\":\"Smith\"}").getOne();
            obj = doc.getContentAs(JsonObject.class);

            System.out.println("Retrieved Smith from the database");
            System.out.println(obj.toString());
            
            // Values such as JsonObject, JsonArray, JsonParser, and JsonGenerator
            // produced from SODA can be mapped back and forth between the javax.json
            // counterparts using the facade pattern. Mapping back and forth does not
            // make a copy of the data but rather it provides an alternate view of the same
            // data.

            // Smith timestamp attribute is reported as a string when using the javax.json apis
            JsonValue value = obj.get("created");
            System.out.println(value + " is of type " + value.getValueType());
            
            // However, we can unwrap the object to get the true type
            OracleJsonObject oraObj = ((Wrapper)obj).unwrap(OracleJsonObject.class);
            OracleJsonValue oraValue = oraObj.get("created");
            System.out.println(oraValue + " is of type " + oraValue.getOracleJsonType());
            
            // Values can be rewraped at any time
            JsonObject obj2 = oraObj.wrap(JsonObject.class); 
            System.out.println(obj.equals(obj2));
        }
    }
}
