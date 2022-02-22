package example;

import static oracle.sql.json.OracleJsonValue.OracleJsonType.ARRAY;
import static oracle.sql.json.OracleJsonValue.OracleJsonType.FALSE;
import static oracle.sql.json.OracleJsonValue.OracleJsonType.OBJECT;
import static oracle.sql.json.OracleJsonValue.OracleJsonType.STRING;
import static oracle.sql.json.OracleJsonValue.OracleJsonType.TRUE;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.StringReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Map.Entry;

import oracle.sql.json.OracleJsonArray;
import oracle.sql.json.OracleJsonFactory;
import oracle.sql.json.OracleJsonGenerator;
import oracle.sql.json.OracleJsonObject;
import oracle.sql.json.OracleJsonValue;
import oracle.sql.json.OracleJsonValue.OracleJsonType;

/**
 * An example of how to convert DynamoDB's JSON export format to
 * normal JSON without type annotations.  It converts binary values (B) 
 * to eJSON $binary.   
 * 
 * Specifically it converts:
 * 
 *  <code><pre>
 *  S    (string)     -> JSON string
 *  N    (number)     -> JSON number
 *  BOOL (boolean)    -> JSON true/false
 *  NULL (null)       -> JSON null
 *  B    (binary)     -> eJSON $binary (binary)
 *  SS   (string set) -> JSON array of strings
 *  NS   (number set) -> JSON array of numbers
 *  L    (list)       -> JSON array
 *  M    (map)        -> JSON object
 *  </pre></code>
 *  
 *  Additionally, it removes the outer "Item" wrapper if present.
 *  
 * @see https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DataExport.Output.html
 */
public class DynamoToEJson {
    
    static final OracleJsonFactory FACT = new OracleJsonFactory();
    
    public static void main(String[] args) throws Exception {
        InputStream inputStream = new BufferedInputStream(System.in);
        BufferedOutputStream outputStream = new BufferedOutputStream(System.out);
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
            String line = null;

            while ((line = reader.readLine()) != null) {
                OracleJsonValue value = FACT.createJsonTextValue(new StringReader(line));
                OracleJsonValue newValue = toEJson(unwrap(value));
                
                buffer.reset();
                try (OracleJsonGenerator generator = FACT.createJsonTextGenerator(buffer)) {
                    generator.write(newValue);
                }
                buffer.writeTo(outputStream);
                outputStream.write('\n');
                outputStream.flush();
            }

        }
    }

    private static OracleJsonValue unwrap(OracleJsonValue value) {
        if (value.getOracleJsonType() == OBJECT) {
            OracleJsonObject obj = value.asJsonObject();
            if (obj.size() == 1 && obj.containsKey("Item")) {
                return obj.get("Item");
            }
        }
        return value;
    }

    private static OracleJsonValue toEJson(OracleJsonValue value) {
        switch(value.getOracleJsonType()) {
        case ARRAY:
            OracleJsonArray newArray = FACT.createArray();
            for (OracleJsonValue child : value.asJsonArray()) {
                newArray.add(toEJson(child));
            }
            return newArray;
        case OBJECT:
            OracleJsonObject obj = value.asJsonObject();
            if (obj.size() == 1) {
                Entry<String, OracleJsonValue> e = obj.entrySet().iterator().next();
                OracleJsonValue child = e.getValue();
                OracleJsonType childType = child.getOracleJsonType();
                
                switch (e.getKey()) {
                case "SS" :
                    if (childType == ARRAY) {
                        return child;
                    }
                case "S":
                    if (childType == STRING) {
                        return child;
                    }
                case "N":
                    if (childType == STRING) {
                        return toNumber(child);
                    }
                case "BS":
                    if (childType == ARRAY) {
                        OracleJsonArray arr = FACT.createArray();
                        for (OracleJsonValue val : child.asJsonArray()) {
                            arr.add(toBinary(val));
                        }
                        return arr;
                    }
                case "NULL":
                    return OracleJsonValue.NULL;
                case "NS" :
                    if (childType == ARRAY) {
                        OracleJsonArray arr = FACT.createArray();
                        for (OracleJsonValue v : child.asJsonArray()) {
                            arr.add(toNumber(v));
                        }
                        return arr;
                    }
                case "BOOL":
                    if (childType == TRUE)
                        return OracleJsonValue.TRUE;
                    else if (childType == FALSE) 
                        return OracleJsonValue.FALSE;
                case "B":
                    if (childType == STRING) {
                        return toBinary(child);
                    }
                case "L":
                    if (childType == ARRAY) {
                        return toEJson(child);
                    }
                case "M":
                    if (childType == OBJECT) {
                        return toEJson(child);
                    }
                default:
                    // fall through, leave value as-is
                }
            }
            OracleJsonObject newObject = FACT.createObject();
            for (Entry<String, OracleJsonValue> entry : obj.entrySet()) {
                newObject.put(entry.getKey(), toEJson(entry.getValue()));
            }
            return newObject;
        default:
            return value;
        }
    }

    private static OracleJsonObject toBinary(OracleJsonValue val) {
        OracleJsonObject o = FACT.createObject();
        OracleJsonObject bin = FACT.createObject();
        bin.put("base64", val);
        bin.put("subType", "0");
        o.put("$binary", bin);
        return o;
    }

    private static OracleJsonValue toNumber(OracleJsonValue v) {
        return FACT.createDecimal(new BigDecimal(v.asJsonString().getString()));
    }
}
