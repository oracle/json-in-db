package emp;

import org.bson.Document;

import com.mongodb.ConnectionString;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.Filters;

/**
 * Updates an employee document using whole document replacement.
 * 
 * <p>
 * Run first: {@link CreateCollection}, {@link Insert}
 * </p>
 */
public class Update {

    public static void main(String[] args) throws Exception {
    	
        ConnectionString cStr = new ConnectionString(args[0]);
        try (MongoClient client = MongoClients.create(cStr)) {
        	MongoDatabase db = client.getDatabase(cStr.getDatabase());
        	MongoCollection<Document> col = db.getCollection("employees");

            Document obj = col.find().filter(Filters.eq("name", "Blake")).first();

            System.out.println(obj);
            obj.put("salary", 25000);
            
            col.replaceOne(Filters.eq("_id", obj.getObjectId("_id")), obj);
            
            System.out.println("Blake's salary is updated");
            System.out.println(obj);
        }
    }
}
