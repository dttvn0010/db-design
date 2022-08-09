import React from 'react';
import { Tabs, Tab } from 'react-bootstrap';

import Diagram from 'components/Designer';
import QueryBuilder from 'components/QueryBuilder';

import "./App.css";
import { useSliceStore } from 'utils/reduxHelper';

export default function App(){
  const store = useSliceStore('app');

  return (
    <>
      <div className="p-2" id="container">
        <Tabs defaultActiveKey='designer'
          onSelect={key => store.setState({activeTab: key})}
        >
          <Tab eventKey='designer' title='Designer'>
            <Diagram />
          </Tab>
          <Tab eventKey='query' title='Query builder'>
            <QueryBuilder />
          </Tab>
        </Tabs>
      </div>
    </>
  );
}