package emp;

import com.mongodb.ConnectionString;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoDatabase;

/**
 * Creates the employee collection used by all the examples. 
 */
public class CreateCollection {

    public static void main(String[] args)  {
        ConnectionString cStr = new ConnectionString(args[0]);
        try (MongoClient client = MongoClients.create(cStr)) {
        	MongoDatabase db = client.getDatabase(cStr.getDatabase());
            db.createCollection("employees");
            System.out.println("Created collection");
        }
    }

}
