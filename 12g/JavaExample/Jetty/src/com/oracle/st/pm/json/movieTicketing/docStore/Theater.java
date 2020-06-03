package com.oracle.st.pm.json.movieTicketing.docStore;

import com.google.gson.annotations.SerializedName;

import java.io.IOException;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

import net.sourceforge.jgeocoder.AddressComponent;
import net.sourceforge.jgeocoder.us.AddressParser;

import oracle.soda.OracleCollection;
import oracle.soda.OracleCursor;
import oracle.soda.OracleDatabase;
import oracle.soda.OracleDocument;
import oracle.soda.OracleException;
import oracle.soda.OracleOperationBuilder;

public class Theater extends SodaCollection {

    public static final String COLLECTION_NAME = "Theater";

    private int id;
    private String name;
    private Location location;
    private Screen[] screens;

    public static class Location {

        private String street;
        private String city;
        private String zipCode;
        private String state;
        private String address;
        private String phoneNumber = null;
        private Geometry geoCoding;

        public static class Geometry {

            /*
            "geometry": {"type": "Point", "coordinates": [102.0, 0.5]},
            */

            private String type = "Point";
            private double[] coordinates;

            public Geometry(double x, double y) {
                coordinates = new double[] { x, y };
            }

            public Geometry() {
                this.type = null;
            }

            public double[] getCoordinates() {
                return this.coordinates;
            }
        }

        public Location(String street, String city, String state, String zipCode, double latitude, double longitude) {

            super();
            this.street = street;
            this.city = city;
            this.state = state;
            this.zipCode = zipCode;
            this.geoCoding = new Geometry(latitude, longitude);
        }

        public Location(String address) {

            super();

            Map<AddressComponent, String> addressComponents = AddressParser.parseAddress(address);

            if (addressComponents.containsKey(AddressComponent.STREET)) {
                String street = "";
                if (addressComponents.containsKey(AddressComponent.NUMBER)) {
                    street = addressComponents.get(AddressComponent.NUMBER) + " ";
                }
                street = street + addressComponents.get(AddressComponent.STREET);
                if (addressComponents.containsKey(AddressComponent.TYPE)) {
                    street = street + " " + addressComponents.get(AddressComponent.TYPE);
                }
                this.street = street;
                this.city =
                    (addressComponents.containsKey(AddressComponent.CITY) ?
                     addressComponents.get(AddressComponent.CITY).toUpperCase() : "unavailable");
                this.state =
                    (addressComponents.containsKey(AddressComponent.STATE) ?
                     addressComponents.get(AddressComponent.STATE) : "");
                this.zipCode =
                    (addressComponents.containsKey(AddressComponent.ZIP) ? addressComponents.get(AddressComponent.ZIP) :
                     "0");
            } else {
                this.street = address;
                this.city = "unavailable";
                this.zipCode = "0";
            }
            this.geoCoding = new Geometry(0, 0);
        }

        public Geometry getGeoCoding() {
            return this.geoCoding;
        }


    }

    public static class Screen {

        private int id;
        private int capacity;
        private ScreenFeatures features;
        private TicketPricing ticketPricing;
        private SeatMap seatMap;

        public static class ScreenFeatures {
            private boolean threeD;
            private boolean reserveSeats;

            private ScreenFeatures(boolean threeD, boolean reserveSeats) {
                this.threeD = threeD;
                this.reserveSeats = reserveSeats;
            }
        }

        public static class SeatMap {

            private int rowCount;
            private SeatRow[] rows;

            private class SeatRow {
                private int seatCount;
            }

            public SeatMap() {
                super();
            }
        }

        public static class TicketPricing {

            private float adultPrice;
            private float childPrice;
            private float seniorPrice;

            public TicketPricing(float adultPrice, float childPrice, float seniorPrice) {
                this.adultPrice = adultPrice;
                this.childPrice = childPrice;
                this.seniorPrice = seniorPrice;
            }

            public float getAdultPrice() {
                return this.adultPrice;
            }

            public float getChildPrice() {
                return this.childPrice;
            }

            public float getSeniorPrice() {
                return this.seniorPrice;
            }
        }

        public Screen(int id) {
            super();
            this.id = id;
            this.capacity = ThreadLocalRandom.current().nextInt(64, 129);
            this.features = new ScreenFeatures(false, false);
            this.ticketPricing = new TicketPricing((float) 14.95, (float) 9.95, (float) 9.95);
        }

        public static Screen Screen(int id) {
            Screen screen = new Screen(id);
            return screen;
        }

        public int getScreenId() {
            return this.id;
        }

        public int getCapacity() {
            return this.capacity;
        }

        public TicketPricing getTicketPricing() {
            return this.ticketPricing;
        }

        public Theater.Screen.SeatMap getSeatMap() {
            return this.seatMap;
        }
    }

    public static class TheatersByLocation {

        @SerializedName("location.geoCoding")
        public Object location;

        private class NearPredicate {

            private NearCondition $near;

            private class NearCondition {

                private Theater.Location.Geometry $geometry;
                private int $distance;
                private String $unit = "mile";

                private NearCondition(double latitude, double longitude, int distance) {
                    super();
                    this.$geometry = new Theater.Location.Geometry(latitude, longitude);
                    this.$distance = distance;
                }
            }

            private NearPredicate(double latitude, double longitude, int distance) {
                super();
                this.$near = new NearCondition(latitude, longitude, distance);
            }
        }

        public TheatersByLocation(double latitude, double longitude, int distance) {
            super();
            this.location = new NearPredicate(latitude, longitude, distance);
        }
    }

    public Theater(int id, String name, Location location, Screen[] screens) {
        super();
        this.id = id;
        this.name = name;
        this.location = location;
        this.screens = screens;
    }

    public int getTheaterId() {
        return this.id;
    }

    public String getName() {
        return this.name;
    }

    public int getScreenCount() {
        int screenCount = 0;
        if (screens != null) {
            screenCount = screens.length;
        }
        return screenCount;
    }

    public void resetScreens() {
        this.screens = null;
    }

    public Screen getScreen(int screenId) {
        return screens[screenId - 1];
    }

    public Location getLocation() {
        return this.location;
    }

    public static Theater[] toTheaters(OracleDocument[] documentList) throws OracleException, IOException {
        ArrayList<OracleDocument> theaterList = new ArrayList<OracleDocument>(Arrays.asList(documentList));
        Theater[] theaters = new Theater[theaterList.size()];
        for (int i = 0; i < theaters.length; i++) {
            theaters[i] = Theater.fromJSON(theaterList.get(i).getContentAsString());
        }
        return theaters;
    }
    public static List<OracleDocument> toOracleDocumentList(OracleDatabase db,
                                                            List<Theater> theaters) throws OracleException {
        List<OracleDocument> documents = new ArrayList<OracleDocument>();

        Iterator<Theater> iTheaters = theaters.iterator();
        while (iTheaters.hasNext()) {
            Theater t = iTheaters.next();
            documents.add(db.createDocumentFromString(t.toJSON()));
        }

        return documents;
    }

    public static HashMap<Integer, Theater> getTheatersById(OracleDatabase db) throws OracleException, IOException {
        OracleDocument [] documents = getTheaters(db);
        HashMap<Integer, Theater> theaterList = new HashMap<Integer, Theater>();
        for (int i = 0; i < documents.length; i++) {
          Theater theater = fromJSON(documents[i].getContentAsString());
          theaterList.put(theater.getTheaterId(), theater);
        }
        return theaterList;
    }

    public static ApplicationStatus.Position getTheaterCentroid(OracleDatabase db) throws OracleException,
                                                                                                 IOException {
        OracleCollection theaters = db.openCollection(Theater.COLLECTION_NAME);
        if (theaters != null) {
          OracleOperationBuilder theaterDocuments = theaters.find();
          OracleCursor theaterCursor = theaterDocuments.getCursor();
          double minLatitude = 360;
          double minLongitude = 360;
          double maxLatitude = -360;
          double maxLongitude = -360;
          while (theaterCursor.hasNext()) {
            OracleDocument doc = theaterCursor.next();
            Theater theater = gson.fromJson(doc.getContentAsString(), Theater.class);
            if ((theater.getLocation() != null) && (theater.getLocation().getGeoCoding() != null)) {
              double[] coordinates = theater.getLocation().getGeoCoding().getCoordinates();
              if (coordinates != null) {
                if (coordinates[0] < minLatitude) {
                  minLatitude = coordinates[0];
                }
                if (coordinates[0] > maxLatitude) {
                  maxLatitude = coordinates[0];
                }
                if (coordinates[1] < minLongitude) {
                  minLongitude = coordinates[1];
                }
                if (coordinates[1] > maxLongitude) {
                  maxLongitude = coordinates[1];
                }
              }
            }
          }
          theaterCursor.close();
          return new ApplicationStatus.Position(((minLatitude + maxLatitude) / 2),
                                                     ((minLongitude + maxLongitude) / 2));
        } 
        else {
          return new ApplicationStatus.Position(0.0,0.0);
        }
    }

    public static OracleDocument[] getTheatersByLocation(OracleDatabase db, double latitude, double longitude,
                                                         int distance) throws OracleException, IOException {
        TheatersByLocation qbeDefinition = new TheatersByLocation(latitude, longitude, distance);
        return searchCollection(db,COLLECTION_NAME,gson.toJson(qbeDefinition));
    }

    public static OracleDocument[] getTheaters(OracleDatabase db) throws OracleException, IOException {
        return getDocuments(db,COLLECTION_NAME,-1);
    }

    public static OracleDocument[] getTheaters(OracleDatabase db,int limit) throws OracleException, IOException {
        return getDocuments(db,COLLECTION_NAME,limit);
    }

    public static long getTheaterCount(OracleDatabase db) throws OracleException {
        return getDocumentCount(db,COLLECTION_NAME);
    }

    public static OracleDocument getTheater(OracleDatabase db, String key) throws OracleException, IOException {
        return getDocument(db,COLLECTION_NAME,key);
    }

    public static OracleDocument getTheaterById(OracleDatabase db, int id) throws OracleException {
        return getDocumentById(db,COLLECTION_NAME,id);
    }

    public static OracleDocument[] searchTheaters(OracleDatabase db, String qbeDefinition) throws OracleException,
                                                                                                  IOException {
        return searchCollection(db,COLLECTION_NAME,qbeDefinition);
    }

    public static void recreateTheaterCollection(OracleDatabase db,
                                       List<Theater> theaters) throws OracleException {

        // Create a collection with the name "THEATER" and store the documents
        List<OracleDocument> documents = Theater.toOracleDocumentList(db, theaters);
        recreateCollection(db,COLLECTION_NAME, documents);
        dropCollection(db,Screening.COLLECTION_NAME);
    }

    public static List<OracleDocument> bulkInsertTheaters(OracleDatabase db, SodaCollection[] documents) throws OracleException {
        return bulkInsert(db,COLLECTION_NAME,documents);
    }

    public static OracleDocument insertTheater(OracleDatabase db,Theater theater) throws OracleException {
       return insertDocument(db,COLLECTION_NAME,db.createDocumentFromString(gson.toJson(theater)));
    }

    public static boolean updateTheater(OracleDatabase db, String key, String version,
                                   OracleDocument newDocument) throws OracleException {
       return updateDocument(db,COLLECTION_NAME,key,version,newDocument);
    }
    
    public static void indexTheaterCollection(OracleDatabase db) throws OracleException {
        createIndexes(db,COLLECTION_NAME);
    }

    public static void createTheaterCollection(OracleDatabase db) throws OracleException {
        createCollection(db,COLLECTION_NAME);
    }

    public static void dropTheaterCollection(OracleDatabase db) throws OracleException {
        dropCollection(db,COLLECTION_NAME);
    }

    public static Theater fromJSON(String json) {
        return gson.fromJson(json, Theater.class);
    }

}
