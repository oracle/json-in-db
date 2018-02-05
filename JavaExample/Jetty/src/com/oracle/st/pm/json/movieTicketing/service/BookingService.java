package com.oracle.st.pm.json.movieTicketing.service;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import com.oracle.st.pm.json.movieTicketing.docStore.SodaCollection;
import com.oracle.st.pm.json.movieTicketing.docStore.TicketSale;

import java.io.IOException;

import java.sql.SQLException;

import java.text.ParseException;
import java.text.SimpleDateFormat;

import java.util.Date;

import oracle.soda.OracleDatabase;
import oracle.soda.OracleException;

public class BookingService {

    private static final SimpleDateFormat sdf = new SimpleDateFormat(SodaCollection.ISO_DATE_FORMAT);
    private static Gson gson = new GsonBuilder().setDateFormat(SodaCollection.ISO_DATE_FORMAT).create();

    public BookingService() {
        super();
    }


    public static String bookTickets(OracleDatabase db, String booking) throws OracleException, SQLException,
                                                                               IOException, ParseException {

        System.out.println(sdf.format(new Date()) + "[BookingService.bookTickets()]: Started.");
        TicketSale ticketSale = gson.fromJson(booking, TicketSale.class);
        String result = ticketSale.recordSale(db);
        db.admin().getConnection().close();
        System.out.println(sdf.format(new Date()) + "[BookingService.bookTickets()]: Completed.");
        return result;
    }
}
