package emp;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Wrapper;

import javax.json.Json;
import javax.json.JsonBuilderFactory;
import javax.json.JsonObject;
import javax.json.JsonValue;

import oracle.jdbc.OracleType;
import oracle.sql.json.OracleJsonObject;
import oracle.sql.json.OracleJsonValue;

/**
 * Inserts and retrieves a value using JSON-P (javax.json) interfaces.
 * 
 * <p>
 * Run first: {@link CreateTable}, {@link Insert}
 * </p>
 * 
 * @see https://javaee.github.io/jsonp/ 
 */
public class JSONP {

    public static void main(String[] args) throws SQLException {
        JsonBuilderFactory factory = Json.createBuilderFactory(null);
        
        try (Connection con = DriverManager.getConnection(args[0])) {
            PreparedStatement stmt = con.prepareStatement("INSERT INTO emp VALUES (:1)");
            JsonObject obj = factory.createObjectBuilder()
                                    .add("name", "Clark")
                                    .add("job", "Manager")
                                    .add("salary", 80000)
                                    .build();
            stmt.setObject(1, obj, OracleType.JSON);
            stmt.execute();
            stmt.close();
            System.out.println("Inserted employee Clark ");
            
            
            // retrieve employee Smith 
            
            stmt = con.prepareStatement(
                    "SELECT e.data FROM emp e WHERE e.data.name.string() = :1");
            stmt.setString(1, "Smith");
            ResultSet rs = stmt.executeQuery(); 
            rs.next();
            obj = rs.getObject(1, JsonObject.class);
            System.out.println("Retrieved Smith from the database");
            System.out.println(obj.toString());
            
            // Values such as JsonObject, JsonArray, JsonParser, and JsonGenerator
            // produced from JDBC can be mapped back and forth between the javax.json
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
