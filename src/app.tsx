import * as React from 'react';

import { observer } from 'mobx-react';

import './app.css';
import { JestSnapshotProvider } from './snapshot_provider';

import ApolloClient from 'apollo-boost';
import { ApolloProvider } from 'react-apollo';
import { DiffView } from 'diff-view';

import { Query } from 'react-apollo';
import gql from 'graphql-tag';
import { observable } from 'mobx';

import { style } from 'typestyle';

export const diff = style({
  $nest: {
    '& table': {
      width: '100%',
      background: 'white',
      color: 'black'
    },
    '& .diff': {
      borderCollapse: 'collapse',
      whiteSpace: 'pre-wrap'
    },
    '& .diff tbody': {
      fontFamily: 'Courier, monospace',
      fontSize: '11px'
    },
    '& .diff tbody th': {
      background: '#EED',
      fontSize: '11px',
      fontWeight: 'normal',
      border: '1px solid #BBC',
      color: '#886',
      padding: '.1em .4em .1em',
      textAlign: 'right',
      verticalAlign: 'top',
      width: '30px'
    },
    '& .diff thead': {
      borderBottom: '1px solid #BBC',
      background: '#EFEFEF'
    },
    '& .diff thead th.texttitle': {
      textAlign: 'left',
      fontSize: '11px'
    },
    '& .diff tbody td': {
      paddingLeft: '.4em',
      verticalAlign: 'top',
      width: '50%'
    },
    '& .diff .empty': {
      backgroundColor: '#DDD'
    },
    '& .diff .replace': {
      backgroundColor: '#FD8'
    },
    '& .diff .delete': {
      backgroundColor: '#E99'
    },
    '& .diff .skip': {
      backgroundColor: '#EFEFEF',
      border: '1px solid #AAA',
      borderRight: '1px solid #BBC'
    },
    '& .diff .insert': {
      backgroundColor: '#9E9'
    },
    '& .diff th.author': {
      textAlign: 'right',
      borderTop: '˝1px solid #BBC',
      background: '#EFEFEF'
    }
  }
});

const client = new ApolloClient({
  uri: '/graphql'
});

type Props = {
  snapshot: any;
  state: AppState;
};

class AppState {
  @observable
  view = 'html';
  @observable
  filter = '';
  @observable
  failing = false;
}

@observer
class Item extends React.Component<Props> {
  render() {
    const v = this.props.snapshot;
    const state = this.props.state;

    if (v.expected) {
      return (
        <div>
          <div className="ui label fluid" style={{ margin: '12px 0px!important' }}>
            {v.snapshotName}
          </div>

          {state.view === 'html' && (
            <table style={{ width: '100%' }}>
              <tbody>
                <tr>
                  <th style={{ width: '50%', background: '#dedede' }}>Current</th>
                  <th style={{ width: '50%', background: '#dedede' }}>Expected</th>
                </tr>
                <tr>
                  <td style={{ width: '50%' }} dangerouslySetInnerHTML={{ __html: v.content }} />
                  <td style={{ width: '50%' }} dangerouslySetInnerHTML={{ __html: v.expected }} />
                </tr>
              </tbody>
            </table>
          )}
          {state.view === 'source' && (
            <div
              className={diff}
              dangerouslySetInnerHTML={{
                __html: (DiffView.compare(v.content, v.expected, 'Current', 'Expected', 1) as any)
                  .outerHTML
              }}
            />
          )}
          {state.view === 'current' && <div dangerouslySetInnerHTML={{ __html: v.content }} />}
          {state.view === 'snapshot' && <div dangerouslySetInnerHTML={{ __html: v.expected }} />}
        </div>
      );
    }

    return (
      <div>
        <div className="ui label fluid" style={{ margin: '12px 0px!important' }}>
          {v.snapshotName}
        </div>
        <div dangerouslySetInnerHTML={{ __html: v.content }} />
      </div>
    );
  }
}

const state = new AppState();

@observer
export class Header extends React.Component {
  render() {
    return (
      <div className="ui fixed blue inverted menu" style={{ marginBottom: '0px' }}>
        <div className="ui category search item">
          <div className="ui icon input">
            <input
              className="prompt"
              type="text"
              placeholder="Filter snapshots..."
              value={state.filter}
              onChange={e => {
                debugger;
                state.filter = (e.target as any).value;
              }}
            />
            <i className="search link icon" />
          </div>
          <div className="results" />
        </div>
        <a className="item" onClick={() => (state.view = 'html')}>
          <i className="html5 icon" /> Html
        </a>
        <a className="item" onClick={() => (state.view = 'source')}>
          <i className="code icon" /> Source
        </a>
        <a className="item" onClick={() => (state.view = 'current')}>
          <i className="check icon" /> Current
        </a>
        <a className="item" onClick={() => (state.view = 'snapshot')}>
          <i className="image icon" /> Snapshot
        </a>
        <a
          className={`item ${state.failing && 'active'}`}
          onClick={() => (state.failing = !state.failing)}
        >
          <i className="times circle icon" /> Failing Only
        </a>
      </div>
    );
  }
}

@observer
export default class App extends React.Component {
  provider: JestSnapshotProvider;

  constructor(m) {
    super(m);
  }

  render() {
    let filter = state.filter;
    let failing = state.failing;
    return (
      <ApolloProvider client={client}>
        <div>
          <Query
            query={gql`
              {
                snapshots {
                  content
                  snapshotName
                  expected
                }
              }
            `}
            pollInterval={1000}
          >
            {({ loading, error, data }) => {
              if (loading) return <p>Loading...</p>;
              if (error) return <p>Error :(</p>;

              return (
                <div style={{ paddingTop: '40px' }}>
                  <Header />
                  {data.snapshots
                    .filter(
                      s =>
                        (!state.filter || s.snapshotName.indexOf(state.filter) >= 0) &&
                        (!state.failing || s.expected)
                    )
                    .map((v, i) => (
                      <Item key={v.snapshotName + i.toString()} snapshot={v} state={state} />
                    ))}
                </div>
              );
            }}
          </Query>
        </div>
      </ApolloProvider>
    );
  }
}
