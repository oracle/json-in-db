package example.repository;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import example.model.Station;

@RepositoryRestResource(collectionResourceRel = "station", path = "station")
public interface StationRepository extends MongoRepository<Station, String> {

}
