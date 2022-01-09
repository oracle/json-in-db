package emp;

import org.bson.Document;

import com.mongodb.ConnectionString;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoCursor;
import com.mongodb.client.MongoDatabase;

/**
 * Gets all the JSON values from the employee table.
 * 
 * <p>
 * Run first: {@link CreateCollection}, {@link Insert}
 * </p>
 */
public class GetAll {

    public static void main(String[] args) throws Exception {
        ConnectionString cStr = new ConnectionString(args[0]);
        try (MongoClient client = MongoClients.create(cStr)) {
        	MongoDatabase db = client.getDatabase(cStr.getDatabase());
        	MongoCollection<Document> col = db.getCollection("employees");
        	MongoCursor<Document> cursor = col.find().cursor();
            while (cursor.hasNext()) {
                Document doc = cursor.next();
                System.out.println(doc);
            }
            cursor.close();
        }
    }

}
