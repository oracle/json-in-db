package emp;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.Map.Entry;

import oracle.jdbc.OracleType;
import oracle.sql.json.OracleJsonFactory;
import oracle.sql.json.OracleJsonGenerator;

/**
 * Shows how an instance of java.util.Map can be converted to OSON
 * and inserted into a JSON type column.
 */
public class JavaCollectionsToJson {

    public static void main(String[] args) throws Exception {
        
        Map<String, Object> emp = new HashMap<String, Object>();
        emp.put("name", "Jack");
        emp.put("job", "Programmer");
        emp.put("salary", 35000);
        emp.put("created", OffsetDateTime.now());

        OracleJsonFactory factory = new OracleJsonFactory();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        OracleJsonGenerator gen = factory.createJsonBinaryGenerator(out);
        writeMap(gen, emp);
        gen.close();
        
        byte[] oson = out.toByteArray();
        try (Connection con = DriverManager.getConnection(args[0])) {
            PreparedStatement stmt = con.prepareStatement("INSERT INTO emp VALUES (?)");
            stmt.setObject(1, oson, OracleType.JSON);
            stmt.execute();
            System.out.println("Jack inserted into successfully");
        }
    }

    private static void writeMap(OracleJsonGenerator gen, Map<?, ?> emp) {
        gen.writeStartObject();
        for (Entry<?, ?> e : emp.entrySet()) {
            String key = e.getKey().toString();
            Object value = e.getValue();
            gen.writeKey(key);
            writeValue(gen, value);
        }
        gen.writeEnd();
    }

    private static void writeList(OracleJsonGenerator gen, Collection<?> value) {
        gen.writeStartArray();
        for (Object o : value) {
            writeValue(gen, o);
        }
        gen.writeEnd();
    }
    
    /** Alternate type mappings can be added here */ 
    private static void writeValue(OracleJsonGenerator gen, Object value) {
        if (value == null) {
            gen.writeNull();  
        } else if (value instanceof Boolean) {
            gen.write((Boolean)value);
        } else if (value instanceof String) {
            gen.write((String)value);
        } else if (value instanceof Integer) {
            gen.write((Integer)value);
        } else if (value instanceof Long) {
            gen.write((Long)value);
        } else if (value instanceof BigDecimal) {
            gen.write((BigDecimal)value);
        } else if (value instanceof Double) {
            gen.write((Double)value);
        } else if (value instanceof LocalDateTime) {
            gen.write((LocalDateTime)value);
        } else if (value instanceof OffsetDateTime) {
            gen.write((OffsetDateTime)value);
        } else if (value instanceof Map<?,?>) {
            writeMap(gen, (Map<?,?>)value);
        } else if (value instanceof Collection<?>) {
            writeList(gen,(Collection<?>)value); 
        } else {
            throw new IllegalArgumentException("Unexpected type: " + value.getClass());
        }
    }

}

