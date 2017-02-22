package com.oracle.st.pm.json.movieTicketing.utilitiy;

import com.google.gson.Gson;

import com.google.gson.GsonBuilder;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.IOException;

import java.sql.Connection;
import java.sql.SQLException;

import java.sql.SQLSyntaxErrorException;

import java.text.SimpleDateFormat;

import java.util.Date;

import java.util.Properties;

import java.util.UUID;

import javax.naming.Context;

import javax.naming.InitialContext;

import javax.naming.NamingException;

import oracle.jdbc.OracleConnection;
import oracle.jdbc.OracleDriver;
import oracle.jdbc.pool.OracleDataSource;

import oracle.json.parser.QueryException;

import oracle.soda.OracleCollection;
import oracle.soda.OracleDatabase;
import oracle.soda.OracleDocument;
import oracle.soda.OracleException;

import oracle.soda.OracleOperationBuilder;
import oracle.soda.rdbms.OracleRDBMSClient;

import oracle.ucp.jdbc.PoolDataSourceFactory;
import oracle.ucp.jdbc.PoolDataSource;


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
    public static final PoolDataSource pds = PoolDataSourceFactory.getPoolDataSource();
    private static boolean useConnectionPool = false;

    private static Properties sodaProps = new Properties(); 
    private static Properties movieProps = new Properties(); 
    
    static {
      sodaProps.put("oracle.soda.sharedMetadataCache", "true");     
      sodaProps.put("oracle.soda.localMetadataCache", "true"); 
    }           
    
    private static OracleRDBMSClient client = new OracleRDBMSClient(sodaProps);   

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

    public static void initializeConnectionPool() throws OracleException, SQLException, IOException {

       pds.setConnectionFactoryClassName("oracle.jdbc.pool.OracleDataSource");
       DBConnection mgr = DBConnection.getConnectionProperties();
       useConnectionPool = true;
       
       String schema = mgr.getSchema();
       if ((schema == null) ||(schema.length() ==0)) {
         throw new SQLException("Invalid schema specified in connection properties file.");
       }

       String password = mgr.getPassword();
       if ((password == null) ||(password.length() ==0)) {
         throw new SQLException("Invalid password specified in connection properties file.");
       }

       String tnsnamesLocation = mgr.tnsAdmin;
       if ((tnsnamesLocation != null) && (tnsnamesLocation.length() > 0)) {
         System.setProperty("oracle.net.tns_admin", tnsnamesLocation);
       }
       
       if (System.getProperty("oracle.net.tns_admin") != null) {
         // System.out.println(sdf.format(new Date()) + "[DBConnection.initializeConnectionPool()]: Using connection information from TNSNAMES.ora located in \"" + System.getProperty("oracle.net.tns_admin") + "\"." );                
       }
                
       String tnsEntry = mgr.tnsEntry;
       if (tnsEntry != null) {
         // System.out.println(sdf.format(new Date()) + "[DBConnection.initializeConnectionPool()]: Attempting connection to \"" + tnsEntry + "\" using \"" + mgr.getDriver() + "\" driver as user \"" + schema +"\"." );         
         pds.setUser(schema);
         pds.setPassword(password);
         pds.setURL("jdbc:oracle:thin:@" + tnsEntry);
       }
       else {
         // System.out.println(sdf.format(new Date()) + "[DBConnection.initializeConnectionPool()]: Attempting connection using \"" + dataSourceURL + "\"." );         
         String dataSourceURL = mgr.getOracleDataSourceURL();
         pds.setURL(dataSourceURL);
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
              System.out.println(sdf.format(new Date()) + "[DBConnection.createConnection()]: Using connection information from TNSNAMES.ora located in \"" + System.getProperty("oracle.net.tns_admin") + "\"." );                
            }
            
            String tnsEntry = this.tnsEntry;
            if (tnsEntry != null) {
              System.out.println(sdf.format(new Date()) + "[DBConnection.createConnection()]: Attempting connection to \"" + tnsEntry + "\" using \"" + driver + "\" driver as user \"" + schema +"\"." );         
              ods.setUser(schema);
              ods.setPassword(password);
              ods.setDriverType(driver);
              ods.setTNSEntryName(tnsEntry);
            }
            else {
              String dataSourceURL = this.getOracleDataSourceURL();
              System.out.println(sdf.format(new Date()) + "[DBConnection.createConnection()]: Attempting connection using \"" + dataSourceURL + "\"." );         
              ods.setURL(dataSourceURL);
            }
            conn = (OracleConnection) ods.getConnection();
        }
        
        return conn;
    }

    public static DBConnection getConnectionProperties() {
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
        
        Connection conn = null;
        
        if (useConnectionPool) {
          conn = pds.getConnection();
          // System.out.println(sdf.format(new Date()) + "[DBConnection.getOracleDatabase()]: Returned pooled database connection.");
        }
        else {
          // System.out.println(sdf.format(new Date()) + "[DBConnection.getOracleDatabase()]: Creating non-pooled database connection.");
          DBConnection mgr = getConnectionProperties();
          conn = mgr.createConnection();
        }

        // Get a database.
        OracleDatabase db = client.getDatabase(conn);
        if (movieProps.isEmpty()) {
          doFeatureDetection(db);
        }
        return db;
    }
    
    public static boolean isNearSupported() {
        return Boolean.getBoolean((String) movieProps.get("com.oracle.st.pm.json.movieTicketing.nearSupported"));
    }

    public static boolean isContainsSupported() {
        return Boolean.getBoolean((String) movieProps.get("com.oracle.st.pm.json.movieTicketing.containsSupported"));
    }

    public static boolean isNullOnEmptySupported() {
        return Boolean.getBoolean((String) movieProps.get("com.oracle.st.pm.json.movieTicketing.nullOnEmptySupported"));
    }

    public static void supportsNear(boolean state) {
        movieProps.put("com.oracle.st.pm.json.movieTicketing.nearSupported",Boolean.toString(state));
    }

    public static void supportsContains(boolean state) {
        movieProps.put("com.oracle.st.pm.json.movieTicketing.containsSupported",Boolean.toString(state));
    }

    public static void supportsNullOnEmpty(boolean state) {
        movieProps.put("com.oracle.st.pm.json.movieTicketing.nullOnEmptySupported",Boolean.toString(state));
    }
    
    public static void doFeatureDetection(OracleDatabase db) throws OracleException {

       movieProps.put("com.oracle.st.pm.json.movieTicketing.nearSupported", "true");
       movieProps.put("com.oracle.st.pm.json.movieTicketing.containsSupported", "true");
       movieProps.put("com.oracle.st.pm.json.movieTicketing.nullOnEmptySupported", "true");

       String collectionName = "TMP-" + UUID.randomUUID();
       OracleCollection col = CollectionManager.recreateCollection(db,collectionName);
        
       /*
       ** Test for $CONTAINS support
       */

        String qbeDefinition = "{\"id\" : {\"$contains\" : \"XXX\"}}";
        OracleDocument qbe = db.createDocumentFromString(qbeDefinition);
        try {
            OracleOperationBuilder docs = col.find().filter(qbe);
            long theaterCount = docs.count();
        } catch (OracleException e) {
          Throwable cause = e.getCause();
          if ((cause instanceof QueryException) && (cause.getMessage().equalsIgnoreCase("The field name $contains is not a recognized operator."))) {
            DBConnection.supportsContains(false);
          } 
          else {
            if (cause instanceof SQLException) {
              if (((SQLException) cause).getErrorCode() != 40467) {
                throw e;                                         
              }
            }
            else {
              throw e;
            }
          }
        }

        /*
        ** Test for $NEAR support and spatial indexes.
        */

        qbeDefinition = "{ \"geoCoding\" : { \"$near\" : { \"$geometry\"      : { \"type\" : \"Point\", \"coordinates\" : [-122.12469369777311,37.895215209615884]}, \"$distance\" : 5, \"$unit\" : \"mile\"}}}";

        qbe = db.createDocumentFromString(qbeDefinition);
        try {
            OracleOperationBuilder docs = col.find().filter(qbe);
            long theaterCount = docs.count();
        } catch (OracleException e) {
          Throwable cause = e.getCause();
          if ((cause instanceof QueryException) &&  (cause.getMessage().equalsIgnoreCase("The field name $near is not a recognized operator."))) {
            DBConnection.supportsNear(false);
          } 
          else {
            if (cause instanceof SQLSyntaxErrorException) {
              if (((SQLException) cause).getErrorCode()== 904) {
                DBConnection.supportsNear(false);
              }
              else {
                throw e;                                         
              }
            }
            else {
              throw e;
            }
          }
        }

        /*
        ** Test for 'singleton' support in index creation
        */

        String indexDefinition =
            "{\"name\" : \"TEST_IDX\", \"unique\" : true, \"fields\" : [{\"path\" : \"id\", \"datatype\" : \"number\", \"order\" : \"asc\"}]}";
        OracleDocument indexSpecification = db.createDocumentFromString(indexDefinition);

        try {
            col.admin().createIndex(indexSpecification);
        } catch (OracleException e) {
          Throwable cause = e.getCause();
          if (cause instanceof SQLSyntaxErrorException) {
            if (((SQLException) cause).getErrorCode()== 907) {
              DBConnection.supportsNullOnEmpty(false);
            }
            else {
              throw e;                                         
            }
          }
        }

        col.admin().drop();

        System.out.println(sdf.format(new Date()) + " doFeatureDetection: $contains operator supported:  " + isContainsSupported());
        System.out.println(sdf.format(new Date()) + " doFeatureDetection: $near operatator   supported:  " + isNearSupported());
        System.out.println(sdf.format(new Date()) + " doFeatureDetection: \"NULL ON EMPTY\"    supported:  " + isNullOnEmptySupported());

    }
}
