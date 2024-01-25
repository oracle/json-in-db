package movie.springjdbc;

import java.io.ByteArrayOutputStream;
import java.nio.ByteBuffer;
import java.sql.SQLException;
import java.util.List;

import javax.sql.DataSource;

import org.eclipse.yasson.YassonJsonb;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.data.convert.ReadingConverter;
import org.springframework.data.convert.WritingConverter;
import org.springframework.data.jdbc.core.convert.JdbcCustomConversions;
import org.springframework.data.jdbc.repository.config.AbstractJdbcConfiguration;

import jakarta.json.bind.Jsonb;
import jakarta.json.bind.JsonbBuilder;
import jakarta.json.stream.JsonGenerator;
import jakarta.json.stream.JsonParser;
import movie.springjdbc.model.MovieDetails;
import oracle.sql.json.OracleJsonFactory;
import oracle.sql.json.OracleJsonGenerator;
import oracle.ucp.jdbc.PoolDataSource;
import oracle.ucp.jdbc.PoolDataSourceFactory;

@Configuration
public class Config extends AbstractJdbcConfiguration {
    
    private static OracleJsonFactory FACTORY = new OracleJsonFactory();
    
    @Bean
    DataSource dataSource() throws SQLException {
        PoolDataSource dataSource = PoolDataSourceFactory.getPoolDataSource();
        dataSource.setConnectionFactoryClassName("oracle.jdbc.replay.OracleDataSourceImpl");
        dataSource.setURL(System.getProperty("url"));
        dataSource.setInitialPoolSize(5);
        dataSource.setMinPoolSize(5);
        dataSource.setMaxPoolSize(10);
        dataSource.setConnectionProperty("oracle.jdbc.jsonDefaultGetObjectType","jakarta.json.stream.JsonParser");
        return dataSource;
    }
    
    @Override
    @Bean
    public JdbcCustomConversions jdbcCustomConversions() {
        return new JdbcCustomConversions(
            List.of(
                new MovieDetailsReader(),
                new MovieDetailsWriter()
            )
        );
    }
    
    @ReadingConverter
    private static class MovieDetailsReader implements Converter<JsonParser, MovieDetails> {
        @Override
        public MovieDetails convert(JsonParser source) {
            Jsonb jsonb = JsonbBuilder.create();
            return ((YassonJsonb)jsonb).fromJson(source, MovieDetails.class);
        }
    }
    
    @WritingConverter
    private static class MovieDetailsWriter implements Converter<MovieDetails, JsonParser> {
        OracleJsonFactory factory = new OracleJsonFactory();
        
        @Override
        public JsonParser convert(MovieDetails source) {
            Jsonb jsonb = JsonbBuilder.create();
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            OracleJsonGenerator gen = factory.createJsonBinaryGenerator(baos);
            ((YassonJsonb)jsonb).toJson(source, gen.wrap(JsonGenerator.class));
            gen.close();
            return FACTORY.createJsonBinaryParser(ByteBuffer.wrap(baos.toByteArray())).wrap(JsonParser.class);
        }
    }

}
