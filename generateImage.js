const path = require('path');
const jsdom = require('jsdom/lib/old-api');
const {promise: datauri} = require('datauri');
const xmlserializer = require('xmlserializer');
const unique = require('array-unique').immutable;
const svg2png = require('svg2png');

const imageWidth = 900;
const imageHeight = 150;
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

const 牌ToFileName = (牌) => {
	const fileName = fileNames[牌.codePointAt(0) - 0x1F000] || 牌;

	if (Array.from(牌)[1] === '\uFE00') {
		return `${fileName}-Dora`;
	}

	return fileName;
};

const fixHref = (node) => {
	node.setAttribute('xlink:href', node.getAttribute('href'));
};

module.exports = async (牌s) => {
	const unique牌s = unique(牌s);

	const 牌Images = await Promise.all(
		[...unique牌s, 'Front'].map(async (牌) => {
			const uri = await datauri(path.join(...[
				__dirname,
				'riichi-mahjong-tiles',
				'Export',
				'Regular',
				`${牌ToFileName(牌)}.png`,
			]));
			return [牌, uri];
		})
	);

	const 牌ImageMap = new Map(牌Images);

	const window = await new Promise((resolve, reject) => {
		jsdom.env('', [require.resolve('snapsvg')], (error, windowObject) => {
			if (error) {
				reject(error);
			} else {
				resolve(windowObject);
			}
		});
	});

	const {Snap} = window;

	const paper = Snap(imageWidth, imageHeight);
	const imageOffsetX = (imageWidth - 牌Size * 14.5) / 2;
	const imageOffsetY = (imageHeight - 牌Size / 3 * 4) / 2;

	牌s.forEach((牌, index) => {
		const x = (index === 13 ? index + 0.5 : index) * 牌Size + imageOffsetX;

		const frontImage = paper.image(牌ImageMap.get('Front'), x, imageOffsetY, 牌Size, 牌Size / 3 * 4);
		fixHref(frontImage.node);

		const offsetX = 牌Size * ((1 - printSize) / 2);
		const offsetY = 牌Size / 3 * 4 * ((1 - printSize) / 2);
		const image = paper.image(牌ImageMap.get(牌), x + offsetX, imageOffsetY + offsetY, 牌Size * printSize, 牌Size / 3 * 4 * printSize);
		fixHref(image.node);
	});

	const svg = xmlserializer.serializeToString(paper.node);
	window.close();

	const png = await svg2png(svg);

	return png;
};
