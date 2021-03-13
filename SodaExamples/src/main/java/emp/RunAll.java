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
        
        print("Running JSONP");
        JSONP.main(args);
        
        print("Running JSONB");
        JSONB.main(args);

        print("Running Jackson");
        Jackson.main(args);
        
        print("Running Update");
        Update.main(args);
        
        print("Running UpdateMerge");
        UpdateMerge.main(args);
        
        print("Running GetAll");
        GetAll.main(args);
        
        print("Running Filter");
        Filter.main(args);

        print("Running Filter2");
        Filter2.main(args);
        
    }

    private static void print(String title) {
        System.out.println();
        System.out.println(title);
        System.out.println("------------------------");
        
    }

}
