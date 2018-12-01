module.exports = {
    port: 3001,
    recordLength: 120, // seconds (duration per file)
    maxSpace: 10, // gigabytes (max space records folder can occupy, oldest records will be removed if maxSpace is reached)
    daysToRemoveRecording: 7, // days will take a record from begin deleted (younger files may STILL be deleted if maxSpace is reached)
    recordsFolder: "D:\\cameras", // MUST NOT end with \\
    vlcPath: 'C:\\Program Files\\VideoLAN\\VLC\\vlc.exe'
}
