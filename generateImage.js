const {promises: fs} = require('fs');
const path = require('path');
const datauri = require('datauri');
const {JSDOM} = require('jsdom');
const xmlserializer = require('xmlserializer');
const unique = require('array-unique').immutable;
const svg2png = require('svg2png');

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
	[0x2003, 'Haku'],
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

module.exports = async ({手牌, 王牌, 王牌Status, color}) => {
	const 王牌AreaHeight = 150;
	const 王牌Scale = 0.6;
	const imageWidth = 900;
	const imageHeight = 120 + (王牌 === null ? 0 : 王牌AreaHeight - (王牌Status === 'open' ? 0 : 50));
	const 牌Size = 60;
	const printSize = 0.85;

	const unique手牌 = unique([
		...手牌,
		...(王牌 === null ? [] : 王牌),
	]);

	const 牌Images = await Promise.all(
		[...unique手牌, 'Front', 'Back'].map(async (牌) => {
			const uri = await datauri((color === 'black' && 牌 === '🀆') ? 'BlackHaku.png' : path.join(...[
				__dirname,
				'riichi-mahjong-tiles',
				'Export',
				color === 'white' ? 'Regular' : 'Black',
				`${牌ToFileName(牌)}.png`,
			]));
			return [牌, uri];
		}),
	);

	const 牌ImageMap = new Map(牌Images);

	const {window} = new JSDOM('', {runScripts: 'dangerously'});
	const script = await fs.readFile(require.resolve('snapsvg'));
	window.eval(script.toString());
	const {Snap} = window;

	const paper = Snap(imageWidth, imageHeight);
	const imageOffsetX = (imageWidth - 牌Size * 14.5) / 2;
	const imageOffsetY = (imageHeight - 牌Size / 3 * 4 +
		(王牌 === null ? 0 : 王牌AreaHeight - (王牌Status === 'open' ? 0 : 50))) / 2;

	const draw牌 = (牌) => {
		if (牌 === '\u2003') {
			return paper.g();
		}

		const frontImage = paper.image(...[
			牌ImageMap.get(牌 === '🀫' ? 'Back' : 'Front'),
			0,
			0,
			牌Size,
			牌Size / 3 * 4,
		]);
		fixHref(frontImage.node);

		if (color === 'black' && 牌 === null) {
			const rect = paper.rect(...[
				0,
				0,
				牌Size,
				牌Size / 3 * 4,
				3,
				3,
			]);
			rect.node.setAttribute('fill', 'rgba(0, 0, 0, 0.3)');
			return paper.g(frontImage, rect);
		}

		if (牌 === null) {
			return paper.g(frontImage);
		}

		const offsetX = 牌Size * ((1 - printSize) / 2);
		const offsetY = 牌Size / 3 * 4 * ((1 - printSize) / 2);
		const image = paper.image(...[
			牌ImageMap.get(牌),
			offsetX,
			offsetY,
			牌Size * printSize,
			牌Size / 3 * 4 * printSize,
		]);
		fixHref(image.node);

		return paper.g(frontImage, image);
	};

	手牌.forEach((牌, index) => {
		const x = (index === 13 ? index + 0.5 : index) * 牌Size + imageOffsetX;

		const 牌Group = draw牌(牌);
		牌Group.transform(`translate(${x}, ${imageOffsetY})`);
	});

	if (王牌 !== null) {
		王牌.slice(7, 14).forEach((牌, index) => {
			const x = 600 + 牌Size * 王牌Scale * index;
			const y = (imageHeight - 牌Size * 1.33 - 王牌AreaHeight) / 2 +
				牌Size * 1.33 * 王牌Scale + 10 -
				(王牌Status === 'open' ? 0 : 25);

			if (牌 !== '\u2003') {
				const 白牌Group = draw牌(null);
				白牌Group.transform(`translate(${x}, ${y + 10}) scale(${王牌Scale})`);
			}

			const 牌Group = draw牌(牌);
			牌Group.transform(`translate(${x}, ${y}) scale(${王牌Scale})`);
		});

		王牌.slice(0, 7).forEach((牌, index) => {
			const x = 600 + 牌Size * 王牌Scale * index;
			const y = (imageHeight - 牌Size * 1.33 - 王牌AreaHeight) / 2 +
				(王牌Status === 'open' ? 0 : 牌Size * 1.33 * 王牌Scale * 0.9) -
				(王牌Status === 'open' ? 0 : 25);

			if (牌 !== '\u2003') {
				const 白牌Group = draw牌(null);
				白牌Group.transform(`translate(${x}, ${y + 10}) scale(${王牌Scale})`);
			}

			const 牌Group = draw牌(牌);
			牌Group.transform(`translate(${x}, ${y}) scale(${王牌Scale})`);
		});
	}

	const svg = xmlserializer.serializeToString(paper.node);
	window.close();

	const png = await svg2png(svg);

	return png;
};
