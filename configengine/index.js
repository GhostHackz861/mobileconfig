'use strict';

const handlebars = require('handlebars');
const jsrsasign = require('jsrsasign');
const uuid = require('uuid');
const fs = require('fs');

const templates = {
		vpn: handlebars.compile(fs.readFileSync('./vpn.plist', 'utf-8'))
};

module.exports = {
	sign(value, options, callback) {
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
	},
	
	getVPNConfig(options, callback) {
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
	},
	
	getSignedConfig(options, callback) {
		options = options || {};
		
		let plistFile;
		
		try {
			plistFile = module.exports.getVPNConfig(options);
		} catch(E) {
			return callback(E);
		}
		
		return module.exports.sign(plistFile, options.keys, callback);
	}
};