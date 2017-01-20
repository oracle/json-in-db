package com.oracle.st.pm.json.movieTicketing.test;

import com.oracle.st.pm.json.movieTicketing.service.ApplicationStatusService;
import com.oracle.st.pm.json.movieTicketing.utilitiy.CollectionManager;
import com.oracle.st.pm.json.movieTicketing.utilitiy.DBConnection;

public class getApplicationStatus {

    public getApplicationStatus() {
        super();
    }

    public static void main(String[] args) {
        try {
            CollectionManager collectionManager = new CollectionManager();
            collectionManager.setDatabase(DBConnection.getOracleDatabase());
            System.out.println(ApplicationStatusService.getApplicationStatus(collectionManager));
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

}
