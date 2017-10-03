const Hapi = require('hapi');

const hapi = new Hapi.Server();
hapi.connection({
	port: 8080,
	host: 'localhost',
});

hapi.start((error) => {
	if (error) {
		console.error(error);
	}

	console.log(`Server running at: ${hapi.info.uri}`);
});
