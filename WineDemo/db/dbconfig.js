/* Copyright (c) 2015, 2017, Oracle and/or its affiliates. All rights reserved. */

module.exports = {
  dbname  : process.env.WINE_DB || "oracle",
  wines   : [
    {
      "name": "Rouge Grosse",
      "type": "Cabernet Sauvignon",
      "price": "12.00",
      "notes": "",
      "region": "France"
    },
    {
      "name": "Roja Grande",
      "type": "Merlot",
      "price": "7.99",
      "notes": "",
      "region": "Spain"
    },
    {
      "name": "Pas Cher",
      "type": "Chardonnay",
      "price": "3.99",
      "notes": "",
      "region": "New England"
    },
    {
      "name": "Teuer",
      "type": "Cabernet Sauvignon",
      "price": "42.00",
      "notes": "",
      "region": "Germany"
    }
  ]
};
