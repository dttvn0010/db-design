import QueryModal from "modals/QueryModal";
import { useSliceSelector, useSliceStore, deepCopy } from 'utils/reduxHelper';

function isComplexCondition(cond) {
  return (
    cond === 'AND' ||
    cond === 'OR'  ||
    cond === 'NOT' 
  )
}

function Condition({condition, index, setCondition, addCondition, deleteCondition, disableAddDelete}) {
  let [tableList] = useSliceSelector('app', ['tableList']);
  tableList = tableList ?? [];

  let tableMap = {};
  tableList.forEach(table => {
    tableMap[table.name] = table;
  });

  function setChildCondition(subIndex, data){
    condition = deepCopy(condition);
    const child = condition.children[subIndex];
    condition.children[subIndex] = {...child, ...data};
    setCondition(index, condition);
  }

  function addChildCondition(subIndex) {
    condition = deepCopy(condition);
    let children = condition.children ?? [];
    
    if(subIndex === undefined){
      children.push({});
    }else{
      children.splice(subIndex, 0, {});
    }
    
    setCondition(index, {children});
  }

  function deleteChildCondition(subIndex) {
    condition = deepCopy(condition);
    let children = condition.children ?? [];
    children.splice(subIndex, 1);
    setCondition(index, {children});
  }

  function onConditionChange(e) {
    let data = {cond: e.target.value};
    if(e.target.value === 'NOT') {
      data['children'] = [{}];
    }
    setCondition(index, data);
  }

  return (
    <li className="my-2">
      <div className="d-flex">
        
        {!isComplexCondition(condition.cond) &&
          <div className="px-2" style={{width: "40%", flex: 2}}>
            <div className="text-center">
              <small>┏━━━━┓</small>
            </div>
            <div className="d-flex">
              <div className="pe-1" style={{width: "50%"}}>
                <select className="form-control"
                  value={condition.tableName ?? ''}
                  onChange={e => setCondition(index, {tableName: e.target.value})}
                >
                  <option>--Table--</option>
                  {tableList.map(table =>
                    <option key={table.name} value={table.name}>
                      {table.name}
                    </option>
                  )}
                </select>
              </div>
              <div className="ps-1" style={{width: "50%"}}>
                <select className="form-control"
                  value={condition.colName ?? ''}
                  onChange={e => setCondition(index, {colName: e.target.value})}
                >
                  <option>--Column--</option>
                  {(tableMap[condition.tableName]?.fields ?? []).map(field =>
                    <option key={field.name} value={field.name}>
                      {field.name}
                    </option>
                  )}
                </select>
              </div>
            </div>
          </div>
        }

        <div className="px-2" style={{width: "15%", flex:1}}>
          <div className="d-flex">
            <div style={{flex: 1}}>
              {!isComplexCondition(condition.cond) &&
                <div className="text-center">
                  <small>&nbsp;</small>
                </div>
              }
              <select className="form-control text-center"
                value={condition.cond ?? ''}
                onChange={onConditionChange}
              >
                <option value="">--Condition--</option>
                <option value="AND">and</option>
                <option value="OR">or</option>
                <option value="NOT">not</option>
                <option value="EQ">=</option>
                <option value="IS">is</option>
                <option value="IN">in</option>
                <option value="GT">&gt;</option>
                <option value="GTE">&gt;=</option>
                <option value="LT">&lt;</option>
                <option value="LTE">&lt;=</option>
                <option value="CT">contains</option>
                <option value="SW">starts with</option>
                <option value="EW">ends with</option>
              </select>
            </div>
          </div>
          {isComplexCondition(condition.cond) &&
            <div className="mt-1 me-1">
              {!condition.collapse &&
                <a href="#/" className="text-decoration-none"
                  onClick={() => setCondition(index, {collapse: true})}
                >
                  ▽ <small>Hide element conditions</small>
                </a>
              }
              {condition.collapse &&
                <a href="#/" className="text-decoration-none"
                  onClick={() => setCondition(index, {collapse: false})}
                >
                  ▷ <small>Show element conditions</small>
                </a>
              }
            </div>
          }
        </div>

        {!isComplexCondition(condition.cond) &&
          <div className="px-2" style={{width: "25%", flex: 1}}>
            <div className="text-center">
            <small>&nbsp;</small>
            </div>
            <input className="form-control" placeholder="Value"
              value={condition.value??''}
              onChange={e => setCondition(index, {value: e.target.value})}
            />
          </div>
        }
        <div>
          {!isComplexCondition(condition.cond) &&
            <div className="text-center">
              <small>&nbsp;</small>
            </div>
          }
          {!disableAddDelete &&
            <div>
              <button className="btn btn-sm btn-primary"
                onClick={() => addCondition(index)}
              >
                <i className="fas fa-plus"></i>
              </button>
              {" "}
              <button className="btn btn-sm btn-danger"
                onClick={() => deleteCondition(index)}
              >
                <i className="fas fa-trash"></i>
              </button>
            </div>
          }
        </div>
      </div>
      
      {isComplexCondition(condition.cond) && !condition.collapse &&
        <div>
          {(condition.children??[]).length > 0 &&
            <ul className="list-unstyled ps-4">
              {condition.children.map((child, subIndex) => 
                <Condition
                  key={subIndex}
                  condition={child}
                  index={subIndex}
                  setCondition={setChildCondition}
                  addCondition={addChildCondition}
                  deleteCondition={deleteChildCondition}
                  disableAddDelete={condition.cond === 'NOT'}
                />
              )}
            </ul>
          }
          {condition.cond !== 'NOT' &&
            <div className="ps-5 mt-2">
              <button className="btn btn-sm btn-primary mb-3"
                onClick={() => addChildCondition()}
              >
                <i className="fas fa-plus"></i> Add element condition
              </button>
              <hr/>
            </div>
          }   
        </div>
      }
    </li>
  )
}

export default function QueryBuilder(){
  const store = useSliceStore('app');
  let [targetTable, tableList, conditionList] = useSliceSelector('app', ['targetTable', 'tableList', 'conditionList']);
  tableList = tableList ?? [];
  conditionList = conditionList ?? [];

  function setCondition(index, data) {
    let {conditionList} = store.getState();
    conditionList = deepCopy(conditionList ?? []);
    conditionList[index] = {...conditionList[index], ...data};
    store.setState({conditionList});
  }

  function addCondition(index) {
    let {conditionList} = store.getState();
    conditionList = deepCopy(conditionList ?? []);

    if(index === undefined) {
      conditionList.push({});
    }else{
      conditionList.splice(index, 0, {});
    }

    store.setState({conditionList});
  }

  function deleteCondition(index) {
    let {conditionList} = store.getState();
    conditionList = deepCopy(conditionList ?? []);

    conditionList.splice(index, 1);
    store.setState({conditionList});
  }

  function openQueryCodeModal(){
    store.setState({showQueryCodeModal: true});
  }

  return (
    <div className="p-3">
      <div className="row mb-3">
        <div className="col-4">
          <label className="mb-1">Target table:</label>
          <select className="form-control"
            value={targetTable ?? ''}
            onChange={e => store.setState({targetTable: e.target.value})}
          >
            <option value=''>----</option>
            {tableList.map((table,index) => 
              <option key={index} value={table.name}>{table.name}</option>
            )}
          </select>
        </div>
        <div className="col-4">
          <label className="mb-2">&nbsp;</label>
          <br/>
          <button className="btn btn-sm btn-info ms-2" onClick={openQueryCodeModal}>
            <i className="fas fa-code" style={{color:"#FBFBFB"}}></i>
          </button>
        </div>
      </div>
      <h4><u>Filter Conditions</u></h4>
      <hr className="my-2"/>
      <ul className="list-unstyled px-3">
        {conditionList.map((cond, index) => 
          <Condition
            key={index}
            condition={cond}
            index={index}
            setCondition={setCondition}
            addCondition={addCondition}
            deleteCondition={deleteCondition}
            disableAddDelete={false}
          />
        )}
      </ul>
      <div>
        <button className="btn btn-sm btn-primary ms-3 mb-3"
          onClick={() => addCondition()}
        >
          <i className="fas fa-plus"></i> Add condition
        </button>
      </div>
      <QueryModal/>
    </div>
  );
}