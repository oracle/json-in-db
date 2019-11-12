/**
 * @license
 * Copyright (c) 2014, 2018, Oracle and/or its affiliates.
 * The Universal Permissive License (UPL), Version 1.0
 */

/** The view model for the reviews table */
define(['ojs/ojcore', 'knockout', 'jquery', 'ojs/ojarraydataprovider', 'ojs/ojknockout', 'promise', 'ojs/ojtable',
    'ojs/ojrouter', 'ojs/ojmodel', 'ojs/ojcollectiontabledatasource', 'ojs/ojinputtext', 'ojs/ojformlayout', 'ojs/ojdialog'
  ],

  function (oj, ko, $, ArrayDataProvider) {
    function TableViewModel() {
      var self = this;
      self.router = oj.Router.rootInstance;
      self.root = self.router.root;
      /* Defines the columns of the reviews table */
      self.columnArray = [
        {
          headerText: 'Name',
          field: 'name'
        },
        {
          headerText: 'Type',
          field: 'type'
        },
        {
          headerText: 'Price',
          field: 'price'
        },
        {
          headerText: 'Region',
          field: 'region'
        },
/*
        {
          headerText: 'Sweet',
          field: 'sweet'
        },
*/
        {
          headerText: 'Notes',
          field: 'notes',
          width: 150
        },
        {
          headerText: 'Prediction',
          field: 'prediction'
        },
        {
          headerText: '',
          renderer: oj.KnockoutTemplateUtils.getRenderer('showJsonButton', true)
        },
        {
          headerText: '',
          renderer: oj.KnockoutTemplateUtils.getRenderer('editButton', true)
        },
        {
          headerText: '',
          renderer: oj.KnockoutTemplateUtils.getRenderer('deleteButton', true)
        },
      ];

      /* Handles the edit button click */
      self.editHandler = function (key) {
        return function () {
          self.router.go(['modify', key]);
          return true;
        }
      };
      self.deleteHandler = function (key) {
        return function () {
          var reviews = self.root.reviews;
          var review = reviews.get(key);
          review.destroy();
          reviews.remove(review);
          return true;
        }
      };
      self.currentJson = ko.observable('');
      self.showJsonHandler = function (key) {
        return function () {
          var reviews = self.root.reviews;
          var model = reviews.get(key);
          var json = model.toJSON();
          self.currentJson(JSON.stringify(json, null, 3)); 
          document.getElementById('showJsonDialog').open();
          return true;
        }
      };

      self.filterHandler = function () {
        self.root.reviews.fetch();
        self.router.go('table');
      };
    }
    return new TableViewModel();
  }
);
