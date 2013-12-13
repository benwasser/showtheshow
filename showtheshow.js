var fs = require('fs');
var express = require('express');
var http = require('http');
var https = require('https');
var app = express();
var server = http.createServer(app);
var cp = require('child_process');
var spawn = cp.spawn;

var password = 'password'; //CHANGE THIS MAYBE
var currently_playing = 'nothing playing';

var files = getFileList();
var omxplayer;

app.listen(80);
app.use(express.cookieParser());
app.use(express.bodyParser());

app.get('/', function (req, res) {
	fs.readFile(__dirname + '/showtheshow.html', function (err, data) {
		if (!err){
			html = data.toString('ascii');
			if (req.cookies && req.cookies.login && req.cookies.login.password && req.cookies.login.password == password){
				files = getFileList();
				html = html.replace(/{filelist}/gi, JSON.stringify(files));
				html = html.replace(/{currentlyplaying}/gi, currently_playing);
				res.send(html);
				return;
			} else {
				sendSplash(req, res);
				return;
			}
		} else {
			console.log('file not found');
		};
	});
});

app.get('/login/:password', function (req, res) {
	if (req.params && req.params.password){
		if (req.params.password == password){
			res.cookie('login', { password: password }, { expires: new Date(new Date().getTime()+99396409000) });
		}
		setTimeout(function(){
			res.redirect('/');
		},300);
	} else {
		sendSplash(req, res);
	}
});

app.post('/playtheshow', function(req, res){
	if (req.cookies && req.cookies.login && req.cookies.login.password && req.cookies.login.password == password){
		if (req.body.path){
			if (omxplayer && omxplayer.stdin){
				quitPlayer();
			}
			console.log('attempting to play ' + req.body.path);
			setTimeout(function(){
				currently_playing = req.body.path;
				omxplayer = spawn('omxplayer', ['-o', 'hdmi', req.body.path]);
				omxplayer.stdout.on('data', function (data) {
				    if (data.indexOf('nice day') != -1){
				    	quitPlayer();
				    }
				});
				res.send({ status: 202,});
			},500);
		}
	};
});

app.post('/stoptheshow', function(req, res){
	if (req.cookies && req.cookies.login && req.cookies.login.password && req.cookies.login.password == password){
		if (omxplayer && omxplayer.stdin){
			res.send({ status: 202,});
			quitPlayer();
		}
	}
});

app.post('/pausetheshow', function(req, res){
	if (req.cookies && req.cookies.login && req.cookies.login.password && req.cookies.login.password == password){
		if (omxplayer && omxplayer.stdin){
			res.send({ status: 202,});
			omxplayer.stdin.write('p');
		}
	}
});

app.post('/volup', function(req, res){
	if (req.cookies && req.cookies.login && req.cookies.login.password && req.cookies.login.password == password){
		if (omxplayer && omxplayer.stdin){
			res.send({ status: 202,});
			omxplayer.stdin.write('=');
		}
	}
});

app.post('/voldown', function(req, res){
	if (req.cookies && req.cookies.login && req.cookies.login.password && req.cookies.login.password == password){
		if (omxplayer && omxplayer.stdin){
			res.send({ status: 202,});
			omxplayer.stdin.write('-');
		}
	}
});

app.post('/scanup', function(req, res){
	if (req.cookies && req.cookies.login && req.cookies.login.password && req.cookies.login.password == password){
		if (omxplayer && omxplayer.stdin){
			res.send({ status: 202,});
			omxplayer.stdin.write('\u001b[C');
		}
	}
});

app.post('/scandown', function(req, res){
	if (req.cookies && req.cookies.login && req.cookies.login.password && req.cookies.login.password == password){
		if (omxplayer && omxplayer.stdin){
			res.send({ status: 202,});
			omxplayer.stdin.write('\u001b[D');
		}
	}
});

app.post('/togglesubs', function(req, res){
	if (req.cookies && req.cookies.login && req.cookies.login.password && req.cookies.login.password == password){
		if (omxplayer && omxplayer.stdin){
			res.send({ status: 202,});
			omxplayer.stdin.write('s');
		}
	}
});

app.post('/increasespeed', function(req, res){
	if (req.cookies && req.cookies.login && req.cookies.login.password && req.cookies.login.password == password){
		if (omxplayer && omxplayer.stdin){
			res.send({ status: 202,});
			omxplayer.stdin.write('2');
		}
	}
});

app.post('/decreasespeed', function(req, res){
	if (req.cookies && req.cookies.login && req.cookies.login.password && req.cookies.login.password == password){
		if (omxplayer && omxplayer.stdin){
			res.send({ status: 202,});
			omxplayer.stdin.write('1');
		}
	}
});

app.post('/getcurrent', function(req, res){
	if (req.cookies && req.cookies.login && req.cookies.login.password && req.cookies.login.password == password){
		res.send({ status: 202, currently_playing:currently_playing, });
	}
});

app.post('/deletedir', function(req, res){
	if (req.cookies && req.cookies.login && req.cookies.login.password && req.cookies.login.password == password){
		console.log('deleting: ' + req.body.path)
		var path = req.body.path;
		if (currently_playing.indexOf(path) != -1){
			quitPlayer();
		}
		setTimeout(function(){
			var tempfiles = [];
			if( fs.existsSync(path) ) {
				tempfiles = fs.readdirSync(path);
				tempfiles.forEach(function(file,index){
					var curPath = path + "/" + file;
					if(fs.statSync(curPath).isDirectory()) { // recurse
					    deleteFolderRecursive(curPath);
					} else { // delete file
					    fs.unlinkSync(curPath);
					}
				});
				fs.rmdirSync(path);
			}
			res.send({ status: 202,});
		},500);
	}
});

app.get('/download/:fileuuid', function (req, res) {
	if (req.cookies && req.cookies.login && req.cookies.login.password && req.cookies.login.password == password){
		if (req.params && req.params.fileuuid){
			for (var i = 0; i < files.length; i++){
				for (var j = 0; j < files[i].children.length; j++){
					if (req.params.fileuuid == files[i].children[j].uuid){
						res.download(files[i].children[j].path);
						return;
					}
				}
			}
		}
	}
});

function quitPlayer(){
	try { omxplayer.stdin.write('q') } catch(err){};
	try { omxplayer.stdin.pause() } catch(err){};
	try { omxplayer.kill() } catch(err){};
	//try { exec('pkill omxplayer', function(err, stdout, stderr){}) } catch(err){};
	omxplayer = null;
	currently_playing = 'nothing playing';
	return;
}


function sendSplash(req, res){
	res.send('Password: <input id="password" type="password" placeholder="password" /> <button onclick="window.location=\'/login/\' + document.getElementById(\'password\').value">Login</button>');
};

//http://services.tvrage.com/feeds/episodeinfo.php?show=homeland&exact=0&ep=3x1

function getFileList(){
	var acceptableExtensions = ['mp4','mkv','avi','mov','ogm'];
	var rootFolder = '/home/pi/Downloads/complete';
	var folders = fs.readdirSync(rootFolder);
	var fullList = [];
	for (var i = 0; i < folders.length; i++){
		if (fs.lstatSync(rootFolder + '/' + folders[i]).isDirectory()){
			var tempfiles = fs.readdirSync(rootFolder + '/' + folders[i]);
			fullList.push({
				path : rootFolder + '/' + folders[i],
				displayName : stripExtra(folders[i]),
				uuid : 'a' + folders[i].replace(/\W/g, ''),
				nfo : '',
				date : fs.statSync(rootFolder + '/' + folders[i]).mtime,
				children : [],
			});
			for (var j = 0; j < tempfiles.length; j++){
				if (tempfiles[j].indexOf('.') != -1 && tempfiles[j].indexOf('.sample.') == -1){
					var ext = tempfiles[j].split('.');
					ext = ext[ext.length-1];
					if (acceptableExtensions.indexOf(ext) != -1){
						fullList[fullList.length - 1].children.push({
							path : rootFolder + '/' + folders[i] + '/' + tempfiles[j],
							displayName : stripExtra(tempfiles[j]),
							type : ext,
							parentPath : rootFolder + '/' + folders[i],
							uuid : 'b' + (folders[i] + tempfiles[j]).replace(/\W/g, ''),
						});
					}
				}
			}
		}
	}
	fullList.sort(function(a,b) {
		return b.date - a.date;
	});
	return fullList;
}

function stripExtra(title){
	return title.replace(/\.hdtv-lol/ig, '').replace(/\.hdtv/ig, '').replace(/\.x264-lol/ig, '').replace(/\.x264-shitty/ig, '').replace(/\.x264/ig, '').replace(/\.xvid-afg/ig, '').replace(/\.xvid/ig, '').replace(/\.divx-deity/ig, '').replace(/\.dvdrip-diamond/ig, '').replace(/\.dvdrip/ig, '').replace(/\.avi/ig, '').replace(/\.mp4/ig, '').replace(/\.mkv/ig, '').replace(/\.mov/ig, '').replace(/\.ogm/ig, '').replace(/\./ig, ' ');
}

process.on('exit', function (){
	exitApp();
});
process.on('SIGINT', function () {
	exitApp();
});

function exitApp(){
	console.log('Quitting showtheshow');
	quitPlayer();
	process.exit();
}
