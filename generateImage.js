const jsdom = require('jsdom/lib/old-api');
const {promise: datauri} = require('datauri');
const xmlserializer = require('xmlserializer');
const unique = require('array-unique').immutable;
const svg2png = require('svg2png');
const fs = require('fs');

const imageWidth = 900;
const imageHeight = 250;
const 牌Size = 60;
const printSize = 0.85;

const fileNames = [
	'Ton',
	'Nan',
	'Shaa',
	'Pei',
	'Chun',
	'Hatsu',
	'Haku',
	...(Array.from({length: 9}, (e, i) => `Man${i + 1}`)),
	...(Array.from({length: 9}, (e, i) => `Sou${i + 1}`)),
	...(Array.from({length: 9}, (e, i) => `Pin${i + 1}`)),
];

const 牌ToFileName = (牌) => (
	fileNames[牌.codePointAt(0) - 0x1F000] || 牌
);

const fixHref = (node) => {
	node.setAttribute('xlink:href', node.getAttribute('href'));
};

module.exports = async (牌s) => {
	const unique牌s = unique(牌s);

	const 牌Images = await Promise.all(
		[...unique牌s, 'Front'].map((牌) => (
			datauri(`${__dirname}/riichi-mahjong-tiles/Export/Regular/${牌ToFileName(牌)}.png`).then(uri => [牌, uri])
		))
	);

	const 牌ImageMap = new Map(牌Images);

	const window = await new Promise((resolve, reject) => {
		jsdom.env('', [require.resolve('snapsvg')], (error, window) => {
			if (error) {
				reject(error);
			} else {
				resolve(window);
			}
		});
	});

	const {Snap, document} = window;

	const paper = Snap(imageWidth, imageHeight);
	const imageOffsetX = (imageWidth - 牌Size * 14.5) / 2;
	const imageOffsetY = (imageHeight - 牌Size / 3 * 4) / 2;

	牌s.forEach((牌, index) => {
		const x = (index === 13 ? index + 0.5 : index) * 牌Size + imageOffsetX;

		const frontImage = paper.image(牌ImageMap.get('Front'), x, imageOffsetY, 牌Size, 牌Size / 3 * 4);
		fixHref(frontImage.node)

		const offsetX = 牌Size * ((1 - printSize) / 2);
		const offsetY = 牌Size / 3 * 4 * ((1 - printSize) / 2);
		const image = paper.image(牌ImageMap.get(牌), x + offsetX, imageOffsetY + offsetY, 牌Size * printSize, 牌Size / 3 * 4 * printSize);
		fixHref(image.node)

		if (Math.random() < 0.5) {
			image.transform(Snap.matrix().rotate(180, x + 牌Size / 2, imageOffsetY + 牌Size / 3 * 2));
		}
	});

	const license = paper.text(imageWidth - 10, imageHeight - 10, 'Images of Mahjong Tiles by FluffyStuff licensed under CC BY 4.0');
	license.attr({
		textAnchor: 'end',
		fill: '#b93c3c',
		fontSize: '12px',
		fontFamily: 'sans-serif',
	});

	const svg = xmlserializer.serializeToString(paper.node);
	window.close();

	const png = await svg2png(svg);

	return png;
};
