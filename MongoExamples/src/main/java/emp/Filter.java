package emp;

import org.bson.Document;

import com.mongodb.ConnectionString;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoCursor;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.Filters;

/**
 * Select employees from the employee collection where the 
 * salary is greater than 30,000.
 * 
 * <p>
 * Run first: {@link CreateCollection}, {@link Insert}
 * </p>
 */
public class Filter {

    public static void main(String[] args) throws Exception {
        ConnectionString cStr = new ConnectionString(args[0]);
        try (MongoClient client = MongoClients.create(cStr)) {
        	MongoDatabase db = client.getDatabase(cStr.getDatabase());
        	MongoCollection<Document> col = db.getCollection("employees");
                
            MongoCursor<Document> cursor = col.find()
                    .filter(Filters.gt("salary", 30000))
                    .cursor();
            
            while (cursor.hasNext()) {
                Document obj = cursor.next();
                String name = obj.getString("name");
                String job  = obj.getString("job");
                System.out.println(name + " - " + job);
            }
            
            cursor.close();
        }
    }

}
