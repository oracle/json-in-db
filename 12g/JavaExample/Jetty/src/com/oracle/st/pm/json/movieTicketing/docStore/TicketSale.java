package com.oracle.st.pm.json.movieTicketing.docStore;

import java.io.IOException;

import java.util.Date;

import oracle.soda.OracleDatabase;
import oracle.soda.OracleDocument;
import oracle.soda.OracleException;

public class TicketSale extends SodaCollection{

    public static final String COLLECTION_NAME = "TicketSale";

    private String key;
    private int customerId;
    public int adult;
    public int senior;
    public int child;
    private float adultPrice;
    private float childPrice;
    private float seniorPrice;
    private Date purchaseDate;

    private int theaterId;
    private int screenId;
    private int movieId;
    private Date startTime;

    public void addScreeningDetails(Screening screening) throws OracleException, IOException {
        this.adultPrice = screening.getTicketPricing().getAdultPrice();
        this.seniorPrice = screening.getTicketPricing().getSeniorPrice();
        this.childPrice = screening.getTicketPricing().getChildPrice();
        this.startTime = screening.getStartTime();
        this.theaterId = screening.getTheaterId();
        this.screenId = screening.getScreenId();
        this.movieId = screening.getMovieId();
        this.purchaseDate = new Date();
    }
    
    public void insertTicketSale(OracleDatabase db) throws OracleException {
      insertDocument(db,COLLECTION_NAME,this);
    }

    public String recordSale(OracleDatabase db) throws OracleException, IOException {

        OracleDocument doc = Screening.getScreening(db, this.key);
        this.key = null;
        // System.out.println("Before Image: " + doc.getContentAsString());
        Screening screening = Screening.fromJSON(doc.getContentAsString());
        addScreeningDetails(screening);

        int seats = this.adult + this.child + this.adult;
        boolean booked = false;

        while (!booked) {
            if (!screening.recordTicketSale(seats)) {
                return "{\"status\":\"SoldOut\"}";
            }
            OracleDocument updatedDoc = db.createDocumentFromString(gson.toJson(screening));
            // System.out.println("After Image: " + updatedDoc.getContentAsString());
            booked = screening.updateScreening(db, doc.getKey(), doc.getVersion(), updatedDoc);
            if (!booked) {
                // Document updated by another session. Reload and try again.
                doc = Screening.getScreening(db, this.key);
                screening = Screening.fromJSON(doc.getContentAsString());
            }
        }

        insertTicketSale(db);
        return "{\"status\" : \"Booked\",\"message\" : \"Please enjoy your movie.\"}";
    }

    public TicketSale() {
    }

    public static TicketSale fromJson(String json) {
        return gson.fromJson(json, TicketSale.class);
    }

}
