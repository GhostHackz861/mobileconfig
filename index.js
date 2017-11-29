'use strict';

const express = require('express');
const ua = require('ua-parser');
const handlebars = require('handlebars');
const jsrsasign = require('jsrsasign');
const uuid = require('uuid');
const fs = require('fs');
const url = require('url');
const service = express();

service.set('port', (process.env.PORT || 3000));
service.set('views', __dirname + '/views');
service.set('view engine', 'pug');
service.use(express.favicon());
service.use(function(request, response, callback) {
	var data = '';
	request.setEncoding('utf-8');
	request.on('data', function(chunk) {
		data += chunk;
	});
	request.on('end', function() {
		request.rawBody = data;
		callback();
	});
});
service.use(express.bodyParser());
service.use(express.methodOverride());
service.use(express.cookieParser('awesomekeyfortoomuchfun'));
service.use(express.static(path.join(__dirname, 'public')));

const templates = {
		config: handlebars.compile(fs.readFileSync('./template.plist', 'utf-8'))
};

service.get('/', function(request, response) {
	var r = ua.parse(request.headers['user-agent']);
	
	if (r.os.family != 'iOS') {
		response.render('notios', { title: 'Not an iOS Device!' });
	} else {
		if (request.cookies.uuid) {
			response.redirect('/enrollment');
		} else {
			response.render('index', { title: 'Get Device UUID'});
		}
	}
});

service.get('/enrollment', function(request, response) {
	response.setHeader('Content-Type', 'text/html');
	
	var url_parts = url.parse(request.url, true);
	var query = url_parts.query;
	
	var tudid = query.udid;
	if (tudid) {
		response.cookie('udid', query.udid, { maxAge: 365 * 24 * 60 * 60 * 1000 });
		response.redirect('/enrollment');
	} else {
		if (request.cookies.udid) {
			response.render('udid', { udid: request.cookies.udid, title: 'UDID' });
		} else {
			response.render('/');
		}
	}
});

service.post('/enroll', function(request, response) {
	var match = request.rawBody.match(/[a-f\d]{40}/);
	response.redirect(301, '/enrollment?udid=' + match[0]);
});

service.get('/sign/:displayName', function(request, response) {
	response.setHeader('Content-Type', 'application/x-apple-aspen-config');
	
	function sign(value, options, callback) {
		options = options || {};
		
		let certs = [];
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
	
	function getConfig(options, callback) {
		let data = {
			displayName: options.displayName || 'Configuration',
			contentUUID: uuid.v4(),
			plistUUID: uuid.v4(),
			certUUID: uuid.v4()
		};
		
		if (callback) {
			callback(null, templates.config(data));
			return;
		}
		
		return templates.config(data);
	}
	
	function getSignedConfig(options, callback) {
		options = options || {};
		
		let plistFile;
		
		try {
			plistFile = getConfig(options);
		} catch(E) {
			return callback(E);
		}
		
		return sign(plistFile, options.keys, callback);
	}
	
	var options = {
		displayName: request.params.displayName,
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