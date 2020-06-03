package com.oracle.st.pm.json.movieTicketing.qbe;


public class BetweenOperator {
    String $gte = null;
    String $lte = null;

    public BetweenOperator(String start, String end) {
        $gte = start;
        $lte = end;
    }
}
