package movie.springjdbc.model;

import org.springframework.data.annotation.Id;

import lombok.Data;

@Data
public class Movie {
    @Id 
    Integer id;
    String name;
    MovieDetails details;
}


