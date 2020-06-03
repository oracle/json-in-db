package com.oracle.st.pm.json.movieTicketing.data;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import com.oracle.st.pm.json.movieTicketing.docStore.Movie;
import com.oracle.st.pm.json.movieTicketing.docStore.Poster;
import com.oracle.st.pm.json.movieTicketing.docStore.Screening;
import com.oracle.st.pm.json.movieTicketing.docStore.SodaCollection;
import com.oracle.st.pm.json.movieTicketing.docStore.Theater;
import com.oracle.st.pm.json.movieTicketing.utilitiy.DBConnection;
import com.oracle.st.pm.json.movieTicketing.utilitiy.DataSources;

import java.io.ByteArrayOutputStream;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;

import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLEncoder;

import java.sql.SQLException;

import java.text.SimpleDateFormat;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

import oracle.soda.OracleCollection;
import oracle.soda.OracleDatabase;
import oracle.soda.OracleDocument;
import oracle.soda.OracleException;

import oracle.xml.parser.v2.DOMParser;
import oracle.xml.parser.v2.XMLDocument;
import oracle.xml.parser.v2.XMLElement;
import oracle.xml.parser.v2.XMLParseException;
import oracle.xml.parser.v2.XSLException;

import org.w3c.dom.NodeList;

import org.xml.sax.SAXException;

public class ExternalInterfaces {

    private static final Gson gson = new GsonBuilder().setDateFormat(SodaCollection.ISO_DATE_FORMAT).create();
    private static final DataSources dataSources = DataSources.loadDataSources();
    private static final SimpleDateFormat sdf = new SimpleDateFormat(SodaCollection.ISO_DATE_FORMAT);
    
    public ExternalInterfaces() {

        super();
    }

    private static String addApiKey() {
        return "api_key=" + dataSources.tmdb.apiKey;
    }

    public static List<Screening> generateShowTimes(List<Screening> showTimes, Calendar startDate, Calendar endDate,
                                                    int theaterId, Theater.Screen screen, Movie movie,
                                                    int[] firstShowTime) {

        int runtime = movie.getRuntime();

        Calendar engagementLimit = (Calendar) endDate.clone();
        engagementLimit.add(Calendar.DAY_OF_MONTH, 1);

        Calendar showTime = (Calendar) startDate.clone();
        Calendar tomorrow = (Calendar) showTime.clone();

        tomorrow.add(Calendar.DAY_OF_MONTH, 1);

        showTime.add(Calendar.HOUR, firstShowTime[0]);
        showTime.add(Calendar.MINUTE, firstShowTime[1]);

        while (showTime.before(engagementLimit)) {
            showTimes.add(new Screening(theaterId, movie.getMovieId(), screen.getScreenId(), showTime, screen));
            showTime.add(Calendar.MINUTE, runtime + 30);
            if (showTime.after(tomorrow)) {
                showTime = (Calendar) tomorrow.clone();
                ;
                showTime.add(Calendar.HOUR, firstShowTime[0]);
                showTime.add(Calendar.MINUTE, firstShowTime[1]);
                tomorrow.add(Calendar.DAY_OF_MONTH, 1);
            }
        }

        return showTimes;

    }
    
    public static List<Screening> getScreeningsFromFile(String file) throws IOException {

        JsonParser p = new JsonParser();
        ArrayList<Screening> screenings = new ArrayList<Screening>();

        FileInputStream fis = new FileInputStream(file);
        JsonElement je = p.parse(new InputStreamReader(fis));
        JsonArray screeningsFromFile = je.getAsJsonArray();
        for (int i=0; i<screeningsFromFile.size(); i++) {
          Screening screening = Screening.fromJSON(gson.toJson(screeningsFromFile.get(i)));
          screenings.add(screening);
        }
        
        return screenings;
    }

    private static List<Screening> createScreenings(OracleDatabase db) throws FileNotFoundException, SQLException,
                                                                              IOException, OracleException {

        HashMap<Integer, Theater> theatersById = (HashMap<Integer,Theater>) Theater.getTheatersById(db);
        HashMap<Integer, Movie> moviesById = Movie.getMoviesById(db);

        Integer[] movieKeys = moviesById.keySet().toArray(new Integer[moviesById.size()]);
        List<Screening> showTimes = new ArrayList<Screening>();

        Calendar startDate = Calendar.getInstance();
        SimpleDateFormat sdf = new SimpleDateFormat(SodaCollection.ISO_DATE_FORMAT);
        // System.out.println(sdf.format(startDate.getTime()));
        startDate.set(Calendar.MINUTE, 0);
        startDate.set(Calendar.SECOND, 0);
        startDate.set(Calendar.MILLISECOND, 0);

        Calendar endDate = (Calendar) startDate.clone();
        endDate.add(Calendar.DATE, 15);
        // System.out.println(sdf.format(endDate.getTime()));


        Integer[] theaterKeys = theatersById.keySet().toArray(new Integer[theatersById.size()]);
        for (int t = 0; t < theaterKeys.length; t++) {
            Theater theater = theatersById.get(theaterKeys[t]);
            int screenCount = theater.getScreenCount();
            for (int s = 0; s < screenCount; s++) {
                int movieId = ThreadLocalRandom.current().nextInt(0, movieKeys.length);
                int[] firstShowTime = new int[] { 12, 15 };
                showTimes =
                    generateShowTimes(showTimes, startDate, endDate, theaterKeys[t], theater.getScreen(s + 1),
                                      moviesById.get(movieKeys[movieId]), firstShowTime);
            }
        }

        return showTimes;
    }


    public static String generateScreenings(OracleDatabase db) throws SQLException, IOException,
                                                                                        InterruptedException,
                                                                                        OracleException {
        System.out.println(sdf.format(new Date()) + "[ExternalInterfaces.generateScreenings()]: Started.");
        List<Screening> screenings = null;
        if (dataSources.emulate) {
          screenings = getScreeningsFromFile(dataSources.emulation.screenings);
        }
        else {
            screenings = createScreenings(db);
        }
        Screening.recreateScreeningCollection(db, screenings);
        System.out.println(sdf.format(new Date()) + "[ExternalInterfaces.generateScreenings()]: Completed.");
        return "{\"count\":" + screenings.size() + "}";
    }

    private static Theater.Location geoCodeAddressUSCensus(String address, String benchmark,
                                                           int tryCount) throws MalformedURLException, IOException {
        String urlString =
            dataSources.usCensus.protocol + "://" + dataSources.usCensus.hostname + ":" + dataSources.usCensus.port +
            dataSources.usCensus.path + "?" + "format=" + "json" + "&" + "benchmark=" + benchmark + "&" + "address=" +
            URLEncoder.encode(address, "UTF-8");

        URL addressGeocoder = new URL(urlString);
        JsonParser p = new JsonParser();

        try {
            JsonElement je = p.parse(new InputStreamReader(addressGeocoder.openStream()));
            JsonObject jo = je.getAsJsonObject();
            return convertUSCensusGeocoding(jo);
        } catch (IOException ioe) {
            if (tryCount == 10) {
                return null;
            } else {
                if (ioe.getMessage().startsWith("Server returned HTTP response code: 500")) {
                    return geoCodeAddressUSCensus(address, benchmark, tryCount + 1);
                } else {
                    throw ioe;
                }
            }
        }
    }

    private static Theater.Location convertUSCensusGeocoding(JsonObject jo) {

        Theater.Location loc = null;

        if (jo != null) {
            jo = jo.getAsJsonObject("result");

            JsonArray addressMatches = jo.getAsJsonArray("addressMatches");
            JsonObject input = jo.getAsJsonObject("input");

            String address = input.getAsJsonObject("address").get("address").getAsString();
            String streetNumber = address.substring(0, address.indexOf(" "));


            if (addressMatches.size() > 0) {
                jo = addressMatches.get(0).getAsJsonObject();
                JsonObject coordinates = jo.getAsJsonObject("coordinates");
                JsonObject addressInfo = jo.getAsJsonObject("addressComponents");

                String streetAddress = "";

                if (addressInfo.has("preQualifier")) {
                    streetAddress += addressInfo.get("preQualifier").getAsString() + " ";
                }

                if (addressInfo.has("preDirection")) {
                    streetAddress += addressInfo.get("preDirection").getAsString() + " ";
                }

                if (addressInfo.has("preType")) {
                    streetAddress += addressInfo.get("preType").getAsString() + " ";
                }

                if (addressInfo.has("streetName")) {
                    streetAddress += addressInfo.get("streetName").getAsString() + " ";
                }

                if (addressInfo.has("suffixType")) {
                    streetAddress += addressInfo.get("suffixType").getAsString() + " ";
                }

                if (addressInfo.has("suffixDirection")) {
                    streetAddress += addressInfo.get("suffixDirection").getAsString() + " ";
                }

                if (addressInfo.has("suffixQualifier")) {
                    streetAddress += addressInfo.get("suffixQualifier").getAsString() + " ";
                }

                streetAddress = streetNumber + " " + streetAddress.trim();


                String city = null;
                String state = null;
                String zip = null;

                if (addressInfo.has("city")) {
                    city = addressInfo.get("city").getAsString();
                }

                if (addressInfo.has("state")) {
                    state = addressInfo.get("state").getAsString();
                }

                if (addressInfo.has("zip")) {
                    zip = addressInfo.get("zip").getAsString();
                }

                if (city == null) {
                    city = "unavailable";
                }

                if (zip == null) {
                    zip = "0";
                }

                loc =
                    new Theater.Location(streetAddress, city, state, zip, coordinates.get("y").getAsDouble(),
                                         coordinates.get("x").getAsDouble());
            }
        }
        return loc;
    }

    public static List<Theater> getTheatersFromFile(String file) throws IOException {

        JsonParser p = new JsonParser();
        ArrayList<Theater> theaters = new ArrayList<Theater>();

        FileInputStream fis = new FileInputStream(file);
        JsonElement je = p.parse(new InputStreamReader(fis));
        JsonArray theatersFromFile = je.getAsJsonArray();
        for (int i=0; i<theatersFromFile.size(); i++) {
          Theater theater = Theater.fromJSON(gson.toJson(theatersFromFile.get(i)));
          theaters.add(theater);
        }
        
        return theaters;
    }

    public static List<Theater> getNearbyTheaters() throws MalformedURLException,
                                                                                              IOException,
                                                                                              XMLParseException,
                                                                                              SAXException,
                                                                                              XSLException,
                                                                                              InterruptedException {

        List<Theater> result = new ArrayList<Theater>();
        DOMParser p = new DOMParser();
        String urlString =
            dataSources.fandango.protocol + "://" + dataSources.fandango.hostname + ":" + dataSources.fandango.port +
            dataSources.fandango.path + dataSources.fandango.searchCriteria.zipCode + ".rss";

        URL theaterListing = new URL(urlString);
        p.parse(theaterListing.openStream());
        XMLDocument d = p.getDocument();
        NodeList nl = d.selectNodes("/rss/channel/item");

        for (int i = 0; i < nl.getLength(); i++) {
            XMLElement e = (XMLElement) nl.item(i);
            String name = e.getChildrenByTagName("title").item(0).getFirstChild().getNodeValue();
            // System.out.println("Processing: " + name);
            String numberOfScreens = name.replaceAll("\\D+", "");

            int screenCount = 0;
            if (numberOfScreens.length() > 0) {
                screenCount = Integer.parseInt(numberOfScreens);
            } else {
                screenCount = ThreadLocalRandom.current().nextInt(8, 17);
            }

            Theater.Screen[] screens = new Theater.Screen[screenCount];

            for (int s = 0; s < screenCount; s++) {
                screens[s] = new Theater.Screen(s + 1);
            }

            String address = e.getChildrenByTagName("description").item(0).getFirstChild().getNodeValue();
            address = (String) address.substring(3, address.indexOf("</p>"));
            Theater.Location loc = null;

            if (!DBConnection.isNearSupported()) {
                loc = new Theater.Location(address);
            } else {
                switch (dataSources.geocodingService.toLowerCase()) {
                case "google":
                    loc = geoCodeAddressGoogle(address);
                    break;
                case "uscensus":
                    loc = geoCodeAddressUSCensus(address, "Public_AR_Census2010", 0);
                    if (loc == null) {
                        loc = geoCodeAddressUSCensus(address, "Public_AR_ACS2015", 0);
                    }
                    if (loc == null) {
                        System.out.println(sdf.format(new Date()) + ": Failed to Geocode \"" + address + "\" [USCensus].");
                        loc = new Theater.Location(address);
                    }
                    break;
                case "oracle":
                    System.out.println(sdf.format(new Date()) + ": Failed to Geocode \"" + address + "\" [Oracle].");
                default:
                    loc = new Theater.Location(address);
                }
            }
            result.add(new Theater(i + 1, name, loc, screens));
        }
        return result;
    }

    public static String loadTheatersFromFandango(OracleDatabase db) throws SQLException, IOException,
                                                                                              XMLParseException,
                                                                                              SAXException,
                                                                                              XSLException,
                                                                                              OracleException,
                                                                                              InterruptedException {
        System.out.println(sdf.format(new Date()) + "[ExternalInterfaces.loadTheatersFromFandango()]: Started.");
        List<Theater> theaters = null;
        if (dataSources.emulate) {
          theaters = getTheatersFromFile(dataSources.emulation.theaters);
        }
        else {
          theaters = getNearbyTheaters();
        }
        Theater.recreateTheaterCollection(db, theaters);
        System.out.println(sdf.format(new Date()) + "[ExternalInterfaces.loadTheatersFromFandango()]: Completed.");
        return "{\"count\":" + theaters.size() + "}";
    }

    public static boolean unratedMovie(JsonObject movieDetails) {
        JsonArray releases = movieDetails.getAsJsonObject("releases").getAsJsonArray("countries");
        Iterator i = releases.iterator();
        while (i.hasNext()) {
            JsonObject release = (JsonObject) i.next();
            if (release.getAsJsonPrimitive("iso_3166_1").getAsString().equals("US")) {
                if (release.getAsJsonPrimitive("certification").getAsString().equals("NR")) {
                    return true;
                }
            }
        }
        return false;
    }

    private static JsonObject getMovieDetails(int tmdbID) throws MalformedURLException, IOException {

        String urlString =
            dataSources.tmdb.protocol + "://" + dataSources.tmdb.hostname + ":" + dataSources.tmdb.port +
            dataSources.tmdb.apiPath + "/movie/" + tmdbID + "?" + addApiKey() + "&" + "append_to_response=" +
            "credits,releases";

        URL movieDetailsURL = new URL(urlString);

        JsonParser p = new JsonParser();
        JsonElement je = p.parse(new InputStreamReader(movieDetailsURL.openStream()));
        return je.getAsJsonObject();

    }

    public static List<Movie> getMoviesFromTMDB() throws MalformedURLException, IOException, InterruptedException {

        JsonParser p = new JsonParser();

        String urlString =
            dataSources.tmdb.protocol + "://" + dataSources.tmdb.hostname + ":" + dataSources.tmdb.port +
            dataSources.tmdb.apiPath + "/configuration" + "?" + "api_key=" + dataSources.tmdb.apiKey;

        URL tmdbConfigurationURL = new URL(urlString);
        JsonElement je = p.parse(new InputStreamReader(tmdbConfigurationURL.openStream()));
        JsonObject tmdbConfiguration = je.getAsJsonObject();
        String baseURL = tmdbConfiguration.getAsJsonObject("images").getAsJsonPrimitive("base_url").getAsString();

        List<Movie> movies = new ArrayList<Movie>();

        int page = 1;
        int pages = 0;

        while (page != pages) {

            urlString =
                dataSources.tmdb.protocol + "://" + dataSources.tmdb.hostname + ":" + dataSources.tmdb.port +
                dataSources.tmdb.apiPath + "/discover/movie" + "?" + "api_key=" + dataSources.tmdb.apiKey + "&" +
                "primary_release_date.gte=" + dataSources.tmdb.searchCriteria.releaseDates.start + "&" +
                "primary_release_date.lte=" + dataSources.tmdb.searchCriteria.releaseDates.end + "&" +
                "certification_country=" + dataSources.tmdb.searchCriteria.country + "&" + "certification.lte=" +
                dataSources.tmdb.searchCriteria.certification + "&" + "original_language=" +
                dataSources.tmdb.searchCriteria.language + "&" + "include_adult=" + "false" + "&" + "sort_by=" +
                "popularity.desc";
            if (page > 1) {
                urlString = urlString + "&" + "page=" + page;
            }

            // System.out.println("Processing URL:" + urlString);

            URL tmdbMovieDetails = new URL(urlString);
            je = p.parse(new InputStreamReader(tmdbMovieDetails.openStream()));
            JsonObject jo = je.getAsJsonObject();

            if (page == 1) {
                pages = jo.get("total_pages").getAsInt();
            }

            JsonArray currentMovies = jo.getAsJsonArray("results");
            Iterator movieList = currentMovies.iterator();
            while (movieList.hasNext()) {
                je = (JsonElement) movieList.next();
                JsonObject movieSummary = je.getAsJsonObject();
                if (movieSummary.get("popularity").getAsFloat() < dataSources.tmdb.searchCriteria.popularity) {
                    return movies;
                }
                JsonObject movieDetails = getMovieDetails(movieSummary.get("id").getAsInt());
                if (!unratedMovie(movieDetails)) {
                    movies.add(new Movie(movieDetails, dataSources.tmdb.searchCriteria.country, baseURL,
                                         dataSources.tmdb.apiKey));
                    // System.out.println("Added: " + movieDetails.getAsJsonPrimitive("title").getAsString());
                } else
                    System.out.println(sdf.format(new Date()) + ": Skipped Unrated Movie: " +
                                       movieDetails.getAsJsonPrimitive("title").getAsString());
                if (movies.size() == dataSources.tmdb.searchCriteria.movieLimit) {
                    return movies;
                }
                Thread.sleep(400);
            }
            page++;
        }

        return movies;
    }

    public static List<Movie> getMoviesFromFile(String file) throws IOException {

        JsonParser p = new JsonParser();
        ArrayList<Movie> movies = new ArrayList<Movie>();

        FileInputStream fis = new FileInputStream(file);
        JsonElement je = p.parse(new InputStreamReader(fis));
        JsonArray moviesFromFile = je.getAsJsonArray();
        for (int i=0; i<moviesFromFile.size(); i++) {
          Movie movie = Movie.fromJSON(gson.toJson(moviesFromFile.get(i)));
          movies.add(movie);
        }
        
        return movies;
    }

    public static String loadMoviesFromTMDB(OracleDatabase db) throws SQLException, IOException,
                                                                                        InterruptedException,
                                                                                        OracleException {
        System.out.println(sdf.format(new Date()) + "[ExternalInterfaces.loadMoviesFromTMDB()]: Started.");
        List<Movie> movies = null;
        if (dataSources.emulate) {
          movies = getMoviesFromFile(dataSources.emulation.movies);
        }
        else {
          movies = getMoviesFromTMDB();
        }
        Movie.recreateMovieCollection(db, movies);
        System.out.println(sdf.format(new Date()) + "[ExternalInterfaces.loadMoviesFromTMDB()]: Completed.");
        return "{\"count\":" + movies.size() + "}";
    }

    private static OracleDocument createDocumentFromURL(OracleDatabase db, URL url,
                                                        String mediaType) throws IOException, OracleException {
        InputStream is = url.openStream();
        ByteArrayOutputStream baos = new ByteArrayOutputStream();

        try {
            byte[] byteChunk = new byte[4096]; // Or whatever size you want to read in at a time.
            int n;

            while ((n = is.read(byteChunk)) > 0) {
                baos.write(byteChunk, 0, n);
            }
        } catch (Exception e) {
            // Replace with whatever exception handling is appropriate
            // for your app
            System.err.printf("Failed while reading bytes from %s: %s", url.toExternalForm(), e.getMessage());
            e.printStackTrace();

        } finally {
            if (is != null) {
                is.close();
            }
        }

        byte[] docContent = baos.toByteArray();
        OracleDocument doc = db.createDocumentFromByteArray(null, docContent, mediaType);
        return doc;
    }

    public static String loadPostersFromTMDB(OracleDatabase db) throws OracleException, IOException,
                                                                                         InterruptedException {

        System.out.println(sdf.format(new Date()) + "[ExternalInterfaces.loadPostersFromTMDB()]: Started.");

        OracleDocument[] movieList = Movie.getMovies(db);
        OracleCollection movies = db.openCollection(Movie.COLLECTION_NAME);
        OracleCollection posters = Poster.recreatePosterCollection(db);

        for (int i = 0; i < movieList.length; i++) {
            Movie movie = gson.fromJson(movieList[i].getContentAsString(), Movie.class);
            URL posterURL = new URL(movie.getPosterURL());
            // System.out.println(movie.getMovieId() + " " + movie.getTitle() + " " + movie.getPosterURL());
            OracleDocument poster = createDocumentFromURL(db, posterURL, "image/jpeg");
            poster = posters.insertAndGet(poster);
            movie.setExternalURL(movie.getPosterURL());
            movie.setPosterURL("/movieticket/poster/" + poster.getKey());
            movies.find().key(movieList[i].getKey()).replaceOne(db.createDocumentFromString(movie.toJSON()));
            Thread.sleep(400);
        }
        System.out.println(sdf.format(new Date()) + "[ExternalInterfaces.loadPostersFromTMDB()]: Compeleted.");
        return "{\"count\":" + movieList.length + "}";
    }

    private static Theater.Location convertGoogleGeocoding(JsonObject jo) {

        Theater.Location loc = null;

        if (jo != null) {
            JsonArray results = jo.getAsJsonArray("results");
            JsonArray addressComponents = results.get(0).getAsJsonObject().getAsJsonArray("address_components");
            String streetNumber = null;
            String streetName = null;
            String city = null;
            String state = null;
            String zip = null;

            for (int i = 0; i < addressComponents.size(); i++) {
                JsonElement member = addressComponents.get(i);
                JsonArray types = member.getAsJsonObject().getAsJsonArray("types");
                for (int j = 0; j < types.size(); j++) {
                    if (types.get(j).getAsString().equalsIgnoreCase("street_number")) {
                        streetNumber = member.getAsJsonObject().getAsJsonPrimitive("long_name").getAsString();
                        break;
                    }
                    if (types.get(j).getAsString().equalsIgnoreCase("route")) {
                        streetName = member.getAsJsonObject().getAsJsonPrimitive("long_name").getAsString();
                        break;
                    }
                    if (types.get(j).getAsString().equalsIgnoreCase("locality")) {
                        city = member.getAsJsonObject().getAsJsonPrimitive("short_name").getAsString();
                        break;
                    }
                    if (types.get(j).getAsString().equalsIgnoreCase("administrative_area_level_1")) {
                        state = member.getAsJsonObject().getAsJsonPrimitive("long_name").getAsString();
                        break;
                    }
                    if (types.get(j).getAsString().equalsIgnoreCase("postal_code")) {
                        zip = member.getAsJsonObject().getAsJsonPrimitive("short_name").getAsString();
                        break;
                    }

                }
            }

            String streetAddress = "";

            // if (addressInfo.has("preQualifier")) {
            //   streetAddress += addressInfo.get("preQualifier").getAsString() + " ";
            // }

            //    if (addressInfo.has("preDirection")) {
            //        streetAddress += addressInfo.get("preDirection").getAsString() + " ";
            //    }

            //    if (addressInfo.has("preType")) {
            //        streetAddress += addressInfo.get("preType").getAsString() + " ";
            //    }

            if (streetName != null) {
                streetAddress += streetName;
            }

            // if (addressInfo.has("suffixType")) {
            //   streetAddress += addressInfo.get("suffixType").getAsString() + " ";
            // }

            // if (addressInfo.has("suffixDirection")) {
            //   streetAddress += addressInfo.get("suffixDirection").getAsString() + " ";
            // }

            // if (addressInfo.has("suffixQualifier")) {
            //   streetAddress += addressInfo.get("suffixQualifier").getAsString() + " ";
            // }

            streetAddress = streetNumber + " " + streetAddress.trim();

            if (city == null) {
                city = "unavailable";
            }

            if (zip == null) {
                zip = "0";
            }

            JsonObject coords =
                results.get(0).getAsJsonObject().getAsJsonObject("geometry").getAsJsonObject("location");
            loc =
                new Theater.Location(streetAddress, city, state, zip, coords.getAsJsonPrimitive("lat").getAsDouble(),
                                     coords.getAsJsonPrimitive("lng").getAsDouble());
        }
        return loc;
    }

    private static Theater.Location geoCodeAddressGoogle(String address) throws MalformedURLException, IOException,
                                                                                InterruptedException {

        JsonParser p = new JsonParser();

        String urlString =
            dataSources.google.geocoding.protocol + "://" + dataSources.google.geocoding.hostname + ":" +
            dataSources.google.geocoding.port + dataSources.google.geocoding.path + "?" + "key=" +
            dataSources.google.apiKey + "&" + "address=" + URLEncoder.encode(address);
        // System.out.println(urlString);
        URL googleGeocodingURL = new URL(urlString);

        try {
            JsonElement je = p.parse(new InputStreamReader(googleGeocodingURL.openStream()));
            JsonObject jo = je.getAsJsonObject();
            return convertGoogleGeocoding(jo);
        } catch (IOException ioe) {
            ioe.printStackTrace();
            return null;
        }
    }

}
