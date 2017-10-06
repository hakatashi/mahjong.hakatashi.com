module.exports.split牌s = (牌s) => {
	const characters = Array.from(牌s);

	characters.forEach((character, index) => {
		if (character === '\uFE00') {
			characters[index - 1] += character;
			characters[index] = null;
		}
	});

	return characters.filter((character) => character !== null);
};
