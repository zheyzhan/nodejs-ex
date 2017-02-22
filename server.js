var express = require('express');
var app = express();
var MongoClient=require('mongodb').MongoClient;
var STR='mongodb://localhost:27017/';
//get# http://localhost:8081/users/zf
//post# http://localhost:8081/users?name=lx&password=536321&username=lx&created=201702180000
//delete# http://localhost:8081/users/zf
//put# http://localhost:8081/users/id=7?username=lx&password=123456
app.use(express.static('public'));
app.get('/users', function (req, res) {
   MongoClient.connect(STR,function(err,db)
  {
   console.log("connect successfully!");
    var myDB=db.db("web");
    var da;
    myDB.collection("users",function(err,collection)
    {
         getAll(collection,function(da) {
          console.log(da); 
           res.json(da);
           res.status(200);
           res.end();
           myDB.close();
        });
        
    });
    
  });
})

app.get('/users/[a-zA-z]+', function (req, res) {
     var username=(req.path).substring(7);
     MongoClient.connect(STR,function(err,db)
  {
   //console.log("connect successfully!");
    var myDB=db.db("web");
    var da;
    myDB.collection("users",function(err,collection)
    {
          getOne(collection,username,function(da) {  
           if(da.length==0)
           {
            res.status(404);
           }
           else
           {
            res.json(da);
            res.status(200);
           }
           res.end();
           myDB.close();
        });
        
    });
    
  });
})

app.get('/', function (req, res) {
      res.end("Welcome Get!");
})

app.post('/', function (req, res) {
      res.end("Welcome Post!");

})

app.post('/users?', function (req, res) {
      var name=req.query.name;
      var password=req.query.password;
      var username=req.query.username;
      var created=req.query.created;
      console.log(username+" "+password+" "+name+" "+created);
      MongoClient.connect(STR,function(err,db)
   {
    console.log("connect successfully!");
    var myDB=db.db("web");
     var IDnumber;
     getNextID(myDB,"UserID",function(result)
     {
         IDnumber=result;
         console.log("ID:"+IDnumber);
    var doc={"_id":IDnumber,"Username":username,"Password":password,"Name":name,"Created":created};
    myDB.collection("users",function(err,collection)
        {
          collection.insert(doc,function(err,results)
          {
           if(err)
           {
           var status={ok:0};
           res.status(409);
           }
           else
           {
           var status={ok:1}; 
           res.status(201);
           } 
           res.json(status);
            res.end();
            myDB.close();
          });
        });
     });        
    });
})

app.put('/users/id=[0-9]+?', function (req, res) {
      var path=req.path.split("/");
      var id=path[2].substr(3);
      var query=JSON.stringify(req.query);
      query=query.replace(/name/,"Name").replace(/username/,"Username").replace(/password/,"Password");
      
      console.log(query);
      MongoClient.connect(STR,function(err,db)
   {
    console.log("connect successfully!");
    var myDB=db.db("web");
    myDB.collection("users",function(err,collection)
        {
          var queryid={"_id":Number(id)};
           console.log(queryid);
          var update={"$set":JSON.parse(query)};
          var options={"upsert":false,"multi":true};
          collection.update(queryid,update,options,function(err,results){
                result=JSON.parse(results);
                if(result.n==0)
                {
                	res.status(404);

                }
                else
                {
                	res.send("Put succeeds");
                	res.status(200);
                }
                res.end();
                myDB.close();
          });

        });       
    });
     
})

app.delete('/users/[a-zA-z]+', function (req, res) {
     var username=(req.path).substring(7);
     MongoClient.connect(STR,function(err,db)
  {
   //console.log("connect successfully!");
    var myDB=db.db("web");
    var da;
    myDB.collection("users",function(err,collection)
    {
         var query={"Username":username};
         // collection.remove(query,function(err,result){
         //   res.send("Deletion succeeds");
         //   res.status(200);
         //   res.end();
         //   myDB.close();
         // });
         collection.findAndRemove(
          query,
          [['_id','asc']],
          {remove:true},
          function(err,doc){
             //console.log("Message:"+doc.lastErrorObject.n);
             if(!doc.lastErrorObject.n)
             {
                res.status(404);
             }
             
             else
             {  res.send("Deletion succeeds");
                res.status(200);
             }    
             res.end();
             myDB.close();
          });
          
    });
        
  });
})

function getAll(collection,callback)
{
  var sorter=[["_id",1]];
  var cursor=collection.find({},{Password:0});
  cursor=cursor.sort(sorter);
  cursor.toArray().then(function(da){
    callback(da);
  })
}

function getOne(collection,user,callback)
{
  var query={"Username":user};
  console.log(query);
  var cursor=collection.find(query,{Password:0});
  cursor.toArray().then(function(da){
    callback(da);
  })
}

function getNextID(myDB,SequenceName,callback)
{
  myDB.collection("counters",function(err,collection)
    {
        collection.findAndModify(
          {_id:SequenceName},
          [['_id','asc']],
          {$inc:{sequence_value:1}},
          {new:true},
          function(err,doc) {
            callback(doc.value.sequence_value);
          });      
    });
   
}

var server = app.listen(8081, function () {

  var host = server.address().address
  var port = server.address().port

  console.log("访问地址为 http://%s:%s", host, port)

})