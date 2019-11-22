/* eslint no-param-reassign: "off" */

/**
 * Copyright 2019 Wice GmbH

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

const Q = require('q');
const { getToken } = require('./../utils/silvererp');
const { messages } = require('elasticio-node');
const request = require('request-promise').defaults({ simple: false, resolveWithFullResponse: true });
const uri = 'http://yq.dyndns.org/SilvERP-OIH/index.php?rest&oih&rt=RestOih&command=getPersons';


/**
 * This method will be called from OIH platform providing following data
 *
 * @param msg - incoming message object that contains ``body`` with payload
 * @param cfg - configuration that is account information and configuration field values
 * @param snapshot - saves the current state of integration step for the future reference
 */
async function processTrigger(msg, cfg, snapshot = {}) {
	const self = this;
	const token = await getToken(cfg);

	// Set the snapshot if it is not provided
	snapshot.lastUpdated = snapshot.lastUpdated || (new Date(0)).getTime();

	async function emitData() {
		const options = {
			uri,
			json: true,
		};

		try {
			//Request Data from SilvERP
			const entries = await request.get(options);

			if (Object.entries(entries.body).length === 0 && entries.body.constructor === Object) {
				console.error('No Data received');
				return false;
			}

			//Go through received Data and emit each object
			entries.body.data.filter((elem) => {
				const newElement = {};
				newElement.meta = elem.rowid;
				newElement.data = elem;
				self.emit('data', messages.newMessageWithBody(newElement));
			});
			
			self.emit('snapshot', snapshot);
		} catch (e) {
			throw new Error(e);
		}
	}
	/**
	 * This method will be called from OIH platform if an error occured
	 *
	 * @param e - object containg the error
	 */
	function emitError(e) {
		console.log(`ERROR: ${e}`);
		self.emit('error', e);
	}

	/**
	 * This method will be called from OIH platform
	 * when the execution is finished successfully
	 *
	 */
	function emitEnd() {
		console.log('Finished execution');
		self.emit('end');
	}

	Q()
		.then(emitData)
		.fail(emitError)
		.done(emitEnd);
}


module.exports = {
	process: processTrigger,
};