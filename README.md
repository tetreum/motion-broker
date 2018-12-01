# Motion broker

This app acts as broker, receiving requests to record from ipcameras and using vlc to record them.

Oldest records will be deleted automatically. Check [config.demo.js](https://github.com/tetreum/motion-broker/blob/master/conf.demo.js) do see the available options.

Has only been tested with a Xiaomi Dafang in Windows.


## Requirements
- node >= v8
- VLC
- Windows? (Should work on linux too, but i didn't test it)

## Setup

1. Copy conf.demo.js to conf.js
2. Edit conf.js
3. Start the app with `node index.js`

## Usage

Whenever one of your cameras detects motion it should query: `http://WHERE_THIS_APP_IS:3001/start` so system can start recording. Example:
`curl http://192.168.0.155:3001/start 2>/dev/null`

`/start` will return a json containing file's name where the recording is begin saved.

If you're using a middle device to make the request/debbugging, you should point to `http://WHERE_THIS_APP_IS:3001/start?ip=CAMERA_IP` as by default it will try to get the stream from requester's ip.

### Motion detection triggered recording script for Xiaomi Dafang hacked
Your Dafang must have https://github.com/EliasKotlyar/Xiaomi-Dafang-Hacks firmware.

File path:`config/userscripts/motiondetection/startRecording.sh`

Content:
```sh
#!/bin/sh
if [ "$1" == "on" ]; then
    response=$(/system/sdcard/bin/curl http://WHERE_THIS_APP_IS:3001/start 2>/dev/null)
	echo "$response"
elif [ "$1" == "off" ]; then
	response=$(/system/sdcard/bin/curl http://WHERE_THIS_APP_IS:3001/stop 2>/dev/null)
	echo "$response"
fi
```
