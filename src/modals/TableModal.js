import { Modal } from 'react-bootstrap';
import { useSliceSelector, useSliceStore, deepCopy } from 'utils/reduxHelper';
import {  PAGE_WIDTH, TABLE_WIDTH, TABLE_ROW_HEIGHT } from "utils/constants";

function ErrorTag({err}) {
  if(err){
    return <label className="label-error">{err}</label>;
  }
  return <></>;
}

function validateTabledata(tableList, data){
  let editingTableError = {fields: []};

  if(!data.name) {
    editingTableError['name'] = 'Table name is required';
  }

  for(let i = 0; i < tableList.length; i++){
    if(i !== data.index && tableList[i].name === data.name){
      alert(i + ':' + data.index);
      editingTableError['name'] = 'Table name already exists';
    }
  }

  let fields = data.fields ?? [];
  
  fields.forEach(field => {
    let fieldError = {};
    if(!field.name) {
      fieldError['name'] = 'Field name is required';
    }
    if(!field.type) {
      fieldError['name'] = 'Field name is required';
    }
    
    if(field.type === 'VARCHAR' && !field.maxLength) {
      fieldError['maxLength'] = 'Max length is required';
    }
    if((field.type === 'FOREIGN' || field.type === 'MANY_TO_MANY') && !field.linkedTable) {
      fieldError['linkedTable'] = 'Linked table is required';
    }
    editingTableError.fields.push(fieldError);
  });

  return editingTableError;
}

function hasError(editingTableError){
  if(Object.keys(editingTableError).length > 1) {
    return true;
  }
  let fields = editingTableError.fields ?? [];
  return fields.some(field => Object.keys(field).length > 0);
}

function isOverlapped(rect1, rect2){
  let padding = 20;
  let xOverlapped = (
    (rect1.left >= rect2.left - padding && rect1.left <= rect2.right + padding) ||
    (rect2.left >= rect1.left - padding && rect2.left <= rect1.right + padding)
  );
  let yOverlapped = (
    (rect1.top >= rect2.top - padding && rect1.top <= rect2.bottom + padding) ||
    (rect2.top >= rect1.top - padding && rect2.top <= rect1.bottom + padding)
  );
  return xOverlapped && yOverlapped;
}

function getNewPosition(tableList, table) {
  let [x,y] = [100,100];
  let bound = document.getElementById('rightPanel').getBoundingClientRect();
  let rect = {};
  while(true){
    rect = {
      top: bound.top + y,
      left: bound.left + x,
      bottom: bound.top + y + table.fields.length * TABLE_ROW_HEIGHT,
      right: bound.left + x + TABLE_WIDTH
    };

    let overlapped = tableList.some(table =>
      isOverlapped(
        rect, 
        table.bound //document.getElementById(`table_${table.name}`).getBoundingClientRect()
      )
    );

    if(!overlapped) break;
    x += 50;
    if(x + TABLE_WIDTH > PAGE_WIDTH) {
      x = 100;
      y += 50;
    }
  }
  table.position = {x, y};
  table.bound = {raw: true, ...rect};
}

export default function TableModal(){
  const store = useSliceStore('app');
  let [showTableModal, tableList, editingTable, editingTableError] = useSliceSelector('app', 
    ['showTableModal', 'tableList', 'editingTable', 'editingTableError']);

  tableList = tableList ?? [];
  editingTable = editingTable ?? {};
  editingTableError = editingTableError ?? {};
  
  let fields = editingTable.fields ?? [];
  
  function hide(){
    store.setState({
      showTableModal: false
    })
  }

  function saveTable(){
    let {tableList, editingTable} = store.getState();
    
    tableList = deepCopy(tableList ?? []);
    editingTable = deepCopy(editingTable ?? {});

    let editingTableError = validateTabledata(tableList, editingTable);
    
    if(hasError(editingTableError)) {
      store.setState({editingTableError});
      return;
    }

    tableList.forEach(table => {
      if(!table.isLinkThrough || table.from.tableName !== editingTable.lastName) return;
      let fromField = editingTable.fields.find(field => field.name === table.from.fieldName);
      if(table.from.tableName !== editingTable.name || !fromField || fromField.linkedTable !== table.to.tableName) {
        table.invalid = true;
      }
    });

    tableList = tableList.filter(table => !table.invalid);

    if(editingTable.index === undefined) {
      getNewPosition(tableList, editingTable);
      tableList.push(editingTable);
    }else{
      let index = editingTable.index;
      editingTable.index = null;
      tableList[index] = editingTable;
    }

    editingTable.fields.forEach(field => {
      if(field.type !== 'MANY_TO_MANY'){
        return;
      }
      if(!tableList.some(table => 
        table.isLinkThrough && 
        table.from.tableName === editingTable.name && 
        table.from.fieldName === field.name
      )) {
        let linkThroughTable = {
          isLinkThrough: true,
          name: editingTable.name + '_' + field.name,
          from: {
            tableName: editingTable.name,
            fieldName: field.name
          },
          to: {
            tableName: field.linkedTable
          },
          fields: [
            {
              name: 'id',
              type: 'BIGINT'
            },
            {
              name: editingTable.name,
              type: 'FOREIGN',
              linkedTable: editingTable.name,
            },
            {
              name: field.linkedTable,
              type: 'FOREIGN',
              linkedTable: field.linkedTable
            }
          ],
          position: {}
        };
        getNewPosition(tableList, linkThroughTable);
        tableList.push(linkThroughTable);
      }
    });

    store.setState({
      modified: true,
      tableList:tableList,
      showTableModal: false,
      editingTableError: {}
    });
  }

  function setTableData(data){
    let { editingTable } = store.getState();
    store.setState({
      editingTable: {...editingTable, ...data}
    });
  }

  function setField(index, data) {
    let { editingTable } = store.getState();
    let fields = (editingTable?.fields ?? []);
    let field = fields[index];

    if(data.name === 'id') {
      alert('"id" is primary key, please use a different name');
      data.name = '';
    }

    fields = [
      ...fields.slice(0, index),
      { ...field, ...data },
      ...fields.slice(index + 1),
    ];
    store.setState({
      editingTable: { ...editingTable, fields }
    });
  }

  function addField(index){
    let { editingTable } = store.getState();
    let fields = (editingTable?.fields ?? []);

    fields = [
      ...fields.slice(0, index),
      {
      },
      ...fields.slice(index),
    ];

    store.setState({
      editingTable: { ...editingTable, fields }
    });
  }

  function deleteField(index) {
    let { editingTable } = store.getState();
    let fields = (editingTable?.fields ?? []);

    fields = [
      ...fields.slice(0, index),
      ...fields.slice(index + 1),
    ];

    store.setState({
      editingTable: { ...editingTable, fields }
    });
  }

  return(
    <Modal size="xl" show={showTableModal} onHide={hide}>
      <Modal.Header closeButton>
        <Modal.Title>
          Table Structure
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="row">
          <div className="col-6">
            <label className="mb-1">Table Name:</label>
            <input className="form-control"
              value={editingTable.name ?? ''}
              onChange={e => setTableData({name: e.target.value})}
            />
            <ErrorTag err={editingTableError.name}/>
          </div>
          <div className="col-6">
            <label className="mb-1">Display Field:</label>
            <select className="form-control"
              value={editingTable.displayField ?? ''}
              onChange={e => setTableData({displayField: e.target.value})}
            >
              <option value="">----</option>
              {fields.map((field, index) => 
                <option value={field.name} key={index}>{field.name}</option>
              )}
            </select>
          </div>
        </div>
        <div className="row mt-3">
          <div className="col">
            <h5><u>Field List:</u></h5>
          </div>
        </div>
        <table className="table table-bordered">
          <thead>
            <tr>
              <th style={{width: "20%"}}>Field</th>
              <th style={{width: "30%"}}>Type</th>
              <th style={{width: "15%"}}>Default value</th>
              <th style={{width: "8%"}} className="text-center">Null</th>
              <th style={{width: "8%"}} className="text-center">Blank</th>
              <th style={{width: "8"}} className="text-center">Unique</th>
              <th style={{width: "10%"}}></th>
            </tr>
          </thead>
          <tbody>
            {fields.length === 0 &&
              <tr>
                <td colSpan="5">
                  No field added yet
                </td>
              </tr>
            }
            {fields.filter(f => f.name !== 'id').map((field, index) => 
              <tr key={index}>
                <td>
                  <input className="form-control"
                    value={field.name ?? ''}
                    onChange={e => setField(index+1, {name: e.target.value})}
                  />
                  <ErrorTag err={editingTableError?.fields?.[index+1]?.name}/>
                </td>
                <td>
                  <div className="d-flex">
                    <div className="me-1" style={{width: "50%"}}>
                      <select className="form-control"
                        value={field.type ?? ''}
                        onChange={e => setField(index+1, {type: e.target.value})}
                      >
                        <option value="">----</option>
                        <option value="INT">Integer</option>
                        <option value="BIGINT">Big Integer</option>
                        <option value="BOOL">Boolean</option>
                        <option value="FLOAT">Float</option>
                        <option value="VARCHAR">Varchar</option>
                        <option value="TEXT">Text</option>
                        <option value="DATE">Date</option>
                        <option value="DATETIME">DateTime</option>
                        <option value="FILE">File (url)</option>
                        <option value="IMAGE">Image (url)</option>
                        <option value="FOREIGN">Foreign</option>
                        <option value="MANY_TO_MANY">ManyToMany</option>
                      </select>
                      <ErrorTag err={editingTableError?.fields?.[index+1]?.type}/>
                    </div>
                    <div className="ms-1" style={{width: "50%"}}>
                      {field.type === "VARCHAR" &&
                        <>
                          <input className="form-control" type="number" placeholder="Max length"
                            value={field.maxLength ?? ''}
                            onChange={e => setField(index+1, {maxLength: e.target.value})}
                          />
                          <ErrorTag err={editingTableError?.fields?.[index+1]?.maxLength}/>
                        </>
                      }
                      {(field.type === "FOREIGN" || field.type === "MANY_TO_MANY") &&
                        <>
                          <select className="form-control"
                            value={field.linkedTable ?? ''}
                            onChange={e => setField(index+1, {linkedTable: e.target.value})}
                          >
                            <option value="">--Linked table--</option>
                            {tableList.filter((table,index) => 
                              !table.isLinkThrough && (
                                index !== editingTable.index || 
                                field.type === 'FOREIGN'
                              )
                            ).map(table => 
                              <option value={table.name} key={table.name}>{table.name}</option>
                            )}
                          </select>
                          <ErrorTag err={editingTableError?.fields?.[index+1]?.linkedTable}/>
                        </>
                      }
                      {(field.type === "FILE" || field.type === 'IMAGE') &&
                        <>
                          <input className="form-control" placeholder="Upload to"
                            value={field.uploadTo ?? ''}
                            onChange={e => setField(index+1, {uploadTo: e.target.value})}
                          />
                          <ErrorTag err={editingTableError?.fields?.[index+1]?.uploadTo}/>
                        </>
                      }
                    </div>
                  </div>
                </td>
               
                <td>
                  <input className="form-control"
                    value={field.defaultValue}
                    onChange={e => setField(index+1, {defaultValue: e.target.value})}
                  />
                  <ErrorTag err={editingTableError?.fields?.[index+1]?.defaultValue}/>
                </td>

                <td className="text-center">
                  <input type="checkbox" className="form-check-input"
                    checked={field.null ?? false}
                    onChange={e => setField(index+1, {null: e.target.checked})}
                  />
                </td>
                <td className="text-center">
                  <input type="checkbox" className="form-check-input"
                    checked={field.blank ?? false} 
                    onChange={e => setField(index+1, {blank: e.target.checked})}
                  />
                </td>
                <td className="text-center">
                  <input type="checkbox" className="form-check-input"
                    checked={field.unique ?? false}
                    onChange={e => setField(index+1, {unique: e.target.checked})}
                  />
                </td>
                <td className="text-center">
                  <button className="btn btn-sm btn-primary" onClick={() => addField(index+1)}>
                    <i className="fas fa-plus"></i>
                  </button>
                  {" "}
                  <button className="btn btn-sm btn-danger" onClick={() => deleteField(index+1)}>
                    <i className="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <button className="btn btn-sm btn-primary" onClick={() => addField(fields.length)}>
          <i className="fas fa-plus"></i>
        </button>
      </Modal.Body>
      <Modal.Footer>
        <button className="btn btn-primary" onClick={saveTable}>
          Save
        </button>
      </Modal.Footer>
    </Modal>
  )
}