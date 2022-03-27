package example;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.data.mongodb.MongoTransactionManager;
import org.springframework.data.mongodb.core.SimpleMongoClientDatabaseFactory;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;

@Configuration
public class AppConfig {
    
  public @Bean MongoDatabaseFactory mongoClient() {
      String uri = "<connection string>";
      MongoClient client = MongoClients.create(uri);
      return new SimpleMongoClientDatabaseFactory(client, "admin");
  }
  
  @Bean
  MongoTransactionManager transactionManager(MongoDatabaseFactory dbFactory) {
      return new MongoTransactionManager(dbFactory);
  }
  
}
