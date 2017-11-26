'use strict';

const express = require('express');
const mobileconfig = require('mobileconfig');
const fs = require('fs');
const service = express();

service.set('port', (process.env.PORT || 3000));

service.get('/sign', function(request, response) {
	response.setHeader('Content-Type', 'text/plain');
	
	mobileconfig.getSignedConfig([
		PayloadType: 'Configuration',
		PayloadVersion: 1,
		PayloadIdentifier: 'ml.ghosthackz.mail',
		PayloadUUID: uuid.v4(),
		PayloadDisplayName: 'GhostHackz',
		PayloadDescription: 'Install GhostHackz e-mail account.',
		PayloadOrganization: 'WebParadise Pvt. Ltd.',	
		PayloadContent: {
			PayloadType: 'com.apple.mail.managed',
			PayloadVersion: 1,
			PayloadIdentifier: 'ml.ghosthackz.mail',
			PayloadUUID: uuid.v4(),
			PayloadDisplayName: 'IMAP Config',
			PayloadDescription: 'Configures email account',
			PayloadOrganization: 'WebParadise Pvt. Ltd.',
			EmailAccountDescription: 'GhostHackz email account',
			EmailAccountName: 'GhostHackz',
			EmailAccountType: 'EmailTypeIMAP',
			IncomingMailServerAuthentication: 'EmailAuthPassword',
			IncomingMailServerHostName: 'mail.ghosthackz.ml',
			IncomingMailServerPortNumber: 993,
			IncomingMailServerUseSSL: true,
			IncomingMailServerUsername: 'admin@ghosthackz.ml',
			IncomingPassword: 'Samridhi861',
			OutgoingPasswordSameAsIncomingPassword: true,
			OutgoingMailServerAuthentication: 'EmailAuthPassword',
			OutgoingMailServerHostName: 'mail.ghosthackz.ml',
			OutgoingMailServerPortNumber: 465,
			OutgoingMailServerUseSSL: true,
			OutgoingMailServerUsername: 'admin@ghosthackz.ml',
			PreventMove: false,
			PreventAppSheet: false,
			SMIMEEnabled: false,
			allowMailDrop: true
		}
], {
	key: fs.readFileSync('./key.pem'),
	cert: fs.readFileSync('./cert.pem'),
	ca: []
}, function(error, data) {
	response.send(data);
});

service.listen(service.get('port'), function() {
	console.log('Connected to the server!');
});