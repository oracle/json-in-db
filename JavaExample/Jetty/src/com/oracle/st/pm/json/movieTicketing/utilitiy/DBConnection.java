package com.oracle.st.pm.json.movieTicketing.utilitiy;

import com.google.gson.Gson;

import com.google.gson.GsonBuilder;

import com.oracle.st.pm.json.movieTicketing.docStore.Theater;

import com.oracle.st.pm.json.movieTicketing.service.ApplicationStatusService;

import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.IOException;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

import java.text.SimpleDateFormat;

import java.util.Date;
import java.util.UUID;

import oracle.jdbc.OracleConnection;
import oracle.jdbc.OracleDriver;
import oracle.jdbc.pool.OracleDataSource;

import oracle.soda.OracleCollection;
import oracle.soda.OracleDatabase;
import oracle.soda.OracleDocument;
import oracle.soda.OracleException;
import oracle.soda.OracleOperationBuilder;

import oracle.json.parser.QueryException;

import oracle.soda.rdbms.OracleRDBMSClient;


public class DBConnection {

    public static final boolean DEBUG = false;

    public static final String THIN_DRIVER = "thin";
    public static final String OCI_DRIVER = "oci8";
    public static final String INTERNAL_DRIVER = "KPRB";

    public static final String DEFAULT_DRIVER = OCI_DRIVER;
    public static final String DEFAULT_HOSTNAME = "localhost";
    public static final String DEFAULT_PORT = "1521";
    public static final String DEFAULT_SERVERMODE = "DEDICATED";

    public static final String DEFAULT_CONNECTION_DEFINITION = "connectionProperties.json";

    private String driver = "thin";
    private String sid = null;
    private String hostname = "localhost";
    private String port = "1521";
    private String serviceName = null;
    private String serverMode = null;
    private String tnsEntry = "ORCL";
    private String oracleHome = null;
    private String schema = "SCOTT";
    private String password = "oracle";

    // protected PoolDataSource pds;

    private static final Gson gson = new GsonBuilder().setDateFormat("yyyy-MM-dd'T'HH:mm:ssZ").create();
    private static final SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssZ");

    public DBConnection() {
        super();
    }

    protected String getDriver() {
        if (this.driver != null) {
            return this.driver;
        } else {
            return DBConnection.DEFAULT_DRIVER;
        }
    }

    protected String getHostname() {
        if (this.hostname != null) {
            return this.hostname;
        } else {
            return DBConnection.DEFAULT_HOSTNAME;
        }
    }

    protected String getPort() {
        if (this.port != null) {
            return this.port;
        } else {
            return DBConnection.DEFAULT_PORT;
        }
    }

    protected String getServerMode() {
        if (this.serverMode != null) {
            return this.serverMode;
        } else {
            return DBConnection.DEFAULT_SERVERMODE;
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

    protected String getDatabaseURL() {
        if (this.getDriver().equalsIgnoreCase(DBConnection.THIN_DRIVER)) {
            return "jdbc:oracle:thin:@//" + this.getHostname() + ":" + this.getPort() + "/" + this.getServiceName();
        } else {
            return "jdbc:oracle:oci8:@(description=(address=(host=" + this.getHostname() + ")(protocol=tcp)(port=" +
                   this.getPort() + "))(connect_data=(service_name=" + this.getServiceName() + ")(server=" +
                   this.getServerMode() + ")))";
        }
    }

    protected String getOracleDataSourceURL()
    {
        // System.out.println("getDatabaseURL() : Driver = " + this.settings.getDriver());
        if( this.getDriver() != null) {
          if( this.getDriver().equalsIgnoreCase( DBConnection.THIN_DRIVER ) ) {
              return this.getHostname() + ":" + this.getPort() + "/" + this.getServiceName();
          }
          else {
              return "(description=(address=(host=" + this.getHostname() + ")(protocol=tcp)(port=" + this.getPort() + "))(connect_data=(service_name=" + this.getServiceName() + ")(server=" + this.getServerMode() + ")))";
          }
        }
        else {
          return null;
        }
    }   

    public OracleConnection createConnection() throws SQLException, IOException {
        OracleConnection conn = null;

        if (this.getDriver().equalsIgnoreCase(DBConnection.INTERNAL_DRIVER)) {
            OracleDriver ora = new OracleDriver();
            conn = (OracleConnection) ora.defaultConnection();
        } else {
            OracleDataSource ods = new OracleDataSource();
            ods.setUser(this.getSchema());
            ods.setPassword(this.getPassword());
            ods.setDriverType(this.getDriver());
            
            String TNSEntry = this.getTNSEntry();
            if (TNSEntry != null) {
              if (this.getDriver().equalsIgnoreCase("thin")) {
                System.setProperty("oracle.net.tns_admin", this.oracleHome);
              }
              ods.setTNSEntryName(TNSEntry);
            }
            else {
              ods.setURL(this.getOracleDataSourceURL());
            }
            conn = (OracleConnection) ods.getConnection();
        }
        return conn;
    }

    public OracleConnection createConnection1() throws SQLException, IOException {
        OracleDataSource ds;
        ds = new OracleDataSource();
        ds.setURL(getDatabaseURL());
        return (OracleConnection) ds.getConnection(this.getSchema(), this.getPassword());
    }

    public static void main(String[] args) {
        DBConnection conn = new DBConnection();
        // System.out.println(gson.toJson(conn));
    }

    public static DBConnection getDBConnection() {
        try {
            String filename =
                System.getProperty("com.oracle.st.xmldb.pm.ConnectionParameters",
                                   DBConnection.DEFAULT_CONNECTION_DEFINITION);
            return gson.fromJson(new FileReader(filename), DBConnection.class);
        } catch (FileNotFoundException fnf) {
            return new DBConnection();
        }
    }

    public static OracleDatabase getOracleDatabase() throws SQLException, IOException, OracleException {
        DBConnection mgr = DBConnection.getDBConnection();
        Connection conn = mgr.createConnection();
        OracleRDBMSClient cl = new OracleRDBMSClient();
        // Get a database.
        return cl.getDatabase(conn);
    }
}
