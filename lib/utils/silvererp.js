/**
 * Copyright 2018 yQ-it GmbH
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

const requestSimple = require('request-promise');
const request = require('request-promise').defaults({ simple: false, resolveWithFullResponse: true });
const BASE_URI = 'http://yq.dyndns.org/SilvERP-OIH/index.php?rest&oih&rt=RestOih&command=';

//Helper to get Token from SilvERP
async function getToken(config) {
	const options = {
		uri: `${BASE_URI}connect`,
		json: true,
		headers: {
			'X-API-KEY': config.apiKey
		}
	};
	try {
		const tokenRequest = await requestSimple.post(options);
		const { token } = tokenRequest;
		return token;
	} catch (err) {
		return err;
	}

};



async function getEntries(token, type) {
	let command = '';
	let result = [];
	switch (type) {
		case 'address':
			command = 'getAdresses';
			break;
		case 'organisation':
			command = 'getOrganisations';
			break;
		case 'product':
			command = 'getProducts';
			break;
		case 'country':
			command = 'getCountries';
			break;
		case 'unit':
			command = 'getUnits';
			break;
		default:
			command = 'notImplemented';
			break;
	}
	const options = {
		uri: `${BASE_URI}${command}`,
		json: true,
		headers: {
			Authorization: `Bearer ${token}`,
		}
	};
	const entries = await request.get(options);
	if (Object.entries(entries.body).length === 0 && entries.body.constructor === Object) {
		return false;
	}
	entries.body.data.filter((elem) => {
		return result.push(elem);
	});
	return result;
}


/**
 * @desc Upsert function which creates or updates
 * an object, depending on certain conditions
 *
 * @access  Private
 * @param {Object} msg - the whole incoming object
 * @param {String} token - token from Snazzy Contacts
 * @param {Boolean} objectExists - ig the object was found
 * @param {String} type - object type - 'person' or 'organization'
 * @param {Object} meta -  meta object containg meta inforamtion
 * @return {Object} - the new created ot update object in Snazzy Contacts
 */
async function upsertObject(data, token, objectExists, type, applicationUid) {
	if (!type) {
		return false;
	}

	let uri;
	let method;

	//if (objectExists) {
	// Update the object if it already exists
	//method = 'PUT';
	//uri = `${BASE_URI}updateProduct`;
	//newObject = prepareObject(msg, type);
	//} else {
	// Create the object if it does not exist

	method = 'POST';

	switch (type) {
		case 'article':
			uri = `${BASE_URI}upsertProduct`;
			break;
		case 'productGroup':
			uri = `${BASE_URI}upsertProductGroup`;
			break;
		case 'unit':
			uri = `${BASE_URI}upsertUnit`;
			break;
		case 'country':
			uri = `${BASE_URI}upsertCountries`;
			break;
		case 'address':
			uri = `${BASE_URI}upsertAddresses`;
			break;
		default:
			uri = `${BASE_URI}R.I.P`;
			break;
	}

	let newObject = data;
	newObject.applicationUid = applicationUid;
	newObject.context = type;

	try {
		const options = {
			method,
			uri,
			json: true,
			headers: {
				Authorization: `Bearer ${token}`,
			},
			body: newObject
		};
		const object = await request(options);
		return object;
	} catch (e) {
		return e;
	}
}

module.exports = {
	getToken,
	upsertObject,
	getEntries
};