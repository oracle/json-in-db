package movie;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

import jakarta.json.bind.JsonbBuilder;
import jakarta.json.stream.JsonGenerator;
import jakarta.json.stream.JsonParser;

import org.eclipse.yasson.YassonJsonb;

import movie.model.Movie;
import movie.model.Image;
import oracle.jdbc.OracleTypes;
import oracle.sql.json.OracleJsonFactory;
import oracle.ucp.jdbc.PoolDataSource;
import oracle.ucp.jdbc.PoolDataSourceFactory;

/**
 * Stores and retrieves a plain/custom Java object as JSON using JSON-B (jakarta.json.bind). 
 * @see https://javaee.github.io/jsonb-spec/
 */
public class JSONB {
    
    public static void main(String[] args) throws SQLException {
        
        OracleJsonFactory factory = new OracleJsonFactory();
        YassonJsonb jsonb = (YassonJsonb) JsonbBuilder.create();
        
        PoolDataSource pool = PoolDataSourceFactory.getPoolDataSource();
        pool.setURL(String.join("", args));
        pool.setConnectionFactoryClassName("oracle.jdbc.pool.OracleDataSource");
        
        try (Connection con = pool.getConnection()) {
            
            Movie movie = new Movie();
            movie.setName("The Godfather");
            movie.setGross(BigDecimal.valueOf(246120974));
            movie.setGenre("Drama");
            
            List<Image> images = new ArrayList<Image>();
            images.add(new Image("img1.png", "Main movie poster"));
            images.add(new Image("img2.png", "Marlon Brando"));
            movie.setImages(images);
            
            // convert Movie class to binary JSON
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            JsonGenerator gen = factory.createJsonBinaryGenerator(out)
                    .wrap(JsonGenerator.class);
            jsonb.toJson(movie, gen);
            gen.close();
            byte[] oson = out.toByteArray();
            
            PreparedStatement stmt = con.prepareStatement("INSERT INTO movie VALUES (?)");
            stmt.setObject(1, oson, OracleTypes.JSON);
            stmt.execute();
            stmt.close();
            
            System.out.println("Movie object inserted successfully!");
            
            stmt = con.prepareStatement(
                "SELECT m.data FROM movie m WHERE m.data.name.string() = :1");
            stmt.setString(1, "The Godfather");
            ResultSet rs = stmt.executeQuery();
            rs.next();
            JsonParser parser = rs.getObject(1, JsonParser.class);
            Movie m = jsonb.fromJson(parser, Movie.class);
            System.out.println("Movie object retrieved from database. ");
            System.out.println(m.getName() + ", " + m.getGenre());
            for (Image p : m.getImages()) {
                System.out.println("  " + p.getFile() + " " + p.getDescription());
            }
        }
        
    }
}
