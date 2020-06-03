package com.oracle.st.pm.json.movieTicketing.service;

import com.oracle.st.pm.json.movieTicketing.docStore.ApplicationStatus;
import com.oracle.st.pm.json.movieTicketing.docStore.SodaCollection;
import com.oracle.st.pm.json.movieTicketing.utilitiy.DataSources;

import java.io.IOException;

import java.sql.SQLException;

import java.text.SimpleDateFormat;

import java.util.Date;

import oracle.soda.OracleDatabase;
import oracle.soda.OracleException;


public class ApplicationStatusService {

    private static final SimpleDateFormat sdf = new SimpleDateFormat(SodaCollection.ISO_DATE_FORMAT);
    private static final DataSources dataSources = DataSources.loadDataSources();

    public ApplicationStatusService() {
        super();
    }
    
    public static String getApplicationStatus(OracleDatabase db) throws OracleException, IOException, SQLException {
        System.out.println(sdf.format(new Date()) + "[ApplicationStatusService.getApplicationStatus()]: Started.");
        ApplicationStatus status = new ApplicationStatus(db);
        db.admin().getConnection().close();
        System.out.println(sdf.format(new Date()) + "[ApplicationStatusService.getApplicationStatus()]: Completed.");
        return status.toJson();                                                                   
    }

    public static void updateDataSources(String updates) throws IOException {
        System.out.println(sdf.format(new Date()) + "[ApplicationStatusService.updateDataSources()]: Started.");
        dataSources.updateDataSources(updates);
        System.out.println(sdf.format(new Date()) + "[ApplicationStatusService.updateDataSources()]: Completed.");
    }

}
