const assert = require('assert');
const Hapi = require('hapi');
const generateImage = require('./generateImage.js');
const {split牌s} = require('./util.js');

const hapi = new Hapi.Server();
hapi.connection({
	port: parseInt(process.env.PORT) || 8080,
});

hapi.on('response', (request) => {
	console.log(`${new Date().toISOString()}: ${request.method.toUpperCase()} ${request.url.path} --> ${request.response.statusCode}`);
});

hapi.route({
	method: 'GET',
	path: '/images/{pais}',
	handler: async (request, reply) => {
		const 牌s = split牌s(request.params.pais);

		try {
			assert.notEqual(牌s.length, 0);
			assert(牌s.length <= 14);
			assert(牌s.every((牌String) => {
				const 牌 = Array.from(牌String)[0];
				const variation = Array.from(牌String)[1];

				return 牌.codePointAt(0) >= 0x1F000 && 牌.codePointAt(0) <= 0x1F021 &&
				(variation === undefined || variation === '\uFE00');
			}));
		} catch (error) {
			return reply(`Bad Request: ${error.message}`).code(400);
		}

		const png = await generateImage(split牌s(request.params.pais)).catch((i) => console.log(i));
		return reply(png).type('image/png');
	},
});

hapi.start((error) => {
	if (error) {
		console.error(error);
	}

	console.log(`Server running at: ${hapi.info.uri}`);
});
