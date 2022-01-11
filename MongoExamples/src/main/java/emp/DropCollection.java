package emp;

import org.bson.Document;

import com.mongodb.ConnectionString;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;


/** 
 * Drops the employee collection used by the other examples. 
 */
public class DropCollection {

    public static void main(String[] args) throws Exception {
        ConnectionString cStr = new ConnectionString(args[0]);
        try (MongoClient client = MongoClients.create(cStr)) {
        	MongoDatabase db = client.getDatabase(cStr.getDatabase());
        	MongoCollection<Document> col = db.getCollection("employees");
        	col.drop();
        	System.out.println("Collection dropped.");
        }
    }

}
