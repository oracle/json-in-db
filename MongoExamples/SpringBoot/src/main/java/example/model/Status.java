package example.model;

import org.springframework.data.annotation.Id;

/**
 * Bike station status
 * 
 * @see https://github.com/NABSA/gbfs/blob/master/gbfs.md#station_statusjson
 */
public class Status {

    @Id
    String id;

    String station_id;

    int num_bikes_available;

    int is_renting;

    int num_ebikes_available;

    String legacy_id;

    int last_reported;

    int is_installed;

    int is_returning;

    int num_docks_available;

    boolean eightd_has_available_keys;

    String station_status;

    int num_docks_disabled;

    int num_bikes_disabled;

    public Status() {

    }

    public String getId() {
        return id;
    }

    public String getStation_id() {
        return station_id;
    }

    public int getNum_bikes_available() {
        return num_bikes_available;
    }

    public int getIs_renting() {
        return is_renting;
    }

    public int getNum_ebikes_available() {
        return num_ebikes_available;
    }

    public String getLegacy_id() {
        return legacy_id;
    }

    public int getLast_reported() {
        return last_reported;
    }

    public int getIs_installed() {
        return is_installed;
    }

    public int getIs_returning() {
        return is_returning;
    }

    public int getNum_docks_available() {
        return num_docks_available;
    }

    public boolean isEightd_has_available_keys() {
        return eightd_has_available_keys;
    }

    public String getStation_status() {
        return station_status;
    }

    public int getNum_docks_disabled() {
        return num_docks_disabled;
    }

    public int getNum_bikes_disabled() {
        return num_bikes_disabled;
    }
}
