package example.model;

import java.util.List;
import java.util.Map;

import org.springframework.data.annotation.Id;

/**
 * Bike station
 * 
 * @see https://github.com/NABSA/gbfs/blob/master/gbfs.md#station_information
 */
public class Station {

    @Id
    String id;

    String name;

    String region_id;

    double lon, lat;

    boolean eightd_has_key_dispenser;

    String legacy_id;

    List<String> rental_methods;

    String external_id;

    int capacity;

    String short_name;

    boolean electric_bike_surcharge_waiver;

    String station_type;

    List<String> eightd_station_services;

    boolean has_kiosk;

    Map<String, String> rental_uris;

    public Station() {

    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getRegion_id() {
        return region_id;
    }

    public double getLon() {
        return lon;
    }

    public double getLat() {
        return lat;
    }

    public boolean isEightd_has_key_dispenser() {
        return eightd_has_key_dispenser;
    }

    public String getLegacy_id() {
        return legacy_id;
    }

    public List<String> getRental_methods() {
        return rental_methods;
    }

    public String getExternal_id() {
        return external_id;
    }

    public int getCapacity() {
        return capacity;
    }

    public String getShort_name() {
        return short_name;
    }

    public boolean isElectric_bike_surcharge_waiver() {
        return electric_bike_surcharge_waiver;
    }

    public String getStation_type() {
        return station_type;
    }

    public List<String> getEightd_station_services() {
        return eightd_station_services;
    }

    public boolean isHas_kiosk() {
        return has_kiosk;
    }

    public Map<String, String> getRental_uris() {
        return rental_uris;
    }

}
