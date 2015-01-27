//var seq = require('./CSDataModel.js').sequelize;
var User = require('./CSDataModel.js').User;
//var sleep = require('sleep');
var http = require('http');

var count = 0;
//var stopwatch = Stopwatch.create();
//stopwatch.start();

var searchRecord = function(usr11, pass22)
{

    //var pas = pass22
    User
        .find({ where: { Username: usr11 } && {Pwd : pass22} })
        .complete(function(err, usr) {
            if (!!err) {
                console.log('An error occurred while searching for ' + usr + ' : ', err)
            } else if (!usr) {
                console.log('No user with the username "john-doe" has been found.')
            } else
            {
                console.log('Hello ' + usr.Username + '!');
                count++;
                if(count == 499)
                {
                    //stopwatch.stop();
                    //console.log("milliseconds: " + stopwatch.elapsedMilliseconds);

                }
            }
        })
};


for(var i = 0; i<500; i++)
{
    console.log(i);
    //addRecord("user" + i, i);
    searchRecord("user" + i, i.toString());
}

//sequelize.authenticate().complete(function(err) {
//        if (!!err)
//        {
//            console.log('Unable to connect to the database:', err)
//        }
//        else
//        {
//            //createDB();
//            console.log('Connection has been established successfully.')
//        }
//   });

var createDB = function(){
    sequelize
        .sync({ force: false })
        .complete(function(err) {
            if (!!err) {
                console.log('An error occurred while creating the table:', err)
            }
            else
            {
                console.log('It worked!')
                //addRecord();
            }
        });
};

var addRecord = function(usrnm, pass)
{
    var user = User.build({
        Username: usrnm,
        Pwd: pass
    });

    user
        .save()
        .complete(function(err) {
            if (!!err) {
                console.log('The instance has not been saved:', err);
            } else {
                console.log('We have a persisted instance now');
                //searchRecord();
            }
        })
};



http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Hello World\n');
}).listen(1337, '127.0.0.1');
console.log('Server running at http://127.0.0.1:1337/');