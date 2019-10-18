/**
 * Copyright (c) 2014, 2018, Oracle and/or its affiliates.
 * The Universal Permissive License (UPL), Version 1.0
 */
define(['ojs/ojcore', 'knockout', 'jquery', 'ojs/ojknockout', 'ojs/ojlabel', 'ojs/ojmodel', 'ojs/ojknockout-model',
    'ojs/ojinputtext', 'ojs/ojformlayout', 'ojs/ojslider', 'ojs/ojselectcombobox', 'ojs/ojbutton', 'ojs/ojrouter', 'ojs/ojmodel', 'ojs/ojdialog'
  ],
  function (oj, ko, $) {
    function AddViewModel() {
      //var serviceUrl = "http://localhost:3001/reviews";
      var self = this;
      self.router = oj.Router.rootInstance;
      var state = self.router.currentState();
      var parameters = state.parameters;
      self.root = self.router.root;
      self.key = ko.observable(parameters.key);

      // set defaults

      if (self.key()) {
        var reviews = self.root.reviews;
        review = reviews.get(self.key());
        self.title = ko.observable("Modify Wine");
        self.name = ko.observable(review.get("name"));
        self.type = ko.observable(review.get("type"));
        self.price = ko.observable(review.get("price"));
        self.quantity = ko.observable(review.get("quantity"));
        self.region = ko.observable(review.get("region"));//
      } else {
        self.title = ko.observable("Add Wine");
        self.name = ko.observable('');
        self.type = ko.observable('');
        self.price = ko.observable(0);
        self.quantity = ko.observable(0);
        self.region = ko.observable('');
      }

      self.toModel = function () {
        var result = {
          'name': self.name(),
          'type': self.type(),
          'price': self.price(),
          'quantity': self.quantity(),          
          'region': self.region()
        }
        if (self.key()) {
          result.id = self.key();
        }
        return new self.root.ReviewDef(result);
      };

      self.response = ko.observable('no response');
      self.submitHandler = function () {
        var model = self.toModel();
        model.save().then(function (response) {
          self.response(response);
          document.getElementById('successDialog').open();

        });
        /* todo hack - get reviews table to update */
        var reviews = self.root.reviews;
        reviews.add(model);
        reviews.fetch();
      }
      self.close = function (event) {
        document.getElementById('successDialog').close();
        self.router.go('table');
      }
    }
    return AddViewModel;
  }
);
