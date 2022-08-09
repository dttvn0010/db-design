import Draggable from 'react-draggable';
import TableModal from 'modals/TableModal';
import LoadDesignModal from 'modals/LoadDesignModal';
import SaveDesignModal from 'modals/SaveDesignModal';
import CodeModal from 'modals/CodeModal';

import { deepCopy, useSliceSelector, useSliceStore } from 'utils/reduxHelper';
import { drawLines } from 'draw';
import { useEffect } from 'react';

export default function Designer(){
  const store = useSliceStore('app');
  let [tableList] = useSliceSelector('app', ['tableList']);
  
  function beforePageRefresh(e) {
    e.preventDefault();
    e.returnValue = "";
  }

  useEffect(() => {
    window.addEventListener("beforeunload", beforePageRefresh);
    return () => {
      window.removeEventListener("beforeunload", beforePageRefresh);
    };
  }, []);

  useEffect(function(){
    tableList = deepCopy(tableList ?? []);

    if(tableList.some(table => table.bound.raw)){
      tableList.filter(table => table.bound.raw).forEach(table => {
        let rect = document.getElementById(`table_${table.name}`).getBoundingClientRect();
        table.bound = {
          top: rect.top,
          left: rect.left,
          bottom: rect.bottom,
          right: rect.right
        };
      });
      store.setState({tableList});
    }else {
      drawLines(tableList);
    }
  }, [tableList]);

  tableList = tableList ?? [];
  
  function handleDrag(e){
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  
  function handleStop(index, e, el){
    let {tableList} = store.getState();
    tableList = deepCopy(tableList ?? []);
    tableList[index].position = {
      x: el.x,
      y: el.y
    };
    store.setState({tableList});
  }

  function removeTable(index){
    if(!window.confirm('Do you want to remove this table?')){
      return;
    }

    let {tableList} = store.getState();
    tableList = deepCopy(tableList ?? []);
    let removedTable = tableList.splice(index, 1)[0];
   
    tableList.forEach(table => {
      if(!table.isLinkThrough) return;
      
      if(table.from.tableName === removedTable.name) {
        table.invalid = true;
      }

      if(table.to.tableName === removedTable.name) {
        table.invalid = true;
        let fromTableName = tableList.find(t => t.name === table.from.tableName);
        if(fromTableName) {
          fromTableName.fields = fromTableName.fields.filter(
            field => field.name !== table.from.fieldName
          )
        }
      }
    });

    tableList = tableList.filter(table => !table.invalid);

    store.setState({
      modified: true,
      tableList,
    });

  }

  function newDesign() {
    const { modified } = store.getState();
    if (modified && !window.confirm("Current form has not been saved. Do you want to continue?")) {
      return;
    }

    store.setState({
      modified: false,
      tableList: [],
    });
  }

  function openLoadDesignModal() {
    store.setState({
      showLoadDesignModal: true,
    });
  }

  function openSaveDesignModal(){
    store.setState({
      showSaveDesignModal: true,
    });
  }

  function showCode(){
    store.setState({
      showCodeModal: true
    });
  }

  function openTableModal(){
    store.setState({
      editingTable: {
        fields: [
          {
            name: 'id',
            type: 'BIGINT',
            primary: true
          }
        ]
      },
      editingTableError: {},
      showTableModal: true
    })
  }

  function editTable(index) {
    const {tableList} = store.getState();
    const editingTable = tableList[index];

    store.setState({
      editingTable: {
        ...editingTable, 
        index,
        lastName: editingTable.name
      },
      showTableModal: true
    });
  }

  return (
  <>
    <button className="btn btn-sm btn-success my-3" onClick={newDesign}>
      <i className="fas fa-file"></i>
    </button>

    {" "}

    <button className="btn btn-sm btn-success my-3" onClick={openLoadDesignModal}>
      <i className="fas fa-folder-open"></i>
    </button>

    {" "}

    <button className="btn btn-sm btn-success my-3" onClick={openSaveDesignModal}>
      <i className="fas fa-save"></i>
    </button>

    {" "}

    <label className="pb-1" style={{borderRight: '2px solid #BBB'}}>&nbsp;</label>
    <button className="btn btn-sm btn-primary ms-2 my-3" onClick={openTableModal}>
      <i className="fas fa-plus"></i>
    </button>

    {" "}

    <button className="btn btn-sm btn-info my-3" onClick={showCode}>
      <i className="fas fa-code" style={{color:"#FBFBFB"}}></i>
    </button>

    <br/>

    <canvas id="canvas" width="2000" height="2000"/>

    <div id="rightPanel" style={{borderTop: "1px solid blue"}}>
      {tableList.map((table,index) =>
        <Draggable
          key={index}
          onDrag={handleDrag}
          onStop={(e,el) => handleStop(index, e, el)}
          position={{x: table.position.x, y: table.position.y}}
          grid={[5, 5]}
          scale={1}
        >
          <table id={`table_${table.name}`} className="entity-table">
            <thead>
              <tr key={table.name}>
                <th>
                  {!table.isLinkThrough &&
                    <a href="#/" onClick={() => editTable(index)}>
                      <i className="fas edit fa-edit"></i>
                    </a>
                  }
                </th>
                <th colSpan="2">
                  {table.name}
                  {!table.isLinkThrough &&
                    <div className="float-end">
                      <a href="#/" onClick={() => removeTable(index)}>
                        <i className="delete fas fa-trash"></i>
                      </a>
                    </div>
                  }
                </th>
              </tr>
            </thead>
            <tbody>
              {table.fields.filter(field => field.type !== 'MANY_TO_MANY').map(field =>
                <tr key={field.name} id={`${table.name}.${field.name}`}>
                  <td style={{width: "10%"}}>
                    {field.primary &&
                      <i className="primary-key fas fa-key"></i>
                    }
                    {field.unique &&
                      <i className="fas fa-key"></i>
                    }
                  </td>
                  <td style={{width: "45%"}}>
                    {field.name} 
                    {field.type === 'FOREIGN' && "_id"}
                    {" "}
                  </td>
                  <td style={{width: "45%"}} className="pe-1">
                    {field.type}
                    {field.type === 'VARCHAR' &&
                      <>{" "}({field.maxLength})</>
                    }
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Draggable>
      )}
      <TableModal/>
      <LoadDesignModal/>
      <SaveDesignModal/>
      <CodeModal/>
    </div>
  </>);
}