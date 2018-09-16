const path = require('path');
const { formatSnapshot } = require('./format');
const { startServer } = require('./json_server');

const { observable, action, IObservableArray } = require('mobx');

const { makeExecutableSchema } = require('graphql-tools');

// The GraphQL schema in string form
const typeDefs = `
  type Snapshot { 
    content: String
    snapshotName: String
    expected: String
    time: Int 
  }
  type Query { snapshots: [Snapshot] }
`;

class JestSnapshotProvider {
  constructor() {
    this.activeTestFile = null;
    this.views = observable.array();

    // The resolvers
    this.resolvers = {
      Query: {
        snapshots: () => {
          return this.views;
        }
      }
    };

    // Put together a schema
    this.schema = makeExecutableSchema({
      typeDefs,
      resolvers: this.resolvers
    });

    startServer(
      action(message => {
        const content = message.content;
        const snapshotName = message.snapshotName;

        this.views = this.views.filter(s => Date.now() - s.time < 1500);

        // find index of snapshot with the current name
        const index = this.views.findIndex(s => s.snapshotName === snapshotName);

        console.log('Received: ' + message.snapshotName);

        // format content in html form
        message.content = formatSnapshot(content);
        message.expected = message.expected && formatSnapshot(message.expected);
        // insert into cache
        if (index >= 0) {
          this.views[index] = message;
        } else {
          this.views.unshift(message);
        }

        // console.log('Added: ' + message.snapshotName);

        // remove last element
        if (this.views.length > 5) {
          this.views.splice(4, 1);
        }
      })
    );
  }
}

module.exports.JestSnapshotProvider = JestSnapshotProvider;
