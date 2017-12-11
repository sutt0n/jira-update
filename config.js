var config = {
	protocol: "https",						// protocol
	host: process.env.JIRA_HOST,					// hostname
	user: process.env.JIRA_USERNAME,				// jira username
	password: process.env.JIRA_PASSWORD,				// jira password
	version: "latest",						// jira api version
	runEvery: 5, 							// seconds
	notificationTimeout: 5,						// seconds
	os: "windows"							// windows, other
};

module.exports = config;
