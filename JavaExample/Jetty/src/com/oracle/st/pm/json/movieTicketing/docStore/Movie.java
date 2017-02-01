package com.oracle.st.pm.json.movieTicketing.docStore;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import com.oracle.st.pm.json.movieTicketing.qbe.BetweenOperator;
import com.oracle.st.pm.json.movieTicketing.qbe.GetDocumentById;

import com.oracle.st.pm.json.movieTicketing.utilitiy.CollectionManager;

import java.io.IOException;

import java.text.ParseException;
import java.text.SimpleDateFormat;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;

import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

import oracle.soda.OracleCollection;
import oracle.soda.OracleCursor;
import oracle.soda.OracleDatabase;
import oracle.soda.OracleDocument;
import oracle.soda.OracleException;
import oracle.soda.OracleOperationBuilder;

public class Movie {

    public static final String COLLECTION_NAME = "Movie";

    private static final Gson gson = new GsonBuilder().setDateFormat("yyyy-MM-dd'T'HH:mm:ssZ").create();

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

    public static List<OracleDocument> toOracleDocumentList(OracleDatabase db,
                                                            List<Movie> movies) throws OracleException {
        List<OracleDocument> documents = new ArrayList<OracleDocument>();

        Iterator<Movie> iMovies = movies.iterator();
        while (iMovies.hasNext()) {
            Movie m = iMovies.next();
            documents.add(db.createDocumentFromString(m.toJson()));
        }

        return documents;
    }

    public static long getMovieCount(OracleDatabase db) throws OracleException {
        OracleCollection movies = db.openCollection(COLLECTION_NAME);
        if (movies != null) {
            OracleOperationBuilder movieDocuments = movies.find();
            return movieDocuments.count();
        }
        else {
            return 0;
        }
    }


    public static HashMap<Integer, Movie> getMoviesById(OracleDatabase db) throws OracleException, IOException {

        HashMap<Integer, Movie> moviesById = new HashMap<Integer, Movie>();
        OracleCollection movies = db.openCollection("Movie");
        OracleOperationBuilder movieDocuments = movies.find();
        int movieCount = (int) movieDocuments.count();
        OracleCursor movieCursor = movieDocuments.getCursor();
        while (movieCursor.hasNext()) {
            OracleDocument doc = movieCursor.next();
            Movie movie = Movie.fromJson(doc.getContentAsString());
            moviesById.put(movie.getMovieId(), movie);
        }
        movieCursor.close();
        return moviesById;
    }


    public static OracleDocument[] getMovies(OracleDatabase db) throws OracleException, IOException {
        OracleCollection movies = db.openCollection(Movie.COLLECTION_NAME);
        if (movies != null) {
          OracleOperationBuilder movieDocuments = movies.find();
          long movieCount = movieDocuments.count();
          OracleDocument[] movieList = new OracleDocument[(int) movieCount];
          OracleCursor movieCursor = movieDocuments.getCursor();
          for (int i = 0; i < movieCount; i++) {
             movieList[i] = movieCursor.next();
          }
          movieCursor.close();
          return movieList;
        } 
        else {
            return new OracleDocument[0];
        }
    }

    public static OracleDocument getMovie(OracleDatabase db, String key) throws OracleException, IOException {
        OracleCollection movies = db.openCollection(Movie.COLLECTION_NAME);
        OracleDocument movie = movies.findOne(key);
        return movie;
    }

    public static OracleDocument getMovieById(OracleDatabase db, int id) throws OracleException {
        OracleCollection movies = db.openCollection(Movie.COLLECTION_NAME);
        GetDocumentById qbeDefinition = new GetDocumentById(id);
        OracleDocument qbe = db.createDocumentFromString(gson.toJson(qbeDefinition));
        OracleOperationBuilder operation = movies.find().filter(qbe);
        OracleDocument doc = operation.getOne();
        return doc;
    }

    public static OracleDocument[] searchMovies(OracleDatabase db, String qbeDefinition) throws OracleException,
                                                                                                IOException {
        OracleCollection movies = db.openCollection(Movie.COLLECTION_NAME);
        OracleDocument qbe = db.createDocumentFromString(qbeDefinition);
        OracleOperationBuilder movieDocuments = movies.find().filter(qbe);
        long movieCount = movieDocuments.count();
        OracleDocument[] movieList = new OracleDocument[(int) movieCount];
        OracleCursor movieCursor = movieDocuments.getCursor();
        for (int i = 0; i < movieCount; i++) {
            movieList[i] = movieCursor.next();
        }
        movieCursor.close();
        return movieList;
    }

    public static void saveMovies(CollectionManager collectionManager, List<Movie> movies) throws OracleException {

        // Create a collection with the name "Movie" and store the documents
        List<OracleDocument> documents = Movie.toOracleDocumentList(collectionManager.getDatabase(), movies);
        OracleCollection col = collectionManager.recreateCollection(Movie.COLLECTION_NAME);
        col.insert(documents.iterator());
        col = collectionManager.recreateCollection(Poster.COLLECTION_NAME);
        col.admin().drop();
        col = collectionManager.recreateCollection(Screening.COLLECTION_NAME);
        col.admin().drop();
    }

    public static Movie fromJson(String json) {
        return gson.fromJson(json, Movie.class);
    }

    public String toJson() {
        return gson.toJson(this);
    }

}
