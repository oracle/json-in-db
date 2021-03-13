package emp;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.sql.Connection;

import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;

import oracle.soda.OracleCollection;
import oracle.soda.OracleDatabase;
import oracle.soda.OracleDocument;
import oracle.soda.rdbms.OracleRDBMSClient;
import oracle.sql.json.OracleJsonFactory;
import oracle.sql.json.OracleJsonGenerator;
import oracle.ucp.jdbc.PoolDataSource;
import oracle.ucp.jdbc.PoolDataSourceFactory;

/**
 * Encodes JSON from an external source, in this case a Jackson parser, as
 * Oracle binary JSON and inserts it into the collection.
 * <p>
 * Run first: {@link CreateCollection}
 * </p>
 */
public class Jackson {

    public static void main(String[] args) throws Exception {
        OracleJsonFactory factory = new OracleJsonFactory();
        JsonFactory jacksonFactory = new JsonFactory();
        
        // oson output
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        OracleJsonGenerator gen = factory.createJsonBinaryGenerator(out);

        // Jackson input
        JsonParser jacksonParser = jacksonFactory.createParser(new File("data/jack.json"));
        JsonToken token;
        while ((token = jacksonParser.nextToken()) != null) {
            switch(token) {
            case START_OBJECT:
                gen.writeStartObject();
                break;
            case START_ARRAY:
                gen.writeStartArray();
                break;
            case END_ARRAY:
            case END_OBJECT:
                gen.writeEnd();
                break;
            case FIELD_NAME:
                gen.writeKey(jacksonParser.currentName());
                break;
            case VALUE_FALSE:
                gen.write(false);
                break;
            case VALUE_TRUE:
                gen.write(true);
                break;                
            case VALUE_NULL:
                gen.writeNull();
                break;
            case VALUE_NUMBER_FLOAT:
            case VALUE_NUMBER_INT:
                gen.write(jacksonParser.getDecimalValue());
                break;
            case VALUE_STRING:
                gen.write(jacksonParser.getText());
                break;
            default:
                throw new IllegalStateException(token.toString());
            }
        }
        jacksonParser.close();
        gen.close();
        
        byte[] oson = out.toByteArray();
        
        OracleRDBMSClient client = new OracleRDBMSClient();
        PoolDataSource pool = PoolDataSourceFactory.getPoolDataSource();
        pool.setMaxStatements(50);
        pool.setURL(args[0]);
        pool.setConnectionFactoryClassName("oracle.jdbc.pool.OracleDataSource");
        
        try (Connection con = pool.getConnection()) {
            OracleDatabase db = client.getDatabase(con);
            OracleCollection col = db.openCollection("employees");
            OracleDocument doc = db.createDocumentFrom(oson);
            col.insert(doc);
            System.out.println("Jack inserted into successfully");
        }
    }

}
