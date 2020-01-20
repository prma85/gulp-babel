'use strict';
const path = require('path');
const assert = require('assert');
const Vinyl = require('vinyl');
const sourceMaps = require('gulp-sourcemaps');
const babel = require('./src');

it('should transpile with Babel', cb => {
	const stream = babel();

	stream.on('data', file => {
		assert(/var foo/.test(file.contents.toString()), file.contents.toString());
		assert.strictEqual(file.relative, 'fixture.js');
	});

	stream.on('end', cb);

	stream.write(new Vinyl({
		cwd: __dirname,
		base: path.join(__dirname, 'fixture'),
		path: path.join(__dirname, 'fixture/fixture.jsx'),
		contents: Buffer.from('let foo;')
	}));

	stream.end();
});

it('should generate source maps', cb => {
	const init = sourceMaps.init();
	const write = sourceMaps.write();
	init
		.pipe(babel())
		.pipe(write);

	write.on('data', file => {
		assert.deepStrictEqual(file.sourceMap.sources, ['fixture.es6']);
		assert.strictEqual(file.sourceMap.file, 'fixture.js');
		const contents = file.contents.toString();
		assert(/function/.test(contents));
		assert(/sourceMappingURL/.test(contents));
		cb();
	});

	init.write(new Vinyl({
		cwd: __dirname,
		base: path.join(__dirname, 'fixture'),
		path: path.join(__dirname, 'fixture/fixture.es6'),
		contents: Buffer.from('[].map(v => v + 1)'),
		sourceMap: ''
	}));

	init.end();
});

it('should list used helpers in file.babel', cb => {
	const stream = babel();

	stream.on('data', file => {
		assert.deepStrictEqual(file.babel.usedHelpers, ['class-call-check']);
	});

	stream.on('end', cb);

	stream.write(new Vinyl({
		cwd: __dirname,
		base: path.join(__dirname, 'fixture'),
		path: path.join(__dirname, 'fixture/fixture.js'),
		contents: Buffer.from('class MyClass {};')
	}));

	stream.end();
});
