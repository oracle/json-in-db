package movie.springjdbc.repository;

import java.util.stream.Stream;

import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.CrudRepository;

import movie.springjdbc.model.Movie;

public interface MovieRepository extends CrudRepository<Movie, Integer> {

    @Query("""
        select * 
        from movie 
        where json_exists(details, '$?(@.genres == $g)' passing :genre as \"g\")
    """)
    Stream<Movie> findAllByGenre(String genre);
}
