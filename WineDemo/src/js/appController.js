/**
 * @license
 * Copyright (c) 2014, 2018, Oracle and/or its affiliates.
 * The Universal Permissive License (UPL), Version 1.0
 */
/*
 * Your application specific code will go here
 */
define(['ojs/ojcore', 'knockout', 'ojs/ojmodule-element-utils', 'ojs/ojmodule-element', 'ojs/ojrouter', 'ojs/ojknockout', 'ojs/ojarraytabledatasource',
	'ojs/ojoffcanvas','ojs/ojmodel','ojs/ojcollectiontabledatasource'],
  function(oj, ko, moduleUtils) {
     function ControllerViewModel() {
       var self = this;

      // Media queries for repsonsive layouts
      var smQuery = oj.ResponsiveUtils.getFrameworkQuery(oj.ResponsiveUtils.FRAMEWORK_QUERY_KEY.SM_ONLY);
      self.smScreen = oj.ResponsiveKnockoutUtils.createMediaQueryObservable(smQuery);
      var mdQuery = oj.ResponsiveUtils.getFrameworkQuery(oj.ResponsiveUtils.FRAMEWORK_QUERY_KEY.MD_UP);
      self.mdScreen = oj.ResponsiveKnockoutUtils.createMediaQueryObservable(mdQuery);

      // Router setup
      self.router = oj.Router.rootInstance;
      self.router.root = this;
      self.router.configure({
        'table':        {label: 'Table', isDefault: true},
        'modify/{key}': {label: 'Modify', value: 'modify'},
        'add':          {label: 'Add',    value: 'add'},
        'about':        {label: 'About',  value: 'about'}
      });
      self.serviceURL = "/wines"; //http://localhost:3001
      var getVerb = function(verb) {
        if (verb === "update" || verb === "create") {
          return "POST";
        }
        if (verb === "read") {
          return "GET";
        }
        if (verb === "delete") {
          return "DELETE";
        }
      };

      var getURL = function(operation, collection, options) {
        console.log('getUrl');
          var retObj = {};
          retObj['type'] = getVerb(operation);
          if (operation === "delete") {
              retObj['url'] = self.serviceURL + "/" + options['recordID'];
          } else if (operation === "read" && "" !== self.filter()) {
              retObj['url'] = self.serviceURL + "?qbe=" + self.filter();
          } else {
              retObj['url'] = self.serviceURL;
          }
          return retObj;
      };
      
      self.filter = ko.observable('');
      self.ReviewDef = oj.Model.extend({
          customURL: getURL,
	  url: self.serviceURL,
          idAttribute: "id"
      });

      self.ReviewsDef = oj.Collection.extend({
          customURL: getURL,
	  url: self.serviceURL,
	  model: new self.ReviewDef,
	  comparator: "id"
      });
      self.reviews = new self.ReviewsDef;
      self.reviews.fetch();
      self.reviewsObservable = ko.observable(self.reviews);
      self.dataSource = new oj.CollectionTableDataSource(self.reviewsObservable());
      

      oj.Router.defaults['urlAdapter'] = new oj.Router.urlParamAdapter();

      var mc = self.router.observableModuleConfig();
      var config = {};
      
      for (key in mc) {
          if (mc.hasOwnProperty(key)) {
              config[key] = mc[key];
          }
      } 
      config.view = [];
      config.viewModel = null;
      self.moduleConfig = ko.observable(config);

      self.loadModule = function() {
        ko.computed(function() {
          var mc = self.router.observableModuleConfig();
          //var name = mc.name();
          var name = self.router.moduleConfig.name();
          if (name == "modify") {
	      name = "add"; // reuse add model
	  }
          var viewPath = 'views/' + name + '.html';
          var modelPath = 'viewModels/' + name;
          var masterPromise = Promise.all([
            moduleUtils.createView({'viewPath':viewPath}),
            moduleUtils.createViewModel({'viewModelPath':modelPath})
          ]);
          masterPromise.then(
            function(values){
		/*
		self.moduleConfig(config);
		*/
                
                var config = self.moduleConfig();
                var copy = {};
                for (key in config) {
                   if (config.hasOwnProperty(key)) {
                      copy[key] = config[key];
                   }
                }
		            copy.view = values[0];
                copy.viewModel = values[1];
                copy.viewModel.controler = self;
                self.moduleConfig(copy);
            }
          );
        });
      };

      // Navigation setup
      var navData = [
        {name: 'Inventory', id: 'table'},
        {name: 'Add Wine',  id: 'add'},
        {name: 'About',     id: 'about'}
      ];
      self.navDataSource = new oj.ArrayTableDataSource(navData, {idAttribute: 'id'});

      // Drawer
      // Close offcanvas on medium and larger screens
      self.mdScreen.subscribe(function() {oj.OffcanvasUtils.close(self.drawerParams);});
      self.drawerParams = {
        displayMode: 'push',
        selector: '#navDrawer',
        content: '#pageContent'
      };
      // Called by navigation drawer toggle button and after selection of nav drawer item
      self.toggleDrawer = function() {
        return oj.OffcanvasUtils.toggle(self.drawerParams);
      }
      // Add a close listener so we can move focus back to the toggle button when the drawer closes
      $("#navDrawer").on("ojclose", function() { $('#drawerToggleButton').focus(); });

      // Header
      // Application Name used in Branding Area
      self.appName1 = ko.observable("Beda's Budget");
      self.appName2 = ko.observable("Booze");
      self.appName3 = ko.observable("Bottles");
      // Footer
      function footerLink(name, id, linkTarget) {
        this.name = name;
        this.linkId = id;
        this.linkTarget = linkTarget;
      }
      self.footerLinks = ko.observableArray([
        new footerLink('About Oracle', 'aboutOracle', 'http://www.oracle.com/us/corporate/index.html#menu-about'),
        new footerLink('Contact Us', 'contactUs', 'http://www.oracle.com/us/corporate/contact/index.html'),
        new footerLink('Legal Notices', 'legalNotices', 'http://www.oracle.com/us/legal/index.html'),
        new footerLink('Terms Of Use', 'termsOfUse', 'http://www.oracle.com/us/legal/terms/index.html'),
        new footerLink('Your Privacy Rights', 'yourPrivacyRights', 'http://www.oracle.com/us/legal/privacy/index.html'),
        new footerLink('Reset Demo', 'resetDemo', '/wines-reset')
      ]);
     }

     return new ControllerViewModel();
  }
);
