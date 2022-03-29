package example.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import example.model.Status;

@RepositoryRestResource(collectionResourceRel = "status", path = "status")
public interface StatusRepository extends MongoRepository<Status, String> {
    
    @Query(value="{'station_id' : ?0}", delete = true)
    public void deleteAllByStationId (String id);
    
    @Query(value="{'station_id' : ?0}")
    public List<Status> findByStationId (String id);
}
