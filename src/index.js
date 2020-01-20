'use strict';
const through = require('through2');
const applySourceMap = require('vinyl-sourcemaps-apply');
const objectAssign = require('object-assign');
const replaceExt = require('replace-ext');
const babel = require('babel-core');
const PluginError = require('plugin-error');

module.exports = function (opts) {
	opts = opts || {};

	return through.obj(function (file, enc, cb) {
		if (file.isNull()) {
			cb(null, file);
			return;
		}

		if (file.isStream()) {
			cb(new PluginError('gulp-babel', 'Streaming not supported'));
			return;
		}

		try {
			const fileOpts = objectAssign({}, opts, {
				filename: file.path,
				filenameRelative: file.relative,
				sourceMap: Boolean(file.sourceMap)
			});

			const res = babel.transform(file.contents.toString(), fileOpts);

			if (file.sourceMap && res.map) {
				res.map.file = replaceExt(res.map.file, '.js');
				applySourceMap(file, res.map);
			}

			file.contents = Buffer.from(res.code);
			file.path = replaceExt(file.path, '.js');
			file.babel = res.metadata;

			this.push(file);
		} catch (error) {
			this.emit('error', new PluginError('gulp-babel', error, {
				fileName: file.path,
				showProperties: false
			}));
		}

		cb();
	});
};
