package com.oracle.st.pm.json.movieTicketing.utilitiy;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import com.oracle.st.pm.json.movieTicketing.docStore.SodaCollection;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileReader;

public class ConnectionProperties {

    public static final String DEFAULT_CONNECTION_DEFINITION = "connectionProperties.json";

    private static final Gson gson = new GsonBuilder().setDateFormat(SodaCollection.ISO_DATE_FORMAT).create();

    public static final String THIN_DRIVER = "thin";
    public static final String OCI_DRIVER = "oci8";
    public static final String INTERNAL_DRIVER = "KPRB";

    public static final String DEFAULT_DRIVER = OCI_DRIVER;
    public static final String DEFAULT_HOSTNAME = "localhost";
    public static final String DEFAULT_PORT = "1521";
    public static final String DEFAULT_SERVERMODE = "DEDICATED";
    
    private String schema = "SCOTT";
    private String password = "oracle";

    private String tnsAdmin = null;
    private String tnsEntry = "ORCL";

    private String driver = "thin";
    private String sid = null;
    private String hostname = "localhost";
    private String port = "1521";
    private String serviceName = "orcl";
    private String serverMode = "dedicated";
    
    public ConnectionProperties() {
        super();
    }
    protected String getDriver() {
        if (this.driver != null) {
            return this.driver;
        } else {
            return ConnectionProperties.DEFAULT_DRIVER;
        }
    }

    protected String getHostname() {
        if (this.hostname != null) {
            return this.hostname;
        } else {
            return ConnectionProperties.DEFAULT_HOSTNAME;
        }
    }

    protected String getPort() {
        if (this.port != null) {
            return this.port;
        } else {
            return ConnectionProperties.DEFAULT_PORT;
        }
    }

    protected String getServerMode() {
        if (this.serverMode != null) {
            return this.serverMode;
        } else {
            return ConnectionProperties.DEFAULT_SERVERMODE;
        }
    }

    protected String getServiceName() {
        return this.serviceName;
    }

    protected String getSID() {
        return this.sid;
    }
    
    protected String getTNSEntry() {
        return this.tnsEntry;
    }

    protected String getSchema() {
        return this.schema;
    }

    protected String getPassword() {
        return this.password;
    }

    protected String getTNSAdmin() {
        return this.tnsAdmin;
    }

    public static ConnectionProperties getConnectionProperties() {
        try {
            String filename =
                System.getProperty("com.oracle.st.xmldb.pm.ConnectionParameters",
                                   ConnectionProperties.DEFAULT_CONNECTION_DEFINITION);
            File connectionProperties = new File(filename);
            // System.out.println(sdf.format(new Date()) + "[ConnectionProperties.getConnectionProperties()]: Using connection properties file + \"" + connectionProperties.getAbsolutePath() + "\".");
            return gson.fromJson(new FileReader(connectionProperties), ConnectionProperties.class);
        } catch (FileNotFoundException fnf) {
            return new ConnectionProperties();
        }
    }

}
