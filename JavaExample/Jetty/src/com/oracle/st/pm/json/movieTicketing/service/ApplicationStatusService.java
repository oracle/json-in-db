package com.oracle.st.pm.json.movieTicketing.service;

import com.oracle.st.pm.json.movieTicketing.docStore.ApplicationStatus;
import com.oracle.st.pm.json.movieTicketing.utilitiy.CollectionManager;
import com.oracle.st.pm.json.movieTicketing.utilitiy.DataSources;

import java.io.IOException;

import java.text.SimpleDateFormat;

import java.util.Date;

import oracle.soda.OracleException;


public class ApplicationStatusService {

    private static final SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssZ");
    private static final DataSources dataSources = DataSources.loadDataSources();

    public ApplicationStatusService() {
        super();
    }
    
    public static String getApplicationStatus(CollectionManager collectionManager) throws OracleException, IOException {
        System.out.println(sdf.format(new Date()) + "[ApplicationStatusService.getApplicationStatus()]: Started.");
        ApplicationStatus status = new ApplicationStatus(collectionManager);
        System.out.println(sdf.format(new Date()) + "[ApplicationStatusService.getApplicationStatus()]: Completed.");
        return status.toJson();                                                                   
    }

    public static void updateDataSources(String updates) throws IOException {
        System.out.println(sdf.format(new Date()) + "[ApplicationStatusService.updateDataSources()]: Started.");
        dataSources.updateDataSources(updates);
        System.out.println(sdf.format(new Date()) + "[ApplicationStatusService.updateDataSources()]: Completed.");
    }

}
