package com.oracle.st.pm.json.movieTicketing.utilitiy;

import com.google.gson.Gson;

import com.google.gson.GsonBuilder;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.IOException;

import java.sql.Connection;
import java.sql.SQLException;

import java.text.SimpleDateFormat;

import java.util.Date;

import java.util.Properties;

import oracle.jdbc.OracleConnection;
import oracle.jdbc.OracleDriver;
import oracle.jdbc.pool.OracleDataSource;

import oracle.soda.OracleDatabase;
import oracle.soda.OracleException;

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

        String driver = this.getDriver();
        if ((driver == null) ||(driver.length() ==0)) {
          throw new SQLException("Invalid driver specified in connection properties file.");
        }

        if (driver.equalsIgnoreCase(DBConnection.INTERNAL_DRIVER)) {
            // System.out.println("Attempting connection using \"" + driver + "\" driver." );
            OracleDriver ora = new OracleDriver();
            conn = (OracleConnection) ora.defaultConnection();
        } else {
            OracleDataSource ods = new OracleDataSource();

            String schema = this.getSchema();
            if ((schema == null) ||(schema.length() ==0)) {
              throw new SQLException("Invalid schema specified in connection properties file.");
            }

            String password = this.getPassword();
            if ((password == null) ||(password.length() ==0)) {
              throw new SQLException("Invalid password specified in connection properties file.");
            }

            String tnsnamesLocation = this.tnsAdmin;
            if ((tnsnamesLocation != null) && (tnsnamesLocation.length() > 0)) {
              System.setProperty("oracle.net.tns_admin", tnsnamesLocation);
            }
            if (System.getProperty("oracle.net.tns_admin") != null) {
              System.out.println(sdf.format(new Date()) + "[DBConnection.getDBConnection()]: Using connection information from TNSNAMES.ora located in \"" + System.getProperty("oracle.net.tns_admin") + "\"." );                
            }
            
            String tnsEntry = this.tnsEntry;
            if (tnsEntry != null) {
              // System.out.println(sdf.format(new Date()) + "[DBConnection.getDBConnection()]: Attempting connection to \"" + tnsEntry + "\" using \"" + driver + "\" driver as user \"" + schema +"\"." );         
              ods.setUser(schema);
              ods.setPassword(password);
              ods.setDriverType(driver);
              ods.setTNSEntryName(tnsEntry);
            }
            else {
              String dataSourceURL = this.getOracleDataSourceURL();
              System.out.println(sdf.format(new Date()) + "[DBConnection.getDBConnection()]: Attempting connection using \"" + dataSourceURL + "\"." );         
              ods.setURL(dataSourceURL);
            }
            conn = (OracleConnection) ods.getConnection();
        }
        return conn;
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
            File connectionProperties = new File(filename);
            // System.out.println(sdf.format(new Date()) + "[DBConnection.getDBConnection()]: Using connection properties file + \"" + connectionProperties.getAbsolutePath() + "\".");
            return gson.fromJson(new FileReader(connectionProperties), DBConnection.class);
        } catch (FileNotFoundException fnf) {
            return new DBConnection();
        }
    }

    public static OracleDatabase getOracleDatabase() throws SQLException, IOException, OracleException {
        DBConnection mgr = DBConnection.getDBConnection();
        Connection conn = mgr.createConnection();
        Properties props = new Properties(); 
        props.put("oracle.soda.sharedMetadataCache", "true");     
        props.put("oracle.soda.localMetadataCache", "true"); 
        OracleRDBMSClient cl = new OracleRDBMSClient(props); 
        // Get a database.
        return cl.getDatabase(conn);
    }
}
