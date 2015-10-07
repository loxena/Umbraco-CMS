/**
 * @ngdoc controller
 * @name Umbraco.Editors.MemberType.EditController
 * @function
 *
 * @description
 * The controller for the member type editor
 */
 (function() {
 	"use strict";

	function MemberTypesEditController($scope, $rootScope, $routeParams, $log, $filter, memberTypeResource, dataTypeResource, editorState, iconHelper, formHelper, navigationService, contentEditingHelper, notificationsService) {

		var vm = this;

		vm.save = save;

		vm.currentNode = null;
		vm.contentType = {};
		vm.page = {};
      vm.page.loading = false;
      vm.page.saveButtonState = "init";
		vm.page.navigation = [
			{
				"name": "Design",
				"icon": "icon-document-dashed-line",
				"view": "views/membertype/views/design/design.html",
				"active": true
			}
		];

		vm.page.keyboardShortcutsOverview = [
			{
				"shortcuts": [
					{
						"description": "Add tab",
						"keys": [{"key": "alt"},{"key": "shift"},{"key": "t"}]
					},
					{
						"description": "Add property",
						"keys": [{"key": "alt"},{"key": "shift"},{"key": "p"}]
					},
					{
						"description": "Add editor",
						"keys": [{"key": "alt"},{"key": "shift"},{"key": "e"}]
					},
					{
						"description": "Edit data type",
						"keys": [{"key": "alt"},{"key": "shift"},{"key": "d"}]
					}
				]
			}
		];

		if ($routeParams.create) {

         vm.page.loading = true;

			//we are creating so get an empty data type item
			memberTypeResource.getScaffold($routeParams.id)
				.then(function(dt) {
					init(dt);

               vm.page.loading = false;
				});
		}
		else {

         vm.page.loading = true;

			memberTypeResource.getById($routeParams.id).then(function(dt){
				init(dt);

				syncTreeNode(vm.contentType, dt.path, true);

            vm.page.loading = false;
			});
		}

		function save() {

			// validate form
			if (formHelper.submitForm({ scope: $scope })) {

        formHelper.resetForm({ scope: $scope });

				// if form validates - perform save
				performSave();

			}

		}

		function performSave() {

         vm.page.saveButtonState = "busy";

			memberTypeResource.save(vm.contentType).then(function(dt){

				formHelper.resetForm({ scope: $scope, notifications: dt.notifications });
				contentEditingHelper.handleSuccessfulSave({
					scope: $scope,
					savedContent: dt,
					rebindCallback: function() {

					}
				});

				notificationsService.success("Member type saved");
				//post save logic here -the saved doctype returns as a new object
				init(dt);

				syncTreeNode(vm.contentType, dt.path);

            vm.page.saveButtonState = "success";


			});

		}

		function init(contentType){

			// set all tab to inactive
			if( contentType.groups.length !== 0 ) {
				angular.forEach(contentType.groups, function(group){

					angular.forEach(group.properties, function(property){
						// get data type details for each property
						getDataTypeDetails(property);
					});

				});
			}

			// convert legacy icons
			convertLegacyIcons(contentType);

			// sort properties after sort order
			angular.forEach(contentType.groups, function(group){
				group.properties = $filter('orderBy')(group.properties, 'sortOrder');
			});

			//set a shared state
			editorState.set(contentType);

			vm.contentType = contentType;

		}

		function convertLegacyIcons(contentType) {

			// make array to store contentType icon
			var contentTypeArray = [];

			// push icon to array
			contentTypeArray.push({"icon":contentType.icon});

			// run through icon method
			iconHelper.formatContentTypeIcons(contentTypeArray);

			// set icon back on contentType
			contentType.icon = contentTypeArray[0].icon;

		}

		function getDataTypeDetails(property) {

			if( property.propertyState !== "init" ) {

				dataTypeResource.getById(property.dataTypeId)
					.then(function(dataType) {
						property.dataTypeIcon = dataType.icon;
						property.dataTypeName = dataType.name;
					});
			}
		}

		/** Syncs the content type  to it's tree node - this occurs on first load and after saving */
		function syncTreeNode(dt, path, initialLoad) {

			navigationService.syncTree({ tree: "membertypes", path: path.split(","), forceReload: initialLoad !== true }).then(function (syncArgs) {
				vm.currentNode = syncArgs.node;
			});

		}


	}

	angular.module("umbraco").controller("Umbraco.Editors.MemberTypes.EditController", MemberTypesEditController);

})();