const { exec } = require('child_process');
const http = require('http');
const Url = require('url');
const fs = require('fs');

const helper = require('./helper');
const conf = require('./conf');

let isRecording = false;
let lastRecordAttempt;

const reply = (res, rep, isError) => {
	res.setHeader('Content-Type', 'application/json');
	res.end(JSON.stringify({
		error: !(typeof isError === "undefined"),
		message: rep
	}));
}

const getCallerIP = (request) => {
	var ip = request.headers['x-forwarded-for'] ||
		request.connection.remoteAddress ||
		request.socket.remoteAddress ||
		request.connection.socket.remoteAddress;
	ip = ip.split(',')[0];
	ip = ip.split(':').slice(-1)[0]; //in case the ip returned in a format: "::ffff:146.xxx.xxx.xxx"
	return ip;
}

const startRecording = (ip) => {
	if (isRecording) {
		helper.log("info", "Already recording");
		lastRecordAttempt = new Date().getTime();
		return;
	}
	isRecording = true;

	helper.log("info", "Recording from " + ip);

	let date = new Date(),
		fileName = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + "__" + date.getHours() + "_" + date.getMinutes() + "_" + date.getSeconds() + ".mpg";

	exec('"' + conf.vlcPath + '" -vvv --network-caching 2000 -I dummy rtsp://' + ip + ':8554/unicast --run-time=' + conf.recordLength + ' --sout=file/ts:' + conf.recordsFolder + '\\' + fileName + ' vlc://quit', () => {
		isRecording = false;
		helper.log("info", "Recording finished");

		reviewOccupiedSpace();

		let secondsSinceLastAttempt = Math.abs((new Date().getTime() - lastRecordAttempt) / 1000);

		// cam tried to record aka kept detecting motion less than 60s ago,
		// so lets start recording again to ensure we don't lose anything important
		if (secondsSinceLastAttempt < 60) {
			startRecording(ip);
		}
	});

	return fileName;
}

const stopRecording = () => {
	// i tried to find a way to gracefully tell to vlc to stop the ongoing recording
	// but i failed to as vlc ignores gracefully request.
	// tasklist /v /fo csv | findstr /i "vlc"
	// exec('taskkill /pid 1234');
}

const setMaintenanceCron = () => {
	setTimeout(() => {
		helper.log("info", "Starting maintenance cron");

		let file,
			cDate,
			currentDate = new Date().getTime(),
			files = helper.getAllFiles(conf.recordsFolder);

		for(let k in files) {
			file = files[k];
			cDate = new Date(fs.statSync(file).ctime);

			if ((Math.abs((currentDate - cDate.getTime()) / 1000) / 60) / 60 / 24 >= conf.daysToRemoveRecording) {
				try {
	                fs.unlinkSync(file);
	            } catch (e) {
	                helper.log("error", "Could not remove " + file + " : " + e.message);
	            }
			}
		}
		setMaintenanceCron();
	}, 1000 * 60 * 60 * 24);
}

const reviewOccupiedSpace = () => {
	let files = helper.getAllFiles(conf.recordsFolder),
		createdList = [],
		stats,
		parsedSize,
		totalSize = 0;

	for(let k in files) {
		file = files[k];
		stats = fs.statSync(file);

		totalSize += stats.size;
		createdList.push({
			file: file,
			size: stats.size,
			date: new Date(stats.ctime).getTime()
		});
	}

	parsedSize = helper.formatBytes(totalSize);

	if (parsedSize.unit == "GB" && parsedSize.amount >= conf.maxSpace) {
		helper.log("info", "Max space reached, time to delete oldest files (" + parsedSize.amount + " " + parsedSize.unit + ")");

		totalSize -= 1073741824 * conf.maxSpace;

		// sort by date to delete the oldest ones
		createdList.sort((a, b) => {
			if (a.date > b.date) {
				return 1;
			} else if (a.date < b.date) {
				return -1;
			}
			return 0;
		});

		for(let k in createdList) {
			file = createdList[k];

			try {
				fs.unlinkSync(file.file);

				totalSize -= file.size;
			} catch (e) {
				helper.log("error", "Could not remove " + file.file + " : " + e.message);
			}

			if (totalSize < 1) {
				helper.log("info", "Cleanup completed");
				break;
			}
		}
	}
}

const server = http.createServer(async (req, res) => {
	res.statusCode = 200;
	let parsedUrl = Url.parse(req.url, true);
	let ip = getCallerIP(req);

	if (typeof parsedUrl.query.ip !== "undefined") {
		ip = parsedUrl.query.ip;
	}

	switch (parsedUrl.pathname.substr(1)) {
	  case "start":
		helper.log("info", "Order to start received from " + ip);
		return reply(res, startRecording(ip));
	  break;
	  case "stop":
		helper.log("info", "Order to stop received from " + ip);
		lastRecordAttempt = new Date().getTime();
		return reply(res, "stopping");
	  break;
	  default:
		return reply(res, "path not defined", true);
	  break;
	}
 });
 server.on('clientError', function(err, socket) {
	 socket.destroy();
 });
 server.listen(conf.port, () => {
	 helper.log("info", `Motion broker started on port ${conf.port}`);

	 setMaintenanceCron();
	 reviewOccupiedSpace();
 });
