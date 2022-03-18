package emp.model;

public class Phone {

    public enum Type { MOBILE, HOME, WORK }
    
    String number;
    
    Type type;
    
    public Phone () {
        
    }
    
    public Phone(Type type, String number) {
        this.type = type;
        this.number = number;
    }

    public String getNumber() {
        return number;
    }

    public void setNumber(String number) {
        this.number = number;
    }

    public Type getType() {
        return type;
    }

    public void setType(Type type) {
        this.type = type;
    }
    
    
}
