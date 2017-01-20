package com.oracle.st.pm.json.movieTicketing.docStore;


import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import com.oracle.st.pm.json.movieTicketing.service.ScreeningService;
import com.oracle.st.pm.json.movieTicketing.utilitiy.CollectionManager;

import java.io.IOException;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;

import java.util.Iterator;
import java.util.List;

import oracle.soda.OracleCollection;
import oracle.soda.OracleDatabase;
import oracle.soda.OracleDocument;
import oracle.soda.OracleException;
import oracle.soda.OracleOperationBuilder;

public class Screening {

    public static final String COLLECTION_NAME = "Screening";
    private static final Gson gson = new GsonBuilder().setDateFormat("yyyy-MM-dd'T'HH:mm:ssZ").create();
    // private static CollectionManager collectionManager = new CollectionManager();


    private int theaterId;
    private int movieId;
    private int screenId;
    private Date startTime;
    private Theater.Screen.TicketPricing ticketPricing;
    private int seatsRemaining;
    private Theater.Screen.SeatMap seatMap;

    public Screening(int theaterId, int movieId, int screenId, Calendar startTime, Theater.Screen screen) {
        super();
        this.theaterId = theaterId;
        this.screenId = screenId;
        this.startTime = startTime.getTime();
        this.movieId = movieId;
        this.seatsRemaining = screen.getCapacity();
        this.ticketPricing = screen.getTicketPricing();
        this.seatMap = screen.getSeatMap();
    }

    public int getMovieId() {
        return this.movieId;
    }

    public int getTheaterId() {
        return this.theaterId;
    }

    public int getScreenId() {
        return this.screenId;
    }

    public Date getStartTime() {
        return this.startTime;
    }

    public int getSeatsRemaining() {
        return this.seatsRemaining;
    }

    public Theater.Screen.SeatMap getSeatMap() {
        return this.seatMap;
    }

    public boolean recordTicketSale(int tickets) {
        if (this.seatsRemaining > tickets) {
            this.seatsRemaining = this.seatsRemaining - tickets;
            return true;
        } else {
            return false;
        }
    }

    public Theater.Screen.TicketPricing getTicketPricing() {
        return this.ticketPricing;
    }

    public static List<OracleDocument> toOracleDocumentList(OracleDatabase db,
                                                            List<Screening> screenings) throws OracleException {
        List<OracleDocument> documents = new ArrayList<OracleDocument>();

        Iterator<Screening> iScreenings = screenings.iterator();
        while (iScreenings.hasNext()) {
            Screening s = iScreenings.next();
            documents.add(db.createDocumentFromString(s.toJson()));
        }

        return documents;
    }

    public static long getScreeningCount(OracleDatabase db) throws OracleException {
        OracleCollection screenings = db.openCollection(COLLECTION_NAME);
        if (screenings != null) {
            OracleOperationBuilder screeningDocuments = screenings.find();
            return screeningDocuments.count();
        }
        else {
            return 0;
        }
    }

    public static OracleDocument getScreening(OracleDatabase db, String key) throws OracleException, IOException {
        OracleCollection screenings = db.openCollection(Screening.COLLECTION_NAME);
        OracleDocument screening = screenings.findOne(key);
        return screening;
    }

    public boolean updateScreening(OracleDatabase db, String key, String version,
                                   OracleDocument newDocument) throws OracleException {
        OracleCollection screenings = db.openCollection(Screening.COLLECTION_NAME);
        OracleOperationBuilder operation = screenings.find().key(key).version(version);
        return operation.replaceOne(newDocument);
    }

    public static void saveScreenings(CollectionManager collectionManager,
                                      List<Screening> screenings) throws OracleException {

        // Create a collection with the name "Screening" and store the documents
        List<OracleDocument> documents = Screening.toOracleDocumentList(collectionManager.getDatabase(), screenings);
        OracleCollection col = collectionManager.recreateCollection(Screening.COLLECTION_NAME);
        col.insert(documents.iterator());

    }

    public static Screening fromJson(String json) {
        return gson.fromJson(json, Screening.class);
    }

    public String toJson() {
        return gson.toJson(this);
    }
}
