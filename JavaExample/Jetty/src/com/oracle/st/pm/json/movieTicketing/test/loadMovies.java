package com.oracle.st.pm.json.movieTicketing.test;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import com.oracle.st.pm.json.movieTicketing.docStore.Movie;
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


public class loadMovies {
    
    
    protected static final Gson gson = new GsonBuilder().setDateFormat(SodaCollection.ISO_DATE_FORMAT).create();

    public loadMovies() {
        super();
    }
    
    public static void loadMovies(String target) throws OracleException, SQLException, IOException {
        OracleDatabase db = DBConnection.getOracleDatabase();
        
        Movie.dropMovieCollection(db);
        Movie.createMovieCollection(db);
        
        File dir = new File(target + ".\\moviesByYear");
        File[] moviesByYear = dir.listFiles();

        for (File file : moviesByYear) {
	   System.out.println(file.getAbsolutePath());
           Movie[] movies = gson.fromJson(new FileReader(file), Movie[].class);
           List<OracleDocument> docs = Movie.bulkInsertMovies(db,movies);
        }
        Movie.indexMovieCollection(db);
     }
        
    public static void main(String[] args) {
        try {
          loadMovies("g:\\Node-8\\NodeExample\\node_modules\\oracle-movie-ticket-demo\\emulation");
        } catch (Exception e) {
          e.printStackTrace();
        }
    }
}
