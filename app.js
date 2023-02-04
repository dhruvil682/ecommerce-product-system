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
        // console.log("orders Deleted successfully");
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

MainMethod().catch(console.error);

//connection to database
function databaseConnectionToServer() {
  const uri =
    "mongodb+srv://dhruvil:dhruvilpatel@cluster0.lgbotdr.mongodb.net/?retryWrites=true&w=majority";
  let serverDBC = new MongoClient(uri);
  serverDBC.connect();
  return serverDBC;
}


const imageMiddleware = (req, res) => {
  const imagepath = path.join(__dirname, "lesson-images", req.url);
  fs.stat(imagepath, (err, stats) => {
    if (err) {
      res.status(404).send("Image not present");
      return;
    }
    fs.createReadStream(imagepath).pipe(res);
  });
};

app.use("/lesson-images", imageMiddleware);

routers.get("/lessons", (req, res, next) => {
  let serverDBC = databaseConnectionToServer();
  listDatabase(serverDBC).then((data) => {
    res.send(data);
  });
});


routers.delete("/lessons/:id", (req, res) => {
  let serverDBC = databaseConnectionToServer();
  deleteLesson(serverDBC, req.params.id)
    .then((msg) => {
      res.send(`deleted successfully`);
    })
    .catch((error) => {
      res.status(404).send(error);
    });
});

routers.post("/search", (req, res, next) => {
  let serverDBC = databaseConnectionToServer();
  searchText(serverDBC, req.body.text)
    .then((data) => {
      console.log(data);
      res.send(data);
    })
    .catch((error) => {
      res.status(404).send("somethings went wrong please try again");
    });
});


routers.get("/orders", (req, res, next) => {
  let serverDBC = databaseConnectionToServer();
  listORders(serverDBC).then((data) => {
    res.send(data);
  });
});



routers.post("/orders", (req, res, next) => {
  let serverDBC = databaseConnectionToServer();
  createOrder(serverDBC, req.body)
    .then((msg) => {
      if (msg) {
        res.send(`Orders Created Successfully`);
      } else {
        res
          .status(404)
          .send(`The Lesson Name ${req.body.lessonName} is out of stock`);
      }
    })
    .catch((error) => {
      console.log(error);
      res.status(404).send("somethings went wrong please try again");
    });
});


routers.post("/lessons", (req, res, next) => {
  let serverDBC = databaseConnectionToServer();
  createProduct(serverDBC, req.body)
    .then((msg) => {
      res.send("Lesson Created Successfully");
    })
    .catch((error) => {
      res.status(404).send("somethings went wrong please try again");
    });
});



routers.put("/lessons/:id", (req, res) => {
  let serverDBC = databaseConnectionToServer();
  updateLesson(serverDBC, req.params.id, req.body)
    .then((data) => {
      res.send(`Lesson updated Successfully`);
    })
    .catch((error) => {
      res.status(404).send(error);
      console.log(error);
    });
});

//API to delete the lesson


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

/**
 * Methods to interact with the Database
 */

//search by text
async function searchText(serverDBC, searchedText) {
  let serachRESULT = await serverDBC
    .db("test")
    .collection("products")
    .find({
      name: searchedText,
    })
    .toArray();
  return serachRESULT;
}

// create the lessons into the database
async function createProduct(serverDBC, newListing) {
  const result = await serverDBC
    .db("test")
    .collection("products")
    .insertOne(newListing);
  return result;
}

// create the lessons into the database
async function createOrder(server, serverDBC) {
  let serverData = server.db("test").collection("orders");
  let selectedProduct = await server
    .db("test")
    .collection("products")
    .findOne({
      _id: new ObjectId(serverDBC.lessonId),
    });
  console.log(selectedProduct);
  let id = selectedProduct._id.toString();
  if (selectedProduct.space) {
    selectedProduct.space = selectedProduct.space - 1;
    console.log(serverDBC);
    serverData.insertOne(serverDBC);
    updateLesson(server, id, selectedProduct)
      .then((data) => {
        console.log(`Lesson updated Successfully`);
      })
      .catch((error) => {
        console.log(error);
      });
    return true;
  } else {
    return false;
  }
}

// get all lessons from database
async function listDatabase(product) {
  const db = await product.db("test").collection("products").find().toArray();
  if (db) {
    return db;
  } else {
    const message = `Sorry no data available`;
    return message;
  }
}
// get all lessons from ORders
async function listORders(product) {
  const db = await product.db("test").collection("orders").find().toArray();
  if (db) {
    return db;
  } else {
    const message = `Sorry no data available`;
    return message;
  }
}

//update lessons in database
async function updateLesson(serverDBC, id, newData) {
  const result = await serverDBC
    .db("test")
    .collection("products")
    .updateOne({ _id: new ObjectId(id) }, { $set: newData }, (err, result) => {
      serverDBC.close();
    });
  return result;
}

//delete the lessons from the database
async function deleteLesson(serverDBC, id) {
  const result = await serverDBC
    .db("test")
    .collection("products")
    .deleteOne({ _id: new ObjectId(id) }, (err, result) => {
      serverDBC.close();
    });
  return result;
}
//delete the orders from the database
async function deleteOrders(serverDBC, id) {
  await serverDBC
    .db("test")
    .collection("orders")
    .deleteMany({})
    .then((res) => {
      console.log("orders Deleted successfully");
    })
    .catch((err) => {
      console.log(err);
    });
  return result;
}

app.use(middleWareLogGer);
app.use("/", routers);
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
