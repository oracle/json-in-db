package com.oracle.st.pm.json.movieTicketing.test;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import com.oracle.st.pm.json.movieTicketing.docStore.SodaCollection;
import com.oracle.st.pm.json.movieTicketing.service.BookingService;
import com.oracle.st.pm.json.movieTicketing.utilitiy.DBConnection;

public class makeBooking {

    private static Gson gson = new GsonBuilder().setDateFormat(SodaCollection.ISO_DATE_FORMAT).create();

    public makeBooking() {
        super();
    }

    public static void main(String[] args) {
        try {
            String booking = "{\"key\":\"XXXXXXXXXXXXXXXXXXX\",\"customerId\":1,\"adult\":2,\"child\":2,\"senior\":0}";
            System.out.println(BookingService.bookTickets( DBConnection.getOracleDatabase(), booking));
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

}
