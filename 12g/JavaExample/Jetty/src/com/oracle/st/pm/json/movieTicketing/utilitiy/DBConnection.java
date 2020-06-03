package com.oracle.st.pm.json.movieTicketing.utilitiy;

import com.oracle.st.pm.json.movieTicketing.docStore.SodaCollection;
import com.oracle.st.pm.json.movieTicketing.docStore.TemporaryCollection;

import java.io.IOException;

import java.sql.SQLException;
import java.sql.SQLSyntaxErrorException;

import java.text.SimpleDateFormat;

import java.util.Date;
import java.util.Properties;
import java.util.UUID;

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

import oracle.ucp.jdbc.PoolDataSource;
import oracle.ucp.jdbc.PoolDataSourceFactory;


public class DBConnection {

    public static final boolean DEBUG = false;

    private static final SimpleDateFormat sdf = new SimpleDateFormat(SodaCollection.ISO_DATE_FORMAT);
    private static final PoolDataSource pds = PoolDataSourceFactory.getPoolDataSource();
    private static final ConnectionProperties connectionProps = ConnectionProperties.getConnectionProperties();
    private static final Properties sodaProps = new Properties(); 
    private static final Properties movieProps = new Properties(); 
    
    static {
      sodaProps.put("oracle.soda.sharedMetadataCache", "true");     
      sodaProps.put("oracle.soda.localMetadataCache", "true"); 
    }           
    
    private static final OracleRDBMSClient client = new OracleRDBMSClient(sodaProps);   
    
    public DBConnection() {
        super();
    }

    private static String getDatabaseURL() {
        if (connectionProps.getDriver().equalsIgnoreCase(ConnectionProperties.THIN_DRIVER)) {
            return "jdbc:oracle:thin:@//" + connectionProps.getHostname() + ":" + connectionProps.getPort() + "/" + connectionProps.getServiceName();
        } else {
            return "jdbc:oracle:oci8:@(description=(address=(host=" + connectionProps.getHostname() + ")(protocol=tcp)(port=" +
                   connectionProps.getPort() + "))(connect_data=(service_name=" + connectionProps.getServiceName() + ")(server=" +
                   connectionProps.getServerMode() + ")))";
        }
    }

    private static String getOracleDataSourceURL()
    {
        // System.out.println("getDatabaseURL() : Driver = " + this.settings.getDriver());
        if( connectionProps.getDriver() != null) {
          if( connectionProps.getDriver().equalsIgnoreCase( ConnectionProperties.THIN_DRIVER ) ) {
              return connectionProps.getHostname() + ":" + connectionProps.getPort() + "/" + connectionProps.getServiceName();
          }
          else {
              return "(description=(address=(host=" + connectionProps.getHostname() + ")(protocol=tcp)(port=" + connectionProps.getPort() + "))(connect_data=(service_name=" + connectionProps.getServiceName() + ")(server=" + connectionProps.getServerMode() + ")))";
          }
        }
        else {
          return null;
        }
    }   

    private static void initializeConnectionPool() throws OracleException, SQLException, IOException {

       pds.setConnectionFactoryClassName("oracle.jdbc.pool.OracleDataSource");
      
       String schema = connectionProps.getSchema();
       if ((schema == null) ||(schema.length() ==0)) {
         throw new SQLException("Invalid schema specified in connection properties file.");
       }

       String password = connectionProps.getPassword();
       if ((password == null) ||(password.length() ==0)) {
         throw new SQLException("Invalid password specified in connection properties file.");
       }

       String tnsnamesLocation = connectionProps.getTNSAdmin();
       if ((tnsnamesLocation != null) && (tnsnamesLocation.length() > 0)) {
         System.setProperty("oracle.net.tns_admin", tnsnamesLocation);
       }
       
       if (System.getProperty("oracle.net.tns_admin") != null) {
         // System.out.println(sdf.format(new Date()) + "[DBConnection.initializeConnectionPool()]: Using connection information from TNSNAMES.ora located in \"" + System.getProperty("oracle.net.tns_admin") + "\"." );                
       }
                
       String tnsEntry = connectionProps.getTNSEntry();
       if (tnsEntry != null) {
         // System.out.println(sdf.format(new Date()) + "[DBConnection.initializeConnectionPool()]: Attempting connection to \"" + tnsEntry + "\" using \"" + mgr.getDriver() + "\" driver as user \"" + schema +"\"." );         
         pds.setUser(schema);
         pds.setPassword(password);
         pds.setURL("jdbc:oracle:thin:@" + tnsEntry);
       }
       else {
         // System.out.println(sdf.format(new Date()) + "[DBConnection.initializeConnectionPool()]: Attempting connection using \"" + dataSourceURL + "\"." );         
         String dataSourceURL = getOracleDataSourceURL();
         pds.setURL(dataSourceURL);
       }       
    }

    public static  OracleConnection getOracleConnection() throws SQLException, IOException {

        OracleConnection conn = null;

        String driver = connectionProps.getDriver();
        if ((driver == null) ||(driver.length() ==0)) {
          throw new SQLException("Invalid driver specified in connection properties file.");
        }

        if (driver.equalsIgnoreCase(ConnectionProperties.INTERNAL_DRIVER)) {
            // System.out.println("Attempting connection using \"" + driver + "\" driver." );
            OracleDriver ora = new OracleDriver();
            conn = (OracleConnection) ora.defaultConnection();
        } else {
            OracleDataSource ods = new OracleDataSource();

            String schema = connectionProps.getSchema();
            if ((schema == null) ||(schema.length() ==0)) {
              throw new SQLException("Invalid schema specified in connection properties file.");
            }

            String password = connectionProps.getPassword();
            if ((password == null) ||(password.length() ==0)) {
              throw new SQLException("Invalid password specified in connection properties file.");
            }

            String tnsnamesLocation = connectionProps.getTNSAdmin();
            if ((tnsnamesLocation != null) && (tnsnamesLocation.length() > 0)) {
              System.setProperty("oracle.net.tns_admin", tnsnamesLocation);
            }
            if (System.getProperty("oracle.net.tns_admin") != null) {
              System.out.println(sdf.format(new Date()) + "[DBConnection.createConnection()]: Using connection information from TNSNAMES.ora located in \"" + System.getProperty("oracle.net.tns_admin") + "\"." );                
            }
            
            String tnsEntry = connectionProps.getTNSEntry();
            if (tnsEntry != null) {
              System.out.println(sdf.format(new Date()) + "[DBConnection.createConnection()]: Attempting connection to \"" + tnsEntry + "\" using \"" + driver + "\" driver as user \"" + schema +"\"." );         
              ods.setUser(schema);
              ods.setPassword(password);
              ods.setDriverType(driver);
              ods.setTNSEntryName(tnsEntry);
            }
            else {
              String dataSourceURL = getOracleDataSourceURL();
              System.out.println(sdf.format(new Date()) + "[DBConnection.createConnection()]: Attempting connection using \"" + dataSourceURL + "\"." );         
              ods.setURL(dataSourceURL);
            }
            conn = (OracleConnection) ods.getConnection();
        }
        
        return conn;
    }

    public static OracleDatabase getOracleDatabase() throws SQLException, IOException, OracleException {
        
        // Get a SODA OracleDatabase instance
                
        if (movieProps.isEmpty()) {
          initializeConnectionPool();
          OracleDatabase db = client.getDatabase(pds.getConnection());
          doFeatureDetection(db);
          return db;
        }
        else {
          return client.getDatabase(pds.getConnection());
        }
    }
    
    public static boolean isNearSupported() {
        return Boolean.parseBoolean((String) movieProps.get("com.oracle.st.pm.json.movieTicketing.nearSupported"));
    }

    public static boolean isContainsSupported() {
        return Boolean.parseBoolean((String) movieProps.get("com.oracle.st.pm.json.movieTicketing.containsSupported"));
    }

    public static boolean isNullOnEmptySupported() {
        return Boolean.parseBoolean((String) movieProps.get("com.oracle.st.pm.json.movieTicketing.nullOnEmptySupported"));
    }

    private static void supportsNear(boolean state) {
        movieProps.put("com.oracle.st.pm.json.movieTicketing.nearSupported",Boolean.toString(state));
    }

    private static void supportsContains(boolean state) {
        movieProps.put("com.oracle.st.pm.json.movieTicketing.containsSupported",Boolean.toString(state));
    }

    private static void supportsNullOnEmpty(boolean state) {
        movieProps.put("com.oracle.st.pm.json.movieTicketing.nullOnEmptySupported",Boolean.toString(state));
    }
    
    private static void doFeatureDetection(OracleDatabase db) throws OracleException {

       movieProps.put("com.oracle.st.pm.json.movieTicketing.nearSupported", "true");
       movieProps.put("com.oracle.st.pm.json.movieTicketing.containsSupported", "true");
       movieProps.put("com.oracle.st.pm.json.movieTicketing.nullOnEmptySupported", "true");

       String collectionName = "TMP-" + UUID.randomUUID();
       OracleCollection col = TemporaryCollection.createTemporaryCollection(db);
        
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

        TemporaryCollection.dropTemporaryCollection(db);

        System.out.println(sdf.format(new Date()) + " doFeatureDetection: $contains operator supported:  " + isContainsSupported());
        System.out.println(sdf.format(new Date()) + " doFeatureDetection: $near operatator   supported:  " + isNearSupported());
        System.out.println(sdf.format(new Date()) + " doFeatureDetection: \"NULL ON EMPTY\"    supported:  " + isNullOnEmptySupported());

    }
}
