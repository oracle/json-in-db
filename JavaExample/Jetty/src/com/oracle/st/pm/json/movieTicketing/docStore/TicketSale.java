package com.oracle.st.pm.json.movieTicketing.docStore;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import java.io.IOException;

import java.util.Date;

import oracle.soda.OracleCollection;
import oracle.soda.OracleDatabase;
import oracle.soda.OracleDocument;
import oracle.soda.OracleException;

public class TicketSale {

    public static final String COLLECTION_NAME = "TicketSale";
    private static final Gson gson = new GsonBuilder().setDateFormat("yyyy-MM-dd'T'HH:mm:ssZ").create();

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

    public String recordSale(OracleDatabase db) throws OracleException, IOException {

        OracleDocument doc = Screening.getScreening(db, this.key);
        this.key = null;

        Screening screening = gson.fromJson(doc.getContentAsString(), Screening.class);
        addScreeningDetails(screening);

        int seats = this.adult + this.child + this.adult;
        boolean booked = false;

        while (!booked) {
            if (!screening.recordTicketSale(seats)) {
                return "{\"status\":\"SoldOut\"}";
            }
            OracleDocument updatedDoc = db.createDocumentFromString(gson.toJson(screening));
            booked = screening.updateScreening(db, doc.getKey(), doc.getVersion(), updatedDoc);
            if (!booked) {
                // Document updated by another session. Reload and try again.
                doc = Screening.getScreening(db, this.key);
                screening = gson.fromJson(doc.getContentAsString(), Screening.class);
            }
        }

        OracleCollection col = db.admin().createCollection(TicketSale.COLLECTION_NAME);
        col.insert(db.createDocumentFromString(gson.toJson(this)));
        return "{\"status\":\"Booked\"}";
    }

    public TicketSale() {
    }

    public static TicketSale fromJson(String json) {
        return gson.fromJson(json, TicketSale.class);
    }

    public String toJSON() {
        return gson.toJson(this);
    }
}
