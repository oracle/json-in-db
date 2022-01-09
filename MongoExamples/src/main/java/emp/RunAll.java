package emp;

/** 
 * Runs all the examples at once.
 */
public class RunAll {

    public static void main(String[] args) throws Exception {
        print("Running CreateCollection");
        CreateCollection.main(args);
        
        print("Running Insert");
        Insert.main(args);
        
        print("Running Update");
        Update.main(args);
        
        print("Running GetAll");
        GetAll.main(args);
        
        print("Running Filter");
        Filter.main(args);
        
    }

    private static void print(String title) {
        System.out.println();
        System.out.println(title);
        System.out.println("------------------------");
        
    }

}
