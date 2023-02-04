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
async function main() {
  const uri =
    "mongodb+srv://dhruvil:dhruvilpatel@cluster0.lgbotdr.mongodb.net/?retryWrites=true&w=majority";
  var client = new MongoClient(uri);
  try {
    await client.connect();
    await client
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
      client.close();
    }, 1500);
  }
}

main().catch(console.error);

//connection to database
function connectToDB() {
  const uri =
    "mongodb+srv://dhruvil:dhruvilpatel@cluster0.lgbotdr.mongodb.net/?retryWrites=true&w=majority";
  let client = new MongoClient(uri);
  client.connect();
  return client;
}

/**
 * API's
 */

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

// API to get all lessons
routers.get("/lessons", (req, res, next) => {
  let client = connectToDB();
  listDatabase(client).then((data) => {
    res.send(data);
  });
});

// API to get all lessons
routers.post("/search", (req, res, next) => {
  let client = connectToDB();
  searchText(client, req.body.text)
    .then((data) => {
      console.log(data);
      res.send(data);
    })
    .catch((error) => {
      res.status(404).send("somethings went wrong please try again");
    });
});

// API to get all orders
routers.get("/orders", (req, res, next) => {
  let client = connectToDB();
  listORders(client).then((data) => {
    res.send(data);
  });
});

// API to create the lessons
routers.post("/lessons", (req, res, next) => {
  let client = connectToDB();
  createProduct(client, req.body)
    .then((msg) => {
      res.send("Lesson Created Successfully");
    })
    .catch((error) => {
      res.status(404).send("somethings went wrong please try again");
    });
});

// API to create the orders
routers.post("/orders", (req, res, next) => {
  let client = connectToDB();
  createOrder(client, req.body)
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

// API to update the lessons
routers.put("/lessons/:id", (req, res) => {
  let client = connectToDB();
  updateLesson(client, req.params.id, req.body)
    .then((data) => {
      res.send(`Lesson updated Successfully`);
    })
    .catch((error) => {
      res.status(404).send(error);
      console.log(error);
    });
});

//API to delete the lesson
routers.delete("/lessons/:id", (req, res) => {
  let client = connectToDB();
  deleteLesson(client, req.params.id)
    .then((msg) => {
      res.send(`deleted successfully`);
    })
    .catch((error) => {
      res.status(404).send(error);
    });
});

routers.delete("/orders", (req, res) => {
  let client = connectToDB();
  deleteOrders(client, req.params.id)
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
async function searchText(client, searchedText) {
  let serachRESULT = await client
    .db("test")
    .collection("products")
    .find({
      name: searchedText,
    })
    .toArray();
  return serachRESULT;
}

// create the lessons into the database
async function createProduct(client, newListing) {
  const result = await client
    .db("test")
    .collection("products")
    .insertOne(newListing);
  return result;
}

// create the lessons into the database
async function createOrder(server, client) {
  let serverData = server.db("test").collection("orders");
  let selectedProduct = await server
    .db("test")
    .collection("products")
    .findOne({
      _id: new ObjectId(client.lessonId),
    });
  console.log(selectedProduct);
  let id = selectedProduct._id.toString();
  if (selectedProduct.space) {
    selectedProduct.space = selectedProduct.space - 1;
    console.log(client);
    serverData.insertOne(client);
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
async function updateLesson(client, id, newData) {
  const result = await client
    .db("test")
    .collection("products")
    .updateOne({ _id: new ObjectId(id) }, { $set: newData }, (err, result) => {
      client.close();
    });
  return result;
}

//delete the lessons from the database
async function deleteLesson(client, id) {
  const result = await client
    .db("test")
    .collection("products")
    .deleteOne({ _id: new ObjectId(id) }, (err, result) => {
      client.close();
    });
  return result;
}
//delete the orders from the database
async function deleteOrders(client, id) {
  await client
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
