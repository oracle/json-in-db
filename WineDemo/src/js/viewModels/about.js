/**
 * Copyright (c) 2014, 2018, Oracle and/or its affiliates.
 * The Universal Permissive License (UPL), Version 1.0
 */
define(['ojs/ojcore', 'knockout', 'jquery', 'ojs/ojknockout', 'ojs/ojlabel', 'ojs/ojmodel', 'ojs/ojknockout-model', 'ojs/ojdialog'],
  function (oj, ko, $) {
    function AboutViewModel() {
      var self = this;
      self.title = ko.observable("About");
      self.img = ko.observable("about.png");
      self.init = false;
      self.code = $.getJSON("code");
      self.showCodeHandler = function (key) {
        return function () {
          var dia = document.getElementById('showCodeDialog');
          var pre = document.getElementById('codePre');
          pre.innerText = JSON.parse(self.code.responseText).value;
          dia.open();
          return true;
        }
      };
    }
    return AboutViewModel;
  }
);
