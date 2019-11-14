

var express  = require('express');
var app      = express();
var parser   = require('body-parser');
var dbconfig = require('./db/dbconfig.js');
var db       = require('./db/wines-' + dbconfig.dbname + '.js');

var port = process.env.WINE_PORT || 3000;

app.use(parser.json());
app.use('/', express.static(__dirname + '/web'));

app.use(function(req, res, next) {
  res.setHeader('Content-Type', 'application/json');
  next();
});

var server = app.listen(port, async function () 
{
  var host = server.address().address
  var port = server.address().port
  try
  {
    await db.initialize();
    console.log("Winestore listening at http://%s:%s", host, port);
  }
  catch (err)
  {
    console.error(err);
  }
});

app.get('/wines', async function (request, response)  
{
  try
  {
    var qbe = request.query.qbe;
    var result = await db.get(qbe);
    response.send(result);     
  }
  catch (err)
  {
    handle(err, response);
  }
});

app.post('/wines', async function (request, response)
{
  var review = request.body;
  var id = review.id;
  try
  {
    if (id) {
      await db.update(id, review);
      response.send({'updated':id});
    } else {
      var key = await db.create(review);
      response.send({'generatedKey':key});
    }
  } catch (err) {
    handle(err, response);
  }
});

app.delete('/wines/:id', async function (request, response)
{
  try {
    var id = request.params.id;
    db.remove(id);
    response.send({'status':'removed document'});
  } catch(err) {
    handle(err, response);
  }
});

app.get('/wines-reset', async function (request, response)
{
  try {
    var result = await db.get('{}');
    for (let i = 0; i < result.length; i++) {
      var id = result[i].id;
      console.log('removing ' + id);
      await db.remove(id);
    }

    for (let i = 0; i < dbconfig.wines.length; i++) {
      db.create(dbconfig.wines[i]);
    }
    response.redirect('/')
  } catch(err) {
    handle(err, response);
  }
});


// for about page
app.use('/about.png', express.static(__dirname + '/web/css/images/about-' + dbconfig.dbname + '.png'));
app.get('/code', async function (request, response)  
{
  response.send(db.code());
});

function handle(err, response) {
   response.send({"error": err.message});
}
