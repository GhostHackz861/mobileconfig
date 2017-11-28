'use strict';

const express = require('express');
const handlebars = require('handlebars');
const jsrsasign = require('jsrsasign');
const uuid = require('uuid');
const fs = require('fs');
const service = express();

service.set('port', (process.env.PORT || 3000));

const templates = {
		vpn: handlebars.compile(fs.readFileSync('./vpn.plist', 'utf-8'))
};

service.get('/sign', function(request, response) {
	response.setHeader('Content-Type', 'application/x-apple-aspen-config');
	
	function sign(value, options, callback) {
		options = options || {};
		
		let cert = [];
		[].concat(options.cert || []).concat(options.ca || []).map(ca => {
			ca = (ca || '').toString().trim().split('END CERTIFICATE-----');
			ca.pop();
			ca.forEach(ca => {
				ca += 'END CERTIFICATE-----';
				certs.push(ca.trim());
			});
			return ca;
		});
		
		certs = certs.reverse();
		
		let der;
		let params = {
			content: {
				str: (value || '').toString('utf-8')
			},
			certs,
			signerInfos: [
				{
					hashAlg: options.hashAlg || 'sha256',
					sAttr: options.signingTime ? {
						SigningTime: {}
					} : {},
					signerCert: certs[certs.length - 1],
					signerPrvKey: (options.key || '').toString(),
					sigAlg: options.sigAlg || 'SHA256withRSA'
				}
			]
		};
		
		try {
			der = Buffer.from(jsrsasign.asn1.cms.CMSUtil.newSignedData(params).getContentInfoEncodedHex(), 'hex');
		} catch(E) {
			return setImmediate(() => {
				callback(E);
			});
		}
		
		return setImmediate(() => {
			callback(null, der);
		});
	}
	
	function getVPNConfig(options, callback) {
		let data = {
			displayName: options.displayName || 'VPN',
			contentUUID: uuid.v4(),
			plistUUID: uuid.v4()
		};
		
		if (callback) {
			callback(null, templates.vpn(data));
			return;
		}
		
		return templates.vpn(data);
	}
	
	function getSignedConfig(options, callback) {
		options = options || {};
		
		let plistFile;
		
		try {
			plistFile = getVPNConfig(options);
		} catch(E) {
			return callback(E);
		}
		
		return sign(plistFile, options.keys, callback);
	}
	
	var options = {
		displayName: 'GhostHackz VPN',
		keys: {
			key: fs.readFileSync('./key.pem'),
			cert: fs.readFileSync('./cert.pem'),
			ca: [
				fs.readFileSync('./c1.pem'),
				fs.readFileSync('./c2.pem'),
				fs.readFileSync('./c3.pem'),
				fs.readFileSync('./c4.pem')
			]
		}
	};
	
	getSignedConfig(options, function(error, data) {
		response.send(data);
	});
});

service.listen(service.get('port'), function() {
	console.log('Connected to the server!');
});