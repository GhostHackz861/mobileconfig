'use strict';

const express = require('express');
const mobileconfig = require('mobileconfig');
const fs = require('fs');
const service = express();

service.set('port', (process.env.PORT || 3000));

service.get('/sign', function(request, response) {
	response.setHeader('Content-Type', 'text/plain');
	
	var options = {
		emailAddress: 'admin@ghosthackz.ml',
		organization: 'GhostHackz',
		identifier: 'ml.ghosthackz.mail',
		displayName: 'GhostHackz Email Configuration',
		displayDescription: 'Adds GhostHackz Email',
		accountName: 'GhostHackz',
		imap: {
			hostname: 'mail.ghosthackz.ml',
			port: 993,
			secure: true,
			username: 'admin@ghosthackz.ml',
			password: 'Samridhi861'
		},
		smtp: {
			hostname: 'mail.ghosthackz.ml',
			port: 465,
			secure: true,
			username: 'admin@ghosthackz.ml',
			password: 'Samridhi861'
		},
		keys: {
			key: fs.readFileSync('./key.pem'),
			cert: fs.readFileSync('./cert.pem')
		}
	};
	
	mobileconfig.getSignedEmailConfig(options, function(error, data) {
		response.send(data);
	});
});

service.listen(service.get('port'), function() {
	console.log('Connected to the server!');
});