const fs = require('fs');
const path = require('path');

/**
 * Find all files inside a dir, recursively.
 * @function getAllFiles
 * @param  {string} dir Dir path string.
 * @return {string[]} Array with all file names that are inside the directory.
 */
const getAllFiles = dir =>
  fs.readdirSync(dir).reduce((files, file) => {
    const name = path.join(dir, file);
    const isDirectory = fs.statSync(name).isDirectory();
    return isDirectory ? [...files, ...getAllFiles(name)] : [...files, name];
}, []);

const log = (type, message) => {
	let d = new Date();

	message = "[" + d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate() + " " + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds() + "] - " + type.toUpperCase() + " - " + message;

	console.log(message);
}

const formatBytes = (a, b) => {
    if (0 == a) {
		return {
			amount: 0,
			unit: "B",
		};
	}
    let c = 1024,
        d = b || 2,
        e = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"],
        f = Math.floor(Math.log(a) / Math.log(c));

    return {
		amount: parseFloat((a / Math.pow(c, f)).toFixed(d)),
		unit: e[f]
	}
}


module.exports = {
	log,
    getAllFiles,
	formatBytes
}
