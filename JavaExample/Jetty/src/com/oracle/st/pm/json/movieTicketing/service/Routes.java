package com.oracle.st.pm.json.movieTicketing.service;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import com.oracle.st.pm.json.movieTicketing.data.ExternalInterfaces;
import com.oracle.st.pm.json.movieTicketing.utilitiy.CollectionManager;
import com.oracle.st.pm.json.movieTicketing.utilitiy.DBConnection;

import java.io.IOException;

import java.sql.Connection;
import java.sql.SQLException;

import java.text.ParseException;

import javax.naming.NamingException;

import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

import oracle.soda.OracleException;

import oracle.soda.rdbms.OracleRDBMSClient;

import oracle.xml.parser.v2.XMLParseException;
import oracle.xml.parser.v2.XSLException;

import org.xml.sax.SAXException;

@Path("/")

public class Routes {

    private static Gson gson = new GsonBuilder().setDateFormat("yyyy-MM-dd'T'HH:mm:ssZ").create();
    private CollectionManager collectionManager = new CollectionManager();
    private Connection jdbcConnection;

    public Routes() throws SQLException, IOException, OracleException {
        super();
        // Get a database.
        collectionManager.setDatabase(DBConnection.getOracleDatabase());
    }

    @GET
    @Path("theaters")
    @Produces(MediaType.APPLICATION_JSON)
    public String getTheaters() throws SQLException, IOException, OracleException, ParseException, NamingException {
        return TheaterService.getTheaters(this.collectionManager.getDatabase());
    }

    @GET
    @Path("theaters/{key}")
    @Produces(MediaType.APPLICATION_JSON)
    public String getTheater(@PathParam("key") String key) throws SQLException, IOException, OracleException,
                                                                  ParseException, NamingException {
        return TheaterService.getTheater(this.collectionManager.getDatabase(), key);
    }

    @GET
    @Path("theaters/id/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public String getTheaterById(@PathParam("id") int id) throws SQLException, IOException, OracleException,
                                                                 ParseException, NamingException {
        return TheaterService.getTheaterById(collectionManager.getDatabase(), gson, id);
    }

    @GET
    @Path("theaters/{key}/movies/{date}")
    @Produces(MediaType.APPLICATION_JSON)
    public String getMoviesByTheater(@PathParam("key") String key, @PathParam("date") String date) throws SQLException,
                                                                                                          IOException,
                                                                                                          OracleException,
                                                                                                          ParseException,
                                                                                                          NamingException {
        return TheaterService.getMoviesByTheater(this.collectionManager.getDatabase(), key, date);
    }

    @GET
    @Path("theaters/latitude/{latitude}/longitude/{longitude}/distance/{distance}")
    @Produces(MediaType.APPLICATION_JSON)
    public String getTheatersByLocation(@PathParam("latitude") double latitude,
                                        @PathParam("longitude") double longitude,
                                        @PathParam("distance") int distance) throws SQLException, IOException,
                                                                                    OracleException, ParseException,
                                                                                    NamingException {
        return TheaterService.getTheatersByLocation(this.collectionManager.getDatabase(), latitude, longitude,
                                                    distance);
    }

    @POST
    @Path("theaters/search/qbe")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public String searchTheaters(final String qbe) throws SQLException, IOException, OracleException, ParseException,
                                                          NamingException, InterruptedException {
        return TheaterService.searchTheaters(this.collectionManager.getDatabase(), qbe);
    }

    @GET
    @Path("movies")
    @Produces(MediaType.APPLICATION_JSON)
    public String getMovies() throws SQLException, IOException, OracleException, ParseException, NamingException {
        return MovieService.getMovies(this.collectionManager.getDatabase());
    }

    @GET
    @Path("movies/{key}")
    @Produces(MediaType.APPLICATION_JSON)
    public String getMovie(@PathParam("key") String key) throws SQLException, IOException, OracleException,
                                                                ParseException, NamingException {
        return MovieService.getMovie(this.collectionManager.getDatabase(), key);
    }

    @GET
    @Path("movies/id/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public String getMovieById(@PathParam("id") int id) throws SQLException, IOException, OracleException,
                                                               ParseException, NamingException {
        return MovieService.getMovieById(this.collectionManager.getDatabase(), id);
    }

    @GET
    @Path("movies/{key}/theaters/{date}")
    @Produces(MediaType.APPLICATION_JSON)
    public String getTheatersByMovie(@PathParam("key") String key, @PathParam("date") String date) throws SQLException,
                                                                                                          IOException,
                                                                                                          OracleException,
                                                                                                          ParseException,
                                                                                                          NamingException {
        return MovieService.getTheatersByMovie(this.collectionManager.getDatabase(), key, date);
    }

    @POST
    @Path("movies/search/qbe")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public String searchMovies(final String qbe) throws SQLException, IOException, OracleException, ParseException,
                                                        NamingException, InterruptedException {
        return MovieService.searchMovies(this.collectionManager.getDatabase(), qbe);
    }

    @GET
    @Path("screenings/{key}")
    @Produces(MediaType.APPLICATION_JSON)
    public String getScreening(@PathParam("key") String key) throws SQLException, IOException, OracleException,
                                                                    ParseException, NamingException {
        return ScreeningService.getScreening(this.collectionManager.getDatabase(), key);
    }

    @GET
    @Path("poster/{key}")
    @Produces("image/jpeg")
    public byte[] getPoster(@PathParam("key") String key) throws SQLException, IOException, OracleException,
                                                                 ParseException, NamingException {
        return PosterService.getPoster(this.collectionManager.getDatabase(), key);
    }

    @GET
    @Path("config/loadmovies")
    @Produces(MediaType.APPLICATION_JSON)
    public String loadMoviesFromTMDB() throws SQLException, IOException, OracleException, ParseException,
                                              NamingException, InterruptedException {
        return ExternalInterfaces.loadMoviesFromTMDB(this.collectionManager);
    }

    @GET
    @Path("config/loadtheaters")
    @Produces(MediaType.APPLICATION_JSON)
    public String loadTheatersFromFandango() throws SQLException, IOException, OracleException, ParseException,
                                                    NamingException, XMLParseException, SAXException, XSLException,
                                                    InterruptedException {
        return ExternalInterfaces.loadTheatersFromFandango(this.collectionManager);
    }

    @GET
    @Path("config/loadscreenings")
    @Produces(MediaType.APPLICATION_JSON)
    public String generateScreenings() throws SQLException, IOException, OracleException, ParseException,
                                              NamingException, InterruptedException {
        return ExternalInterfaces.generateScreenings(this.collectionManager);
    }

    @GET
    @Path("config/loadposters")
    
    @Produces(MediaType.APPLICATION_JSON)
    public String loadPostersFromTMDB() throws SQLException, IOException, OracleException, ParseException,
                                               NamingException, InterruptedException {
        return ExternalInterfaces.loadPostersFromTMDB(this.collectionManager);
    }

    @POST
    @Path("bookTickets")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public String bookTikcket(final String booking) throws SQLException, IOException, OracleException, ParseException,
                                                           NamingException, InterruptedException {
        return BookingService.bookTickets(this.collectionManager.getDatabase(), booking);
    }



    @GET
    @Path("application/status")
    @Produces(MediaType.APPLICATION_JSON)
    public String getApplicationStatus() throws OracleException, IOException {
        return ApplicationStatusService.getApplicationStatus(this.collectionManager);
    }

    @POST
    @Path("application/dataSources")
    @Consumes(MediaType.APPLICATION_JSON)
    public void updateDataSources(final String updates) throws SQLException, IOException, OracleException,
                                                               ParseException, NamingException, InterruptedException {
        ApplicationStatusService.updateDataSources(updates);
    }

    @Override
    protected void finalize() throws Throwable {
        // TODO Implement this method
        super.finalize();
        this.collectionManager.getDatabase().admin().getConnection().close();
    }

    /*
 *
    router.route('/movieticketlog/operationId/:id')
        .get(getLogRecordsByOperation);
*/

}
