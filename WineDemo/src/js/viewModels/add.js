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
        self.notes = ko.observable(review.get("notes"));
        self.region = ko.observable(review.get("region"));
//        self.sweet = ko.observable(review.get("sweet"));
      } else { 
        self.title = ko.observable("Add Wine");
        self.name = ko.observable('');
        self.type = ko.observable('');
        self.price = ko.observable(0);
        self.notes = ko.observable('');
        self.region = ko.observable('');
//        self.sweet = ko.observable(5);

      }

      self.toModel = function () {
        var result = {
          'name'  : self.name(),
          'type'  : self.type(),
          'price' : self.price(),
          'notes' : self.notes(),          
          'region': self.region(),
//          'sweet' : self.sweet()
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
          self.root.reviews.fetch().then(function() {
            self.root.reviewsObservable.valueHasMutated();
          });
          document.getElementById('successDialog').open();
        });
      }
      self.close = function (event) {
        document.getElementById('successDialog').close();
        self.router.go('table');
      }
    }
    return AddViewModel;
  }
);
