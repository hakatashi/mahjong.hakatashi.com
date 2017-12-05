const assert = require('assert');
const Hapi = require('hapi');
const generateImage = require('./generateImage.js');
const {split牌s} = require('./util.js');

const isValid牌 = (牌) => (
	Array.from(牌).length === 1 && (
		(牌.codePointAt(0) >= 0x1F000 && 牌.codePointAt(0) <= 0x1F021) ||
		牌.codePointAt(0) === 0x1F02B ||
		牌.codePointAt(0) === 0x2003
	)
);

const hapi = new Hapi.Server();
hapi.connection({
	port: parseInt(process.env.PORT) || 8080,
});

hapi.on('response', (request) => {
	console.log('%s: %s %s --> %s', ...[
		new Date().toISOString(),
		request.method.toUpperCase(),
		request.url.path,
		request.response.statusCode,
	]);
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
				const variation = Array.from(牌String).slice(1).join('');

				return isValid牌(牌) && variation.match(/^\uFE00?[\uFE01-\uFE04]?$/);
			}));
		} catch (error) {
			return reply(`Bad Request: ${error.message}`).code(400);
		}

		const 王牌 = (() => {
			if (!request.query.王牌) {
				return null;
			}

			const temporary牌s = split牌s(request.query.王牌);

			assert.notEqual(temporary牌s.length, 0);
			assert(temporary牌s.length <= 14);
			assert(temporary牌s.every((牌String) => {
				const 牌 = Array.from(牌String)[0];
				const variation = Array.from(牌String).slice(1).join('');

				return isValid牌(牌) && variation.match(/^\uFE00?[\uFE01-\uFE04]?$/);
			}));

			return [...temporary牌s, ...new Array(14 - temporary牌s.length).fill('🀫')];
		})();

		const 副露s = (() => {
			if (!request.query.副露) {
				return [];
			}

			const temprary副露s = Array.isArray(request.query.副露) ? request.query.副露 : [request.query.副露];

			assert(temprary副露s.length <= 4);

			for (const 副露 of temprary副露s) {
				const temporary牌s = split牌s(副露);

				assert.notEqual(temporary牌s.length, 0);
				assert(temporary牌s.length <= 4);
				assert(temporary牌s.every((牌String) => {
					const 牌 = Array.from(牌String)[0];
					const variation = Array.from(牌String).slice(1).join('');

					return isValid牌(牌) && variation.match(/^\uFE00?[\uFE01-\uFE04]?$/);
				}));
			}

			return temprary副露s;
		})();

		const png = await generateImage({
			手牌: split牌s(request.params.pais),
			王牌,
			王牌Status: request.query.王牌Status === 'open' ? 'open' : 'normal',
			副露s,
		}).catch((i) => console.log(i));
		return reply(png).type('image/png');
	},
});

hapi.start((error) => {
	if (error) {
		console.error(error);
	}

	console.log(`Server running at: ${hapi.info.uri}`);
});
