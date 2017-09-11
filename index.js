'use strict';

var jiraApi = require("jira").JiraApi;
const WindowsToaster = require("node-notifier").WindowsToaster;
var config = require("./config.js");
var db = require("node-localdb");
var opn = require("opn");
var fs = require("fs");
var request = require("request");

// db's
var dbNotifications = db("local/notifications.json");

// init jira api
var jira = new jiraApi(
	'https',
	config.host,
	config.port,
	config.user,
	config.password,
	config.version
);

// notifier
var notifier = new WindowsToaster({
	withFallback: false,
	customPath: void 0
});

function doMain() {
	// get issues
	var jql = "assignee = " + config.user + " AND resolution = Unresolved order by updated DESC, priority DESC";
	jira.searchJira(jql, ["updated", "comment"], function (error, response) {
		var issues = response.issues;
		var toCheck = {};
		for (let issue of issues) {
			toCheck[issue.key] = issue.fields.updated;
		}
		
		// search localdb
		dbNotifications.find({}).then(function (notifications) {
			for (let notification of notifications) {
				var lastUpdated = new Date(notification.updated);
				var updated = new Date(toCheck[notification.key]);
				var closed = notification.closed;

				if (updated > lastUpdated) {
					console.log("notifying for " + notification.key);
					
					notifier.notify({
						title: notification.key,
						message: "Update to " + notification.key + "!",
						sound: true,
						time: config.notificationTimeout * 1000,
						wait: false,
						icon: __dirname + "/local/jira.png"
					}, function (err, resp) {
						console.log(arguments);
					});
					
					// update
					dbNotifications.update({ key: notification.key }, {
						updated: toCheck[notification.key]
					});
				}

				delete toCheck[notification.key];
			}
		}).then(function () {
			// insert
			for (var prop in toCheck) {
				notifier.notify({
					title: prop,
					message: "Update to " + prop + "!",
					sound: true,
					time: config.notificationTimeout * 1000,
					wait: false,
					icon: __dirname + "/local/jira.png"
				});
				
				notifier.on("click", function () {
					console.log(arguments);
				});

				dbNotifications.insert({
					key: prop,
					updated: toCheck[prop]
				});
			}
		});

	});
};

setInterval(() => {
	doMain();
}, config.runEvery * 1000);