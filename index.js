const express = require('express')
const cors = require('cors')
require('dotenv').config();
const port = process.env.PORT || 3100;
const app = express()
const { MongoClient } = require('mongodb');
var admin = require("firebase-admin");

var serviceAccount = require('./shop-world-fc9d6-firebase-adminsdk-k33bh-d5aa839df4.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// MiddleWare
app.use(cors());
app.use(express.json());



// Mongo DB Connect
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fd87t.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


async function verifyToken(req, res, next) {
    if (req.headers?.authorization?.startsWith('Bearer ')) {
        const idToken = req.headers.authorization.split('Bearer ')[1];
        try {
            const decodeUser = await admin.auth().verifyIdToken(idToken)
            req.decodeUserEmail = decodeUser.email;
        }
        catch {
            
        }
    }
    next();
}


async function run() {
    try {
        await client.connect();
        console.log("Connection Successfully established");
        const database = client.db("ShopWorld");
        const productCollections = database.collection("products")
        const orderCollections = database.collection("orders")

        // Get Item
        app.get('/products', async (req, res) => {
            const cursor = productCollections.find({});
            const page = parseInt(req.query.currentpage);
            const size = parseInt(req.query.size);
            const count = await cursor.count();
            let products;
            if (page >= 0) {
                products = await cursor.skip(page * size).limit(size).toArray();
            } else {
                products = await cursor.toArray();
            }
            res.send({
                count,
                products
            });
        })

        //    Get data by keys
        app.post('/products/usekeys', async (req, res) => {
            const keys = req.body;
            const query = { key: { $in: keys } };
            const products = await productCollections.find(query).toArray();
            res.json(products);
        })

        // Get all order
        app.get('/products/orders', verifyToken, async (req, res) => {
            const email = req.query.email;
            if (req.decodeUserEmail === email) {
                const query = { email: email }                
                const cursor = orderCollections.find(query);
                const orders = await cursor.toArray();
                res.json(orders)
            }
            else {
                res.status(401).json({message: "User not authorized"})
            }
        })



        //Post an Order
        app.post('/products/orders', async (req, res) => {
            const orders = req.body;
            const date = new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' });
            orders.createdAt = date;
            // orders.createdAt = new Date();
            const result = await orderCollections.insertOne(orders);
            res.json(result)

        })
    } finally {
    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
