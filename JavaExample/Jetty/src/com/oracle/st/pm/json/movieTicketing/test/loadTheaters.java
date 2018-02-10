package com.oracle.st.pm.json.movieTicketing.test;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import com.oracle.st.pm.json.movieTicketing.docStore.SodaCollection;
import com.oracle.st.pm.json.movieTicketing.docStore.Theater;
import com.oracle.st.pm.json.movieTicketing.utilitiy.DBConnection;

import java.io.File;
import java.io.FileReader;
import java.io.IOException;

import java.sql.SQLException;

import java.util.List;

import oracle.soda.OracleDatabase;
import oracle.soda.OracleDocument;
import oracle.soda.OracleException;


public class loadTheaters {
    
    
    protected static final Gson gson = new GsonBuilder().setDateFormat(SodaCollection.ISO_DATE_FORMAT).create();

    public loadTheaters() {
        super();
    }
    
    public static void loadTheaters(String target) throws OracleException, SQLException, IOException {
        OracleDatabase db = DBConnection.getOracleDatabase();
        
        Theater.dropTheaterCollection(db);
        Theater.createTheaterCollection(db);
        Theater.indexTheaterCollection(db);
        
        File dir = new File(target + "\\theatersByZip");
        File[] moviesByYear = dir.listFiles();

        for (File file : moviesByYear) {
	   System.out.println(file.getAbsolutePath());
           Theater[] theaters = gson.fromJson(new FileReader(file), Theater[].class);
           System.out.println(gson.toJson(theaters[0]));
           List<OracleDocument> docs = Theater.bulkInsertTheaters(db,theaters);
           break;
           // for (int i=0; i<theaters.length;i++) { 
           //   Theater.insertTheater(db,theaters[i]);
           // }
        }
        // Theater.indexTheaterCollection(db);
     }
        
    public static void main(String[] args) {
        try {
          loadTheaters("g:\\Node-8\\NodeExample\\node_modules\\oracle-movie-ticket-demo\\emulation");
        } catch (Exception e) {
          e.printStackTrace();
        }
    }
}
