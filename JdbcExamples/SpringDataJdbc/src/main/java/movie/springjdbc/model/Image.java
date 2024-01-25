package movie.springjdbc.model;

import lombok.Data;

@Data
public class Image {
    String file;
    String description;
    
    public Image(String file, String description) {
        this.file = file;
        this.description = description;
    }
    
    public Image() {
        this(null, null);
    }
}

