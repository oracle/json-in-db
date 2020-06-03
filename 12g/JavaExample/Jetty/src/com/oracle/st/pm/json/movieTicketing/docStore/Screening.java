package com.oracle.st.pm.json.movieTicketing.docStore;


import java.io.IOException;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Calendar;
import java.util.Date;
import java.util.Iterator;
import java.util.List;

import oracle.soda.OracleDatabase;
import oracle.soda.OracleDocument;
import oracle.soda.OracleException;

public class Screening extends SodaCollection {

    public static final String COLLECTION_NAME = "Screening";

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

    public static Screening[] toScreenings(OracleDocument[] documentList) throws OracleException, IOException {
        ArrayList<OracleDocument> screeningList = new ArrayList<OracleDocument>(Arrays.asList(documentList));
        Screening[] screenings = new Screening[screeningList.size()];
        for (int i = 0; i < screenings.length; i++) {
            screenings[i] = Screening.fromJSON(screeningList.get(i).getContentAsString());
        }
        return screenings;
    }

    public static List<OracleDocument> toOracleDocumentList(OracleDatabase db,
                                                            List<Screening> screenings) throws OracleException {
        List<OracleDocument> documents = new ArrayList<OracleDocument>();

        Iterator<Screening> iScreenings = screenings.iterator();
        while (iScreenings.hasNext()) {
            Screening s = iScreenings.next();
            documents.add(db.createDocumentFromString(s.toJSON()));
        }

        return documents;
    }

    public static OracleDocument[] getScreenings(OracleDatabase db) throws OracleException, IOException {
        return getDocuments(db,COLLECTION_NAME,-1);
    }

    public static OracleDocument[] getScreenings(OracleDatabase db, int limit) throws OracleException, IOException {
        return getDocuments(db,COLLECTION_NAME,limit);
    }
    
    public static long getScreeningCount(OracleDatabase db) throws OracleException {
        return getDocumentCount(db,COLLECTION_NAME);
    }

    public static OracleDocument getScreening(OracleDatabase db, String key) throws OracleException, IOException {
        return getDocument(db,COLLECTION_NAME,key);
    }
    
    public static OracleDocument[] searchScreenings(OracleDatabase db, String qbeDefinition) throws OracleException,
                                                                                                  IOException {
        return searchCollection(db,COLLECTION_NAME,qbeDefinition);
    }
    
    public boolean updateScreening(OracleDatabase db, String key, String version,
                                   OracleDocument newDocument) throws OracleException {
       return updateDocument(db,COLLECTION_NAME,key,version,newDocument);
    }

    public static void recreateScreeningCollection(OracleDatabase db,
                                          List<Screening> screenings) throws OracleException {

        // Create a collection with the name "Screening" and store the documents
        List<OracleDocument> documents = toOracleDocumentList(db, screenings);
        recreateCollection(db,COLLECTION_NAME, documents);
    }

    public static Screening fromJSON(String json) {
        return gson.fromJson(json, Screening.class);
    }
}
