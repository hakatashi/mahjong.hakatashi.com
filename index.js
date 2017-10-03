const assert = require('assert');
const Hapi = require('hapi');
const generateImage = require('./generateImage.js');

const hapi = new Hapi.Server();
hapi.connection({
	port: 8080,
});

hapi.route({
	method: 'GET',
	path: '/images/{pais}',
	handler: async (request, reply) => {
		const 牌s = Array.from(request.params.pais);

		try {
			assert(牌s.length !== 0);
			assert(牌s.length <= 14);
			assert(牌s.every((牌) => (
				0x1F000 <= 牌.codePointAt(0) && 牌.codePointAt(0) <= 0x1F021
			)));
		} catch (error) {
			return reply(`Bad Request: ${error.message}`).code(400);
		}

		const png = await generateImage(Array.from(request.params.pais)).catch((i) => console.log(i));
		return reply(png).type('image/png');
	},
});

hapi.start((error) => {
	if (error) {
		console.error(error);
	}

	console.log(`Server running at: ${hapi.info.uri}`);
});
