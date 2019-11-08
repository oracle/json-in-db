/* Copyright (c) 2015, 2017, Oracle and/or its affiliates. All rights reserved. */

module.exports = {
  dbname  : process.env.WINE_DB || "oracle",
  wines   : [
    {
      "name": "Rouge Grosse",
      "type": "Cabernet Sauvignon",
      "price": "12.00",
      "notes": "Low acidity, full-body.",
      "region": "France"
    },
    {
      "name": "Roja Grande",
      "type": "Merlot",
      "price": "7.99",
      "notes": "Medium acidity, dry.",
      "region": "Spain"
    },
    {
      "name": "Teuer",
      "type": "Cabernet Sauvignon",
      "price": "42.00",
      "notes": "Sweet, full-body.",
      "region": "Germany"
    }
  ]
};
