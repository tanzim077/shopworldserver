const express = require('express')
const cors = require('cors')
require('dotenv').config();
const port = process.env.PORT || 3100;
const app = express()
const {MongoClient} = require('mongodb');

// MiddleWare
app.use(cors());
app.use(express.json());

// Mongo DB Connect
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fd87t.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {useNewUrlParser: true, useUnifiedTopology: true});


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
            console.log(page);
            console.log(size);
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
            const query = {key: {$in: keys}};
            const products = await productCollections.find(query).toArray();
            res.json(products);
            // console.log("Hitting");
            // console.log(req.body);
        })

        app.post('/products/orders', async (req, res) => {
            const orders = req.body;
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
