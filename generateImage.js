const path = require('path');
const jsdom = require('jsdom/lib/old-api');
const {promise: datauri} = require('datauri');
const xmlserializer = require('xmlserializer');
const unique = require('array-unique').immutable;
const svg2png = require('svg2png');

const imageWidth = 900;
const imageHeight = 150;
const 手牌ize = 60;
const printSize = 0.85;

const fileNameMap = new Map([
	...([
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
	].map((name, index) => [index + 0x1F000, name])),
	[0x1F02B, 'Haku'],
]);

const 牌ToFileName = (牌) => {
	const fileName = fileNameMap.get(牌.codePointAt(0)) || 牌;

	if (Array.from(牌)[1] === '\uFE00') {
		return `${fileName}-Dora`;
	}

	return fileName;
};

const fixHref = (node) => {
	node.setAttribute('xlink:href', node.getAttribute('href'));
};

module.exports = async ({手牌}) => {
	const unique手牌 = unique(手牌);

	const 牌Images = await Promise.all(
		[...unique手牌, 'Front', 'Back'].map(async (牌) => {
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
	const imageOffsetX = (imageWidth - 手牌ize * 14.5) / 2;
	const imageOffsetY = (imageHeight - 手牌ize / 3 * 4) / 2;

	手牌.forEach((牌, index) => {
		const x = (index === 13 ? index + 0.5 : index) * 手牌ize + imageOffsetX;

		const frontImage = paper.image(...[
			牌ImageMap.get(牌.codePointAt(0) === 0x1F02B ? 'Back' : 'Front'),
			x,
			imageOffsetY,
			手牌ize,
			手牌ize / 3 * 4,
		]);
		fixHref(frontImage.node);

		const offsetX = 手牌ize * ((1 - printSize) / 2);
		const offsetY = 手牌ize / 3 * 4 * ((1 - printSize) / 2);
		const image = paper.image(...[
			牌ImageMap.get(牌),
			x + offsetX,
			imageOffsetY + offsetY,
			手牌ize * printSize,
			手牌ize / 3 * 4 * printSize,
		]);
		fixHref(image.node);
	});

	const svg = xmlserializer.serializeToString(paper.node);
	window.close();

	const png = await svg2png(svg);

	return png;
};
