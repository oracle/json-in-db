package movie.model;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class Movie {

    String name;
    
    String genre;
    
    BigDecimal gross;
    
    List<Image> images = new ArrayList<Image>();

    public Movie() {
        
    }
    
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getGenre() {
        return genre;
    }

    public void setGenre(String genre) {
        this.genre = genre;
    }

    public BigDecimal getGross() {
        return gross;
    }

    public void setGross(BigDecimal gross) {
        this.gross = gross;
    }
    
    public List<Image> getImages() {
        return this.images;
    }
    
    public void setImages(List<Image> phones) {
        this.images = phones;
    }

}