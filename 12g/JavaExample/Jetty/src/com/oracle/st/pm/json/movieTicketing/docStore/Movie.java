package com.oracle.st.pm.json.movieTicketing.docStore;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import java.io.IOException;

import java.text.ParseException;
import java.text.SimpleDateFormat;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

import oracle.soda.OracleDatabase;
import oracle.soda.OracleDocument;
import oracle.soda.OracleException;

public class Movie extends SodaCollection {

    public static final String COLLECTION_NAME = "Movie";

    private int id;
    private String title;
    private String plot;
    private int runtime;
    private String posterURL;
    private CastMember[] cast;
    private CrewMember[] crew;
    private Date releaseDate;
    private String certification;
    private boolean inTheaters;
    private String externalURL;

    protected class CastMember {
        private String name;
        private String character;

        protected CastMember(String name, String character) {
            this.name = name;
            this.character = character;
        }
    }

    protected class CrewMember {
        private String name;
        private String job;

        protected CrewMember(String name, String job) {
            this.name = name;
            this.job = job;
        }
    }

    public Movie(String title, int runtime, CastMember[] cast, CrewMember[] crew, String plot, String posterURL) {
        super();
        this.title = title;
        this.cast = cast;
        this.crew = crew;
        this.plot = plot;
        this.runtime = runtime;
        this.posterURL = posterURL;
    }

    public Movie() {
        super();
    }

    public int getMovieId() {
        return this.id;
    }

    public String getTitle() {
        return this.title;
    }

    public int getRuntime() {
        return runtime;
    }

    public void setPosterURL(String posterURL) {
        this.posterURL = posterURL;
    }

    public String getPosterURL() {
        return posterURL;
    }

    public void setExternalURL(String externalURL) {
        this.externalURL = externalURL;
    }

    public Movie(JsonObject movieDetails, String country, String baseURL, String apiKey) {
        this.id = movieDetails.get("id").getAsInt();
        this.title = movieDetails.get("original_title").getAsString();
        this.plot = movieDetails.get("overview").getAsString();
        if (movieDetails.has("runtime")) {
            this.runtime = movieDetails.get("runtime").getAsInt();
        } else {
            this.runtime = ThreadLocalRandom.current().nextInt(120, 150 + 1);
        }
        if (!movieDetails.get("poster_path").isJsonNull()) {
            this.posterURL =
                baseURL + "w185" + movieDetails.get("poster_path").getAsString() + '?' + "api_key=" + apiKey;
        }

        JsonArray castMembers = movieDetails.getAsJsonObject("credits").getAsJsonArray("cast");
        JsonArray crewMembers = movieDetails.getAsJsonObject("credits").getAsJsonArray("crew");

        this.cast = new CastMember[castMembers.size()];
        Iterator castList = castMembers.iterator();
        int i = 0;
        while (castList.hasNext()) {
            JsonElement je = (JsonElement) castList.next();
            JsonObject jo = je.getAsJsonObject();
            cast[i] = new CastMember(jo.get("name").getAsString(), jo.get("character").getAsString());
            i++;
        }

        this.crew = new CrewMember[crewMembers.size()];
        Iterator crewList = crewMembers.iterator();
        i = 0;
        while (crewList.hasNext()) {
            JsonElement je = (JsonElement) crewList.next();
            JsonObject jo = je.getAsJsonObject();
            crew[i] = new CrewMember(jo.get("name").getAsString(), jo.get("job").getAsString());
            i++;
        }

        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
        try {
            this.releaseDate = sdf.parse("2999-12-31");
        } catch (ParseException e) {
        }

        JsonArray releases = movieDetails.getAsJsonObject("releases").getAsJsonArray("countries");
        Iterator itr = releases.iterator();
        while (itr.hasNext()) {
            JsonObject release = (JsonObject) itr.next();
            if (release.getAsJsonPrimitive("iso_3166_1").getAsString().equals(country)) {
                Date tempReleaseDate = null;
                try {
                    tempReleaseDate = sdf.parse(release.getAsJsonPrimitive("release_date").getAsString());
                } catch (ParseException e) {
                }
                if (tempReleaseDate.before(this.releaseDate)) {
                    this.releaseDate = tempReleaseDate;
                    this.certification = release.getAsJsonPrimitive("certification").getAsString();
                }
            }
        }
    }

    public static Movie[] toMovies(OracleDocument[] documentList) throws OracleException, IOException {
        ArrayList<OracleDocument> movieList = new ArrayList<OracleDocument>(Arrays.asList(documentList));
        Movie[] movies = new Movie[movieList.size()];
        for (int i = 0; i < movies.length; i++) {
            movies[i] = Movie.fromJSON(movieList.get(i).getContentAsString());
        }
        return movies;
    }

    public static List<OracleDocument> toOracleDocumentList(OracleDatabase db,
                                                            List<Movie> movies) throws OracleException {
        List<OracleDocument> documents = new ArrayList<OracleDocument>();

        Iterator<Movie> iMovies = movies.iterator();
        while (iMovies.hasNext()) {
            Movie m = iMovies.next();
            documents.add(db.createDocumentFromString(m.toJSON()));
        }
        return documents;
    }

    public static HashMap<Integer, Movie> getMoviesById(OracleDatabase db) throws OracleException, IOException {
        OracleDocument [] documents = getMovies(db);
        HashMap<Integer, Movie> movieList = new HashMap<Integer, Movie>();
        for (int i = 0; i < documents.length; i++) {
          Movie movie = fromJSON(documents[i].getContentAsString());
          movieList.put(movie.getMovieId(), movie);
        }
        return movieList;
    }


    public static OracleDocument[] getMovies(OracleDatabase db) throws OracleException, IOException {
        return getDocuments(db,COLLECTION_NAME,-1);
    }
    
    public static OracleDocument[] getMovies(OracleDatabase db, int limit) throws OracleException, IOException {
        return getDocuments(db,COLLECTION_NAME,limit);
    }

    public static long getMovieCount(OracleDatabase db) throws OracleException {
        return getDocumentCount(db,COLLECTION_NAME);
    }

    public static OracleDocument getMovie(OracleDatabase db, String key) throws OracleException, IOException {
      return getDocument(db,COLLECTION_NAME,key);
    }

    public static OracleDocument getMovieById(OracleDatabase db, int id) throws OracleException {
        return getDocumentById(db,COLLECTION_NAME,id);
    }

    public static OracleDocument[] searchMovies(OracleDatabase db, String qbeDefinition) throws OracleException, IOException {
        return searchCollection(db,COLLECTION_NAME,qbeDefinition);
    }

    public static List<OracleDocument> bulkInsertMovies(OracleDatabase db, SodaCollection[] documents) throws OracleException {
        return bulkInsert(db,COLLECTION_NAME,documents);
    }

    public boolean updateMovie(OracleDatabase db, String key, String version,
                                   OracleDocument newDocument) throws OracleException {
       return updateDocument(db,COLLECTION_NAME,key,version,newDocument);
    }

    public static void recreateMovieCollection(OracleDatabase db, List<Movie> movies) throws OracleException {

        // Create a collection with the name "Movie" and store the documents
        List<OracleDocument> documents = Movie.toOracleDocumentList(db, movies);
        recreateCollection(db,COLLECTION_NAME, documents);
        dropCollection(db,Poster.COLLECTION_NAME);
        dropCollection(db,Screening.COLLECTION_NAME);        
    }

    
    public static void indexMovieCollection(OracleDatabase db) throws OracleException {
        createIndexes(db,COLLECTION_NAME);
    }

    public static void createMovieCollection(OracleDatabase db) throws OracleException {
        createCollection(db,COLLECTION_NAME);
    }

    public static void dropMovieCollection(OracleDatabase db) throws OracleException {
        dropCollection(db,COLLECTION_NAME);
    }
    
    public static Movie fromJSON(String json) {
        return gson.fromJson(json, Movie.class);
    }

}
