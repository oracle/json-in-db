package movie.springjdbc.model;

import java.util.List;
import java.util.Set;

import lombok.Builder;
import lombok.Data;

@Data
public class MovieDetails {
    List<Image> images;
    Set<String> genres;
}
