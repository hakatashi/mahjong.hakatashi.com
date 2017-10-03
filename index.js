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
		const png = await generateImage(Array.from(request.params.pais)).catch((i) => console.log(i));
		reply(png).type('image/png');
	},
})

hapi.start((error) => {
	if (error) {
		console.error(error);
	}

	console.log(`Server running at: ${hapi.info.uri}`);
});
