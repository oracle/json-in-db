package movie.springjdbc;

import java.util.List;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.dao.DataAccessException;
import org.springframework.data.jdbc.repository.config.EnableJdbcRepositories;
import org.springframework.jdbc.core.JdbcTemplate;

import movie.springjdbc.model.Image;
import movie.springjdbc.model.Movie;
import movie.springjdbc.model.MovieDetails;
import movie.springjdbc.repository.MovieRepository;

@EnableJdbcRepositories
@SpringBootApplication
public class App implements ApplicationRunner {

    @Autowired
    JdbcTemplate template;
    
    @Autowired
    MovieRepository movies;

    
    @Override
    public void run(ApplicationArguments args) throws Exception {
        createTables();

        insertMovies();
        
        System.out.println("All Movies:");
        movies.findAll().forEach(movie -> {
            System.out.println(" --> " + movie.getId() + " " + movie.getName());
        });

        System.out.println("Movie with ID 2: ");
        String name = movies.findById(2).get().getName();
        System.out.println("--> " + name);
        
        System.out.println("Adventure movies: ");
        movies.findAllByGenre("Adventure").forEach(movie -> {
            System.out.println(" --> " + movie.getName());
        });
        
        movies.deleteById(3);
        System.out.println("Remaining movies: ");
        movies.findAll().forEach(movie -> {
            System.out.println(" --> " + movie.getId() + " " + movie.getName());
        });
        
        Movie m = movies.findById(1).get();
        System.out.println(m.getName() + " " +  m.getId());
    }

    private void createTables() {

        try {
            template.execute("drop table movie");
            template.execute("drop sequence movieidsequence");
        } catch (DataAccessException e) {
            System.out.println(e.getMessage());
        }
        template.execute("create sequence movieidsequence");
        template.execute(""" 
            create table movie (
                id number default movieidsequence.NEXTVAL primary key,
                name varchar2(100),
                details JSON 
            )
        """);

    }

    /**
     * Insert 3 movies
     */
    private void insertMovies() {
        // Iron man
        Movie m = new Movie();
        m.setName("Iron Man");
        MovieDetails details = new MovieDetails();
        details.setGenres(Set.of("Action", "Sci-Fi", "Adventure"));
        details.setImages( List.of(
                new Image("img01.png", "Iron Man Poster (2008)"),
                new Image("img02.png", "Robert Downey Jr. and Gwyneth Paltrow")
        ));
        m.setDetails(details);
        movies.save(m);
        
        // Interstellar
        m = new Movie();
        m.setName("Interstellar");
        details = new MovieDetails();
        details.setImages(List.of(new Image("img03.png", "Poster")));
        details.setGenres(Set.of("Sci-Fi", "Adventure", "Drama"));
        m.setDetails(details);
        movies.save(m);
        
        // The Matrix
        m = new Movie();
        m.setName("The Matrix");
        details = new MovieDetails();
        details.setImages(List.of(new Image("img04.png", "Poster")));
        details.setGenres(Set.of("Thriller", "Sci-Fi", "Action"));
        m.setDetails(details);
        movies.save(m);
    }
    
    public static void main(String[] args) {
        SpringApplication.run(App.class, args); // "--debug"
    }
}
