const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 3000;
const routers = express.Router();
const path = require("path");
const { MongoClient } = require("mongodb");
const fs = require("fs");
const { ObjectId } = require("mongodb");
app.use(cors());

//Middle ware to server request
const middleWareLogGer = (req, res, next) => {
  console.log("Middle ware to server request name", `${req.method} ${req.originalUrl}`);
  next()
};

app.use(express.json());
async function MainMethod() {
  const uri =
    "mongodb+srv://dhruvil:dhruvilpatel@cluster0.lgbotdr.mongodb.net/?retryWrites=true&w=majority";
  var serverDBC = new MongoClient(uri);
  try {
    await serverDBC.connect();
    await serverDBC
      .db("test")
      .collection("orders")
      .deleteMany({})
      .then((res) => {
        
      })
      .catch((err) => {
        console.log(err);
      });
  } catch (e) {
    console.error(e);
  } finally {
    setTimeout(() => {
      serverDBC.close();
    }, 1500);
  }
}


routers.get("/orders", (req, res, next) => {
  let serverDBC = databaseConnectionToServer();
  getOrderList(serverDBC).then((data) => {
    res.send(data);
  });
});


MainMethod().catch(console.error);


function databaseConnectionToServer() {
  const uri =
    "mongodb+srv://dhruvil:dhruvilpatel@cluster0.lgbotdr.mongodb.net/?retryWrites=true&w=majority";
  let serverDBC = new MongoClient(uri);
  serverDBC.connect();
  return serverDBC;
}


const imageMiddleware = (req, res) => {
  const imagepath = path.join(__dirname, "image-lesson", req.url);
  fs.stat(imagepath, (err, stats) => {
    if (err) {
      res.status(404).send("Empty folder");
      return;
    }
    fs.createReadStream(imagepath).pipe(res);
  });
};

app.use("/image-lesson", imageMiddleware);

routers.get("/lessons", (req, res, next) => {
  let serverDBC = databaseConnectionToServer();
  LISTALLDB(serverDBC).then((data) => {
    res.send(data);
  });
});


routers.delete("/lessons/:id", (req, res) => {
  let serverDBC = databaseConnectionToServer();
  LessonDelete(serverDBC, req.params.id)
    .then((msg) => {
      res.send(`deleted successfully`);
    })
    .catch((error) => {
      res.status(404).send(error);
    });
});

routers.post("/search", (req, res, next) => {
  let serverDBC = databaseConnectionToServer();
  searchBYTEXT(serverDBC, req.body.text)
    .then((data) => {
      res.send(data);
    })
    .catch((error) => {
      res.status(404).send("ERRORSS");
    });
});




routers.post("/orders", (req, res, next) => {
  let serverDBC = databaseConnectionToServer();
  createOrder(serverDBC, req.body)
    .then((msg) => {
      if (msg) {
        res.send(`Successfully Created`);
      } else {
        res
          .status(404)
          .send(`${req.body.lessonName}  out of stock`);
      }
    })
    .catch((error) => {
      res.status(404).send("ERROR");
    });
});

async function getOrderList(product) {
  const db = await product.db("test").collection("orders").find().toArray();
  if (db) {
    return db;
  } else {
    const message = `Sorry no data available`;
    return message;
  }
}


routers.post("/lessons", (req, res, next) => {
  let serverDBC = databaseConnectionToServer();
  createProduct(serverDBC, req.body)
    .then((msg) => {
      res.send("Created Successfully");
    })
    .catch((error) => {
      res.status(404).send("ERRORSS");
    });
});








routers.delete("/orders", (req, res) => {
  let serverDBC = databaseConnectionToServer();
  deleteOrders(serverDBC, req.params.id)
    .then((msg) => {
      res.send(`deleted successfully`);
    })
    .catch((error) => {
      res.status(404).send(error);
    });
});


async function searchBYTEXT(serverDBC, searchedText) {
  let serachRESULT = await serverDBC
    .db("test")
    .collection("products")
    .find({
      name: searchedText,
    })
    .toArray();
  return serachRESULT;
}


async function createProduct(serverDBC, newListing) {
  const result = await serverDBC
    .db("test")
    .collection("products")
    .insertOne(newListing);
  return result;
}

async function createOrder(server, serverDBC) {
  let serverData = server.db("test").collection("orders");
  let selectProducts = await server
    .db("test")
    .collection("products")
    .findOne({
      _id: new ObjectId(serverDBC.lessonId),
    });
  let id = selectProducts._id.toString();
  if (selectProducts.space) {
    selectProducts.space = selectProducts.space - 1;
    serverData.insertOne(serverDBC);
    updateTheLessonss(server, id, selectProducts)
      .then((data) => {
      })
      .catch((error) => {
      });
    return true;
  } else {
    return false;
  }
}

async function deleteOrders(serverDBC, id) {
  await serverDBC
    .db("test")
    .collection("orders")
    .deleteMany({})
    .then((res) => {
    })
    .catch((err) => {
    });
  return result;
}

routers.put("/lessons/:id", (req, res) => {
  let serverDBC = databaseConnectionToServer();
  updateTheLessonss(serverDBC, req.params.id, req.body)
    .then((data) => {
      res.send(`updated Successfully`);
    })
    .catch((error) => {
      res.status(404).send(error);
    });
});

async function LISTALLDB(product) {
  const db = await product.db("test").collection("products").find().toArray();
  if (db) {
    return db;
  } else {
    const message = `no data`;
    return message;
  }
}



async function updateTheLessonss(serverDBC, id, newData) {
  const result = await serverDBC
    .db("test")
    .collection("products")
    .updateOne({ _id: new ObjectId(id) }, { $set: newData }, (err, result) => {
      serverDBC.close();
    });
  return result;
}


async function LessonDelete(serverDBC, id) {
  const result = await serverDBC
    .db("test")
    .collection("products")
    .deleteOne({ _id: new ObjectId(id) }, (err, result) => {
      serverDBC.close();
    });
  return result;
}



app.use(middleWareLogGer);
app.use("/", routers);
app.listen(port, () => {
  console.log(`http://localhost:${port}`);
});
