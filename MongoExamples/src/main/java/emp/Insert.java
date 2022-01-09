package emp;

import java.io.FileInputStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;

import org.bson.Document;

import com.mongodb.ConnectionString;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;

/**
 * Inserts three JSON values into the {@code employee} collection.
 * 
 */
public class Insert {

    public static void main(String[] args) throws Exception {
    	
        ConnectionString cStr = new ConnectionString(args[0]);
        try (MongoClient client = MongoClients.create(cStr)) {
        	MongoDatabase db = client.getDatabase(cStr.getDatabase());
        	MongoCollection<Document> col = db.getCollection("employees");

            // JSON text (String)
            String str = "{\"name\":\"Blake\", \"job\": \"Intern\", \"salary\":20000}";
            col.insertOne(Document.parse(str));
            
            // JSON object
            Document obj = new Document();
            obj.put("name", "Smith");
            obj.put("job", "Programmer");
            obj.put("salary", 40000);
            obj.put("created", Instant.now());
            col.insertOne(obj);
            
            // JSON text (byte stream/file)
            FileInputStream in = new FileInputStream("data/miller.json");
            String json = new String(in.readAllBytes(), StandardCharsets.UTF_8);
            col.insertOne(Document.parse(json));
            in.close();
        }
        System.out.println("Inserted three employees into the employee collection");
    }
}
