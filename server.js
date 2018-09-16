const Bundler = require('parcel-bundler');
const app = require('express')();
const bodyParser = require('body-parser');
const { graphqlExpress, graphiqlExpress } = require('apollo-server-express');

const { JestSnapshotProvider } = require('./src/snapshot_provider');

let provider = new JestSnapshotProvider();

const file = 'index.html'; // Pass an absolute path to the entrypoint here
const options = {}; // See options section of api docs, for the possibilities

// Initialize a new bundler using a file and options
const bundler = new Bundler(file, options);

app.use('/graphql', bodyParser.json(), graphqlExpress({ schema: provider.schema }));

// GraphiQL, a visual editor for queries
app.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }));

// Let express use the bundler middleware, this will let Parcel handle every request over your express server
app.use(bundler.middleware());

// Listen on port 8080
app.listen(8080);
console.log('Listening at http://localhost:8080');
